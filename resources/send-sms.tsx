import { useState, useEffect } from "react";
import { McpUseProvider, useWidget, useWidgetTheme, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const propSchema = z.object({
  status: z.string(),
  messageSid: z.string(),
  to: z.string(),
  from: z.string(),
  body: z.string(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Display SMS message delivery status",
  props: propSchema,
};

type Props = z.infer<typeof propSchema>;

function MessageIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function SendIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function CheckIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DoubleCheckIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 6 9 17 4 12" />
      <polyline points="22 6 13 17" />
    </svg>
  );
}

function CopyIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

// Pending state — animated sending screen
function SendingView() {
  const theme = useWidgetTheme();
  const isDark = theme === "dark";
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 32px",
      fontFamily: "'SF Pro Display', 'Segoe UI', system-ui, -apple-system, sans-serif",
      background: isDark
        ? "linear-gradient(160deg, #0a0c1a 0%, #0d1030 40%, #111338 100%)"
        : "linear-gradient(160deg, #f8f9fc 0%, #f0f1ff 40%, #eaecff 100%)",
      borderRadius: "20px",
      minWidth: "360px",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes sms-float-up {
          0% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-30px) scale(0.9); opacity: 0.3; }
          100% { transform: translateY(-60px) scale(0.7); opacity: 0; }
        }
        @keyframes sms-bob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-5px) rotate(-2deg); }
          66% { transform: translateY(-3px) rotate(2deg); }
        }
        @keyframes sms-dot-bounce-1 {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes sms-dot-bounce-2 {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes sms-dot-bounce-3 {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>

      {/* Floating message particles */}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          position: "absolute",
          bottom: "30%",
          left: `${30 + i * 20}%`,
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: isDark
            ? `rgba(129, 140, 248, ${0.3 - i * 0.08})`
            : `rgba(99, 102, 241, ${0.25 - i * 0.06})`,
          animation: `sms-float-up ${2.5 + i * 0.5}s ease-out infinite ${i * 0.7}s`,
        }} />
      ))}

      {/* Animated icon */}
      <div style={{ position: "relative", marginBottom: "28px" }}>
        <div style={{
          width: "88px",
          height: "88px",
          borderRadius: "24px",
          background: isDark
            ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)"
            : "linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isDark
            ? "0 0 40px rgba(99, 102, 241, 0.35), 0 8px 32px rgba(99, 102, 241, 0.2)"
            : "0 0 30px rgba(99, 102, 241, 0.25), 0 8px 24px rgba(99, 102, 241, 0.15)",
          animation: "sms-bob 3s ease-in-out infinite",
        }}>
          <SendIcon size={36} color="white" />
        </div>
      </div>

      {/* Typing dots */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: "20px",
        padding: "10px 20px",
        borderRadius: "20px",
        background: isDark ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)",
        border: `1px solid ${isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)"}`,
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: isDark ? "#818cf8" : "#6366f1",
            animation: `sms-dot-bounce-${i + 1} 1.4s ease-in-out infinite ${i * 0.2}s`,
          }} />
        ))}
      </div>

      <p style={{
        fontSize: "18px",
        fontWeight: 600,
        color: isDark ? "#e2e8f0" : "#1e293b",
        margin: 0,
        letterSpacing: "-0.01em",
      }}>
        Sending message{".".repeat(dotCount)}
      </p>
      <p style={{
        fontSize: "13px",
        color: isDark ? "#64748b" : "#94a3b8",
        margin: "8px 0 0",
        fontWeight: 500,
      }}>
        Delivering via Twilio SMS
      </p>
    </div>
  );
}

