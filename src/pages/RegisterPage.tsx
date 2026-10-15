import { useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { Input } from "../components/Input";
import { Spinner } from "../components/Spinner";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../types";
import {
  passwordStrength,
  passwordStrengthLabel,
  validateRegister,
} from "../utils/validators";

export function RegisterPage() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const strengthHint = password ? passwordStrengthLabel(strength) : undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Spinner />
      </div>
    );
  }

  if (user) {
    return (
      <Navigate
        to={user.role === "admin" ? "/admin/customers" : "/dashboard"}
        replace
      />
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const validationError = validateRegister({
      email,
      fullName,
      password,
      confirmPassword,
    });
    if (validationError) {
      setError(validationError);
      return;
    }
    setPending(true);
    try {
      await register({ email, fullName, password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to create account. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <p className="font-display text-2xl font-bold text-text">Vault24</p>
        <h1 className="mt-1 text-lg font-semibold text-text">Create account</h1>
        <p className="mt-1 text-sm text-muted">
          Register for this fictional banking prototype.
        </p>

        {error ? (
          <div
            className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        ) : null}

        <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit} noValidate>
          <FormField id="fullName" label="Full name">
            <Input
              id="fullName"
              name="name"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </FormField>
          <FormField id="email" label="Email">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
          <FormField
            id="password"
            label="Password"
            hint={strengthHint}
            error={
              password.length > 0 && password.length < 12
                ? "Password must be at least 12 characters."
                : undefined
            }
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>
          <FormField
            id="confirmPassword"
            label="Confirm password"
            error={
              confirmPassword && confirmPassword !== password
                ? "Passwords do not match."
                : undefined
            }
          >
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormField>
          <Button type="submit" disabled={pending} className="mt-2 w-full">
            {pending ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
