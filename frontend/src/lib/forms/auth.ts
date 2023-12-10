import { z } from 'zod'
import { passwordSchema } from '$lib/types/zodCommon'

export const emailSignupFormSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: 'Username must be at least 3 characters long' })
      .max(20, { message: 'Username must be at most 20 characters long' })
      .transform((val, ctx) => {
        val = val.toLowerCase().trim()
        if (!/^[a-z0-9_-]+$/.test(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'Username can only contain alphanumeric characters, dashes and underscores',
          })
          return z.NEVER
        }
        return val
      }),
    email: z.string().email(),
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Passwords do not match',
    path: ['passwordConfirmation'],
  })

export type EmailSignupFormSchema = z.infer<typeof emailSignupFormSchema>

export const providerAuthFormSchema = z.object({
  provider: z.enum(['github']),
})
export type ProviderAuthFormSchema = z.infer<typeof providerAuthFormSchema>

export const loginFormSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})
export type LoginFormSchema = z.infer<typeof loginFormSchema>

export const otpVerificationFormSchema = z.object({
  verificationCode: z.string(),
})
export type OtpVerificationFormSchema = z.infer<typeof otpVerificationFormSchema>
