import React from 'react';
import { Pill,UnstyledButton } from '@mantine/core';
const tones={strategy:'sage',management:'blue',systems:'lavender',psychology:'peach',finance:'sand',literature:'rose',children:'rose',history:'sand',philosophy:'lavender',communication:'blue',productivity:'mint',marketing:'peach',enterprise:'sage',innovation:'lavender',technology:'blue',economy:'sand',politics:'rose',biography:'peach',science:'mint',climate:'sage',ethics:'rose'};
const shortLabels={strategy:'Strateji',management:'Yönetim',systems:'Sistemler',psychology:'Psikoloji',finance:'Finans',literature:'Edebiyat',children:'Çocuk',history:'Tarih',philosophy:'Felsefe',communication:'İletişim',productivity:'Üretkenlik',marketing:'Pazarlama',enterprise:'Girişim',innovation:'Yenilik',technology:'Teknoloji',economy:'Ekonomi',politics:'Siyaset',biography:'Biyografi',science:'Bilim',climate:'İklim',ethics:'Etik'};
export default function CategoryPill({id,label,onNavigate,compact=false}){
 return <UnstyledButton component="a" href={`?category=${encodeURIComponent(id)}`} className="category-link" aria-label={`${label} kitaplarını göster`} data-tone={tones[id]||'sage'} onClick={e=>{if(e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){e.preventDefault();onNavigate(id)}}}><Pill className="category-pill">{compact?(shortLabels[id]||label):label}</Pill></UnstyledButton>;
}
