import {displayTitle,isOriginalTurkish,recommendedTranslation,translationStatus,turkishEdition} from './translation.js';
import {splitAuthors} from './authors.js';

const text=value=>typeof value==='string'&&value.trim()?value.trim():null;

/** One self-describing record per book. It reads the same edition and
 * translation rules as the book page, so the file never contradicts the UI. */
export function exportBookRecord(book){
 const originalTurkish=isOriginalTurkish(book);
 const status=translationStatus(book).status;
 const hasTurkish=status==='available'||status==='original';
 const edition=hasTurkish?turkishEdition(book):null;
 const recommended=recommendedTranslation(book);
 return {
  id:book.id,
  turkceAdi:hasTurkish?text(displayTitle(book)):null,
  // A translated work without a researched original title stays null rather
  // than repeating its Turkish title.
  orijinalAdi:originalTurkish?text(edition?.title)||text(book.titleTr)||text(book.title):text(book.originalTitle)||(hasTurkish?null:text(displayTitle(book))),
  orijinalYayinevi:originalTurkish?text(edition?.publisher):text(book.originalPublisher)||(book.cover?.language&&book.cover.language!=='tr'?text(book.cover.publisher):null),
  orijinalYazarlar:splitAuthors(book.author),
  onerilenCevirmenler:recommended?.translators||[],
  turkiyeYayinevi:originalTurkish?text(edition?.publisher):hasTurkish?text(recommended?.publisher)||text(edition?.publisher):null,
  turkceIsbn:hasTurkish?text(edition?.isbn):null,
  ilkYayinYili:book.years?.length?Math.min(...book.years):null,
 };
}

export function createBooksExport(catalog,exportedAt=new Date().toISOString()){
 const books=catalog.books.map(exportBookRecord);
 return {schemaVersion:2,exportedAt,catalogUpdatedAt:catalog.updated,count:books.length,books};
}
