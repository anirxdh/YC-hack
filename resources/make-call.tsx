import React from "react";
import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const propSchema = z.object({
  status: z.string(),
  callSid: z.string(),
  to: z.string(),
  from: z.string(),
  message: z.string(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Display phone call status and details",
  props: propSchema,
};

type Props = z.infer<typeof propSchema>;

export default function MakeCall() {
  const { props, isPending } = useWidget<Props>();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={styles.container}>
          <div style={styles.pulseCircle}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
          </div>
          <p style={styles.callingText}>Placing call...</p>
        </div>
      </McpUseProvider>
    );
  }

  return (
    <McpUseProvider autoSize>
      <div style={styles.container}>
        <div style={styles.successCircle}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
          </svg>
        </div>

        <h2 style={styles.title}>Call Initiated</h2>

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
            <span style={styles.label}>Message</span>
            <span style={styles.value}>{props.message}</span>
          </div>
          <div style={styles.divider} />
          <div style={styles.row}>
            <span style={styles.label}>Call SID</span>
            <span style={{ ...styles.value, fontSize: "11px", fontFamily: "monospace" }}>{props.callSid}</span>
          </div>
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
    background: "rgba(16, 185, 129, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  callingText: {
    fontSize: "18px",
    color: "#94a3b8",
    fontWeight: 500,
  },
  successCircle: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #10b981, #059669)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
    boxShadow: "0 0 30px rgba(16, 185, 129, 0.3)",
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
    marginBottom: "20px",
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
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    borderRadius: "20px",
    padding: "8px 16px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#10b981",
  },
  statusText: {
    fontSize: "13px",
    color: "#10b981",
    fontWeight: 600,
  },
};
