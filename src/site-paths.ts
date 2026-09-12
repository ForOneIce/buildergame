// Resolve from the deployment root, including GitHub Pages repository paths. 部署根路径。
export const siteBase = new URL(import.meta.env.BASE_URL, document.baseURI);
// Keep relative assets anchored when SPA navigation changes the current path.
const baseElement=document.querySelector('base')||document.head.appendChild(document.createElement('base'));
baseElement.href=siteBase.href;
export const siteUrl = (path = '') => new URL(path, siteBase).href;
export const townUrl = (slug: string) => siteUrl(`towns/${encodeURIComponent(slug)}/`);
// Local previews use the existing shell, so refresh works before static deployment. 本地预览。
export const previewUrl = (slug: string) => siteUrl(`?preview=${encodeURIComponent(slug)}`);
export function requestedTown(): string | null {
  const relative = location.pathname.startsWith(siteBase.pathname) ? location.pathname.slice(siteBase.pathname.length) : '';
  if (relative === '' || relative === 'index.html') {
    const query = new URLSearchParams(location.search);
    if (query.has('preview')) return query.get('preview') || '';
  }
  const match = relative.match(/^towns\/([^/]+)\/?$/);
  if (!match) return null;
  try { return decodeURIComponent(match[1]); } catch { return ''; }
}
