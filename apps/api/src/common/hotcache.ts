class CacheObject {
    constructor(public value: any, public expiration: number) {}
    isExpired() {
        return this.expiration < Date.now()
    }
}

export class HotCache {
    private cache: { [key: string]: CacheObject } = {}

    get(key: string) {
        const cacheObject = this.cache[key]
        if (cacheObject && !cacheObject.isExpired()) {
            return cacheObject.value
        }
        return null
    }

    set(key: string, value: any, expiration: number) {
        this.cache[key] = new CacheObject(value, expiration)
    }
}
