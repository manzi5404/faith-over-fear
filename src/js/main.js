import Alpine from 'alpinejs';
import { gsap } from 'gsap';
import { initHeroAnimation } from './animation.js';
import shopLogic from './shop.js';

window.Alpine = Alpine;
window.gsap = gsap;

window.shopLogic = shopLogic;
document.addEventListener('alpine:init', () => {
    Alpine.data('shopLogic', shopLogic);
});

Alpine.start();

// Initialize GSAP Animations
document.addEventListener('DOMContentLoaded', () => {
    initHeroAnimation();
    console.log('F>F Frontend Loaded');
});

