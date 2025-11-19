export interface PasswordStrength {
  score: number; // 0-5
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    symbol: boolean;
  };
}

export interface PasswordValidation {
  isValid: boolean;
  error?: string;
  strength?: PasswordStrength;
}
