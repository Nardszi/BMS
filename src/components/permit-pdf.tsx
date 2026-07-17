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
    width: 8.5in; height: 11in;
    padding: 0.55in 0.85in;
    overflow: hidden;
    position: relative;
  }
  .watermark {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 5in; height: 5in;
    opacity: 0.06; z-index: 0; pointer-events: none;
  }
  .watermark img { width: 100%; height: 100%; object-fit: contain; }

  .content { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; }

  .header { text-align: center; margin-bottom: 0.15in; }
  .header .republic { font-size: 11pt; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; }
  .header .province, .header .municipality { font-size: 10pt; font-weight: bold; margin-top: 1px; }
  .header .barangay {
    font-size: 13pt; font-weight: bold; margin-top: 6px; letter-spacing: 3px;
    text-transform: uppercase; display: inline-block;
    border-bottom: 3px double #1a1a1a; padding-bottom: 1px;
  }
  .header .office { font-size: 9pt; margin-top: 2px; font-style: italic; }

  .title-section { text-align: center; margin: 0.15in 0 0.1in; }
  .title-section h1 {
    font-size: 18pt; font-weight: bold; letter-spacing: 5px; text-transform: uppercase;
    display: inline-block;
    border-top: 2px solid #1a1a1a; border-bottom: 2px solid #1a1a1a;
    padding: 4px 16px;
  }

  .permit-num { text-align: center; margin: 0.1in 0; }
  .permit-num .label { font-size: 9pt; color: #444; }
  .permit-num .number {
    font-size: 13pt; font-weight: bold; font-family: "Courier New", monospace;
    margin-top: 1px; letter-spacing: 2px;
  }

  .body-text { font-size: 10.5pt; line-height: 1.7; text-align: justify; margin-top: 0.15in; padding: 0 0.15in; }
  .body-text p { text-indent: 0.45in; margin-bottom: 4px; }

  .seal-and-sigs {
    display: flex; justify-content: space-between; align-items: flex-end;
    margin-top: auto; padding-top: 0.3in;
  }
  .sig-block { text-align: center; width: 2in; }
  .sig-line { border-top: 1px solid #1a1a1a; padding-top: 4px; }
  .sig-name { font-size: 9pt; font-weight: bold; }
  .sig-title { font-size: 8pt; color: #333; }

  .seal-img { width: 1.15in; height: 1.15in; }
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
    <div class="title-section"><h1>Business Permit</h1></div>
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
      <div class="sig-block"><div class="sig-line"><div class="sig-name">${fullName}</div><div class="sig-title">Permit Holder</div></div></div>
      <div class="seal-img"><img src="https://raw.githubusercontent.com/Nardszi/BMS/main/public/barangay-seal.png" alt="Seal"></div>
      <div class="sig-block"><div class="sig-line"><div class="sig-name">HON. _______________</div><div class="sig-title">Barangay Captain</div></div></div>
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
    <div style={{
      position: "relative", overflow: "hidden", background: "#fff",
      width: "8.5in", height: "11in", padding: "0.55in 0.85in",
      fontFamily: '"Times New Roman", Times, serif', color: "#1a1a1a",
      boxSizing: "border-box",
    }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "5in", height: "5in", opacity: 0.06, zIndex: 0, pointerEvents: "none",
      }}>
        <img src="/barangay-seal.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ textAlign: "center", marginBottom: "0.15in" }}>
          <div style={{ fontSize: "11pt", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase" }}>Republic of the Philippines</div>
          <div style={{ fontSize: "10pt", fontWeight: "bold", marginTop: "1px" }}>Province of _______________</div>
          <div style={{ fontSize: "10pt", fontWeight: "bold", marginTop: "1px" }}>Municipality of _______________</div>
          <div style={{ fontSize: "13pt", fontWeight: "bold", marginTop: "6px", letterSpacing: "3px", textTransform: "uppercase", display: "inline-block", borderBottom: "3px double #1a1a1a", paddingBottom: "1px" }}>Barangay _______________</div>
          <div style={{ fontSize: "9pt", marginTop: "2px", fontStyle: "italic" }}>Office of the Barangay Captain</div>
        </div>

        <div style={{ textAlign: "center", margin: "0.15in 0 0.1in" }}>
          <div style={{ fontSize: "18pt", fontWeight: "bold", letterSpacing: "5px", textTransform: "uppercase", display: "inline-block", borderTop: "2px solid #1a1a1a", borderBottom: "2px solid #1a1a1a", padding: "4px 16px" }}>Business Permit</div>
        </div>

        <div style={{ textAlign: "center", margin: "0.1in 0" }}>
          <div style={{ fontSize: "9pt", color: "#444" }}>Permit Number</div>
          <div style={{ fontSize: "13pt", fontWeight: "bold", fontFamily: '"Courier New", monospace', marginTop: "1px", letterSpacing: "2px" }}>{permit.permitNumber}</div>
        </div>

        <div style={{ fontSize: "10.5pt", lineHeight: "1.7", textAlign: "justify", marginTop: "0.15in", padding: "0 0.15in" }}>
          <p style={{ textIndent: "0.45in", marginBottom: "4px" }}>To all whom it may present:</p>
          <p style={{ textIndent: "0.45in", marginBottom: "4px" }}><b>{fullName}</b>, of legal age, Filipino, and a resident of <b>{permit.address}</b>, is hereby granted this Business Permit to operate a <b>{permit.businessType}</b> under the business name <b>{permit.businessName}</b>.</p>
          <p style={{ textIndent: "0.45in", marginBottom: "4px" }}>This permit is issued in accordance with the provisions of the Local Government Code of 1991 (R.A. 7160) and the Barangay Ordinances regulating business establishments within the barangay.</p>
          <p style={{ textIndent: "0.45in", marginBottom: "4px" }}>This permit is valid from <b>{issueDate}</b> to <b>{expiryDate}</b>, unless sooner revoked or suspended for cause.</p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto", paddingTop: "0.3in" }}>
          <div style={{ textAlign: "center", width: "2in" }}>
            <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "4px" }}>
              <div style={{ fontSize: "9pt", fontWeight: "bold" }}>{fullName}</div>
              <div style={{ fontSize: "8pt", color: "#333" }}>Permit Holder</div>
            </div>
          </div>
          <div style={{ width: "1.15in", height: "1.15in" }}>
            <img src="/barangay-seal.png" alt="Barangay Seal" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div style={{ textAlign: "center", width: "2in" }}>
            <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "4px" }}>
              <div style={{ fontSize: "9pt", fontWeight: "bold" }}>HON. _______________</div>
              <div style={{ fontSize: "8pt", color: "#333" }}>Barangay Captain</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
