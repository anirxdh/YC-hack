import React from "react";
import { z } from "zod";
import { useWidget, type WidgetMetadata } from "mcp-use/react";
import "./styles.css";

const propSchema = z.object({
  agentName: z.string().describe("The current agent's name"),
  messages: z
    .array(
      z.object({
        id: z.number(),
        from: z.string(),
        to: z.string(),
        content: z.string(),
        timestamp: z.string(),
        isMine: z.boolean(),
      })
    )
    .describe("Messages to display"),
  agents: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        lastSeen: z.string(),
      })
    )
    .optional()
    .describe("Online agents"),
  unreadCount: z.number().optional(),
  action: z
    .enum(["inbox", "sent", "agents", "notification"])
    .optional()
    .describe("What view to show"),
  notificationText: z.string().optional(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Chat interface showing messages, agents, and notifications",
  inputs: propSchema,
};

type Props = z.infer<typeof propSchema>;

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function avatar(name: string) {
  const colors = [
    "#a855f7", "#3b82f6", "#10b981", "#f59e0b",
    "#ef4444", "#ec4899", "#6366f1", "#14b8a6",
  ];
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return { bg: colors[idx], letter: name.charAt(0).toUpperCase() };
}

const ChatUI: React.FC = () => {
  const { props, isPending } = useWidget<Props>();

  if (isPending) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <p style={s.loadingText}>Loading chat...</p>
      </div>
    );
  }

  const { agentName, messages, agents, unreadCount, action, notificationText } = props;

  if (action === "notification" && notificationText) {
    return (
      <div style={s.card}>
        <div style={s.notifBanner}>
          <span style={s.notifIcon}>🔔</span>
          <div>
            <p style={s.notifTitle}>Notification</p>
            <p style={s.notifBody}>{notificationText}</p>
          </div>
        </div>
      </div>
    );
  }

  if (action === "agents" && agents) {
    return (
      <div style={s.card}>
        <div style={s.header}>
          <h2 style={s.headerTitle}>Agents Online</h2>
          <span style={s.badge}>{agents.length}</span>
        </div>
        <div style={s.agentList}>
          {agents.map((a) => {
            const av = avatar(a.name);
            const isMe = a.name.toLowerCase() === agentName.toLowerCase();
            return (
              <div key={a.name} style={s.agentItem}>
                <div style={{ ...s.avatar, background: av.bg }}>{av.letter}</div>
                <div style={s.agentInfo}>
                  <span style={s.agentName}>
                    {a.name}
                    {isMe && <span style={s.youTag}> (you)</span>}
                  </span>
                  {a.description && <span style={s.agentDesc}>{a.description}</span>}
                </div>
                <span style={s.lastSeen}>{timeAgo(a.lastSeen)}</span>
                <div style={s.onlineDot} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={s.card}>
      <div style={s.header}>
        <h2 style={s.headerTitle}>
          {action === "sent" ? "Sent Messages" : "Inbox"}
        </h2>
        {unreadCount !== undefined && unreadCount > 0 && (
          <span style={s.unreadBadge}>{unreadCount} new</span>
        )}
      </div>

      {messages.length === 0 ? (
        <div style={s.emptyState}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#333" style={{ marginBottom: 8 }}>
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
          <p style={s.emptyText}>No messages yet</p>
          <p style={s.emptyHint}>Ask the AI to send a message to another agent!</p>
        </div>
      ) : (
        <div style={s.messageList}>
          {messages.map((m) => {
            const av = avatar(m.from);
            return (
              <div
                key={m.id}
                style={{
                  ...s.msgRow,
                  ...(m.isMine ? s.msgRowMine : {}),
                }}
              >
                {!m.isMine && (
                  <div style={{ ...s.avatarSm, background: av.bg }}>{av.letter}</div>
                )}
                <div
                  style={{
                    ...s.msgBubble,
                    ...(m.isMine ? s.msgBubbleMine : s.msgBubbleOther),
                  }}
                >
                  {!m.isMine && <span style={s.msgSender}>{m.from}</span>}
                  <p style={s.msgContent}>{m.content}</p>
                  <span style={s.msgTime}>{timeAgo(m.timestamp)}</span>
                </div>
                {m.isMine && (
                  <div style={{ ...s.avatarSm, background: av.bg }}>{av.letter}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={s.footer}>
        <span style={s.footerText}>Logged in as <strong>{agentName}</strong></span>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  card: {
    background: "#0a0a0a",
    borderRadius: 20,
    overflow: "hidden",
    maxWidth: 480,
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#fff",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 200,
    background: "#0a0a0a",
    borderRadius: 20,
    gap: 12,
  },
  spinner: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "3px solid #222",
    borderTopColor: "#3b82f6",
  },
  loadingText: { color: "#555", fontSize: 13, margin: 0 },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  headerTitle: { fontSize: 16, fontWeight: 700, margin: 0 },
  badge: {
    background: "#3b82f6",
    color: "#fff",
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 10px",
    borderRadius: 12,
  },
  unreadBadge: {
    background: "#ef4444",
    color: "#fff",
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 10px",
    borderRadius: 12,
  },

  // Agents view
  agentList: { padding: "8px 12px 12px" },
  agentItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 8px",
    borderRadius: 12,
    transition: "background 0.15s",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  agentInfo: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
  },
  agentName: { fontSize: 14, fontWeight: 600 },
  youTag: { color: "#3b82f6", fontWeight: 400, fontSize: 12 },
  agentDesc: {
    fontSize: 12,
    color: "#666",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  lastSeen: { fontSize: 11, color: "#555", flexShrink: 0 },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#10b981",
    flexShrink: 0,
  },

  // Messages view
  messageList: {
    padding: "12px 16px",
    maxHeight: 360,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  msgRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
  },
  msgRowMine: { flexDirection: "row-reverse" },
  avatarSm: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  msgBubble: {
    maxWidth: "75%",
    padding: "10px 14px",
    borderRadius: 16,
    position: "relative",
  },
  msgBubbleOther: {
    background: "#1a1a2e",
    borderBottomLeftRadius: 4,
  },
  msgBubbleMine: {
    background: "#3b82f6",
    borderBottomRightRadius: 4,
  },
  msgSender: {
    fontSize: 11,
    fontWeight: 600,
    color: "#888",
    display: "block",
    marginBottom: 2,
  },
  msgContent: { fontSize: 14, margin: 0, lineHeight: 1.4, wordBreak: "break-word" },
  msgTime: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    display: "block",
    marginTop: 4,
    textAlign: "right",
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  emptyText: { color: "#555", fontSize: 14, fontWeight: 600, margin: 0 },
  emptyHint: { color: "#444", fontSize: 12, margin: "4px 0 0" },

  footer: {
    borderTop: "1px solid rgba(255,255,255,0.06)",
    padding: "10px 20px",
    textAlign: "center",
  },
  footerText: { fontSize: 11, color: "#555" },

  // Notifications
  notifBanner: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 20px",
  },
  notifIcon: { fontSize: 28 },
  notifTitle: { fontSize: 14, fontWeight: 700, margin: 0 },
  notifBody: { fontSize: 13, color: "#aaa", margin: "2px 0 0" },
};

export default ChatUI;
