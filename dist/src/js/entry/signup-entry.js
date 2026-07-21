import Alpine from 'alpinejs';

window.authLogic = () => ({
    name: '',
    email: '',
    password: '',
    loading: false,

    async signup() {
        this.loading = true;
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: this.name, email: this.email, password: this.password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Signup failed');
            localStorage.setItem('fof_token', data.token);
            localStorage.setItem('fof_user', JSON.stringify({ name: data.name, id: data.userId }));
            window.dispatchEvent(new CustomEvent('notify', { detail: { message: 'Signed up successfully', type: 'success' } }));
            setTimeout(() => window.location.href = '/index.html', 1500);
        } catch (error) {
            window.dispatchEvent(new CustomEvent('notify', { detail: { message: error.message, type: 'error' } }));
        } finally {
            this.loading = false;
        }
    }
});

window.Alpine = Alpine;
Alpine.start();
