export function formatGBP(amount: number, opts?: { decimals?: boolean }): string {
  const decimals = opts?.decimals ?? !Number.isInteger(amount);
  return `£${amount.toLocaleString('en-GB', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercent(p: number): string {
  return `${Math.round(p * 100)}%`;
}

export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
