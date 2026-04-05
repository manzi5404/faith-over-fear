import shopLogic from './shop.js';

const productLogic = () => ({
    product: {
        id: null,
        name: '',
        category: '',
        description: '',
        images: [],
        colors: [],
        sizes: [],
        price: 0,
        dropType: '',
        isWaitlist: false,
        quality_prices: []
    },
    qualityLevels: [],
    selectedQuality: null,
    quantity: 1,
    selectedSize: "",
    selectedColor: "",
    currentImage: 0,
    relatedItems: [],
    loadingPDP: true,
    viewedInstructions: false,

    async init() {
        this.loadingPDP = true;
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        // Wait for products to be loaded in the global shopLogic
        let attempts = 0;
        const maxAttempts = 15;

        const tryInit = () => {
            const shop = Alpine.$data(document.body);
            if (shop && shop.products && shop.products.length > 0) {
                this.loadProductData(id, shop.products);
                this.loadingPDP = false;
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(tryInit, 200);
            } else {
                console.error("Failed to load products from shopLogic");
                this.loadingPDP = false;
            }
        };

        tryInit();
    },

    loadProductData(id, products) {
        if (id) {
            this.product = products.find(p => p.id == id);
        }

        if (!this.product) {
            this.product = products[0];
        }

        if (this.product) {
            this.selectedSize = this.product.sizes && this.product.sizes.length > 0 ? this.product.sizes[0] : "";
            this.selectedColor = this.product.colors && this.product.colors.length > 0 ? this.product.colors[0] : "";

            this.qualityLevels = this.product.quality_prices || [];
            if (this.qualityLevels.length > 0) {
                this.selectedQuality = this.qualityLevels[0];
            }

            this.relatedItems = products
                .filter(p => p.dropType === this.product.dropType && p.id !== this.product.id)
                .slice(0, 4);
        }
    },

    get mainImage() {
        return this.product && this.product.images[this.currentImage]
            ? this.product.images[this.currentImage]
            : "";
    },

    get dynamicPrice() {
        if (!this.product) return 0;
        const basePrice = this.selectedQuality ? parseFloat(this.selectedQuality.price) : this.product.price;
        return basePrice * this.quantity;
    },

    addToCart() {
        if (!this.product) return;

        const shop = Alpine.$data(document.body);
        if (shop && typeof shop.addToCart === 'function') {
            shop.addToCart(this.product, this.quantity, this.selectedSize, this.selectedQuality);
        } else {
            console.error("shopLogic.addToCart not found");
        }
    },

    buyNow() {
        this.addToCart();
        window.location.href = "/cart.html";
    },

    payWithMoMo() {
        if (!this.product) return;
        const shop = Alpine.$data(document.body);
        if (shop && typeof shop.openMomoQuickPay === 'function') {
            shop.openMomoQuickPay(this.product, this.quantity, this.selectedSize, this.selectedQuality);
        } else {
            console.error("shopLogic.openMomoQuickPay not found");
        }
    },

    reserve() {
        if (!this.product) return;
        const shop = Alpine.$data(document.body);
        if (shop && typeof shop.initReservation === 'function') {
            shop.initReservation(this.product, this.selectedSize, this.selectedQuality);
        } else {
            console.error("shopLogic.initReservation not found");
        }
    }
});

export default productLogic;
