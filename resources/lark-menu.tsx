import { useState, useEffect } from "react";
import { McpUseProvider, useWidget, useWidgetTheme, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const propSchema = z.object({
  open: z.boolean().optional().describe("Whether menu is open"),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Lark app launcher - slide menu with all tool icons",
  props: propSchema,
};

type Props = z.infer<typeof propSchema>;

type ToolEntry = { id: string; label: string; icon: string; color: string; prompt?: string };
const TOOLS: ToolEntry[] = [
  // Lark (contacts & comms)
  { id: "add-contact", label: "Add Contact", icon: "user-plus", color: "#10b981", prompt: "add contact [name] [phone]" },
  { id: "list-contacts", label: "Contacts", icon: "users", color: "#3b82f6", prompt: "list contacts" },
  { id: "remove-contact", label: "Remove Contact", icon: "user-minus", color: "#ef4444", prompt: "remove contact [name]" },
  { id: "make-call", label: "Call", icon: "phone", color: "#22c55e", prompt: "call [name] and say [message]" },
  { id: "send-sms", label: "SMS", icon: "message", color: "#6366f1", prompt: "send sms to [name] [message]" },
  { id: "open-camera", label: "Camera", icon: "camera", color: "#06b6d4", prompt: "open camera" },
  { id: "group-call", label: "Group Call", icon: "phone-call", color: "#f59e0b", prompt: "group call [names] and say [message]" },
  // Agent Chat
  { id: "agent-chat-mcp__register", label: "Agent Chat: Register", icon: "message-square", color: "#8b5cf6", prompt: "register as agent [name]" },
  { id: "agent-chat-mcp__send-message", label: "Agent Chat: Send", icon: "send", color: "#a855f7", prompt: "send message to [agent] [message]" },
  { id: "agent-chat-mcp__read-inbox", label: "Agent Chat: Inbox", icon: "inbox", color: "#7c3aed", prompt: "read inbox as [agent]" },
  { id: "agent-chat-mcp__list-agents", label: "Agent Chat: Agents", icon: "users", color: "#6d28d9", prompt: "list agents" },
  // Music Player
  { id: "music-player-mcp__play", label: "Play Music", icon: "music", color: "#ec4899", prompt: "play [song name]" },
  { id: "music-player-mcp__search", label: "Search Music", icon: "search", color: "#f472b6", prompt: "search music [query]" },
  { id: "music-player-mcp__add-to-queue", label: "Music: Add to Queue", icon: "list", color: "#db2777", prompt: "add [song] to queue" },
  // YouTube
  { id: "youtube-mcp__play", label: "Play YouTube", icon: "video", color: "#ef4444", prompt: "play [video or search]" },
  { id: "youtube-mcp__search", label: "Search YouTube", icon: "search", color: "#f87171", prompt: "search youtube [query]" },
  { id: "youtube-mcp__add-to-queue", label: "YouTube: Add to Queue", icon: "list", color: "#dc2626", prompt: "add [video] to youtube queue" },
];

function Icon({ name, size = 20, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const icons: Record<string, JSX.Element> = {
    "user-plus": (
      <>
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </>
    ),
    users: (
      <>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </>
    ),
    "user-minus": (
      <>
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </>
    ),
    phone: (
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    ),
    message: (
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    ),
    camera: (
      <>
        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    "phone-call": (
      <>
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
        <path d="M16 8a2 2 0 014 0v1a2 2 0 01-2 2h-1" />
      </>
    ),
    "message-square": (
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    ),
    send: (
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    ),
    inbox: (
      <path d="M22 12h-6l-2 3H10l-2-3H2" />
    ),
    music: (
      <>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </>
    ),
    search: (
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    ),
    list: (
      <>
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <circle cx="4" cy="6" r="1.5" fill="none" />
        <circle cx="4" cy="12" r="1.5" fill="none" />
        <circle cx="4" cy="18" r="1.5" fill="none" />
      </>
    ),
    video: (
      <>
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </>
    ),
  };
  const paths = icons[name] || icons.users;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}
    >
      {paths}
    </svg>
  );
}

function LarkMenuContent() {
  const { displayMode } = useWidget<Props>();
  const theme = useWidgetTheme();
  const isDark = theme === "dark";
  const [expanded, setExpanded] = useState(true);

  const bg = isDark
    ? "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.95) 100%)"
    : "linear-gradient(135deg, rgba(248,250,252,0.98) 0%, rgba(241,245,249,0.95) 100%)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const mutedColor = isDark ? "#94a3b8" : "#64748b";

  return (
    <div
      style={{
        fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
        background: bg,
        borderRadius: "16px",
        border: `1px solid ${borderColor}`,
        overflow: "hidden",
        boxShadow: isDark ? "0 25px 50px -12px rgba(0,0,0,0.5)" : "0 25px 50px -12px rgba(0,0,0,0.15)",
        maxWidth: expanded ? 320 : 72,
        transition: "max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <style>{`
        @keyframes lark-slide-in {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .lark-tool-item:hover {
          background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"} !important;
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: expanded ? "16px 18px" : "16px",
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        {expanded && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              L
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: textColor }}>Lark</div>
              <div style={{ fontSize: 11, color: mutedColor, fontWeight: 500 }}>
                {displayMode === "pip" ? "Floating" : displayMode === "fullscreen" ? "Fullscreen" : "Your tools"}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: `1px solid ${borderColor}`,
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: mutedColor,
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expanded ? "rotate(180deg)" : "none" }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Tool list */}
      <div style={{ padding: expanded ? "8px 12px 16px" : "8px" }}>
        {TOOLS.map((tool, i) => (
          <div
            key={tool.id}
            className="lark-tool-item"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: expanded ? "10px 12px" : "12px",
              borderRadius: 10,
              cursor: "default",
              transition: "background 0.15s ease",
              animation: "lark-slide-in 0.3s ease forwards",
              animationDelay: `${i * 0.03}s`,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${tool.color}20`,
                border: `1px solid ${tool.color}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name={tool.icon} size={20} color={tool.color} />
            </div>
            {expanded && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: textColor }}>{tool.label}</div>
                <div style={{ fontSize: 11, color: mutedColor }}>Say &quot;{tool.prompt || tool.id.replace(/-/g, " ")}&quot;</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LarkMenu() {
  const { props, requestDisplayMode } = useWidget<Props>();

  useEffect(() => {
    if (requestDisplayMode) {
      // pip = floating window that stays sticky/visible while scrolling
      requestDisplayMode("pip").catch(() => {});
    }
  }, [requestDisplayMode]);

  return (
    <McpUseProvider autoSize>
      <LarkMenuContent />
    </McpUseProvider>
  );
}
