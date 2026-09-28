import React from 'react';
import {Badge,Group,Paper,Text,ThemeIcon,Title} from '@mantine/core';
import {IconRoute} from '@tabler/icons-react';
import {displayTitle} from '../translation';

export default function ReadingPrioritySummary({ranking,books}){
 const first=ranking.ordered[0];
 const book=books.find(item=>item.id===first?.bookId);
 return <Paper withBorder radius="lg" p="md" className="priority-summary">
  <Group align="flex-start" wrap="nowrap"><ThemeIcon variant="light" size={46} radius="xl"><IconRoute size={24}/></ThemeIcon><div className="priority-summary-copy"><Group gap="xs"><Title order={3}>Okuma önceliği</Title><Badge variant="light">Canlı sıra</Badge></Group><Text c="dimmed">Sekiz ölçüt, kitaplık durumun ve okuma kayıtların birlikte değerlendirilir. Her değişiklik bütün kataloğu yeniden sıralar.</Text>{book&&<Text mt={8}><strong>Şu an ilk:</strong> {displayTitle(book)} · {first.score}/100</Text>}</div></Group>
 </Paper>;
}
