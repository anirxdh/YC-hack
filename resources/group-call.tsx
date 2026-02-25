import { McpUseProvider, useWidget, useWidgetTheme, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const propSchema = z.object({
  message: z.string(),
  totalCalls: z.number(),
  succeeded: z.number(),
  failed: z.number(),
  calls: z.array(z.object({
    label: z.string(),
    callSid: z.string(),
    status: z.string().optional(),
  })).optional(),
  errors: z.array(z.object({
    label: z.string(),
    error: z.string(),
  })).optional(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Display group call status",
  props: propSchema,
};

type Props = z.infer<typeof propSchema>;

function CheckIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function GroupCallView() {
  const { props, isPending } = useWidget<Props>();
  const theme = useWidgetTheme();
  const isDark = theme === "dark";

  const bg = isDark
    ? "linear-gradient(160deg, #0a0f1a 0%, #0d1425 40%, #0f1a2e 100%)"
    : "linear-gradient(160deg, #f8fafc 0%, #f0f4ff 40%, #eef2ff 100%)";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)";
  const cardBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const labelColor = isDark ? "#64748b" : "#94a3b8";
  const valueColor = isDark ? "#e2e8f0" : "#1e293b";

  if (isPending) return null;
  if (!props) return null;

  const { message, totalCalls, succeeded, failed, calls = [], errors = [] } = props;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      padding: "28px 24px 24px",
      fontFamily: "'SF Pro Display', system-ui, sans-serif",
      background: bg,
      borderRadius: "20px",
      minWidth: "360px",
      maxWidth: 420,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 700,
          fontSize: 20,
        }}>
          {totalCalls}
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: valueColor, margin: 0 }}>Group Call</h2>
          <p style={{ fontSize: 13, color: labelColor, margin: "2px 0 0" }}>
            {succeeded} succeeded{succeeded !== totalCalls ? ` · ${failed} failed` : ""}
          </p>
        </div>
      </div>

      <div style={{
        background: cardBg,
        borderRadius: 12,
        border: `1px solid ${cardBorder}`,
        padding: "14px 16px",
        marginBottom: 16,
      }}>
        <span style={{ fontSize: 11, color: labelColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Message</span>
        <p style={{ fontSize: 14, color: valueColor, margin: "6px 0 0", lineHeight: 1.4 }}>{message}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
        {calls.map((c) => (
          <div
            key={c.callSid}
            style={{
              background: cardBg,
              borderRadius: 10,
              border: `1px solid ${cardBorder}`,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckIcon size={14} color="#10b981" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: valueColor }}>{c.label}</span>
          </div>
        ))}
        {errors.map((e, i) => (
          <div
            key={i}
            style={{
              background: cardBg,
              borderRadius: 10,
              border: `1px solid ${cardBorder}`,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(239, 68, 68, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <XIcon size={14} color="#ef4444" />
            </div>
            <div>
              <span style={{ fontSize: 14, fontWeight: 500, color: valueColor }}>{e.label}</span>
              <span style={{ fontSize: 12, color: labelColor, marginLeft: 8 }}>{e.error}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GroupCall() {
  return (
    <McpUseProvider autoSize>
      <GroupCallView />
    </McpUseProvider>
  );
}
