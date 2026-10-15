import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { Input } from "../components/Input";
import { Spinner } from "../components/Spinner";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../types";

export function LoginPage() {
  const { user, loading, login, sessionNotice, clearSessionNotice } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
    clearSessionNotice();
    setPending(true);
    try {
      await login({ email, password });
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 423) {
        setError(
          "This account is locked. Contact support or an administrator.",
        );
      } else {
        setError("Invalid credentials");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <p className="font-display text-2xl font-bold text-text">Vault24</p>
        <h1 className="mt-1 text-lg font-semibold text-text">Sign in</h1>
        <p className="mt-1 text-sm text-muted">
          Access your fictional Vault24 Bank account.
        </p>

        {(sessionNotice || error) && (
          <div
            className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
            role="alert"
            aria-live="polite"
          >
            {error ?? sessionNotice}
          </div>
        )}

        <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit} noValidate>
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
          <FormField id="password" label="Password">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>
          <Button type="submit" disabled={pending} className="mt-2 w-full">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          New here?{" "}
          <Link to="/register" className="font-semibold text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
