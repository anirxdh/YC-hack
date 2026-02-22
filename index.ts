import { MCPServer, object, text, error, widget, completable, oauthWorkOSProvider } from "mcp-use/server";
import { MCPClient } from "mcp-use";
import { z } from "zod";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

// ============================================
// Contacts Store (JSON key-value)
// ============================================
const CONTACTS_PATH = resolve(process.cwd(), "contacts.json");

function loadContacts(): Record<string, string> {
  try {
    if (existsSync(CONTACTS_PATH)) {
      return JSON.parse(readFileSync(CONTACTS_PATH, "utf-8"));
    }
  } catch {}
  return {};
}

function saveContacts(contacts: Record<string, string>) {
  writeFileSync(CONTACTS_PATH, JSON.stringify(contacts, null, 2), "utf-8");
}

function resolvePhoneNumber(nameOrNumber: string): { name: string | null; phone: string } | null {
  // If it looks like a phone number already, return as-is
  if (nameOrNumber.startsWith("+") || /^\d{10,}$/.test(nameOrNumber)) {
    return { name: null, phone: nameOrNumber };
  }
  // Otherwise look up in contacts (case-insensitive)
  const contacts = loadContacts();
  const key = Object.keys(contacts).find(
    (k) => k.toLowerCase() === nameOrNumber.toLowerCase()
  );
  if (key) {
    return { name: key, phone: contacts[key] };
  }
  return null;
}

// ============================================
// Server Setup
// ============================================
const server = new MCPServer({
  name: "mcp-orchestrator",
  title: "MCP Orchestrator",
  version: "1.0.0",
  description:
    "A custom MCP orchestrator that aggregates multiple MCP servers into one unified gateway",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  oauth: oauthWorkOSProvider(),
  favicon: "favicon.ico",
  websiteUrl: "https://mcp-use.com",
  icons: [
    {
      src: "icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["512x512"],
    },
  ],
});

// ============================================
// Orchestrator: Connect to backend MCP servers
// ============================================

// Track connected backends for the status resource
const connectedBackends: { name: string; toolCount: number }[] = [];

/**
 * Convert a JSON Schema property to a Zod type.
 * Handles string, number, integer, boolean, array, enum.
 * Falls back to z.any() for complex/unknown types.
 */
function jsonSchemaPropertyToZod(prop: any): z.ZodType {
  if (!prop) return z.any();

  // Handle enums
  if (prop.enum && Array.isArray(prop.enum) && prop.enum.length > 0) {
    return z.enum(prop.enum as [string, ...string[]]);
  }

  switch (prop.type) {
    case "string":
      return z.string();
    case "number":
    case "integer":
      return z.number();
    case "boolean":
      return z.boolean();
    case "array":
      return z.array(z.any());
    case "object":
      // Nested object — don't recurse deeply, just accept any object
      return z.record(z.string(), z.any());
    default:
      return z.any();
  }
}

/**
 * Convert a full JSON Schema (tool inputSchema) to a Zod object schema.
 * Preserves property descriptions and required/optional status.
 */
function jsonSchemaToZod(inputSchema: any): z.ZodObject<any> {
  if (!inputSchema || !inputSchema.properties) {
    return z.object({});
  }

  const shape: Record<string, z.ZodType> = {};
  const required: string[] = inputSchema.required || [];

  for (const [key, prop] of Object.entries(inputSchema.properties as Record<string, any>)) {
    let field = jsonSchemaPropertyToZod(prop);

    // Add description if present
    if (prop.description) {
      field = field.describe(prop.description);
    }

    // Mark optional if not in required array
    if (!required.includes(key)) {
      field = field.optional();
    }

    shape[key] = field;
  }

  return z.object(shape);
}

/**
 * Convert a backend CallToolResult into an mcp-use server response.
 */
function formatBackendResult(result: any) {
  if (result.isError) {
    const msg = result.content?.[0]?.text || "Tool execution failed";
    return error(msg);
  }

  const textParts = result.content
    ?.filter((c: any) => c.type === "text")
    .map((c: any) => c.text);

  if (textParts && textParts.length > 0) {
    const combined = textParts.join("\n");
    // Try parsing as JSON for structured responses
    try {
      return object(JSON.parse(combined));
    } catch {
      return text(combined);
    }
  }

  return text("Tool executed successfully (no output)");
}

