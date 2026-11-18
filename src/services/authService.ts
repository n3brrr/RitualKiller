import { supabase } from '@/lib/supabase'
import { browserTimeZone } from '@/services/settingsService'

export async function signUpWithEmail(
  email: string,
  password: string,
  username: string,
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: { username, timezone: browserTimeZone() },
    },
  })
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function requestPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
}

export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword })
}

/**
 * Changing the password from a signed-in session requires the current one,
 * so a hijacked session cannot take over the account. ("Secure password
 * change" must also be enabled in Supabase Auth.)
 */
export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ error: Error | null; wrongCurrent: boolean }> {
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  })
  if (verifyError) return { error: verifyError, wrongCurrent: true }
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  return { error, wrongCurrent: false }
}

export async function signOut() {
  return supabase.auth.signOut()
}
