'use client';

import { useState, useEffect, memo } from 'react';

interface DeveloperSettingsCardProps {
  isAdmin: boolean;
}

function DeveloperSettingsCard({ isAdmin }: Readonly<DeveloperSettingsCardProps>) {
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      const savedDevMode = localStorage.getItem('devMode') === 'true';
      setIsDevMode(savedDevMode);
    }
  }, [isAdmin]);

  const handleToggle = () => {
    const newDevMode = !isDevMode;
    setIsDevMode(newDevMode);
    localStorage.setItem('devMode', newDevMode ? 'true' : 'false');
  };

  if (!isAdmin) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 animate-slideUp">
      <h2 className="text-2xl font-bold text-navy-900 mb-4">Developer Settings</h2>
      <p className="text-stone-700 mb-6">
        Enable detailed error messages for debugging. This will show technical details instead of
        user-friendly messages.
      </p>
      <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg border border-stone-200">
        <div>
          <h3 className="text-sm font-semibold text-navy-900">Developer Mode</h3>
          <p className="text-xs text-stone-600 mt-1">Show technical error details</p>
        </div>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 ${
            isDevMode ? 'bg-gold-600' : 'bg-stone-300'
          }`}
          role="switch"
          aria-checked={isDevMode}
          aria-label="Toggle developer mode"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isDevMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default memo(DeveloperSettingsCard);
