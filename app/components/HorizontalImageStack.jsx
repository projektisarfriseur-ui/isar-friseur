'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

const COOLDOWN = 400;

export default function HorizontalImageStack({
  images,
  href,
  height = 480,
  cardWidth = 320,
  cardHeight = 420,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastNavigationTime = useRef(0);

  const navigate = useCallback((direction) => {
    const now = Date.now();
    if (now - lastNavigationTime.current < COOLDOWN) return;
    lastNavigationTime.current = now;
    setCurrentIndex((prev) => {
      if (direction > 0) return prev === images.length - 1 ? 0 : prev + 1;
      return prev === 0 ? images.length - 1 : prev - 1;
    });
  }, [images.length]);

  const handleDragEnd = (_, info) => {
    const threshold = 50;
    if (info.offset.x < -threshold) navigate(1);
    else if (info.offset.x > threshold) navigate(-1);
  };

  const handleWheel = (e) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 30) navigate(delta > 0 ? 1 : -1);
  };

  const getCardStyle = (index) => {
    const total = images.length;
    let diff = index - currentIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    if (diff === 0)  return { x: 0,    scale: 1,    opacity: 1, zIndex: 5, rotateY: 0 };
    if (diff === -1) return { x: -200, scale: 0.82, opacity: 1, zIndex: 4, rotateY: 12 };
    if (diff === -2) return { x: -340, scale: 0.7,  opacity: 1, zIndex: 3, rotateY: 20 };
    if (diff === 1)  return { x: 200,  scale: 0.82, opacity: 1, zIndex: 4, rotateY: -12 };
    if (diff === 2)  return { x: 340,  scale: 0.7,  opacity: 1, zIndex: 3, rotateY: -20 };
    return { x: diff > 0 ? 500 : -500, scale: 0.6, opacity: 0, zIndex: 0, rotateY: diff > 0 ? -28 : 28 };
  };

  const isVisible = (index) => {
    const total = images.length;
    let diff = index - currentIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return Math.abs(diff) <= 2;
  };

  return (
    <div
      onWheel={handleWheel}
      style={{
        position: 'relative',
        width: '100%',
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(255,90,31,0.08) 0%, transparent 60%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: cardWidth + 340,
          height: cardHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: '1400px',
        }}
      >
        {images.map((image, index) => {
          if (!isVisible(index)) return null;
          const style = getCardStyle(index);
          const isCurrent = index === currentIndex;
          const Wrapper = ({ children }) => href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
              {children}
            </a>
          ) : children;

          return (
            <motion.div
              key={image.id ?? index}
              style={{
                position: 'absolute',
                cursor: isCurrent ? 'grab' : 'pointer',
                transformStyle: 'preserve-3d',
                zIndex: style.zIndex,
              }}
              animate={{
                x: style.x,
                scale: style.scale,
                opacity: style.opacity,
                rotateY: style.rotateY,
                zIndex: style.zIndex,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 1 }}
              drag={isCurrent ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              onClick={() => {
                if (!isCurrent) setCurrentIndex(index);
              }}
              whileTap={{ cursor: 'grabbing' }}
            >
              <div style={{
                position: 'relative',
                width: cardWidth,
                height: cardHeight,
                overflow: 'hidden',
                borderRadius: 22,
                background: image.fallback || '#1a1410',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: isCurrent
                  ? '0 30px 60px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,90,31,0.25), 0 0 40px rgba(255,90,31,0.18)'
                  : '0 14px 35px -10px rgba(0,0,0,0.55)',
              }}>
                <Wrapper>
                  <img
                    src={image.src}
                    alt={image.alt || `Image ${index + 1}`}
                    draggable={false}
                    onError={(e) => { e.currentTarget.style.opacity = 0; }}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: image.fit || 'cover',
                      objectPosition: 'center',
                      display: 'block',
                      pointerEvents: 'none',
                    }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 22,
                    background: 'linear-gradient(to top, rgba(2,2,2,0.55) 0%, transparent 38%)',
                    pointerEvents: 'none',
                  }}/>
                </Wrapper>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div style={{
        position: 'absolute',
        left: '50%', bottom: 18,
        transform: 'translateX(-50%)',
        display: 'flex', gap: 8, zIndex: 6,
      }}>
        {images.map((_, index) => {
          const active = index === currentIndex;
          return (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Image ${index + 1}`}
              style={{
                width: active ? 28 : 8,
                height: 8,
                borderRadius: 4,
                background: active ? 'var(--ghg-copper)' : 'rgba(255,255,255,0.3)',
                border: 0,
                cursor: 'pointer',
                transition: 'all 300ms var(--e-brand)',
                padding: 0,
              }}
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Previous image"
        className="stack-nav-btn"
        style={{
          position: 'absolute',
          left: 24, top: '50%',
          transform: 'translateY(-50%)',
          width: 48, height: 48,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(2,2,2,0.55)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: 'var(--ghg-paper)',
          cursor: 'pointer', zIndex: 6,
          backdropFilter: 'blur(6px)',
          transition: 'all 220ms var(--e-brand)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--ghg-copper)'; e.currentTarget.style.borderColor = 'var(--ghg-copper)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(2,2,2,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 6l-6 6 6 6"/>
        </svg>
      </button>

      <button
        type="button"
        onClick={() => navigate(1)}
        aria-label="Next image"
        className="stack-nav-btn"
        style={{
          position: 'absolute',
          right: 24, top: '50%',
          transform: 'translateY(-50%)',
          width: 48, height: 48,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(2,2,2,0.55)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: 'var(--ghg-paper)',
          cursor: 'pointer', zIndex: 6,
          backdropFilter: 'blur(6px)',
          transition: 'all 220ms var(--e-brand)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--ghg-copper)'; e.currentTarget.style.borderColor = 'var(--ghg-copper)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(2,2,2,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6"/>
        </svg>
      </button>
    </div>
  );
}
