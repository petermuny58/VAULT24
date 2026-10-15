import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api/client";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { Input } from "../components/Input";
import { Spinner } from "../components/Spinner";
import { Toast } from "../components/Toast";
import { useAuth } from "../hooks/useAuth";
import type { Profile } from "../types";
import { ApiError } from "../types";

export function ProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getProfile();
        if (!cancelled) {
          setProfile(data);
          setFullName(data.fullName);
          setPhone(data.phone);
          setAddress(data.address);
        }
      } catch {
        if (!cancelled) setError("Unable to load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    setPending(true);
    try {
      const updated = await api.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      setProfile(updated);
      await refreshUser();
      setToast("Profile updated.");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Unable to save profile.");
    } finally {
      setPending(false);
    }
  }

  if (loading) return <Spinner label="Loading profile…" />;
  if (!profile) {
    return (
      <p className="text-sm text-danger" role="alert">
        {error ?? "Profile unavailable."}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-text">Profile</h1>
        <p className="mt-1 text-sm text-muted">Update your contact details</p>
      </div>

      {error ? (
        <div
          className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:p-6"
        noValidate
      >
        <FormField id="email" label="Email" hint="Email cannot be changed here">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            readOnly
            value={profile.email}
            className="cursor-not-allowed opacity-80"
          />
        </FormField>
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
        <FormField id="phone" label="Phone">
          <Input
            id="phone"
            name="tel"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </FormField>
        <FormField id="address" label="Address">
          <Input
            id="address"
            name="street-address"
            autoComplete="street-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </FormField>
        <Button type="submit" disabled={pending} className="mt-2">
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <Toast
        message={toast}
        variant="success"
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}
