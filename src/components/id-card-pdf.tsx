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

  const front = (
    <div style={{ position: "relative", width: "3.375in", height: "2.125in", overflow: "hidden", border: "2px solid #1e3a5f", borderRadius: 8, backgroundColor: "#fff", fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", backgroundColor: "#1e3a5f", padding: "2px 6px", gap: 4 }}>
        <img src="/barangay-seal.png" alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />
        <div>
          <div style={{ fontSize: 6, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>BARANGAY IX — DAAN BANWA</div>
          <div style={{ fontSize: 4, color: "#93c5fd", lineHeight: 1.1 }}>City of Victorias, Negros Occidental</div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: 5, fontWeight: 700, color: "#fbbf24" }}>BARANGAY ID</div>
          <div style={{ fontSize: 4, color: "#93c5fd" }}>Republic of the Philippines</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", gap: 5, padding: "3px 6px 1px" }}>
        {/* Photo */}
        <div style={{ flexShrink: 0 }}>
          {data.photoUrl ? (
            <img src={data.photoUrl} alt="" style={{ width: "0.7in", height: "0.8in", objectFit: "cover", border: "1px solid #1e3a5f", borderRadius: 2 }} />
          ) : (
            <div style={{ width: "0.7in", height: "0.8in", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px dashed #cbd5e1", borderRadius: 2, backgroundColor: "#f1f5f9", fontSize: 6, color: "#94a3b8" }}>No Photo</div>
          )}
          {/* ID Number under photo */}
          <div style={{ marginTop: 1, backgroundColor: "#1e3a5f", padding: "1px 3px", borderRadius: 2, textAlign: "center" }}>
            <span style={{ fontSize: 5, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>{data.idNumber}</span>
          </div>
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: "#1e3a5f", lineHeight: 1.2, borderBottom: "1px solid #e2e8f0", paddingBottom: 1, marginBottom: 2 }}>{fullName}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 6px", fontSize: 4.5, color: "#334155", lineHeight: 1.5 }}>
            <div><span style={{ color: "#64748b" }}>Birthdate:</span> {birthDate}</div>
            <div><span style={{ color: "#64748b" }}>Gender:</span> {r.gender}</div>
            <div><span style={{ color: "#64748b" }}>Status:</span> {r.civilStatus}</div>
            <div><span style={{ color: "#64748b" }}>Contact:</span> {data.contactNumber || "—"}</div>
          </div>
          <div style={{ marginTop: 1, fontSize: 4.5, color: "#334155", lineHeight: 1.3 }}>
            <span style={{ color: "#64748b" }}>Address:</span>{" "}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline", maxWidth: "90%" }}>{data.address}, Purok {r.household.purok}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "1px 6px" }}>
        <span style={{ fontSize: 4, color: "#94a3b8" }}>Valid: {issued} — {expiry}</span>
        <span style={{ fontSize: 4, color: "#94a3b8" }}>Barangay IX, Victorias City</span>
      </div>
    </div>
  );

  const back = (
    <div style={{ position: "relative", width: "3.375in", height: "2.125in", overflow: "hidden", border: "2px solid #1e3a5f", borderRadius: 8, backgroundColor: "#fff", fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* Top bar */}
      <div style={{ backgroundColor: "#1e3a5f", padding: "2px 6px", textAlign: "center" }}>
        <div style={{ fontSize: 6, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>BARANGAY IDENTIFICATION CARD</div>
      </div>

      {/* Body */}
      <div style={{ padding: "3px 6px", display: "flex", flexDirection: "column", height: "calc(100% - 42px)" }}>
        {/* Emergency Contact */}
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 3, padding: "3px 5px", marginBottom: 3 }}>
          <div style={{ fontSize: 5, fontWeight: 700, color: "#991b1b", marginBottom: 1 }}>⚠ IN CASE OF EMERGENCY</div>
          <div style={{ fontSize: 4.5, color: "#7f1d1d", lineHeight: 1.4 }}>
            Contact: <b>{r.lastName}</b> — {r.contactNumber || "N/A"}
          </div>
        </div>

        {/* Verification & Signature Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flex: 1 }}>
          {/* QR Code */}
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "0.4in", height: "0.4in", border: "1px solid #cbd5e1", borderRadius: 2, backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", marginBottom: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, padding: 2 }}>
                {Array.from({ length: 49 }).map((_, i) => (
                  <div key={i} style={{ width: 2, height: 2, backgroundColor: [0,1,2,6,7,8,14,20,28,34,40,41,42,46,47,48].includes(i) ? "#1e3a5f" : "transparent" }} />
                ))}
              </div>
            </div>
            <div style={{ fontSize: 3.5, color: "#64748b" }}>Scan to Verify</div>
          </div>

          {/* Captain Signature */}
          <div style={{ textAlign: "center", flex: 1, margin: "0 8px" }}>
            <div style={{ width: "100%", borderBottom: "1px solid #94a3b8", marginBottom: 2 }} />
            <div style={{ fontSize: 5, fontWeight: 700, color: "#1e293b" }}>HON. JUAN DELA CRUZ</div>
            <div style={{ fontSize: 4, color: "#64748b" }}>Barangay Captain</div>
          </div>

          {/* Barcode placeholder */}
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "0.4in", height: "0.4in", display: "flex", alignItems: "center", justifyContent: "center", gap: 1, margin: "0 auto", marginBottom: 1 }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ width: i % 3 === 0 ? 2 : 1, height: "0.35in", backgroundColor: "#1e3a5f", borderRadius: 0.5 }} />
              ))}
            </div>
            <div style={{ fontSize: 3.5, color: "#64748b" }}>{data.idNumber}</div>
          </div>
        </div>

        {/* Barangay Seal watermark */}
        <div style={{ position: "absolute", right: "50%", bottom: "35%", transform: "translateX(50%)", opacity: 0.04, pointerEvents: "none" }}>
          <img src="/barangay-seal.png" alt="" style={{ width: "1.5in", height: "1.5in", objectFit: "contain" }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "1px 6px", textAlign: "center" }}>
        <div style={{ fontSize: 3.5, color: "#94a3b8" }}>This card is property of Barangay IX — Daan Banwa. If found, please return to the Barangay Hall.</div>
      </div>
    </div>
  );

  // Pixel-based cards for PDF capture
  const frontPx = (
    <div id={captureId ? `${captureId}-front` : undefined} style={{ position: "relative", width: PX_W, height: PX_H, overflow: "hidden", border: "3px solid #1e3a5f", borderRadius: 14, backgroundColor: "#fff", fontFamily: "Arial, Helvetica, sans-serif", boxSizing: "border-box" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", backgroundColor: "#1e3a5f", padding: "8px 20px", gap: 12 }}>
        <img src="/barangay-seal.png" alt="" style={{ width: 44, height: 44, objectFit: "contain" }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>BARANGAY IX — DAAN BANWA</div>
          <div style={{ fontSize: 13, color: "#93c5fd", lineHeight: 1.1 }}>City of Victorias, Negros Occidental</div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fbbf24" }}>BARANGAY ID</div>
          <div style={{ fontSize: 11, color: "#93c5fd" }}>Republic of the Philippines</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", gap: 14, padding: "12px 18px 6px" }}>
        {/* Photo + ID */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {data.photoUrl ? (
            <img src={data.photoUrl} alt="" style={{ width: 190, height: 215, objectFit: "cover", border: "3px solid #1e3a5f", borderRadius: 4 }} />
          ) : (
            <div style={{ width: 190, height: 215, display: "flex", alignItems: "center", justifyContent: "center", border: "3px dashed #cbd5e1", borderRadius: 4, backgroundColor: "#f1f5f9", fontSize: 16, color: "#94a3b8" }}>No Photo</div>
          )}
          <div style={{ marginTop: 6, backgroundColor: "#1e3a5f", padding: "4px 16px", borderRadius: 4, textAlign: "center", width: "100%" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: 1.5 }}>{data.idNumber}</span>
          </div>
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#1e3a5f", lineHeight: 1.2, borderBottom: "2px solid #e2e8f0", paddingBottom: 4, marginBottom: 8 }}>{fullName}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px", fontSize: 14, color: "#334155", lineHeight: 1.5 }}>
            <div><span style={{ color: "#64748b" }}>Birthdate:</span> {birthDate}</div>
            <div><span style={{ color: "#64748b" }}>Gender:</span> {r.gender}</div>
            <div><span style={{ color: "#64748b" }}>Civil Status:</span> {r.civilStatus}</div>
            <div><span style={{ color: "#64748b" }}>Contact:</span> {data.contactNumber || "—"}</div>
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: "#334155", lineHeight: 1.3 }}>
            <span style={{ color: "#64748b" }}>Address:</span> {data.address}, Purok {r.household.purok}
          </div>
          <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8" }}>
            <span>Valid: {issued} — {expiry}</span>
            <span>Barangay IX, Victorias City</span>
          </div>
        </div>
      </div>
    </div>
  );

  const backPx = (
    <div id={captureId ? `${captureId}-back` : undefined} style={{ position: "relative", width: PX_W, height: PX_H, overflow: "hidden", border: "3px solid #1e3a5f", borderRadius: 14, backgroundColor: "#fff", fontFamily: "Arial, Helvetica, sans-serif", boxSizing: "border-box" }}>
      {/* Top bar */}
      <div style={{ backgroundColor: "#1e3a5f", padding: "8px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: 2 }}>BARANGAY IDENTIFICATION CARD</div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", height: "calc(100% - 44px)" }}>
        {/* Emergency Contact */}
        <div style={{ backgroundColor: "#fef2f2", border: "2px solid #fecaca", borderRadius: 6, padding: "10px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#991b1b", marginBottom: 4 }}>⚠ IN CASE OF EMERGENCY</div>
          <div style={{ fontSize: 14, color: "#7f1d1d", lineHeight: 1.5 }}>
            Contact: <b style={{ fontSize: 15 }}>{r.lastName}</b> — {r.contactNumber || "N/A"}
          </div>
        </div>

        {/* QR + Signature + Barcode */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flex: 1 }}>
          {/* QR Code */}
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 80, height: 80, border: "2px solid #cbd5e1", borderRadius: 4, backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", marginBottom: 4 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, padding: 4 }}>
                {Array.from({ length: 49 }).map((_, i) => (
                  <div key={i} style={{ width: 7, height: 7, backgroundColor: [0,1,2,6,7,8,14,20,28,34,40,41,42,46,47,48].includes(i) ? "#1e3a5f" : "transparent" }} />
                ))}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Scan to Verify</div>
          </div>

          {/* Captain Signature */}
          <div style={{ textAlign: "center", flex: 1, margin: "0 24px" }}>
            <div style={{ width: "100%", borderBottom: "2px solid #94a3b8", marginBottom: 6 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>HON. JUAN DELA CRUZ</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Barangay Captain</div>
          </div>

          {/* Barcode */}
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center", gap: 2, margin: "0 auto", marginBottom: 4 }}>
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} style={{ width: i % 3 === 0 ? 4 : 2, height: 70, backgroundColor: "#1e3a5f", borderRadius: 1 }} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{data.idNumber}</div>
          </div>
        </div>

        {/* Watermark */}
        <div style={{ position: "absolute", right: "50%", bottom: "30%", transform: "translateX(50%)", opacity: 0.04, pointerEvents: "none" }}>
          <img src="/barangay-seal.png" alt="" style={{ width: 200, height: 200, objectFit: "contain" }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderTop: "2px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "4px 20px", textAlign: "center" }}>
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
