import { Suspense } from 'react'
import { AuthFormFallback } from '@/components/auth-page-shell'
import { SignUpForm } from '@/components/sign-up-form'

export default function SignUpPage() {
  return (
    <Suspense fallback={<AuthFormFallback />}>
      <SignUpForm />
    </Suspense>
  )
}
