const API_BASE_URL = 'https://mysql-production-f777.up.railway.app';

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
        await this.fetchMyReservations();
    },

    async fetchMyReservations() {
        this.loading = true;
        try {
            const token = localStorage.getItem('fof_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch from both APIs in parallel
            const [ordersRes, reservationsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/orders/my`, { headers }).then(r => r.json()).catch(() => ({ success: false, orders: [] })),
                fetch(`${API_BASE_URL}/api/reservations/me`, { headers }).then(r => r.json()).catch(() => ({ success: false, reservations: [] }))
            ]);

            let allReservations = [];

            // Normalize orders data
            if (ordersRes.success && ordersRes.orders) {
                ordersRes.orders.forEach(order => {
                    allReservations.push({
                        ...order,
                        productName: order.product_name || order.product_name_from_products || 'Product',
                        productImageUrls: order.product_image_urls,
                        statusSteps: this.getStatusSteps(order.status),
                        source: 'order'
                    });
                });
            }

            // Normalize legacy reservations data
            if (reservationsRes.success && reservationsRes.reservations) {
                reservationsRes.reservations.forEach(res => {
                    // Skip if we already have this as an order (avoid duplicates)
                    allReservations.push({
                        ...res,
                        productName: res.productName || 'Product',
                        productImageUrls: res.productImageUrls,
                        statusSteps: this.getStatusSteps(res.status),
                        source: 'reservation'
                    });
                });
            }

            // Sort by created_at descending
            allReservations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            this.reservations = allReservations;

        } catch (error) {
            console.error('Failed to fetch reservations:', error);
        } finally {
            this.loading = false;
        }
    },

    getStatusSteps(currentStatus) {
        const stages = ['pending', 'contacted', 'delivered', 'cancelled'];

        const steps = [
            { id: 'pending', label: 'Pending', active: false, completed: false },
            { id: 'contacted', label: 'Contacted', active: false, completed: false },
            { id: 'delivered', label: 'Delivered', active: false, completed: false }
        ];

        if (currentStatus === 'cancelled') {
            steps.push({ id: 'cancelled', label: 'Cancelled', active: true, completed: true, isTerminal: true });
        }

        const currentIndex = stages.indexOf(currentStatus);

        return steps.map((step) => {
            const stepIndex = stages.indexOf(step.id);
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

export default resLogic;
