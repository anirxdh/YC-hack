import React, { useState, useEffect, useRef } from "react";
import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

// ─── Widget metadata ─────────────────────────────────────

const propSchema = z.object({
  status: z.string(),
  greeting: z.string().optional(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Lark AI Communication Suite — phone, camera, messages, and more",
  props: propSchema,
};

type Props = z.infer<typeof propSchema>;
type ActiveTool = "phone" | "facetime" | "music" | "video" | "camera" | "messages" | null;

// ─── Shared styles ───────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  fontSize: "14px",
  fontWeight: 300,
  letterSpacing: "0.025em",
  border: "none",
  outline: "none",
  textAlign: "center",
  fontFamily: "inherit",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  fontSize: "13px",
  lineHeight: 1.6,
  resize: "none",
};

const spinnerStyle: React.CSSProperties = {
  width: "14px",
  height: "14px",
  border: "2px solid rgba(255,255,255,0.3)",
  borderTop: "2px solid white",
  borderRadius: "50%",
  animation: "lark-spin 0.6s linear infinite",
};

function btnStyle(color: string, disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 0",
    borderRadius: "12px",
    background: color,
    color: "white",
    fontWeight: 500,
    fontSize: "13px",
    border: "none",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.2 : 1,
    pointerEvents: disabled ? "none" : "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontFamily: "inherit",
    transition: "opacity 0.15s",
  };
}

function resultStyle(color: string): React.CSSProperties {
  return {
    padding: "8px 12px",
    borderRadius: "12px",
    background: `${color}14`,
    border: `1px solid ${color}1a`,
    textAlign: "center",
  };
}

// ─── SVG Icons ───────────────────────────────────────────

const icons = {
  phone: (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20, color: "white" }}>
      <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" />
    </svg>
  ),
  facetime: (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20, color: "white" }}>
      <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
    </svg>
  ),
  music: (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20, color: "white" }}>
      <path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z" />
    </svg>
  ),
  camera: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20, color: "white" }}>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  video: (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20, color: "white" }}>
      <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19 31.68 31.68 0 000 12a31.68 31.68 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.68 31.68 0 0024 12a31.68 31.68 0 00-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20, color: "white" }}>
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    </svg>
  ),
};

const apps: { id: ActiveTool; label: string; gradient: string; icon: React.ReactNode }[] = [
  { id: "phone", label: "Phone", gradient: "linear-gradient(to bottom, #62d84e, #2eb83a)", icon: icons.phone },
  { id: "facetime", label: "FaceTime", gradient: "linear-gradient(to bottom, #62d84e, #2eb83a)", icon: icons.facetime },
  { id: "music", label: "Music", gradient: "linear-gradient(to bottom, #fc5c7d, #e6233b)", icon: icons.music },
  { id: "camera", label: "Camera", gradient: "linear-gradient(to bottom, #6b7280, #374151)", icon: icons.camera },
  { id: "video", label: "YouTube", gradient: "linear-gradient(to bottom, #ff0000, #cc0000)", icon: icons.video },
  { id: "messages", label: "Messages", gradient: "linear-gradient(to bottom, #34d399, #059669)", icon: icons.messages },
];

// ─── Panels ──────────────────────────────────────────────

