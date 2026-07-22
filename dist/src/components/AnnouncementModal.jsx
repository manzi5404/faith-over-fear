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
                const isCheckoutPath = window.location.pathname.includes('checkout') || window.location.pathname.includes('cart');
                if (isCheckoutPath) return;

                const savedVersion = localStorage.getItem('fof_announcement_version');
                const response = await axios.get('/api/announcement');
                const data = response.data;

                if (data.success && data.announcement) {
                    const active = data.announcement;
                    if (!active.is_enabled) return;

                    if (!savedVersion || parseInt(savedVersion) !== parseInt(active.version)) {
                        setAnnouncement(active);
                        setTimeout(() => setIsVisible(true), 1200);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch drop announcement:', error);
            }
        };

        fetchAnnouncement();

        // 🟢 REAL-TIME SUBSCRIPTION (SSE)
        const eventSource = new EventSource('/api/announcement/stream');
        
        eventSource.onmessage = (event) => {
            try {
                const updatedAnn = JSON.parse(event.data);
                if (updatedAnn && updatedAnn.is_enabled) {
                    setAnnouncement(updatedAnn);
                    // Force visibility for real-time updates even if previously dismissed
                    setIsVisible(true); 
                }
            } catch (err) {
                console.error("SSE parse error:", err);
            }
        };

        return () => eventSource.close();
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        if (announcement) {
            localStorage.setItem('fof_announcement_version', announcement.version.toString());
        }
    };

    if (!announcement) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="absolute inset-0 bg-black/95 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        transition={{ type: "spring", damping: 25, stiffness: 120 }}
                        className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 shadow-[0_0_80px_rgba(255,0,0,0.15)] overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-[4px] bg-red-600 animate-pulse" />

                        <button
                            onClick={handleDismiss}
                            className="absolute top-6 right-6 z-20 text-zinc-500 hover:text-white transition-all duration-300"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="flex flex-col md:flex-row">
                            {/* Image Side */}
                            {announcement.image_url && (
                                <div className="w-full md:w-1/2 h-48 md:h-auto bg-zinc-900 overflow-hidden">
                                    <img 
                                        src={announcement.image_url} 
                                        alt={announcement.title} 
                                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                                    />
                                </div>
                            )}

                            {/* Content Side */}
                            <div className={`p-8 md:p-12 flex flex-col justify-center ${announcement.image_url ? 'md:w-1/2' : 'w-full text-center'}`}>
                                <div className="space-y-4">
                                    <span className="inline-block text-[10px] uppercase tracking-[0.6em] font-black text-red-600">
                                        Movement Alert
                                    </span>

                                    <h2 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tighter leading-none italic">
                                        {announcement.title}
                                    </h2>

                                    <div className={`w-12 h-[1px] bg-zinc-800 ${announcement.image_url ? '' : 'mx-auto'}`} />

                                    <p className="text-zinc-400 text-sm leading-relaxed font-light">
                                        {announcement.message}
                                    </p>
                                </div>

                                <div className="mt-8 space-y-4">
                                    <a
                                        href={SHOP_URL}
                                        onClick={handleDismiss}
                                        className="group relative inline-flex items-center justify-center w-full bg-white text-black text-[10px] uppercase font-black tracking-[0.3em] py-4 px-8 transition-all hover:bg-red-600 hover:text-white"
                                    >
                                        <span className="relative z-10">{announcement.button_text || "GET IT NOW"}</span>
                                    </a>

                                    <button
                                        onClick={handleDismiss}
                                        className="text-[9px] uppercase tracking-[0.4em] text-zinc-600 hover:text-zinc-300 transition-colors w-full text-center"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none">
                            <span className="text-6xl font-black text-white italic">F&gt;F</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AnnouncementModal;
