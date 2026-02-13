const shopLogic = () => ({
    products: [
        { id: 1, name: "Urban Saint Tee", price: 60000, originalPrice: 60000, category: "Tops", type: "new-drop", images: ["https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=600", "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=600"], sizes: ["S", "M", "L", "XL"], stock: 10, soldOut: false, colors: ["Black", "White"] },
        { id: 2, name: "Fearless Hoodie", price: 110000, originalPrice: 110000, category: "Outerwear", type: "new-drop", images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600"], sizes: ["M", "L", "XL"], stock: 5, soldOut: false, colors: ["Standard"] },
        { id: 4, name: "Grace Oversized Tee", price: 65000, originalPrice: 65000, category: "Tops", type: "new-drop", images: ["https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&q=80&w=600"], sizes: ["S", "M", "L"], stock: 0, soldOut: true, colors: ["White"] },
        { id: 5, name: "Walk By Faith Joggers", price: 85000, originalPrice: 85000, category: "Bottoms", type: "old-drop", images: ["https://images.unsplash.com/photo-1517445312882-6f233be0c58e?auto=format&fit=crop&q=80&w=600"], sizes: ["S", "M", "L", "XL"], stock: 8, soldOut: false, colors: ["Black"] },
        { id: 6, name: "Spirit Windbreaker", price: 145000, originalPrice: 145000, category: "Outerwear", type: "new-drop", images: ["https://images.unsplash.com/photo-1559563458-52c69f83555d?auto=format&fit=crop&q=80&w=600"], sizes: ["M", "L", "XL"], stock: 3, soldOut: false, colors: ["Navy"] }
    ],
    filters: { category: [], minPrice: 0, maxPrice: 300000 },
    sortBy: "newest",
    selectedProduct: null,
    modalQuantity: 1,
    modalSize: "M",
    paymentModalOpen: false,
    momoCode: "123456",
    momoPhone: "0780000000",
    copyFeedback: "",
    get filteredProducts() {
        return this.products.filter(r => {
            const t = this.filters.category.length === 0 || this.filters.category.includes(r.category);
            const e = r.price >= this.filters.minPrice && r.price <= this.filters.maxPrice;
            return t && e;
        }).sort((r, t) => this.sortBy === "price-asc" ? r.price - t.price : this.sortBy === "price-desc" ? t.price - r.price : t.new ? 1 : -1);
    },
    get newDrops() { return this.products.filter(r => r.type === "new-drop"); },
    get recentDrops() { return this.newDrops; },
    get oldDrops() { return this.products.filter(r => r.type === "old-drop"); },
    get totalPrice() { return this.selectedProduct ? (this.selectedProduct.price * this.modalQuantity).toLocaleString() : 0; },
    toggleCategory(r) { this.filters.category.includes(r) ? this.filters.category = this.filters.category.filter(t => t !== r) : this.filters.category.push(r); },
    openQuickView(r) { this.selectedProduct = r; },
    initPayment(r, t = 1, e = "M") {
        if (r && r.stock <= 0) {
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Item is sold out.", type: "error" } }));
            return;
        }
        this.selectedProduct = r;
        if (r) { this.modalQuantity = t; this.modalSize = e; } else { this.modalQuantity = 0; this.modalSize = ""; }
        this.paymentModalOpen = true;
    },
    cartItems: [],
    get cartTotal() { return this.cartItems.reduce((r, t) => r + t.totalPrice, 0).toLocaleString(); },
    get cartTotalRaw() { return this.cartItems.reduce((r, t) => r + t.totalPrice, 0); },
    init() { this.initCart(); },
    initCart() { this.cartItems = JSON.parse(localStorage.getItem("fof_cart")) || []; },
    removeFromCart(r) {
        this.cartItems.splice(r, 1);
        localStorage.setItem("fof_cart", JSON.stringify(this.cartItems));
        window.dispatchEvent(new CustomEvent("cart-updated"));
    },
    verifyPayment() {
        const r = !this.selectedProduct;
        const t = r ? this.cartTotal : this.totalPrice;
        let e = "";
        if (r) {
            e = this.cartItems.map(a => `- ${a.name} (${a.selectedSize}) x${a.quantity}: ${(a.price * a.quantity).toLocaleString()} FRW`).join("\n");
        } else {
            e = `- ${this.selectedProduct.name} (${this.modalSize}) x${this.modalQuantity}: ${(this.selectedProduct.price * this.modalQuantity).toLocaleString()} FRW`;
        }
        const n = `F>F PAYMENT VERIFICATION\n----------------------------\nOrder ID: ${"FOF-" + Math.random().toString(36).substr(2, 9).toUpperCase()}\n\nItems:\n${e}\n\nTOTAL AMOUNT: ${t} FRW\n----------------------------\nMerchant Code: 123-456\nName: Faith Over Fear LTD\n\nPlease confirm you have sent the payment by attaching a screenshot.`;
        const o = `https://wa.me/250780000000?text=${encodeURIComponent(n)}`;
        window.open(o, "_blank");
        this.paymentModalOpen = false;
        if (r) {
            this.cartItems = [];
            localStorage.removeItem("fof_cart");
            window.dispatchEvent(new CustomEvent("cart-updated"));
        }
        window.dispatchEvent(new CustomEvent("notify", { detail: { message: "WhatsApp Opened! Complete verification there.", type: "success" } }));
    },
    async copyToClipboard(r, t) {
        try {
            await navigator.clipboard.writeText(r);
            this.copyFeedback = t;
            setTimeout(() => this.copyFeedback = "", 2000);
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: `Copied ${t} to clipboard`, type: "success" } }));
        } catch (e) {
            console.error("Failed to copy: ", e);
        }
    },
    addToCart(r, t = 1, e = "M") {
        if (r.stock <= 0) return;
        let i = JSON.parse(localStorage.getItem("fof_cart")) || [];
        i.push({ ...r, selectedSize: e, quantity: t, totalPrice: r.originalPrice * t });
        localStorage.setItem("fof_cart", JSON.stringify(i));
        window.dispatchEvent(new CustomEvent("cart-updated"));
        window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Added to Cart", type: "success" } }));
    }
});

export default shopLogic;
