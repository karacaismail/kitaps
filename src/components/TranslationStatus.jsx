import React,{useState} from 'react';
import { Anchor, Popover, Text, UnstyledButton } from '@mantine/core';
import { IconLanguage,IconCheck,IconQuestionMark,IconX } from '@tabler/icons-react';
import { translationStatus } from '../translation';
export default function TranslationStatus({book}) {
 const [opened,setOpened]=useState(false),info=translationStatus(book);
 const Mark=info.status==='available'?IconCheck:info.status==='unavailable'?IconX:IconQuestionMark;
 return <Popover opened={opened} onChange={setOpened} width={280} position="bottom-start" withArrow shadow="md" trapFocus returnFocus>
  <Popover.Target><UnstyledButton className="translation-status" data-status={info.status} aria-label={`${book.titleTr||book.title}: ${info.label}. Baskı bilgisi`} aria-expanded={opened} onClick={()=>setOpened(v=>!v)}><span className="translation-pictogram" aria-hidden="true"><IconLanguage size={23}/><Mark size={13} stroke={2.6}/></span><span>{info.label}</span></UnstyledButton></Popover.Target>
  <Popover.Dropdown><Text fw={600}>{info.label}</Text><Text mt="xs">{info.description}</Text>{info.source&&<Anchor className="source-link" href={info.source} target="_blank" rel="noreferrer">Baskı kaynağını aç</Anchor>}</Popover.Dropdown>
 </Popover>;
}
