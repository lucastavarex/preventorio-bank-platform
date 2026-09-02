const CLERK_ERROR_PT: Record<string, string> = {
  form_identifier_not_found: 'Não encontramos uma conta com este e-mail.',
  form_password_incorrect: 'E-mail ou senha incorretos.',
  form_password_pwned: 'Esta senha não é segura. Escolha outra.',
  form_password_length_too_short: 'A senha é muito curta.',
  form_password_not_strong_enough: 'A senha precisa ser mais forte.',
  form_password_size_in_bytes_exceeded: 'A senha é longa demais.',
  form_param_format_invalid: 'Verifique os dados informados.',
  form_code_incorrect: 'Código inválido. Tente novamente.',
  captcha_invalid: 'Não foi possível validar o captcha. Tente novamente.',
  invitation_already_accepted: 'Este convite já foi aceito.',
  invitation_not_found: 'Convite inválido ou expirado.',
}

export function clerkErrorMessage(
  error?: { code?: string; message?: string } | null
) {
  if (!error) {
    return
  }

  if (error.code && CLERK_ERROR_PT[error.code]) {
    return CLERK_ERROR_PT[error.code]
  }

  return error.message
}
