"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function MagnifierToggle() {
  const [isActive, setIsActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const lensRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const mousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    // Clone body for the magnifier content
    const clone = document.body.cloneNode(true) as HTMLElement;

    // Clean up scripts to prevent re-execution
    const scripts = clone.getElementsByTagName('script');
    while (scripts.length > 0) {
      scripts[0].parentNode?.removeChild(scripts[0]);
    }

    // Set up the clone styling
    // CRITICAL: We must lock the width/height to the original document dimensions
    // otherwise it inherits 100% from the small lens container and squashes everything.
    const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);

    clone.style.position = 'absolute';
    clone.style.left = '0';
    clone.style.top = '0';
    clone.style.width = `${window.innerWidth}px`;
    clone.style.height = `${docHeight}px`;
    clone.style.pointerEvents = 'none';
    clone.style.transformOrigin = '0 0';
    clone.style.transform = 'scale(2)'; // 2x Zoom
    clone.style.overflow = 'hidden'; // clip excess

    // Handle fixed positioning for floating controls
    // User requested "relative" positioning instead of "absolute".
    // Since original was fixed (out of flow), 'relative' (in flow) would shift layout.
    // We set height to 0 to prevent layout shift.
    const cloneControls = clone.querySelector('#floating-controls') as HTMLElement;
    if (cloneControls) {
      cloneControls.style.position = 'relative';
      cloneControls.style.height = '0';
      cloneControls.style.overflow = 'visible';
      cloneControls.style.zIndex = '50';
    }

    // Remove the lens itself from the clone if captured
    const existingLens = clone.querySelector('#magnifier-portal-root');
    if (existingLens) existingLens.remove();

    if (contentRef.current) {
      contentRef.current.innerHTML = '';
      contentRef.current.appendChild(clone);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const updateMagnifier = () => {
      if (!lensRef.current || !contentRef.current) return;

      const { x: mouseX, y: mouseY } = mousePosRef.current;
      if (mouseX === 0 && mouseY === 0) return; // ignore initial 0,0

      const radius = 75;

      // Position the lens container
      lensRef.current.style.left = `${mouseX - radius}px`;
      lensRef.current.style.top = `${mouseY - radius}px`;

      // Lens Math:
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      const tx = radius - (scrollX + mouseX) * 2;
      const ty = radius - (scrollY + mouseY) * 2;

      // Update main content transform
      contentRef.current.style.transform = `translate(${tx}px, ${ty}px)`;

      // Update "fixed" elements inside the clone
      // We find the controls in the clone and move them down by scrollY
      // so they appear to stay fixed on screen.
      const cloneControls = contentRef.current.querySelector('#floating-controls') as HTMLElement;
      if (cloneControls) {
        cloneControls.style.transform = `translateY(${scrollY}px)`;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      updateMagnifier();
    };

    const handleScroll = () => {
      updateMagnifier();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isActive]);

  const toggleMagnifier = () => {
    setIsActive(!isActive);
  };

  if (!mounted) return null;

  return (
    <>
      <button
        onClick={toggleMagnifier}
        className={`p-3 rounded-full transition-colors shadow-lg ${isActive ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
        aria-label="Toggle magnifier"
        title="Magnifier 2x"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
          />
        </svg>
      </button>

      {isActive && typeof document !== 'undefined' && createPortal(
        <div
          id="magnifier-portal-root"
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 9999,
            isolation: 'isolate'
          }}
        >
          <div
            ref={lensRef}
            style={{
              position: 'absolute',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              border: '4px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              backgroundColor: 'white',
              pointerEvents: 'none'
            }}
          >
            <div
              ref={contentRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
