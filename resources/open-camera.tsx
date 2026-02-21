import { useState, useEffect, useRef, useCallback } from "react";
import { McpUseProvider, useWidget, useWidgetTheme, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const propSchema = z.object({
  status: z.string(),
  camera: z.string(),
  reason: z.string(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Open camera for photo capture with live preview",
  props: propSchema,
};

type Props = z.infer<typeof propSchema>;

// ─── Icons ──────────────────────────────────────────────

function CameraIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function FlipIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}

function RetakeIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
    </svg>
  );
}

function DownloadIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ─── Pending state: Activating camera animation ─────────

function ActivatingView() {
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
        ? "linear-gradient(160deg, #0a0f1a 0%, #111827 40%, #0f172a 100%)"
        : "linear-gradient(160deg, #f8fafc 0%, #f0f9ff 40%, #ecfeff 100%)",
      borderRadius: "20px",
      minWidth: "360px",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes cam-pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes cam-pulse-ring-delay {
          0% { transform: scale(1); opacity: 0; }
          25% { transform: scale(1); opacity: 0.4; }
          75% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes cam-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes cam-lens-glow {
          0%, 100% { box-shadow: 0 0 12px rgba(6, 182, 212, 0.3); }
          50% { box-shadow: 0 0 24px rgba(6, 182, 212, 0.6); }
        }
      `}</style>

      <div style={{ position: "relative", marginBottom: "28px" }}>
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          border: `2px solid ${isDark ? "rgba(6, 182, 212, 0.3)" : "rgba(8, 145, 178, 0.25)"}`,
          animation: "cam-pulse-ring 2s ease-out infinite",
        }} />
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          border: `2px solid ${isDark ? "rgba(6, 182, 212, 0.2)" : "rgba(8, 145, 178, 0.15)"}`,
          animation: "cam-pulse-ring-delay 2s ease-out infinite 0.6s",
        }} />

        <div style={{
          width: "88px",
          height: "88px",
          borderRadius: "50%",
          background: isDark
            ? "linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)"
            : "linear-gradient(135deg, #22d3ee 0%, #06b6d4 50%, #0891b2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isDark
            ? "0 0 40px rgba(6, 182, 212, 0.35), 0 0 80px rgba(6, 182, 212, 0.15)"
            : "0 0 30px rgba(6, 182, 212, 0.3), 0 0 60px rgba(6, 182, 212, 0.1)",
          animation: "cam-bob 2.5s ease-in-out infinite, cam-lens-glow 2s ease-in-out infinite",
          position: "relative",
          zIndex: 1,
        }}>
          <CameraIcon size={36} color="white" />
        </div>
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: "20px",
        padding: "10px 20px",
        borderRadius: "20px",
        background: isDark ? "rgba(6, 182, 212, 0.1)" : "rgba(6, 182, 212, 0.08)",
        border: `1px solid ${isDark ? "rgba(6, 182, 212, 0.15)" : "rgba(6, 182, 212, 0.1)"}`,
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: isDark ? "#22d3ee" : "#06b6d4",
            opacity: dotCount > i ? 1 : 0.3,
            transition: "opacity 0.3s ease",
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
        Activating camera{".".repeat(dotCount)}
      </p>
      <p style={{
        fontSize: "13px",
        color: isDark ? "#64748b" : "#94a3b8",
        margin: "8px 0 0",
        fontWeight: 500,
      }}>
        Requesting access to your device
      </p>
    </div>
  );
}

// ─── Active state: Camera capture (getUserMedia with file input fallback) ────

function CameraActiveView({ props }: { props: Props }) {
  const theme = useWidgetTheme();
  const isDark = theme === "dark";

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"loading" | "live" | "fallback" | "captured">("loading");
  const [captured, setCaptured] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    props.camera === "rear" ? "environment" : "user"
  );
  const [flashActive, setFlashActive] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Try getUserMedia first, fall back to file input if blocked
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setMode("loading");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setMode("live");
        };
      }
    } catch {
      // getUserMedia blocked (iframe permissions) — use file input fallback
      setMode("fallback");
    }
  }, []);

  useEffect(() => {
    if (!captured) {
      startCamera(facingMode);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode, captured, startCamera]);

  const handleCaptureLive = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCaptured(dataUrl);
    setMode("captured");

    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCaptured(dataUrl);
      setMode("captured");
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCaptured(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFlip = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleDownload = () => {
    if (!captured) return;
    const link = document.createElement("a");
    link.href = captured;
    link.download = `capture-${Date.now()}.jpg`;
    link.click();
  };

  const bg = isDark
    ? "linear-gradient(160deg, #0a0f1a 0%, #111827 40%, #0f172a 100%)"
    : "linear-gradient(160deg, #f8fafc 0%, #f0f9ff 40%, #ecfeff 100%)";

  const accentColor = isDark ? "#22d3ee" : "#06b6d4";
  const accentBg = isDark ? "rgba(6, 182, 212, 0.12)" : "rgba(6, 182, 212, 0.08)";
  const accentBorder = isDark ? "rgba(6, 182, 212, 0.2)" : "rgba(6, 182, 212, 0.15)";
  const labelColor = isDark ? "#64748b" : "#94a3b8";
  const valueColor = isDark ? "#e2e8f0" : "#1e293b";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "24px 20px 28px",
      fontFamily: "'SF Pro Display', 'Segoe UI', system-ui, -apple-system, sans-serif",
      background: bg,
      borderRadius: "20px",
      minWidth: "360px",
      maxWidth: "440px",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(8px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
    }}>
      <style>{`
        @keyframes cam-scale-in {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes cam-flash {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
        @keyframes cam-live-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes cam-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Hidden canvas for live capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Hidden file input for fallback capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture={facingMode === "user" ? "user" : "environment"}
        onChange={handleFileCapture}
        style={{ display: "none" }}
      />

      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "16px",
        width: "100%",
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: isDark
            ? "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
            : "linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "cam-scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        }}>
          <CameraIcon size={18} color="white" />
        </div>
        <div>
          <h2 style={{
            fontSize: "17px",
            fontWeight: 700,
            color: valueColor,
            margin: 0,
            letterSpacing: "-0.02em",
          }}>
            {mode === "captured" ? "Photo Captured" : "Camera Active"}
          </h2>
          {props.reason && (
            <p style={{
              fontSize: "12px",
              color: labelColor,
              margin: "2px 0 0",
              fontWeight: 500,
            }}>
              {props.reason}
            </p>
          )}
        </div>

        {/* Live indicator (only in getUserMedia mode) */}
        {mode === "live" && (
          <div style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 12px",
            borderRadius: "100px",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
          }}>
            <div style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#ef4444",
              animation: "cam-live-dot 1.5s ease-in-out infinite",
              boxShadow: "0 0 6px rgba(239, 68, 68, 0.5)",
            }} />
            <span style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#ef4444",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}>
              Live
            </span>
          </div>
        )}
      </div>

      {/* Camera viewport */}
      <div style={{
        width: "100%",
        aspectRatio: "4/3",
        borderRadius: "14px",
        overflow: "hidden",
        position: "relative",
        background: isDark ? "#111827" : "#e2e8f0",
        border: `2px solid ${mode === "captured" ? accentBorder : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)")}`,
        marginBottom: "16px",
      }}>
        {/* Flash overlay */}
        {flashActive && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "white",
            zIndex: 10,
            animation: "cam-flash 0.2s ease-out forwards",
          }} />
        )}

        {/* Loading shimmer */}
        {mode === "loading" && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: isDark
              ? "linear-gradient(90deg, #111827 0%, #1e293b 50%, #111827 100%)"
              : "linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)",
            backgroundSize: "200% 100%",
            animation: "cam-shimmer 1.5s ease-in-out infinite",
          }} />
        )}

        {/* Fallback mode: tap to open camera */}
        {mode === "fallback" && (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              textAlign: "center",
              cursor: "pointer",
              transition: "background 0.2s ease",
            }}
          >
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: isDark
                ? "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
                : "linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              boxShadow: isDark
                ? "0 0 30px rgba(6, 182, 212, 0.3)"
                : "0 0 20px rgba(6, 182, 212, 0.2)",
            }}>
              <CameraIcon size={32} color="white" />
            </div>
            <p style={{
              fontSize: "16px",
              fontWeight: 700,
              color: valueColor,
              margin: "0 0 6px",
            }}>
              Tap to Open Camera
            </p>
            <p style={{
              fontSize: "12px",
              color: labelColor,
              margin: 0,
              fontWeight: 500,
              lineHeight: 1.4,
            }}>
              Opens your device camera to take a photo
            </p>
          </div>
        )}

        {/* Live video feed (getUserMedia mode) */}
        {(mode === "live" || mode === "loading") && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: facingMode === "user" ? "scaleX(-1)" : "none",
              display: mode === "live" ? "block" : "none",
            }}
          />
        )}

        {/* Captured photo */}
        {mode === "captured" && captured && (
          <img
            src={captured}
            alt="Captured photo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* Corner viewfinder marks (live mode only) */}
        {mode === "live" && (
          <>
            {[
              { top: "12px", left: "12px", borderTop: true, borderLeft: true },
              { top: "12px", right: "12px", borderTop: true, borderRight: true },
              { bottom: "12px", left: "12px", borderBottom: true, borderLeft: true },
              { bottom: "12px", right: "12px", borderBottom: true, borderRight: true },
            ].map((pos, i) => (
              <div key={i} style={{
                position: "absolute",
                width: "24px",
                height: "24px",
                ...Object.fromEntries(
                  Object.entries(pos).filter(([k]) => ["top", "bottom", "left", "right"].includes(k))
                ),
                borderColor: "rgba(255,255,255,0.6)",
                borderStyle: "solid",
                borderWidth: 0,
                ...(pos.borderTop ? { borderTopWidth: "2px" } : {}),
                ...(pos.borderBottom ? { borderBottomWidth: "2px" } : {}),
                ...(pos.borderLeft ? { borderLeftWidth: "2px" } : {}),
                ...(pos.borderRight ? { borderRightWidth: "2px" } : {}),
                borderRadius: "4px",
              }} />
            ))}
          </>
        )}
      </div>

      {/* Controls */}
      {mode === "live" ? (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          width: "100%",
        }}>
          <button
            onClick={handleFlip}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <FlipIcon size={18} color={isDark ? "#94a3b8" : "#64748b"} />
          </button>

          <button
            onClick={handleCaptureLive}
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              border: `3px solid ${accentColor}`,
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
              padding: 0,
            }}
          >
            <div style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: accentColor,
              transition: "transform 0.1s ease",
            }} />
          </button>

          <div style={{ width: "44px", height: "44px" }} />
        </div>
      ) : mode === "fallback" ? (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          width: "100%",
        }}>
          <button
            onClick={() => {
              setFacingMode("user");
              setTimeout(() => fileInputRef.current?.click(), 50);
            }}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "14px 20px",
              borderRadius: "12px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              color: isDark ? "#e2e8f0" : "#1e293b",
              fontFamily: "inherit",
              transition: "all 0.15s ease",
            }}
          >
            <CameraIcon size={16} color={isDark ? "#94a3b8" : "#64748b"} />
            Selfie
          </button>
          <button
            onClick={() => {
              setFacingMode("environment");
              setTimeout(() => fileInputRef.current?.click(), 50);
            }}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "14px 20px",
              borderRadius: "12px",
              border: "none",
              background: isDark
                ? "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
                : "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              color: "white",
              fontFamily: "inherit",
              boxShadow: isDark
                ? "0 4px 16px rgba(6, 182, 212, 0.3)"
                : "0 4px 12px rgba(6, 182, 212, 0.25)",
              transition: "all 0.15s ease",
            }}
          >
            <CameraIcon size={16} color="white" />
            Take Photo
          </button>
        </div>
      ) : mode === "captured" ? (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          width: "100%",
        }}>
          <button
            onClick={handleRetake}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 20px",
              borderRadius: "12px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              color: isDark ? "#e2e8f0" : "#1e293b",
              fontFamily: "inherit",
              transition: "all 0.15s ease",
            }}
          >
            <RetakeIcon size={16} color={isDark ? "#94a3b8" : "#64748b"} />
            Retake
          </button>

          <button
            onClick={handleDownload}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 20px",
              borderRadius: "12px",
              border: "none",
              background: isDark
                ? "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
                : "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              color: "white",
              fontFamily: "inherit",
              boxShadow: isDark
                ? "0 4px 16px rgba(6, 182, 212, 0.3)"
                : "0 4px 12px rgba(6, 182, 212, 0.25)",
              transition: "all 0.15s ease",
            }}
          >
            <DownloadIcon size={16} color="white" />
            Save Photo
          </button>
        </div>
      ) : null}

      {/* Status badge */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 18px",
        borderRadius: "100px",
        background: accentBg,
        border: `1px solid ${accentBorder}`,
        marginTop: "16px",
      }}>
        <div style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: accentColor,
          animation: mode === "captured" ? "none" : "cam-live-dot 2s ease-in-out infinite",
          boxShadow: `0 0 6px ${isDark ? "rgba(34, 211, 238, 0.5)" : "rgba(6, 182, 212, 0.5)"}`,
        }} />
        <CameraIcon size={14} color={accentColor} />
        <span style={{
          fontSize: "12px",
          color: accentColor,
          fontWeight: 700,
          letterSpacing: "0.02em",
        }}>
          {mode === "captured" ? "Photo ready" : mode === "live" ? "Camera active" : mode === "fallback" ? "Ready to capture" : "Initializing..."}
        </span>
      </div>
    </div>
  );
}

// ─── Main widget export ──────────────────────────────────

export default function OpenCamera() {
  const { props, isPending } = useWidget<Props>();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <ActivatingView />
      </McpUseProvider>
    );
  }

  return (
    <McpUseProvider autoSize>
      <CameraActiveView props={props} />
    </McpUseProvider>
  );
}
