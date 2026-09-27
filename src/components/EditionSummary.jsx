import React from 'react';
import { Anchor,Button,Group,Paper,Text,Title } from '@mantine/core';
import { IconShoppingBag,IconPhoto,IconArrowUpRight } from '@tabler/icons-react';
import { translationStatus } from '../translation';
export default function EditionSummary({book}){
 const e=book.verifiedEdition,c=book.cover,available=translationStatus(book).status==='available';
 const edition=e||(c?.language==='tr'?c:null), title=edition?.title||book.title;
 const query=[title,book.author,edition?.publisher,edition?.isbn].filter(Boolean).join(' ');
 const params=new URLSearchParams({q:query});
 return <Paper component="section" withBorder radius="lg" p="lg" className="edition-summary" aria-label="Yayınevi, çevirmen ve kitabı bul">
  <Title order={3} mb="md">Baskı ve çevirmen</Title>
  <dl className="edition-facts">
   <div><dt>Yayınevi</dt><dd>{edition?.publisher||c?.publisher||'Henüz doğrulanmadı'}</dd></div>
   <div><dt>Çevirmen</dt><dd>{e?.originalLanguage==='tr'?'Türkçe özgün eser':e?.translators?.length?e.translators.join(' · '):'Henüz doğrulanmadı'}</dd></div>
   {(edition?.isbn||c?.isbn)&&<div><dt>ISBN</dt><dd>{edition?.isbn||c?.isbn}</dd></div>}
  </dl>
  {e&&<Text className="edition-evidence" mt="md">{e.sourceType==='publisher'?'Yayınevi künyesinden kontrol edildi.':'Kitapçı künyesinden kontrol edildi; yayıneviyle ikinci kontrol bekliyor.'}{c&&e.isbn!==c.isbn?' Kapak farklı bir baskıya ait.':''}</Text>}
  {!available&&<Text c="dimmed" mt="md">Türkçe baskı doğrulanamadı.{c?' Gösterilen kapak uluslararası baskıya aittir.':''}</Text>}
  {edition?.sourceUrl&&<Anchor href={edition.sourceUrl} target="_blank" rel="noreferrer" className="source-link">Künye kaynağını aç <IconArrowUpRight size={18}/></Anchor>}
  <Group gap="sm" mt="lg" className="book-shopping-links">
   <Button component="a" href={`https://www.google.com/search?tbm=shop&${params}`} target="_blank" rel="noreferrer" variant="light" leftSection={<IconShoppingBag size={20}/>}>Google Alışveriş</Button>
   <Button component="a" href={`https://www.google.com/search?tbm=isch&${params}`} target="_blank" rel="noreferrer" variant="light" leftSection={<IconPhoto size={20}/>}>Google Görseller</Button>
   {!available&&<Button component="a" href={`https://www.amazon.com/s?${new URLSearchParams({k:[book.title,book.author].filter(Boolean).join(' ')})}`} target="_blank" rel="noreferrer" variant="default" rightSection={<IconArrowUpRight size={18}/>}>Özgün baskı · Amazon</Button>}
  </Group>
 </Paper>;
}
