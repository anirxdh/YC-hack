import { McpUseProvider, useWidget, useWidgetTheme, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const propSchema = z.object({
  saved: z.boolean(),
  name: z.string(),
  phone: z.string(),
  totalContacts: z.number(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Display saved contact confirmation",
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

function UserPlusIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function AddContactView() {
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

  if (isPending) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 32px",
        fontFamily: "'SF Pro Display', system-ui, sans-serif",
        background: bg,
        borderRadius: "20px",
        minWidth: "320px",
      }}>
        <div style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
          <UserPlusIcon size={48} color={isDark ? "#10b981" : "#059669"} />
        </div>
        <p style={{ fontSize: "15px", color: labelColor, marginTop: 16, fontWeight: 500 }}>Saving contact...</p>
      </div>
    );
  }

  if (!props?.saved) return null;

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
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        boxShadow: isDark ? "0 0 32px rgba(16, 185, 129, 0.3)" : "0 0 24px rgba(16, 185, 129, 0.25)",
      }}>
        <CheckIcon size={28} />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: valueColor, margin: "0 0 4px" }}>Contact Saved</h2>
      <p style={{ fontSize: 13, color: labelColor, margin: "0 0 24px" }}>{props.totalContacts} contact{props.totalContacts !== 1 ? "s" : ""} in your list</p>
      <div style={{
        width: "100%",
        background: cardBg,
        borderRadius: 14,
        border: `1px solid ${cardBorder}`,
        padding: "18px 20px",
      }}>
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: labelColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Name</span>
          <p style={{ fontSize: 16, fontWeight: 600, color: valueColor, margin: "4px 0 0" }}>{props.name}</p>
        </div>
        <div>
          <span style={{ fontSize: 11, color: labelColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Phone</span>
          <p style={{ fontSize: 15, fontWeight: 500, color: valueColor, margin: "4px 0 0", fontFeatureSettings: "'tnum'" }}>{props.phone}</p>
        </div>
      </div>
    </div>
  );
}

export default function AddContact() {
  return (
    <McpUseProvider autoSize>
      <AddContactView />
    </McpUseProvider>
  );
}
