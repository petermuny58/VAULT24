import { useState, type FormEvent } from "react";
import { api } from "../api/client";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";
import { ApiError } from "../types";
import { formatNgwee, zmwToNgwee } from "../utils/money";

type Step = "form" | "success";

export function TransferPage() {
  const [step, setStep] = useState<Step>("form");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [note, setNote] = useState("");
  const [amountNgwee, setAmountNgwee] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  function resetAttempt() {
    setStep("form");
    setRecipientAccount("");
    setAmountInput("");
    setNote("");
    setAmountNgwee(0);
    setConfirmOpen(false);
    setIdempotencyKey(crypto.randomUUID());
    setPending(false);
    setError(null);
    setReference(null);
  }

  function onFormSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const ngwee = zmwToNgwee(amountInput);
      if (ngwee <= 0) {
        setError("Enter an amount greater than zero.");
        return;
      }
      if (!/^\d{10,20}$/.test(recipientAccount.trim())) {
        setError("Enter a valid recipient account number.");
        return;
      }
      setAmountNgwee(ngwee);
      setConfirmOpen(true);
    } catch {
      setError("Enter a valid amount (e.g. 25.50).");
    }
  }

  async function confirmTransfer() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await api.transfer({
        recipientAccount: recipientAccount.trim(),
        amountNgwee,
        note: note.trim() || undefined,
        idempotencyKey,
      });
      setReference(result.reference);
      setConfirmOpen(false);
      setStep("success");
    } catch (err) {
      setConfirmOpen(false);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Transfer failed. Please try again.");
      }
      // New key for a fresh attempt after failure
      setIdempotencyKey(crypto.randomUUID());
    } finally {
      setPending(false);
    }
  }

  if (step === "success" && reference) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-success/40 bg-success/10 p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-success">
            Transfer complete
          </p>
          <h1 className="font-display mt-2 text-2xl font-bold text-text">
            {formatNgwee(amountNgwee)} sent
          </h1>
          <p className="mt-3 text-sm text-muted">
            To account {recipientAccount.trim()}
          </p>
          <p className="mt-4 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text">
            Reference: <span className="font-semibold">{reference}</span>
          </p>
          <Button className="mt-6" onClick={resetAttempt}>
            Make another transfer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-text">Transfer</h1>
        <p className="mt-1 text-sm text-muted">
          Send money to another Vault24 account
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

      <form
        onSubmit={onFormSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:p-6"
        noValidate
      >
        <FormField id="recipient" label="Recipient account">
          <Input
            id="recipient"
            name="recipientAccount"
            autoComplete="off"
            inputMode="numeric"
            required
            placeholder="e.g. 26019876543210"
            value={recipientAccount}
            onChange={(e) => setRecipientAccount(e.target.value)}
          />
        </FormField>
        <FormField id="amount" label="Amount (ZMW)" hint="Use up to two decimal places">
          <Input
            id="amount"
            name="amount"
            autoComplete="off"
            inputMode="decimal"
            required
            placeholder="0.00"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
          />
        </FormField>
        <FormField id="note" label="Note (optional)">
          <Input
            id="note"
            name="note"
            autoComplete="off"
            maxLength={120}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </FormField>
        <Button type="submit" className="mt-2" disabled={pending}>
          Continue
        </Button>
      </form>

      <Modal
        open={confirmOpen}
        title="Confirm transfer"
        onClose={() => {
          if (!pending) setConfirmOpen(false);
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button onClick={() => void confirmTransfer()} disabled={pending}>
              {pending ? "Sending…" : "Confirm & send"}
            </Button>
          </>
        }
      >
        <p>
          Send{" "}
          <span className="font-semibold text-text">
            {formatNgwee(amountNgwee)}
          </span>{" "}
          to account{" "}
          <span className="font-semibold text-text">
            {recipientAccount.trim()}
          </span>
          ?
        </p>
        {note.trim() ? (
          <p className="mt-2">
            Note: <span className="text-text">{note.trim()}</span>
          </p>
        ) : null}
      </Modal>
    </div>
  );
}
