import React from 'react';

const Toolbar = ({ activeTool, onToolChange, onLocationToggle, locationEnabled, mapTheme, onThemeChange }) => {
    const tools = [
        { id: 'select', icon: 'cursor', label: 'Select' },
        { id: 'location', icon: 'location', label: 'My Location', special: true },
        { id: 'globe', icon: 'globe', label: 'Toggle Globe View', special: true },
        { id: 'draw_point', icon: 'pin', label: 'Add Venue' },
        { id: 'draw_line', icon: 'route', label: 'Add Path' },
        { id: 'draw_poly', icon: 'polygon', label: 'Add Area' },
        { id: 'measure', icon: 'ruler', label: 'Measure Distance' },
        { id: 'search', icon: 'search', label: 'Search Location' },
        { id: 'export', icon: 'download', label: 'Export Data' },
        { id: 'screenshot', icon: 'camera', label: 'Screenshot' },
        { id: 'fullscreen', icon: 'fullscreen', label: 'Fullscreen' },
        { id: 'clear', icon: 'trash', label: 'Clear Drawings' }
    ];

    const themeOptions = [
        { id: 'light', icon: 'sun', label: 'Light Mode' },
        { id: 'dark', icon: 'moon', label: 'Dark Mode' },
        { id: 'satellite', icon: 'satellite', label: 'Satellite' }
    ];

    const handleToolClick = (tool) => {
        if (tool.id === 'location') {
            onLocationToggle();
        } else {
            onToolChange(tool.id);
        }
    };

    const getIcon = (iconName) => {
        const icons = {
            cursor: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg>,
            location: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
            pin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
            route: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
            polygon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l9 4.9V17L12 22l-9-4.9V7z" /></svg>,
            ruler: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.42 6.11l-3.53-3.53a1 1 0 0 0-1.42 0L2.58 16.47a1 1 0 0 0 0 1.42l3.53 3.53a1 1 0 0 0 1.42 0L21.42 7.53a1 1 0 0 0 0-1.42z" /><path d="M6.41 9.59L8.83 12m-1.42-7.07l2.83 2.83m2.83-2.83l2.83 2.83m2.83-2.83l2.83 2.83" /></svg>,
            search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>,
            download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
            camera: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>,
            fullscreen: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>,
            trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
            sun: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>,
            moon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
            satellite: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
        };
        return icons[iconName] || icons.cursor;
    };

    return (
        <div className="toolbar">
            {/* Theme Selector */}
            <div className="theme-selector">
                {themeOptions.map(theme => (
                    <button
                        key={theme.id}
                        className={`theme-btn ${mapTheme === theme.id ? 'active' : ''}`}
                        onClick={() => onThemeChange(theme.id)}
                        title={theme.label}
                    >
                        {getIcon(theme.icon)}
                    </button>
                ))}
            </div>

            <div className="toolbar-divider"></div>

            {/* Tools */}
            {tools.map(tool => (
                <button
                    key={tool.id}
                    className={`tool-btn ${tool.id === 'location'
                        ? (locationEnabled ? 'active location-active' : '')
                        : (activeTool === tool.id ? 'active' : '')
                        }`}
                    onClick={() => handleToolClick(tool)}
                    title={tool.label}
                >
                    {getIcon(tool.icon)}
                </button>
            ))}
        </div>
    );
};

export default Toolbar;
