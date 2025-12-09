"use client";
import React, { useState, useEffect } from 'react';

export default function MagnifierToggle() {
  const [isActive, setIsActive] = useState(false);
  const [mounted, setMounted] = useState(false);

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
        width: 150px;
        height: 150px;
        border: 3px solid #3b82f6;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        display: none;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
        backdrop-filter: blur(0px);
        overflow: hidden;
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

    const handleMouseMove = (e: MouseEvent) => {
      const lens = document.getElementById('magnifier-lens') as HTMLDivElement;
      const content = document.getElementById('magnifier-content') as HTMLDivElement;
      if (!lens || !content) return;

      const lensRadius = 75; // Half of 150px
      const zoomLevel = 2;

      lens.style.display = 'block';
      lens.style.left = `${e.clientX - lensRadius}px`;
      lens.style.top = `${e.clientY - lensRadius}px`;

      // Clone the body content into the lens
      const bodyClone = document.body.cloneNode(true) as HTMLElement;
      
      // Remove the lens itself from the clone to avoid recursion
      const clonedLens = bodyClone.querySelector('#magnifier-lens');
      if (clonedLens) clonedLens.remove();

      content.innerHTML = '';
      content.appendChild(bodyClone);

      // Position and scale the content
      content.style.transform = `scale(${zoomLevel})`;
      content.style.left = `${-e.clientX * zoomLevel + lensRadius}px`;
      content.style.top = `${-e.clientY * zoomLevel + lensRadius}px`;
      content.style.width = `${window.innerWidth}px`;
      content.style.height = `${window.innerHeight}px`;
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
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
        <div className="w-6 h-6" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleMagnifier}
      className={`fixed bottom-4 right-4 z-50 p-3 rounded-full transition-colors shadow-lg ${
        isActive
          ? 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
          : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
      }`}
      aria-label="Toggle magnifier"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}
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
