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

  return {
    name: 'layout-inject',
    enforce: 'pre',
    transformIndexHtml(html, { filename }) {
      const basename = path.basename(filename);

      // Replace @@HEADER marker (with optional active=XXX for aria-current)
      let result = html.replace(
        /<!--\s*@@HEADER\s+(?:active=(\w+)\s*)?-->/g,
        (match, activePage) => {
          return setActiveLink(headerRaw, activePage);
        }
      );

      // Replace @@FOOTER marker
      result = result.replace(/<!--\s*@@FOOTER\s*-->/g, () => footerRaw);

      return result;
    },
  };
}
