import React,{useState} from 'react';
import { Accordion, Anchor, Badge, Button, Group, Paper, Select, Stack, Text, Title } from '@mantine/core';
import { readingGuide, relatedBooks } from '../recommendations';
import { displayTitle,turkishMeaning } from '../translation';

function RelatedCard({book,reason='',onOpen,BookCover,states}) {
 const marks=states[book.id]||[];
 return <Paper component="article" withBorder p="md" radius="md" className="related-card" onClick={e=>{if(!(e.target instanceof Element&&e.target.closest('button,a,input,select,textarea,[role="button"]')))onOpen(book.id)}}>
  <div className="related-book"><div className="related-cover"><BookCover book={book} onOpen={onOpen} read={marks.includes('okundu')}/></div><div><Title order={4}><button className="title-button" onClick={()=>onOpen(book.id)}>{displayTitle(book)}</button></Title><Text c="dimmed" mt="xs">{book.author}</Text><Group gap={6} mt="xs">{marks.includes('alindi')&&<Badge>Kitaplığında</Badge>}{marks.includes('okundu')&&<Badge>Okundu</Badge>}</Group></div></div>
  {reason&&<Text mt="md" className="recommendation-reason">{reason}</Text>}
 </Paper>;
}
export function ReadingPurpose({book,catalog}) {
 const guide=readingGuide(book,catalog);
 const meaning=turkishMeaning(book);
 return <Paper withBorder p="lg" radius="lg" className="purpose-panel"><Text className="eyebrow">OKUMA AMACI</Text><Title order={3}>Ne için okumalıyım?</Title>{meaning&&<Text className="turkish-meaning" mt="sm"><strong>Türkçe anlamı:</strong> {meaning}</Text>}<Text mt="md">{guide.purpose}</Text><Text c="dimmed" mt="sm">{guide.kind}{guide.kind==='Konuya göre okuma amacı'?' · Kitabın konu etiketlerinden önerilmiştir; ayrıntılı içerik incelemesi değildir.':' · Editoryal öneri'}</Text>{guide.sources.map(s=><Anchor key={s.url} href={s.url} target="_blank" rel="noreferrer" className="source-link">{s.label}</Anchor>)}</Paper>;
}
export default function BookDiscovery({book,catalog,states,onOpen,onCategory,onCollection,BookCover}) {
 const guide=readingGuide(book,catalog);
 const [scope,setScope]=useState('category|'+guide.route.category);
 const [visible,setVisible]=useState(4);
 const options=[{group:'Konular',items:book.categories.map(id=>({value:'category|'+id,label:catalog.categories.find(c=>c.id===id).label}))},{group:'Kaynak kümeleri',items:book.collectionIds.map(id=>({value:'collection|'+id,label:catalog.collections.find(c=>c.id===id).title}))}];
 const matches=relatedBooks(book,catalog,scope,states);
 const [type,id]=scope.split('|');
 const route=catalog.readingGuides.routes.find(r=>r.category===id);
 const heading=type==='category'?route.heading+' bunları da oku':'Bu kümedeki diğer kitaplar';
 const openAll=()=>type==='category'?onCategory(id):onCollection(id);
 const linked=(item)=><RelatedCard key={item.id} book={catalog.books.find(b=>b.id===item.id)} reason={item.reason} onOpen={onOpen} BookCover={BookCover} states={states}/>;
 return <Stack gap="xl" className="discovery-panel">
  <div><Title order={3}>Okuma rotan</Title><Text c="dimmed" mt="sm">Bu sıralama hazırlık ve derinleşme önerisidir. Kitapları anlamak için zorunlu bir önkoşul değildir.</Text></div>
  <Accordion multiple defaultValue={['before','after']} variant="separated" radius="md">
   <Accordion.Item value="before"><Accordion.Control>Önce ne okumalıyım? · {guide.before.length}</Accordion.Control><Accordion.Panel>{guide.before.length?<Stack gap="md">{guide.before.map(linked)}</Stack>:<Text>Doğrudan bu kitapla başlayabilirsin. Bu rota için bir ön okuma önermiyoruz.</Text>}</Accordion.Panel></Accordion.Item>
   <Accordion.Item value="after"><Accordion.Control>Sonra nasıl derinleşirim? · {guide.after.length}</Accordion.Control><Accordion.Panel>{guide.after.length?<Stack gap="md">{guide.after.map(linked)}</Stack>:<Text>Bu rota için belirli bir devam kitabı seçilmedi. Aşağıdaki konu kitaplarından farklı bir bakış açısı seçebilirsin.</Text>}</Accordion.Panel></Accordion.Item>
   {guide.companions.length>0&&<Accordion.Item value="companions"><Accordion.Control>Birlikte veya karşılaştırmalı oku · {guide.companions.length}</Accordion.Control><Accordion.Panel><Stack gap="md">{guide.companions.map(linked)}</Stack></Accordion.Panel></Accordion.Item>}
  </Accordion>
  <div><Title order={3}>{heading}</Title><Text mt="sm" c="dimmed">Ortak konu ve küme üyeliklerine göre seçildi. Kitaplığındaki eserler de burada görünür.</Text></div>
  <Select label="Önerilerin konusu veya kümesi" data={options} value={scope} allowDeselect={false} onChange={v=>{if(v){setScope(v);setVisible(4)}}}/>
  <Text role="status" c="dimmed">{matches.length} başka kitap{matches.length?` · İlk ${Math.min(visible,matches.length)} kitap`:''}</Text>
  <div className="related-grid">{matches.slice(0,visible).map(b=><RelatedCard key={b.id} book={b} onOpen={onOpen} BookCover={BookCover} states={states}/>)}</div>
  {!matches.length&&<Text>Bu seçimde keşfedilecek başka kitap kalmadı.</Text>}
  <Group gap="sm">{matches.length>visible&&<Button variant="light" onClick={()=>setVisible(v=>v+4)}>4 kitap daha göster</Button>}<Button variant="default" onClick={openAll}>Bu listeyi katalogda aç</Button></Group>
 </Stack>;
}
