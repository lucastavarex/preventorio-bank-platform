export {}

declare global {
  interface CustomJwtSessionClaims {
    user_role?: 'org:admin' | 'org:member'
  }
}
