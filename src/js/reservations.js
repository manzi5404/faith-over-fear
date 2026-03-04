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
            const response = await fetch('/api/reservations/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                this.reservations = data.reservations.map(res => ({
                    ...res,
                    statusSteps: this.getStatusSteps(res.status)
                }));
            }
        } catch (error) {
            console.error('Failed to fetch reservations:', error);
        } finally {
            this.loading = false;
        }
    },

    getStatusSteps(currentStatus) {
        const stages = ['pending', 'contacted', 'delivered', 'returned', 'cancelled'];
        // If cancelled or returned, they are terminal but 'returned' is specific.
        // Standard flow: pending -> contacted -> delivered

        const steps = [
            { id: 'pending', label: 'Pending', active: false, completed: false },
            { id: 'contacted', label: 'Contacted', active: false, completed: false },
            { id: 'delivered', label: 'Delivered', active: false, completed: false }
        ];

        if (currentStatus === 'returned') {
            steps.push({ id: 'returned', label: 'Returned', active: true, completed: true, isTerminal: true });
        } else if (currentStatus === 'cancelled') {
            steps.push({ id: 'cancelled', label: 'Cancelled', active: true, completed: true, isTerminal: true });
        }

        // Map standard steps
        let foundCurrent = false;
        const currentIndex = stages.indexOf(currentStatus);

        return steps.map((step, index) => {
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
