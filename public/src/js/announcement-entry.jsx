import React from 'react';
import { createRoot } from 'react-dom/client';
import AnnouncementModal from '../components/AnnouncementModal.jsx';

document.addEventListener('DOMContentLoaded', () => {
    // Optimization: Check for global dismissal if we have a way to know the version 
    // without fetching. Since we don't have the version yet, we usually have to mount.
    // However, if we want to be AGGRESSIVE about performance, we could check for ANY
    // dismissal. But better to let the component handle version-specific logic.

    const rootElement = document.getElementById('announcement-root');
    if (rootElement) {
        const root = createRoot(rootElement);
        root.render(<AnnouncementModal />);
    }
});