/**
 * Replace ${ENV_VAR} patterns in config with actual env values.
 * Keeps secrets out of mcp-servers.json.
 */
function interpolateEnvVars(obj: any): any {
  if (typeof obj === "string") {
    return obj.replace(/\$\{(\w+)\}/g, (_, key) => process.env[key] || "");
  }
  if (Array.isArray(obj)) return obj.map(interpolateEnvVars);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, interpolateEnvVars(v)])
    );
  }
  return obj;
}

/**
 * Load mcp-servers.json, connect to each backend, discover tools,
 * and register them on our server with namespaced names.
 */
async function connectBackendServers() {
  const configPath = resolve(process.cwd(), "mcp-servers.json");

  if (!existsSync(configPath)) {
    console.log("[orchestrator] No mcp-servers.json found — skipping backend connections");
    return;
  }

  const configRaw = readFileSync(configPath, "utf-8");
  const config = interpolateEnvVars(JSON.parse(configRaw));

  // Check if there are any servers configured
  const serverNames = Object.keys(config.mcpServers || {});
  if (serverNames.length === 0) {
    console.log("[orchestrator] mcp-servers.json is empty — no backend servers to connect");
    return;
  }

  console.log(`[orchestrator] Connecting to ${serverNames.length} backend server(s): ${serverNames.join(", ")}`);

  const client = MCPClient.fromDict(config);

  for (const serverName of serverNames) {
    try {
      console.log(`[orchestrator] Connecting to "${serverName}"...`);
      const session = await client.createSession(serverName);
      const tools = await session.listTools();

      console.log(`[orchestrator] "${serverName}" has ${tools.length} tool(s): ${tools.map(t => t.name).join(", ")}`);

      // Register each backend tool on our server with a namespace prefix
      for (const tool of tools) {
        const namespacedName = `${serverName}__${tool.name}`;

        server.tool(
          {
            name: namespacedName,
            description: `[${serverName}] ${tool.description || tool.name}`,
            schema: jsonSchemaToZod(tool.inputSchema),
          },
          async (args: any) => {
            try {
              const result = await session.callTool(tool.name, args);
              return formatBackendResult(result);
            } catch (err: any) {
              return error(`Failed to call ${serverName}/${tool.name}: ${err.message}`);
            }
          }
        );
      }

      connectedBackends.push({ name: serverName, toolCount: tools.length });
      console.log(`[orchestrator] ✓ "${serverName}" registered (${tools.length} tools)`);
    } catch (err: any) {
      // Don't crash if one backend fails — log and continue
      console.error(`[orchestrator] ✗ Failed to connect to "${serverName}": ${err.message}`);
    }
  }

  const totalTools = connectedBackends.reduce((sum, b) => sum + b.toolCount, 0);
  console.log(`[orchestrator] Done. ${connectedBackends.length}/${serverNames.length} backends connected, ${totalTools} tools registered.`);
}

// ============================================
// Local Tool 1: Add a contact
// ============================================
server.tool(
  {
    name: "add-contact",
    description: "Save a contact with a name and phone number. Use this to store contacts so you can call or text them by name later.",
    schema: z.object({
      name: z.string().describe("The contact's name (e.g. 'Anirudh')"),
      phone: z.string().describe("The contact's phone number with country code (e.g. '+19525551234')"),
    }),
  },
  async ({ name, phone }) => {
    const contacts = loadContacts();
    contacts[name] = phone;
    saveContacts(contacts);
    return object({ saved: true, name, phone, totalContacts: Object.keys(contacts).length });
  }
);

// ============================================
// Local Tool 2: List all contacts
// ============================================
server.tool(
  {
    name: "list-contacts",
    description: "List all saved contacts. Returns all names and phone numbers.",
    schema: z.object({}),
    readOnlyHint: true,
  },
  async () => {
    const contacts = loadContacts();
    const entries = Object.entries(contacts);
    if (entries.length === 0) {
      return text("No contacts saved yet. Use add-contact to save some.");
    }
    return object({
      totalContacts: entries.length,
      contacts: Object.fromEntries(entries),
    });
  }
);

