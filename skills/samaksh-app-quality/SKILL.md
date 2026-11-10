---
name: samaksh-app-quality
description: Implement and review Samaksh Farms ERP changes with mobile-first responsive screens, consistent financial records, role-aware navigation, and economical database access. Use for this app's React frontend and Spring backend changes.
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

## Mobile layout for all operational pages

Mobile is the primary device for this ERP. Apply these rules to sidebar destinations and every nested section, including Money & Expenses, Inventory, Sales, Direct Sales and Sales Planning.

- Reuse `AdminLayout`, `AdminUI` and `src/admin/components/AdminResponsive.css`. Fix shared layout constraints at that layer before adding page-specific overrides. Keep embedded pages inside one shell.
- Use a compact navigation drawer on phones and tablets, with visible labels, current-page indication, reachable Logout, close/Escape support, focus containment and focus return. Desktop navigation must scroll independently on short screens.
- Allow tabs and action bars to wrap with readable labels and a clear selected state. Keep secondary actions distinct from tabs. Do not stack sticky tab bars over content or let headers consume most of the phone viewport.
- Let grids and flex children shrink (`min-width: 0`, `minmax(0, 1fr)`); stack forms and filters when space runs out. Long shop names, employee names and account labels must not widen the page. Keep touch controls at least 44px high and mobile form text at least 16px.
- Preserve financial table column alignment. Contain wide registers/charts in their own horizontal scroll region with a visible scrolling cue; do not hide data columns or clip the page to conceal overflow. Give dialogs viewport-bounded widths and dynamic-viewport heights, with scrolling content and reachable save/close actions.
- Verify representative populated pages, nested tabs and dialogs at 320/390px phone, 768px tablet and 1440px desktop widths. Check page overflow, drawer navigation, long labels, touch controls and resize/orientation changes. Use isolated fixtures for layout checks; never create live financial or sales records for visual testing. Run TypeScript and the production build, and distinguish simulated viewport checks from physical-device verification.
