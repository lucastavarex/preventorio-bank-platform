export function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

export function isImageUrl(value: string) {
  return (
    isHttpUrl(value) && /\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/i.test(value)
  )
}
