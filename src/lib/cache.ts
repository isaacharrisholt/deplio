import { kv } from '@vercel/kv'
import type { UserWithTeams } from '$lib/types/supabase'

type Expires<T extends object> = {
    expiresAt: number | null
    value: T
}

/**
 * A mapping of cache keys to their types.
 */
type CacheMapping = {
    user: UserWithTeams
}

type CacheKey = keyof CacheMapping

export const cache = {
    /**
     * Get a hash value. This is an object.
     * @param key
     */
    async hgetall<Key extends CacheKey, ObjectType extends CacheMapping[Key]>(
        key: `${Key}:${string}`,
    ): Promise<ObjectType | null> {
        const value = await kv.hgetall<Expires<ObjectType>>(key)
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
    async hset<Key extends CacheKey, ObjectType extends CacheMapping[Key]>(
        key: `${Key}:${string}`,
        value: ObjectType,
        options?: { ttlSeconds?: number },
    ): Promise<number> {
        const expiresAt = options?.ttlSeconds
            ? Date.now() + options.ttlSeconds * 1000
            : null
        return await kv.hset(key, { value, expiresAt })
    },
    /**
     * Delete a key-value pair from the database.
     * @param key
     */
    async del(key: `${CacheKey}:${string}`): Promise<number> {
        return await kv.del(key)
    },
}
