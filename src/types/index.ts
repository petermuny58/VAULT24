export type Role = "customer" | "admin";

export type CustomerStatus = "active" | "locked";

export type TransactionDirection = "in" | "out";

export type TransactionStatus = "completed" | "pending" | "failed";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface Account {
  accountNumber: string;
  balanceNgwee: number;
}

export interface Transaction {
  id: string;
  reference: string;
  date: string;
  direction: TransactionDirection;
  amountNgwee: number;
  status: TransactionStatus;
  note?: string;
  counterpartyAccount?: string;
}

export interface Profile {
  email: string;
  fullName: string;
  phone: string;
  address: string;
}

export interface AdminCustomer {
  id: string;
  email: string;
  fullName: string;
  status: CustomerStatus;
  accountNumber: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
}

export interface RegisterRequest {
  email: string;
  fullName: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TransferRequest {
  recipientAccount: string;
  amountNgwee: number;
  note?: string;
  idempotencyKey: string;
}

export interface TransferResponse {
  reference: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone: string;
  address: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
