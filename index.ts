import { MCPServer, object, text, error, widget, completable, oauthWorkOSProvider } from "mcp-use/server";
import { MCPClient } from "mcp-use";
import { z } from "zod";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

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
// Local Tool 1: Make a phone call via Twilio
// ============================================
server.tool(
  {
    name: "make-call",
    description: "Make a phone call to someone using Twilio. The call will play a spoken message to the person.",
    schema: z.object({
      to: z.string().describe("The phone number to call (e.g. +19525551234)"),
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
          To: to,
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
        to: call.to,
        from: call.from,
        message,
      },
      output: text(`Call initiated to ${call.to} from ${call.from}. Call SID: ${call.sid}`),
    });
  }
);

// ============================================
// Local Tool 2: Send SMS via Twilio
// ============================================
server.tool(
  {
    name: "send-sms",
    description: "Send an SMS text message to someone using Twilio",
    schema: z.object({
      to: z.string().describe("The phone number to send the SMS to (e.g. +19525551234)"),
      message: z.string().describe("The text message to send"),
    }),
    widget: {
      name: "send-sms",
      invoking: "Sending message...",
      invoked: "Message sent",
    },
  },
  async ({ to, message }) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return error("Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env");
    }

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return error(`Twilio SMS failed: ${err}`);
    }

    const sms = await res.json();
    return widget({
      props: {
        status: "SMS sent",
        messageSid: sms.sid,
        to: sms.to,
        from: sms.from,
        body: message,
      },
      output: text(`SMS sent to ${sms.to} from ${sms.from}. Message SID: ${sms.sid}`),
    });
  }
);

// ============================================
// Local Tool 3: Open camera for photo capture
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
