---
name: samaksh-app-quality
description: Implement and review Samaksh Farms ERP changes with clear operational screens, consistent financial records, role-aware navigation, and economical database access. Use for this app's React frontend and Spring backend changes.
---

# Samaksh app quality

Use the existing AdminUI, table styles, dialogs and API client. Keep Sourcing & Vendors focused on sources, receipts, payments and recoveries. Place revenue, gross/net profit and historical comparisons on the Dashboard, with concise summaries and expandable details.

- Prefer aligned tables for operational registers. Align numeric headers and values together, wrap long headers, and keep actions consistent. Group related farm operations under tabs.
- Funding choices must identify the holder, account type and available farm balance once. Personal funds are outside the farm cash balance: show the amount owed, never imply that a personal account's negative ledger balance is available cash.
- Treat business date separately from audit timestamp. Preserve before/after values, actor and current timestamp for edits. Historical entry must not erase original audit context.
- Money mutations must be transactional, idempotent and validated on the server. Personal reimbursements transfer cash and reduce liabilities; they are not a second expense. Vendor advances and recoveries are separate from invoice costs. Keep linked sourcing and ledger edits synchronized.
- Show pending feedback on asynchronous actions, prevent duplicate submission, retain useful errors, and refresh affected data after success. Do not disable a submit button before its form handler runs.
- Enforce the current role matrix in navigation, tabs, route guards and backend actions. Logout remains available to every signed-in role. Hiding a button alone does not enforce authorization.
- Reuse the shared session-scoped GET cache and in-flight deduplication. Invalidate affected reads after mutations and on explicit refresh. Do not fetch on every tab/filter change when loaded data suffices. Avoid per-row database queries: batch related records, bound date ranges and aggregate balances once. Never use cached client balances as authorization to spend.
- Preserve user-selected vendor boxes/kg, receipt cost snapshots and the distinction between billed revenue and cash collected. Follow the app's documented daily-cost profit method; do not silently substitute inventory valuation.
- For Excel history, preview first, use stable external references to prevent retry duplicates, validate references, and commit atomically. Never import live data merely to demonstrate the feature.

Validate affected calculations and authorization with meaningful regression tests; run frontend type checks/build and relevant backend tests. Report local verification separately from deployment or live database verification. Work through explicitly ordered user requests in sequence.