// ============================================
// Local Tool 3: Remove a contact
// ============================================
server.tool(
  {
    name: "remove-contact",
    description: "Remove a contact by name.",
    schema: z.object({
      name: z.string().describe("The name of the contact to remove"),
    }),
  },
  async ({ name }) => {
    const contacts = loadContacts();
    const key = Object.keys(contacts).find(
      (k) => k.toLowerCase() === name.toLowerCase()
    );
    if (!key) {
      return error(`Contact "${name}" not found. Use list-contacts to see all contacts.`);
    }
    delete contacts[key];
    saveContacts(contacts);
    return object({ removed: true, name: key, totalContacts: Object.keys(contacts).length });
  }
);

// ============================================
// Local Tool: Wake up Lark — shows the full UI
// ============================================
server.tool(
  {
    name: "wake-up-lark",
    description: "Wake up the Lark AI communication suite. Shows a full phone-like interface where the user can make calls, open camera, send messages, play music, and more — all from the UI. Use this when the user says 'wake up lark', 'open lark', 'start lark', or wants to use the Lark interface.",
    schema: z.object({
      greeting: z.string().optional().describe("Optional greeting message to show the user"),
    }),
    widget: {
      name: "lark",
      invoking: "Waking up Lark...",
      invoked: "Lark is ready",
    },
  },
  async ({ greeting }) => {
    return widget({
      props: {
        status: "active",
        greeting: greeting || "Lark is awake!",
      },
      output: text("Lark is awake! The user can now use the phone interface to make calls, open camera, send messages, and more. The interface is interactive — the user can click icons directly to use tools."),
    });
  }
);

// ============================================
// Local Tool 4: Make a phone call via Twilio
// Accepts a phone number OR a contact name
// ============================================
server.tool(
  {
    name: "make-call",
    description: "Make a phone call to someone using Twilio. You can pass a phone number OR a contact name (e.g. 'Anirudh'). The call will play a spoken message to the person.",
    schema: z.object({
      to: z.string().describe("Phone number (e.g. +19525551234) OR contact name (e.g. 'Anirudh')"),
      message: z.string().describe("The message to speak to the person when they pick up"),
    }),
    widget: {
      name: "make-call",
      invoking: "Placing call...",
      invoked: "Call placed",
    },
  },
  async ({ to, message }) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return error("Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env");
    }

    // Resolve contact name to phone number
    const resolved = resolvePhoneNumber(to);
    if (!resolved) {
      return error(`Contact "${to}" not found. Use add-contact to save them first, or provide a phone number directly.`);
    }
    const phoneNumber = resolved.phone;
    const contactLabel = resolved.name ? `${resolved.name} (${resolved.phone})` : resolved.phone;

    const twiml = `<Response><Say voice="alice">${message}</Say></Response>`;

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: fromNumber,
          Twiml: twiml,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return error(`Twilio call failed: ${err}`);
    }

    const call = await res.json();
    return widget({
      props: {
        status: "Call initiated",
        callSid: call.sid,
        to: contactLabel,
        from: call.from,
        message,
      },
      output: text(`Call initiated to ${contactLabel} from ${call.from}. Call SID: ${call.sid}`),
    });
  }
);

// ============================================
// Local Tool 7: Open camera for photo capture
// ============================================
server.tool(
  {
    name: "open-camera",
    description: "Open the user's camera to capture a photo. Works on desktop (webcam) and mobile (front/rear camera). Use this when the user wants to take a photo, scan something, or show something via their camera.",
    schema: z.object({
      camera: z
        .enum(["front", "rear"])
        .optional()
        .describe("Which camera to use: 'front' for selfie camera, 'rear' for back camera. Defaults to front."),
      reason: z
        .string()
        .optional()
        .describe("Brief reason for opening the camera, shown to the user (e.g. 'Take a profile photo')"),
    }),
    widget: {
      name: "open-camera",
      invoking: "Activating camera...",
      invoked: "Camera ready",
    },
  },
  async ({ camera, reason }) => {
    const selectedCamera = camera || "front";
    const displayReason = reason || "Photo capture";

    return widget({
      props: {
        status: "Camera activated",
        camera: selectedCamera,
        reason: displayReason,
      },
      output: text(`Camera opened (${selectedCamera} facing). ${displayReason}`),
    });
  }
);

