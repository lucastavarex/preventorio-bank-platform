export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: 'admin' | 'reader'
    }
  }

  interface UserPublicMetadata {
    role?: 'admin' | 'reader'
  }
}
