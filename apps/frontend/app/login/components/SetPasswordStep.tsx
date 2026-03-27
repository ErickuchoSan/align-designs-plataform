'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { setPasswordSchema, SetPasswordFormData } from '@/lib/schemas/auth.schema';
import LoadingButton from '@/components/ui/LoadingButton';
import PasswordInput from '@/components/ui/inputs/PasswordInput';
import PasswordRequirements from '@/components/ui/inputs/PasswordRequirements';
import { CheckIcon, CloseIcon } from '@/components/ui/icons';

interface SetPasswordStepProps {
  onSubmit: (data: SetPasswordFormData) => Promise<void>;
  loading: boolean;
}

export default function SetPasswordStep({
  onSubmit,
  loading
}: Readonly<SetPasswordStepProps>) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  });

  const newPassword = watch('newPassword');
  const confirmPassword = watch('confirmPassword');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="text-sm text-forest-800 bg-forest-50 p-4 rounded-lg border border-forest-200">
        <p className="font-medium text-forest-900 mb-1">Code verified!</p>
        <p>Please set a password to activate your account.</p>
      </div>
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-[#1B1C1A] mb-2">
          New Password
        </label>
        <Controller
          name="newPassword"
          control={control}
          render={({ field }) => (
            <PasswordInput
              value={field.value}
              onChange={field.onChange}
              placeholder="Minimum 12 characters"
              required
              showStrengthIndicator={true}
            />
          )}
        />
        {errors.newPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
        )}

        {/* Password Requirements Checklist - shown only for new password */}
        {newPassword && (
          <div className="mt-3">
            <PasswordRequirements
              password={newPassword}
              className="bg-forest-50 border border-forest-200 rounded-lg p-4"
            />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-[#1B1C1A] mb-2">
          Confirm Password
        </label>
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <PasswordInput
              value={field.value}
              onChange={field.onChange}
              placeholder="Repeat your password"
              required
              showStrengthIndicator={false}
            />
          )}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}

        {/* Show match indicator when user starts typing confirmation */}
        {confirmPassword && (
          <p
            className={`mt-2 text-sm flex items-center gap-1 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}`}
          >
            {newPassword === confirmPassword ? (
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

      <LoadingButton type="submit" isLoading={loading} variant="primary" size="lg" fullWidth>
        Set password
      </LoadingButton>
    </form>
  );
}
