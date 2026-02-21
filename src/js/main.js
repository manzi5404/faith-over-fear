import Alpine from 'alpinejs';
import gsap from 'gsap';
import shopLogic from './shop.js';
import productLogic from './product.js';
import { initHeroAnimation } from './animations.js';

window.Alpine = Alpine;
window.gsap = gsap;

document.addEventListener("alpine:init", () => {
    Alpine.data("shopLogic", shopLogic);
    Alpine.data("productLogic", productLogic);
});

Alpine.start();

document.addEventListener("DOMContentLoaded", () => {
    initHeroAnimation();

    // Header Scroll Logic
    const header = document.querySelector(".site-header");
    let lastScrollTop = 0;
    const threshold = 100;

    window.addEventListener("scroll", () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Handle scrolled state (glassmorphism) - sync with Alpine if needed, 
        // but here we just ensure the header-hidden logic works.

        if (scrollTop > lastScrollTop && scrollTop > threshold) {
            // Scrolling down
            header.classList.add("header-hidden");
        } else {
            // Scrolling up
            header.classList.remove("header-hidden");
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, { passive: true });

    // Authentication & Notification Logic
    const checkAuth = () => {
        const token = localStorage.getItem('fof_token');
        const user = JSON.parse(localStorage.getItem('fof_user') || 'null');
        return { isLoggedIn: !!token, user };
    };

    const showAuthNotification = () => {
        const { isLoggedIn } = checkAuth();
        const lastPrompt = localStorage.getItem('fof_last_auth_prompt');
        const now = Date.now();

        // Only show if not logged in and haven't prompted in the last 24 hours
        if (!isLoggedIn && (!lastPrompt || now - parseInt(lastPrompt) > 24 * 60 * 60 * 1000)) {
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('show-auth-modal'));
                localStorage.setItem('fof_last_auth_prompt', now.toString());
            }, 5000); // Show after 5 seconds
        }
    };

    // Global State for Settings & Announcements
    const fetchGlobalData = async () => {
        try {
            const [settingsRes, announcementsRes] = await Promise.all([
                fetch('/api/settings').then(r => r.json()).catch(() => ({ success: false })),
                fetch('/api/announcements').then(r => r.json()).catch(() => ({ success: false }))
            ]);

            if (settingsRes.success) {
                window.storeSettings = settingsRes.settings;
                document.body.dispatchEvent(new CustomEvent('settings-loaded', { detail: settingsRes.settings }));
            }
            if (announcementsRes.success && announcementsRes.announcements.length > 0) {
                // Handle announcements (e.g., show a top bar)
                window.announcements = announcementsRes.announcements;
                document.body.dispatchEvent(new CustomEvent('announcements-loaded', { detail: announcementsRes.announcements }));
            }
        } catch (err) {
            console.warn("Could not fetch global data, using defaults.");
        }
    };

    fetchGlobalData();
    showAuthNotification();

    console.log("F>F Frontend Loaded");
});
