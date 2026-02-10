export default () => ({
    // MoMo Merchant Configuration
    momoCode: 'FOF-MERCHANT',
    momoPhone: '250780000000',
    
    // User Payment Details
    senderName: '',
    senderPhone: '',
    amountPaid: '',
    
    // Copy Feedback State
    copyFeedback: '',
    
    // Direct Shop Checkout State
    selectedProduct: null,
    modalQuantity: 1,
    modalSize: 'M',
    
    // Cart State
    cartItems: [],
    products: [
        {
            id: 1,
            name: 'Essential Tracksuit',
            price: 120000,
            originalPrice: 120000,
            category: 'Tracksuits',
            type: 'blank-essential',
            colors: ['Beige', 'Black', 'Slate'],
            images: [
                'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800'
            ],
            sizes: ['S', 'M', 'L', 'XL'],
            stock: 15,
            soldOut: false
        },
        {
            id: 2,
            name: 'Heavyweight Blank Tee',
            price: 45000,
            originalPrice: 45000,
            category: 'Tops',
            type: 'blank-essential',
            colors: ['White', 'Black', 'Cream'],
            images: [
                'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800'
            ],
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
            stock: 25,
            soldOut: false
        },
        {
            id: 3,
            name: 'Minimalist Joggers',
            price: 75000,
            originalPrice: 75000,
            category: 'Bottoms',
            type: 'blank-essential',
            colors: ['Slate', 'Black'],
            images: [
                'https://images.unsplash.com/photo-1552664110-ad3242e2ee10?auto=format&fit=crop&q=80&w=800'
            ],
            sizes: ['M', 'L', 'XL'],
            stock: 10,
            soldOut: false
        },
        {
            id: 4,
            name: 'Oversized Blank Hoodie',
            price: 95000,
            originalPrice: 95000,
            category: 'Outerwear',
            type: 'blank-essential',
            colors: ['Cream', 'Black', 'Beige'],
            images: [
                'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800'
            ],
            sizes: ['S', 'M', 'L', 'XL'],
            stock: 8,
            soldOut: false
        },
        {
            id: 5,
            name: 'Walk By Faith Joggers',
            price: 85000,
            originalPrice: 85000,
            category: 'Bottoms',
            type: 'old-drop',
            images: ['https://images.unsplash.com/photo-1517445312882-6f233be0c58e?auto=format&fit=crop&q=80&w=600'],
            sizes: ['S', 'M', 'L', 'XL'],
            stock: 8,
            soldOut: false
        },
        {
            id: 6,
            name: 'Spirit Windbreaker',
            price: 145000,
            originalPrice: 145000,
            category: 'Outerwear',
            type: 'recent-drop',
            images: ['https://images.unsplash.com/photo-1559563458-52c69f83555d?auto=format&fit=crop&q=80&w=600'],
            sizes: ['M', 'L', 'XL'],
            stock: 3,
            soldOut: false
        },
        {
            id: 7,
            name: 'Genesis Graphic Tee',
            price: 55000,
            originalPrice: 55000,
            category: 'Tops',
            type: 'recent-drop',
            images: ['images/c.png'],
            sizes: ['S', 'M', 'L', 'XL'],
            stock: 12,
            soldOut: false
        },
        {
            id: 8,
            name: 'Longline Essential',
            price: 75000,
            originalPrice: 75000,
            category: 'Tops',
            type: 'recent-drop',
            images: ['images/long.png'],
            sizes: ['M', 'L', 'XL'],
            stock: 6,
            soldOut: false
        },
        {
            id: 9,
            name: 'Core Cargo Pants',
            price: 95000,
            originalPrice: 95000,
            category: 'Bottoms',
            type: 'recent-drop',
            images: ['images/cc.png'],
            sizes: ['30', '32', '34'],
            stock: 4,
            soldOut: false
        }
    ],
    filters: {
        category: [],
        minPrice: 0,
        maxPrice: 300000
    },
    sortBy: 'newest',

    // Global UI State
    mobileMenuOpen: false,
    cartOpen: false,
    paymentModalOpen: false,
    scrolled: false,

    // ... existing code ...

    init() {
        this.initCart();

        // Smart Header: Watch scroll position
        window.addEventListener('scroll', () => {
            this.scrolled = window.scrollY > 20;
        });
    },

    initCart() {
        const savedCart = localStorage.getItem('fof_cart');
        this.cartItems = savedCart ? JSON.parse(savedCart) : [];
    },

    persistCart() {
        localStorage.setItem('fof_cart', JSON.stringify(this.cartItems));
        // Force refresh the reference to trigger Alpine reactivity
        this.cartItems = [...this.cartItems];
        window.dispatchEvent(new CustomEvent('cart-updated'));
    },

    // Getters
    get filteredProducts() {
        return this.products.filter(product => {
            const matchesCategory = this.filters.category.length === 0 || this.filters.category.includes(product.category);
            const matchesPrice = product.price >= this.filters.minPrice && product.price <= this.filters.maxPrice;
            return matchesCategory && matchesPrice;
        }).sort((a, b) => {
            if (this.sortBy === 'price-asc') return a.price - b.price;
            if (this.sortBy === 'price-desc') return b.price - a.price;
            return 0;
        });
    },

    get newDrops() {
        return []; // Replaced by Blank Essentials slider
    },

    get blankEssentials() {
        return this.products.filter(p => p.type === 'blank-essential');
    },

    get recentDrops() {
        return this.products.filter(p => p.type === 'recent-drop');
    },

    get cartTotalNumeric() {
        return this.cartItems.reduce((acc, item) => {
            const price = Number(item.price) || 0;
            const qty = Number(item.quantity) || 0;
            return acc + (price * qty);
        }, 0);
    },

    get shippingFee() {
        return 0; // Free for now as per design
    },

    get grandTotalNumeric() {
        return this.cartTotalNumeric + this.shippingFee;
    },

    get cartTotal() {
        return this.cartTotalNumeric.toLocaleString();
    },

    get grandTotal() {
        return this.grandTotalNumeric.toLocaleString();
    },

    // Calculate display total for modal (auto-filled from cart or product)
    get displayAmount() {
        if (this.selectedProduct) {
            return (Number(this.selectedProduct.price) * Number(this.modalQuantity)).toLocaleString();
        }
        return this.grandTotal;
    },

    get displayAmountNumeric() {
        if (this.selectedProduct) {
            return Number(this.selectedProduct.price) * Number(this.modalQuantity);
        }
        return this.grandTotalNumeric;
    },

    // Actions
    addToCart(product, quantity = 1, size = 'M') {
        if (product.soldOut) {
            this.showNotification('Item is sold out.', 'error');
            return;
        }

        const existingItem = this.cartItems.find(item => item.id === product.id && item.selectedSize === size);

        if (existingItem) {
            existingItem.quantity = (Number(existingItem.quantity) || 0) + (Number(quantity) || 1);
            existingItem.totalPrice = Number(existingItem.price) * existingItem.quantity;
        } else {
            this.cartItems.push({
                id: product.id,
                name: product.name,
                price: Number(product.price),
                images: product.images,
                selectedSize: size,
                quantity: Number(quantity),
                totalPrice: Number(product.price) * Number(quantity)
            });
        }

        this.persistCart();
        this.showNotification('Added to Cart', 'success');
    },

    updateQuantity(index, delta) {
        const item = this.cartItems[index];
        if (!item) return;

        const newQty = item.quantity + delta;
        if (newQty > 0) {
            item.quantity = newQty;
            item.totalPrice = Number(item.price) * item.quantity;
            // Force reactivity
            this.cartItems = [...this.cartItems];
            this.persistCart();
        } else {
            this.removeFromCart(index);
        }
    },

    removeFromCart(index) {
        this.cartItems.splice(index, 1);
        this.persistCart();
        this.showNotification('Item removed', 'success');
    },

    initPayment(product = null, size = 'M') {
        // Reset payment fields
        this.senderName = '';
        this.senderPhone = '';
        this.copyFeedback = '';
        
        // If product is null, it's a full cart checkout
        this.selectedProduct = product;
        if (product) {
            this.modalQuantity = 1;
            this.modalSize = size;
            // Auto-set amount for single product
            this.amountPaid = (Number(product.price) * this.modalQuantity).toString();
        } else {
            // Auto-set amount for full cart
            this.amountPaid = this.grandTotalNumeric.toString();
        }
        this.paymentModalOpen = true;
    },

    verifyPayment() {
        // Validate name and phone
        const name = (this.senderName || '').trim();
        const phone = (this.senderPhone || '').trim();
        
        if (!name || name.length < 2) {
            this.showNotification('Please enter a valid name.', 'error');
            return;
        }
        
        if (!phone || phone.length < 8) {
            this.showNotification('Please enter a valid phone number.', 'error');
            return;
        }

        const isCart = !this.selectedProduct;
        const totalAmount = isCart ? this.cartTotalNumeric : (this.selectedProduct.price * this.modalQuantity);

        let itemsText = '';
        if (isCart) {
            itemsText = this.cartItems.map(i => `- ${i.name} (${i.selectedSize}) x${i.quantity}`).join('\n');
        } else {
            itemsText = `- ${this.selectedProduct.name} (${this.modalSize}) x${this.modalQuantity}`;
        }

        const orderId = 'FOF-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const message = `F>F PAYMENT VERIFICATION\n` +
            `----------------------------\n` +
            `Order ID: ${orderId}\n\n` +
            `Customer: ${this.senderName}\n` +
            `Phone: ${this.senderPhone}\n` +
            `Amount to Pay: ${totalAmount.toLocaleString()} FRW\n\n` +
            `Items:\n${itemsText}\n\n` +
            `TOTAL DUE: ${totalAmount.toLocaleString()} FRW\n` +
            `----------------------------\n` +
            `Merchant Code: ${this.momoCode}\n` +
            `Name: Faith Over Fear LTD\n\n` +
            `Please confirm you have sent the payment by attaching a screenshot.`;

        const waLink = `https://wa.me/250780000000?text=${encodeURIComponent(message)}`;
        window.open(waLink, '_blank');

        this.paymentModalOpen = false;
        // Reset inputs
        this.amountPaid = '';

        if (isCart) {
            this.cartItems = [];
            this.persistCart();
        }
    },

    async copyToClipboard(text, type) {
        try {
            await navigator.clipboard.writeText(text);
            this.copyFeedback = type;
            setTimeout(() => this.copyFeedback = '', 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            this.showNotification('Failed to copy. Please try again.', 'error');
        }
    },

    showNotification(message, type = 'success') {
        window.dispatchEvent(new CustomEvent('notify', {
            detail: { message, type }
        }));
    },

    toggleCategory(category) {
        if (this.filters.category.includes(category)) {
            this.filters.category = this.filters.category.filter(c => c !== category);
        } else {
            this.filters.category.push(category);
        }
    }
});
