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
    console.log("F>F Frontend Loaded");
});
