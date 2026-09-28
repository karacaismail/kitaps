import React from 'react';
import { Anchor, Text } from '@mantine/core';

export default function TranslationCriteria() {
 return <>
  <Text mb="md">Bir çeviriyi değerlendirirken baskı künyesini, kaynak dili ve örnek metni birlikte incele.</Text>
  <ol className="translation-criteria">
   <li><strong>Baskıyı eşleştir.</strong> Yayınevi, ISBN, çevirmen ve baskı yılını aynı künye sayfasından kontrol et. Aynı kitabın farklı kapakları farklı çeviriler olabilir.</li>
   <li><strong>Kaynak dil ve tam metin.</strong> Asıl dilden mi, ara dilden mi çevrildiğini; kısaltılmış veya uyarlanmış bir metin olup olmadığını araştır.</li>
   <li><strong>Alan deneyimi.</strong> Çevirmenin aynı dil, dönem ve konuda yaptığı çalışmalara bak. Teknik kitapta kavram tutarlılığı; edebiyatta anlatıcı sesi ve üslup önem taşır.</li>
   <li><strong>Örnek sayfaları karşılaştır.</strong> Mümkünse aynı bölümü özgün metinle ve iki Türkçe çeviriyle oku. Anlam kaybı, eksiltme, terim kullanımı ve Türkçenin doğallığına bak.</li>
   <li><strong>Editoryal destek.</strong> Dipnot, açıklama, sözlük, kaynakça ve gözden geçirilmiş baskı bilgisi aramayı kolaylaştırır. Çevirmenin ünü tek başına kalite garantisi değildir.</li>
  </ol>
  <Text mt="md">Ölçütlerin dayanağı: <Anchor href="https://www.atanet.org/certification/how-the-exam-is-graded/error-categories/" target="_blank" rel="noreferrer">ATA anlam, terim ve üslup değerlendirme ölçütleri</Anchor>. Bu liste bir çevirmenin yeterliğini tek başına ölçmez.</Text>
 </>;
}
