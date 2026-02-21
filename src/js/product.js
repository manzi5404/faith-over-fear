import shopLogic from './shop.js';

const productLogic = () => ({
    product: null,
    quantity: 1,
    selectedSize: "",
    selectedColor: "",
    currentImage: 0,
    relatedItems: [],
    loadingPDP: true,

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

        // Default to first product if not found or no ID
        if (!this.product) {
            this.product = products[0];
        }

        if (this.product) {
            this.selectedSize = this.product.sizes ? this.product.sizes[0] : "";
            this.selectedColor = this.product.colors ? this.product.colors[0] : "";

            // Find related items (same type, excluding current)
            this.relatedItems = products
                .filter(p => p.type === this.product.type && p.id !== this.product.id)
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
        return this.product.price * this.quantity;
    },

    addToCart() {
        if (!this.product) return;

        const shop = Alpine.$data(document.body);
        if (shop && typeof shop.addToCart === 'function') {
            shop.addToCart(this.product, this.quantity, this.selectedSize);
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
        if (shop && typeof shop.initPayment === 'function') {
            shop.initPayment(this.product, this.quantity, this.selectedSize);
        } else {
            console.error("shopLogic.initPayment not found");
        }
    }
});

export default productLogic;
