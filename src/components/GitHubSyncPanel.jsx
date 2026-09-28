import React,{useState} from 'react';
import {Alert,Anchor,Badge,Button,Group,List,Paper,PasswordInput,Stack,Text,Title} from '@mantine/core';
import {IconArrowUpRight,IconBrandGithub,IconRefresh} from '@tabler/icons-react';

// Pre-filled creation form: one owner, Contents read and write, 90 days.
// GitHub cannot pre-select the repository, so the steps below name it.
const TOKEN_FORM='https://github.com/settings/personal-access-tokens/new?'+new URLSearchParams({name:'Kitaplık eşitleme',description:'Yalnız karacaismail/kitaps-state: Contents read and write',target_name:'karacaismail',expires_in:'90',contents:'write'});

export default function GitHubSyncPanel({sync}){
 const [token,setToken]=useState('');const [submitting,setSubmitting]=useState(false);
 const submit=async event=>{event.preventDefault();setSubmitting(true);try{await sync.saveToken(token);setToken('')}catch{}finally{setSubmitting(false)}};
 const badge=sync.status==='saving'?'Kaydediliyor':sync.status==='queued'?'Gönderim bekliyor':sync.status==='error'?'Dikkat':sync.hasToken?'Yazma bağlı':'Salt okunur';
 return <Paper withBorder p="lg" radius="lg" className="github-sync-panel"><Group justify="space-between" align="flex-start"><div><Title order={3}>Cihazlar arası eşitleme</Title><Text c="dimmed" mt={4}>Favoriler, kitaplık, okuma durumları, sıra, tarihler, ilerleme ve notlar herkese açık kitaps-state deposunda ve onun GitHub geçmişinde görünür. Değişiklikler ilk değişiklikten en az 120 saniye sonra tek güncellemeyle gönderilir.</Text></div><Badge variant="light" color={sync.status==='error'?'red':sync.status==='saving'||sync.status==='queued'?'yellow':sync.hasToken?'green':'gray'}>{badge}</Badge></Group>
  <Alert mt="md" role="status" icon={<IconBrandGithub size={20}/>} color={sync.status==='error'?'red':'brand'}>{sync.message}{sync.pending?` · ${sync.pending} bekleyen değişiklik`:''}</Alert>
  {sync.hasToken?<Group mt="md"><Button variant="light" leftSection={<IconRefresh size={18}/>} onClick={()=>void sync.flush().catch(()=>undefined)}>Şimdi gönder</Button><Button variant="default" onClick={()=>void sync.load()}>GitHub’dan yenile</Button><Button variant="subtle" color="red" onClick={sync.clearToken}>Anahtarı kaldır</Button></Group>:<form onSubmit={submit}><Stack mt="md" gap="sm">
   <List size="sm" spacing={4} className="token-steps">
    <List.Item><Anchor href={TOKEN_FORM} target="_blank" rel="noreferrer">Anahtarı hazır ayarlarla oluştur <IconArrowUpRight size={15}/></Anchor> (Contents yazma, 90 gün).</List.Item>
    <List.Item>Repository access bölümünde “Only select repositories” seçip yalnız kitaps-state deposunu işaretle; başka izin ekleme.</List.Item>
    <List.Item>Anahtar bu tarayıcıda saklanır. karacaismail.github.io altındaki diğer sayfalar aynı tarayıcı alanını paylaştığı için yalnız bu depoya yetkili, süreli bir anahtar kullan.</List.Item>
   </List>
   <PasswordInput label="İnce ayarlı (fine-grained) GitHub anahtarı" description="github_pat_ ile başlar. Klasik ve OAuth anahtarları kabul edilmez; anahtar kaydedilmeden önce GitHub ile doğrulanır." value={token} onChange={event=>setToken(event.currentTarget.value)} autoComplete="off" required/>
   <Button type="submit" loading={submitting} disabled={!token.trim()}>Bu cihazda bağla</Button>
  </Stack></form>}
 </Paper>;
}
