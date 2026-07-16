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

// CR80: 85.60mm x 53.98mm at 300 DPI = 1013 x 638 pixels
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
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: "#1e3a5f", padding: "3px 8px" }}>
        <img src="/barangay-seal.png" alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>BARANGAY IX - DAAN BANWA</div>
          <div style={{ fontSize: 5, color: "#93c5fd", lineHeight: 1.2 }}>City of Victorias, Negros Occidental</div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: "flex", gap: 6, padding: "4px 8px 2px" }}>
        {/* PHOTO */}
        <div style={{ flexShrink: 0 }}>
          {data.photoUrl ? (
            <img src={data.photoUrl} alt="Photo" style={{ width: "0.75in", height: "0.85in", objectFit: "cover", border: "1px solid #d1d5db", borderRadius: 3 }} />
          ) : (
            <div style={{ width: "0.75in", height: "0.85in", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px dashed #d1d5db", borderRadius: 3, backgroundColor: "#f9fafb", fontSize: 7, color: "#9ca3af" }}>No Photo</div>
          )}
        </div>

        {/* DETAILS */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: "#111827", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{fullName}</div>
          <div style={{ fontSize: 5, color: "#4b5563", lineHeight: 1.4 }}>
            <div><b>DOB:</b> {birthDate}</div>
            <div><b>Gender:</b> {r.gender}</div>
            <div><b>Civil Status:</b> {r.civilStatus}</div>
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><b>Address:</b> {data.address}</div>
            {data.contactNumber && <div><b>Contact:</b> {data.contactNumber}</div>}
          </div>
          <div style={{ marginTop: 2, backgroundColor: "#eff6ff", padding: "1px 4px", borderRadius: 3, textAlign: "center" }}>
            <span style={{ fontSize: 6, fontWeight: 700, color: "#1e3a5f" }}>{data.idNumber}</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", borderTop: "1px solid #dbeafe", backgroundColor: "#eff6ff", padding: "2px 8px" }}>
        <span style={{ fontSize: 5, color: "#6b7280" }}>Valid: {issued} - {expiry}</span>
        <span style={{ fontSize: 5, color: "#6b7280" }}>Issued By: <b>Barangay IX</b></span>
      </div>
    </div>
  );

  const back = (
    <div style={{ position: "relative", width: "3.375in", height: "2.125in", overflow: "hidden", border: "2px solid #1e3a5f", borderRadius: 8, backgroundColor: "#fff", fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* HEADER */}
      <div style={{ backgroundColor: "#1e3a5f", padding: "3px 8px", textAlign: "center" }}>
        <div style={{ fontSize: 7, fontWeight: 700, color: "#fff" }}>BARANGAY IDENTIFICATION CARD</div>
      </div>

      {/* BODY */}
      <div style={{ padding: "4px 8px" }}>
        <div style={{ fontSize: 6, fontWeight: 700, color: "#374151", marginBottom: 2 }}>EMERGENCY CONTACT</div>
        <div style={{ backgroundColor: "#f9fafb", padding: "3px 6px", borderRadius: 3, fontSize: 5, color: "#4b5563" }}>
          In case of emergency, please contact:<br />
          <b>{r.lastName} - {r.contactNumber || "N/A"}</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 6 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "0.35in", height: "0.35in", border: "1px solid #d1d5db", borderRadius: 3, backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", marginBottom: 2 }}>
              <img src="/barangay-seal.png" alt="" style={{ width: 16, height: 16, objectFit: "contain", opacity: 0.4 }} />
            </div>
            <div style={{ fontSize: 4, color: "#6b7280" }}>Barangay Seal</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "0.9in", borderBottom: "1px solid #9ca3af", marginBottom: 2 }} />
            <div style={{ fontSize: 5, fontWeight: 600, color: "#374151" }}>HON. JUAN DELA CRUZ</div>
            <div style={{ fontSize: 4, color: "#6b7280" }}>Barangay Captain</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "0.35in", height: "0.35in", border: "1px solid #d1d5db", borderRadius: 3, backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", marginBottom: 2 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1 }}>
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} style={{ width: 2, height: 2, backgroundColor: Math.random() > 0.5 ? "#000" : "transparent" }} />
                ))}
              </div>
            </div>
            <div style={{ fontSize: 4, color: "#6b7280" }}>Scan to Verify</div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderTop: "1px solid #dbeafe", backgroundColor: "#eff6ff", padding: "2px 8px", textAlign: "center" }}>
        <div style={{ fontSize: 4, color: "#6b7280" }}>This card is property of Barangay IX - Daan Banwa. Found card please return to the Barangay Hall.</div>
      </div>
    </div>
  );

  // Pixel-based card for JPEG capture (hidden)
  const frontPx = (
    <div id={captureId ? `${captureId}-front` : undefined} style={{ position: "relative", width: PX_W, height: PX_H, overflow: "hidden", border: "2px solid #1e3a5f", borderRadius: 12, backgroundColor: "#fff", fontFamily: "Arial, Helvetica, sans-serif", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#1e3a5f", padding: "10px 20px" }}>
        <img src="/barangay-seal.png" alt="" style={{ width: 44, height: 44, objectFit: "contain" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: 0.5 }}>BARANGAY IX - DAAN BANWA</div>
          <div style={{ fontSize: 14, color: "#93c5fd", lineHeight: 1.2 }}>City of Victorias, Negros Occidental</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, padding: "14px 20px 8px" }}>
        <div style={{ flexShrink: 0 }}>
          {data.photoUrl ? (
            <img src={data.photoUrl} alt="Photo" style={{ width: 200, height: 230, objectFit: "cover", border: "2px solid #d1d5db", borderRadius: 6 }} />
          ) : (
            <div style={{ width: 200, height: 230, display: "flex", alignItems: "center", justifyContent: "center", border: "3px dashed #d1d5db", borderRadius: 6, backgroundColor: "#f9fafb", fontSize: 18, color: "#9ca3af" }}>No Photo</div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111827", lineHeight: 1.2, marginBottom: 8 }}>{fullName}</div>
          <div style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.6 }}>
            <div><b>DOB:</b> {birthDate}</div>
            <div><b>Gender:</b> {r.gender}</div>
            <div><b>Civil Status:</b> {r.civilStatus}</div>
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><b>Address:</b> {data.address}</div>
            {data.contactNumber && <div><b>Contact:</b> {data.contactNumber}</div>}
          </div>
          <div style={{ marginTop: 10, backgroundColor: "#eff6ff", padding: "6px 14px", borderRadius: 6, textAlign: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f", letterSpacing: 1 }}>{data.idNumber}</span>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", borderTop: "2px solid #dbeafe", backgroundColor: "#eff6ff", padding: "8px 20px" }}>
        <span style={{ fontSize: 13, color: "#6b7280" }}>Valid: {issued} - {expiry}</span>
        <span style={{ fontSize: 13, color: "#6b7280" }}>Issued By: <b style={{ color: "#374151" }}>Barangay IX</b></span>
      </div>
    </div>
  );

  const backPx = (
    <div id={captureId ? `${captureId}-back` : undefined} style={{ position: "relative", width: PX_W, height: PX_H, overflow: "hidden", border: "2px solid #1e3a5f", borderRadius: 12, backgroundColor: "#fff", fontFamily: "Arial, Helvetica, sans-serif", boxSizing: "border-box" }}>
      <div style={{ backgroundColor: "#1e3a5f", padding: "10px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>BARANGAY IDENTIFICATION CARD</div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 8 }}>EMERGENCY CONTACT</div>
        <div style={{ backgroundColor: "#f9fafb", padding: "10px 14px", borderRadius: 6, fontSize: 15, color: "#4b5563", lineHeight: 1.5 }}>
          In case of emergency, please contact:<br />
          <b style={{ fontSize: 16 }}>{r.lastName} - {r.contactNumber || "N/A"}</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 24 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 70, height: 70, border: "2px solid #d1d5db", borderRadius: 6, backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", marginBottom: 6 }}>
              <img src="/barangay-seal.png" alt="" style={{ width: 44, height: 44, objectFit: "contain", opacity: 0.4 }} />
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Barangay Seal</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 180, borderBottom: "2px solid #9ca3af", marginBottom: 6 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>HON. JUAN DELA CRUZ</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Barangay Captain</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 70, height: 70, border: "2px solid #d1d5db", borderRadius: 6, backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", marginBottom: 6 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3 }}>
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} style={{ width: 9, height: 9, backgroundColor: Math.random() > 0.5 ? "#000" : "transparent" }} />
                ))}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Scan to Verify</div>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderTop: "2px solid #dbeafe", backgroundColor: "#eff6ff", padding: "8px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#6b7280" }}>This card is property of Barangay IX - Daan Banwa. Found card please return to the Barangay Hall.</div>
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
      {/* Screen display: side by side, natural size */}
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

      {/* Hidden pixel-based cards for JPEG capture */}
      {captureId && (
        <div style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -1, pointerEvents: "none" }}>
          {frontPx}
          {backPx}
        </div>
      )}
    </>
  );
}
