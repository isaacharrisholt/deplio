import { z } from 'zod'
import { passwordStrength } from 'check-password-strength'

export const passwordSchema = z.string().refine(
    (password) => {
        const { id } = passwordStrength(password)
        return id === 3
    },
    { message: 'Password is too weak' },
)
