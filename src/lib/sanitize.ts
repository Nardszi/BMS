const entityMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
};

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'/]/g, (s) => entityMap[s] || s);
}
