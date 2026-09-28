import React from 'react';
import {Badge,Group,Paper,Text,ThemeIcon,Title} from '@mantine/core';
import {IconRoute} from '@tabler/icons-react';
import {displayTitle} from '../translation';

export default function ReadingPrioritySummary({ranking,books,sync}){
 const first=ranking.ordered[0];
 const book=books.find(item=>item.id===first?.bookId);
 return <Paper withBorder radius="lg" p="md" className="priority-summary">
  <Group align="flex-start" wrap="nowrap"><ThemeIcon variant="light" size={46} radius="xl"><IconRoute size={24}/></ThemeIcon><div className="priority-summary-copy"><Group gap="xs"><Title order={3}>Okuma önceliği</Title><Badge variant="light">Ortak sıra</Badge></Group><Text c="dimmed">Yedi ölçüt; editoryal kesişim, öğrenme ilişkileri, hazırlık yükü, erişim, kapsam, zorluk ve kalıcılığı değerlendirir. Okuma kaydı ve kişisel sıra puanı değiştirmez.</Text>{book&&<Text mt={8}><strong>Şu an ilk:</strong> {displayTitle(book)} · {first.score}/100</Text>}{sync?.pending>0&&<Text mt={8} size="sm" c="orange"><strong>{sync.pending} eşitleme değişikliği bekliyor.</strong> Okuma kaydı ve sıra değişiklikleri puana katılmaz.</Text>}</div></Group>
 </Paper>;
}