// Success state — message delivered
function MessageSentView({ props }: { props: Props }) {
  const theme = useWidgetTheme();
  const isDark = theme === "dark";
  const [visible, setVisible] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50);
    const t2 = setTimeout(() => setBubbleVisible(true), 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleCopy = (value: string, field: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const bg = isDark
    ? "linear-gradient(160deg, #0a0c1a 0%, #0d1030 40%, #111338 100%)"
    : "linear-gradient(160deg, #f8f9fc 0%, #f0f1ff 40%, #eaecff 100%)";

  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)";
  const cardBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const labelColor = isDark ? "#64748b" : "#94a3b8";
  const valueColor = isDark ? "#e2e8f0" : "#1e293b";
  const dimColor = isDark ? "#475569" : "#cbd5e1";

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "36px 28px 32px",
      fontFamily: "'SF Pro Display', 'Segoe UI', system-ui, -apple-system, sans-serif",
      background: bg,
      borderRadius: "20px",
      minWidth: "360px",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(8px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
    }}>
      <style>{`
        @keyframes sms-scale-in {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes sms-slide-up {
          0% { transform: translateY(12px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes sms-delivered {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      {/* Success icon */}
      <div style={{
        width: "64px",
        height: "64px",
        borderRadius: "20px",
        background: isDark
          ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
          : "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "20px",
        boxShadow: isDark
          ? "0 0 32px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)"
          : "0 0 24px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255,255,255,0.3)",
        animation: "sms-scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      }}>
        <MessageIcon size={28} color="white" />
      </div>

      <h2 style={{
        fontSize: "20px",
        fontWeight: 700,
        color: valueColor,
        margin: "0 0 4px",
        letterSpacing: "-0.02em",
      }}>
        Message Sent
      </h2>
      <p style={{
        fontSize: "13px",
        color: labelColor,
        margin: "0 0 24px",
        fontWeight: 500,
      }}>
        Your SMS has been delivered
      </p>

      {/* Message bubble — chat-style */}
      <div style={{
        width: "100%",
        marginBottom: "16px",
        opacity: bubbleVisible ? 1 : 0,
        transform: bubbleVisible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s",
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          width: "100%",
        }}>
          <div style={{
            maxWidth: "85%",
            padding: "14px 18px 10px",
            borderRadius: "18px 18px 4px 18px",
            background: isDark
              ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
              : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            boxShadow: isDark
              ? "0 4px 16px rgba(99, 102, 241, 0.25)"
              : "0 4px 12px rgba(99, 102, 241, 0.2)",
          }}>
            <p style={{
              margin: "0 0 6px",
              fontSize: "15px",
              lineHeight: 1.5,
              color: "#ffffff",
              wordBreak: "break-word",
            }}>
              {props.body}
            </p>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "4px",
            }}>
              <span style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.6)",
                fontWeight: 500,
              }}>
                {timeStr}
              </span>
              <DoubleCheckIcon size={14} color="rgba(255,255,255,0.7)" />
            </div>
          </div>
        </div>
      </div>

      {/* Delivery details */}
      <div style={{
        width: "100%",
        background: cardBg,
        borderRadius: "14px",
        border: `1px solid ${cardBorder}`,
        overflow: "hidden",
        marginBottom: "16px",
        backdropFilter: "blur(8px)",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 18px",
        }}>
          <span style={{ fontSize: "12px", color: labelColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            To
          </span>
          <span style={{ fontSize: "15px", color: valueColor, fontWeight: 600, fontFeatureSettings: "'tnum'" }}>
            {props.to}
          </span>
        </div>

        <div style={{ height: "1px", background: cardBorder, margin: "0 18px" }} />

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 18px",
        }}>
          <span style={{ fontSize: "12px", color: labelColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            From
          </span>
          <span style={{ fontSize: "15px", color: valueColor, fontWeight: 600, fontFeatureSettings: "'tnum'" }}>
            {props.from}
          </span>
        </div>
      </div>

      {/* Message SID */}
      <div
        onClick={() => handleCopy(props.messageSid, "sid")}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderRadius: "10px",
          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}`,
          cursor: "pointer",
          transition: "background 0.15s ease",
          marginBottom: "20px",
        }}
      >
        <span style={{ fontSize: "11px", color: dimColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Message SID
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            fontSize: "11px",
            color: dimColor,
            fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
            maxWidth: "180px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {props.messageSid}
          </span>
          {copiedField === "sid" ? (
            <CheckIcon size={12} color={isDark ? "#818cf8" : "#6366f1"} />
          ) : (
            <CopyIcon size={12} color={dimColor} />
          )}
        </div>
      </div>

      {/* Status badge */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 18px",
        borderRadius: "100px",
        background: isDark
          ? "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(79, 70, 229, 0.08))"
          : "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.06))",
        border: `1px solid ${isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.15)"}`,
      }}>
        <div style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: isDark ? "#818cf8" : "#6366f1",
          animation: "sms-delivered 2s ease-in-out infinite",
          boxShadow: `0 0 6px ${isDark ? "rgba(129, 140, 248, 0.5)" : "rgba(99, 102, 241, 0.5)"}`,
        }} />
        <DoubleCheckIcon size={14} color={isDark ? "#818cf8" : "#6366f1"} />
        <span style={{
          fontSize: "12px",
          color: isDark ? "#818cf8" : "#4f46e5",
          fontWeight: 700,
          letterSpacing: "0.02em",
        }}>
          {props.status}
        </span>
      </div>
    </div>
  );
}

export default function SendSms() {
  const { props, isPending } = useWidget<Props>();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <SendingView />
      </McpUseProvider>
    );
  }

  return (
    <McpUseProvider autoSize>
      <MessageSentView props={props} />
    </McpUseProvider>
  );
}
