"use client";
import React, { useState, useEffect } from 'react';

export default function MagnifierToggle() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('text-magnified');
    };
  }, []);

  useEffect(() => {
    if (isActive) {
      document.documentElement.classList.add('text-magnified');
    } else {
      document.documentElement.classList.remove('text-magnified');
    }
  }, [isActive]);

  const toggleMagnifier = () => {
    setIsActive(!isActive);
  };

  return (
    <button
      onClick={toggleMagnifier}
      className={`p-3 rounded-full transition-colors shadow-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
      aria-label="Toggle text magnification"
      title="Toggle Larger Text"
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
  );
}
