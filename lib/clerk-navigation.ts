export function navigateAfterAuth(
  decorateUrl: (url: string) => string,
  router: { push: (href: string) => void },
  path = '/dashboard'
) {
  const url = decorateUrl(path)

  if (url.startsWith('http')) {
    window.location.href = url
    return
  }

  router.push(url)
}
