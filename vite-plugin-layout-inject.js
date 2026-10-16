import fs from 'fs';
import path from 'path';

const partialsDir = path.resolve(__dirname, 'src/partials');

const activeToHref = {
  home: '/index.html',
  shop: '/shop.html',
  lookbook: '/lookbook.html',
  about: '/about.html',
  contact: '/contact.html',
  cart: '/cart.html',
};

function readPartial(name) {
  const file = path.join(partialsDir, name);
  if (!fs.existsSync(file)) return '';
  return fs.readFileSync(file, 'utf8');
}

function setActiveLink(html, activePage) {
  const targetHref = activePage && activeToHref[activePage] ? activeToHref[activePage] : null;
  if (!targetHref) return html;
  // Match <a href="X"> and add aria-current="page" if X matches targetHref
  return html.replace(
    /(<a\s+href=")([^"]+)(")/g,
    (match, before, href, after) => {
      if (href === targetHref) {
        return `${before}${href}${after} aria-current="page"`;
      }
      return match;
    }
  );
}

export function layoutInjectPlugin() {
  const headerRaw = readPartial('header.html');
  const footerRaw = readPartial('footer.html');

  const headExtra = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Instrument+Sans:wght@400;600&display=swap">
<link rel="stylesheet" href="/src/css/design-system.css">
`;

  return {
    name: 'layout-inject',
    enforce: 'pre',
    transformIndexHtml(html, { filename }) {
      // Inject fonts + design-system.css into <head> once (dedup: only if not already present)
      let result = html;
      if (!result.includes('Instrument+Sans&') || !result.includes('/src/css/design-system.css')) {
        result = result.replace('</head>', headExtra + '</head>');
      }
      // Wrap as /src/css/design-system.css not already
      if (!result.includes('/src/css/design-system.css')) {
        result = result.replace('</head>', '<link rel="stylesheet" href="/src/css/design-system.css">' + '</head>');
      }

      // Replace @@HEADER marker (with optional active=XXX for aria-current)
      result = result.replace(
        /<!--\s*@@HEADER\s+(?:active=(\w+)\s*)?-->/g,
        (match, activePage) => setActiveLink(headerRaw, activePage)
      );

      // Replace @@FOOTER marker
      result = result.replace(/<!--\s*@@FOOTER\s*-->/g, () => footerRaw);

      return result;
    },
  };
}
