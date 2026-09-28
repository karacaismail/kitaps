const SUFFIX=/,\s*(Jr\.?|Sr\.?|II|III|IV|PhD|MD)(?=\s|,|;|$)/giu;
const SEPARATOR=/\s+(?:and|ve|with|&)\s+|\s*;\s*|\s*,\s*/iu;

/** Splits a catalog author line into people. Generational suffixes stay with
 * their name, and a lone first name borrows the next person's surname, so
 * "Chip and Dan Heath" becomes Chip Heath and Dan Heath. */
export function splitAuthors(value){
 if(typeof value!=='string'||!value.trim())return [];
 const parts=value.replace(SUFFIX,' $1').split(SEPARATOR).map(part=>part.trim()).filter(Boolean);
 const people=parts.map((part,index)=>{
  const next=parts[index+1];
  const nextWords=next?.split(/\s+/)||[];
  if(parts.length>1&&!/\s/.test(part)&&nextWords.length>1)return `${part} ${nextWords.at(-1)}`;
  return part;
 });
 return [...new Set(people)];
}
