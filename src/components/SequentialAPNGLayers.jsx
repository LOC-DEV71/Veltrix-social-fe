import React, { useState, useEffect, useRef } from 'react';

// Component to fetch APNG once, and create new ObjectURL to force replay
function ReplayingAPNG({ src, active, duration }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const blobRef = useRef(null);

  // Fetch the image as a Blob ONCE
  useEffect(() => {
    let isMounted = true;
    if (!src) return;

    fetch(src)
      .then(res => res.blob())
      .then(blob => {
        if (isMounted) {
          blobRef.current = blob;
          // Initial URL
          setBlobUrl(URL.createObjectURL(blob));
        }
      })
      .catch(err => {
        // Fallback to normal src if CORS fails
        if (isMounted) setBlobUrl(src);
      });

    return () => {
      isMounted = false;
    };
  }, [src]);

  // Every time 'active' becomes true, generate a NEW ObjectURL to force browser to replay APNG from frame 0
  useEffect(() => {
    if (active && blobRef.current) {
      setBlobUrl(prev => {
        if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blobRef.current);
      });
    }
  }, [active]);

  if (!blobUrl) return null;

  return (
    <img 
      src={blobUrl} 
      alt="Effect Layer" 
      className="w-full h-full object-fill opacity-90" 
    />
  );
}

export default function SequentialAPNGLayers({ layers, durationPerLayer = 3000, className = '' }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!layers || layers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % layers.length);
    }, durationPerLayer);
    return () => clearInterval(interval);
  }, [layers, durationPerLayer]);

  if (!layers || layers.length === 0) return null;

  if (layers.length === 1) {
    return (
      <div className={`absolute inset-0 z-[100] pointer-events-none ${className}`}>
        <ReplayingAPNG src={layers[0]} active={true} duration={durationPerLayer} />
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 z-[100] pointer-events-none ${className}`}>
      {layers.map((layerUrl, idx) => (
        <div 
          key={idx} 
          className="absolute inset-0 transition-opacity duration-150"
          style={{ 
            opacity: idx === currentIndex ? 1 : 0,
            visibility: idx === currentIndex ? 'visible' : 'hidden'
          }}
        >
          <ReplayingAPNG src={layerUrl} active={idx === currentIndex} duration={durationPerLayer} />
        </div>
      ))}
    </div>
  );
}
