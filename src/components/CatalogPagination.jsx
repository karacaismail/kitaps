import React,{useEffect,useState} from 'react';
import { Button, Group, NumberInput, Pagination, Popover, Select, Text } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { clampPage } from '../recommendations';
import { PAGE_SIZES } from '../library';
const sizeLabel=size=>`${size} / sayfa`;
// Every option label lies hidden in the field's grid cell, so the field is as wide as the longest one (styles.css).
const sizeField=field=><div className="page-size-field">{field}{PAGE_SIZES.map(size=><span key={size} className="page-size-sizer" aria-hidden="true">{sizeLabel(size)}</span>)}</div>;
export default function CatalogPagination({page,total,count,pageSize,onChange,onPageSize,hrefForPage}) {
 const [jump,setJump]=useState(page);
 const [opened,setOpened]=useState(false);
 useEffect(()=>setJump(page),[page]);
 const submit=e=>{e.preventDefault();onChange(clampPage(jump,total));setOpened(false)};
 const start=count?(page-1)*pageSize+1:0;
 const end=Math.min(page*pageSize,count);
 const linkProps=target=>({component:'a',href:hrefForPage?.(target),onClick:e=>{e.preventDefault();onChange(target)}});
 const previousProps=page>1?linkProps(page-1):{};
 const nextProps=page<total?linkProps(page+1):{};
 return <nav aria-label="Katalog sayfaları" className="catalog-pagination">
  <div className="pagination-meta"><Text c="dimmed" className="pagination-range"><strong>{start}–{end}</strong><span> · {count} kitap içinde</span></Text><Text className="pagination-page-status" c="dimmed">Sayfa <strong>{page}</strong> / {total}</Text><Select className="page-size-select" classNames={{dropdown:'page-size-dropdown',option:'page-size-option'}} aria-label="Sayfa başına kitap" value={String(pageSize)} data={PAGE_SIZES.map(size=>({value:String(size),label:sizeLabel(size)}))} onChange={value=>value&&onPageSize(Number(value))} allowDeselect={false} checkIconPosition="right" rightSectionWidth="var(--page-size-section)" inputContainer={sizeField} comboboxProps={{position:'top-end',offset:8,withinPortal:true,shadow:'md'}}/></div>
  <div className="pagination-progress" aria-hidden="true"><span style={{width:`${page/total*100}%`}}/></div>
  {total>1&&<div className="pagination-navigation"><Pagination.Root total={total} value={page} onChange={onChange} siblings={1} boundaries={1} size="lg" getItemProps={p=>({'aria-label':`${p}. sayfaya git`,'aria-current':p===page?'page':undefined})}>
   <Group gap={6} justify="center" className="pagination-controls"><Pagination.Previous aria-label="Önceki sayfa" rel={page>1?'prev':undefined} {...previousProps}/><div className="pagination-desktop"><Pagination.Items/></div><Pagination.Label className="pagination-mobile" formatLabel={({page,totalPages})=>`Sayfa ${page} / ${totalPages}`}/><Pagination.Next aria-label="Sonraki sayfa" rel={page<total?'next':undefined} {...nextProps}/></Group>
  </Pagination.Root>
  <Popover opened={opened} onChange={setOpened} position="top-end" width={264} withArrow shadow="md" trapFocus returnFocus><Popover.Target><Button variant="subtle" className="page-jump-trigger" rightSection={<IconChevronDown size={16}/>} onClick={()=>setOpened(v=>!v)} aria-expanded={opened}>Sayfaya git</Button></Popover.Target><Popover.Dropdown><form className="pagination-jump" onSubmit={submit}><NumberInput label={`Sayfa · 1–${total}`} aria-label="Gidilecek sayfa" min={1} max={total} allowDecimal={false} hideControls value={jump} onChange={setJump} data-autofocus/><Button type="submit">Git</Button></form></Popover.Dropdown></Popover>
  </div>}
 </nav>;
}
