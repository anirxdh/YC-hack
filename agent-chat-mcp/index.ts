import { MCPServer, text, object, widget } from "mcp-use/server";
import { z } from "zod";
import { createUIResource } from "@mcp-ui/server";

// ── MCP-UI HTML Builders ──

function escapeHTML(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function avatarColor(name: string) {
  const colors = ["#a855f7","#3b82f6","#10b981","#f59e0b","#ef4444","#ec4899","#6366f1","#14b8a6"];
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}

function buildInboxHTML(agentName: string, msgs: Message[]) {
  const rows = msgs.map(m => {
    const isMine = m.from.toLowerCase() === agentName.toLowerCase();
    const col = avatarColor(m.from);
    const letter = m.from.charAt(0).toUpperCase();
    const align = isMine ? "flex-end" : "flex-start";
    const bg = isMine ? "#3b82f6" : "#1a1a2e";
    const radius = isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px";
    return `<div style="display:flex;align-items:flex-end;gap:8px;flex-direction:${isMine?"row-reverse":"row"}">
      ${!isMine?`<div style="width:28px;height:28px;border-radius:50%;background:${col};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0">${letter}</div>`:""}
      <div style="max-width:75%;padding:10px 14px;border-radius:${radius};background:${bg}">
        ${!isMine?`<span style="font-size:11px;font-weight:600;color:#888;display:block;margin-bottom:2px">${escapeHTML(m.from)}</span>`:""}
        <p style="font-size:14px;margin:0;line-height:1.4;word-break:break-word">${escapeHTML(m.content)}</p>
        <span style="font-size:10px;color:rgba(255,255,255,0.4);display:block;margin-top:4px;text-align:right">${new Date(m.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',system-ui,sans-serif;background:#0a0a0a;color:#fff;padding:0}</style></head><body>
<div style="max-width:480px;margin:0 auto">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06)">
    <h2 style="font-size:16px;font-weight:700">Inbox</h2>
    <span style="font-size:11px;color:#555">Logged in as <strong>${escapeHTML(agentName)}</strong></span>
  </div>
  ${msgs.length === 0
    ? `<div style="text-align:center;padding:40px 20px;color:#555"><p style="font-size:14px;font-weight:600">No messages yet</p><p style="font-size:12px;margin-top:4px;color:#444">Send a message to get started!</p></div>`
    : `<div style="padding:12px 16px;display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto">${rows}</div>`
  }
</div></body></html>`;
}

function buildAgentsHTML(agentList: Agent[]) {
  const rows = agentList.map(a => {
    const col = avatarColor(a.name);
    const letter = a.name.charAt(0).toUpperCase();
    const p = a.profile;
    const skillBadges = p.skills.slice(0, 3).map(s =>
      `<span style="display:inline-block;padding:1px 6px;border-radius:8px;background:rgba(139,92,246,0.1);color:#a78bfa;font-size:10px;font-weight:600">${escapeHTML(s)}</span>`
    ).join(" ");
    return `<div style="display:flex;align-items:center;gap:12px;padding:12px 8px;border-bottom:1px solid rgba(255,255,255,0.04)">
      <div style="width:42px;height:42px;border-radius:50%;background:${col};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff;flex-shrink:0">${letter}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px"><span style="font-size:14px;font-weight:600">${escapeHTML(a.name)}</span>${p.role ? `<span style="font-size:11px;color:#888">· ${escapeHTML(p.role)}</span>` : ""}</div>
        ${a.description ? `<p style="font-size:12px;color:#666;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHTML(a.description)}</p>` : ""}
        ${skillBadges ? `<div style="display:flex;gap:4px;margin-top:4px">${skillBadges}</div>` : ""}
      </div>
      <div style="width:8px;height:8px;border-radius:50%;background:#10b981;flex-shrink:0"></div>
    </div>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',system-ui,sans-serif;background:#0a0a0a;color:#fff;padding:0}</style></head><body>
<div style="max-width:480px;margin:0 auto">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06)">
    <h2 style="font-size:16px;font-weight:700">Agents Online</h2>
    <span style="background:#3b82f6;color:#fff;font-size:11px;font-weight:600;padding:2px 10px;border-radius:12px">${agentList.length}</span>
  </div>
  <div style="padding:8px 12px 12px">${rows}</div>
</div></body></html>`;
}

function buildProfileHTML(agent: Agent) {
  const p = agent.profile;
  const col = avatarColor(agent.name);
  const letter = agent.name.charAt(0).toUpperCase();
  const skillTags = p.skills.length > 0 ? p.skills.map(s =>
    `<span style="display:inline-block;padding:3px 10px;border-radius:20px;background:rgba(139,92,246,0.12);color:#a78bfa;font-size:11px;font-weight:600;letter-spacing:0.02em">${escapeHTML(s)}</span>`
  ).join(" ") : "";

  const rows: string[] = [];
  if (p.role) rows.push(`<div style="display:flex;align-items:center;gap:8px;padding:6px 0"><span style="color:#666;font-size:12px;min-width:60px">Role</span><span style="font-size:13px;font-weight:600">${escapeHTML(p.role)}</span></div>`);
  if (p.company) rows.push(`<div style="display:flex;align-items:center;gap:8px;padding:6px 0"><span style="color:#666;font-size:12px;min-width:60px">Company</span><span style="font-size:13px;font-weight:500">${escapeHTML(p.company)}</span></div>`);
  if (p.location) rows.push(`<div style="display:flex;align-items:center;gap:8px;padding:6px 0"><span style="color:#666;font-size:12px;min-width:60px">Location</span><span style="font-size:13px;font-weight:500">${escapeHTML(p.location)}</span></div>`);
  if (p.website) rows.push(`<div style="display:flex;align-items:center;gap:8px;padding:6px 0"><span style="color:#666;font-size:12px;min-width:60px">Website</span><a href="${escapeHTML(p.website)}" target="_blank" style="font-size:13px;color:#3b82f6;text-decoration:none;font-weight:500">${escapeHTML(p.website)}</a></div>`);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',system-ui,sans-serif;background:#0a0a0a;color:#fff;padding:0}</style></head><body>
<div style="max-width:480px;margin:0 auto;padding:20px">
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
    <div style="width:56px;height:56px;border-radius:50%;background:${col};display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;flex-shrink:0;box-shadow:0 4px 16px rgba(0,0,0,0.3)">${letter}</div>
    <div>
      <h2 style="font-size:18px;font-weight:700;letter-spacing:-0.01em">${escapeHTML(agent.name)}</h2>
      ${p.role ? `<p style="font-size:13px;color:#888;margin-top:2px">${escapeHTML(p.role)}</p>` : ""}
    </div>
  </div>
  ${agent.description ? `<p style="font-size:14px;color:#ccc;line-height:1.5;margin-bottom:16px">${escapeHTML(agent.description)}</p>` : ""}
  ${rows.length > 0 ? `<div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;margin-bottom:16px">${rows.join("")}</div>` : ""}
  ${skillTags ? `<div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;margin-bottom:16px"><p style="font-size:11px;color:#666;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Skills</p><div style="display:flex;flex-wrap:wrap;gap:6px">${skillTags}</div></div>` : ""}
  ${p.recommendedResource ? `<div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px"><p style="font-size:11px;color:#666;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Recommended Resource</p><div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.15);border-radius:10px;padding:10px 14px"><p style="font-size:13px;color:#93c5fd;line-height:1.4">⭐ ${escapeHTML(p.recommendedResource)}</p></div></div>` : ""}
  <p style="font-size:10px;color:#444;margin-top:16px;text-align:center">Joined ${new Date(agent.joinedAt).toLocaleDateString()} · Last seen ${new Date(agent.lastSeen).toLocaleTimeString()}</p>
</div></body></html>`;
}

function buildNotifHTML(agentName: string, notifs: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',system-ui,sans-serif;background:#0a0a0a;color:#fff;padding:0}</style></head><body>
<div style="max-width:480px;margin:0 auto;padding:16px 20px;display:flex;align-items:center;gap:14px">
  <span style="font-size:28px">🔔</span>
  <div><p style="font-size:14px;font-weight:700">Notifications for ${escapeHTML(agentName)}</p><p style="font-size:13px;color:#aaa;margin-top:2px;white-space:pre-line">${escapeHTML(notifs)}</p></div>
</div></body></html>`;
}

const server = new MCPServer({
  name: "agent-chat-mcp",
  title: "Agent Chat",
  version: "1.0.0",
  description: "MCP server for agent-to-agent messaging. Agents can register, send messages to each other, and read their inbox. IMPORTANT: After any action, always check your unread-count to see if you have new messages. If you do, read them immediately and tell the user.",
  baseUrl: process.env.MCP_URL || "http://localhost:4000",
});

// ── In-memory store ──

interface Message {
  id: number;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface AgentProfile {
  role: string;
  recommendedResource: string;
  skills: string[];
  company: string;
  website: string;
  location: string;
}

interface Agent {
  name: string;
  description: string;
  profile: AgentProfile;
  joinedAt: string;
  lastSeen: string;
}

interface Notification {
  agentName: string;
  message: string;
  timestamp: string;
}

const agents = new Map<string, Agent>();
const messages: Message[] = [];
const notifications: Notification[] = [];
let messageIdCounter = 1;

// ── Tools ──

server.tool(
  {
    name: "register",
    description:
      "Register yourself as an agent on the chat network with a professional profile. Must be called before sending or reading messages.",
    schema: z.object({
      name: z.string().min(1).max(30).describe("Your unique agent name (e.g. 'rashm-agent' or 'alex-bot')"),
      description: z.string().max(200).optional().describe("A short bio for your agent"),
      role: z.string().max(100).optional().describe("Professional role (e.g. 'Full-Stack Engineer', 'Product Designer', 'AI Researcher')"),
      recommended_resource: z.string().max(300).optional().describe("A resource you highly recommend — a book, tool, link, course, or anything (e.g. 'Designing Data-Intensive Applications by Martin Kleppmann')"),
      skills: z.array(z.string()).max(10).optional().describe("List of skills or interests (e.g. ['TypeScript', 'MCP', 'React'])"),
      company: z.string().max(100).optional().describe("Company or organization name"),
      website: z.string().max(200).optional().describe("Personal website or portfolio URL"),
      location: z.string().max(100).optional().describe("Location (e.g. 'San Francisco, CA')"),
    }),
  },
  async ({ name, description, role, recommended_resource, skills, company, website, location }) => {
    const key = name.toLowerCase();
    const profile: AgentProfile = {
      role: role || "",
      recommendedResource: recommended_resource || "",
      skills: skills || [],
      company: company || "",
      website: website || "",
      location: location || "",
    };

    if (agents.has(key)) {
      const existing = agents.get(key)!;
      existing.lastSeen = new Date().toISOString();
      existing.profile = { ...existing.profile, ...Object.fromEntries(Object.entries(profile).filter(([, v]) => v && (Array.isArray(v) ? v.length > 0 : true))) };
      if (description) existing.description = description;
      return text(`Welcome back, ${name}! Your profile has been updated.`);
    }

    agents.set(key, {
      name,
      description: description || "",
      profile,
      joinedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    });

    for (const [existingKey] of agents) {
      if (existingKey !== key) {
        notifications.push({
          agentName: existingKey,
          message: `Agent "${name}"${role ? ` (${role})` : ""} just joined the network!`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return text(`Agent "${name}" registered successfully with profile! You can now send and receive messages.`);
  }
);

server.tool(
  {
    name: "send-message",
    description:
      "Send a message to another agent on the network. The recipient must also be registered. They will see your message next time they check their inbox.",
    schema: z.object({
      from: z.string().describe("Your agent name (must be registered)"),
      to: z.string().describe("The recipient agent name"),
      message: z.string().min(1).max(2000).describe("The message content"),
    }),
  },
  async ({ from, to, message }) => {
    const fromKey = from.toLowerCase();
    const toKey = to.toLowerCase();

    if (!agents.has(fromKey)) {
      return text(`Error: You ("${from}") are not registered. Call "register" first.`);
    }
    if (!agents.has(toKey)) {
      const available = [...agents.keys()].join(", ") || "(none yet)";
      return text(`Error: Agent "${to}" is not registered. Available agents: ${available}`);
    }

    agents.get(fromKey)!.lastSeen = new Date().toISOString();

    const msg: Message = {
      id: messageIdCounter++,
      from: agents.get(fromKey)!.name,
      to: agents.get(toKey)!.name,
      content: message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    messages.push(msg);

    notifications.push({
      agentName: toKey,
      message: `New message from ${msg.from}: "${message.substring(0, 50)}${message.length > 50 ? "..." : ""}"`,
      timestamp: msg.timestamp,
    });

    const recentWithRecipient = messages
      .filter((m) =>
        (m.from.toLowerCase() === fromKey && m.to.toLowerCase() === toKey) ||
        (m.from.toLowerCase() === toKey && m.to.toLowerCase() === fromKey)
      )
      .slice(-10);

    const uiResource = createUIResource({
      uri: `ui://agent-chat/convo-${fromKey}-${toKey}-${Date.now()}`,
      content: { type: "rawHtml", htmlString: buildInboxHTML(from, recentWithRecipient) },
      encoding: "text",
      adapters: { appsSdk: { enabled: true } },
    });

    return {
      content: [
        uiResource,
        { type: "text" as const, text: `Message #${msg.id} sent to "${to}" at ${msg.timestamp}` },
      ],
    };
  }
);

server.tool(
  {
    name: "read-inbox",
    description:
      "Read messages sent to you. Returns unread messages by default. Use include_read=true to see all messages.",
    schema: z.object({
      agent_name: z.string().describe("Your agent name (must be registered)"),
      include_read: z.boolean().optional().describe("Include already-read messages (default: false)"),
      limit: z.number().min(1).max(50).optional().describe("Max messages to return (default: 20)"),
    }),
  },
  async ({ agent_name, include_read, limit }) => {
    const key = agent_name.toLowerCase();
    if (!agents.has(key)) {
      return text(`Error: Agent "${agent_name}" is not registered. Call "register" first.`);
    }

    agents.get(key)!.lastSeen = new Date().toISOString();

    const maxMessages = limit || 20;
    const inbox = messages
      .filter((m) => m.to.toLowerCase() === key && (include_read || !m.read))
      .slice(-maxMessages);

    inbox.forEach((m) => (m.read = true));

    const formatted = inbox.length > 0
      ? inbox.map((m) => `[#${m.id} | ${m.timestamp}] From ${m.from}:\n  ${m.content}`).join("\n\n")
      : "No new messages.";

    const unread = messages.filter((m) => m.to.toLowerCase() === key && !m.read).length;

    const uiResource = createUIResource({
      uri: `ui://agent-chat/inbox-${key}-${Date.now()}`,
      content: { type: "rawHtml", htmlString: buildInboxHTML(agent_name, inbox) },
      encoding: "text",
      adapters: { appsSdk: { enabled: true } },
    });

    return {
      content: [
        uiResource,
        { type: "text" as const, text: `📬 ${inbox.length} message(s):\n\n${formatted}` },
      ],
    };
  }
);

server.tool(
  {
    name: "list-agents",
    description: "List all registered agents on the network so you know who you can talk to.",
    schema: z.object({}),
  },
  async () => {
    if (agents.size === 0) {
      return text("No agents registered yet. Be the first to register!");
    }

    const agentList = [...agents.values()];
    const list = agentList
      .map((a) => {
        const parts = [`• ${a.name}`];
        if (a.profile.role) parts.push(`[${a.profile.role}]`);
        if (a.description) parts.push(`— ${a.description}`);
        if (a.profile.skills.length > 0) parts.push(`(${a.profile.skills.join(", ")})`);
        return parts.join(" ");
      })
      .join("\n");

    const uiResource = createUIResource({
      uri: `ui://agent-chat/agents-${Date.now()}`,
      content: { type: "rawHtml", htmlString: buildAgentsHTML(agentList) },
      encoding: "text",
      adapters: { appsSdk: { enabled: true } },
    });

    return {
      content: [
        uiResource,
        { type: "text" as const, text: `Registered agents (${agents.size}):\n\n${list}` },
      ],
    };
  }
);

server.tool(
  {
    name: "broadcast",
    description: "Send a message to ALL registered agents on the network at once.",
    schema: z.object({
      from: z.string().describe("Your agent name (must be registered)"),
      message: z.string().min(1).max(2000).describe("The broadcast message"),
    }),
  },
  async ({ from, message }) => {
    const fromKey = from.toLowerCase();
    if (!agents.has(fromKey)) {
      return text(`Error: You ("${from}") are not registered. Call "register" first.`);
    }

    agents.get(fromKey)!.lastSeen = new Date().toISOString();

    const recipients = [...agents.values()].filter(
      (a) => a.name.toLowerCase() !== fromKey
    );

    if (recipients.length === 0) {
      return text("No other agents to broadcast to. You're the only one here!");
    }

    const timestamp = new Date().toISOString();
    for (const recipient of recipients) {
      messages.push({
        id: messageIdCounter++,
        from: agents.get(fromKey)!.name,
        to: recipient.name,
        content: `[BROADCAST] ${message}`,
        timestamp,
        read: false,
      });
      notifications.push({
        agentName: recipient.name.toLowerCase(),
        message: `Broadcast from ${agents.get(fromKey)!.name}: "${message.substring(0, 50)}${message.length > 50 ? "..." : ""}"`,
        timestamp,
      });
    }

    return text(
      `Broadcast sent to ${recipients.length} agent(s): ${recipients.map((r) => r.name).join(", ")}`
    );
  }
);

server.tool(
  {
    name: "unread-count",
    description:
      "Quickly check how many unread messages an agent has. Use this frequently to stay aware of incoming messages.",
    schema: z.object({
      agent_name: z.string().describe("Your agent name (must be registered)"),
    }),
  },
  async ({ agent_name }) => {
    const key = agent_name.toLowerCase();
    if (!agents.has(key)) {
      return text(`Error: Agent "${agent_name}" is not registered.`);
    }
    agents.get(key)!.lastSeen = new Date().toISOString();

    const unread = messages.filter((m) => m.to.toLowerCase() === key && !m.read);
    if (unread.length === 0) {
      return text("No new messages.");
    }

    const senders = [...new Set(unread.map((m) => m.from))];
    return text(
      `🔔 You have ${unread.length} unread message(s) from: ${senders.join(", ")}. Use "read-inbox" to read them!`
    );
  }
);

server.tool(
  {
    name: "check-notifications",
    description:
      "Check for new notifications (new messages, agent joins, etc). Call this periodically to stay updated. Returns and clears pending notifications for your agent.",
    schema: z.object({
      agent_name: z.string().describe("Your agent name (must be registered)"),
    }),
  },
  async ({ agent_name }) => {
    const key = agent_name.toLowerCase();
    if (!agents.has(key)) {
      return text(`Error: Agent "${agent_name}" is not registered.`);
    }
    agents.get(key)!.lastSeen = new Date().toISOString();

    const pending = notifications.filter((n) => n.agentName === key);
    const pendingIndices = notifications
      .map((n, i) => (n.agentName === key ? i : -1))
      .filter((i) => i !== -1)
      .reverse();
    for (const i of pendingIndices) {
      notifications.splice(i, 1);
    }

    if (pending.length === 0) {
      return text("No new notifications.");
    }

    const formatted = pending
      .map((n) => `🔔 [${n.timestamp}] ${n.message}`)
      .join("\n");

    const notifText = pending.map((n) => n.message).join("\n");
    const uiResource = createUIResource({
      uri: `ui://agent-chat/notifs-${key}-${Date.now()}`,
      content: { type: "rawHtml", htmlString: buildNotifHTML(agent_name, notifText) },
      encoding: "text",
      adapters: { appsSdk: { enabled: true } },
    });

    return {
      content: [
        uiResource,
        { type: "text" as const, text: `${pending.length} notification(s):\n\n${formatted}` },
      ],
    };
  }
);

server.tool(
  {
    name: "view-profile",
    description: "View the full profile of any registered agent — their role, skills, recommended resource, and more.",
    schema: z.object({
      agent_name: z.string().describe("The agent name whose profile you want to view"),
    }),
  },
  async ({ agent_name }) => {
    const key = agent_name.toLowerCase();
    if (!agents.has(key)) {
      const available = [...agents.keys()].join(", ") || "(none)";
      return text(`Agent "${agent_name}" not found. Available agents: ${available}`);
    }

    const agent = agents.get(key)!;
    const p = agent.profile;

    const lines = [`Profile: ${agent.name}`];
    if (agent.description) lines.push(`Bio: ${agent.description}`);
    if (p.role) lines.push(`Role: ${p.role}`);
    if (p.company) lines.push(`Company: ${p.company}`);
    if (p.location) lines.push(`Location: ${p.location}`);
    if (p.website) lines.push(`Website: ${p.website}`);
    if (p.skills.length > 0) lines.push(`Skills: ${p.skills.join(", ")}`);
    if (p.recommendedResource) lines.push(`Recommended: ${p.recommendedResource}`);
    lines.push(`Joined: ${agent.joinedAt}`);

    const uiResource = createUIResource({
      uri: `ui://agent-chat/profile-${key}-${Date.now()}`,
      content: { type: "rawHtml", htmlString: buildProfileHTML(agent) },
      encoding: "text",
      adapters: { appsSdk: { enabled: true } },
    });

    return {
      content: [
        uiResource,
        { type: "text" as const, text: lines.join("\n") },
      ],
    };
  }
);

server.tool(
  {
    name: "update-profile",
    description: "Update your profile fields. Only provide the fields you want to change — everything else stays the same.",
    schema: z.object({
      agent_name: z.string().describe("Your agent name (must be registered)"),
      description: z.string().max(200).optional().describe("Update your bio"),
      role: z.string().max(100).optional().describe("Update your professional role"),
      recommended_resource: z.string().max(300).optional().describe("Update your recommended resource"),
      skills: z.array(z.string()).max(10).optional().describe("Replace your skills list"),
      company: z.string().max(100).optional().describe("Update your company"),
      website: z.string().max(200).optional().describe("Update your website URL"),
      location: z.string().max(100).optional().describe("Update your location"),
    }),
  },
  async ({ agent_name, description, role, recommended_resource, skills, company, website, location }) => {
    const key = agent_name.toLowerCase();
    if (!agents.has(key)) {
      return text(`Error: Agent "${agent_name}" is not registered. Call "register" first.`);
    }

    const agent = agents.get(key)!;
    agent.lastSeen = new Date().toISOString();
    if (description !== undefined) agent.description = description;
    if (role !== undefined) agent.profile.role = role;
    if (recommended_resource !== undefined) agent.profile.recommendedResource = recommended_resource;
    if (skills !== undefined) agent.profile.skills = skills;
    if (company !== undefined) agent.profile.company = company;
    if (website !== undefined) agent.profile.website = website;
    if (location !== undefined) agent.profile.location = location;

    const updated: string[] = [];
    if (description !== undefined) updated.push("bio");
    if (role !== undefined) updated.push("role");
    if (recommended_resource !== undefined) updated.push("recommended resource");
    if (skills !== undefined) updated.push("skills");
    if (company !== undefined) updated.push("company");
    if (website !== undefined) updated.push("website");
    if (location !== undefined) updated.push("location");

    return text(`Profile updated! Changed: ${updated.join(", ")}.`);
  }
);

// ── Resources ──

server.resource(
  {
    name: "agent-directory",
    uri: "chat://agents",
    description: "Live directory of all registered agents",
  },
  async () =>
    object(
      [...agents.values()].map((a) => ({
        name: a.name,
        description: a.description,
        profile: a.profile,
        joinedAt: a.joinedAt,
        lastSeen: a.lastSeen,
      }))
    )
);

server.resource(
  {
    name: "chat-stats",
    uri: "chat://stats",
    description: "Message and agent statistics",
  },
  async () =>
    object({
      totalAgents: agents.size,
      totalMessages: messages.length,
      unreadMessages: messages.filter((m) => !m.read).length,
    })
);

// ── Prompts ──

server.prompt(
  {
    name: "introduce-yourself",
    description: "Get a prompt to introduce your agent to the network",
    schema: z.object({
      agent_name: z.string().describe("Your agent name"),
      purpose: z.string().describe("What your agent does or is for"),
    }),
  },
  async ({ agent_name, purpose }) =>
    text(
      `You are "${agent_name}". ${purpose}. ` +
        `First register with the "register" tool, then use "list-agents" to see who's online, ` +
        `and "send-message" to start a conversation. Check your "read-inbox" for replies.`
    )
);

// ── Start ──

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;
console.log(`Agent Chat MCP server running on port ${PORT}`);
server.listen(PORT);
