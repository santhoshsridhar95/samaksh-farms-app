export type DirectCustomer = { id: number; fingerprint?: string; customerName: string; phoneNumber?: string; email?: string; address?: string };
export function normalizePhone(value = "") {
  const digits = value.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}
export function findCustomers(customers: DirectCustomer[], query: string) {
  const text = query.trim().toLowerCase();
  const digits = normalizePhone(text);
  if (!text) return [];
  return customers.filter(c => [c.customerName, c.phoneNumber, c.email].some(v => v?.toLowerCase().includes(text)) ||
    (digits.length >= 3 && normalizePhone(c.phoneNumber).includes(digits)));
}
export function exactContactMatch(customers: DirectCustomer[], phone: string, email: string) {
  const digits = normalizePhone(phone);
  const matches = customers.filter(c => (digits.length >= 7 && digits === normalizePhone(c.phoneNumber)) ||
    (email.trim() && email.trim().toLowerCase() === c.email?.trim().toLowerCase()));
  return matches.length === 1 ? matches[0] : undefined;
}
