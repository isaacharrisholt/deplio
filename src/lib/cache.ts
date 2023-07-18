import { kv } from '@vercel/kv'

type Expires<T extends object> = {
    expiresAt: number | null
    value: T
}

export const cache = {
    /**
     * Get a hash value. This is an object.
     * @param key
     */
    async hgetall<T extends object>(key: string): Promise<T | null> {
        const value = await kv.hgetall<Expires<T>>(key)
        if (!value) {
            return null
        }

        if (value.expiresAt && value.expiresAt < Date.now()) {
            await kv.del(key)
            return null
        }

        return value.value
    },
    /**
     * Set a hash value. Must be an object.
     * @param key
     * @param value
     * @param options - ttl: time to live in seconds
     */
    async hset(
        key: string,
        value: object,
        options?: { ttl?: number },
    ): Promise<number> {
        const expiresAt = options?.ttl ? Date.now() + options.ttl * 1000 : null
        return await kv.hset(key, { value, expiresAt })
    },
    /**
     * Delete a key-value pair from the database.
     * @param key
     */
    async del(key: string): Promise<number> {
        return await kv.del(key)
    },
}
