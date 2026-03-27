'use client';

import { memo } from 'react';

interface SecurityCardProps {
  onChangePassword: () => void;
}

function SecurityCard({ onChangePassword }: Readonly<SecurityCardProps>) {
  return (
    <div className="bg-white rounded-2xl p-8">
      <h2 className="text-2xl font-bold text-[#1B1C1A] mb-4">Security</h2>
      <p className="text-[#6B6A65] mb-6">Manage your password and keep your account secure</p>
      <button
        onClick={onChangePassword}
        className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-br from-[#755B00] to-[#C9A84C] rounded-lg hover:brightness-95 transition-all"
      >
        Change Password
      </button>
    </div>
  );
}

export default memo(SecurityCard);
