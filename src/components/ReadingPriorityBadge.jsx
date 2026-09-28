import React from 'react';
import {Badge,Tooltip} from '@mantine/core';

export default function ReadingPriorityBadge({ranking}){
 if(!ranking)return null;
 return <Tooltip label={`${ranking.maturityLabel} · ${ranking.score}/100`} withArrow>
  <Badge className="reading-priority-badge" variant="filled" color="coffee" aria-label={`Okuma önceliği ${ranking.rank}. sıra, ${ranking.score} puan`}>
   <span>#{ranking.rank}</span><span>{ranking.score}</span>
  </Badge>
 </Tooltip>;
}
