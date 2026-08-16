import React, { createContext, useContext, useState, useEffect } from 'react';

const SpatialContext = createContext();

export const useSpatial = () => useContext(SpatialContext);

export const SpatialProvider = ({ children }) => {
  const [isSpatialOn, setIsSpatialOn] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  
  // Hand tracking state
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [currentGesture, setCurrentGesture] = useState('NONE'); // NONE, PINCH, DISTANCE, FIST, OPEN_PALM
  const [pinchDistance, setPinchDistance] = useState(0); // For resize
  
  // Interaction state
  const [selectedWidgetId, setSelectedWidgetId] = useState(null);
  
  // Layout overrides { widgetId: { x, y, w, h } }
  const [layouts, setLayouts] = useState({});

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('spatial_layouts');
    if (saved) {
      try {
        setLayouts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse spatial layouts', e);
      }
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (Object.keys(layouts).length > 0) {
      localStorage.setItem('spatial_layouts', JSON.stringify(layouts));
    } else {
      localStorage.removeItem('spatial_layouts');
    }
  }, [layouts]);

  const updateLayout = (newLayouts) => {
    setLayouts(newLayouts);
  };

  const resetLayouts = () => {
    setLayouts({}); // Will fallback to defaultLayouts in AdminDashboard
  };

  return (
    <SpatialContext.Provider value={{
      isSpatialOn, setIsSpatialOn,
      cameraActive, setCameraActive,
      handDetected, setHandDetected,
      cursor, setCursor,
      currentGesture, setCurrentGesture,
      pinchDistance, setPinchDistance,
      selectedWidgetId, setSelectedWidgetId,
      layouts, updateLayout, resetLayouts
    }}>
      {children}
    </SpatialContext.Provider>
  );
};
