import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

/**
 * AnnouncementModal Component
 * 
 * Features:
 * - Fetches latest announcement from /api/announcement
 * - Version-based persistence using localStorage
 * - Framer Motion animations (Fade + Scale)
 * - Glassmorphism fallback and minimalist design
 * - Mobile responsive
 */
// Global constant for the shop destination
const SHOP_URL = "/shop"; // Hardcoded as requested

const AnnouncementModal = () => {
    const [announcement, setAnnouncement] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            try {
                // UX Rule: Do not block checkout or cart pages
                const isCheckoutPath = window.location.pathname.includes('checkout') ||
                    window.location.pathname.includes('cart');
                if (isCheckoutPath) return;

                // Pre-fetch check: Quick local check (Redundant but safe)
                const savedVersion = localStorage.getItem('fof_announcement_version');

                const response = await axios.get('/api/announcement');
                const data = response.data;

                if (data.success && data.announcement) {
                    const active = data.announcement;
                    console.log("Announcement Data:", active); // Debug logging as requested

                    // Only display if is_enabled is true
                    if (!active.is_enabled) return;

                    // Persistence Logic: Compare version with localStorage
                    // Logic: version is integer, savedVersion is string. 
                    if (!savedVersion || parseInt(savedVersion) !== parseInt(active.version)) {
                        setAnnouncement(active);
                        // Delay modal appearance for a premium feel
                        setTimeout(() => setIsVisible(true), 800);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch drop announcement:', error);
            }
        };

        fetchAnnouncement();
    }, []);

    // Centralized Dismissal Logic
    const handleDismiss = () => {
        setIsVisible(false);
        if (announcement) {
            localStorage.setItem('fof_announcement_version', announcement.version.toString());
        }
    };

    const handleCTAClick = (e) => {
        // Prevent default only if we need to ensure localStorage is set first
        // In most cases, localStorage.setItem is fast enough, but let's be safe.
        handleDismiss();
        // Since handleDismiss triggers state change, but navigation might be immediate,
        // we allow the natural href to work.
    };

    if (!announcement) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 overflow-hidden">
                    {/* Professional Backdrop with Blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                    />

                    {/* Modal Content Box */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 30, stiffness: 200 }}
                        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        {/* Elegant Top Border Accent */}
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-red-600" />

                        {/* Close Button (X) */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-all duration-300 transform hover:rotate-90"
                            aria-label="Close Announcement"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="p-8 md:p-12 text-center space-y-7">
                            <div className="space-y-3">
                                <motion.span
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="inline-block text-[10px] uppercase tracking-[0.5em] font-bold text-red-600"
                                >
                                    F&gt;F Drop Alert
                                </motion.span>

                                <h2 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-tighter leading-tight italic">
                                    {announcement.title}
                                </h2>
                            </div>

                            <div className="w-16 h-[1px] bg-zinc-800 mx-auto" />

                            <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-xs mx-auto font-light">
                                {announcement.message || "No message provided"}
                            </p>

                            <div className="pt-4">
                                <a
                                    href={SHOP_URL}
                                    onClick={handleCTAClick}
                                    className="group relative inline-flex items-center justify-center w-full bg-white text-black text-[11px] uppercase font-bold tracking-[0.25em] py-5 px-10 transition-all duration-500 hover:bg-red-600 hover:text-white"
                                >
                                    <span className="relative z-10">{announcement.button_text || "SHOP THE DROP"}</span>
                                    <div className="absolute inset-0 bg-red-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                                </a>
                            </div>

                            <button
                                onClick={handleDismiss}
                                className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 hover:text-zinc-300 transition-colors pt-2 block mx-auto underline-offset-4 hover:underline"
                            >
                                Not Today
                            </button>
                        </div>

                        {/* Subtle Branding Bottom Accent */}
                        <div className="absolute bottom-0 right-0 p-3 opacity-10 pointer-events-none">
                            <span className="text-4xl font-black text-white">F&gt;F</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AnnouncementModal;
