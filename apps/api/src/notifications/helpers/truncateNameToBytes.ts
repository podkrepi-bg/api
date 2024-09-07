export function truncateNameToBytes(name: string, maxBytes: number) {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  let encoded = encoder.encode(name)
  if (encoded.length <= maxBytes) {
    return name
  }

  let truncated = encoded.slice(0, maxBytes)

  while (true) {
    try {
      return decoder.decode(truncated)
    } catch (e) {
      truncated = truncated.slice(0, -1)
    }
  }
}
