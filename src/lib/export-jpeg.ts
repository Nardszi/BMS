import html2canvas from "html2canvas";

// CR80: 85.60mm x 53.98mm at 300 DPI = 1013 x 638 pixels
const CR80_W = 1013;
const CR80_H = 638;

export async function downloadAsJPEG(captureId: string, filename: string) {
  const el = document.getElementById(captureId);
  if (!el) return;

  const canvas = await html2canvas(el, {
    width: CR80_W,
    height: CR80_H,
    scale: 1,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const link = document.createElement("a");
  link.download = `${filename}.jpg`;
  link.href = canvas.toDataURL("image/jpeg", 0.95);
  link.click();
}
