"use client";

import { formatDate } from "@/lib/utils";

interface IDCardData {
  idNumber: string;
  photoUrl: string | null;
  issueDate: string;
  expiryDate: string;
  status: string;
  address: string;
  contactNumber: string | null;
  resident: {
    firstName: string;
    lastName: string;
    middleName: string | null;
    birthDate: string;
    gender: string;
    civilStatus: string;
    contactNumber: string | null;
    household: { address: string; purok: string };
  };
}

interface IDCardPDFProps {
  data: IDCardData;
  showPrintLayout?: boolean;
  captureId?: string;
}

const PX_W = 1013;
const PX_H = 638;

export function IDCardPDF({ data, showPrintLayout = false, captureId }: IDCardPDFProps) {
  const r = data.resident;
  const fullName = `${r.lastName}, ${r.firstName}${r.middleName ? ` ${r.middleName}` : ""}`;
  const birthDate = formatDate(r.birthDate);
  const expiry = formatDate(data.expiryDate);
  const issued = formatDate(data.issueDate);

  // ─── SCREEN FRONT ───
  const front = (
    <div style={{ position: "relative", width: "3.375in", height: "2.125in", overflow: "hidden", border: "2px solid #1e3a5f", borderRadius: 8, backgroundColor: "#fff", fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", backgroundColor: "#1e3a5f", padding: "3px 8px", gap: 4 }}>
        <img src="/barangay-seal.png" alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>BARANGAY IX — DAAN BANWA</div>
          <div style={{ fontSize: 5, color: "#93c5fd" }}>City of Victorias, Negros Occidental</div>
        </div>
      </div>

      {/* Body: Photo | Details */}
      <div style={{ display: "flex", gap: 6, padding: "4px 8px 1px" }}>
        {/* Photo */}
        <div style={{ flexShrink: 0 }}>
          {data.photoUrl ? (
            <img src={data.photoUrl} alt="" style={{ width: "0.85in", height: "1in", objectFit: "cover", border: "1.5px solid #1e3a5f", borderRadius: 3 }} />
          ) : (
            <div style={{ width: "0.85in", height: "1in", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px dashed #94a3b8", borderRadius: 3, backgroundColor: "#f1f5f9", fontSize: 6, color: "#94a3b8" }}>No Photo</div>
          )}
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Name */}
          <div style={{ fontSize: 10, fontWeight: 700, color: "#0f172a", lineHeight: 1.15, borderBottom: "1px solid #cbd5e1", paddingBottom: 1, marginBottom: 2 }}>{fullName}</div>
          {/* Fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px", fontSize: 7, color: "#334155", lineHeight: 1.7 }}>
            <div><span style={{ color: "#64748b" }}>Date of Birth:</span> {birthDate}</div>
            <div><span style={{ color: "#64748b" }}>Sex:</span> {r.gender}</div>
            <div><span style={{ color: "#64748b" }}>Civil Status:</span> {r.civilStatus}</div>
            <div><span style={{ color: "#64748b" }}>Contact:</span> {data.contactNumber || "—"}</div>
          </div>
          <div style={{ fontSize: 7, color: "#334155", lineHeight: 1.7 }}><span style={{ color: "#64748b" }}>Address:</span> {data.address}</div>
        </div>
      </div>

      {/* ID Number Bar */}
      <div style={{ backgroundColor: "#1e3a5f", padding: "2px 8px", textAlign: "center" }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", letterSpacing: 1.5 }}>{data.idNumber}</span>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "1px 8px" }}>
        <span style={{ fontSize: 4.5, color: "#94a3b8" }}>Valid: {issued} — {expiry}</span>
        <span style={{ fontSize: 4.5, color: "#94a3b8" }}>Issued by: <b style={{ color: "#475569" }}>Barangay IX</b></span>
      </div>
    </div>
  );

  // ─── SCREEN BACK ───
  const back = (
    <div style={{ position: "relative", width: "3.375in", height: "2.125in", overflow: "hidden", border: "2px solid #1e3a5f", borderRadius: 8, backgroundColor: "#fff", fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#1e3a5f", padding: "3px 8px", textAlign: "center" }}>
        <div style={{ fontSize: 7, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>BARANGAY IDENTIFICATION CARD</div>
      </div>

      {/* Body */}
      <div style={{ padding: "4px 8px", display: "flex", flexDirection: "column" }}>
        {/* Emergency */}
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 3, padding: "3px 6px", marginBottom: 3 }}>
          <div style={{ fontSize: 5, fontWeight: 700, color: "#991b1b" }}>⚠ IN CASE OF EMERGENCY</div>
          <div style={{ fontSize: 5, color: "#7f1d1d" }}>Contact: <b>{r.lastName}</b> — {r.contactNumber || "N/A"}</div>
        </div>

        {/* Bottom row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flex: 1 }}>
          {/* QR */}
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "0.4in", height: "0.4in", border: "1px solid #cbd5e1", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", marginBottom: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, padding: 2 }}>
                {Array.from({ length: 49 }).map((_, i) => (
                  <div key={i} style={{ width: 2, height: 2, backgroundColor: [0,1,2,6,7,8,14,20,28,34,40,41,42,46,47,48].includes(i) ? "#1e3a5f" : "transparent" }} />
                ))}
              </div>
            </div>
            <div style={{ fontSize: 3.5, color: "#64748b" }}>Scan to Verify</div>
          </div>

          {/* Signature */}
          <div style={{ textAlign: "center", flex: 1, margin: "0 8px" }}>
            <div style={{ width: "100%", borderBottom: "1px solid #94a3b8", marginBottom: 2 }} />
            <div style={{ fontSize: 5, fontWeight: 700, color: "#1e293b" }}>HON. JUAN DELA CRUZ</div>
            <div style={{ fontSize: 4, color: "#64748b" }}>Barangay Captain</div>
          </div>

          {/* Barcode */}
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", gap: 0.5, justifyContent: "center", marginBottom: 1 }}>
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} style={{ width: i % 3 === 0 ? 1.5 : 0.8, height: "0.3in", backgroundColor: "#1e3a5f" }} />
              ))}
            </div>
            <div style={{ fontSize: 4, color: "#64748b" }}>{data.idNumber}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "1px 8px", textAlign: "center" }}>
        <div style={{ fontSize: 4, color: "#94a3b8" }}>This card is property of Barangay IX — Daan Banwa. If found, please return to the Barangay Hall.</div>
      </div>
    </div>
  );

  // ─── PIXEL FRONT (for PDF capture) ───
  const frontPx = (
    <div id={captureId ? `${captureId}-front` : undefined} style={{ position: "relative", width: PX_W, height: PX_H, overflow: "hidden", border: "3px solid #1e3a5f", borderRadius: 14, backgroundColor: "#fff", fontFamily: "Arial, Helvetica, sans-serif", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", backgroundColor: "#1e3a5f", padding: "10px 24px", gap: 14 }}>
        <img src="/barangay-seal.png" alt="" style={{ width: 52, height: 52, objectFit: "contain" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: 1.15 }}>BARANGAY IX — DAAN BANWA</div>
          <div style={{ fontSize: 15, color: "#93c5fd" }}>City of Victorias, Negros Occidental</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", gap: 16, padding: "12px 22px 8px" }}>
        {/* Photo */}
        <div style={{ flexShrink: 0 }}>
          {data.photoUrl ? (
            <img src={data.photoUrl} alt="" style={{ width: 190, height: 220, objectFit: "cover", border: "3px solid #1e3a5f", borderRadius: 4 }} />
          ) : (
            <div style={{ width: 190, height: 220, display: "flex", alignItems: "center", justifyContent: "center", border: "3px dashed #94a3b8", borderRadius: 4, backgroundColor: "#f1f5f9", fontSize: 18, color: "#94a3b8" }}>No Photo</div>
          )}
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Name */}
          <div style={{ fontSize: 30, fontWeight: 700, color: "#0f172a", lineHeight: 1.15, borderBottom: "2px solid #cbd5e1", paddingBottom: 6, marginBottom: 10 }}>{fullName}</div>
          {/* Fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 28px", fontSize: 22, color: "#334155", lineHeight: 1.6 }}>
            <div><span style={{ color: "#64748b" }}>Date of Birth:</span> {birthDate}</div>
            <div><span style={{ color: "#64748b" }}>Sex:</span> {r.gender}</div>
            <div><span style={{ color: "#64748b" }}>Civil Status:</span> {r.civilStatus}</div>
            <div><span style={{ color: "#64748b" }}>Contact:</span> {data.contactNumber || "—"}</div>
          </div>
          <div style={{ marginTop: 6, fontSize: 20, color: "#334155" }}><span style={{ color: "#64748b" }}>Address:</span> {data.address}</div>
        </div>
      </div>

      {/* ID Number Bar */}
      <div style={{ backgroundColor: "#1e3a5f", padding: "6px 24px", textAlign: "center" }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: 3 }}>{data.idNumber}</span>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", borderTop: "2px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "5px 22px", fontSize: 13, color: "#94a3b8" }}>
        <span>Valid: {issued} — {expiry}</span>
        <span>Issued by: <b style={{ color: "#475569" }}>Barangay IX</b></span>
      </div>
    </div>
  );

  // ─── PIXEL BACK (for PDF capture) ───
  const backPx = (
    <div id={captureId ? `${captureId}-back` : undefined} style={{ position: "relative", width: PX_W, height: PX_H, overflow: "hidden", border: "3px solid #1e3a5f", borderRadius: 14, backgroundColor: "#fff", fontFamily: "Arial, Helvetica, sans-serif", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#1e3a5f", padding: "10px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: 2 }}>BARANGAY IDENTIFICATION CARD</div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 22px", display: "flex", flexDirection: "column" }}>
        {/* Emergency */}
        <div style={{ backgroundColor: "#fef2f2", border: "2px solid #fecaca", borderRadius: 6, padding: "10px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#991b1b", marginBottom: 3 }}>⚠ IN CASE OF EMERGENCY</div>
          <div style={{ fontSize: 15, color: "#7f1d1d", lineHeight: 1.5 }}>Contact: <b style={{ fontSize: 16 }}>{r.lastName}</b> — {r.contactNumber || "N/A"}</div>
        </div>

        {/* Bottom row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flex: 1 }}>
          {/* QR */}
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 80, height: 80, border: "2px solid #cbd5e1", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", marginBottom: 4 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, padding: 4 }}>
                {Array.from({ length: 49 }).map((_, i) => (
                  <div key={i} style={{ width: 7, height: 7, backgroundColor: [0,1,2,6,7,8,14,20,28,34,40,41,42,46,47,48].includes(i) ? "#1e3a5f" : "transparent" }} />
                ))}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Scan to Verify</div>
          </div>

          {/* Signature */}
          <div style={{ textAlign: "center", flex: 1, margin: "0 24px" }}>
            <div style={{ width: "100%", borderBottom: "2px solid #94a3b8", marginBottom: 6 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>HON. JUAN DELA CRUZ</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Barangay Captain</div>
          </div>

          {/* Barcode */}
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", gap: 2, justifyContent: "center", marginBottom: 4 }}>
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} style={{ width: i % 3 === 0 ? 4 : 2, height: 70, backgroundColor: "#1e3a5f" }} />
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{data.idNumber}</div>
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div style={{ position: "absolute", right: "50%", bottom: "25%", transform: "translateX(50%)", opacity: 0.04, pointerEvents: "none" }}>
        <img src="/barangay-seal.png" alt="" style={{ width: 200, height: 200, objectFit: "contain" }} />
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderTop: "2px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "5px 22px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>This card is property of Barangay IX — Daan Banwa. If found, please return to the Barangay Hall.</div>
      </div>
    </div>
  );

  if (showPrintLayout) {
    return (
      <div className="print-area">
        <div className="flex gap-6">
          <div><p className="mb-1 text-center text-xs font-medium text-gray-500">FRONT</p>{front}</div>
          <div><p className="mb-1 text-center text-xs font-medium text-gray-500">BACK</p>{back}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start justify-center gap-6">
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-gray-500">Front</p>
          {front}
        </div>
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-gray-500">Back</p>
          {back}
        </div>
      </div>
      {captureId && (
        <div style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -1, pointerEvents: "none" }}>
          {frontPx}
          {backPx}
        </div>
      )}
    </>
  );
}
