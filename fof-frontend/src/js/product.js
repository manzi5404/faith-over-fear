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
        product_variants: [],
        product_quality_prices: []
    },
    selectedColor: "",
    quantity: 1,
    selectedSize: "",
    currentImage: 0,
    relatedItems: [],
    loadingPDP: true,
    viewedInstructions: false,
    qualityLevels: [],
    selectedQuality: null,

    async init() {
        this.loadingPDP = true;
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        const shop = Alpine.$data(document.body);
        if (shop && shop.products && shop.products.length > 0) {
            this.loadProductData(id, shop.products);
            this.loadingPDP = false;
        } else {
            window.addEventListener('products-loaded', () => {
                const updatedShop = Alpine.$data(document.body);
                if (updatedShop && updatedShop.products && updatedShop.products.length > 0) {
                    this.loadProductData(id, updatedShop.products);
                    this.loadingPDP = false;
                } else {
                    console.error("Failed to load products from shopLogic");
                    this.loadingPDP = false;
                }
            }, { once: true });
        }
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
            this.qualityLevels = this.product.product_quality_prices || [];
            this.selectedQuality = this.qualityLevels.length > 0 ? this.qualityLevels[0] : null;

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

    get unitPrice() {
        if (!this.product) return 0;
        const variants = this.product.product_variants || [];
        const v = variants.find(x => x.size === this.selectedSize && (!this.selectedColor || x.color === this.selectedColor)) || variants[0];
        if (v && v.price_override != null) return parseFloat(v.price_override);
        if (this.selectedQuality && this.selectedQuality.price != null) return parseFloat(this.selectedQuality.price);
        const qualityPrices = this.product.product_quality_prices || this.product.quality_prices || [];
        if (qualityPrices.length > 0) return parseFloat(qualityPrices[0].price || this.product.price || 0);
        return parseFloat(this.product.base_price || this.product.price || 0);
    },

    get dynamicPrice() {
        if (!this.product) return 0;
        return this.unitPrice * this.quantity;
    },

    addToCart() {
        if (!this.product) return;
        const shop = Alpine.$data(document.body);
        if (shop && typeof shop.addToCart === 'function') {
            shop.addToCart(this.product, this.quantity, this.selectedSize, this.selectedColor);
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
            shop.openMomoQuickPay(this.product, this.quantity, this.selectedSize, this.selectedColor, this.selectedQuality);
        } else {
            console.error("shopLogic.openMomoQuickPay not found");
        }
    },

    reserve() {
        if (!this.product) return;
        const shop = Alpine.$data(document.body);
        if (shop && typeof shop.initReservation === 'function') {
            shop.initReservation(this.product, this.selectedSize, this.selectedColor);
        } else {
            console.error("shopLogic.initReservation not found");
        }
    }
});

export default productLogic;
