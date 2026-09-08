export function normalizeLogin(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const login = value.trim().toLowerCase();
  if (login.length < 3 || login.length > 64) {
    return null;
  }
  return login;
}
export function validatePassword(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  if (value.length < 10) {
    return null;
  }
  return value;
}
