// A missing search result never proves that a translation does not exist.
export const isOriginalTurkish=book=>book.verifiedEdition?.originalLanguage==='tr'||book.translationResearch?.status==='original';

export function translationStatus(book) {
 const research=book.translationResearch;
 const researchSource=research?.stage1?.sources?.[0]?.url;
 if(isOriginalTurkish(book))return {status:'original',label:'Türkçe eser',description:'Türkçe yazılmış özgün eser. Bu baskı için çevirmen gerekmez.',source:book.verifiedEdition?.sourceUrl||researchSource};
 if(research?.status==='available'&&researchSource)return {status:'available',label:'Türkçe var',description:'Türkçe baskı iki bağımsız araştırma aşamasında doğrulandı. Künye bilgilerini kitap ayrıntısında karşılaştır.',source:researchSource};
 if(research?.status==='unavailable'&&researchSource)return {status:'unavailable',label:'Türkçe yok',description:research.scopeNote,source:researchSource};
 if(book.cover?.language==='tr'||book.verifiedEdition)return {status:'available',label:'Türkçe var',description:'Türkçe baskı kaydı bulundu. Çevirmen ve ISBN bilgilerini kitap ayrıntısında karşılaştır.',source:book.verifiedEdition?.sourceUrl||book.cover?.sourceUrl};
 return {status:'unverified',label:'Türkçe belirsiz',description:'Türkçe baskı henüz doğrulanamadı. Bu, çevirisi olmadığı anlamına gelmez. Varsa gösterilen kapak uluslararası baskıya aittir.',source:book.cover?.sourceUrl};
}
