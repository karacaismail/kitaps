import React from 'react';
import { Accordion, Alert, Anchor, Badge, Paper, Stack, Text, Title } from '@mantine/core';
import { IconArrowUpRight } from '@tabler/icons-react';

export default function EditionGuide({book}) {
 const e=book.verifiedEdition;
 const publisherVerified=e&&e.sourceType!=='retailer';
 const sameCover=e&&book.cover?.isbn===e.isbn;
 return <section className="edition-guide" aria-label="Çeviri ve baskı seçimi">
  <Title order={3} mb="md">Hangi çeviriyi okumalıyım?</Title>
  {e?<Paper withBorder p="lg" radius="lg">
   <Badge color={publisherVerified?'coffee':'orange'}>{publisherVerified?'Yayınevi künyesi kontrol edildi':'Kitapçı künyesi · ikinci kontrol bekliyor'}</Badge>
   <Title order={4} mt="md">{e.translators.length?e.translators.join(' · '):'Çevirmen henüz doğrulanmadı'}</Title>
   <Text mt="sm">{e.title} · {e.publisher}</Text>{e.isbn&&<Text c="dimmed" mt="xs">ISBN {e.isbn}</Text>}
   {e.translationEditors&&<Text mt="sm">Çeviri editörleri: {e.translationEditors.join(' · ')}</Text>}
   {e.editors&&<Text mt="sm">Editör: {e.editors.join(' · ')}</Text>}
   {e.sourceLanguage&&<Text mt="sm">Çeviri dili: {e.sourceLanguage}</Text>}
   <Text c="dimmed" mt="sm">{sameCover?'Gösterilen kapak bu ISBN’ye ait.':book.cover?'Gösterilen kapak farklı bir baskıya ait; bu künye o kapağın çevirmenini doğrulamaz.':'Bu baskının kapağı henüz eklenmedi.'}</Text>
   {e.correction&&<Alert mt="md" color="orange" title="Künye düzeltildi">{e.correction}</Alert>}
   {e.note&&<Text mt="md">{e.note}</Text>}
   <Anchor className="source-link" href={e.sourceUrl} target="_blank" rel="noreferrer">{publisherVerified?'Yayınevi kaynağını incele':'Kitapçı kaynağını incele'} <IconArrowUpRight size={18}/></Anchor>
   {e.previewUrl&&<Anchor className="source-link" href={e.previewUrl} target="_blank" rel="noreferrer">Örnek metni aç <IconArrowUpRight size={18}/></Anchor>}
   <Text c="dimmed" mt="sm">Kontrol: 28 Eylül 2026. Künye kontrolü çevirinin edebî veya teknik kalitesini tek başına kanıtlamaz; karşılaştırmalı metin incelemesi yapılmadı.</Text>
  </Paper>:<Paper withBorder p="lg" radius="lg"><Badge color="gray">Çevirmen henüz doğrulanmadı</Badge><Text mt="md">Bu eser için Türkçe baskı, ISBN ve çevirmen eşleştirmesi tamamlanmadı. Çeviri bir baskı seçeceksen yayınevinin künyesini ve örnek sayfalarını kontrol et.</Text>{book.cover&&<Anchor className="source-link" href={book.cover.sourceUrl} target="_blank" rel="noreferrer">Kapaktaki baskının sayfasını aç <IconArrowUpRight size={18}/></Anchor>}</Paper>}
  <Accordion multiple variant="separated" mt="md">
   <Accordion.Item value="criteria"><Accordion.Control>Çeviri seçerken neye bakmalıyım?</Accordion.Control><Accordion.Panel><ol className="translation-criteria">
    <li><strong>Baskıyı eşleştir.</strong> Yayınevi, ISBN, çevirmen ve baskı yılını aynı künye sayfasından kontrol et. Aynı kitabın farklı kapakları farklı çeviriler olabilir.</li>
    <li><strong>Kaynak dil ve tam metin.</strong> Asıl dilden mi, ara dilden mi çevrildiğini; kısaltılmış veya uyarlanmış bir metin olup olmadığını araştır.</li>
    <li><strong>Alan deneyimi.</strong> Çevirmenin aynı dil, dönem ve konuda yaptığı çalışmalara bak. Teknik kitapta kavram tutarlılığı; edebiyatta anlatıcı sesi ve üslup önem taşır.</li>
    <li><strong>Örnek sayfaları karşılaştır.</strong> Mümkünse aynı bölümü özgün metinle ve iki Türkçe çeviriyle oku. Anlam kaybı, eksiltme, terim kullanımı ve Türkçenin doğallığına bak.</li>
    <li><strong>Editoryal destek.</strong> Dipnot, açıklama, sözlük, kaynakça ve gözden geçirilmiş baskı bilgisi aramayı kolaylaştırır. Çevirmenin ünü tek başına kalite garantisi değildir.</li>
   </ol></Accordion.Panel></Accordion.Item>
   {book.editions.length>0&&<Accordion.Item value="archive"><Accordion.Control>Arşivdeki çeviri ve baskı notları · {book.editions.length}</Accordion.Control><Accordion.Panel><Text c="dimmed" mb="md">Aşağıdakiler önceki Kitaps kaynağının notlarıdır. İsimler ve değerlendirmeler bu alanda bağımsız olarak doğrulanmış sayılmaz. Yukarıdaki ISBN’ye bağlı düzeltmeler önceliklidir.</Text><Stack gap="md">{book.editions.map((old,i)=><Paper withBorder p="md" key={i}><Text fw={600}>{old.translator||'Çevirmen belirtilmemiş'}</Text><Text>{old.publisher||'Yayınevi belirtilmemiş'}</Text>{old.note&&<Text mt="sm">{old.note}</Text>}{old.alt&&<Text mt="sm">Arşivdeki diğer seçenek: {old.alt.name}{old.alt.publisher?` · ${old.alt.publisher}`:''}</Text>}</Paper>)}</Stack></Accordion.Panel></Accordion.Item>}
  </Accordion>
 </section>;
}
