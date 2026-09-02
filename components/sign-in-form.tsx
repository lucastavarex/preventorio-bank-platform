'use client'

import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
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

export function SignInForm({
  mode = 'sign-in',
}: {
  mode?: 'sign-in' | 'forgot'
}) {
  const { signIn, errors, fetchStatus } = useSignIn()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [passwordMismatch, setPasswordMismatch] = useState(false)
  const isFetching = fetchStatus === 'fetching'
  const showForgot = mode === 'forgot'

  const identifierError = clerkErrorMessage(errors.fields.identifier)
  const passwordError = clerkErrorMessage(errors.fields.password)
  const codeError = clerkErrorMessage(errors.fields.code)
  const globalError = clerkErrorMessage(errors.global?.[0])

  async function finalizeSignIn() {
    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          return
        }

        navigateAfterAuth(decorateUrl, router)
      },
    })
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const emailAddress = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')
    setEmail(emailAddress)

    const { error } = await signIn.password({
      emailAddress,
      password,
    })

    if (error) {
      return
    }

    if (signIn.status === 'complete') {
      await finalizeSignIn()
      return
    }

    if (
      signIn.status === 'needs_client_trust' ||
      signIn.status === 'needs_second_factor'
    ) {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        factor => factor.strategy === 'email_code'
      )

      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode()
      }
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await signIn.mfa.verifyEmailCode({ code })

    if (signIn.status === 'complete') {
      await finalizeSignIn()
    }
  }

  async function handleSendResetCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const emailAddress = String(formData.get('email') ?? '')
    setEmail(emailAddress)

    const { error: createError } = await signIn.create({
      identifier: emailAddress,
    })

    if (createError) {
      return
    }

    const { error: sendCodeError } =
      await signIn.resetPasswordEmailCode.sendCode()

    if (sendCodeError) {
      return
    }

    setCodeSent(true)
    setCode('')
  }

  async function handleVerifyResetCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    await signIn.resetPasswordEmailCode.verifyCode({ code })
  }

  async function handleSubmitNewPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') ?? '')
    const confirmPassword = String(formData.get('confirmPassword') ?? '')

    if (password !== confirmPassword) {
      setPasswordMismatch(true)
      return
    }

    setPasswordMismatch(false)

    const { error } = await signIn.resetPasswordEmailCode.submitPassword({
      password,
      signOutOfOtherSessions: true,
    })

    if (error) {
      return
    }

    if (signIn.status === 'complete') {
      await finalizeSignIn()
      return
    }

    if (signIn.status === 'needs_second_factor') {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        factor => factor.strategy === 'email_code'
      )

      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode()
      }
    }
  }

  const footer = (
    <FieldDescription className="px-6 text-center">
      Acesso somente por convite. Use o e-mail enviado pelo administrador.
    </FieldDescription>
  )

  if (
    signIn.status === 'needs_client_trust' ||
    signIn.status === 'needs_second_factor'
  ) {
    return (
      <AuthPageShell footer={footer}>
        <form className="p-6 md:p-8" onSubmit={handleVerify}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="font-bold text-2xl">Verifique sua conta</h1>
              <p className="text-balance text-muted-foreground">
                Enviamos um código para o seu e-mail. Informe-o para continuar.
              </p>
            </div>
            <Field data-invalid={!!codeError}>
              <FieldLabel htmlFor="code">Código</FieldLabel>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={event => setCode(event.target.value)}
                aria-invalid={!!codeError}
                required
              />
              <FieldError>{codeError}</FieldError>
            </Field>
            {globalError ? <FieldError>{globalError}</FieldError> : null}
            <Field>
              <Button type="submit" disabled={isFetching}>
                {isFetching ? <Spinner data-icon="inline-start" /> : null}
                Verificar
              </Button>
            </Field>
            <Field>
              <Button
                type="button"
                variant="ghost"
                disabled={isFetching}
                onClick={() => signIn.mfa.sendEmailCode()}
              >
                Enviar novo código
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </AuthPageShell>
    )
  }

  if (signIn.status === 'needs_new_password') {
    return (
      <AuthPageShell footer={footer}>
        <form className="p-6 md:p-8" onSubmit={handleSubmitNewPassword}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="font-bold text-2xl">Nova senha</h1>
              <p className="text-balance text-muted-foreground">
                Defina uma nova senha para acessar o portal.
              </p>
            </div>
            <Field data-invalid={!!passwordError}>
              <FieldLabel htmlFor="password">Nova senha</FieldLabel>
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
            <Field data-invalid={passwordMismatch}>
              <FieldLabel htmlFor="confirmPassword">Confirmar senha</FieldLabel>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={passwordMismatch}
                required
              />
              <FieldError>
                {passwordMismatch ? 'As senhas não coincidem.' : null}
              </FieldError>
            </Field>
            {globalError ? <FieldError>{globalError}</FieldError> : null}
            <Field>
              <Button type="submit" disabled={isFetching}>
                {isFetching ? <Spinner data-icon="inline-start" /> : null}
                Salvar senha e entrar
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </AuthPageShell>
    )
  }

  if (showForgot && codeSent) {
    return (
      <AuthPageShell footer={footer}>
        <form className="p-6 md:p-8" onSubmit={handleVerifyResetCode}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="font-bold text-2xl">Verifique o código</h1>
              <p className="text-balance text-muted-foreground">
                Enviamos um código para {email || 'o seu e-mail'}.
              </p>
            </div>
            <Field data-invalid={!!codeError}>
              <FieldLabel htmlFor="code">Código</FieldLabel>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={event => setCode(event.target.value)}
                aria-invalid={!!codeError}
                required
              />
              <FieldError>{codeError}</FieldError>
            </Field>
            {globalError ? <FieldError>{globalError}</FieldError> : null}
            <Field>
              <Button type="submit" disabled={isFetching}>
                {isFetching ? <Spinner data-icon="inline-start" /> : null}
                Verificar código
              </Button>
            </Field>
            <Field>
              <Button type="button" variant="ghost" asChild>
                <a href="/sign-in">Voltar ao login</a>
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </AuthPageShell>
    )
  }

  if (showForgot) {
    return (
      <AuthPageShell footer={footer}>
        <form className="p-6 md:p-8" onSubmit={handleSendResetCode}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="font-bold text-2xl">Esqueceu a senha?</h1>
              <p className="text-balance text-muted-foreground">
                Informe seu e-mail para receber um código de redefinição.
              </p>
            </div>
            <Field data-invalid={!!identifierError}>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nome@exemplo.com"
                autoComplete="email"
                defaultValue={email}
                aria-invalid={!!identifierError}
                required
              />
              <FieldError>{identifierError}</FieldError>
            </Field>
            {globalError ? <FieldError>{globalError}</FieldError> : null}
            <Field>
              <Button type="submit" disabled={isFetching}>
                {isFetching ? <Spinner data-icon="inline-start" /> : null}
                Enviar código
              </Button>
            </Field>
            <Field>
              <Button type="button" variant="ghost" asChild>
                <a href="/sign-in">Voltar ao login</a>
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </AuthPageShell>
    )
  }

  return (
    <AuthPageShell footer={footer}>
      <form className="p-6 md:p-8" onSubmit={handleSignIn}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="font-bold text-2xl">Bem-vindo de volta</h1>
            <p className="text-balance text-muted-foreground">
              Entre na sua conta do portal interno
            </p>
          </div>
          <Field data-invalid={!!identifierError}>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nome@exemplo.com"
              autoComplete="email"
              defaultValue={email}
              aria-invalid={!!identifierError}
              required
            />
            <FieldError>{identifierError}</FieldError>
          </Field>
          <Field data-invalid={!!passwordError}>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <a
                href="/forgot-password"
                className="text-sm underline-offset-2 hover:underline"
              >
                Esqueci minha senha
              </a>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!passwordError}
              required
            />
            <FieldError>{passwordError}</FieldError>
          </Field>
          {globalError ? <FieldError>{globalError}</FieldError> : null}
          <Field>
            <Button type="submit" disabled={isFetching}>
              {isFetching ? <Spinner data-icon="inline-start" /> : null}
              Entrar
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </AuthPageShell>
  )
}
