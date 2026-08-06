import { defineConfig } from 'vite'

const closedGateScript = `<script>(function(){if(/^\/closed\.html(\?.*)?$/.test(location.pathname+location.search))return;var g=document.getElementById('fof-gate');if(!g){g=document.createElement('style');g.id='fof-gate';g.textContent='body,body *{visibility:hidden!important}';document.documentElement.appendChild(g);}function reveal(){var s=document.getElementById('fof-gate');if(s)s.remove();clearTimeout(t);}function redirect(){location.replace('/closed.html');}var t=setTimeout(reveal,2e3);fetch('/api/settings',{cache:'no-store'}).then(function(r){return r.ok?r.json():{settings:{}};}).then(function(json){var s=json&&json.settings||{};var st=String(s.siteStatus||s.store_mode||s.mode||'live').toLowerCase();if(st==='closed')redirect();else reveal();}).catch(reveal);})();<\/script>`

export default defineConfig({
  plugins: [
    {
      name: 'inject-closed-gate',
      transformIndexHtml(html) {
        return html.replace(/(<meta name="viewport"[^>]*>)/i, '$1\n    ' + closedGateScript)
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        shop: './shop.html',
        product: './product.html',
        cart: './cart.html',
        collections: './collections.html',
        login: './login.html',
        signup: './signup.html',
        about: './about.html',
        contact: './contact.html',
        lookbook: './lookbook.html',
        closed: './closed.html',
        faq: './faq.html',
        shipping: './shipping.html',
        terms: './terms.html',
      },
      output: {
        manualChunks: {
          alpine: ['alpinejs', '@alpinejs/collapse'],
          gsap: ['gsap'],
          vendor: ['src/js/shop.js', 'src/js/product.js'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        timeout: 300000,
        proxyTimeout: 300000,
      },
      '/admin': {
        target: 'http://127.0.0.1:5174',
        changeOrigin: true,
        timeout: 300000,
        proxyTimeout: 300000,
      },
    },
  },
})
