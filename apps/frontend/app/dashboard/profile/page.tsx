'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { api } from '@/lib/api';
import Modal from '@/app/components/Modal';
import { ButtonLoader, PageLoader } from '@/app/components/Loader';
import PhoneInput from '@/app/components/PhoneInput';
import PasswordInput from '@/app/components/PasswordInput';
import PasswordRequirements from '@/app/components/PasswordRequirements';
import DashboardHeader from '@/app/components/DashboardHeader';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errors';
import { useAutoResetMessage } from '@/hooks/useAutoResetMessage';

export default function ProfilePage() {
  const { user, loading } = useProtectedRoute();
  const { logout, updateUser } = useAuth();
  const router = useRouter();

  // Edit profile state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  // General state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-reset success messages
  useAutoResetMessage(success, setSuccess);


  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setError('');
    setSuccess('');

    try {
      await api.put('/users/profile', profileData);
      setSuccess('Profile updated successfully');
      setEditingProfile(false);

      // Update user in context (which also updates localStorage)
      updateUser(profileData);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logger.error('Error updating profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setError('');

    try {
      await api.post('/auth/change-password', passwordData);
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowSuccessModal(true);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logger.error('Error changing password:', err);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    logout();
    router.push('/login');
  };

  if (loading || !user) {
    return <PageLoader text="Loading profile..." />;
  }

  return (
    <>
      <div className="min-h-screen bg-stone-50">
        <DashboardHeader title="My Profile" showBackButton backUrl="/dashboard" />

        {/* Content */}
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 rounded-lg bg-forest-50 border border-forest-200 p-4 animate-slideDown">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-forest-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium text-forest-800">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 animate-slideDown">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Profile Info Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 animate-slideUp">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-navy-900">Personal Information</h2>
                {!editingProfile && (
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="text-navy-700 hover:text-navy-900 font-medium hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>

              {!editingProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">First Name</label>
                      <p className="text-lg text-navy-900 font-medium">{user.firstName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Last Name</label>
                      <p className="text-lg text-navy-900 font-medium">{user.lastName}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                    <p className="text-lg text-navy-900 font-medium">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text sm font-medium text-stone-700 mb-1">Phone</label>
                    <p className="text-lg text-navy-900 font-medium">{user.phone || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Role</label>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      user.role === 'ADMIN'
                        ? 'bg-gold-100 text-gold-800'
                        : 'bg-navy-100 text-navy-800'
                    }`}>
                      {user.role === 'ADMIN' ? 'Administrator' : 'Client'}
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-navy-900 mb-2">First Name</label>
                      <input
                        type="text"
                        required
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy-900 mb-2">Last Name</label>
                      <input
                        type="text"
                        required
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-2">Phone</label>
                    <PhoneInput
                      value={profileData.phone}
                      onChange={(phone) => setProfileData({ ...profileData, phone })}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProfile(false);
                        setProfileData({
                          firstName: user.firstName,
                          lastName: user.lastName,
                          phone: user.phone || '',
                        });
                      }}
                      disabled={savingProfile}
                      className="flex-1 px-5 py-3 text-sm font-medium text-navy-900 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="flex-1 px-5 py-3 text-sm font-medium text-white bg-navy-800 rounded-lg hover:bg-navy-700 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {savingProfile ? <ButtonLoader /> : 'Save changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Change Password Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 animate-slideUp">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">Security</h2>
              <p className="text-stone-700 mb-6">Manage your password and keep your account secure</p>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-6 py-3 text-sm font-medium text-white bg-gold-600 rounded-lg hover:bg-gold-500 transition-all hover:shadow-lg"
              >
                Change Password
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setError('');
        }}
        title="Change Password"
        size="md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <p className="text-sm text-stone-700 mb-4">
            After changing your password, we will automatically log you out for security.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-2">
              Current Password
            </label>
            <input
              type="password"
              required
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
              placeholder="Your current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-2">
              New Password
            </label>
            <PasswordInput
              value={passwordData.newPassword}
              onChange={(newPassword) => setPasswordData({ ...passwordData, newPassword })}
              placeholder="New password"
              required
              showStrengthIndicator={true}
            />

            {/* Password Requirements Checklist - shown only for new password */}
            {passwordData.newPassword && (
              <div className="mt-3">
                <PasswordRequirements
                  password={passwordData.newPassword}
                  className="bg-stone-50 border border-stone-200 rounded-lg p-4"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-2">
              Confirm New Password
            </label>
            <PasswordInput
              value={passwordData.confirmPassword}
              onChange={(confirmPassword) => setPasswordData({ ...passwordData, confirmPassword })}
              placeholder="Confirm new password"
              required
              showStrengthIndicator={false}
            />
            {/* Show match indicator when user starts typing confirmation */}
            {passwordData.confirmPassword && (
              <p className={`mt-2 text-sm flex items-center gap-1 ${
                passwordData.newPassword === passwordData.confirmPassword
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {passwordData.newPassword === passwordData.confirmPassword ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Passwords match
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Passwords do not match
                  </>
                )}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setError('');
              }}
              disabled={changingPassword}
              className="px-5 py-2.5 text-sm font-medium text-navy-900 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={changingPassword}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gold-600 rounded-lg hover:bg-gold-500 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] flex items-center justify-center"
            >
              {changingPassword ? <ButtonLoader /> : 'Change Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Success Confirmation Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {}} // Prevent closing without confirming
        title="Password Updated"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-forest-100 mb-4">
            <svg className="h-8 w-8 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-navy-900 mb-2">
            Password updated successfully
          </h3>
          <p className="text-sm text-stone-700 mb-6">
            For security, we will log you out. You will need to log in again with your new password.
          </p>
          <button
            onClick={handleSuccessConfirm}
            className="w-full px-5 py-3 text-sm font-medium text-white bg-navy-800 rounded-lg hover:bg-navy-700 hover:shadow-lg transition-all"
          >
            Accept
          </button>
        </div>
      </Modal>
    </>
  );
}
