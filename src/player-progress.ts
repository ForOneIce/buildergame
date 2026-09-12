export function localProgress(town:string,login:string|null):Set<string> {
  try{const ids=JSON.parse(localStorage.getItem(key(town,login))||'[]');return new Set(Array.isArray(ids)?ids.filter(v=>typeof v==='string').slice(0,200):[]);}catch{return new Set();}
}
const key=(town:string,login:string|null)=>`bg-exploration:${encodeURIComponent(town)}:${encodeURIComponent(login?.toLowerCase()||'guest')}`;
export function saveProgress(town:string,login:string|null,ids:Set<string>) {
  try{localStorage.setItem(key(town,login),JSON.stringify([...ids].slice(0,200)));return true;}catch{return false;}
}
