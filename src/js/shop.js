const shopLogic = () => ({
    products: [],
    loading: false,
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
    paymentModalOpen: false,
    momoCode: "123-456",
    momoPhone: "0780000000",
    copyFeedback: "",
    senderName: "",
    senderEmail: "",
    senderPhone: "",
    cartItems: [],
    configLoading: true,
    storeConfig: {
        store_mode: 'closed',
        announcement: ''
    },

    async init() {
        this.user = JSON.parse(localStorage.getItem('fof_user') || 'null');
        if (!this.requireLoginForProductPages()) return;

        this.loading = true;
        this.configLoading = true;
        
        try {
            // Fetch store config FIRST to ensure UI mode is correct
            await this.fetchStoreConfig();
            
            await Promise.all([
                this.fetchProducts(),
                this.initCart()
            ]);
        } catch (error) {
            console.error("Initialization failed:", error);
        } finally {
            this.loading = false;
            this.configLoading = false;
        }
        window.addEventListener('cart-updated', () => this.initCart());
    },

    async fetchStoreConfig() {
        try {
            const res = await fetch('/api/store-config');
            const data = await res.json();
            if (data.success && data.config) {
                this.storeConfig = data.config;
                console.log('✅ Store Config Loaded:', this.storeConfig.store_mode);
            }
        } catch (err) {
            console.error('❌ Failed to fetch store config:', err);
        }
    },

    ensureLoggedIn() {
        const token = localStorage.getItem('fof_token');
        if (!token) {
            window.dispatchEvent(new CustomEvent('notify', {
                detail: {
                    message: 'Please login or sign up before reserving or buying.',
                    type: 'error'
                }
            }));
            window.location.href = '/login.html';
            return false;
        }
        return true;
    },

    requireLoginForProductPages() {
        const path = window.location.pathname.toLowerCase();
        const protectedPaths = ['/', '/index.html', '/shop.html', '/product.html', '/lookbook.html'];
        if (protectedPaths.some(p => path === p || path.startsWith(p))) {
            const token = localStorage.getItem('fof_token');
            if (!token) {
                window.location.href = '/login.html';
                return false;
            }
        }
        return true;
    },

    async fetchProducts() {
        try {
            const res = await fetch('/api/drops?includeProducts=true');
            const data = await res.json();
            if (data.success) {
                // We have drops (collections). For the shop grid, we want to show all products if active.
                let allProducts = [];
                data.drops.forEach(drop => {
                    if (drop.products && Array.isArray(drop.products)) {
                        drop.products.forEach(p => {
                            allProducts.push({
                                ...p,
                                dropName: drop.name,
                                dropType: drop.type,
                                showDetails: false,
                                uiQuantity: 1,
                                uiSize: p.sizes && p.sizes.length > 0 ? p.sizes[0] : "M",
                                images: p.image_urls || [],
                                // If the drop is inactive, mark as reservation-only
                                status: drop.status || "live"
                            });
                        });
                    }
                });
                this.products = allProducts;
            }
        } catch (err) {
            console.error("Failed to fetch products:", err);
            // Set empty products on error - actual products come from API only
            this.products = [];
        }
    },

    async fetchSettings() {
        try {
            const res = await fetch('/api/settings'); // Assuming this endpoint exists or will be added
            const data = await res.json();
            if (data.success) {
                this.storeSettings = data.settings;
            }
        } catch (err) {
            console.warn("Using default store settings");
        }
    },

    get filteredProducts() {
        return this.products.filter(r => {
            const t = this.filters.category.length === 0 || this.filters.category.includes(r.category);
            const e = r.price >= this.filters.minPrice && r.price <= this.filters.maxPrice;
            return t && e;
        }).sort((r, t) => this.sortBy === "price-asc" ? r.price - t.price : this.sortBy === "price-desc" ? t.price - r.price : t.id > r.id ? 1 : -1);
    },

    get newDrops() { return this.products.filter(r => r.dropType === "new-drop"); },
    get recentDrops() { return this.products.filter(r => r.dropType === "recent-drop"); },

    get totalPrice() {
        if (!this.selectedProduct) return "0.00";
        return (parseFloat(this.selectedProduct.price) * parseInt(this.modalQuantity)).toFixed(2);
    },

    get momoQuickPayAmount() {
        if (!this.activeProduct) return "0.00";
        return (parseFloat(this.activeProduct.price) * parseInt(this.modalQuantity || 1)).toFixed(2);
    },

    toggleCategory(r) {
        this.filters.category.includes(r)
            ? this.filters.category = this.filters.category.filter(t => t !== r)
            : this.filters.category.push(r);
    },

    initPayment(product, qty = 1, size = "M") {
        console.log('MoMo Button Clicked', product ? product.id : 'cart');
        if (!this.ensureLoggedIn()) return;
        if (this.storeSettings.purchasingDisabled) {
            window.dispatchEvent(new CustomEvent("notify", {
                detail: { message: "Purchasing is currently disabled.", type: "error" }
            }));
            return;
        }
        this.selectedProduct = product;
        this.modalQuantity = product ? (parseInt(qty) || 1) : 0;
        this.modalSize = product ? (size || product.uiSize || "M") : "";
        this.paymentModalOpen = true;
    },

    initCart() { this.cartItems = JSON.parse(localStorage.getItem("fof_cart")) || []; },

    openMomoQuickPay(product, qty = 1, size = "M") {
        if (!this.ensureLoggedIn()) return;
        if (this.storeSettings.purchasingDisabled) {
            window.dispatchEvent(new CustomEvent("notify", {
                detail: { message: "Purchasing is currently disabled.", type: "error" }
            }));
            return;
        }
        this.activeProduct = product;
        this.selectedProduct = product;
        this.modalQuantity = product ? (parseInt(qty) || 1) : 1;
        this.modalSize = product ? (size || product.uiSize || "M") : "M";
        this.showMomoModal = true;
    },

    closeMomoQuickPay() {
        this.showMomoModal = false;
        this.activeProduct = null;
    },

    isValidMomoPhone(phone) {
        const normalizedPhone = String(phone || "").replace(/\s+/g, "");
        return /^07(?:2|3|8|9)\d{7}$/.test(normalizedPhone);
    },

    async processMomoPayment() {
        return this.verifyPayment();
    },

    get cartTotal() { return this.grandTotal; },
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
        if (!this.ensureLoggedIn()) return;
        if (!this.senderName || !this.senderPhone) {
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Please fill in your name and phone.", type: "error" } }));
            return;
        }

        if (!this.isValidMomoPhone(this.senderPhone)) {
            window.dispatchEvent(new CustomEvent("notify", {
                detail: { message: "Use a valid MoMo number with a supported 07 prefix.", type: "error" }
            }));
            return;
        }

        const checkoutProduct = this.activeProduct || this.selectedProduct;
        const isCartCheckout = !checkoutProduct;
        const total = isCartCheckout ? this.grandTotal : this.totalPrice;

        this.loading = true;

        const token = localStorage.getItem('fof_token');

        // Prepare WhatsApp message components
        let itemsList = isCartCheckout
            ? this.cartItems.map(item => `- ${item.name} (${item.selectedSize}) x${item.quantity} [${(item.price * item.quantity).toLocaleString()} FRW]`).join("\n")
            : `- ${checkoutProduct.name} (${this.modalSize}) x${this.modalQuantity} [${(checkoutProduct.price * this.modalQuantity).toLocaleString()} FRW]`;

        let createdOrderIds = [];

        try {
            if (isCartCheckout) {
                // Create one order per cart item
                for (const item of this.cartItems) {
                    const response = await fetch('/api/orders', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token ? `Bearer ${token}` : ''
                        },
                        body: JSON.stringify({
                            product_id: item.id,
                            product_name: item.name,
                            size: item.selectedSize,
                            quantity: item.quantity,
                            total_price: parseFloat(item.price) * parseInt(item.quantity),
                            payment_method: 'momo',
                            customer_name: this.senderName,
                            customer_email: this.senderEmail || null,
                            customer_phone: this.senderPhone
                        })
                    });
                    const result = await response.json();
                    if (result.success) {
                        createdOrderIds.push(result.orderId);
                    }
                }
            } else {
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: JSON.stringify({
                        product_id: checkoutProduct.id,
                        product_name: checkoutProduct.name,
                        size: this.modalSize,
                        quantity: this.modalQuantity,
                        total_price: parseFloat(checkoutProduct.price) * parseInt(this.modalQuantity),
                        payment_method: 'momo',
                        customer_name: this.senderName,
                        customer_email: this.senderEmail || null,
                        customer_phone: this.senderPhone
                    })
                });
                const result = await response.json();
                if (result.success) {
                    createdOrderIds.push(result.orderId);
                } else {
                    throw new Error(result.message || "Failed to create order");
                }
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

            // Fallback: Open WhatsApp even if API fails
            const fallbackMessage = `F>F PAYMENT VERIFICATION (Direct)\n----------------------------\nCustomer: ${this.senderName}\nPhone: ${this.senderPhone}\n\nItems:\n${itemsList}\n\nTOTAL: ${total} FRW\n----------------------------\nI have already sent the payment for these items. Please verify and process my order.`;

            window.open(`https://wa.me/250791832523?text=${encodeURIComponent(fallbackMessage)}`, "_blank");

            window.dispatchEvent(new CustomEvent("notify", {
                detail: {
                    message: "Redirecting to WhatsApp for manual verification.",
                    type: "success"
                }
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

    addToCart(product, qty = 1, size = "M") {
        if (this.storeSettings.purchasingDisabled) return;

        const existingItemIndex = this.cartItems.findIndex(item => item.id === product.id && item.selectedSize === size);

        if (existingItemIndex > -1) {
            this.cartItems[existingItemIndex].quantity += parseInt(qty);
            this.cartItems[existingItemIndex].totalPrice = this.cartItems[existingItemIndex].price * this.cartItems[existingItemIndex].quantity;
        } else {
            this.cartItems.push({
                ...product,
                selectedSize: size,
                quantity: parseInt(qty),
                totalPrice: product.price * parseInt(qty)
            });
        }

        this.persistCart();
        window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Added to Cart", type: "success" } }));
    },

    incrementQty(product) { product.uiQuantity++; },
    decrementQty(product) { if (product.uiQuantity > 1) product.uiQuantity--; },

    initReservation(product, size = "M") {
        if (!this.ensureLoggedIn()) return;
        this.selectedProduct = product;
        this.reservationData = {
            fullName: this.senderName || '',
            email: '',
            phone: this.senderPhone || '',
            size: size || product.uiSize || "M",
            color: product.colors && product.colors.length > 0 ? product.colors[0] : '',
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

        const user = JSON.parse(localStorage.getItem('fof_user'));
        const token = localStorage.getItem('fof_token');
        const payload = {
            ...this.reservationData,
            productId: this.selectedProduct.id,
            userId: user ? user.id : null
        };

        console.log("Submitting Reservation Payload:", payload);

        try {
            // Create an order via the unified orders API with 'reservation' payment method
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    product_id: this.selectedProduct.id,
                    product_name: this.selectedProduct.name,
                    size: this.reservationData.size,
                    color: this.reservationData.color,
                    quantity: this.reservationData.quantity,
                    total_price: parseFloat(this.selectedProduct.price) * parseInt(this.reservationData.quantity),
                    payment_method: 'reservation',
                    customer_name: this.reservationData.fullName,
                    customer_email: this.reservationData.email,
                    phone_number: this.reservationData.phone
                })
            });

            const result = await response.json();

            if (result.success) {
                window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Reservation confirmed! We'll contact you soon.", type: "success" } }));
                this.reservationModalOpen = false;
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Failed to submit reservation. Please try again.", type: "error" } }));
        } finally {
            this.loading = false;
        }
    }
});

export default shopLogic;
