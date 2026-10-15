import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { Spinner } from "../components/Spinner";
import type { Account, Transaction } from "../types";
import { formatNgwee, maskAccountNumber } from "../utils/money";

export function DashboardPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [acc, list] = await Promise.all([
          api.getAccount(),
          api.getTransactions(),
        ]);
        if (!cancelled) {
          setAccount(acc);
          setTxs(list.slice(0, 5));
        }
      } catch {
        if (!cancelled) setError("Unable to load dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (error || !account) {
    return (
      <EmptyState title="Dashboard unavailable" description={error ?? undefined} />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Your account overview</p>
      </div>

      <section
        className="facet-clip rounded-2xl bg-accent px-5 py-6 text-accent-text sm:px-6"
        aria-label="Account summary"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-accent-text/80">
          Available balance
        </p>
        <p className="font-display mt-2 text-4xl font-bold sm:text-5xl">
          {formatNgwee(account.balanceNgwee)}
        </p>
        <p className="mt-3 text-sm text-accent-text/85">
          Account {maskAccountNumber(account.accountNumber)}
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-text">
            Recent transactions
          </h2>
          <Link
            to="/transactions"
            className="text-sm font-semibold text-accent hover:underline"
          >
            View all
          </Link>
        </div>
        {txs.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Transfers you send or receive will show up here."
          />
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {txs.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between gap-3 px-4 py-3.5"
              >
                <div>
                  <p className="text-sm font-medium text-text">
                    {tx.note || tx.reference}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(tx.date).toLocaleString()} · {tx.status}
                  </p>
                </div>
                <p
                  className={`font-display text-sm font-semibold ${
                    tx.direction === "in" ? "text-success" : "text-text"
                  }`}
                >
                  {tx.direction === "in" ? "+" : "−"}
                  {formatNgwee(tx.amountNgwee)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
