export function isNextRedirect(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  )
}

export async function withRedirectInvalidation(
  action: () => Promise<void>,
  invalidate: () => Promise<unknown>
) {
  try {
    await action()
  } catch (error) {
    if (isNextRedirect(error)) {
      await invalidate()
      throw error
    }
    throw error
  }
}
