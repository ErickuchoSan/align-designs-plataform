'use client';

import { useState, memo } from 'react';
import Modal from '@/components/ui/Modal';
import { ButtonLoader } from '@/components/ui/Loader';
import PasswordInput from '@/components/ui/inputs/PasswordInput';
import PasswordRequirements from '@/components/ui/inputs/PasswordRequirements';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { cn, INPUT_BASE, INPUT_VARIANTS } from '@/lib/styles';
import { CheckIcon, CloseIcon } from '@/components/ui/icons';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);

    try {
      await AuthService.changePassword(passwordData);
      toast.success('Password changed successfully');
      handleClose();
      onSuccess();
    } catch (err) {
      toast.error(handleApiError(err, 'Error changing password'));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleClose = () => {
    onClose();
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Change Password" size="md">
      <form onSubmit={handleChangePassword} className="space-y-4">
        <p className="text-sm text-stone-700 mb-4">
          After changing your password, we will automatically log you out for security.
        </p>

        <div>
          <label className="block text-sm font-medium text-navy-900 mb-2">Current Password</label>
          <input
            type="password"
            required
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            className={cn(INPUT_BASE, INPUT_VARIANTS.default)}
            placeholder="Your current password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-900 mb-2">New Password</label>
          <PasswordInput
            value={passwordData.newPassword}
            onChange={(newPassword) => setPasswordData({ ...passwordData, newPassword })}
            placeholder="New password"
            required
            showStrengthIndicator={true}
          />

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
          {passwordData.confirmPassword && (
            <p
              className={`mt-2 text-sm flex items-center gap-1 ${
                passwordsMatch ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {passwordsMatch ? (
                <>
                  <CheckIcon size="md" />
                  Passwords match
                </>
              ) : (
                <>
                  <CloseIcon size="md" />
                  Passwords do not match
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={handleClose}
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
  );
}

export default memo(ChangePasswordModal);
