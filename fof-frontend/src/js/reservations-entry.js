import Alpine from 'alpinejs';

window.Alpine = Alpine;

const API_BASE_URL = window.API_BASE_URL || (() => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return '';
    return 'https://fof-backend-production.up.railway.app';
})();

const ORDER_STAGES = ['pending_payment', 'paid', 'processing', 'shipped', 'completed'];

const resLogic = () => ({
    reservations: [],
    loading: true,
    user: null,

    async init() {
        this.user = JSON.parse(localStorage.getItem('fof_user'));
        if (!this.user) {
            window.location.href = '/login.html';
            return;
        }
        await this.fetchMyOrders();
    },

    async fetchMyOrders() {
        this.loading = true;
        try {
            const token = localStorage.getItem('fof_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [ordersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/orders/my`, { headers }).then(r => r.json()).catch(() => ({ success: false, orders: [] }))
            ]);

            let allOrders = [];

            if (ordersRes.success && Array.isArray(ordersRes.orders)) {
                allOrders = ordersRes.orders.map(order => {
                    const items = order.order_items || order.items || [];
                    const firstItem = items[0] || {};
                    return {
                        ...order,
                        productName: firstItem.product_name || (items.length > 1 ? `${items.length} items` : 'Product'),
                        productImageUrls: order.product_image_urls || (firstItem.product_image_urls || null),
                        statusSteps: this.getStatusSteps(order.status),
                        source: 'order'
                    };
                });
            }

            allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            this.reservations = allOrders;

        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            this.loading = false;
        }
    },

    getStatusSteps(currentStatus) {
        const steps = ORDER_STAGES.map((stage) => ({
            id: stage,
            label: stage.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
            active: false,
            completed: false
        }));

        const currentIndex = ORDER_STAGES.indexOf(currentStatus);

        if (currentStatus === 'cancelled') {
            return [...steps, { id: 'cancelled', label: 'Cancelled', active: true, completed: true, isTerminal: true }];
        }

        return steps.map((step) => {
            const stepIndex = ORDER_STAGES.indexOf(step.id);
            if (step.id === currentStatus) {
                return { ...step, active: true, completed: true };
            }
            if (stepIndex < currentIndex && currentIndex !== -1) {
                return { ...step, completed: true };
            }
            return step;
        });
    }
});

Alpine.data('resLogic', resLogic);
Alpine.start();
