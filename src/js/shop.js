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
    modalQuantity: 1,
    modalSize: "M",
    paymentModalOpen: false,
    momoCode: "123-456",
    momoPhone: "0780000000",
    copyFeedback: "",
    senderName: "",
    senderPhone: "",
    cartItems: [],

    async init() {
        this.loading = true;
        try {
            await Promise.all([
                this.fetchProducts(),
                this.fetchSettings(),
                this.initCart()
            ]);
        } catch (error) {
            console.error("Initialization failed:", error);
        } finally {
            this.loading = false;
        }
        window.addEventListener('cart-updated', () => this.initCart());
    },

    async fetchProducts() {
        try {
            const res = await fetch('/api/drops');
            const data = await res.json();
            if (data.success) {
                // Add default quantity and size to each product for UI reactivity
                this.products = data.drops.map(p => ({
                    ...p,
                    showDetails: false, // Control for "See Details" flow
                    uiQuantity: 1,
                    uiSize: p.sizes ? p.sizes[0] : "M"
                }));
            }
        } catch (err) {
            console.error("Failed to fetch products:", err);
            // Fallback for demo/dev if API is not ready
            this.products = [
                { id: 1, name: "Urban Saint Tee", price: 60000, category: "Tops", type: "new-drop", images: ["https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=600"], sizes: ["S", "M", "L", "XL"], stock: 10, uiQuantity: 1, uiSize: "M", showDetails: false },
                { id: 2, name: "Fearless Hoodie", price: 110000, category: "Outerwear", type: "new-drop", images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600"], sizes: ["M", "L", "XL"], stock: 5, uiQuantity: 1, uiSize: "M", showDetails: false }
            ];
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

    get newDrops() { return this.products.filter(r => r.type === "new-drop"); },
    get recentDrops() { return this.products.filter(r => r.type === "new-drop"); },

    get totalPrice() {
        if (!this.selectedProduct) return "0.00";
        return (parseFloat(this.selectedProduct.price) * parseInt(this.modalQuantity)).toFixed(2);
    },

    toggleCategory(r) {
        this.filters.category.includes(r)
            ? this.filters.category = this.filters.category.filter(t => t !== r)
            : this.filters.category.push(r);
    },

    initPayment(product, qty = 1, size = "M") {
        if (this.storeSettings.purchasingDisabled || (product && product.stock <= 0)) {
            window.dispatchEvent(new CustomEvent("notify", {
                detail: { message: this.storeSettings.purchasingDisabled ? "Purchasing is currently disabled." : "Item is sold out.", type: "error" }
            }));
            return;
        }
        this.selectedProduct = product;
        this.modalQuantity = product ? (parseInt(qty) || 1) : 0;
        this.modalSize = product ? (size || product.uiSize || "M") : "";
        this.paymentModalOpen = true;
    },

    initCart() { this.cartItems = JSON.parse(localStorage.getItem("fof_cart")) || []; },

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
        if (!this.senderName || !this.senderPhone) {
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Please fill in your name and phone.", type: "error" } }));
            return;
        }

        const isCartCheckout = !this.selectedProduct;
        const total = isCartCheckout ? this.grandTotal : this.totalPrice;
        const items = isCartCheckout
            ? this.cartItems.map(i => ({ product_id: i.id, quantity: i.quantity, price: i.price, size: i.selectedSize }))
            : [{ product_id: this.selectedProduct.id, quantity: this.modalQuantity, price: this.selectedProduct.price, size: this.modalSize }];

        this.loading = true;

        // Prepare WhatsApp message components
        let itemsList = isCartCheckout
            ? this.cartItems.map(item => `- ${item.name} (${item.selectedSize}) x${item.quantity} [${(item.price * item.quantity).toLocaleString()} FRW]`).join("\n")
            : `- ${this.selectedProduct.name} (${this.modalSize}) x${this.modalQuantity} [${(this.selectedProduct.price * this.modalQuantity).toLocaleString()} FRW]`;

        try {
            const token = localStorage.getItem('fof_token');
            const response = await fetch('/api/orders/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    customer_name: this.senderName,
                    phone: this.senderPhone,
                    totalAmount: parseFloat(total),
                    items: items
                })
            });

            const result = await response.json();
            if (result.success) {
                const message = `F>F PAYMENT VERIFICATION\n----------------------------\nOrder ID: ${result.orderId}\nCustomer: ${this.senderName}\n\nItems:\n${itemsList}\n\nTOTAL: ${total} FRW\n----------------------------\nI have already sent the payment. Please verify this order.`;

                // Open WhatsApp in a new tab for WhatsApp Web users
                window.open(`https://wa.me/250780000000?text=${encodeURIComponent(message)}`, "_blank");

                if (isCartCheckout) {
                    this.cartItems = [];
                    this.persistCart();
                }
                setTimeout(() => { this.paymentModalOpen = false; }, 500);
                window.dispatchEvent(new CustomEvent("notify", { detail: { message: "WhatsApp Opened! Please verify your payment.", type: "success" } }));
            } else {
                throw new Error(result.message || "Failed to place order");
            }
        } catch (err) {
            console.error("Order creation failed, using fallback:", err);

            // Fallback: Open WhatsApp even if API fails
            const fallbackMessage = `F>F PAYMENT VERIFICATION (Direct)\n----------------------------\nCustomer: ${this.senderName}\nPhone: ${this.senderPhone}\n\nItems:\n${itemsList}\n\nTOTAL: ${total} FRW\n----------------------------\nI have already sent the payment for these items. Please verify and process my order.`;

            window.open(`https://wa.me/250780000000?text=${encodeURIComponent(fallbackMessage)}`, "_blank");

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
            setTimeout(() => { this.paymentModalOpen = false; }, 500);
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
        if (this.storeSettings.purchasingDisabled || product.stock <= 0) return;

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
    decrementQty(product) { if (product.uiQuantity > 1) product.uiQuantity--; }
});

export default shopLogic;
