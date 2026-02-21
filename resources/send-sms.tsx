import React from "react";
import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
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

export default function SendSms() {
  const { props, isPending } = useWidget<Props>();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={styles.container}>
          <div style={styles.pulseCircle}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <p style={styles.sendingText}>Sending message...</p>
        </div>
      </McpUseProvider>
    );
  }

  return (
    <McpUseProvider autoSize>
      <div style={styles.container}>
        <div style={styles.successCircle}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>

        <h2 style={styles.title}>Message Sent</h2>

        <div style={styles.card}>
          <div style={styles.row}>
            <span style={styles.label}>To</span>
            <span style={styles.value}>{props.to}</span>
          </div>
          <div style={styles.divider} />
          <div style={styles.row}>
            <span style={styles.label}>From</span>
            <span style={styles.value}>{props.from}</span>
          </div>
          <div style={styles.divider} />
          <div style={styles.row}>
            <span style={styles.label}>Message SID</span>
            <span style={{ ...styles.value, fontSize: "11px", fontFamily: "monospace" }}>{props.messageSid}</span>
          </div>
        </div>

        <div style={styles.messageBubble}>
          <p style={styles.messageText}>{props.body}</p>
        </div>

        <div style={styles.statusBadge}>
          <div style={styles.statusDot} />
          <span style={styles.statusText}>{props.status}</span>
        </div>
      </div>
    </McpUseProvider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px 24px",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    borderRadius: "16px",
    color: "white",
    minWidth: "320px",
  },
  pulseCircle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "rgba(99, 102, 241, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  sendingText: {
    fontSize: "18px",
    color: "#94a3b8",
    fontWeight: 500,
  },
  successCircle: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
    boxShadow: "0 0 30px rgba(99, 102, 241, 0.3)",
  },
  title: {
    fontSize: "22px",
    fontWeight: 700,
    marginBottom: "24px",
    color: "#f1f5f9",
  },
  card: {
    width: "100%",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "12px",
    padding: "16px 20px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    marginBottom: "16px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
  },
  label: {
    fontSize: "13px",
    color: "#94a3b8",
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  value: {
    fontSize: "14px",
    color: "#e2e8f0",
    fontWeight: 600,
  },
  divider: {
    height: "1px",
    background: "rgba(255, 255, 255, 0.06)",
  },
  messageBubble: {
    width: "100%",
    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.15))",
    borderRadius: "16px 16px 4px 16px",
    padding: "16px 20px",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    marginBottom: "20px",
  },
  messageText: {
    fontSize: "15px",
    color: "#e2e8f0",
    lineHeight: 1.5,
    margin: 0,
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(99, 102, 241, 0.15)",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    borderRadius: "20px",
    padding: "8px 16px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#6366f1",
  },
  statusText: {
    fontSize: "13px",
    color: "#818cf8",
    fontWeight: 600,
  },
};
