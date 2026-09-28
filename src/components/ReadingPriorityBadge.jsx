import React from 'react';
import {Badge,Tooltip} from '@mantine/core';

export default function ReadingPriorityBadge({ranking}){
 if(!ranking)return null;
 return <Tooltip label={`${ranking.maturityLabel} · ${ranking.score}/100`} withArrow>
  <Badge component="span" className="reading-priority-badge" variant="filled" color="brand">
   <span className="visually-hidden">Okuma önceliği: {ranking.audience==='children'?'çocuk kitapları arasında ':''}{ranking.rank}. sıra, 100 üzerinden {ranking.score} puan. {ranking.maturityLabel}.</span>
   <span aria-hidden="true">#{ranking.rank}</span><span aria-hidden="true">{ranking.score}</span>
  </Badge>
 </Tooltip>;
}
