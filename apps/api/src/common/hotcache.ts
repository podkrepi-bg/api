class CacheObject {
  constructor(public value: any, public expiration: number) {}
  isExpired() {
    return this.expiration < Date.now()
  }
}

export class HotCache {
  constructor(private ttl: number, private enabled: boolean) {}
  private cache: { [key: string]: CacheObject } = {}

  lookup(key: string) {
    if (!this.enabled) {
      return null
    }

    const cacheObject = this.cache[key]
    if (cacheObject && !cacheObject.isExpired()) {
      return cacheObject.value
    }
    return null
  }

  // make the ttl optional
  store(key: string, value: any, ttl?: number) {
    if (!this.enabled) {
      return
    }

    const expiration = Date.now() + (ttl || this.ttl) * 1000

    this.cache[key] = new CacheObject(value, expiration)
  }
}
