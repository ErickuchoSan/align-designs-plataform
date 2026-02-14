'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emailSchema, EmailFormData } from '@/lib/schemas/auth.schema';
import { ButtonLoader } from '@/components/ui/Loader';

interface EmailStepProps {
  email: string;
  onSubmit: (data: EmailFormData) => Promise<void>;
  loading: boolean;
}

export default function EmailStep({ email, onSubmit, loading }: EmailStepProps) {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-navy-900 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className={`block w-full rounded-lg border px-4 py-3 shadow-sm focus:ring-2 transition-all ${errors.email
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-stone-300 focus:border-gold-500 focus:ring-gold-500'
            }`}
          placeholder="your-email@example.com"
          autoComplete="email"
          autoFocus
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-navy-800 px-4 py-3 text-white font-medium hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all transform hover:scale-105 disabled:transform-none flex items-center justify-center"
      >
        {loading ? <ButtonLoader /> : 'Continue'}
      </button>
    </form>
  );
}
