import React,{useEffect,useState} from 'react';
import { Button, Group, NativeSelect, NumberInput, Pagination, Popover, Text } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { clampPage } from '../recommendations';
export default function CatalogPagination({page,total,count,pageSize,onChange,onPageSize}) {
 const [jump,setJump]=useState(page);
 const [opened,setOpened]=useState(false);
 useEffect(()=>setJump(page),[page]);
 const submit=e=>{e.preventDefault();onChange(clampPage(jump,total));setOpened(false)};
 return <nav aria-label="Katalog sayfaları" className="catalog-pagination">
  <div className="pagination-meta"><Text c="dimmed"><strong>{(page-1)*pageSize+1}–{Math.min(page*pageSize,count)}</strong> / {count} kitap</Text><NativeSelect aria-label="Sayfa başına kitap" value={pageSize} data={[{value:'12',label:'12 / sayfa'},{value:'24',label:'24 / sayfa'},{value:'48',label:'48 / sayfa'}]} onChange={e=>onPageSize(Number(e.currentTarget.value))}/></div>
  {total>1&&<div className="pagination-navigation"><Pagination.Root total={total} value={page} onChange={onChange} siblings={1} boundaries={1} size="lg" getItemProps={p=>({'aria-label':`${p}. sayfaya git`,'aria-current':p===page?'page':undefined})}>
   <Group gap={6} justify="center" className="pagination-controls"><Pagination.Previous aria-label="Önceki sayfa"/><div className="pagination-desktop"><Pagination.Items/></div><Pagination.Label className="pagination-mobile" formatLabel={({page,totalPages})=>`${page} / ${totalPages}`}/><Pagination.Next aria-label="Sonraki sayfa"/></Group>
  </Pagination.Root>
  <Popover opened={opened} onChange={setOpened} position="top-end" width={264} withArrow shadow="md" trapFocus returnFocus><Popover.Target><Button variant="subtle" className="page-jump-trigger" rightSection={<IconChevronDown size={16}/>} onClick={()=>setOpened(v=>!v)} aria-expanded={opened}>Sayfaya git</Button></Popover.Target><Popover.Dropdown><form className="pagination-jump" onSubmit={submit}><NumberInput label={`Sayfa · 1–${total}`} aria-label="Gidilecek sayfa" min={1} max={total} allowDecimal={false} hideControls value={jump} onChange={setJump} data-autofocus/><Button type="submit">Git</Button></form></Popover.Dropdown></Popover>
  </div>}
 </nav>;
}
