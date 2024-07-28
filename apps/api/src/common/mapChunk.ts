/**
 * Create a chunked array of new Map()
 * @param map map to be chunked
 * @param chunkSize The size of the chunk
 * @returns Array chunk of new Map()
 */

export function mapChunk<T extends Map<any, any>>(map: T, chunkSize: number) {
  return Array.from(map.entries()).reduce<T[]>((chunk, curr, index) => {
    const ch = Math.floor(index / chunkSize)
    if (!chunk[ch]) {
      chunk[ch] = new Map() as T
    }
    chunk[ch].set(curr[0], curr[1])
    return chunk
  }, [])
}
