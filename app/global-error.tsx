"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <html lang="id">
      <body style={{ margin: 0, background: "#0a0a0a", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ maxWidth: "28rem", width: "100%", textAlign: "center" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "4rem",
                height: "4rem",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.2)",
                color: "#ef4444",
                marginBottom: "1rem"
              }}>
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                Kesalahan Sistem
              </h2>
              <p style={{ color: "#94a3b8", marginBottom: "0.25rem" }}>
                Aplikasi mengalami masalah serius. Silakan muat ulang halaman.
              </p>
              {error.digest && (
                <p style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Error ID: {error.digest}
                </p>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={reset}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: "0.75rem",
                  background: "#10b981",
                  color: "#0a0a0a",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer"
                }}
              >
                Muat Ulang
              </button>
              <button
                onClick={() => window.location.href = "/"}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #334155",
                  color: "#f1f5f9",
                  background: "transparent",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Ke Beranda
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
