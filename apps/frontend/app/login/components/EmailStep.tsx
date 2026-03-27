'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emailSchema, EmailFormData } from '@/lib/schemas/auth.schema';
import LoadingButton from '@/components/ui/LoadingButton';
import { cn, INPUT_BASE, INPUT_VARIANTS, FORM_LABEL } from '@/lib/styles';

interface EmailStepProps {
  email: string;
  onSubmit: (data: EmailFormData) => Promise<void>;
  loading: boolean;
}

export default function EmailStep({ email, onSubmit, loading }: Readonly<EmailStepProps>) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: email || ''
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className={FORM_LABEL}>
          Email address
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className={cn(
            INPUT_BASE,
            errors.email ? INPUT_VARIANTS.error : INPUT_VARIANTS.default
          )}
          placeholder="your@email.com"
          autoComplete="email"
          autoFocus
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>
      <LoadingButton type="submit" isLoading={loading} variant="primary" size="lg" fullWidth className="uppercase tracking-widest text-sm">
        Continue
      </LoadingButton>
    </form>
  );
}
