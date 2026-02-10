import { gsap } from 'gsap';

export function initHeroAnimation() {
    const bag = document.getElementById('hero-bag');
    const particles = document.querySelectorAll('.hero-particle');

    if (!bag) return;

    // 1. Float Animation for the Bag
    gsap.to(bag, {
        y: -30,
        rotation: 3,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });

    // 2. Animate Handles slightly
    const handles = bag.querySelector('path:nth-child(2)');
    if (handles) {
        gsap.to(handles, {
            scaleY: 1.05,
            transformOrigin: "bottom center",
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    }

    // 3. Animate Particles
    particles.forEach((particle, index) => {
        gsap.to(particle, {
            y: (index % 2 === 0 ? '-=40' : '+=40'),
            x: (index % 2 === 0 ? '+=20' : '-=20'),
            opacity: 0.6,
            duration: 2 + Math.random() * 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: index * 0.5
        });
    });
}
