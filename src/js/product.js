export default () => ({
    product: {
        id: 2,
        name: 'Fearless Hoodie',
        price: 85.00,
        description: 'Constructed from premium heavyweight cotton, the Fearless Hoodie is designed for those who walk by faith. Features an oversized fit, dropped shoulders, and puff-print graphics on back.',
        images: [
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800'
        ],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Black', 'Sand']
    },
    currentImage: 0,
    selectedSize: 'L',
    selectedColor: 'Black',
    quantity: 1,

    get mainImage() {
        return this.product.images[this.currentImage];
    },

    addToCart() {
        // Dispatch event to global cart
        window.dispatchEvent(new CustomEvent('notify', {
            detail: { message: `Added ${this.quantity} x ${this.product.name} to cart!` }
        }));

        // Reset quantity
        this.quantity = 1;
    },

    buyNow() {
        // Initialize direct MoMo checkout with this product
        if (window.shopLogic) {
            window.shopLogic.initPayment(this.product, this.selectedSize);
            window.shopLogic.modalQuantity = this.quantity;
        }
    }
})
