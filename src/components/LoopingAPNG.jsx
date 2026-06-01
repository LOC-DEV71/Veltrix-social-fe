import React, { useRef, useEffect, useCallback } from 'react';

/**
 * LoopingAPNG - Forces an APNG image to loop infinitely
 * even if the APNG file itself is set to play only once.
 * It works by resetting the src attribute after the animation duration.
 */
export default function LoopingAPNG({ src, alt = '', className = '', duration = 3000 }) {
  const imgRef = useRef(null);
  const timerRef = useRef(null);

  const resetAnimation = useCallback(() => {
    if (imgRef.current && src) {
      // Force browser to reload the APNG by briefly clearing src then restoring with cache buster
      const separator = src.includes('?') ? '&' : '?';
      imgRef.current.src = '';
      // Use requestAnimationFrame to ensure the browser processes the empty src
      requestAnimationFrame(() => {
        if (imgRef.current) {
          imgRef.current.src = src + separator + '_t=' + Date.now();
        }
      });
    }
  }, [src]);

  useEffect(() => {
    if (!src) return;

    // Set up the loop timer
    timerRef.current = setInterval(resetAnimation, duration);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [src, duration, resetAnimation]);

  if (!src) return null;

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
    />
  );
}
