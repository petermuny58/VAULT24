import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./Button";

const customerLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/transfer", label: "Transfer" },
  { to: "/transactions", label: "Transactions" },
  { to: "/profile", label: "Profile" },
];

const adminLinks = [
  { to: "/admin/customers", label: "Customers" },
  { to: "/admin/audit-logs", label: "Audit logs" },
];

function linkClass({ isActive }: { isActive: boolean }): string {
  return `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-accent/15 text-accent"
      : "text-muted hover:bg-surface-raised hover:text-text"
  }`;
}

export function Layout() {
  const { user, logout } = useAuth();
  const links = user?.role === "admin" ? adminLinks : customerLinks;

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-xl font-bold tracking-tight text-text">
                Vault24
              </p>
              <p className="text-xs text-muted">
                {user?.fullName}
                {user?.role === "admin" ? " · Admin" : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              className="sm:hidden"
              onClick={() => void logout()}
            >
              Sign out
            </Button>
          </div>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Main">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
            <Button
              variant="ghost"
              className="ml-1 hidden sm:inline-flex"
              onClick={() => void logout()}
            >
              Sign out
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
