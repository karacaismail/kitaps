import React from 'react';
import { Alert,Anchor,Button,Group,Paper,Text,Title } from '@mantine/core';
import { IconShoppingBag,IconPhoto,IconArrowUpRight } from '@tabler/icons-react';
import { isOriginalTurkish,translationStatus } from '../translation';
export default function EditionSummary({book}){
 const e=book.verifiedEdition,c=book.cover,original=isOriginalTurkish(book),available=translationStatus(book).status==='available';
 const edition=e||(c?.language==='tr'?c:null), title=edition?.title||book.title;
 const query=[title,book.author,edition?.publisher,edition?.isbn].filter(Boolean).join(' ');
 const params=new URLSearchParams({q:query});
 return <Paper component="section" withBorder radius="lg" p="lg" className="edition-summary" aria-label="Yayınevi, çevirmen ve kitabı bul">
  <Title order={3} mb="md">{original?'Baskı bilgisi':'Baskı ve çevirmen'}</Title>{book.sourceIssue&&<Alert color="orange" title="Baskı seçerken dikkat" mb="md">{book.sourceIssue.note}</Alert>}
  <dl className="edition-facts">
   <div><dt>Yayınevi</dt><dd>{edition?.publisher||c?.publisher||'Henüz doğrulanmadı'}</dd></div>
   {!original&&<div><dt>Çevirmen</dt><dd>{e?.translators?.length?e.translators.join(' · '):'Henüz doğrulanmadı'}</dd></div>}
   {(edition?.isbn||c?.isbn)&&<div><dt>ISBN</dt><dd>{edition?.isbn||c?.isbn}</dd></div>}
  </dl>
  {e&&<Text className="edition-evidence" mt="md">{['publisher','publisher-preview'].includes(e.sourceType)?'Yayınevi künyesinden kontrol edildi.':e.sourceType==='bibliographic'?'Kütüphane künyesinden kontrol edildi.':'Kitapçı künyesinden kontrol edildi; yayıneviyle ikinci kontrol bekliyor.'}{c&&e.isbn!==c.isbn?' Kapak farklı bir baskıya ait.':''}</Text>}
  {!available&&<Text c="dimmed" mt="md">Türkçe baskı doğrulanamadı.{c?' Gösterilen kapak uluslararası baskıya aittir.':''}</Text>}
  {edition?.sourceUrl&&<Anchor href={edition.sourceUrl} target="_blank" rel="noreferrer" className="source-link">Künye kaynağını aç <IconArrowUpRight size={18}/></Anchor>}
  <Group gap="sm" mt="lg" className="book-shopping-links">
   <Button component="a" href={`https://www.google.com/search?tbm=shop&${params}`} target="_blank" rel="noreferrer" variant="light" leftSection={<IconShoppingBag size={20}/>}>Google Alışveriş</Button>
   <Button component="a" href={`https://www.google.com/search?tbm=isch&${params}`} target="_blank" rel="noreferrer" variant="light" leftSection={<IconPhoto size={20}/>}>Google Görseller</Button>
   {!available&&<Button component="a" href={`https://www.amazon.com/s?${new URLSearchParams({k:[book.title,book.author].filter(Boolean).join(' ')})}`} target="_blank" rel="noreferrer" variant="default" rightSection={<IconArrowUpRight size={18}/>}>Özgün baskı · Amazon</Button>}
  </Group>
 </Paper>;
}
