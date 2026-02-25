import { McpUseProvider, useWidget, useWidgetTheme, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const propSchema = z.object({
  totalContacts: z.number(),
  contacts: z.record(z.string(), z.string()).optional(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Display list of saved contacts",
  props: propSchema,
};

type Props = z.infer<typeof propSchema>;

function UsersIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function ListContactsView() {
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
        <UsersIcon size={48} color={isDark ? "#3b82f6" : "#2563eb"} />
        <p style={{ fontSize: 15, color: labelColor, marginTop: 16, fontWeight: 500 }}>Loading contacts...</p>
      </div>
    );
  }

  const contacts = props?.contacts ?? {};
  const entries = Object.entries(contacts);
  const total = props?.totalContacts ?? entries.length;

  if (entries.length === 0) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 32px",
        fontFamily: "'SF Pro Display', system-ui, sans-serif",
        background: bg,
        borderRadius: "20px",
        minWidth: "320px",
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: isDark ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}>
          <UsersIcon size={32} color="#3b82f6" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: valueColor, margin: "0 0 8px" }}>No contacts yet</h2>
        <p style={{ fontSize: 14, color: labelColor, margin: 0 }}>Say &quot;add contact [name] [phone]&quot; to save one</p>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      padding: "28px 24px 24px",
      fontFamily: "'SF Pro Display', system-ui, sans-serif",
      background: bg,
      borderRadius: "20px",
      minWidth: "320px",
      maxWidth: 400,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: isDark ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <UsersIcon size={24} color="#3b82f6" />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: valueColor, margin: 0 }}>Contacts</h2>
          <p style={{ fontSize: 13, color: labelColor, margin: "2px 0 0" }}>{total} saved</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
        {entries.map(([name, phone]) => (
          <div
            key={name}
            style={{
              background: cardBg,
              borderRadius: 12,
              border: `1px solid ${cardBorder}`,
              padding: "14px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: valueColor }}>{name}</div>
              <div style={{ fontSize: 13, color: labelColor, fontFeatureSettings: "'tnum'", marginTop: 2 }}>{phone}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ListContacts() {
  return (
    <McpUseProvider autoSize>
      <ListContactsView />
    </McpUseProvider>
  );
}
