import { createContext, useCallback, useContext, useRef, useState } from "react";
import { C } from "../constants/colors";

/* ── Toast config ─────────────────────────────────────────────────────────────
   Each toast: { id, message, type, icon }
   type: 'success' | 'error' | 'info' | 'warning' | 'delete'
 */
const TYPES = {
  success: { bg: C.sageBg,   border: C.sage,     text: C.sage,     icon: "✓" },
  error:   { bg: C.roseBg,   border: C.rose,     text: C.rose,     icon: "✕" },
  warning: { bg: C.amberBg,  border: C.amber,    text: C.amber,    icon: "⚠" },
  info:    { bg: C.skyBg,    border: C.sky,      text: C.sky,      icon: "ℹ" },
  delete:  { bg: "#fce8f3",  border: "#b0527a",  text: "#b0527a",  icon: "🗑" },
  upload:  { bg: C.tealBg,   border: C.teal,     text: C.teal,     icon: "⬆" },
  save:    { bg: C.lavBg,    border: C.lavender, text: C.lavender, icon: "💾" },
  lease:   { bg: C.goldBg,   border: C.gold,     text: C.gold,     icon: "📋" },
};

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timerRef = useRef({});

  const remove = useCallback((id) => {
    clearTimeout(timerRef.current[id]);
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((message, type = "success", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]); // max 5 visible
    timerRef.current[id] = setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Portal — fixed stack in bottom-right */}
      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 99999,
        display: "flex", flexDirection: "column", gap: 10,
        pointerEvents: "none",
      }}>
        {toasts.map((t) => {
          const s = TYPES[t.type] || TYPES.info;
          return (
            <div
              key={t.id}
              onClick={() => remove(t.id)}
              style={{
                pointerEvents: "auto",
                display: "flex", alignItems: "center", gap: 10,
                background: s.bg,
                border: `1.5px solid ${s.border}`,
                borderLeft: `4px solid ${s.border}`,
                borderRadius: 10,
                padding: "11px 16px 11px 14px",
                minWidth: 220, maxWidth: 340,
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                fontFamily: "Georgia,serif",
                cursor: "pointer",
                animation: "toast-in 0.22s ease",
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0, color: s.text }}>{s.icon}</span>
              <span style={{ fontSize: 13, color: C.text, lineHeight: 1.4, flex: 1 }}>{t.message}</span>
              <span style={{ fontSize: 11, color: s.text, opacity: 0.6, flexShrink: 0, marginLeft: 4 }}>✕</span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