function PhonePanel() {
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("Hello, this is a call from Lark.");
  const [status, setStatus] = useState<"idle" | "calling" | "done" | "error">("idle");
  const [result, setResult] = useState("");

  const { callTool } = useWidget<Props>();

  const execute = async () => {
    if (!number.trim()) return;
    setStatus("calling");
    setResult("");
    try {
      const res = await callTool("make-call", { to: number, message });
      setResult(res?.result || "Call initiated");
      setStatus("done");
    } catch (err: any) {
      setResult(err?.message || "Call failed");
      setStatus("error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <input
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && execute()}
        placeholder="+1 (555) 000-0000"
        style={inputStyle}
      />
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message to speak…"
        style={{ ...inputStyle, fontSize: "12px" }}
      />
      <button onClick={execute} disabled={!number.trim() || status === "calling"} style={btnStyle("#22c55e", !number.trim() || status === "calling")}>
        {status === "calling" ? <div style={spinnerStyle} /> : "Call"}
      </button>
      {result && (
        <div style={resultStyle(status === "error" ? "#ef4444" : "#22c55e")}>
          <p style={{ color: status === "error" ? "#f87171" : "#4ade80", fontSize: "12px", margin: 0 }}>{result}</p>
        </div>
      )}
    </div>
  );
}

function CameraPanel() {
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "calling" | "done" | "error">("idle");
  const [result, setResult] = useState("");

  const { callTool } = useWidget<Props>();

  const execute = async () => {
    setStatus("calling");
    setResult("");
    try {
      const res = await callTool("open-camera", { camera: "front", reason: reason || "Photo capture from Lark" });
      setResult(res?.result || "Camera activated");
      setStatus("done");
    } catch (err: any) {
      setResult(err?.message || "Camera failed");
      setStatus("error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && execute()}
        placeholder="Reason (optional)…"
        style={inputStyle}
      />
      <button onClick={execute} disabled={status === "calling"} style={btnStyle("#6b7280", status === "calling")}>
        {status === "calling" ? <div style={spinnerStyle} /> : "Capture"}
      </button>
      {result && (
        <div style={resultStyle(status === "error" ? "#ef4444" : "#6b7280")}>
          <p style={{ color: status === "error" ? "#f87171" : "#9ca3af", fontSize: "12px", margin: 0 }}>{result}</p>
        </div>
      )}
    </div>
  );
}

function FaceTimePanel() {
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"idle" | "calling" | "done">("idle");
  const [result, setResult] = useState("");
  const execute = () => {
    if (!contact.trim()) return;
    setStatus("calling");
    setResult("");
    setTimeout(() => { setResult(`Video session with ${contact}`); setStatus("done"); }, 1500);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <input value={contact} onChange={(e) => setContact(e.target.value)} onKeyDown={(e) => e.key === "Enter" && execute()} placeholder="name@email.com" style={inputStyle} />
      <button onClick={execute} disabled={!contact.trim() || status === "calling"} style={btnStyle("#10b981", !contact.trim() || status === "calling")}>
        {status === "calling" ? <div style={spinnerStyle} /> : "Start Call"}
      </button>
      {result && <div style={resultStyle("#10b981")}><p style={{ color: "#34d399", fontSize: "12px", margin: 0 }}>{result}</p></div>}
    </div>
  );
}

function MusicPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "calling" | "done" | "error">("idle");
  const [controlLoading, setControlLoading] = useState<string | null>(null);
  const [result, setResult] = useState("");

  const { callTool } = useWidget<Props>();

  const execute = async () => {
    if (!query.trim()) return;
    setStatus("calling");
    setResult("");
    try {
      const res = await callTool("youtube__play", { query });
      setResult(res?.result || `Now playing: "${query}"`);
      setStatus("done");
    } catch (err: any) {
      setResult(err?.message || "Playback failed");
      setStatus("error");
    }
  };

  const control = async (tool: string, label: string) => {
    setControlLoading(label);
    try {
      const res = await callTool(`youtube__${tool}`, {});
      setResult(res?.result || `${label} done`);
      setStatus("done");
    } catch (err: any) {
      setResult(err?.message || `${label} failed`);
      setStatus("error");
    }
    setControlLoading(null);
  };

  const controlBtnStyle = (loading: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "8px 0",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    fontSize: "14px",
    border: "none",
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.4 : 0.7,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
    transition: "opacity 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && execute()} placeholder="Song, artist, or mood…" style={inputStyle} />
      <button onClick={execute} disabled={!query.trim() || status === "calling"} style={btnStyle("#e11d48", !query.trim() || status === "calling")}>
        {status === "calling" ? <div style={spinnerStyle} /> : "Play"}
      </button>
      {/* Transport controls */}
      <div style={{ display: "flex", gap: "6px" }}>
        <button onClick={() => control("previous-track", "Prev")} disabled={!!controlLoading} style={controlBtnStyle(controlLoading === "Prev")}>
          {controlLoading === "Prev" ? <div style={{ ...spinnerStyle, width: "10px", height: "10px" }} /> : "⏮"}
        </button>
        <button onClick={() => control("pause-resume", "Pause")} disabled={!!controlLoading} style={controlBtnStyle(controlLoading === "Pause")}>
          {controlLoading === "Pause" ? <div style={{ ...spinnerStyle, width: "10px", height: "10px" }} /> : "⏯"}
        </button>
        <button onClick={() => control("next-track", "Next")} disabled={!!controlLoading} style={controlBtnStyle(controlLoading === "Next")}>
          {controlLoading === "Next" ? <div style={{ ...spinnerStyle, width: "10px", height: "10px" }} /> : "⏭"}
        </button>
        <button onClick={() => control("now-playing", "Now")} disabled={!!controlLoading} style={controlBtnStyle(controlLoading === "Now")}>
          {controlLoading === "Now" ? <div style={{ ...spinnerStyle, width: "10px", height: "10px" }} /> : "🎵"}
        </button>
      </div>
      {result && <div style={resultStyle(status === "error" ? "#ef4444" : "#e11d48")}><p style={{ color: status === "error" ? "#f87171" : "#fb7185", fontSize: "11px", margin: 0, lineHeight: 1.4 }}>{result}</p></div>}
    </div>
  );
}

function VideoPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "calling" | "done" | "error">("idle");
  const [action, setAction] = useState<"search" | "play">("search");
  const [result, setResult] = useState("");

  const { callTool } = useWidget<Props>();

  const search = async () => {
    if (!query.trim()) return;
    setStatus("calling");
    setAction("search");
    setResult("");
    try {
      const res = await callTool("youtube__search", { query });
      setResult(res?.result || `Results for: "${query}"`);
      setStatus("done");
    } catch (err: any) {
      setResult(err?.message || "Search failed");
      setStatus("error");
    }
  };

  const play = async () => {
    if (!query.trim()) return;
    setStatus("calling");
    setAction("play");
    setResult("");
    try {
      const res = await callTool("youtube__play", { query });
      setResult(res?.result || `Playing: "${query}"`);
      setStatus("done");
    } catch (err: any) {
      setResult(err?.message || "Playback failed");
      setStatus("error");
    }
  };

  const addToQueue = async () => {
    if (!query.trim()) return;
    setStatus("calling");
    setResult("");
    try {
      const res = await callTool("youtube__add-to-queue", { query });
      setResult(res?.result || `Added to queue: "${query}"`);
      setStatus("done");
    } catch (err: any) {
      setResult(err?.message || "Queue failed");
      setStatus("error");
    }
  };

  const isDisabled = !query.trim() || status === "calling";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Search YouTube…" style={inputStyle} />
      <div style={{ display: "flex", gap: "6px" }}>
        <button onClick={search} disabled={isDisabled} style={{ ...btnStyle("#dc2626", isDisabled), flex: 1 }}>
          {status === "calling" && action === "search" ? <div style={spinnerStyle} /> : "Search"}
        </button>
        <button onClick={play} disabled={isDisabled} style={{ ...btnStyle("#dc2626", isDisabled), flex: 1 }}>
          {status === "calling" && action === "play" ? <div style={spinnerStyle} /> : "Play"}
        </button>
      </div>
      <button onClick={addToQueue} disabled={isDisabled} style={{
        ...btnStyle("transparent", isDisabled),
        border: "1px solid rgba(220,38,38,0.3)",
        color: "#f87171",
        fontSize: "11px",
        padding: "7px 0",
      }}>
        {status === "calling" && action !== "search" && action !== "play" ? <div style={spinnerStyle} /> : "+ Queue"}
      </button>
      {result && <div style={resultStyle(status === "error" ? "#ef4444" : "#dc2626")}><p style={{ color: status === "error" ? "#f87171" : "#f87171", fontSize: "11px", margin: 0, lineHeight: 1.4 }}>{result}</p></div>}
    </div>
  );
}

