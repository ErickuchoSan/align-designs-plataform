interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 12 characters',
    test: (pwd) => pwd.length >= 12,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter (A-Z)',
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter (a-z)',
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    id: 'number',
    label: 'One number (0-9)',
    test: (pwd) => /\d/.test(pwd),
  },
  {
    id: 'special',
    label: 'One special character (!@#$%...)',
    test: (pwd) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
  },
  {
    id: 'no-sequential',
    label: 'No sequential characters (abc, 123)',
    test: (pwd) => {
      const sequentialPatterns = ['abcdefghijklmnopqrstuvwxyz', '0123456789'];
      for (const pattern of sequentialPatterns) {
        for (let i = 0; i < pattern.length - 2; i++) {
          const substring = pattern.substring(i, i + 3);
          if (pwd.toLowerCase().includes(substring)) {
            return false;
          }
        }
      }
      return true;
    },
  },
  {
    id: 'no-common',
    label: 'No common patterns (password, 123456)',
    test: (pwd) => {
      const commonPatterns = [
        '123456',
        'password',
        'qwerty',
        'abc123',
        'admin123',
        'welcome123',
      ];
      return !commonPatterns.some((pattern) =>
        pwd.toLowerCase().includes(pattern)
      );
    },
  },
];

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

const getStatusClass = (isEmpty: boolean, isMet: boolean): string => {
  if (isEmpty) return 'text-gray-500';
  return isMet ? 'text-green-600' : 'text-red-500';
};

const renderStatusIcon = (isEmpty: boolean, isMet: boolean) => {
  if (isEmpty) {
    return <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" /></svg>;
  }
  if (isMet) {
    return <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>;
  }
  return <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>;
};

export default function PasswordRequirements({
  password,
  className = '',
}: PasswordRequirementsProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm font-medium text-gray-700">Password must have:</p>
      <ul className="space-y-1.5">
        {requirements.map((req) => {
          const isMet = req.test(password);
          return (
            <li
              key={req.id}
              className={`flex items-center gap-2 text-sm transition-colors ${getStatusClass(password.length === 0, isMet)}`}
            >
              {renderStatusIcon(password.length === 0, isMet)}
              <span>{req.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
