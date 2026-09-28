import React,{useState} from 'react';
import {Button,Group,Modal,Stack,Text} from '@mantine/core';
import {IconDownload} from '@tabler/icons-react';
import {download} from '../download';
import {readSyncBackup} from '../state/useGitHubStateSync';

/** Shown once per device when its records differ from the shared file. */
export default function SyncMergeDialog({sync}){
 const [busy,setBusy]=useState(false);
 const prompt=sync.mergePrompt;
 if(!prompt)return null;
 const choose=async choice=>{setBusy(true);try{await sync.resolveMerge(choice)}finally{setBusy(false)}};
 const backup=readSyncBackup();
 const parts=[prompt.conflicts.length?`${prompt.conflicts.length} kitabın kaydı`:'',prompt.queueConflict?'okuma sıran':''].filter(Boolean).join(' ve ');
 return <Modal opened onClose={()=>undefined} withCloseButton={false} closeOnClickOutside={false} closeOnEscape={false} centered title="Bu cihazdaki kayıtlar farklı">
  <Stack gap="md">
   <Text>Bu cihazda {parts}, GitHub’daki ortak kayıttan farklı. Hangisinin kalacağını seç; seçim yalnız bu farklı kayıtları etkiler, yalnız bu cihazda olan kayıtlar zaten ortak kayda eklendi.</Text>
   {backup&&<Text c="dimmed">Seçimden önce bu cihazdaki kayıtların yedeği alındı.</Text>}
   <Group>
    <Button loading={busy} onClick={()=>void choose('device')}>Bu cihazdakini kullan</Button>
    <Button loading={busy} variant="default" onClick={()=>void choose('shared')}>GitHub’dakini kullan</Button>
    {backup&&<Button variant="subtle" leftSection={<IconDownload size={18}/>} onClick={()=>download('kitaplik-esitleme-oncesi-yedek.json',backup)}>Yedeği indir</Button>}
   </Group>
  </Stack>
 </Modal>;
}
