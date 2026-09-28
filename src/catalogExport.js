import {isOriginalTurkish} from './translation.js';

const text=value=>typeof value==='string'&&value.trim()?value.trim():null;
const authors=value=>text(value)?.split(/\s+(?:and|ve|&)\s+|\s*;\s*|\s*,\s*/iu).filter(Boolean)||[];

const recommendedEdition=book=>[...(book.editions||[])]
 .filter(edition=>text(edition.translator)&&!edition.translator.trim().startsWith('—')&&edition.status?.includes('ok'))
 .sort((left,right)=>(right.trust?.score||0)-(left.trust?.score||0))[0]||null;

export function exportBookRecord(book){
 const originalTurkish=isOriginalTurkish(book);
 const edition=recommendedEdition(book);
 const verified=book.verifiedEdition;
 const translated=!originalTurkish&&Boolean(verified||book.cover?.language==='tr'||edition);
 const translators=translated?(verified?.translators?.map(text).filter(Boolean)||(text(edition?.translator)?[text(edition.translator)]:[])):[];
 return {
  turkceAdi:translated||originalTurkish?text(book.titleTr)||text(verified?.title)||text(edition?.turkish)||(book.cover?.language==='tr'?text(book.cover.title):null):null,
  orijinalAdi:text(book.originalTitle)||text(book.title),
  orijinalYayinevi:originalTurkish?text(verified?.publisher)||text(book.cover?.publisher):(book.cover?.language==='en'?text(book.cover.publisher):null),
  orijinalYazarlar:authors(book.author),
  onerilenCevirmenler:translators,
  turkiyeYayinevi:translated?text(verified?.publisher)||(book.cover?.language==='tr'?text(book.cover.publisher):null)||text(edition?.publisher):null,
 };
}

export function createBooksExport(catalog,exportedAt=new Date().toISOString()){
 const books=catalog.books.map(exportBookRecord);
 return {schemaVersion:1,exportedAt,catalogUpdatedAt:catalog.updated,count:books.length,books};
}
