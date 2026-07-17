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

export function buildPermitHTML(p: PermitProps["permit"]): string {
  const owner = p.owner;
  const fullName = `${owner.lastName}, ${owner.firstName}${owner.middleName ? ` ${owner.middleName}` : ""}`;
  const issueDate = new Date(p.issueDate).toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });
  const expiryDate = new Date(p.expiryDate).toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Business Permit - ${p.permitNumber}</title>
<style>
  @page { size: letter; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Times New Roman", Times, serif;
    color: #1a1a1a;
    background: #fff;
    width: 8.5in;
    height: 11in;
    padding: 0.8in 1in;
    overflow: hidden;
  }
  .header { text-align: center; margin-bottom: 0.4in; }
  .header .republic { font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; }
  .header .province { font-size: 12px; font-weight: bold; margin-top: 3px; }
  .header .municipality { font-size: 12px; font-weight: bold; margin-top: 3px; }
  .header .barangay { font-size: 15px; font-weight: bold; margin-top: 10px; letter-spacing: 3px; text-decoration: underline; text-decoration-style: double; }
  .header .office { font-size: 12px; margin-top: 3px; }
  .title { text-align: center; margin: 0.35in 0; }
  .title span {
    font-size: 18px; font-weight: bold; letter-spacing: 4px; text-transform: uppercase;
    border-bottom: 3px double #1a1a1a; padding-bottom: 6px; display: inline-block;
  }
  .permit-num { text-align: center; margin: 0.25in 0; }
  .permit-num .label { font-size: 12px; }
  .permit-num .number { font-size: 16px; font-weight: bold; font-family: monospace; margin-top: 3px; letter-spacing: 2px; }
  .body { font-size: 12px; line-height: 1.8; text-align: justify; margin-top: 0.3in; }
  .body p { text-indent: 0.5in; margin-bottom: 8px; }
  .signatures {
    display: flex; justify-content: space-between;
    margin-top: 1in; padding: 0 0.3in;
  }
  .sig-block { text-align: center; width: 2.5in; }
  .sig-line { border-top: 1px solid #1a1a1a; padding-top: 6px; font-size: 11px; }
  .sig-name { font-weight: bold; }
  .sig-title { font-size: 10px; }
</style>
</head>
<body>
  <div class="header">
    <div class="republic">Republic of the Philippines</div>
    <div class="province">Province of _______________</div>
    <div class="municipality">Municipality of _______________</div>
    <div class="barangay">BARANGAY _______________</div>
    <div class="office">Office of the Barangay Captain</div>
  </div>

  <div class="title"><span>BUSINESS PERMIT</span></div>

  <div class="permit-num">
    <div class="label">Permit Number</div>
    <div class="number">${p.permitNumber}</div>
  </div>

  <div class="body">
    <p>To all whom it may present: <b>${fullName}</b>, of legal age, Filipino, and a resident of <b>${p.address}</b>, is hereby granted this Business Permit to operate a <b>${p.businessType}</b> under the business name <b>${p.businessName}</b>.</p>
    <p>This permit is issued in accordance with the provisions of the Local Government Code of 1991 (R.A. 7160) and the Barangay Ordinances regulating business establishments within the barangay.</p>
    <p>This permit is valid from <b>${issueDate}</b> to <b>${expiryDate}</b>, unless sooner revoked or suspended for cause.</p>
  </div>

  <div class="signatures">
    <div class="sig-block">
      <div class="sig-line">
        <div class="sig-name">${fullName}</div>
        <div class="sig-title">Permit Holder</div>
      </div>
    </div>
    <div class="sig-block">
      <div class="sig-line">
        <div class="sig-name">HON. _______________</div>
        <div class="sig-title">Barangay Captain</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function PermitPDF({ permit }: PermitProps) {
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

      <div style={{ textAlign: "center", margin: "0.3in 0" }}>
        <div style={{ fontSize: "13px" }}>Permit Number</div>
        <div style={{ fontSize: "18px", fontWeight: "bold", fontFamily: "monospace", marginTop: "4px", letterSpacing: "2px" }}>
          {permit.permitNumber}
        </div>
      </div>

      <div style={{ fontSize: "13px", lineHeight: "1.8", textAlign: "justify" }}>
        <p style={{ textIndent: "0.5in" }}>
          To all whom it may present: <b>{`${permit.owner.lastName}, ${permit.owner.firstName}${permit.owner.middleName ? ` ${permit.owner.middleName}` : ""}`}</b>, of legal age,
          Filipino, and a resident of <b>{permit.address}</b>, is hereby granted this
          Business Permit to operate a <b>{permit.businessType}</b> under the business
          name <b>{permit.businessName}</b>.
        </p>
        <p style={{ textIndent: "0.5in" }}>
          This permit is issued in accordance with the provisions of the
          Local Government Code of 1991 (R.A. 7160) and the Barangay
          Ordinances regulating business establishments within the barangay.
        </p>
        <p style={{ textIndent: "0.5in" }}>
          This permit is valid from <b>{new Date(permit.issueDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</b> to <b>{new Date(permit.expiryDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</b>,
          unless sooner revoked or suspended for cause.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.2in", padding: "0 0.5in" }}>
        <div style={{ textAlign: "center", width: "2.5in" }}>
          <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "6px", fontSize: "12px" }}>
            <div style={{ fontWeight: "bold" }}>{`${permit.owner.lastName}, ${permit.owner.firstName}`}</div>
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
