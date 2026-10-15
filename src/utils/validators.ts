export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export function passwordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return "weak";
  if (score === 2) return "fair";
  if (score === 3 || score === 4) return "good";
  return "strong";
}

export function passwordStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case "weak":
      return "Weak — use at least 12 characters with mixed case, numbers, and symbols";
    case "fair":
      return "Fair — add uppercase, numbers, or symbols";
    case "good":
      return "Good — a bit longer or more variety helps";
    case "strong":
      return "Strong password";
  }
}

export function validateRegister(input: {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
}): string | null {
  if (!input.fullName.trim()) return "Full name is required.";
  if (!isValidEmail(input.email)) return "Enter a valid email address.";
  if (input.password.length < 12) return "Password must be at least 12 characters.";
  if (input.password !== input.confirmPassword) return "Passwords do not match.";
  return null;
}
