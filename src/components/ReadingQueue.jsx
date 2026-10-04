import React from 'react';
import { ActionIcon, Badge, Button, Card, Group, Progress, Stack, Text, Title } from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconArrowUpRight, IconListNumbers, IconX } from '@tabler/icons-react';
import { STATE_LABELS } from '../library';
import { progressPercent, readingErrors } from '../reading';
import { displayTitle } from '../translation';

export default function ReadingQueue({queue,books,reading,states,onMove,onRemove,onOpen,onBrowse,BookCover}) {
 return <Stack gap="xl">
  {queue.length===0?<Card withBorder radius="lg" padding="xl" className="queue-empty"><IconListNumbers size={36} stroke={1.5}/><Title order={3} mt="lg">Bir sonraki kitabına yer aç.</Title><Text c="dimmed" mt="sm">Katalogdan en fazla beş kitap seç; her karttaki “Sırama ekle” düğmesini kullan.</Text><Button mt="lg" onClick={onBrowse}>Kitap seç</Button></Card>:<ol className="reading-queue" role="list">{queue.map((id,index)=>{
   const b=books[id],r=reading[id],pct=progressPercent(r),errors=readingErrors(r);return <li key={id} role="listitem"><Card withBorder padding="lg" radius="lg" className="queue-card">
    <div className="queue-book"><div className="queue-cover"><BookCover book={b} onOpen={onOpen} read={(states[id]||[]).includes('okundu')}/></div><div className="queue-title"><Text c="dimmed" mb="xs">{index+1}. sırada</Text><Title order={3}><button className="title-button" onClick={()=>onOpen(id)}>{displayTitle(b)}</button></Title><Text c="dimmed" mt="sm">{b.author}</Text><Group gap={6} mt="sm">{(states[id]||[]).filter(s=>['okunuyor','araverildi','birakildi','okundu'].includes(s)).map(s=><Badge key={s}>{STATE_LABELS[s]}</Badge>)}</Group></div></div>
    {pct!==null&&!errors.pages&&<div className="queue-progress"><Text mb="xs">{r.page} / {r.totalPages} sayfa · %{pct}</Text><Progress value={pct} size="sm" aria-label={`${displayTitle(b)}: okuma ilerlemesi`}/></div>}
    <div className="queue-controls"><Group gap={6}><ActionIcon variant="default" disabled={index===0} onClick={()=>onMove(id,-1)} aria-label={`${displayTitle(b)}: sırada yukarı taşı`}><IconArrowUp size={20}/></ActionIcon><ActionIcon variant="default" disabled={index===queue.length-1} onClick={()=>onMove(id,1)} aria-label={`${displayTitle(b)}: sırada aşağı taşı`}><IconArrowDown size={20}/></ActionIcon><ActionIcon variant="subtle" color="gray" onClick={()=>onRemove(id)} aria-label={`${displayTitle(b)}: sıradan çıkar`}><IconX size={20}/></ActionIcon></Group><Button variant="light" rightSection={<IconArrowUpRight size={18}/>} onClick={()=>onOpen(id)}>Okuma kaydım</Button></div>
   </Card></li>;
  })}</ol>}
  {queue.length>0&&<Button variant="default" onClick={onBrowse}>{queue.length<5?'Sırama kitap seç':'Kataloğa dön'}</Button>}
 </Stack>;
}
