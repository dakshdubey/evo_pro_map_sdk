import React from 'react';

const Toolbar = ({ activeTool, onToolChange }) => {
    const tools = [
        { id: 'select', icon: '👆', label: 'Select' },
        { id: 'draw_point', icon: '📍', label: 'Add Venue' },
        { id: 'draw_line', icon: '🛣️', label: 'Add Path' },
        { id: 'draw_poly', icon: '⬠', label: 'Add Area' },
        { id: 'measure', icon: '📏', label: 'Measure' }
    ];

    return (
        <div className="toolbar">
            {tools.map(tool => (
                <button
                    key={tool.id}
                    className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
                    onClick={() => onToolChange(tool.id)}
                    title={tool.label}
                >
                    {tool.icon}
                </button>
            ))}
        </div>
    );
};

export default Toolbar;
