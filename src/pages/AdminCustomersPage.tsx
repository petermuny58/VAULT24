import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { Spinner } from "../components/Spinner";
import { Toast } from "../components/Toast";
import type { AdminCustomer } from "../types";
import { ApiError } from "../types";

type PendingAction = {
  customer: AdminCustomer;
  action: "lock" | "unlock";
};

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await api.listCustomers();
      setCustomers(list);
    } catch {
      setError("Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmAction() {
    if (!pending || busy) return;
    setBusy(true);
    try {
      if (pending.action === "lock") {
        await api.lockCustomer(pending.customer.id);
        setToast(`Locked ${pending.customer.fullName}.`);
      } else {
        await api.unlockCustomer(pending.customer.id);
        setToast(`Unlocked ${pending.customer.fullName}.`);
      }
      setPending(null);
      await load();
    } catch (err) {
      setPending(null);
      if (err instanceof ApiError) setError(err.message);
      else setError("Action failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner label="Loading customers…" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-text">Customers</h1>
        <p className="mt-1 text-sm text-muted">
          Lock or unlock customer accounts
        </p>
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

      {customers.length === 0 ? (
        <EmptyState title="No customers" description="No customer records found." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Account</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-text">
                    {c.fullName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {c.email}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {c.accountNumber}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 capitalize">
                    <span
                      className={
                        c.status === "locked" ? "text-danger" : "text-success"
                      }
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {c.status === "active" ? (
                      <Button
                        variant="danger"
                        onClick={() => setPending({ customer: c, action: "lock" })}
                      >
                        Lock
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setPending({ customer: c, action: "unlock" })
                        }
                      >
                        Unlock
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={pending !== null}
        title={pending?.action === "lock" ? "Lock customer" : "Unlock customer"}
        onClose={() => {
          if (!busy) setPending(null);
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setPending(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant={pending?.action === "lock" ? "danger" : "primary"}
              onClick={() => void confirmAction()}
              disabled={busy}
            >
              {busy
                ? "Working…"
                : pending?.action === "lock"
                  ? "Confirm lock"
                  : "Confirm unlock"}
            </Button>
          </>
        }
      >
        {pending ? (
          <p>
            {pending.action === "lock"
              ? "Lock this customer so they cannot sign in?"
              : "Unlock this customer so they can sign in again?"}
            <br />
            <span className="mt-2 inline-block font-semibold text-text">
              {pending.customer.fullName} ({pending.customer.email})
            </span>
          </p>
        ) : null}
      </Modal>

      <Toast message={toast} variant="success" onDismiss={() => setToast(null)} />
    </div>
  );
}
