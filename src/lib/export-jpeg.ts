import html2canvas from "html2canvas";

// CR80 standard: 85.60mm x 53.98mm at 300 DPI = 1013 x 638 pixels
const CR80_WIDTH_PX = 1013;
const CR80_HEIGHT_PX = 638;

export async function downloadAsJPEG(captureId: string, filename: string) {
  const el = document.getElementById(captureId);
  if (!el) return;

  // Temporarily move element to hidden container for clean capture
  const originalParent = el.parentElement;
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `position:fixed;left:-9999px;top:0;width:${CR80_WIDTH_PX}px;height:${CR80_HEIGHT_PX}px;overflow:hidden;background:#fff;z-index:-1;`;

  wrapper.appendChild(el);
  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(el, {
      width: CR80_WIDTH_PX,
      height: CR80_HEIGHT_PX,
      scale: 1,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const link = document.createElement("a");
    link.download = `${filename}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  } finally {
    // Move element back to original position
    if (originalParent) {
      originalParent.appendChild(el);
    }
    document.body.removeChild(wrapper);
  }
}
