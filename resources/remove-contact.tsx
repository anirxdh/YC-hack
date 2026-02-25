import { McpUseProvider, useWidget, useWidgetTheme, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const propSchema = z.object({
  removed: z.boolean(),
  name: z.string(),
  totalContacts: z.number(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Display contact removal confirmation",
  props: propSchema,
};

type Props = z.infer<typeof propSchema>;

function CheckIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function RemoveContactView() {
  const { props, isPending } = useWidget<Props>();
  const theme = useWidgetTheme();
  const isDark = theme === "dark";

  const bg = isDark
    ? "linear-gradient(160deg, #0a0f1a 0%, #0d1425 40%, #0f1a2e 100%)"
    : "linear-gradient(160deg, #f8fafc 0%, #f0f4ff 40%, #eef2ff 100%)";
  const labelColor = isDark ? "#64748b" : "#94a3b8";
  const valueColor = isDark ? "#e2e8f0" : "#1e293b";

  if (isPending) return null;
  if (!props?.removed) return null;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "36px 28px 32px",
      fontFamily: "'SF Pro Display', system-ui, sans-serif",
      background: bg,
      borderRadius: "20px",
      minWidth: "320px",
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        boxShadow: isDark ? "0 0 32px rgba(239, 68, 68, 0.3)" : "0 0 24px rgba(239, 68, 68, 0.25)",
      }}>
        <CheckIcon size={28} />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: valueColor, margin: "0 0 4px" }}>Contact Removed</h2>
      <p style={{ fontSize: 15, fontWeight: 600, color: valueColor, margin: "0 0 4px" }}>{props.name}</p>
      <p style={{ fontSize: 13, color: labelColor, margin: 0 }}>{props.totalContacts} contact{props.totalContacts !== 1 ? "s" : ""} remaining</p>
    </div>
  );
}

export default function RemoveContact() {
  return (
    <McpUseProvider autoSize>
      <RemoveContactView />
    </McpUseProvider>
  );
}
