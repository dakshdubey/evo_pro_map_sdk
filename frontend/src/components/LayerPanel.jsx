import React from 'react';

const LayerPanel = ({ layers, onLayerToggle }) => {
    if (!layers) return null;

    return (
        <div className="layer-panel">
            <h3>Layers</h3>
            {layers.map(layer => (
                <div key={layer.id} className="layer-item">
                    <input
                        type="checkbox"
                        checked={layer.visible}
                        onChange={() => onLayerToggle(layer.id)}
                    />
                    <span>{layer.name}</span>
                </div>
            ))}
        </div>
    );
};

export default LayerPanel;
