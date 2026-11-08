export function createReadCache(now:()=>number=Date.now,maxEntries=80){
 let generation=0;
 const values=new Map<string,{value:unknown;expires:number}>();
 const pending=new Map<string,Promise<unknown>>();
 return {
  clear(){generation++;values.clear();pending.clear();},
  async read<T>(key:string,fetcher:()=>Promise<T>,ttl=15000):Promise<T>{
   const value=values.get(key);if(value&&value.expires>now())return value.value as T;
   if(value)values.delete(key);
   const existing=pending.get(key);if(existing)return existing as Promise<T>;
   const version=generation;
   const promise=Promise.resolve().then(fetcher).then(result=>{if(version===generation&&ttl>0){if(values.size>=maxEntries)values.delete(values.keys().next().value!);values.set(key,{value:result,expires:now()+ttl});}return result;}).finally(()=>{if(pending.get(key)===promise)pending.delete(key);});
   pending.set(key,promise);return promise;
  }
 };
}
