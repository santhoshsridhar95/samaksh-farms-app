import { useState } from "react";
import { fundingAccountLabel, type FundingAccount } from "../utils/fundingAccounts";
import { fundingCents, type FundingSelection } from "../utils/splitFunding";

export default function SplitFunding({accounts, value, onChange, total}: {
  accounts: FundingAccount[]; value: FundingSelection; onChange: (value: FundingSelection) => void; total: number;
}) {
  const [search, setSearch] = useState("");
  const matchingAccounts = accounts.filter(account => fundingAccountLabel(account).toLowerCase().includes(search.trim().toLowerCase()));
  const selected = Object.values(value).reduce((sum, amount) => sum + (fundingCents(amount) || 0), 0) / 100;
  const money = (amount: number) => new Intl.NumberFormat("en-IN", {style: "currency", currency: "INR"}).format(amount);
  return <div className="money-wide split-funding" role="group" aria-label="Funding sources">
    <p>Select each source and enter the amount paid from it. Personal pockets need no opening balance; personal spending increases the amount owed.</p>
    <label className="split-funding-search">Find an account
      <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search account or holder" />
    </label>
    <small>{matchingAccounts.length} accounts shown · {Object.keys(value).length} selected. Scroll the list to see more.</small>
    <div className="split-funding-list" role="region" aria-label="Available funding accounts" tabIndex={0}>
    {[...matchingAccounts].sort((a, b) => a.id - b.id).map(account => {
      const checked = Object.prototype.hasOwnProperty.call(value, String(account.id));
      return <div className="split-funding-row" key={account.id}>
        <label className="split-funding-choice"><input type="checkbox" checked={checked} onChange={event => {
          const next = {...value};
          if (event.target.checked) next[account.id] = ""; else delete next[account.id];
          onChange(next);
        }}/><span>{fundingAccountLabel(account)}</span></label>
        {checked && <label className="split-funding-amount">Amount from {account.name}
          <input aria-label={`Amount from ${account.name}`} required type="number" min="0.01" max="999999999999.99" step="0.01"
            value={value[account.id]} onChange={event => onChange({...value, [account.id]: event.target.value})}/>
        </label>}
      </div>;
    })}
    {matchingAccounts.length === 0 && <p>No matching accounts.</p>}
    </div>
    <p role="status">Allocated {money(selected)} of {money(total)} · Remaining {money(total - selected)}</p>
    <p>All sources save together. Each source appears as a separate payment row and can be corrected individually.</p>
  </div>;
}
