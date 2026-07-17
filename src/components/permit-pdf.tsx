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
    padding: 0.75in 1in;
    overflow: hidden;
    position: relative;
  }

  .watermark {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 5.5in; height: 5.5in;
    opacity: 0.06;
    z-index: 0;
    pointer-events: none;
  }
  .watermark img { width: 100%; height: 100%; object-fit: contain; }

  .content { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; }

  .header { text-align: center; margin-bottom: 0.3in; }
  .header .republic { font-size: 12pt; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; }
  .header .province, .header .municipality { font-size: 11pt; font-weight: bold; margin-top: 2px; }
  .header .barangay {
    font-size: 14pt; font-weight: bold; margin-top: 10px; letter-spacing: 4px;
    text-transform: uppercase; display: inline-block;
    border-bottom: 3px double #1a1a1a; padding-bottom: 2px;
  }
  .header .office { font-size: 10pt; margin-top: 4px; font-style: italic; }

  .title-section { text-align: center; margin: 0.3in 0 0.2in; }
  .title-section h1 {
    font-size: 20pt; font-weight: bold; letter-spacing: 6px; text-transform: uppercase;
    display: inline-block;
    border-top: 2px solid #1a1a1a; border-bottom: 2px solid #1a1a1a;
    padding: 6px 20px;
  }

  .permit-num { text-align: center; margin: 0.2in 0; }
  .permit-num .label { font-size: 10pt; color: #444; }
  .permit-num .number {
    font-size: 14pt; font-weight: bold; font-family: "Courier New", monospace;
    margin-top: 2px; letter-spacing: 3px;
  }

  .body-text {
    font-size: 11pt; line-height: 1.9; text-align: justify;
    margin-top: 0.25in; padding: 0 0.2in;
  }
  .body-text p { text-indent: 0.5in; margin-bottom: 6px; }

  .seal-and-sigs {
    display: flex; justify-content: space-between; align-items: flex-end;
    margin-top: auto; padding-top: 0.5in;
  }

  .sig-block { text-align: center; width: 2.2in; }
  .sig-line { border-top: 1px solid #1a1a1a; padding-top: 5px; }
  .sig-name { font-size: 10pt; font-weight: bold; }
  .sig-title { font-size: 9pt; color: #333; }

  .seal-img { width: 1.3in; height: 1.3in; }
  .seal-img img { width: 100%; height: 100%; object-fit: contain; }
</style>
</head>
<body>
  <div class="watermark"><img src="https://raw.githubusercontent.com/Nardszi/BMS/main/public/barangay-seal.png" alt=""></div>

  <div class="content">
    <div class="header">
      <div class="republic">Republic of the Philippines</div>
      <div class="province">Province of _______________</div>
      <div class="municipality">Municipality of _______________</div>
      <div class="barangay">Barangay _______________</div>
      <div class="office">Office of the Barangay Captain</div>
    </div>

    <div class="title-section">
      <h1>Business Permit</h1>
    </div>

    <div class="permit-num">
      <div class="label">Permit Number</div>
      <div class="number">${p.permitNumber}</div>
    </div>

    <div class="body-text">
      <p>To all whom it may present:</p>
      <p><b>${fullName}</b>, of legal age, Filipino, and a resident of <b>${p.address}</b>, is hereby granted this Business Permit to operate a <b>${p.businessType}</b> under the business name <b>${p.businessName}</b>.</p>
      <p>This permit is issued in accordance with the provisions of the Local Government Code of 1991 (R.A. 7160) and the Barangay Ordinances regulating business establishments within the barangay.</p>
      <p>This permit is valid from <b>${issueDate}</b> to <b>${expiryDate}</b>, unless sooner revoked or suspended for cause.</p>
    </div>

    <div class="seal-and-sigs">
      <div class="sig-block">
        <div class="sig-line">
          <div class="sig-name">${fullName}</div>
          <div class="sig-title">Permit Holder</div>
        </div>
      </div>

      <div class="seal-img">
        <img src="https://raw.githubusercontent.com/Nardszi/BMS/main/public/barangay-seal.png" alt="Barangay Seal">
      </div>

      <div class="sig-block">
        <div class="sig-line">
          <div class="sig-name">HON. _______________</div>
          <div class="sig-title">Barangay Captain</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function PermitPDF({ permit }: PermitProps) {
  const fullName = `${permit.owner.lastName}, ${permit.owner.firstName}${permit.owner.middleName ? ` ${permit.owner.middleName}` : ""}`;
  const issueDate = new Date(permit.issueDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  const expiryDate = new Date(permit.expiryDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#fff",
        width: "8.5in",
        height: "11in",
        padding: "0.75in 1in",
        fontFamily: '"Times New Roman", Times, serif',
        color: "#1a1a1a",
        boxSizing: "border-box",
      }}
    >
      {/* Watermark Background */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "5.5in", height: "5.5in",
        opacity: 0.06, zIndex: 0, pointerEvents: "none",
      }}>
        <img src="/barangay-seal.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "0.3in" }}>
          <div style={{ fontSize: "12pt", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase" }}>
            Republic of the Philippines
          </div>
          <div style={{ fontSize: "11pt", fontWeight: "bold", marginTop: "2px" }}>
            Province of _______________
          </div>
          <div style={{ fontSize: "11pt", fontWeight: "bold", marginTop: "2px" }}>
            Municipality of _______________
          </div>
          <div style={{
            fontSize: "14pt", fontWeight: "bold", marginTop: "10px", letterSpacing: "4px",
            textTransform: "uppercase", display: "inline-block",
            borderBottom: "3px double #1a1a1a", paddingBottom: "2px",
          }}>
            Barangay _______________
          </div>
          <div style={{ fontSize: "10pt", marginTop: "4px", fontStyle: "italic" }}>
            Office of the Barangay Captain
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", margin: "0.3in 0 0.2in" }}>
          <div style={{
            fontSize: "20pt", fontWeight: "bold", letterSpacing: "6px", textTransform: "uppercase",
            display: "inline-block",
            borderTop: "2px solid #1a1a1a", borderBottom: "2px solid #1a1a1a",
            padding: "6px 20px",
          }}>
            Business Permit
          </div>
        </div>

        {/* Permit Number */}
        <div style={{ textAlign: "center", margin: "0.2in 0" }}>
          <div style={{ fontSize: "10pt", color: "#444" }}>Permit Number</div>
          <div style={{
            fontSize: "14pt", fontWeight: "bold", fontFamily: '"Courier New", monospace',
            marginTop: "2px", letterSpacing: "3px",
          }}>
            {permit.permitNumber}
          </div>
        </div>

        {/* Body */}
        <div style={{ fontSize: "11pt", lineHeight: "1.9", textAlign: "justify", marginTop: "0.25in", padding: "0 0.2in" }}>
          <p style={{ textIndent: "0.5in", marginBottom: "6px" }}>
            To all whom it may present:
          </p>
          <p style={{ textIndent: "0.5in", marginBottom: "6px" }}>
            <b>{fullName}</b>, of legal age, Filipino, and a resident of <b>{permit.address}</b>,
            is hereby granted this Business Permit to operate a <b>{permit.businessType}</b> under
            the business name <b>{permit.businessName}</b>.
          </p>
          <p style={{ textIndent: "0.5in", marginBottom: "6px" }}>
            This permit is issued in accordance with the provisions of the Local Government Code
            of 1991 (R.A. 7160) and the Barangay Ordinances regulating business establishments
            within the barangay.
          </p>
          <p style={{ textIndent: "0.5in", marginBottom: "6px" }}>
            This permit is valid from <b>{issueDate}</b> to <b>{expiryDate}</b>,
            unless sooner revoked or suspended for cause.
          </p>
        </div>

        {/* Seal + Signatures */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          marginTop: "auto", paddingTop: "0.5in",
        }}>
          <div style={{ textAlign: "center", width: "2.2in" }}>
            <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "5px" }}>
              <div style={{ fontSize: "10pt", fontWeight: "bold" }}>{fullName}</div>
              <div style={{ fontSize: "9pt", color: "#333" }}>Permit Holder</div>
            </div>
          </div>

          <div style={{ width: "1.3in", height: "1.3in" }}>
            <img src="/barangay-seal.png" alt="Barangay Seal" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>

          <div style={{ textAlign: "center", width: "2.2in" }}>
            <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "5px" }}>
              <div style={{ fontSize: "10pt", fontWeight: "bold" }}>HON. _______________</div>
              <div style={{ fontSize: "9pt", color: "#333" }}>Barangay Captain</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
