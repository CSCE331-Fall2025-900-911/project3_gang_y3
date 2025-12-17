"use client";
import React, { useState, useEffect } from 'react';

export default function MagnifierToggle() {
  const [isActive, setIsActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const mousePos = React.useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isActive) {
      const lens = document.getElementById('magnifier-lens');
      if (lens) lens.style.display = 'none';
      return;
    }

    // Create magnifier lens if it doesn't exist
    let lens = document.getElementById('magnifier-lens') as HTMLDivElement;
    if (!lens) {
      lens = document.createElement('div');
      lens.id = 'magnifier-lens';
      lens.style.cssText = `
        position: fixed;
        width: 200px;
        height: 200px;
        border: 3px solid #3b82f6;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        display: none;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
        overflow: hidden;
        background: white;
      `;
      document.body.appendChild(lens);

      const zoomedContent = document.createElement('div');
      zoomedContent.id = 'magnifier-content';
      zoomedContent.style.cssText = `
        position: absolute;
        transform-origin: top left;
        pointer-events: none;
      `;
      lens.appendChild(zoomedContent);
    }

    const updateMagnifier = (x: number, y: number) => {
      const lens = document.getElementById('magnifier-lens');
      const content = document.getElementById('magnifier-content');
      if (!lens || !content) return;

      const lensRadius = 100;
      const scale = 2;

      lens.style.display = 'block';
      lens.style.left = `${x - lensRadius}px`;
      lens.style.top = `${y - lensRadius}px`;

      // Clone the entire body to capture everything including backgrounds
      const bodyClone = document.body.cloneNode(true) as HTMLElement;

      // Remove the lens from the clone to avoid recursion
      const clonedLens = bodyClone.querySelector('#magnifier-lens');
      if (clonedLens) clonedLens.remove();

      content.innerHTML = '';
      content.appendChild(bodyClone);

      // Use viewport coordinates (not page coordinates) so fixed elements show correctly
      content.style.transform = `scale(${scale})`;
      content.style.left = `${-(x + window.scrollX) * scale + lensRadius}px`;
      content.style.top = `${-(y + window.scrollY) * scale + lensRadius}px`;
      content.style.width = `${window.innerWidth}px`;
      content.style.height = `${window.innerHeight}px`;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      updateMagnifier(e.clientX, e.clientY);
    };

    const handleScroll = () => {
      if (mousePos.current.x !== 0 || mousePos.current.y !== 0) {
        updateMagnifier(mousePos.current.x, mousePos.current.y);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('scroll', handleScroll, true);
      const lens = document.getElementById('magnifier-lens');
      if (lens) lens.style.display = 'none';
    };
  }, [isActive]);

  const toggleMagnifier = () => {
    setIsActive(!isActive);
  };

  if (!mounted) {
    return (
      <button
        className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors shadow-lg"
        aria-label="Toggle magnifier"
        disabled
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 text-gray-800 dark:text-gray-200"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={toggleMagnifier}
      className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-lg"
      aria-label="Toggle magnifier"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={`w-6 h-6 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
        />
      </svg>
    </button>
  );
}