// ============================================
// Local Tool 8: Group call — call multiple people simultaneously
// ============================================
server.tool(
  {
    name: "group-call",
    description: "Call multiple people at the same time with the same message. Pass contact names or phone numbers. All calls are placed simultaneously via Twilio. Example: 'Call Anirudh, Raj, and Priya and say I'm running late'.",
    schema: z.object({
      to: z.array(z.string()).describe("List of phone numbers or contact names to call (e.g. ['Anirudh', 'Raj', '+19525551234'])"),
      message: z.string().describe("The message to speak to everyone when they pick up"),
    }),
  },
  async ({ to, message }) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return error("Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env");
    }

    // Resolve all contacts first
    const resolved: { label: string; phone: string }[] = [];
    const notFound: string[] = [];

    for (const entry of to) {
      const result = resolvePhoneNumber(entry);
      if (result) {
        resolved.push({
          label: result.name ? `${result.name} (${result.phone})` : result.phone,
          phone: result.phone,
        });
      } else {
        notFound.push(entry);
      }
    }

    if (notFound.length > 0) {
      return error(`Could not find contacts: ${notFound.join(", ")}. Use add-contact to save them first.`);
    }

    const twiml = `<Response><Say voice="alice">${message}</Say></Response>`;
    const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    // Fire all calls simultaneously
    const results = await Promise.allSettled(
      resolved.map(async (contact) => {
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
          {
            method: "POST",
            headers: {
              Authorization: authHeader,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: contact.phone,
              From: fromNumber,
              Twiml: twiml,
            }),
          }
        );
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`${contact.label}: ${errText}`);
        }
        const call = await res.json();
        return { label: contact.label, callSid: call.sid, status: "initiated" };
      })
    );

    const succeeded: { label: string; callSid: string }[] = [];
    const failed: { label: string; error: string }[] = [];

    for (const r of results) {
      if (r.status === "fulfilled") {
        succeeded.push(r.value);
      } else {
        failed.push({ label: "unknown", error: r.reason?.message || "Unknown error" });
      }
    }

    const summary = [
      `Group call to ${resolved.length} people: "${message}"`,
      `Succeeded: ${succeeded.length}/${resolved.length}`,
      ...succeeded.map((s) => `  ✓ ${s.label} — SID: ${s.callSid}`),
      ...failed.map((f) => `  ✗ ${f.label} — ${f.error}`),
    ].join("\n");

    return object({
      message,
      totalCalls: resolved.length,
      succeeded: succeeded.length,
      failed: failed.length,
      calls: succeeded,
      errors: failed.length > 0 ? failed : undefined,
      summary,
    });
  }
);

// ============================================
// Music: Audius + Deezer search helpers
// ============================================

interface AudiusTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  artworkUrl: string;
}

