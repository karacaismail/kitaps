import React,{useState} from 'react';
import { Anchor, Popover, Text, UnstyledButton } from '@mantine/core';
import { IconCheck,IconMinus,IconX } from '@tabler/icons-react';
import { translationStatus } from '../translation';
export default function TranslationStatus({book}) {
 const [opened,setOpened]=useState(false),info=translationStatus(book);
 const original=book.verifiedEdition?.originalLanguage==='tr';
 const Mark=original||info.status==='unverified'?IconMinus:info.status==='available'?IconCheck:IconX;
 const label=original?'Çeviri gerekmiyor':info.status==='available'?'Türkçe çeviri var':info.status==='unavailable'?'Türkçe çeviri yok':'Türkçe çeviri doğrulanamadı';
 return <Popover opened={opened} onChange={setOpened} width={280} position="bottom-start" withArrow shadow="md" trapFocus returnFocus>
  <Popover.Target><UnstyledButton className="translation-status" data-status={original?'original':info.status} aria-label={`${book.titleTr||book.title}: ${label}. Baskı bilgisi`} aria-expanded={opened} onClick={()=>setOpened(v=>!v)}><span className="translation-status-mark" aria-hidden="true"><Mark size={22} stroke={2.4}/></span><span>Çeviri</span></UnstyledButton></Popover.Target>
  <Popover.Dropdown><Text fw={600}>{label}</Text><Text mt="xs">{info.description}</Text>{info.source&&<Anchor className="source-link" href={info.source} target="_blank" rel="noreferrer">Baskı kaynağını aç</Anchor>}</Popover.Dropdown>
 </Popover>;
}
