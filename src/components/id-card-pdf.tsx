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
  forExport?: boolean;
}

// CR80 standard: 85.60mm x 53.98mm = 1013px x 638px at 300 DPI
const CR80_WIDTH_PX = 1013;
const CR80_HEIGHT_PX = 638;
const PHOTO_SIZE_PX = 288; // ~24.5mm height for photo area on card

export function IDCardPDF({ data, showPrintLayout = false, captureId, forExport }: IDCardPDFProps) {
  const r = data.resident;
  const fullName = `${r.lastName}, ${r.firstName}${r.middleName ? ` ${r.middleName}` : ""}`;
  const birthDate = formatDate(r.birthDate);
  const expiry = formatDate(data.expiryDate);
  const issued = formatDate(data.issueDate);

  const cardStyle: React.CSSProperties = forExport
    ? { width: CR80_WIDTH_PX, height: CR80_HEIGHT_PX }
    : { width: "3.375in", height: "2.125in" };

  const fontSize = forExport ? { header: 22, subheader: 14, name: 24, body: 16, small: 13, tiny: 11 }
    : { header: "7px", subheader: "5px", name: "8px", body: "6px", small: "5px", tiny: "5px" };

  const photoStyle: React.CSSProperties = forExport
    ? { width: 300, height: 300 }
    : { width: "1in", height: "1in" };

  const cardFront = (
    <div
      id={captureId ? `${captureId}-front` : undefined}
      className="relative overflow-hidden border-2 border-blue-900 bg-white shadow-lg"
      style={{ ...cardStyle, borderRadius: forExport ? 12 : undefined }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-center gap-2 bg-blue-900 px-2 py-1" style={forExport ? { padding: "10px 16px" } : {}}>
        <img src="/barangay-seal.png" alt="" className="h-6 w-6 object-contain" style={forExport ? { width: 48, height: 48 } : undefined} />
        <div className="text-center">
          <p style={{ fontSize: fontSize.header, fontWeight: 700, color: "white", lineHeight: 1.2 }}>BARANGAY IX - DAAN BANWA</p>
          <p style={{ fontSize: fontSize.subheader, color: "#93c5fd" }}>City of Victorias, Negros Occidental</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-2" style={forExport ? { padding: "16px 20px 8px", gap: 16 } : { padding: "4px 8px 2px" }}>
        {/* Photo */}
        <div className="flex-shrink-0">
          {data.photoUrl ? (
            <img
              src={data.photoUrl}
              alt="Photo"
              style={{ ...photoStyle, objectFit: "cover", border: "1px solid #d1d5db", borderRadius: 4 }}
            />
          ) : (
            <div style={{ ...photoStyle, display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed #d1d5db", borderRadius: 4, backgroundColor: "#f9fafb", fontSize: forExport ? 20 : 10, color: "#9ca3af" }}>
              No Photo
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: fontSize.name, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fullName}</p>
          <div style={{ marginTop: forExport ? 6 : 2, display: "flex", flexDirection: "column", gap: forExport ? 3 : 1 }}>
            <p style={{ fontSize: fontSize.body, color: "#4b5563" }}><span style={{ fontWeight: 600 }}>DOB:</span> {birthDate}</p>
            <p style={{ fontSize: fontSize.body, color: "#4b5563" }}><span style={{ fontWeight: 600 }}>Gender:</span> {r.gender}</p>
            <p style={{ fontSize: fontSize.body, color: "#4b5563" }}><span style={{ fontWeight: 600 }}>Civil Status:</span> {r.civilStatus}</p>
            <p style={{ fontSize: fontSize.body, color: "#4b5563", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><span style={{ fontWeight: 600 }}>Address:</span> {data.address}</p>
            {data.contactNumber && <p style={{ fontSize: fontSize.body, color: "#4b5563" }}><span style={{ fontWeight: 600 }}>Contact:</span> {data.contactNumber}</p>}
          </div>
          <div style={{ marginTop: forExport ? 8 : 3, backgroundColor: "#eff6ff", padding: forExport ? "4px 8px" : "2px 4px", borderRadius: 4 }}>
            <p style={{ fontSize: fontSize.small, fontWeight: 700, color: "#1e3a5f" }}>{data.idNumber}</p>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-blue-100 bg-blue-50" style={forExport ? { padding: "6px 16px" } : { padding: "2px 8px" }}>
        <p style={{ fontSize: fontSize.small, color: "#6b7280" }}>Valid: {issued} - {expiry}</p>
        <div className="text-right">
          <p style={{ fontSize: fontSize.tiny, color: "#6b7280" }}>Issued By:</p>
          <p style={{ fontSize: fontSize.small, fontWeight: 600, color: "#374151" }}>Barangay IX</p>
        </div>
      </div>
    </div>
  );

  const cardBack = (
    <div
      id={captureId ? `${captureId}-back` : undefined}
      className="relative overflow-hidden border-2 border-blue-900 bg-white shadow-lg"
      style={{ ...cardStyle, borderRadius: forExport ? 12 : undefined }}
    >
      {/* Header */}
      <div className="bg-blue-900" style={forExport ? { padding: "10px 16px" } : { padding: "4px 8px" }}>
        <p className="text-center" style={{ fontSize: fontSize.header, fontWeight: 700, color: "white" }}>BARANGAY IDENTIFICATION CARD</p>
      </div>

      {/* Back Content */}
      <div style={forExport ? { padding: "16px 20px 8px" } : { padding: "6px 8px 2px" }}>
        <p style={{ fontSize: fontSize.small, fontWeight: 700, color: "#374151", marginBottom: forExport ? 6 : 2 }}>EMERGENCY CONTACT</p>
        <div style={{ backgroundColor: "#f9fafb", padding: forExport ? 10 : 4, borderRadius: 4, fontSize: fontSize.body, color: "#4b5563" }}>
          <p>In case of emergency, please contact:</p>
          <p style={{ fontWeight: 600 }}>{r.lastName} - {r.contactNumber || "N/A"}</p>
        </div>

        <div className="flex items-end justify-between" style={{ marginTop: forExport ? 20 : 6 }}>
          <div className="text-center">
            <div style={forExport ? { width: 80, height: 80, border: "1px solid #d1d5db", borderRadius: 4, backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 } : { width: "0.4in", height: "0.4in", border: "1px solid #d1d5db", borderRadius: 4, backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
              <img src="/barangay-seal.png" alt="" className="h-6 w-6 object-contain opacity-30" style={forExport ? { width: 48, height: 48, opacity: 0.3 } : undefined} />
            </div>
            <p style={{ fontSize: fontSize.tiny, color: "#6b7280" }}>Barangay Seal</p>
          </div>

          <div className="text-center">
            <div style={forExport ? { width: 200, height: 60, borderBottom: "1px solid #9ca3af", marginBottom: 4 } : { width: "1.2in", height: "0.4in", borderBottom: "1px solid #9ca3af", marginBottom: 2 }} />
            <p style={{ fontSize: fontSize.small, fontWeight: 600, color: "#374151" }}>HON. JUAN DELA CRUZ</p>
            <p style={{ fontSize: fontSize.tiny, color: "#6b7280" }}>Barangay Captain</p>
          </div>

          <div className="text-center">
            <div style={forExport ? { width: 80, height: 80, border: "1px solid #d1d5db", borderRadius: 4, backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 } : { width: "0.4in", height: "0.4in", border: "1px solid #d1d5db", borderRadius: 4, backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1 }}>
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} style={{ width: forExport ? 10 : 3, height: forExport ? 10 : 3, backgroundColor: Math.random() > 0.5 ? "#000" : "transparent" }} />
                ))}
              </div>
            </div>
            <p style={{ fontSize: fontSize.tiny, color: "#6b7280" }}>Scan to Verify</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-blue-100 bg-blue-50" style={forExport ? { padding: "6px 16px" } : { padding: "2px 8px" }}>
        <p className="text-center" style={{ fontSize: fontSize.tiny, color: "#6b7280" }}>
          This card is property of Barangay IX - Daan Banwa. Found card please return to the Barangay Hall.
        </p>
      </div>
    </div>
  );

  if (showPrintLayout) {
    return (
      <div className="print-area">
        <div className="flex gap-6">
          <div>
            <p className="mb-1 text-center text-xs font-medium text-gray-500">FRONT</p>
            {cardFront}
          </div>
          <div>
            <p className="mb-1 text-center text-xs font-medium text-gray-500">BACK</p>
            {cardBack}
          </div>
        </div>
      </div>
    );
  }

  if (forExport) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {cardFront}
        {cardBack}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-center text-sm font-medium text-gray-500">Front</p>
        <div className="flex justify-center">{cardFront}</div>
      </div>
      <div>
        <p className="mb-2 text-center text-sm font-medium text-gray-500">Back</p>
        <div className="flex justify-center">{cardBack}</div>
      </div>
    </div>
  );
}
