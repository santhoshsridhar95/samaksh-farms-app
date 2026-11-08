export type FundingAccount={id:number;name:string;kind:string;balance:number};
const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(n);
export function fundingAccountLabel(a:FundingAccount){
 const name=a.name.replace(/\s*[—–-]\s*Personal pocket\s*$/i,"").trim();
 if(a.kind==="PERSONAL")return name+" — Personal funds · Owed "+money(Math.max(0,-Number(a.balance||0)));
 const kind:Record<string,string>={HELD:"Farm money held",BANK:"Farm bank",SAVINGS:"Farm savings",HISTORICAL:"Historical farm funds"};
 return name+" — "+(kind[a.kind]||a.kind)+" · Available "+money(Number(a.balance||0));
}
