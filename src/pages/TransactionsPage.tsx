import { useEffect, useState } from "react";
import { api } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { Spinner } from "../components/Spinner";
import type { Transaction } from "../types";
import { formatNgwee } from "../utils/money";

export function TransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.getTransactions();
        if (!cancelled) setTxs(list);
      } catch {
        if (!cancelled) setError("Unable to load transactions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Spinner label="Loading transactions…" />;
  if (error) {
    return <EmptyState title="Transactions unavailable" description={error} />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-text">
          Transactions
        </h1>
        <p className="mt-1 text-sm text-muted">Your recent account activity</p>
      </div>

      {txs.length === 0 ? (
        <EmptyState
          title="No transactions"
          description="When you move money, it will appear in this list."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3 font-semibold">Direction</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {txs.map((tx) => (
                <tr key={tx.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {new Date(tx.date).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text">
                    {tx.reference}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 capitalize text-text">
                    {tx.direction === "in" ? "In" : "Out"}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 font-display font-semibold ${
                      tx.direction === "in" ? "text-success" : "text-text"
                    }`}
                  >
                    {tx.direction === "in" ? "+" : "−"}
                    {formatNgwee(tx.amountNgwee)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 capitalize text-muted">
                    {tx.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
