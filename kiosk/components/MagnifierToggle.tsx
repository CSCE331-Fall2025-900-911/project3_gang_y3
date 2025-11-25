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
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
      document.body.style.transition = '';
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      
      document.body.style.transform = `scale(2)`;
      document.body.style.transformOrigin = `${x}px ${y}px`;
      document.body.style.transition = 'transform 0.1s ease-out';
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
      document.body.style.transition = '';
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
