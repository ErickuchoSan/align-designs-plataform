// Login
export { LoginSchema, type LoginDto } from './login.schema';

// OTP
export {
  RequestOtpSchema,
  type RequestOtpDto,
  CheckEmailSchema,
  type CheckEmailDto,
  ForgotPasswordSchema,
  type ForgotPasswordDto,
  VerifyOtpSchema,
  type VerifyOtpDto,
} from './otp.schema';

// Password
export {
  SetPasswordSchema,
  type SetPasswordDto,
  ResetPasswordSchema,
  type ResetPasswordDto,
  ChangePasswordSchema,
  type ChangePasswordDto,
} from './password.schema';
