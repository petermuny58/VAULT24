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

interface MockCustomer {
  user: User;
  password: string;
  status: "active" | "locked";
  account: Account;
  profile: Profile;
  failedLogins: number;
}

const delay = (ms = 280) => new Promise((r) => setTimeout(r, ms));

let sessionUserId: string | null = null;

const idempotencyCache = new Map<string, TransferResponse>();

const customers: MockCustomer[] = [
  {
    user: {
      id: "cust-001",
      email: "chanda.mwansa@example.zm",
      fullName: "Chanda Mwansa",
      role: "customer",
    },
    password: "Vault24Secure!",
    status: "active",
    account: {
      accountNumber: "26011234567890",
      balanceNgwee: 4_582_350,
    },
    profile: {
      email: "chanda.mwansa@example.zm",
      fullName: "Chanda Mwansa",
      phone: "+260 97 123 4567",
      address: "12 Independence Ave, Lusaka",
    },
    failedLogins: 0,
  },
  {
    user: {
      id: "cust-002",
      email: "mutale.banda@example.zm",
      fullName: "Mutale Banda",
      role: "customer",
    },
    password: "Vault24Secure!",
    status: "active",
    account: {
      accountNumber: "26019876543210",
      balanceNgwee: 1_250_000,
    },
    profile: {
      email: "mutale.banda@example.zm",
      fullName: "Mutale Banda",
      phone: "+260 96 555 0199",
      address: "45 Cairo Road, Ndola",
    },
    failedLogins: 0,
  },
  {
    user: {
      id: "cust-003",
      email: "locked.user@example.zm",
      fullName: "Locked Demo User",
      role: "customer",
    },
    password: "Vault24Secure!",
    status: "locked",
    account: {
      accountNumber: "26010000000003",
      balanceNgwee: 50_000,
    },
    profile: {
      email: "locked.user@example.zm",
      fullName: "Locked Demo User",
      phone: "+260 95 000 0003",
      address: "Demo Street, Kitwe",
    },
    failedLogins: 5,
  },
];

const adminUser: User = {
  id: "admin-001",
  email: "admin@vault24.example",
  fullName: "Vault24 Admin",
  role: "admin",
};
const adminPassword = "Vault24Admin!!";

let transactions: Transaction[] = [
  {
    id: "tx-1",
    reference: "V24-9F2A1C",
    date: "2026-10-14T09:15:00.000Z",
    direction: "in",
    amountNgwee: 250_000,
    status: "completed",
    note: "Salary top-up",
    counterpartyAccount: "26015550001111",
  },
  {
    id: "tx-2",
    reference: "V24-8B3D2E",
    date: "2026-10-13T14:40:00.000Z",
    direction: "out",
    amountNgwee: 45_000,
    status: "completed",
    note: "Airtime bundle",
    counterpartyAccount: "26019876543210",
  },
  {
    id: "tx-3",
    reference: "V24-7C4E3F",
    date: "2026-10-12T11:05:00.000Z",
    direction: "out",
    amountNgwee: 120_000,
    status: "completed",
    note: "Rent share",
    counterpartyAccount: "26019876543210",
  },
  {
    id: "tx-4",
    reference: "V24-6D5F4A",
    date: "2026-10-10T16:22:00.000Z",
    direction: "in",
    amountNgwee: 80_000,
    status: "completed",
    note: "Refund",
    counterpartyAccount: "26015550002222",
  },
  {
    id: "tx-5",
    reference: "V24-5E6A5B",
    date: "2026-10-08T08:50:00.000Z",
    direction: "out",
    amountNgwee: 15_500,
    status: "completed",
    note: "Market stall",
    counterpartyAccount: "26019876543210",
  },
  {
    id: "tx-6",
    reference: "V24-4F7B6C",
    date: "2026-10-05T19:10:00.000Z",
    direction: "out",
    amountNgwee: 30_000,
    status: "failed",
    note: "Failed attempt",
    counterpartyAccount: "26010000009999",
  },
];

let auditLogs: AuditLog[] = [
  {
    id: "audit-1",
    timestamp: "2026-10-14T10:00:00.000Z",
    actor: "admin@vault24.example",
    action: "LOGIN",
    target: "admin-001",
  },
  {
    id: "audit-2",
    timestamp: "2026-10-13T08:30:00.000Z",
    actor: "admin@vault24.example",
    action: "LOCK_CUSTOMER",
    target: "cust-003",
  },
  {
    id: "audit-3",
    timestamp: "2026-10-12T15:12:00.000Z",
    actor: "admin@vault24.example",
    action: "UNLOCK_CUSTOMER",
    target: "cust-002",
  },
  {
    id: "audit-4",
    timestamp: "2026-10-11T09:45:00.000Z",
    actor: "system",
    action: "SESSION_EXPIRE",
    target: "cust-001",
  },
];

function requireSession(): User {
  if (!sessionUserId) throw new ApiError("Unauthorized", 401);
  if (sessionUserId === adminUser.id) return adminUser;
  const found = customers.find((c) => c.user.id === sessionUserId);
  if (!found) throw new ApiError("Unauthorized", 401);
  return found.user;
}

function requireAdmin(): User {
  const user = requireSession();
  if (user.role !== "admin") throw new ApiError("Forbidden", 403);
  return user;
}

function requireCustomer(): MockCustomer {
  const user = requireSession();
  if (user.role !== "customer") throw new ApiError("Forbidden", 403);
  const found = customers.find((c) => c.user.id === user.id);
  if (!found) throw new ApiError("Unauthorized", 401);
  return found;
}

