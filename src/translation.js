// A missing search result never proves that a translation does not exist.
export function translationStatus(book) {
 if (book.cover?.language === 'tr' || book.verifiedEdition) return {status:'available', label:'Türkçe var', description:'Türkçe baskı kaydı bulundu. Çevirmen ve ISBN bilgilerini kitap ayrıntısında karşılaştır.', source:book.verifiedEdition?.sourceUrl || book.cover?.sourceUrl};
 if (book.translationResearch?.status==='unavailable' && book.translationResearch?.sourceUrl) return {status:'unavailable',label:'Türkçe yok',description:book.translationResearch.note,source:book.translationResearch.sourceUrl};
 return {status:'unverified',label:'Türkçe belirsiz',description:'Türkçe baskı henüz doğrulanamadı. Bu, çevirisi olmadığı anlamına gelmez. Varsa gösterilen kapak uluslararası baskıya aittir.',source:book.cover?.sourceUrl};
}
