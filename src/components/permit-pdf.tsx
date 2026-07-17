"use client";

interface PermitProps {
  permit: {
    permitNumber: string;
    businessName: string;
    businessType: string;
    address: string;
    issueDate: string;
    expiryDate: string;
    status: string;
    owner: {
      firstName: string;
      lastName: string;
      middleName: string | null;
    };
  };
}

export function PermitPDF({ permit }: PermitProps) {
  const p = permit;
  const owner = p.owner;
  const fullName = `${owner.lastName}, ${owner.firstName}${owner.middleName ? ` ${owner.middleName}` : ""}`;
  const issueDate = new Date(p.issueDate).toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });
  const expiryDate = new Date(p.expiryDate).toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#fff",
        width: "8.5in",
        minHeight: "11in",
        padding: "1in 1.2in",
        fontFamily: '"Times New Roman", Times, serif',
        color: "#1a1a1a",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "0.5in" }}>
        <div style={{ fontSize: "14px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase" }}>
          Republic of the Philippines
        </div>
        <div style={{ fontSize: "13px", fontWeight: "bold", marginTop: "4px" }}>
          Province of _______________
        </div>
        <div style={{ fontSize: "13px", fontWeight: "bold", marginTop: "4px" }}>
          Municipality of _______________
        </div>
        <div style={{ fontSize: "16px", fontWeight: "bold", marginTop: "12px", letterSpacing: "3px", textDecoration: "underline" }}>
          BARANGAY _______________
        </div>
        <div style={{ fontSize: "13px", marginTop: "4px" }}>
          Office of the Barangay Captain
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: "center", margin: "0.4in 0" }}>
        <div style={{
          fontSize: "20px",
          fontWeight: "bold",
          letterSpacing: "4px",
          textTransform: "uppercase",
          borderBottom: "3px double #1a1a1a",
          paddingBottom: "8px",
          display: "inline-block",
        }}>
          BUSINESS PERMIT
        </div>
      </div>

      {/* Permit Number */}
      <div style={{ textAlign: "center", margin: "0.3in 0" }}>
        <div style={{ fontSize: "13px" }}>Permit Number</div>
        <div style={{ fontSize: "18px", fontWeight: "bold", fontFamily: "monospace", marginTop: "4px", letterSpacing: "2px" }}>
          {p.permitNumber}
        </div>
      </div>

      {/* Body */}
      <div style={{ fontSize: "13px", lineHeight: "1.8", textAlign: "justify" }}>
        <p style={{ textIndent: "0.5in" }}>
          To all whom it may present: <b>{fullName}</b>, of legal age,
          Filipino, and a resident of <b>{p.address}</b>, is hereby granted this
          Business Permit to operate a <b>{p.businessType}</b> under the business
          name <b>{p.businessName}</b>.
        </p>
        <p style={{ textIndent: "0.5in" }}>
          This permit is issued in accordance with the provisions of the
          Local Government Code of 1991 (R.A. 7160) and the Barangay
          Ordinances regulating business establishments within the barangay.
        </p>
        <p style={{ textIndent: "0.5in" }}>
          This permit is valid from <b>{issueDate}</b> to <b>{expiryDate}</b>,
          unless sooner revoked or suspended for cause.
        </p>
      </div>

      {/* Signatures */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.2in", padding: "0 0.5in" }}>
        <div style={{ textAlign: "center", width: "2.5in" }}>
          <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "6px", fontSize: "12px" }}>
            <div style={{ fontWeight: "bold" }}>{fullName}</div>
            <div>Permit Holder</div>
          </div>
        </div>
        <div style={{ textAlign: "center", width: "2.5in" }}>
          <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "6px", fontSize: "12px" }}>
            <div style={{ fontWeight: "bold" }}>HON. _______________</div>
            <div>Barangay Captain</div>
          </div>
        </div>
      </div>
    </div>
  );
}
