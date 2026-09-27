import React from 'react';
import { Badge, Card, Text, Title } from '@mantine/core';
import { normalize } from '../library';

const elements = children => React.Children.toArray(children).filter(React.isValidElement);
const textOf = children => React.Children.toArray(children).map(child=>React.isValidElement(child)?textOf(child.props.children):String(child)).join('');

/** Render every Markdown table cell as a labelled field, preserving inline markup. */
export default function NoteCards({children}) {
 const parts=elements(children);
 const head=parts.find(part=>part.type==='thead');
 const body=parts.find(part=>part.type==='tbody');
 const headings=elements(elements(head?.props.children)[0]?.props.children).map(cell=>cell.props.children);
 const labels=headings.map(textOf);
 const idIndex=labels.findIndex(label=>/^(#|no\.?|sıra|kod)$/i.test(label.trim()));
 const preferred=labels.findIndex(label=>/turkce ad|^kitap$|^eser$|^baslik$|kitap adi/.test(normalize(label)));
 const original=labels.findIndex(label=>/orijinal ad|ozgun ad/.test(normalize(label)));
 const rows=elements(body?.props.children);
 return <div className="note-cards">{rows.map((row,rowIndex)=>{
  const cells=elements(row.props.children).map(cell=>cell.props.children);
  let primary=preferred>=0?preferred:idIndex===0?1:0;
  if(original>=0&&/baski yok|dogrulanamadi|dogrulanmadi|^—$/.test(normalize(textOf(cells[primary]))))primary=original;
  const title=cells[primary];
  return <Card component="article" withBorder radius="lg" padding="lg" className="note-record" key={rowIndex}>
   <div className="note-record-heading">{idIndex>=0&&<Badge variant="light" color="coffee">{cells[idIndex]}</Badge>}<div><Text className="note-field-label">{headings[primary]}</Text><Title order={4}>{title}</Title></div></div>
   <dl className="note-fields">{cells.map((content,index)=>{
    if(index===primary||index===idIndex)return null;
    const wide=/not|aciklama|gerekce|neden|uyari|degerlendirme/.test(normalize(labels[index]||''));
    return <div className={wide?'note-field note-field-wide':'note-field'} key={index}><dt>{headings[index]||'Bilgi'}</dt><dd>{content}</dd></div>;
   })}</dl>
  </Card>;
 })}</div>;
}
