import React,{useState} from 'react';
import {Collapse,Paper,Text,UnstyledButton} from '@mantine/core';
import {IconChevronDown,IconRoute} from '@tabler/icons-react';

/** A one-line notice that the list follows reading priority. The criteria stay
 * one tap away so the catalog, not the explanation, fills the first screen. */
export default function ReadingPrioritySummary({ranking}){
 const [opened,setOpened]=useState(false);
 const criteria=ranking.ordered[0]?.criteria.map(item=>item.label.toLocaleLowerCase('tr'))||[];
 return <Paper withBorder radius="lg" className="priority-summary">
  <UnstyledButton className="priority-summary-toggle" onClick={()=>setOpened(value=>!value)} aria-expanded={opened} aria-controls="priority-summary-detail">
   <IconRoute size={20} aria-hidden="true"/><Text component="span" fw={600}>Okuma önceliğine göre sıralı</Text><IconChevronDown size={18} aria-hidden="true" className="priority-summary-chevron"/>
  </UnstyledButton>
  <Collapse expanded={opened} id="priority-summary-detail"><Text c="dimmed" className="priority-summary-detail">{criteria.length} ölçüt: {criteria.join(', ')}. Çocuk kitapları kendi aralarında sıralanır. Satın alma, favori, okuma durumu ve kişisel sıra puanı değiştirmez.</Text></Collapse>
 </Paper>;
}
