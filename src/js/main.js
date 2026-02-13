import Alpine from 'alpinejs';
import gsap from 'gsap';
import shopLogic from './shop.js';
import { initHeroAnimation } from './animations.js';

window.Alpine = Alpine;
window.gsap = gsap;

document.addEventListener("alpine:init", () => {
    Alpine.data("shopLogic", shopLogic);
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

    console.log("F>F Frontend Loaded");
});