function pushAudit(actor: string, action: string, target: string) {
  auditLogs = [
    {
      id: `audit-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      target,
    },
    ...auditLogs,
  ];
}

function makeReference(): string {
  return `V24-${crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export const mockApi = {
  async register(body: RegisterRequest): Promise<User> {
    await delay();
    const email = body.email.trim().toLowerCase();
    if (customers.some((c) => c.user.email === email) || email === adminUser.email) {
      throw new ApiError("Unable to create account. Try a different email.", 409);
    }
    if (body.password.length < 12) {
      throw new ApiError("Unable to create account.", 400);
    }
    const id = `cust-${crypto.randomUUID().slice(0, 8)}`;
    const accountNumber = `2601${Math.floor(10_000_000_000 + Math.random() * 89_999_999_999)}`;
    const user: User = {
      id,
      email,
      fullName: body.fullName.trim(),
      role: "customer",
    };
    customers.push({
      user,
      password: body.password,
      status: "active",
      account: { accountNumber, balanceNgwee: 100_000 },
      profile: {
        email,
        fullName: body.fullName.trim(),
        phone: "",
        address: "",
      },
      failedLogins: 0,
    });
    sessionUserId = id;
    return user;
  },

  async login(body: LoginRequest): Promise<User> {
    await delay();
    const email = body.email.trim().toLowerCase();

    if (email === adminUser.email) {
      if (body.password !== adminPassword) {
        throw new ApiError("Invalid credentials", 401);
      }
      sessionUserId = adminUser.id;
      pushAudit(adminUser.email, "LOGIN", adminUser.id);
      return adminUser;
    }

    const customer = customers.find((c) => c.user.email === email);
    if (!customer || customer.password !== body.password) {
      if (customer) {
        customer.failedLogins += 1;
        if (customer.failedLogins >= 5) {
          customer.status = "locked";
          pushAudit("system", "LOCK_CUSTOMER", customer.user.id);
        }
      }
      throw new ApiError("Invalid credentials", 401);
    }

    if (customer.status === "locked") {
      throw new ApiError("Account locked", 423);
    }

    customer.failedLogins = 0;
    sessionUserId = customer.user.id;
    return customer.user;
  },

  async logout(): Promise<void> {
    await delay(120);
    sessionUserId = null;
  },

  async me(): Promise<User> {
    await delay(120);
    return requireSession();
  },

  async getAccount(): Promise<Account> {
    await delay();
    const customer = requireCustomer();
    return { ...customer.account };
  },

  async transfer(body: TransferRequest): Promise<TransferResponse> {
    await delay(400);
    const customer = requireCustomer();

    const cached = idempotencyCache.get(body.idempotencyKey);
    if (cached) return cached;

    if (!/^\d{10,20}$/.test(body.recipientAccount.trim())) {
      throw new ApiError("Invalid recipient account.", 400);
    }
    if (body.amountNgwee <= 0) {
      throw new ApiError("Invalid amount.", 400);
    }
    if (body.amountNgwee > customer.account.balanceNgwee) {
      throw new ApiError("Insufficient funds.", 400);
    }
    if (body.recipientAccount.trim() === customer.account.accountNumber) {
      throw new ApiError("Cannot transfer to your own account.", 400);
    }

    customer.account.balanceNgwee -= body.amountNgwee;

    const recipient = customers.find(
      (c) => c.account.accountNumber === body.recipientAccount.trim(),
    );
    if (recipient) {
      recipient.account.balanceNgwee += body.amountNgwee;
    }

    const reference = makeReference();
    const tx: Transaction = {
      id: `tx-${crypto.randomUUID()}`,
      reference,
      date: new Date().toISOString(),
      direction: "out",
      amountNgwee: body.amountNgwee,
      status: "completed",
      note: body.note,
      counterpartyAccount: body.recipientAccount.trim(),
    };
    transactions = [tx, ...transactions];

    const response = { reference };
    idempotencyCache.set(body.idempotencyKey, response);
    return response;
  },

  async getTransactions(): Promise<Transaction[]> {
    await delay();
    requireCustomer();
    return transactions.map((t) => ({ ...t }));
  },

  async getProfile(): Promise<Profile> {
    await delay();
    const customer = requireCustomer();
    return { ...customer.profile };
  },

  async updateProfile(body: UpdateProfileRequest): Promise<Profile> {
    await delay();
    const customer = requireCustomer();
    customer.profile = {
      ...customer.profile,
      fullName: body.fullName.trim(),
      phone: body.phone.trim(),
      address: body.address.trim(),
    };
    customer.user = { ...customer.user, fullName: customer.profile.fullName };
    return { ...customer.profile };
  },

  async listCustomers(): Promise<AdminCustomer[]> {
    await delay();
    requireAdmin();
    return customers.map((c) => ({
      id: c.user.id,
      email: c.user.email,
      fullName: c.user.fullName,
      status: c.status,
      accountNumber: c.account.accountNumber,
    }));
  },

  async lockCustomer(id: string): Promise<void> {
    await delay();
    const admin = requireAdmin();
    const customer = customers.find((c) => c.user.id === id);
    if (!customer) throw new ApiError("Customer not found.", 404);
    customer.status = "locked";
    pushAudit(admin.email, "LOCK_CUSTOMER", id);
  },

  async unlockCustomer(id: string): Promise<void> {
    await delay();
    const admin = requireAdmin();
    const customer = customers.find((c) => c.user.id === id);
    if (!customer) throw new ApiError("Customer not found.", 404);
    customer.status = "active";
    customer.failedLogins = 0;
    pushAudit(admin.email, "UNLOCK_CUSTOMER", id);
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    await delay();
    requireAdmin();
    return auditLogs.map((l) => ({ ...l }));
  },
};
