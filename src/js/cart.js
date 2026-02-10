export default () => ({
    items: [
        {
            id: 2,
            name: 'Fearless Hoodie',
            price: 85.00,
            size: 'L',
            color: 'Black',
            image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
            quantity: 1
        },
        {
            id: 3,
            name: 'Verse Cap',
            price: 30.00,
            size: 'One Size',
            color: 'Black',
            image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800',
            quantity: 2
        }
    ],

    get subtotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    get total() {
        return this.subtotal; // Add tax/shipping logic here if needed
    },

    removeItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        window.dispatchEvent(new CustomEvent('notify', {
            detail: { message: 'Item removed from cart', type: 'error' }
        }));
    },

    updateQuantity(id, delta) {
        const item = this.items.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity < 1) item.quantity = 1;
        }
    },

    checkout() {
        window.dispatchEvent(new CustomEvent('notify', {
            detail: { message: 'Checkout functionality coming soon!' }
        }));
    }
})
