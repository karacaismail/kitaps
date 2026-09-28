import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Accordion, ActionIcon, Alert, Anchor, Badge, Box, Button, Card, Container, Divider, FileButton, Group, MantineProvider, Modal, Paper, Select, Stack, Text, TextInput, Tabs, ThemeIcon, Title, Tooltip, createTheme, localStorageColorSchemeManager } from '@mantine/core';
import { IconLink, IconArrowLeft, IconArrowRight, IconArrowUpRight, IconBook2, IconShoppingBagCheck, IconBooks, IconCheck, IconChevronRight, IconDownload, IconFilter, IconHeart, IconLayersIntersect, IconListNumbers, IconSearch, IconUpload, IconWoman, IconX } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '@mantine/core/styles.css';
import '@fontsource-variable/josefin-sans/wght.css';
import '@fontsource-variable/josefin-sans/wght-italic.css';
import catalog from './catalog.json';
import readingNotes from '../data/sources/kitaplar.md?raw';
import originalAtlas from '../data/sources/atlas-v1.json';
import originalLocal from '../data/sources/okuma-kumeleri.json';
import originalKitaps from '../data/sources/kitaps.json';
import originalCovers from '../data/sources/kitaps-covers.json';
import originalBuiltBooks from '../data/sources/kitaps-built-books.json';
import originalEntrepreneurship from '../data/sources/entrepreneurship-curriculum.json';
import SpotlightCard from './components/SpotlightCard';
import NoteCards from './components/NoteCards';
import ReadingPanel, { QueueButton } from './components/ReadingPanel';
import ReadingQueue from './components/ReadingQueue';
import BookDiscovery, { ReadingPurpose } from './components/BookDiscovery';
import EditionGuide from './components/EditionGuide';
import CatalogPagination from './components/CatalogPagination';
import TranslationStatus from './components/TranslationStatus';
import { displayTitle,translationStatus } from './translation';
import { applySeo,seoState } from './seo';
import ThemeToggle from './components/ThemeToggle';
import CategoryPill from './components/CategoryPill';
import EditionSummary from './components/EditionSummary';
import BookSheet from './components/BookSheet';
import FilterSheet from './components/FilterSheet';
import LibraryToast from './components/LibraryToast';
import TranslationCriteria from './components/TranslationCriteria';
import ReadingPriorityCard from './components/ReadingPriorityCard';
import ReadingPrioritySummary from './components/ReadingPrioritySummary';
import ReadingPriorityBadge from './components/ReadingPriorityBadge';
import GitHubSyncPanel from './components/GitHubSyncPanel';
import {useGitHubStateSync} from './state/useGitHubStateSync';
import { ReadingPriorityEngine, ReadingRankingViewModel } from './ranking/ReadingPriorityEngine.ts';
import { PERSONAL_KEY, cleanPersonal, cleanReading, addToQueue, moveInQueue, restorePersonal, todayLocal } from './reading';
import { STATE_LABELS, QUALITY_LABELS, ORIGIN_LABELS, emptyFilters, prepareBooks, filterBooks, sortBooks, toggleState, migrateStates, filterCount, decodeRoute, encodeRoute, normalize, plainTextMarkers, booksForShelf } from './library';
import './styles.css';

const AccessibilityAudit=import.meta.env.DEV?React.lazy(()=>import('./components/AccessibilityAudit')):null;
const theme = createTheme({
 fontFamily:'"Josefin Sans Variable", sans-serif', primaryColor:'coffee', primaryShade:8, defaultRadius:'md', cursorType:'pointer',
 colors:{coffee:['#f8f2ec','#eedfd1','#dfc3ac','#cba283','#5b4331','#513525','#442a1c','#372014','#25150e','#110905']},
 fontSizes:{xs:'1rem',sm:'1rem',md:'1rem',lg:'1.125rem',xl:'1.25rem'},
 headings:{fontFamily:'"Josefin Sans Variable", sans-serif',fontWeight:'500',sizes:{h1:{fontSize:'3rem',lineHeight:'1.06'},h2:{fontSize:'2rem',lineHeight:'1.15'},h3:{fontSize:'1.5rem',lineHeight:'1.25'}}},
 components:{Button:{defaultProps:{size:'md'}},ActionIcon:{defaultProps:{size:44}},TextInput:{defaultProps:{size:'md'}},Select:{defaultProps:{size:'md'}},MultiSelect:{defaultProps:{size:'md'}},Badge:{defaultProps:{size:'lg',variant:'light',radius:'sm'}},Drawer:{defaultProps:{closeButtonProps:{'aria-label':'Kapat'},overlayProps:{backgroundOpacity:.35,blur:3}}}}
});
const books=prepareBooks(catalog.books);
const bookIds=books.map(book=>book.id);
const readingRankingViewModel=new ReadingRankingViewModel(new ReadingPriorityEngine(catalog));
const byId=Object.fromEntries(books.map(b=>[b.id,b]));
const collectionMap=Object.fromEntries(catalog.collections.map(c=>[c.id,c]));

function BookshelfIcon({size=28}) {
 return <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 23.5h21M5 4.5h5v16H5zM11.5 6.5h4.5v14h-4.5zM18 5.5l4-1 3.5 15.5-4 1z"/><path d="M3.5 21h21v3H3.5z"/></svg>;
}
const groupMap=Object.fromEntries(catalog.groups.map(g=>[g.id,g]));
const categoryMap=Object.fromEntries(catalog.categories.map(c=>[c.id,c]));
const STATE_KEY='kitapatlasi:states:v2';

