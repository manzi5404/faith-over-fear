import resLogic from './reservations.js';

// If we need to register global reservation logic
document.addEventListener('alpine:init', () => {
    Alpine.data('resLogic', resLogic);
});
