import { formatDate } from "@/lib/utils";

interface IDCardData {
  idNumber: string;
  photoUrl: string | null;
  issueDate: string;
  expiryDate: string;
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

export function downloadAsWord(data: IDCardData) {
  const r = data.resident;
  const fullName = `${r.lastName}, ${r.firstName}${r.middleName ? ` ${r.middleName}` : ""}`;
  const birthDate = formatDate(r.birthDate);
  const expiry = formatDate(data.expiryDate);
  const issued = formatDate(data.issueDate);

  const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Barangay ID - ${data.idNumber}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; }
  .header { text-align: center; background-color: #1e3a5f; color: white; padding: 10px; border-radius: 5px; }
  .header h2 { margin: 0; font-size: 16px; }
  .header p { margin: 2px 0 0; font-size: 11px; color: #b0c4de; }
  .card { border: 2px solid #1e3a5f; border-radius: 8px; padding: 15px; margin-top: 15px; }
  .card-title { font-weight: bold; color: #1e3a5f; font-size: 14px; border-bottom: 1px solid #1e3a5f; padding-bottom: 5px; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 4px 8px; font-size: 12px; vertical-align: top; }
  td.label { font-weight: bold; color: #555; width: 120px; }
  .id-number { background-color: #e8f0fe; padding: 8px; border-radius: 4px; text-align: center; font-weight: bold; font-size: 14px; color: #1e3a5f; margin-top: 10px; }
  .footer { text-align: center; font-size: 10px; color: #888; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
</style>
</head>
<body>
  <div class="header">
    <h2>BARANGAY IX - DAAN BANWA</h2>
    <p>City of Victorias, Negros Occidental</p>
  </div>

  <div class="card">
    <div class="card-title">BARANGAY IDENTIFICATION CARD</div>
    <table>
      <tr>
        <td class="label">Full Name:</td>
        <td>${fullName}</td>
      </tr>
      <tr>
        <td class="label">Date of Birth:</td>
        <td>${birthDate}</td>
      </tr>
      <tr>
        <td class="label">Gender:</td>
        <td>${r.gender}</td>
      </tr>
      <tr>
        <td class="label">Civil Status:</td>
        <td>${r.civilStatus}</td>
      </tr>
      <tr>
        <td class="label">Address:</td>
        <td>${data.address}</td>
      </tr>
      <tr>
        <td class="label">Purok:</td>
        <td>Purok ${r.household.purok}</td>
      </tr>
      ${
        data.contactNumber
          ? `<tr><td class="label">Contact No.:</td><td>${data.contactNumber}</td></tr>`
          : ""
      }
      <tr>
        <td class="label">Valid From:</td>
        <td>${issued}</td>
      </tr>
      <tr>
        <td class="label">Valid Until:</td>
        <td>${expiry}</td>
      </tr>
    </table>

    <div class="id-number">ID Number: ${data.idNumber}</div>
  </div>

  <div class="footer">
    <p>This card is property of Barangay IX - Daan Banwa. Found card please return to the Barangay Hall.</p>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `BarangayID-${data.idNumber}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
