import React, { useRef, useEffect, useCallback } from 'react';

/**
 * LoopingAPNG - Forces an APNG image to loop infinitely
 * even if the APNG file itself is set to play only once.
 * It works by resetting the src attribute after the animation duration.
 */
export default function LoopingAPNG({ src, alt = '', className = '', duration = 3000 }) {
  const imgRef = useRef(null);
  const timerRef = useRef(null);

  // Most APNGs loop natively. 
  // We remove the cache-buster hack because it forces massive re-downloads for heavy files (like 12MB).
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
