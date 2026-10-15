import type {
  Account,
  AdminCustomer,
  AuditLog,
  LoginRequest,
  Profile,
  RegisterRequest,
  Transaction,
  TransferRequest,
  TransferResponse,
  UpdateProfileRequest,
  User,
} from "../types";
import { ApiError } from "../types";
import { mockApi } from "./mock";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

async function parseError(res: Response, options?: { silent401?: boolean }): Promise<never> {
  if (res.status === 401) {
    if (!options?.silent401) {
      onUnauthorized?.();
      throw new ApiError("Session expired. Please sign in again.", 401);
    }
    throw new ApiError("Invalid credentials", 401);
  }
  if (res.status === 423) {
    throw new ApiError(
      "This account is locked. Contact support or an administrator.",
      423,
    );
  }
  if (res.status === 403) {
    throw new ApiError("You do not have permission to do that.", 403);
  }
  if (res.status === 409) {
    throw new ApiError("Unable to complete that request. Please try again.", 409);
  }
  throw new ApiError("Something went wrong. Please try again.", res.status);
}

async function request<T>(
  path: string,
  init?: RequestInit,
  options?: { silent401?: boolean },
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    await parseError(res, options);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const api = {
  register(body: RegisterRequest): Promise<User> {
    if (USE_MOCK) return mockApi.register(body);
    return request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  login(body: LoginRequest): Promise<User> {
    if (USE_MOCK) return mockApi.login(body);
    return request<User>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      { silent401: true },
    );
  },

  logout(): Promise<void> {
    if (USE_MOCK) return mockApi.logout();
    return request<void>("/auth/logout", { method: "POST" });
  },

  me(): Promise<User> {
    if (USE_MOCK) return mockApi.me();
    // Silent 401: cold start with no cookie is not a session expiry.
    return request<User>("/auth/me", undefined, { silent401: true });
  },

  getAccount(): Promise<Account> {
    if (USE_MOCK) return mockApi.getAccount();
    return request<Account>("/accounts/me");
  },

  transfer(body: TransferRequest): Promise<TransferResponse> {
    if (USE_MOCK) return mockApi.transfer(body);
    return request<TransferResponse>("/transfers", {
      method: "POST",
      body: JSON.stringify({
        recipientAccount: body.recipientAccount,
        amount: body.amountNgwee,
        note: body.note,
        idempotencyKey: body.idempotencyKey,
      }),
    });
  },

  getTransactions(): Promise<Transaction[]> {
    if (USE_MOCK) return mockApi.getTransactions();
    return request<Transaction[]>("/transactions");
  },

  getProfile(): Promise<Profile> {
    if (USE_MOCK) return mockApi.getProfile();
    return request<Profile>("/profile");
  },

  updateProfile(body: UpdateProfileRequest): Promise<Profile> {
    if (USE_MOCK) return mockApi.updateProfile(body);
    return request<Profile>("/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  listCustomers(): Promise<AdminCustomer[]> {
    if (USE_MOCK) return mockApi.listCustomers();
    return request<AdminCustomer[]>("/admin/customers");
  },

  lockCustomer(id: string): Promise<void> {
    if (USE_MOCK) return mockApi.lockCustomer(id);
    return request<void>(`/admin/customers/${encodeURIComponent(id)}/lock`, {
      method: "POST",
    });
  },

  unlockCustomer(id: string): Promise<void> {
    if (USE_MOCK) return mockApi.unlockCustomer(id);
    return request<void>(`/admin/customers/${encodeURIComponent(id)}/unlock`, {
      method: "POST",
    });
  },

  getAuditLogs(): Promise<AuditLog[]> {
    if (USE_MOCK) return mockApi.getAuditLogs();
    return request<AuditLog[]>("/admin/audit-logs");
  },
};