async function searchAudius(query: string): Promise<AudiusTrack[]> {
  try {
    const res = await fetch(
      `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&limit=5`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    if (!data.data) return [];
    return data.data
      .filter((t: any) => t.id && t.duration > 0)
      .map((t: any) => ({
        id: t.id,
        title: t.title || "Unknown",
        artist: t.user?.name || "",
        duration: t.duration,
        artworkUrl: t.artwork?.["480x480"] || t.artwork?.["150x150"] || "",
      }));
  } catch {
    return [];
  }
}

interface DeezerTrack {
  title: string;
  artist: string;
  album: string;
  previewUrl: string;
  coverUrl: string;
  duration: number;
}

async function searchDeezer(query: string): Promise<DeezerTrack[]> {
  try {
    const res = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=5`,
      { signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json();
    if (!data.data) return [];
    return data.data.map((t: any) => ({
      title: t.title,
      artist: t.artist?.name || "",
      album: t.album?.title || "",
      previewUrl: t.preview,
      coverUrl: t.album?.cover_big || t.album?.cover_medium || "",
      duration: t.duration,
    }));
  } catch {
    return [];
  }
}

// ============================================
// Music: Audio stream proxy (Audius → same-origin)
// ============================================

server.get("/stream/:trackId", async (c) => {
  const trackId = c.req.param("trackId");
  const streamUrl = `https://api.audius.co/v1/tracks/${trackId}/stream`;

  const reqHeaders: Record<string, string> = { "User-Agent": "LarkMCP/1.0" };
  const range = c.req.header("Range");
  if (range) reqHeaders["Range"] = range;

  try {
    const audioRes = await fetch(streamUrl, { headers: reqHeaders, redirect: "follow" });
    if (!audioRes.ok && audioRes.status !== 206) {
      return c.text("Stream not available", 404);
    }
    const respHeaders: Record<string, string> = {
      "Content-Type": audioRes.headers.get("Content-Type") || "audio/mpeg",
      "Access-Control-Allow-Origin": "*",
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=600",
    };
    const cl = audioRes.headers.get("Content-Length");
    if (cl) respHeaders["Content-Length"] = cl;
    const cr = audioRes.headers.get("Content-Range");
    if (cr) respHeaders["Content-Range"] = cr;

    return new Response(audioRes.body, { status: audioRes.status, headers: respHeaders });
  } catch {
    return c.text("Stream error", 502);
  }
});

// ============================================
// Music: Cover image proxy (same-origin for CSP)
// ============================================

server.get("/cover", async (c) => {
  const url = c.req.query("url");
  if (!url) return c.text("Missing url", 400);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return c.text("Not found", 404);
    return new Response(res.body, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return c.text("Failed", 502);
  }
});

// ============================================
// Local Tool: Music play — search + return structured data
// ============================================
server.tool(
  {
    name: "music-play",
    description:
      "Search and play a song by name. Returns structured track data (title, artist, album art, stream URL) for inline playback in the Lark widget.",
    schema: z.object({
      query: z.string().describe("Song name, artist, or keywords"),
    }),
  },
  async ({ query }) => {
    const [audiusResults, deezerResults] = await Promise.all([
      searchAudius(query),
      searchDeezer(query),
    ]);

    const audius = audiusResults[0];
    const deezer = deezerResults[0];

    if (!audius && !deezer) {
      return error(`No results found for "${query}"`);
    }

    return object({
      title: deezer?.title || audius?.title || query,
      artist: deezer?.artist || audius?.artist || "",
      album: deezer?.album || "",
      coverUrl: deezer?.coverUrl || audius?.artworkUrl || "",
      audiusTrackId: audius?.id || "",
      previewUrl: deezer?.previewUrl || "",
      duration: audius?.duration || deezer?.duration || 0,
      isFullTrack: !!audius,
    });
  }
);

// ============================================
// Local Tool: Music search — return structured results list
// ============================================
server.tool(
  {
    name: "music-search",
    description:
      "Search for songs across Audius and Deezer. Returns a list of results with title, artist, and source.",
    schema: z.object({
      query: z.string().describe("Song name, artist, or keywords"),
    }),
  },
  async ({ query }) => {
    const [audiusResults, deezerResults] = await Promise.all([
      searchAudius(query),
      searchDeezer(query),
    ]);

    if (audiusResults.length === 0 && deezerResults.length === 0) {
      return error(`No results found for "${query}"`);
    }

    const fmt = (s: number) =>
      Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");

    return object({
      results: [
        ...audiusResults.slice(0, 3).map((r) => ({
          title: r.title,
          artist: r.artist,
          duration: fmt(r.duration),
          source: "audius",
          fullTrack: true,
        })),
        ...deezerResults.slice(0, 3).map((r) => ({
          title: r.title,
          artist: r.artist,
          album: r.album,
          duration: fmt(r.duration),
          source: "deezer",
          fullTrack: false,
        })),
      ],
    });
  }
);

// ============================================
// Resource: Server config and status (dynamic)
// ============================================
server.resource(
  {
    name: "config",
    uri: "config://settings",
    title: "Server Configuration",
    description: "Current server configuration and status",
    mimeType: "application/json",
  },
  async () =>
    object({
      name: "MCP Orchestrator",
      version: "1.0.0",
      status: "running",
      connectedServers: connectedBackends.length,
      backends: connectedBackends,
    })
);

// ============================================
// Prompt: Code review
// ============================================
server.prompt(
  {
    name: "review-code",
    description: "Review code for best practices and potential issues",
    schema: z.object({
      language: completable(z.string(), [
        "python",
        "javascript",
        "typescript",
        "java",
        "go",
        "rust",
      ]).describe("The programming language of the code"),
      code: z.string().describe("The code snippet to review"),
    }),
  },
  async ({ language, code }) => {
    return text(
      `Please review the following ${language} code for best practices, potential bugs, and improvements:\n\n\`\`\`${language}\n${code}\n\`\`\``
    );
  }
);

// ============================================
// Start: Connect backends, then listen
// ============================================
await connectBackendServers();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
server.listen(PORT);
