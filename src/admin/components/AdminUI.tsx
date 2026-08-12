import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

type PanelProps = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  helper?: string;
  tone?: "green" | "blue" | "amber" | "red" | "violet" | "slate";
  critical?: boolean;
};

type FieldProps = {
  label: string;
  children: ReactNode;
  span?: "full";
  required?: boolean;
  optional?: boolean;
  error?: string;
};

type StatusPillProps = {
  status?: string | number | null;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
};

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions
}: PageHeaderProps) {
  return (
    <div className="admin-page-header">
      <div>
        {eyebrow && <span className="admin-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {actions && <div className="admin-page-actions">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  actions,
  children
}: PanelProps) {
  return (
    <section className="admin-panel">
      {(title || subtitle || actions) && (
        <div className="admin-panel-header">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>

          {actions && <div className="admin-panel-actions">{actions}</div>}
        </div>
      )}

      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  icon,
  helper,
  tone = "green",
  critical
}: StatCardProps) {
  return (
    <article className={`admin-stat admin-stat-${tone}`}>
      <div className="admin-stat-top">
        <span>{label}</span>
        {icon && <div className="admin-stat-icon">{icon}</div>}
      </div>

      <strong className={critical ? "is-critical" : ""}>{value}</strong>

      {helper && <p>{helper}</p>}
    </article>
  );
}

export function Field({
  label,
  children,
  span,
  required,
  optional,
  error,
}: FieldProps) {
  return (
    <label
      className={`admin-field ${span === "full" ? "admin-field-full" : ""} ${
        error ? "admin-field-invalid" : ""
      }`}
    >
      <span>
        {label}
        {required && <em className="admin-field-required">Required</em>}
        {optional && <em className="admin-field-optional">Optional</em>}
      </span>
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}

export function StatusPill({ status, tone }: StatusPillProps) {
  const value = String(status ?? "Not set");
  const normalized = value.toLowerCase();
  const resolvedTone =
    tone ??
    (normalized.includes("paid") ||
    normalized.includes("complete") ||
    normalized.includes("active") ||
    normalized.includes("ok")
      ? "success"
      : normalized.includes("pending") ||
        normalized.includes("partial") ||
        normalized.includes("low")
        ? "warning"
        : normalized.includes("damage") ||
          normalized.includes("discard") ||
          normalized.includes("contamin") ||
          normalized.includes("alert") ||
          normalized.includes("failed")
          ? "danger"
          : normalized.includes("light") ||
            normalized.includes("progress") ||
            normalized.includes("transfer")
            ? "info"
            : "neutral");

  return (
    <span className={`admin-pill admin-pill-${resolvedTone}`}>
      {value}
    </span>
  );
}

export function EmptyState({
  title,
  message
}: {
  title: string;
  message?: string;
}) {
  return (
    <div className="admin-empty-state">
      <strong>{title}</strong>
      {message && <p>{message}</p>}
    </div>
  );
}
