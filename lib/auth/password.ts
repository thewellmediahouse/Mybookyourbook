export const MIN_PASSWORD_LENGTH = 10;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isStrongPassword(password: string): boolean {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > 128) {
    return false;
  }
  return /[A-Za-z]/.test(password) && /\d/.test(password);
}

export function passwordHint(): string {
  return "Use at least 10 characters, including a letter and a number.";
}
