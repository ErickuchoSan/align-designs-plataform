'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { setPasswordSchema, SetPasswordFormData } from '@/lib/schemas/auth.schema';
import LoadingButton from '@/components/ui/LoadingButton';
import PasswordInput from '@/components/ui/inputs/PasswordInput';
import PasswordRequirements from '@/components/ui/inputs/PasswordRequirements';
import { CheckIcon, CloseIcon } from '@/components/ui/icons';
import { FORM_LABEL } from '@/lib/styles';

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <p className="text-xs text-[#6B6A65] leading-relaxed">
        Code verified. Create a secure password to activate your account.
      </p>
      <div>
        <label htmlFor="new-password" className={FORM_LABEL}>
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
          <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
        )}

        {newPassword && (
          <div className="mt-3">
            <PasswordRequirements
              password={newPassword}
              className="bg-[#F5F4F0] rounded-lg p-4"
            />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirm-password" className={FORM_LABEL}>
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
          <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
        )}

        {confirmPassword && (
          <p
            className={`mt-2 text-xs flex items-center gap-1 ${newPassword === confirmPassword ? 'text-[#2D6A4F]' : 'text-red-600'}`}
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

      <LoadingButton type="submit" isLoading={loading} variant="primary" size="lg" fullWidth className="uppercase tracking-widest text-sm">
        Set Password
      </LoadingButton>
    </form>
  );
}