function MessagesPanel() {
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "calling" | "done">("idle");
  const [result, setResult] = useState("");
  const execute = () => {
    if (!to.trim() || !message.trim()) return;
    setStatus("calling");
    setResult("");
    setTimeout(() => { setResult(`Sent to ${to}`); setStatus("done"); setMessage(""); }, 1500);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Contact or number…" style={inputStyle} />
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message…" rows={2} style={textareaStyle} />
      <button onClick={execute} disabled={!to.trim() || !message.trim() || status === "calling"} style={btnStyle("#10b981", !to.trim() || !message.trim() || status === "calling")}>
        {status === "calling" ? <div style={spinnerStyle} /> : "Send"}
      </button>
      {result && <div style={resultStyle("#10b981")}><p style={{ color: "#34d399", fontSize: "12px", margin: 0 }}>{result}</p></div>}
    </div>
  );
}

// ─── App Ring ────────────────────────────────────────────

const RADIUS = 120;
const START_ANGLE = -90;
const STAGGER_MS = 80;
const ICONS_START = 400;

function AppRing({ onSelect, active }: { onSelect: (t: ActiveTool) => void; active: ActiveTool }) {
  const [booted, setBooted] = useState(false);
  const count = apps.length;
  const step = 360 / count;

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), ICONS_START + count * STAGGER_MS + 500);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {apps.map((app, i) => {
        const angle = START_ANGLE + i * step;
        const rad = (angle * Math.PI) / 180;
        const ringX = Math.cos(rad) * RADIUS;
        const ringY = Math.sin(rad) * RADIUS;

        const isSelected = active === app.id;
        const isOther = active !== null && !isSelected;

        let tx: number, ty: number, opacity: number, scale: number;
        if (!active) {
          tx = ringX; ty = ringY; opacity = 1; scale = 1;
        } else if (isSelected) {
          tx = 60; ty = 0; opacity = 1; scale = 1.5;
        } else {
          tx = 0; ty = 0; opacity = 0; scale = 0;
        }

        return (
          <div
            key={app.id}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              pointerEvents: isOther ? "none" : "auto",
              ...(booted
                ? {
                    opacity,
                    transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${scale})`,
                    transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease",
                  }
                : {
                    opacity: 0,
                    animation: `lark-orbit-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${ICONS_START + i * STAGGER_MS}ms forwards`,
                    // CSS custom properties for animation target
                    ["--tx" as any]: `calc(-50% + ${ringX}px)`,
                    ["--ty" as any]: `calc(-50% + ${ringY}px)`,
                  }),
            }}
          >
            <button
              onClick={() => onSelect(isSelected ? null : app.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <div
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "50%",
                  background: app.gradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
                  transition: "transform 0.1s ease-out",
                }}
              >
                {app.icon}
              </div>
              <span style={{
                fontSize: "9px",
                fontWeight: 500,
                color: isSelected ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)",
                transition: "color 0.3s",
              }}>
                {app.label}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Active Panel ────────────────────────────────────────

function ActivePanel({ tool }: { tool: ActiveTool }) {
  if (!tool) return null;

  const panelMap: Record<string, React.ReactNode> = {
    phone: <PhonePanel />,
    camera: <CameraPanel />,
    facetime: <FaceTimePanel />,
    music: <MusicPanel />,
    video: <VideoPanel />,
    messages: <MessagesPanel />,
  };

  return (
    <div style={{
      position: "absolute",
      left: "calc(50% + 100px)",
      top: "50%",
      transform: "translateY(-50%)",
      width: "220px",
      padding: "16px",
      borderRadius: "20px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
      backdropFilter: "blur(20px)",
      animation: "lark-panel-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
    }}>
      {panelMap[tool] || null}
    </div>
  );
}

// ─── Main Lark App ───────────────────────────────────────

function LarkApp() {
  const [active, setActive] = useState<ActiveTool>(null);
  const [showClock, setShowClock] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const date = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const handleLogoClick = () => {
    if (active) { setActive(null); return; }
    if (showClock) return;
    setShowClock(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowClock(false), 3000);
  };

  const handleSelect = (tool: ActiveTool) => {
    if (showClock) {
      setShowClock(false);
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    }
    setActive(tool);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div style={{
      width: "100%",
      height: "460px",
      overflow: "hidden",
      background: "black",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "16px",
      fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
      position: "relative",
    }}>
      <div style={{ position: "relative" }}>
        {/* Logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transform: active ? "translateX(-60px) scale(1.2)" : "translateX(0) scale(1)",
            transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <button
            onClick={handleLogoClick}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              position: "relative",
              zIndex: 10,
            }}
          >
            {/* Bird emoji */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              opacity: showClock ? 0 : 1,
              transform: showClock ? "scale(0.8)" : "scale(1)",
              transition: "opacity 0.3s, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              position: showClock ? "absolute" : "relative",
              pointerEvents: showClock ? "none" : "auto",
            }}>
              <span style={{ fontSize: "56px", lineHeight: 1 }}>🐦</span>
            </div>
            {/* Clock */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              opacity: showClock ? 1 : 0,
              transform: showClock ? "scale(1)" : "scale(0.9)",
              transition: "opacity 0.3s ease-out, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              position: showClock ? "relative" : "absolute",
              pointerEvents: "none",
            }}>
              <span style={{
                fontSize: "44px",
                fontWeight: 200,
                color: "white",
                letterSpacing: "-0.02em",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}>
                {time}
              </span>
              <span style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.25)",
                fontWeight: 300,
                letterSpacing: "0.1em",
                marginTop: "8px",
                textTransform: "uppercase",
              }}>
                {date}
              </span>
            </div>
          </button>
        </div>

        {/* Icon Ring */}
        <AppRing onSelect={handleSelect} active={active} />

        {/* Active Panel */}
        <ActivePanel tool={active} />
      </div>
    </div>
  );
}

// ─── CSS Animations ──────────────────────────────────────

function GlobalStyles() {
  return (
    <style>{`
      @keyframes lark-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes lark-orbit-in {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0);
        }
        100% {
          opacity: 1;
          transform: translate(var(--tx), var(--ty)) scale(1);
        }
      }
      @keyframes lark-panel-in {
        0% {
          opacity: 0;
          transform: translateY(-50%) translateX(8px) scale(0.95);
        }
        100% {
          opacity: 1;
          transform: translateY(-50%) translateX(0) scale(1);
        }
      }
      @keyframes lark-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      /* Hide placeholder color for dark inputs */
      input::placeholder, textarea::placeholder {
        color: rgba(255,255,255,0.15) !important;
      }
      input:focus, textarea:focus {
        box-shadow: 0 0 0 1px rgba(255,255,255,0.1);
      }
    `}</style>
  );
}

// ─── Widget Export ────────────────────────────────────────

export default function LarkWidget() {
  const { props, isPending } = useWidget<Props>();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <GlobalStyles />
        <div style={{
          width: "100%",
          height: "460px",
          background: "black",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
        }}>
          <span style={{ fontSize: "64px", lineHeight: 1, animation: "lark-pulse 1.5s ease-in-out infinite" }}>🐦</span>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", marginTop: "16px", fontWeight: 300, letterSpacing: "0.05em" }}>
            Waking up Lark…
          </p>
        </div>
      </McpUseProvider>
    );
  }

  return (
    <McpUseProvider autoSize>
      <GlobalStyles />
      <LarkApp />
    </McpUseProvider>
  );
}