const authorOptions=[...new Set(books.map(b=>b.author).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'tr'));
const safeRead=key=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}};
const loadStates=()=>migrateStates(books,safeRead(STATE_KEY),safeRead('kitaps:states:v1'));
function download(name,data,type='application/json') {
 const url=URL.createObjectURL(new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type}));
 const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function SourceBadge({id}) {return <Badge color={id==='kitaps'?'grape':id==='local'?'orange':'coffee'}>{ORIGIN_LABELS[id]}</Badge>}
function ActiveFilters({filters:f,onChange}) {
 const chips=[];
 const labels={categories:id=>categoryMap[id]?.label,collections:id=>collectionMap[id]?.short,groups:id=>groupMap[id]?.title,states:id=>STATE_LABELS[id],authors:id=>id,origins:id=>ORIGIN_LABELS[id],awards:id=>id,awardYears:id=>`FT ${id}`,qualities:id=>QUALITY_LABELS[id]};
 for(const [key,label] of Object.entries(labels))for(const value of f[key])chips.push({id:`${key}-${value}`,label:label(value)||value,remove:()=>onChange({...f,[key]:f[key].filter(v=>v!==value)})});
 if(f.hasEdition)chips.push({id:'edition',label:'Künye bilgisi var',remove:()=>onChange({...f,hasEdition:false})});
 if(f.shared)chips.push({id:'shared',label:'Birden fazla kümede',remove:()=>onChange({...f,shared:false})});
 if(f.yearMin!==''||f.yearMax!=='')chips.push({id:'years',label:`Yayın: ${f.yearMin||'…'}–${f.yearMax||'…'}`,remove:()=>onChange({...f,yearMin:'',yearMax:''})});
 return chips.length?<Group gap={8} className="active-filters" role="group" aria-label="Etkin filtreler">{chips.map(c=><Button key={c.id} variant="light" rightSection={<IconX size={17}/>} onClick={c.remove} aria-label={`${c.label} filtresini kaldır`}>{c.label}</Button>)}</Group>:null;
}
function BookCover({book:b,onOpen,detail=false}) {
 const [failed,setFailed]=useState(false);
 const cover=b.cover;
 const content=cover&&!failed?<img src={globalThis.__KITAP_COVERS__?.[cover.src]||`./${cover.src}`} alt={`${cover.title} — ${cover.publisher}, ${cover.language==='tr'?'Türkçe':'Uluslararası'} baskı kapağı`} width="240" height="360" loading={detail?'eager':'lazy'} decoding="async" onError={()=>setFailed(true)}/>:<span className="cover-placeholder"><IconBook2 size={42} stroke={1.2} aria-hidden="true"/><span>Kapak henüz eklenmedi</span></span>;
 return detail?<div className="cover-stage cover-stage-detail">{content}</div>:<button className="cover-stage cover-open" onClick={()=>onOpen(b.id)} aria-label={`${displayTitle(b)} ayrıntılarını aç`}>{content}</button>;
}
function BookCard({book:b,ranking,states,onOpen,onToggle,queue,onAdd,onQueue}) {
 const saved=(states[b.id]||[]).includes('onemli');
 return <Card component="article" withBorder padding={0} radius="lg" className="book-card" data-book-id={b.id} onClick={e=>{if(!e.target.closest('button,a,input,select,textarea,[role="button"]'))onOpen(b.id)}}>
  <div className="book-visual"><BookCover book={b} onOpen={onOpen}/><ReadingPriorityBadge ranking={ranking}/><ActionIcon className="cover-save" title={saved?'Favorilerden çıkar':'Favorilerime ekle'} variant="white" color={saved?'coffee':'gray'} aria-label={`${displayTitle(b)}: favori ${saved?'işaretini kaldır':'olarak işaretle'}`} aria-pressed={saved} onClick={()=>onToggle(b.id,'onemli')}><IconHeart size={22} fill={saved?'currentColor':'none'}/></ActionIcon><Tooltip label={(states[b.id]||[]).includes('alindi')?'Kitaplığımdan çıkar':'Satın aldım'} withArrow><ActionIcon className="cover-owned" variant={(states[b.id]||[]).includes('alindi')?'filled':'white'} color="coffee" aria-label={`${displayTitle(b)}: ${(states[b.id]||[]).includes('alindi')?'kitaplığımdan çıkar':'satın aldım'}`} aria-pressed={(states[b.id]||[]).includes('alindi')} onClick={e=>onToggle(b.id,'alindi',e.currentTarget)}><IconShoppingBagCheck size={22}/></ActionIcon></Tooltip><QueueButton id={b.id} title={displayTitle(b)} queue={queue} onAdd={onAdd} onQueue={onQueue} iconOnly/></div>
  <div className="book-card-body">
   <Title order={3}><button className="title-button" onClick={()=>onOpen(b.id)}>{displayTitle(b)}</button></Title>
   <Text className="book-author">{b.author||'Yazar bilgisi kaynakta belirtilmemiş'}</Text>
   <div className="book-meta-row">
    <div className="book-edition-row">
     <TranslationStatus book={b}/>
     {b.cover?.publisher&&<Text className="book-publisher">{b.cover.publisher}</Text>}
    </div>
   </div>
   {(states[b.id]||[]).filter(s=>!['onemli','alindi'].includes(s)).length>0&&<Group gap={8} mt="sm">{states[b.id].filter(s=>!['onemli','alindi'].includes(s)).map(s=><Badge key={s} color="coffee">{STATE_LABELS[s]}</Badge>)}</Group>}
  </div>
 </Card>
}
function BookDetail({book:b,ranking,onClose,onOpen,onBack,hasBack,states,onToggle,onCollection,onCategory,personal,onReading,onAdd,onQueue,storageError,feedback}) {
 const topRef=useRef(null);
 const shownTitle=b?displayTitle(b):'';
 const originalTitle=b&&translationStatus(b).status==='available'&&b.titleTr&&b.titleTr!==b.title?b.title:'';
 useEffect(()=>{if(b)topRef.current?.scrollIntoView({block:'start',behavior:'instant'})},[b?.id]);
 return <BookSheet opened={!!b} onClose={onClose}>
  {b&&<Stack gap="xl" pb="xl" key={b.id}>
   <div ref={topRef} className="detail-top">{hasBack&&<Button variant="subtle" leftSection={<IconArrowLeft size={18}/>} onClick={onBack}>Önceki kitaba dön</Button>}</div>
   <div className="detail-hero"><div className="detail-cover-block"><BookCover key={b.id} book={b} detail/></div>
    <div className="detail-heading"><Text c="dimmed" mb="sm">{b.author||'Yazar bilgisi belirtilmemiş'}</Text><Title order={2}>{shownTitle}</Title>{originalTitle&&<Text c="dimmed" mt="sm">{originalTitle}</Text>}{b.years.length>0&&<Text mt="sm">İlk yayın · {b.years.join(' / ')}</Text>}<div className="detail-translation-status"><TranslationStatus book={b}/></div>
     <Group gap={8} mt="md">{b.categories.map(id=><CategoryPill key={id} id={id} label={categoryMap[id].label} onNavigate={onCategory}/>)}</Group>
     {b.cover&&<div className="cover-caption"><Text c="dimmed">{b.cover.scope||(b.cover.language==='tr'?'Türkçe baskı kapağı':'Uluslararası baskı kapağı')}</Text><Anchor href={b.cover.sourceUrl} target="_blank" rel="noreferrer" className="source-link">Kapaktaki baskıyı incele <IconArrowUpRight size={17}/></Anchor></div>}
    </div>
   </div>
   <EditionSummary book={b}/>
   <Paper withBorder p="md" radius="lg"><Group gap={8}>{Object.entries(STATE_LABELS).filter(([key])=>['onemli','alinacak','alindi'].includes(key)).map(([key,label])=><Button variant={(states[b.id]||[]).includes(key)?'filled':'light'} key={key} aria-pressed={(states[b.id]||[]).includes(key)} onClick={e=>onToggle(b.id,key,e.currentTarget)} leftSection={(states[b.id]||[]).includes(key)?<IconCheck size={17}/>:null}>{label}</Button>)}</Group><QueueButton id={b.id} queue={personal.queue} onAdd={onAdd} onQueue={onQueue}/></Paper>
   <ReadingPurpose book={b} catalog={catalog}/>
   <BookDiscovery key={b.id} book={b} catalog={catalog} states={states} onOpen={onOpen} onCategory={onCategory} onCollection={onCollection} BookCover={BookCover}/>
   <EditionGuide book={b}/>
   <Accordion multiple variant="separated" radius="lg" className="detail-sections">
    <Accordion.Item value="personal"><Accordion.Control>Okuma kaydım ve kişisel notlarım</Accordion.Control><Accordion.Panel><ReadingPanel book={b} record={personal.reading[b.id]} states={states[b.id]||[]} onToggle={onToggle} onChange={onReading} queue={personal.queue} onAdd={onAdd} onQueue={onQueue} storageError={storageError}/></Accordion.Panel></Accordion.Item>
    <Accordion.Item value="sources"><Accordion.Control>Kaynaklar ve küme üyelikleri · {b.collectionIds.length}</Accordion.Control><Accordion.Panel><Stack gap="md"><Group gap={8}>{b.origins.map(id=><SourceBadge id={id} key={id}/>)}</Group>
     {b.notes.map((n,i)=><Box className="note-block" key={i}><Text>{n.text}</Text><Text c="dimmed" mt={6}>{n.source}</Text></Box>)}
     {b.collectionIds.map(id=>{const memberships=b.memberships.filter(m=>m.collectionId===id);return <Paper key={id} withBorder p="md"><Button variant="subtle" className="membership-link" onClick={()=>onCollection(id)} rightSection={<IconArrowRight size={18}/>}>{collectionMap[id].title}</Button><Text c="dimmed" mt="sm">{[...new Set(memberships.map(m=>groupMap[m.groupId].title))].join(' · ')}</Text>{memberships.filter(m=>m.award).map(m=><Badge key={m.groupId} mt="sm">{m.awardYear} · {m.award}</Badge>)}{memberships.find(m=>m.source)&&<Anchor className="source-link" href={memberships.find(m=>m.source).source} target="_blank" rel="noreferrer">Özgün kaynağı aç <IconArrowUpRight size={17}/></Anchor>}</Paper>})}
     {b.tags.length>0&&<Text c="dimmed">Kaynak dosyanın etiketleri: {b.tags.map(t=>catalog.sourceTags[t]).join(' · ')}.</Text>}
    </Stack></Accordion.Panel></Accordion.Item>
   </Accordion>
   <ReadingPriorityCard ranking={ranking}/>
  </Stack>}
  {feedback}
 </BookSheet>
}
function Collections({onCollection,onGroup,states}) {
 const [query,setQuery]=useState('');
 const available=booksForShelf(books,states);
 const collectionCount=id=>available.filter(b=>b.collectionIds.includes(id)).length;
 const groupCount=id=>available.filter(b=>b.groupIds.includes(id)).length;
 const shown=catalog.collections.filter(c=>normalize(c.title+' '+c.description).includes(normalize(query)));
 return <Stack gap="xl">
  <TextInput label="Kümeler arasında ara" placeholder="TIME, çocuk, strateji…" value={query} onChange={e=>setQuery(e.currentTarget.value)} leftSection={<IconSearch size={20}/>}/>
  <Accordion variant="separated" radius="lg" className="collections-accordion">{shown.map(c=><Accordion.Item key={c.id} value={c.id}>
   <Accordion.Control><Group gap="md" wrap="nowrap"><ThemeIcon variant="light" size={48} color={c.origin==='kitaps'?'grape':'coffee'} radius="md"><Text fw={600}>{c.mark}</Text></ThemeIcon><div><Text fw={600}>{c.title}</Text><Text c="dimmed">{collectionCount(c.id)} kitap · {c.count} kaynak kaydı · {c.groupIds.length} alt küme</Text></div></Group></Accordion.Control>
   <Accordion.Panel><Stack gap="md"><Text>{c.description}</Text>{c.context?.purpose&&<Text><strong>Okuma amacı:</strong> {c.context.purpose}</Text>}{c.context?.criterion&&<Text><strong>Seçim ölçütü:</strong> {c.context.criterion}</Text>}{c.context?.verdict&&<Box className="note-block"><Text>{c.context.verdict}</Text></Box>}<Text c="dimmed">{c.note}</Text><Button onClick={()=>onCollection(c.id)} rightSection={<IconArrowRight size={18}/>}>Bu kümedeki kitaplar</Button><Stack gap={8}>{c.groupIds.map(id=><Button key={id} variant="default" onClick={()=>onGroup(c.id,id)} className="subset-button" justify="space-between" rightSection={<IconChevronRight size={19}/>}>{groupMap[id].title} · {groupCount(id)}</Button>)}</Stack>{c.source&&<Anchor href={c.source} target="_blank" rel="noreferrer">Özgün liste <IconArrowUpRight size={16}/></Anchor>}</Stack></Accordion.Panel>
  </Accordion.Item>)}</Accordion>{!shown.length&&<Text>Bu aramayla eşleşen küme yok.</Text>}
 </Stack>
}
function Notes({states,setStates,personal,setPersonal,sync}) {
 const [message,setMessage]=useState('');
 const sections=useMemo(()=>plainTextMarkers(readingNotes).split(/(?=^## )/m),[]);
 const importStates=async file=>{
  if(!file)return;
  try {
   const input=JSON.parse(await file.text());
   if(!input||typeof input!=='object'||Array.isArray(input))throw Error();
   const supplied=input.states||(('queue' in input||'reading' in input)?{}:input);
   if(!supplied||typeof supplied!=='object'||Array.isArray(supplied))throw Error();
   const valid=Object.fromEntries(Object.entries(supplied).filter(([id,v])=>Object.hasOwn(byId,id)&&Array.isArray(v)).map(([id,v])=>[id,v.filter(s=>s in STATE_LABELS)]));
   setStates(prev=>({...prev,...valid}));
   setPersonal(prev=>restorePersonal(prev,input,books.map(b=>b.id)));
   const clean=cleanPersonal(input,books.map(b=>b.id));
   setMessage(`${Object.keys(valid).length} kitabın işaretleri ve ${Object.keys(clean.reading).length} okuma kaydı içe aktarıldı.${Array.isArray(input.queue)?` Okuma sırası ${clean.queue.length} kitapla geri yüklendi.`:''}`);
  }catch{setMessage('Dosya okunamadı. Bu siteden dışa aktarılmış bir JSON dosyası seç.');}
 };

 return <Stack gap="xl">
  <Paper withBorder p="lg" radius="lg"><Title order={3}>Birleşimin kapsamı</Title><Text mt="md">Kitap Atlası’ndaki 619 liste kaydı ve iki rehber; Okuma Kümeleri dosyasındaki 52 kitap; Kitaps’taki 170 künye kaydı ve 35 kitaplık araştırılmış girişimcilik rotası birleştirildi.</Text><Text mt="sm">Aynı eserlerin küme üyelikleri, başlık karşılıkları ve farklı çevirileri tek kayıtta toplandı. Grafik uyarlamalar ve derlemeler ayrı eser olarak korundu.</Text><Group mt="md" gap={8}>{Object.keys(ORIGIN_LABELS).map(id=><SourceBadge id={id} key={id}/>)}</Group></Paper>
  <Paper withBorder p="lg" radius="lg"><Title order={3}>Kişisel kitaplığını yedekle</Title><Text mt="sm">Okuma sıran, durumların, tarihler, sayfa ilerlemen ve kişisel notların bu tarayıcıda saklanır. Hepsini yedekleyip başka bir cihaza taşıyabilirsin. Eski işaret dosyaları da desteklenir. Okuma sırası bulunan bir yedek, mevcut sıranın yerini alır; diğer kayıtlar birleştirilir.</Text><Group mt="md"><Button variant="light" leftSection={<IconDownload size={19}/>} onClick={()=>download('kitap-atlasi-kisisel-yedek.json',{version:3,exportedAt:new Date().toISOString(),states,...personal})}>Kişisel yedeğimi indir</Button><FileButton onChange={importStates} accept="application/json">{props=><Button {...props} variant="default" leftSection={<IconUpload size={19}/>}>Yedekten aktar</Button>}</FileButton></Group>{message&&<Text mt="md" role="status">{message}</Text>}</Paper>
  <GitHubSyncPanel sync={sync}/>
  <div><Title order={3}>Tam veri ve kaynaklar</Title><Text c="dimmed" mt="sm">Kategoriler bu birleşik katalog için düzenlenmiş konu etiketleridir; kaynakların özgün sıralamalarından bağımsızdır. Bir kitap birden fazla kategoriye girebilir.</Text><Group mt="md"><Button variant="light" leftSection={<IconDownload size={19}/>} onClick={()=>download('kitap-atlasi-tum-veri.json',{catalog,sources:{atlas:originalAtlas,okumaKumeleri:originalLocal,kitaps:originalKitaps,kitapsCovers:originalCovers,kitapsBuiltBooks:originalBuiltBooks,entrepreneurship:originalEntrepreneurship,kitapsNotes:readingNotes}})}>Tüm kataloğu indir</Button><Button variant="default" leftSection={<IconDownload size={19}/>} onClick={()=>download('kitaps-kaynak-notlari.md',plainTextMarkers(readingNotes),'text/markdown')}>Kaynak notlarını indir</Button></Group><Text mt="md">FT arşivi 26 Eylül 2026 görünümünü korur; 2026 kayıtları kaynakta uzun liste olarak işaretliydi. Birleştirme: {catalog.updated}.</Text><Group mt="md"><Anchor href="https://karacaismail.github.io/kitaps/" target="_blank" rel="noreferrer">Kitaps</Anchor><Anchor href="https://github.com/karacaismail/kitaps" target="_blank" rel="noreferrer">Kaynak kod ve veri arşivi</Anchor></Group></div>
  <Divider/>
  <div><Title order={2}>Kaynak dosyanın tamamı</Title><Text c="dimmed" mt="sm">Kitaps’taki okuma sıraları, çeviri karşılaştırmaları, çocuk programı ve araştırma notları. Aşağıdaki değerlendirmeler özgün dosyanın içeriğidir.</Text></div>
  <Accordion variant="separated" radius="lg">{sections.map((s,i)=>{const title=i===0?'Dosyaya giriş':s.split('\n')[0].replace(/^## /,'').replace(/\*/g,'');return <Accordion.Item value={String(i)} key={i}><Accordion.Control>{title}</Accordion.Control><Accordion.Panel><div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{table:NoteCards,a:({href,children})=><Anchor href={href} target="_blank" rel="noreferrer">{children}</Anchor>}}>{i===0?s:s.slice(s.indexOf('\n')+1)}</ReactMarkdown></div></Accordion.Panel></Accordion.Item>})}</Accordion>
 </Stack>
}
function AtlasApp() {
 const [route,setRoute]=useState(()=>decodeRoute(window.location.hash||window.location.search,catalog));
 const {filters,view,sort,book,page,pageSize}=route;
 const [states,setStates]=useState(loadStates);
 const [storageError,setStorageError]=useState(false);
 const [personal,setPersonal]=useState(()=>cleanPersonal(safeRead(PERSONAL_KEY),books.map(b=>b.id)));
 const githubSync=useGitHubStateSync({bookIds,states,setStates,personal,setPersonal});
 const [personalStorageError,setPersonalStorageError]=useState(false);
 const [opened,setOpened]=useState(false);
 const [draft,setDraft]=useState(emptyFilters);
 const [bookTrail,setBookTrail]=useState([]);
 const [copied,setCopied]=useState(false);
 const [transfer,setTransfer]=useState(null);
 const [guideOpened,setGuideOpened]=useState(false);
 const transferOrigin=useRef(null);
 const dismissTransfer=useCallback(()=>{
  const restoreFocus=document.activeElement?.closest('.library-toast');
  setTransfer(null);
  if(restoreFocus){
   const target=transferOrigin.current?.isConnected?transferOrigin.current:document.querySelector('.header-library');
   target?.focus({preventScroll:true});
  }
 },[]);
 const resultsRef=useRef(null);
 const openedFromCatalog=useRef(false);
 const navigate=next=>{const encoded=encodeRoute(next,catalog);window.history.pushState(null,'',window.location.pathname+(encoded?'?'+encoded:''));setRoute(next)};
 const closeBook=()=>{if(openedFromCatalog.current){openedFromCatalog.current=false;window.history.back()}else setRoute(r=>({...r,book:null}))};
 useEffect(()=>{try{localStorage.setItem(STATE_KEY,JSON.stringify(states));setStorageError(false)}catch{setStorageError(true)}},[states]);
 useEffect(()=>{try{localStorage.setItem(PERSONAL_KEY,JSON.stringify(personal));setPersonalStorageError(false)}catch{setPersonalStorageError(true)}},[personal]);
 useEffect(()=>{const encoded=encodeRoute(route,catalog);const url=window.location.pathname+(encoded?'?'+encoded:'');window.history.replaceState(null,'',url)},[route]);
 useEffect(()=>{const change=()=>{openedFromCatalog.current=false;setBookTrail([]);setRoute(decodeRoute(window.location.hash||window.location.search,catalog))};window.addEventListener('hashchange',change);window.addEventListener('popstate',change);return()=>{window.removeEventListener('hashchange',change);window.removeEventListener('popstate',change)}},[]);
 const changeFilters=next=>setRoute(r=>({...r,filters:next,page:1}));
 const shelfBooks=useMemo(()=>booksForShelf(books,states,view==='owned'?'owned':view==='favorites'?'favorites':'catalog'),[states,view]);
 const ownedCount=useMemo(()=>booksForShelf(books,states,'owned').length,[states]);
 const ranking=useMemo(()=>readingRankingViewModel.build({states,queue:personal.queue,reading:personal.reading}),[states,personal.queue,personal.reading]);
 const filtered=useMemo(()=>sortBooks(filterBooks(shelfBooks,filters,states),sort,states,ranking.byId),[shelfBooks,filters,sort,states,ranking]);
 const pages=Math.max(1,Math.ceil(filtered.length/pageSize));const currentPage=Math.min(page,pages);
 const displayed=filtered.slice((currentPage-1)*pageSize,currentPage*pageSize);
 useEffect(()=>{if(page!==currentPage)setRoute(r=>({...r,page:currentPage}))},[page,currentPage]);
 useEffect(()=>applySeo(seoState({route:{...route,page:currentPage},catalog,count:filtered.length,currentPage,totalPages:pages,displayed})),[route,filtered.length,currentPage,pages,displayed]);
 const draftCount=useMemo(()=>filterBooks(shelfBooks,draft,states).length,[shelfBooks,draft,states]);
 const activeCount=filterCount({...filters,query:''});
 const onToggle=(id,key,trigger=document.activeElement)=>{
  const marking=!(states[id]||[]).includes(key);
  setStates(prev=>({...prev,[id]:toggleState(prev[id],key)}));
  if(key==='alindi'){transferOrigin.current=trigger;setTransfer({id,owned:marking});}
  if(marking&&['okunuyor','okundu'].includes(key))setPersonal(prev=>{
   const field=key==='okunuyor'?'startedAt':'finishedAt';const record=cleanReading(prev.reading[id]);
   return {...prev,reading:{...prev.reading,[id]:{...record,[field]:record[field]||todayLocal()}}};
  });
 };
 const onReading=(id,patch)=>setPersonal(prev=>({...prev,reading:{...prev.reading,[id]:cleanReading({...prev.reading[id],...patch})}}));
 const onAdd=id=>setPersonal(prev=>({...prev,queue:addToQueue(prev.queue,id)}));
 const onQueue=()=>{navigate({...route,view:'queue',book:null,page:1});window.scrollTo({top:0,behavior:'instant'})};
 const onOpen=id=>{setBookTrail(book?[...bookTrail,book]:[]);if(!book){openedFromCatalog.current=true;navigate({...route,book:id})}else setRoute(r=>({...r,book:id}))};
 const previousBook=()=>{const id=bookTrail.at(-1);if(id){setBookTrail(bookTrail.slice(0,-1));setRoute(r=>({...r,book:id}))}};
 const onBrowse=()=>{navigate({...route,view:'books',book:null,filters:emptyFilters(),page:1});window.scrollTo({top:0,behavior:'instant'})};
 const goCollection=(id,gid)=>{navigate({...route,view:'books',book:null,page:1,filters:{...emptyFilters(),collections:[id],groups:gid?[gid]:[]}});window.scrollTo({top:0,behavior:'instant'})};
 const goCategory=id=>{const next={...route,view:'books',book:null,page:1,filters:{...emptyFilters(),categories:[id]}};window.history.pushState(null,'',window.location.pathname+'?'+encodeRoute(next,catalog));setRoute(next);window.scrollTo({top:0,behavior:'instant'})};
 const changePage=p=>{navigate({...route,page:p,book:null});resultsRef.current?.scrollIntoView({behavior:'instant',block:'start'})};
 const copyLink=async()=>{try{await navigator.clipboard.writeText(window.location.href);setCopied(true);setTimeout(()=>setCopied(false),2000)}catch{setCopied(false)}};
 const transferNotice=<div className="library-toast-region" role="status" aria-live="polite" aria-atomic="true">{transfer&&<LibraryToast key={`${transfer.id}-${transfer.owned}`} book={byId[transfer.id]} owned={transfer.owned} onClose={dismissTransfer} onUndo={()=>{setStates(prev=>({...prev,[transfer.id]:toggleState(prev[transfer.id],'alindi')}));dismissTransfer()}}/>}</div>;
 return <><a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();document.getElementById('main-content').focus()}}>İçeriğe geç</a>
  <Container size={960} className="app-shell" px={{base:8,sm:24}}>
   <header className="site-header"><Group component="a" href="./" className="brand-link" aria-label="Kitaplık · filtresiz ana sayfa" gap={6} wrap="nowrap" onClick={e=>{if(e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){e.preventDefault();window.history.pushState(null,'',window.location.pathname);setRoute({view:'books',book:null,sort:'reading',filters:emptyFilters(),page:1,pageSize:24});setBookTrail([]);window.scrollTo({top:0,behavior:'instant'})}}}><ThemeIcon size={42} radius="md" color="coffee"><IconBooks size={26} stroke={1.6}/></ThemeIcon><Text className="brand">Kitaplık</Text></Group><nav className="header-shortcuts" aria-label="Hızlı erişim"><Tooltip label="Kızım için"><ActionIcon className="header-children" size={48} variant={view==='books'&&filters.categories.length===1&&filters.categories[0]==='children'?'filled':'subtle'} aria-label="Kızım için" aria-current={view==='books'&&filters.categories.length===1&&filters.categories[0]==='children'?'page':undefined} onClick={()=>goCategory('children')}><IconWoman size={29}/></ActionIcon></Tooltip><Tooltip label="Favoriler"><ActionIcon className="header-favorites" size={48} variant={view==='favorites'?'filled':'subtle'} aria-label="Favoriler" aria-current={view==='favorites'?'page':undefined} onClick={()=>{navigate({...route,view:'favorites',book:null,filters:emptyFilters(),page:1});window.scrollTo({top:0,behavior:'instant'})}}><IconHeart size={29} fill={view==='favorites'?'currentColor':'none'}/></ActionIcon></Tooltip><Tooltip label={`Kitaplığım · ${ownedCount} kitap`}><ActionIcon className="header-library" size={48} variant={view==='owned'?'filled':'subtle'} aria-label={`Kitaplığım · ${ownedCount} kitap`} aria-current={view==='owned'?'page':undefined} onClick={()=>{navigate({...route,view:'owned',book:null,filters:emptyFilters(),page:1});window.scrollTo({top:0,behavior:'instant'})}}><BookshelfIcon size={29}/></ActionIcon></Tooltip></nav><ThemeToggle/></header>
   <Tabs className="main-section-tabs" value={['owned','favorites'].includes(view)?'books':view} onChange={v=>navigate({...route,view:v,book:null,page:1})}>
    <Tabs.List className="main-tabs" aria-label="Kitaplık bölümleri">{[{id:'books',name:'Kitaplar',icon:IconBook2},{id:'queue',name:'Sıram',icon:IconListNumbers},{id:'collections',name:'Kümeler',icon:IconLayersIntersect}].map(item=><Tabs.Tab key={item.id} value={item.id} leftSection={<item.icon size={19}/>}>{item.name}</Tabs.Tab>)}</Tabs.List>
    <Tabs.Panel value={['owned','favorites'].includes(view)?'books':view}>

   <main id="main-content" tabIndex={-1}>

    {(storageError||personalStorageError)&&<Alert color="orange" mb="lg">Bu tarayıcı kişisel kayıtlarını kalıcı olarak saklayamıyor. Notlar bölümünden yedeğini indirebilirsin.</Alert>}
    {['books','owned','favorites'].includes(view)&&<>
     <Paper className="search-panel" withBorder radius="lg" p={{base:12,sm:'lg'}}>
      <TextInput className="catalog-search" label={view==='owned'?'Kitaplığımda ara':view==='favorites'?'Favorilerimde ara':'Katalogda ara'} placeholder="Kitap, yazar, çevirmen…" leftSection={<IconSearch size={21}/>} rightSection={filters.query?<ActionIcon variant="subtle" aria-label="Aramayı temizle" onClick={()=>changeFilters({...filters,query:''})}><IconX size={20}/></ActionIcon>:null} value={filters.query} onChange={e=>changeFilters({...filters,query:e.currentTarget.value})}/>
      <div className="search-tools"><Button variant="light" leftSection={<IconFilter size={20}/>} onClick={()=>{setTransfer(null);setDraft(filters);setOpened(true)}}>Filtreler{activeCount?` · ${activeCount}`:''}</Button><Select aria-label="Kitapları sırala" value={sort} onChange={v=>setRoute(r=>({...r,sort:v||'reading',page:1}))} data={[{value:'reading',label:'Okuma önceliği'},{value:'shared',label:'En çok kesişen'},{value:'title',label:'Kitap adı · A–Z'},{value:'author',label:'Yazar · A–Z'},{value:'newest',label:'Yayın yılı · yeni'},{value:'saved',label:'Favoriler önce'}]} allowDeselect={false}/></div>
      <ActiveFilters filters={filters} onChange={changeFilters}/>
     </Paper>
     {view==='books'&&!filterCount(filters)&&<SpotlightCard className="reading-route" spotlightColor="rgba(225,238,173,.13)"><div><Text fw={500}>Nereden başlamalı?</Text><Text>12 kitaplık çekirdek, düşünceden uygulamaya.</Text></div><Button variant="white" color="coffee" rightSection={<IconArrowRight size={19}/>} onClick={()=>goCollection('core')}>Seçkiye git</Button></SpotlightCard>}
     {sort==='reading'&&<ReadingPrioritySummary ranking={ranking} books={books}/>}
     <div className="results-heading" ref={resultsRef}><div><Title order={view==='owned'?2:1}>{filters.categories.length===1&&filters.categories[0]==='children'?'Kızım için':filterCount(filters)?'Seçtiğin kitaplar':view==='owned'?'Kitaplığımdakiler':view==='favorites'?'Favorilerim':'Tüm kitaplar'}</Title><Text c="dimmed" role="status" aria-live="polite">{filtered.length} eser{filtered.length?` · ${((currentPage-1)*pageSize)+1}–${Math.min(currentPage*pageSize,filtered.length)} gösteriliyor`:''}</Text></div><Group gap={4}>{filterCount(filters)>0&&<Button variant="subtle" onClick={()=>changeFilters(emptyFilters())}>Temizle</Button>}<Tooltip label={copied?'Bağlantı kopyalandı':'Bağlantıyı kopyala'}><ActionIcon variant="subtle" aria-label={copied?'Bağlantı kopyalandı':'Bağlantıyı kopyala'} onClick={copyLink}>{copied?<IconCheck size={22}/>:<IconLink size={22}/>}</ActionIcon></Tooltip></Group></div>
     {filtered.length?<><div className="books-grid">{displayed.map(b=><BookCard key={b.id} book={b} ranking={ranking.byId[b.id]} states={states} onToggle={onToggle} onOpen={onOpen} queue={personal.queue} onAdd={onAdd} onQueue={onQueue}/>)}</div><CatalogPagination page={currentPage} total={pages} count={filtered.length} pageSize={pageSize} onChange={changePage} onPageSize={size=>navigate({...route,page:1,pageSize:size,book:null})} hrefForPage={p=>window.location.pathname+'?'+encodeRoute({...route,page:p,book:null},catalog)}/></>:<Paper withBorder className="empty-state" p="xl" radius="lg"><IconSearch size={36}/><Title order={2}>{view==='owned'&&!ownedCount?'Kitaplığın ilk kitabını bekliyor.':view==='favorites'&&!shelfBooks.length?'Henüz favori kitap yok.':'Bu seçimde kitap yok.'}</Title><Text c="dimmed" mt="sm">{view==='owned'&&!ownedCount?'Katalogda “Satın aldım” dediğin kitap burada da görünür.':view==='favorites'&&!shelfBooks.length?'Kartlardaki yıldızla favorilerini buraya ekleyebilirsin.':'Bir filtreyi kaldırabilir veya aramanı değiştirebilirsin.'}</Text><Button mt="lg" variant="light" onClick={()=>(view==='owned'&&!ownedCount)||(view==='favorites'&&!shelfBooks.length)?onBrowse():changeFilters(emptyFilters())}>{(view==='owned'&&!ownedCount)||(view==='favorites'&&!shelfBooks.length)?'Kataloğa git':'Filtreleri temizle'}</Button></Paper>}
    </>}
    {view==='queue'&&<ReadingQueue queue={personal.queue} books={byId} reading={personal.reading} states={states} onMove={(id,direction)=>setPersonal(prev=>({...prev,queue:moveInQueue(prev.queue,id,direction)}))} onRemove={id=>setPersonal(prev=>({...prev,queue:prev.queue.filter(value=>value!==id)}))} onOpen={onOpen} onBrowse={onBrowse} BookCover={BookCover}/>}
    {view==='collections'&&<Collections onCollection={goCollection} onGroup={goCollection} states={states}/>}
    {view==='notes'&&<Notes states={states} setStates={setStates} personal={personal} setPersonal={setPersonal} sync={githubSync}/>}
   </main>
    </Tabs.Panel>
   </Tabs>
   <footer className="site-footer"><Text>Kitap Atlası · {catalog.updated}</Text><nav className="footer-links" aria-label="Genel bilgiler"><Button variant="subtle" onClick={()=>setGuideOpened(true)}>Çeviri rehberi</Button><Button variant="subtle" onClick={()=>{setRoute(r=>({...r,view:'notes'}));window.scrollTo({top:0,behavior:'instant'})}}>Notlar</Button></nav></footer>
  </Container>
  <Modal opened={guideOpened} onClose={()=>setGuideOpened(false)} title="Çeviri seçme rehberi" size="lg" centered className="global-guide-modal"><TranslationCriteria/></Modal>
  <FilterSheet opened={opened} onClose={()=>setOpened(false)} value={draft} onChange={setDraft} onReset={()=>setDraft({...emptyFilters(),query:filters.query})} onApply={()=>{changeFilters(draft);setOpened(false)}} count={draftCount} catalog={catalog} authors={authorOptions}/>
  {!book&&transferNotice}
  <BookDetail feedback={transferNotice} ranking={ranking.byId[book]} onOpen={onOpen} onBack={previousBook} hasBack={bookTrail.length>0} book={byId[book]} onClose={closeBook} states={states} onToggle={onToggle} onCollection={goCollection} onCategory={goCategory} personal={personal} onReading={onReading} onAdd={onAdd} onQueue={onQueue} storageError={storageError||personalStorageError}/>
 </>;
}
export default function App(){return <MantineProvider theme={theme} defaultColorScheme="auto" colorSchemeManager={localStorageColorSchemeManager({key:'kitapatlasi:color-scheme'})}><AtlasApp/>{AccessibilityAudit&&<React.Suspense fallback={null}><AccessibilityAudit/></React.Suspense>}</MantineProvider>}
