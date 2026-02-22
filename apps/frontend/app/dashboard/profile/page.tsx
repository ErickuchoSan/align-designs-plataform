'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { PageLoader } from '@/components/ui/Loader';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  ProfileInfoCard,
  SecurityCard,
  DeveloperSettingsCard,
  ChangePasswordModal,
  PasswordSuccessModal,
} from './components';

export default function ProfilePage() {
  const { user, loading } = useProtectedRoute();
  const { logout, updateUser } = useAuth();
  const router = useRouter();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handlePasswordChangeSuccess = () => {
    setShowSuccessModal(true);
  };

  const handleSuccessConfirm = async () => {
    setShowSuccessModal(false);
    await logout();
    router.push('/login');
  };

  if (loading || !user) {
    return <PageLoader text="Loading profile..." />;
  }

  return (
    <>
      <div className="min-h-screen bg-stone-50">
        <DashboardHeader title="My Profile" showBackButton backUrl="/dashboard" />

        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <ProfileInfoCard user={user} onUpdateUser={updateUser} />
            <SecurityCard onChangePassword={() => setShowPasswordModal(true)} />
            <DeveloperSettingsCard isAdmin={user.role === 'ADMIN'} />
          </div>
        </main>
      </div>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordChangeSuccess}
      />

      <PasswordSuccessModal isOpen={showSuccessModal} onConfirm={handleSuccessConfirm} />
    </>
  );
}
