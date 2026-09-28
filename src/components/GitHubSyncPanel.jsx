import React,{useState} from 'react';
import {Alert,Badge,Button,Group,Paper,PasswordInput,Stack,Text,Title} from '@mantine/core';
import {IconBrandGithub,IconRefresh} from '@tabler/icons-react';

export default function GitHubSyncPanel({sync}){
 const [token,setToken]=useState('');const [submitting,setSubmitting]=useState(false);
 const submit=async event=>{event.preventDefault();setSubmitting(true);try{await sync.saveToken(token);setToken('')}catch{}finally{setSubmitting(false)}};
 const badge=sync.status==='saving'?'Kaydediliyor':sync.status==='queued'?'Gönderim bekliyor':sync.status==='error'?'Dikkat':sync.hasToken?'Yazma bağlı':'Salt okunur';
 return <Paper withBorder p="lg" radius="lg" className="github-sync-panel"><Group justify="space-between"><div><Title order={3}>Cihazlar arası eşitleme</Title><Text c="dimmed" mt={4}>Favoriler, kitaplık ve okuma durumları, en fazla 5 kitaplık sıran, tarihler, sayfa ilerlemesi ve kişisel notlar herkese açık kitaps-state deposu üzerinden eşitlenir. Bu bilgiler GitHub geçmişinde herkes tarafından görülebilir. Değişiklikler ilk değişiklikten sonra en az 120 saniye biriktirilip tek GitHub güncellemesiyle gönderilir.</Text></div><Badge variant="light" color={sync.status==='error'?'red':sync.status==='saving'||sync.status==='queued'?'yellow':sync.hasToken?'green':'gray'}>{badge}</Badge></Group>
  <Alert mt="md" role="status" icon={<IconBrandGithub size={20}/>} color={sync.status==='error'?'red':'coffee'}>{sync.message}{sync.pending?` · ${sync.pending} bekleyen değişiklik`:''}</Alert>
  {sync.hasToken?<Group mt="md"><Button variant="light" leftSection={<IconRefresh size={18}/>} onClick={()=>void sync.flush().catch(()=>undefined)}>Şimdi gönder</Button><Button variant="default" onClick={sync.load}>GitHub’dan yenile</Button><Button variant="subtle" color="red" onClick={sync.clearToken}>Anahtarı kaldır</Button></Group>:<form onSubmit={submit}><Stack mt="md" gap="sm"><PasswordInput label="Fine-grained GitHub anahtarı" description="Anahtar kaydedilmeden önce GitHub ile doğrulanır. Yalnızca karacaismail/kitaps-state için Contents: Read and write izni yeterlidir." value={token} onChange={event=>setToken(event.currentTarget.value)} required/><Button type="submit" loading={submitting} disabled={!token.trim()}>Bu cihazda bağla</Button></Stack></form>}
 </Paper>;
}
