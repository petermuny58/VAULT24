import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { FormField } from "../components/FormField";
import { Spinner } from "../components/Spinner";
import type { AuditLog } from "../types";

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.getAuditLogs();
        if (!cancelled) setLogs(list);
      } catch {
        if (!cancelled) setError("Unable to load audit logs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const actions = useMemo(() => {
    const set = new Set(logs.map((l) => l.action));
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    if (actionFilter === "all") return logs;
    return logs.filter((l) => l.action === actionFilter);
  }, [logs, actionFilter]);

  if (loading) return <Spinner label="Loading audit logs…" />;
  if (error) {
    return <EmptyState title="Audit logs unavailable" description={error} />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">
            Audit logs
          </h1>
          <p className="mt-1 text-sm text-muted">
            Administrative actions recorded by the system
          </p>
        </div>
        <div className="w-full sm:w-56">
          <FormField id="actionFilter" label="Filter by action">
            <select
              id="actionFilter"
              className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">All actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching logs"
          description="Try a different action filter."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Actor</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text">
                    {log.actor}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text">
                    {log.action}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {log.target}
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
