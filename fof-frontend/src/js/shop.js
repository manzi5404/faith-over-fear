const API_BASE_URL = window.API_BASE_URL || '';
const LOGIN_PATH = document.body?.dataset?.loginPath || '/login.html';

const shopLogic = () => ({
    products: [],
    drops: [],
    loading: false,
    activeDrop: null,
    selectedDrop: null,
    storeSettings: {
        purchasingDisabled: false,
        isRestocking: false
    },
    filters: { category: [], minPrice: 0, maxPrice: 300000 },
    sortBy: "newest",
    selectedProduct: null,
    activeProduct: null,
    scrolled: false,
    user: null,
    showMomoModal: false,
    modalQuantity: 1,
    modalSize: "M",
    modalColor: null,
    modalQuality: null,
    reservationModalOpen: false,
    reservationData: {
        fullName: '',
        email: '',
        phone: '',
        size: 'M',
        color: '',
        quantity: 1
    },
    senderPhone: "",
    senderName: "",
    senderEmail: "",
    copyFeedback: "",
    paymentModalOpen: false,
    configLoading: true,
    storeConfig: {
        store_mode: 'live',
        announcement: '',
        reservation_enabled: false
    },
    cartItems: [],

    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactSubject: '',
    contactMessage: '',

    async submitContact() {
        try {
const res = await fetch(`${API_BASE_URL}/api/contact`, {
                // Debug to catch wrong endpoint
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: this.contactName,
                    email: this.contactEmail,
                    phone: this.contactPhone,
                    subject: this.contactSubject,
                    message: this.contactMessage
                })
            });
            const data = await res.json();
            if (data.success) {
                this.contactName = '';
                this.contactEmail = '';
                this.contactPhone = '';
                this.contactSubject = '';
                this.contactMessage = '';
            window.dispatchEvent(new CustomEvent('notify', { detail: { message: 'Message sent successfully!', type: 'success' } }));
            // Debug: make sure the correct endpoint is hit
            console.log('[Contact Debug] POST /api/contact payload ok');
            } else {
                window.dispatchEvent(new CustomEvent('notify', { detail: { message: data.error || 'Failed to send message', type: 'error' } }));
            }
        } catch (err) {
            window.dispatchEvent(new CustomEvent('notify', { detail: { message: 'Failed to send message', type: 'error' } }));
        }
    },

    selectDrop(drop) {
        this.selectedDrop = drop;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (drop && drop.products) {
            drop.products.forEach(p => this.preloadProduct(p.id));
        }
        this.$nextTick(() => {
            this.animateProductReveal();
        });
    },

    clearSelection() {
        this.selectedDrop = null;
    },

    get selectedDropProducts() {
        if (!this.selectedDrop) return [];
        return this.selectedDrop.products || [];
    },

    clearSelection() {
        this.selectedDrop = null;
    },

    animateProductReveal() {
        const g = window.gsap;
        if (!g) return;
        const cards = document.querySelectorAll('.fof-product-card');
        if (!cards.length) return;
        g.fromTo(cards,
            { scale: 0, opacity: 0, y: 80, rotation: -15, transformOrigin: 'center bottom' },
            {
                scale: 1,
                opacity: 1,
                y: 0,
                rotation: 0,
                duration: 0.8,
                stagger: 0.12,
                ease: 'elastic.out(1, 0.7)'
            }
        );
    },

    preloadDropImages(drop) {
        if (!drop || !drop.products) return;
        drop.products.forEach(p => {
            const imgs = p.images || p.image_urls || [];
            imgs.forEach(src => {
                if (src && src !== '/placeholder.jpg') {
                    const img = new Image();
                    img.src = src;
                }
            });
        });
    },

    get selectedDropProducts() {
        if (!this.selectedDrop) return [];
        return this.selectedDrop.products || [];
    },

    ensureLoggedIn() {
        const token = localStorage.getItem('fof_token');
        if (!token) {
            window.dispatchEvent(new CustomEvent('notify', {
                detail: {
                    message: 'Please login or sign up before reserving.',
                    type: 'error'
                }
            }));
            window.location.href = '/login.html';
            return false;
        }
        return true;
    },

    getSessionId() {
        let sessionId = localStorage.getItem('fof_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('fof_session_id', sessionId);
        }
        return sessionId;
    },

    normalizeStoreMode(mode) {
        const normalized = String(mode || '').trim().toLowerCase();
        if (['live', 'reserve', 'closed'].includes(normalized)) return normalized;
        return 'closed';
    },

    applyStoreConfig(rawConfig = {}) {
        const normalizedMode = this.normalizeStoreMode(
            rawConfig.store_mode || rawConfig.mode || (rawConfig.reservation_enabled ? 'reserve' : '')
        );
        this.storeConfig = {
            ...rawConfig,
            store_mode: normalizedMode,
            reservation_enabled: rawConfig.reservation_enabled === true || normalizedMode === 'reserve'
        };
    },

    // Disable waitlist/reservation mode on product page.
    // Users should always see Add to Cart / Pay with MoMo.
    siteGate: {
        status: null,
        images: [],
        email: ''
    },

    isReservationMode() { return false; },
    isLiveMode() { return this.siteGate.status === 'live'; },
    isClosedMode() { return this.siteGate.status === 'closed'; },


    resolveImage(product) {
        if (!product) return '/placeholder.jpg';
        let imgList = [];
        try {
            if (typeof product.image === 'string' && product.image.startsWith('[')) {
                imgList = JSON.parse(product.image);
            } else if (Array.isArray(product.images)) {
                imgList = product.images;
            } else if (product.image) {
                imgList = [product.image];
            }
        } catch (e) {
            console.error("Image resolution failed for product:", product.id, e);
        }
        return (imgList && imgList.length > 0) ? imgList[0] : '/placeholder.jpg';
    },

    async init() {
        this.user = JSON.parse(localStorage.getItem('fof_user') || 'null');

        this.loading = true;
        this.configLoading = true;

        // Site closed/live gate (blocks entire page when closed)
        try {
            const settingsRes = await fetch(`${API_BASE_URL}/api/settings`);
            const settingsData = await settingsRes.json();
            const settings = settingsData?.settings || {};

            this.siteGate.status = String(settings.siteStatus || 'live').toLowerCase();

            // settings.siteClosedImages stored as JSON array string
            let imgs = settings.siteClosedImages;
            if (typeof imgs === 'string') {
                const t = imgs.trim();
                if (t.startsWith('[')) {
                    try { imgs = JSON.parse(t); } catch { imgs = []; }
                } else {
                    imgs = t.split(',').map(s => s.trim()).filter(Boolean);
                }
            }
            this.siteGate.images = Array.isArray(imgs) ? imgs : [];

            this.renderSiteGate();

        } catch (e) {
            console.warn('[SITE_GATE] settings fetch failed, defaulting to live', e);
        }

        try {

            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id');
            if (productId) {
                const cached = this.getCachedProduct(productId);
                if (cached) {
                    this.loadProductFromCache(cached);
                } else {
                    await this.fetchProductById(productId);
                }
            } else {
                await this.fetchDropAndProducts();
            }
            await this.initCart();
        } catch (error) {
            console.error("Initialization failed:", error);
        } finally {
            this.loading = false;
            this.configLoading = false;
            // Ensure overlay stays when closed
            this.renderSiteGate();
        }

        window.addEventListener('cart-updated', () => this.initCart());
    },

    renderSiteGate() {
        const gateRootId = 'site-gate-root';
        let existing = document.getElementById(gateRootId);

        // When live: remove overlay
        if (!this.isClosedMode()) {
            if (existing) existing.remove();
            return;
        }

        // Closed: block everything and show overlay
        if (!existing) {
            existing = document.createElement('div');
            existing.id = gateRootId;
            existing.innerHTML = `
                <div id="site-gate-overlay" style="position:fixed;inset:0;z-index:999999;background:#000;display:flex;align-items:center;justify-content:center;">
                    <div style="width:min(920px,92vw);padding:26px 18px;display:flex;flex-direction:column;gap:16px;align-items:center;">
                        <div style="color:#fff;font-weight:900;letter-spacing:-1px;font-size:42px;line-height:1;">F<span style="color:#ff3b3b;">></span>F</div>
                        <div style="color:#ccc;text-transform:uppercase;letter-spacing:6px;font-size:10px;font-weight:700;">SITE CLOSED</div>

                        <div id="site-gate-card" style="width:100%;max-width:680px;background:rgba(10,10,10,.9);border:1px solid rgba(255,255,255,.08);border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.7);padding:18px;">
                            <div id="site-gate-image-strip" style="display:flex;gap:14px;align-items:center;white-space:nowrap;overflow:hidden;">
                                <div id="site-gate-images" style="display:flex;gap:14px;align-items:center;animation:siteGateSlide 16s linear infinite;">
                                </div>
                            </div>
                            <style>
                                @keyframes siteGateSlide {
                                    0% { transform: translateX(0); }
                                    100% { transform: translateX(-50%); }
                                }
                            </style>
                        </div>

                        <div style="width:100%;max-width:520px;display:flex;gap:10px;align-items:center;">
                            <input id="site-gate-email" type="email" placeholder="Enter your email" style="flex:1;min-width:0;padding:16px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:#0b0b0b;color:#fff;outline:none;" />
                            <button id="site-gate-notify" style="padding:16px 20px;border-radius:12px;border:1px solid #ff3b3b;background:#ff3b3b;color:#000;font-weight:900;text-transform:uppercase;letter-spacing:2px;cursor:pointer;">Notify me</button>
                        </div>

                        <div id="site-gate-status" style="color:#ccc;font-size:12px;min-height:18px;text-align:center;"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(existing);
        }

        // Populate images
        const imgWrap = existing.querySelector('#site-gate-images');
        if (imgWrap) {
            const imgs = this.siteGate.images?.length ? this.siteGate.images : ['https://placehold.co/680x420/000000/FFFFFF/png?text=F%3EF'];
            const html = imgs.map(src => `<img src="${src}" alt="model" style="width:260px;max-width:38vw;height:160px;object-fit:cover;border-radius:14px;border:1px solid rgba(255,255,255,.08);" />`).join('');
            // duplicate for smooth slide loop
            imgWrap.innerHTML = html + html;
        }

        // Bind submit
        const btn = existing.querySelector('#site-gate-notify');
        const emailInput = existing.querySelector('#site-gate-email');
        const statusEl = existing.querySelector('#site-gate-status');

        if (btn && !btn.dataset.bound) {
            btn.dataset.bound = '1';
            btn.addEventListener('click', async () => {
                const email = (emailInput?.value || '').trim();
                if (!email) {
                    if (statusEl) statusEl.textContent = 'Please enter your email.';
                    return;
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    if (statusEl) statusEl.textContent = 'Enter a valid email.';
                    return;
                }

                if (statusEl) statusEl.textContent = 'Submitting...';
                try {
                    const res = await fetch(`${API_BASE_URL}/api/waitlist`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: null,
                            email,
                            phone: null,
                            source: 'site_closed'
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        if (statusEl) statusEl.textContent = 'Done! We’ll notify you when we’re live.';
                        if (emailInput) emailInput.value = '';
                    } else {
                        if (statusEl) statusEl.textContent = data.error || 'Failed. Try again.';
                    }
                } catch {
                    if (statusEl) statusEl.textContent = 'Failed. Try again.';
                }
            });
        }
    },

    getCachedProduct(productId) {
        try {
            const cached = localStorage.getItem('fof_product_cache');
            if (cached) {
                const products = JSON.parse(cached);
                const now = Date.now();
                const filtered = products.filter(p => now - (p._cachedAt || 0) < 3600000);
                if (filtered.length > 0) {
                    localStorage.setItem('fof_product_cache', JSON.stringify(filtered));
                    return filtered.find(p => p.id == productId);
                }
            }
        } catch (e) {
            console.error('Cache read failed:', e);
        }
        return null;
    },

    cacheProducts(products) {
        try {
            const cached = products.map(p => ({ ...p, _cachedAt: Date.now() }));
            localStorage.setItem('fof_product_cache', JSON.stringify(cached));
        } catch (e) {
            console.error('Cache write failed:', e);
        }
    },

    loadProductFromCache(product) {
        this.selectedProduct = product;
        this.activeProduct = product;
        this.selectedSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : "M";
        this.selectedColor = product.colors && product.colors.length > 0 ? product.colors[0] : "";
        this.qualityLevels = product.product_quality_prices || product.quality_prices || [];
        this.selectedQuality = this.qualityLevels.length > 0 ? this.qualityLevels[0] : null;
    },

    preloadProduct(productId) {
        if (!productId) return;
        const cached = this.getCachedProduct(productId);
        if (cached) return;
        fetch(`${API_BASE_URL}/api/products/id/${productId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.product) {
                    const p = data.product;
                    const product = {
                        ...p,
                        dropName: p.dropName || p.drop?.title || '',
                        dropType: p.dropType || p.drop?.type || 'new-drop',
                        showDetails: false,
                        uiQuantity: 1,
                        uiSize: p.sizes && p.sizes.length > 0 ? p.sizes[0] : "M",
                        images: p.images || p.image_urls || [],
                        quality_prices: p.product_quality_prices || p.quality_prices || [],
                        status: p.status || "live"
                    };
                    this.cacheProducts([product]);
                }
            })
            .catch(err => console.error('Preload failed:', err));
    },

    async fetchDropAndProducts() {
        try {
            const isLookbook = window.location.pathname === '/lookbook.html';
            const typeFilter = isLookbook ? 'recent-drop' : 'new-drop';
            const res = await fetch(`${API_BASE_URL}/api/drops?includeProducts=true&type=${typeFilter}`);
            const data = await res.json();
            if (data.success && Array.isArray(data.drops)) {
                this.drops = data.drops.map(drop => {
                    const mappedProducts = (drop.products || []).map(p => ({
                        ...p,
                        dropName: drop.title || drop.name || '',
                        dropType: drop.type || 'new-drop',
                        dropSlug: drop.slug || '',
                        showDetails: false,
                        uiQuantity: 1,
                        uiSize: p.sizes && p.sizes.length > 0 ? p.sizes[0] : "M",
                        images: p.images || p.image_urls || [],
                        quality_prices: p.product_quality_prices || p.quality_prices || [],
                        status: drop.status || "live"
                    }));
                    return {
                        ...drop,
                        products: mappedProducts,
                        image: this.resolveDropImage(drop)
                    };
                });

                const activeNewDrop = this.drops.find(d => d.type === 'new-drop' && d.status === 'live') || this.drops[0];
                this.activeDrop = activeNewDrop || null;

                let allProducts = [];
                this.drops.forEach(drop => {
                    if (drop.products && Array.isArray(drop.products)) {
                        drop.products.forEach(p => {
                            allProducts.push(p);
                        });
                    }
                });
                this.products = allProducts;
                this.cacheProducts(allProducts);
            }
        } catch (err) {
            console.error("Failed to fetch drops and products:", err);
            this.activeDrop = null;
            this.products = [];
            this.drops = [];
        }
    },

    async fetchProductById(productId) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/products/id/${productId}`);
            const data = await res.json();
            if (data.success && data.product) {
                const p = data.product;
                const product = {
                    ...p,
                    dropName: p.dropName || p.drop?.title || '',
                    dropType: p.dropType || p.drop?.type || 'new-drop',
                    showDetails: false,
                    uiQuantity: 1,
                    uiSize: p.sizes && p.sizes.length > 0 ? p.sizes[0] : "M",
                    images: p.images || p.image_urls || [],
                    quality_prices: p.product_quality_prices || p.quality_prices || [],
                    status: p.status || "live"
                };
                this.products = [product];
                this.cacheProducts([product]);
                return product;
            }
        } catch (err) {
            console.error("Failed to fetch product:", err);
        }
        return null;
    },

    resolveDropImage(drop) {
        if (!drop) return '/placeholder.jpg';
        if (drop.image_url) return drop.image_url;
        if (drop.products && drop.products.length > 0) {
            const firstProduct = drop.products[0];
            if (firstProduct.images && firstProduct.images.length > 0) return firstProduct.images[0];
            if (firstProduct.image_urls && firstProduct.image_urls.length > 0) return firstProduct.image_urls[0];
        }
        return '/placeholder.jpg';
    },

    sizesOf(product) {
        if (!product) return [];
        const variants = product.product_variants || product.variants || [];
        const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
        if (sizes.length === 0 && Array.isArray(product.sizes)) return product.sizes;
        return sizes;
    },

    colorsOf(product) {
        if (!product) return [];
        const variants = product.product_variants || product.variants || [];
        const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
        if (colors.length === 0 && Array.isArray(product.colors)) return product.colors;
        return colors;
    },

    variantBySizeColor(product, size, color) {
        const variants = product.product_variants || product.variants || [];
        const match = variants.find(v =>
            v.size === size && (color ? v.color === color : true)
        );
        return match || variants[0] || null;
    },

    get filteredProducts() {
        return this.products.filter(r => {
            const t = this.filters.category.length === 0 || this.filters.category.includes(r.category);
            const price = (r.product_variants && r.product_variants[0]?.price_override) || r.base_price || r.price || 0;
            const e = price >= this.filters.minPrice && price <= this.filters.maxPrice;
            return t && e;
        }).sort((r, t) => this.sortBy === "price-asc" ? (r.base_price || 0) - (t.base_price || 0) : this.sortBy === "price-desc" ? (t.base_price || 0) - (r.base_price || 0) : t.id > r.id ? 1 : -1);
    },

    get newDrops() { return this.products.filter(r => r.dropType === "new-drop"); },
    get recentDrops() { return this.products.filter(r => r.dropType === "recent-drop"); },
    get recentDropObjects() { return (this.drops || []).filter(d => d.type === "recent-drop"); },

    priceOf(product, size, color, qualityLevel = 'essential') {
        if (!product) return 0;
        const variant = this.variantBySizeColor(product, size, color);
        if (variant && variant.price_override != null) return parseFloat(variant.price_override);

        const qualityPrices = product.product_quality_prices || product.quality_prices || [];
        if (qualityPrices.length > 0) {
          if (this.modalQuality && this.modalQuality.price != null) return parseFloat(this.modalQuality.price);
          const match = qualityPrices.find(qp => qp.quality_level && qp.quality_level.name && qp.quality_level.name.toLowerCase() === qualityLevel.toLowerCase());
          if (match && match.price != null) return parseFloat(match.price);
          const first = qualityPrices.find(qp => qp.price != null);
          if (first) return parseFloat(first.price);
        }

        return parseFloat(product.base_price || product.price || 0);
    },

    get totalPrice() {
        if (!this.selectedProduct) return "0.00";
        return (this.priceOf(this.selectedProduct, this.modalSize, this.modalColor) * parseInt(this.modalQuantity)).toFixed(2);
    },

    get momoQuickPayAmount() {
        if (!this.activeProduct) return "0.00";
        return (this.priceOf(this.activeProduct, this.modalSize, this.modalColor) * parseInt(this.modalQuantity || 1)).toFixed(2);
    },

    toggleCategory(r) {
        this.filters.category.includes(r)
            ? this.filters.category = this.filters.category.filter(t => t !== r)
            : this.filters.category.push(r);
    },

    initPayment(product, qty = 1, size = "M", color = null) {
        if (this.storeSettings.purchasingDisabled) {
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Purchasing is currently disabled.", type: "error" } }));
            return;
        }
        this.selectedProduct = product;
        this.modalQuantity = product ? (parseInt(qty) || 1) : 0;
        this.modalSize = product ? (size || product.uiSize || "M") : "";
        this.modalColor = color || (product && this.colorsOf(product)[0]) || null;
        this.paymentModalOpen = true;
    },

    initCart() { this.cartItems = JSON.parse(localStorage.getItem("fof_cart")) || []; },

    openMomoQuickPay(product, qty = 1, size = "M", color = null, quality = null) {
        if (this.storeSettings.purchasingDisabled) {
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Purchasing is currently disabled.", type: "error" } }));
            return;
        }
        this.activeProduct = product;
        this.selectedProduct = product;
        this.modalQuantity = product ? (parseInt(qty) || 1) : 1;
        this.modalSize = product ? (size || product.uiSize || "M") : "M";
        this.modalColor = color || (product && this.colorsOf(product)[0]) || null;
        this.modalQuality = quality || null;
        this.showMomoModal = true;
    },

    closeMomoQuickPay() {
        this.showMomoModal = false;
        this.activeProduct = null;
    },

    isValidMomoPhone(phone) {
        if (!phone) return false;
        const normalizedPhone = String(phone).replace(/[\s\-]/g, "");
        return /^07(?:2|3|8|9)\d{7}$/.test(normalizedPhone);
    },

    get cartTotalRaw() {
        return this.cartItems.reduce((acc, item) => acc + (parseFloat(item.price) * parseInt(item.quantity)), 0);
    },
    get grandTotal() { return this.cartTotalRaw.toFixed(2); },

    persistCart() {
        localStorage.setItem("fof_cart", JSON.stringify(this.cartItems));
        window.dispatchEvent(new CustomEvent("cart-updated"));
    },

    updateQuantity(index, delta) {
        if (this.cartItems[index]) {
            const newQty = this.cartItems[index].quantity + delta;
            if (newQty > 0) {
                this.cartItems[index].quantity = newQty;
                this.cartItems[index].totalPrice = this.cartItems[index].price * newQty;
                this.persistCart();
            } else if (newQty === 0) {
                this.removeFromCart(index);
            }
        }
    },

    updateSize(index, newSize) {
        if (this.cartItems[index]) {
            this.cartItems[index].selectedSize = newSize;
            this.persistCart();
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: `Size updated to ${newSize}`, type: "success" } }));
        }
    },

    removeFromCart(index) {
        if (this.cartItems[index]) {
            this.cartItems.splice(index, 1);
            this.persistCart();
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Item removed from cart", type: "success" } }));
        }
    },

    async verifyPayment() {
        if (!this.senderName || !this.senderPhone) {
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Please fill in your name and phone.", type: "error" } }));
            return;
        }

        if (!this.isValidMomoPhone(this.senderPhone)) {
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Use a valid MoMo number with a supported 07 prefix.", type: "error" } }));
            return;
        }

        const checkoutProduct = this.activeProduct || this.selectedProduct;
        const isCartCheckout = !checkoutProduct;
        const total = isCartCheckout ? this.grandTotal : this.totalPrice;

        this.loading = true;

        const token = localStorage.getItem('fof_token');
        const sessionId = this.getSessionId();

        let orderItems;
        let itemsList;

        if (isCartCheckout) {
            orderItems = this.cartItems.map(item => ({
                variantId: item.variantId,
                quantity: item.quantity
            }));
            itemsList = this.cartItems.map(item => {
                const colorStr = item.selectedColor ? ` / ${item.selectedColor}` : '';
                return `- ${item.name}${colorStr} (${item.selectedSize}) x${item.quantity} [${(parseFloat(item.price) * item.quantity).toLocaleString()} FRW]`;
            }).join("\n");
        } else {
            const variant = this.variantBySizeColor(checkoutProduct, this.modalSize, this.modalColor);
            orderItems = [{ variantId: variant ? variant.id : null, quantity: parseInt(this.modalQuantity) }];
            const colorStr = this.modalColor ? ` / ${this.modalColor}` : '';
            itemsList = `- ${checkoutProduct.name}${colorStr} (${this.modalSize}) x${this.modalQuantity} [${this.totalPrice} FRW]`;
        }

        let createdOrderIds = [];

        try {
            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                    'X-Session-Id': sessionId
                },
                body: JSON.stringify({
                    items: orderItems,
                    payment_method: 'momo',
                    customer_name: this.senderName,
                    customer_email: this.senderEmail || null,
                    customer_phone: this.senderPhone
                })
            });
            const result = await response.json();
            if (result.success && result.order) {
                createdOrderIds.push(result.order.id);
            } else if (!result.success) {
                throw new Error(result.message || "Failed to create order");
            }

            const orderIdStr = createdOrderIds.length > 0 ? createdOrderIds.join(', ') : 'N/A';
            const message = `F>F PAYMENT VERIFICATION\n----------------------------\nOrder ID: ${orderIdStr}\nCustomer: ${this.senderName}\n\nItems:\n${itemsList}\n\nTOTAL: ${total} FRW\n----------------------------\nI have already sent the payment. Please verify this order.`;

            window.open(`https://wa.me/250791832523?text=${encodeURIComponent(message)}`, "_blank");

            if (isCartCheckout) {
                this.cartItems = [];
                this.persistCart();
            }
            setTimeout(() => {
                this.paymentModalOpen = false;
                this.showMomoModal = false;
                this.activeProduct = null;
            }, 500);
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Order placed! Please verify your payment on WhatsApp.", type: "success" } }));
        } catch (err) {
            console.error("Order creation failed, using fallback:", err);

            const fallbackMessage = `F>F PAYMENT VERIFICATION (Direct)\n----------------------------\nCustomer: ${this.senderName}\nPhone: ${this.senderPhone}\n\nItems:\n${itemsList}\n\nTOTAL: ${total} FRW\n----------------------------\nI have already sent the payment for these items. Please verify and process my order.`;

            window.open(`https://wa.me/250791832523?text=${encodeURIComponent(fallbackMessage)}`, "_blank");

            window.dispatchEvent(new CustomEvent("notify", {
                detail: { message: "Redirecting to WhatsApp for manual verification.", type: "success" }
            }));

            if (isCartCheckout) {
                this.cartItems = [];
                this.persistCart();
            }
            setTimeout(() => {
                this.paymentModalOpen = false;
                this.showMomoModal = false;
                this.activeProduct = null;
            }, 500);
        } finally {
            this.loading = false;
        }
    },

    async processMomoPayment() {
        return this.verifyPayment();
    },

    async copyToClipboard(text, type) {
        try {
            await navigator.clipboard.writeText(text);
            this.copyFeedback = type;
            setTimeout(() => this.copyFeedback = "", 2000);
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: `Copied ${type} to clipboard`, type: "success" } }));
        } catch (err) {
            console.error("Failed to copy: ", err);
        }
    },

    addToCart(product, qty = 1, size = "M", color = null) {
        if (this.storeSettings.purchasingDisabled) return;

        const variant = this.variantBySizeColor(product, size, color);
        const effectivePrice = variant && variant.price_override != null
            ? parseFloat(variant.price_override)
            : parseFloat(product.base_price || product.price || 0);
        const variantId = variant ? variant.id : null;

        const existingItemIndex = this.cartItems.findIndex(item =>
            item.id === product.id &&
            item.selectedSize === size &&
            item.selectedColor === color
        );

        if (existingItemIndex > -1) {
            this.cartItems[existingItemIndex].quantity += parseInt(qty);
            this.cartItems[existingItemIndex].totalPrice = this.cartItems[existingItemIndex].price * this.cartItems[existingItemIndex].quantity;
        } else {
            this.cartItems.push({
                ...product,
                selectedSize: size,
                selectedColor: color,
                variantId,
                qualityLevelId: null,
                price: effectivePrice,
                quantity: parseInt(qty),
                totalPrice: effectivePrice * parseInt(qty)
            });
        }

        this.persistCart();
        window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Added to Cart", type: "success" } }));
    },

    incrementQty(product) { product.uiQuantity++; },
    decrementQty(product) { if (product.uiQuantity > 1) product.uiQuantity--; },

    initReservation(product, size = "M", color = null) {
        if (!this.ensureLoggedIn()) return;
        this.selectedProduct = product;
        this.reservationData = {
            fullName: this.senderName || '',
            email: this.senderEmail || '',
            phone: this.senderPhone || '',
            size: size || product.uiSize || "M",
            color: color || (product && this.colorsOf(product)[0]) || '',
            quantity: product.uiQuantity || 1
        };
        this.reservationModalOpen = true;
    },

    async submitReservation() {
        if (!this.ensureLoggedIn()) return;
        if (!this.reservationData.fullName || !this.reservationData.email) {
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Please fill in your name and email.", type: "error" } }));
            return;
        }

        this.loading = true;

        try {
            const response = await fetch(`${API_BASE_URL}/api/waitlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: this.reservationData.fullName,
                    email: this.reservationData.email,
                    phone: this.reservationData.phone || null,
                    source: this.selectedProduct ? `product:${this.selectedProduct.id}` : 'web'
                })
            });

            const result = await response.json();

            if (result.success) {
                window.dispatchEvent(new CustomEvent("notify", { detail: { message: "You're on the waitlist! We'll notify you when drops open.", type: "success" } }));
                this.reservationModalOpen = false;
            } else {
                throw new Error(result.message || "Failed to join waitlist");
            }
        } catch (err) {
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Failed to join the waitlist. Please try again.", type: "error" } }));
        } finally {
            this.loading = false;
        }
    }
});

export default shopLogic;
