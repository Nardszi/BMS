import html2canvas from "html2canvas";

// CR80 standard: 85.60mm x 53.98mm at 300 DPI = 1013 x 638 pixels
// Screen card: 3.375in x 2.125in at 96 DPI = 324px x 204px
const CR80_WIDTH_PX = 1013;
const CR80_HEIGHT_PX = 638;
const SCREEN_WIDTH_PX = 324; // 3.375in * 96dpi

const SCALE_FACTOR = CR80_WIDTH_PX / SCREEN_WIDTH_PX; // ~3.127

export async function downloadAsJPEG(captureId: string, filename: string) {
  const el = document.getElementById(captureId);
  if (!el) return;

  const canvas = await html2canvas(el, {
    scale: SCALE_FACTOR,
    useCORS: true,
    backgroundColor: "#ffffff",
    width: el.scrollWidth,
    height: el.scrollHeight,
  });

  const link = document.createElement("a");
  link.download = `${filename}.jpg`;
  link.href = canvas.toDataURL("image/jpeg", 0.95);
  link.click();
}
