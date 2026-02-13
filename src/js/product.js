import shopLogic from './shop.js';

const productLogic = () => ({
    product: null,
    quantity: 1,
    selectedSize: "",
    selectedColor: "",
    currentImage: 0,

    init() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const products = shopLogic().products;

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
        }
    },

    get mainImage() {
        return this.product && this.product.images[this.currentImage]
            ? this.product.images[this.currentImage]
            : "";
    },

    addToCart() {
        if (!this.product) return;

        let cart = JSON.parse(localStorage.getItem("fof_cart")) || [];

        // Check if item already exists in cart with same size and color
        const existingItemIndex = cart.findIndex(item =>
            item.id === this.product.id &&
            item.selectedSize === this.selectedSize &&
            item.selectedColor === this.selectedColor
        );

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += this.quantity;
            cart[existingItemIndex].totalPrice = cart[existingItemIndex].price * cart[existingItemIndex].quantity;
        } else {
            const item = {
                ...this.product,
                selectedSize: this.selectedSize,
                selectedColor: this.selectedColor,
                quantity: this.quantity,
                totalPrice: this.product.price * this.quantity
            };
            cart.push(item);
        }

        localStorage.setItem("fof_cart", JSON.stringify(cart));
        window.dispatchEvent(new CustomEvent("cart-updated"));
        window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Added " + this.product.name + " to Cart", type: "success" } }));
    },

    buyNow() {
        this.addToCart();
        window.location.href = "/cart.html";
    }
});

export default productLogic;
