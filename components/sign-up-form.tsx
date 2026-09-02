'use client'

import { useSignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { FormEvent } from 'react'
import { AuthPageShell } from '@/components/auth-page-shell'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { clerkErrorMessage } from '@/lib/clerk-errors'
import { navigateAfterAuth } from '@/lib/clerk-navigation'

export function SignUpForm() {
  const { signUp, errors, fetchStatus } = useSignUp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const ticket = searchParams.get('__clerk_ticket')
  const isFetching = fetchStatus === 'fetching'

  const firstNameError = clerkErrorMessage(errors.fields.firstName)
  const lastNameError = clerkErrorMessage(errors.fields.lastName)
  const passwordError = clerkErrorMessage(errors.fields.password)
  const globalError = clerkErrorMessage(errors.global?.[0])

  const footer = (
    <FieldDescription className="px-6 text-center">
      Acesso somente por convite. Use o e-mail enviado pelo administrador.
    </FieldDescription>
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!ticket) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const firstName = String(formData.get('firstName') ?? '')
    const lastName = String(formData.get('lastName') ?? '')
    const password = String(formData.get('password') ?? '')

    const { error } = await signUp.create({
      strategy: 'ticket',
      ticket,
      firstName,
      lastName,
      password,
    })

    if (error) {
      return
    }

    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return
          }

          navigateAfterAuth(decorateUrl, router)
        },
      })
    }
  }

  if (!ticket) {
    return (
      <AuthPageShell footer={footer}>
        <div className="flex flex-col justify-center p-6 md:p-8">
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="font-bold text-2xl">Acesso somente por convite</h1>
              <p className="text-balance text-muted-foreground">
                Este portal não possui cadastro público. Use o link enviado por
                e-mail ou entre com uma conta existente.
              </p>
            </div>
            <Field>
              <Button asChild>
                <Link href="/sign-in">Ir para o login</Link>
              </Button>
            </Field>
          </FieldGroup>
        </div>
      </AuthPageShell>
    )
  }

  return (
    <AuthPageShell footer={footer}>
      <form className="p-6 md:p-8" onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="font-bold text-2xl">Aceitar convite</h1>
            <p className="text-balance text-muted-foreground">
              Defina seu nome e uma senha para ativar o acesso ao portal.
            </p>
          </div>
          <Field data-invalid={!!firstNameError}>
            <FieldLabel htmlFor="firstName">Nome</FieldLabel>
            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              aria-invalid={!!firstNameError}
              required
            />
            <FieldError>{firstNameError}</FieldError>
          </Field>
          <Field data-invalid={!!lastNameError}>
            <FieldLabel htmlFor="lastName">Sobrenome</FieldLabel>
            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              aria-invalid={!!lastNameError}
              required
            />
            <FieldError>{lastNameError}</FieldError>
          </Field>
          <Field data-invalid={!!passwordError}>
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!passwordError}
              required
            />
            <FieldError>{passwordError}</FieldError>
          </Field>
          {globalError ? <FieldError>{globalError}</FieldError> : null}
          <div id="clerk-captcha" />
          <Field>
            <Button type="submit" disabled={isFetching}>
              {isFetching ? <Spinner data-icon="inline-start" /> : null}
              Ativar conta
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </AuthPageShell>
  )
}
