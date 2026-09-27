import React from 'react';
import { Popover, UnstyledButton, Stack } from '@mantine/core';
import CategoryPill from './CategoryPill';
import { readingGuide } from '../recommendations';

export default function CardCategories({book, catalog, categoryMap, onNavigate}) {
 const primary=book.categories.includes('children')?'children':readingGuide(book,catalog).route.category;
 const first=book.categories.includes(primary)?primary:book.categories[0];
 const rest=book.categories.filter(id=>id!==first);
 return <div className="card-categories">
  <CategoryPill id={first} label={categoryMap[first].label} onNavigate={onNavigate}/>
  {rest.length>0&&<Popover position="bottom-start" width={260} withArrow shadow="md" trapFocus returnFocus><Popover.Target><UnstyledButton className="category-more" aria-label={`${rest.length} diğer kategoriyi göster`}><span>+{rest.length}</span></UnstyledButton></Popover.Target><Popover.Dropdown><Stack gap={4}>{rest.map(id=><CategoryPill key={id} id={id} label={categoryMap[id].label} onNavigate={onNavigate}/>)}</Stack></Popover.Dropdown></Popover>}
 </div>;
}
