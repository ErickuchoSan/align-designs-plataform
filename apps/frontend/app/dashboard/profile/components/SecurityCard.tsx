'use client';

import { memo } from 'react';

interface SecurityCardProps {
  onChangePassword: () => void;
}

function SecurityCard({ onChangePassword }: SecurityCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 animate-slideUp">
      <h2 className="text-2xl font-bold text-navy-900 mb-4">Security</h2>
      <p className="text-stone-700 mb-6">Manage your password and keep your account secure</p>
      <button
        onClick={onChangePassword}
        className="px-6 py-3 text-sm font-medium text-white bg-gold-600 rounded-lg hover:bg-gold-500 transition-all hover:shadow-lg"
      >
        Change Password
      </button>
    </div>
  );
}

export default memo(SecurityCard);
