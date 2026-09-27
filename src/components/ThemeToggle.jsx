import React from 'react';
import { ActionIcon,Tooltip,useComputedColorScheme,useMantineColorScheme } from '@mantine/core';
import { IconMoon,IconSun } from '@tabler/icons-react';
export default function ThemeToggle(){
 const scheme=useComputedColorScheme('light'),{setColorScheme}=useMantineColorScheme();
 const label=scheme==='dark'?'Açık temaya geç':'Koyu temaya geç';
 return <Tooltip label={label} withArrow><ActionIcon className="theme-toggle" variant="default" aria-label={label} onClick={()=>setColorScheme(scheme==='dark'?'light':'dark')}>{scheme==='dark'?<IconSun size={22}/>:<IconMoon size={22}/>}</ActionIcon></Tooltip>;
}
