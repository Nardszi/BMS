import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// CR80: 85.60mm x 53.98mm
const CARD_W_MM = 85.6;
const CARD_H_MM = 53.98;

export async function downloadAsPDF(captureId: string, lastName: string) {
  const frontEl = document.getElementById(`${captureId}-front`);
  const backEl = document.getElementById(`${captureId}-back`);
  if (!frontEl || !backEl) return;

  const [frontCanvas, backCanvas] = await Promise.all([
    html2canvas(frontEl, { scale: 3, useCORS: true, backgroundColor: "#ffffff", logging: false }),
    html2canvas(backEl, { scale: 3, useCORS: true, backgroundColor: "#ffffff", logging: false }),
  ]);

  const frontImg = frontCanvas.toDataURL("image/jpeg", 0.95);
  const backImg = backCanvas.toDataURL("image/jpeg", 0.95);

  // Landscape PDF, CR80 card size
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [CARD_W_MM * 2 + 20, CARD_H_MM + 20],
  });

  const x = 10;
  const y = 10;

  // Front card
  pdf.setFontSize(8);
  pdf.setTextColor(128);
  pdf.text("FRONT", x + CARD_W_MM / 2, y - 2, { align: "center" });
  pdf.addImage(frontImg, "JPEG", x, y, CARD_W_MM, CARD_H_MM);

  // Back card
  pdf.text("BACK", x + CARD_W_MM + 10 + CARD_W_MM / 2, y - 2, { align: "center" });
  pdf.addImage(backImg, "JPEG", x + CARD_W_MM + 10, y, CARD_W_MM, CARD_H_MM);

  const safeName = lastName.replace(/[^a-zA-Z]/g, "") || "Resident";
  pdf.save(`BarangayID-${safeName}.pdf`);
}
