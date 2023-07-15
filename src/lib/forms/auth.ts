import { z } from 'zod'
import { passwordSchema } from '$lib/types/zodCommon'

export const emailSignupFormSchema = z
    .object({
        email: z.string().email(),
        password: passwordSchema,
        passwordConfirmation: z.string(),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
        message: 'Passwords do not match',
        path: ['passwordConfirmation'],
    })

export type EmailSignupFormSchema = z.infer<typeof emailSignupFormSchema>

export const providerSignupFormSchema = z.object({
    provider: z.enum(['github']),
})
export type ProviderSignupFormSchema = z.infer<typeof providerSignupFormSchema>

export const loginFormSchema = z.object({
    email: z.string().email(),
    password: z.string(),
})
export type LoginFormSchema = z.infer<typeof loginFormSchema>

export const otpVerificationFormSchema = z.object({
    verificationCode: z.number().default('' as unknown as number),
})
export type OtpVerificationFormSchema = z.infer<typeof otpVerificationFormSchema>
