import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// CR80: 85.60mm x 53.98mm
const CARD_W = 85.6;
const CARD_H = 53.98;
const GAP = 10;
const PAD = 5;

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

  const pageW = CARD_W * 2 + GAP + PAD * 2;
  const pageH = CARD_H + PAD * 2;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [pageW, pageH],
  });

  pdf.addImage(frontImg, "JPEG", PAD, PAD, CARD_W, CARD_H);
  pdf.addImage(backImg, "JPEG", PAD + CARD_W + GAP, PAD, CARD_W, CARD_H);

  const safeName = lastName.replace(/[^a-zA-Z]/g, "") || "Resident";
  pdf.save(`BarangayID-${safeName}.pdf`);
}
