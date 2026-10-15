/** Parse a ZMW display amount (e.g. "25.50" or "25") into integer ngwee. */
export function zmwToNgwee(zmw: string): number {
  const normalized = zmw.trim().replace(/,/g, "");
  if (!normalized || Number.isNaN(Number(normalized))) {
    throw new Error("Invalid amount");
  }

  const parts = normalized.split(".");
  const kwacha = Number(parts[0]);
  if (!Number.isInteger(kwacha) || kwacha < 0) {
    throw new Error("Invalid amount");
  }

  let ngweePart = 0;
  if (parts.length === 2) {
    const frac = parts[1].padEnd(2, "0").slice(0, 2);
    if (!/^\d{1,2}$/.test(parts[1]) || parts[1].length > 2) {
      throw new Error("Invalid amount");
    }
    ngweePart = Number(frac);
    if (!Number.isInteger(ngweePart) || ngweePart < 0 || ngweePart > 99) {
      throw new Error("Invalid amount");
    }
  } else if (parts.length > 2) {
    throw new Error("Invalid amount");
  }

  return kwacha * 100 + ngweePart;
}

/** Format integer ngwee for display as Kwacha (K). */
export function formatNgwee(ngwee: number): string {
  const sign = ngwee < 0 ? "-" : "";
  const abs = Math.abs(ngwee);
  const major = Math.floor(abs / 100);
  const minor = abs % 100;
  const majorFmt = major.toLocaleString("en-ZM");
  return `${sign}K ${majorFmt}.${minor.toString().padStart(2, "0")}`;
}

export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  const last4 = accountNumber.slice(-4);
  return `•••• •••• ${last4}`;
}
