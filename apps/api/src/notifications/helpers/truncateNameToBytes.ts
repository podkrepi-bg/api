export function truncateNameToBytes(name: string, maxBytes: number) {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const encoded = encoder.encode(name)
  if (encoded.length <= maxBytes) {
    return name
  }

  let truncated = encoded.slice(0, maxBytes)

  for (let i = maxBytes; i > 0; i--) {
    try {
      return decoder.decode(truncated)
    } catch (e) {
      truncated = truncated.slice(0, -1)
    }
  }

  return ''
}
