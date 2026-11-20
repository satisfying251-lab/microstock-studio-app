import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
env.allowLocalModels = false;
env.useBrowserCache = true;

const $ = id => document.getElementById(id);
let files = [], results = [], captioner = null, stopRequested = false;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep = ms => new Promise(r=>setTimeout(r,ms));
// IndexedDB stores metadata only (not original image blobs) to keep phone storage manageable.
const META_DB='microstock-studio-v31', META_STORE='metadata', META_KEY='latest-results';
function openMetaDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(META_DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(META_STORE))req.result.createObjectStore(META_STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function saveResultsLocal(){try{const db=await openMetaDB();await new Promise((resolve,reject)=>{const tx=db.transaction(META_STORE,'readwrite');tx.objectStore(META_STORE).put(results.filter(Boolean),META_KEY);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()}catch(e){setStatus('Penyimpanan lokal gagal: '+e.message)}}
async function loadResultsLocal(){try{const db=await openMetaDB();const saved=await new Promise((resolve,reject)=>{const req=db.transaction(META_STORE).objectStore(META_STORE).get(META_KEY);req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)});db.close();if(saved.length){results=saved;renderResults();$('resultCount').textContent=saved.length+' aset tersimpan';$('csvBtn').disabled=false;$('jsonBtn').disabled=false;$('copyBtn').disabled=false;setStatus('Memulihkan '+saved.length+' metadata tersimpan di HP.')}}catch(e){setStatus('Database lokal belum tersedia: '+e.message)}}

function setStatus(t){$('progressText').textContent=t}
function setProgress(done,total){$('bar').style.width=(total?done/total*100:0)+'%'}
function setTab(tab){for(const id of ['batch','results','strategy','keyworddb','aistudio','settings'])$(id).classList.toggle('hidden',id!==tab);document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('secondary',b.dataset.tab!==tab)})}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
$('mode').onchange=()=>{let m=$('mode').value;$('localInfo').classList.toggle('hidden',m!=='local');$('cloudInfo').classList.toggle('hidden',m!=='cloud');$('hybridInfo').classList.toggle('hidden',m!=='hybrid');$('keyWrap').classList.toggle('hidden',m==='local')};$('mode').onchange();
$('files').onchange=e=>{
 const chosen=[...e.target.files];
 if(chosen.length>100){alert('Maksimum 100 gambar per batch. Pilih ulang maksimal 100.');e.target.value='';return}
 files=chosen.filter(f=>/^image\/(jpeg|png|webp)$/.test(f.type));
 renderThumbs();$('analyzeBtn').disabled=!files.length; e.target.value='';
};
function renderThumbs(){
 $('fileCount').textContent=files.length?`${files.length} gambar dipilih`:'Belum ada gambar dipilih';
 $('thumbs').innerHTML=files.map((f,i)=>`<div class="thumb"><img data-thumb="${i}"><div>${i+1}. ${esc(f.name)}</div></div>`).join('');$('thumbs').querySelectorAll('img[data-thumb]').forEach(img=>{const f=files[Number(img.dataset.thumb)],u=URL.createObjectURL(f);img.onload=()=>URL.revokeObjectURL(u);img.onerror=()=>URL.revokeObjectURL(u);img.src=u});
}
$('clearBtn').onclick=()=>{files=[];renderThumbs();$('analyzeBtn').disabled=true};
$('forgetKey').onclick=()=>{$('apiKey').value='';alert('API key dibersihkan dari sesi halaman.')};
async function getCaption(file){
 if(!captioner){setStatus('Mengunduh model AI lokal (pertama kali)...');captioner=await pipeline('image-to-text','Xenova/vit-gpt2-image-captioning',{progress_callback:p=>{if(p.status==='progress')setStatus(`Mengunduh model lokal: ${p.file||''} ${Math.round(p.progress||0)}%`)}})}
 const url=URL.createObjectURL(file);
 try{const out=await captioner(url,{max_new_tokens:48});return out?.[0]?.generated_text||''}finally{URL.revokeObjectURL(url)}
}
async function gemini(file,caption,lang){
 const key=$('apiKey').value.trim();if(!key)throw new Error('API key Gemini belum diisi.');
 const b64=await toBase64(file);
 const prompt=`Analyze this stock asset image. Return ONLY valid JSON with keys title, description, keywords (exactly 49 distinct relevant English words/short phrases), category, visual_notes. Write title and description in ${lang}. Keep keywords in English for stock marketplaces. Do not invent facts, brands, identities, locations, or actions not clearly visible. Avoid keyword stuffing. Caption from local model: ${caption||'none'}. Title max 150 characters. Description one factual sentence. Keywords must be exactly 49 unique relevant phrases, ordered by importance. The FIRST 10 keywords must be the strongest, most accurate buyer search terms. Title must describe the actual visible subject and context, never generic filler such as 'beautiful image'.`;
 const url='https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
 const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt},{inline_data:{mime_type:file.type,data:b64}}]}],generationConfig:{responseMimeType:'application/json',temperature:0.2}})});
 const data=await res.json();if(!res.ok)throw new Error(data?.error?.message||`Gemini HTTP ${res.status}`);
 const text=data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';
 return parseJson(text);
}
function toBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=reject;r.readAsDataURL(file)})}
function parseJson(t){const clean=t.replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();const a=clean.indexOf('{'),b=clean.lastIndexOf('}');if(a<0||b<0)throw new Error('Respons AI bukan JSON valid.');return JSON.parse(clean.slice(a,b+1))}
function makeFallback(file,caption){
 const title=(caption||file.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ')).replace(/\s+/g,' ').trim();
 const words=[...new Set((title+' stock photo visual content image concept background asset photography').toLowerCase().split(/[\s,.;:]+/).filter(w=>w.length>2))];
 const kws=words.slice(0,49);
 return {title:title?title[0].toUpperCase()+title.slice(1):'Stock Image',description:caption?caption+'.':'Image asset requiring manual description.',keywords:kws,category:'Uncategorized',visual_notes:'Local caption only. Local mode does not generate 49 reliable semantic keywords; use Gemini cloud or hybrid for full metadata.'};
}
function normalize(r,file,caption){
 let k=Array.isArray(r.keywords)?r.keywords:String(r.keywords||'').split(/[,;\n]/);
 k=[...new Set(k.map(x=>String(x).trim().toLowerCase()).filter(Boolean))].slice(0,49);
 return {filename:file.name,title:String(r.title||'').slice(0,150),description:String(r.description||''),keywords:k,category:String(r.category||'Uncategorized'),visual_notes:String(r.visual_notes||caption||''),caption,review:k.length!==49?'Periksa jumlah keyword; AI menghasilkan '+k.length+' keyword.':'Periksa relevansi dan akurasi.'};
}
$('analyzeBtn').onclick=async()=>{
 if(!files.length)return;
 stopRequested=false;$('stopBtn').disabled=false;$('analyzeBtn').disabled=true;
 const mode=$('mode').value,lang=$('language').value,concurrency=Number($('concurrency').value);
 results=[];let done=0;setProgress(0,files.length);
 const queue=files.map((f,i)=>({f,i}));
 async function worker(){
  while(queue.length&&!stopRequested){
   const {f,i}=queue.shift();setStatus(`Menganalisis ${i+1}/${files.length}: ${f.name}`);
   try{
    let cap='',meta=null;
    if(mode==='local'||mode==='hybrid')cap=await getCaption(f);
    if(mode==='cloud'||(mode==='hybrid'&&$('apiKey').value.trim()))meta=await gemini(f,cap,lang);
    if(!meta)meta=makeFallback(f,cap);
    if(lang==='Indonesian'&&mode==='local'){meta.visual_notes+=' (Caption model biasanya menghasilkan bahasa Inggris.)'}
    results[i]=normalize(meta,f,cap);
    await saveResultsLocal();
   }catch(err){
    if(mode==='hybrid'&&cap){results[i]=normalize(makeFallback(f,cap),f,cap);results[i].visual_notes+=' Cloud gagal: '+err.message;await saveResultsLocal()}
    else{results[i]=normalize({title:f.name,description:'Analisis gagal: '+err.message,keywords:[],category:'Needs review',visual_notes:'Gagal dianalisis. Coba lagi atau gunakan mode lain.'},f,'');await saveResultsLocal()}
   }
   done++;setProgress(done,files.length);setStatus(`${done}/${files.length} selesai`);
   renderResults();
   await sleep(120);
  }
 }
 try{await Promise.all(Array.from({length:concurrency},worker))}
 finally{$('stopBtn').disabled=true;$('analyzeBtn').disabled=false;$('csvBtn').disabled=!results.filter(Boolean).length;$('jsonBtn').disabled=!results.filter(Boolean).length;$('copyBtn').disabled=!results.filter(Boolean).length;$('resultCount').textContent=results.filter(Boolean).length+' aset';setTab('results')}
};
$('stopBtn').onclick=()=>{stopRequested=true;setStatus('Menghentikan setelah gambar yang sedang diproses selesai...')};
function renderResults(){
 $('resultsList').innerHTML=results.map((r,i)=>r?`<div class="asset" data-i="${i}"><div class="assethead"><div style="min-width:0;flex:1"><b>${i+1}. ${esc(r.filename)}</b><div class="status">${esc(r.review)}</div></div></div>
 <label>Title</label><textarea data-field="title">${esc(r.title)}</textarea><label>Description</label><textarea data-field="description">${esc(r.description)}</textarea>
 <label>Keywords (${r.keywords.length})</label><textarea data-field="keywords">${esc(r.keywords.join(', '))}</textarea><label>Category</label><input data-field="category" value="${esc(r.category)}"><p class="small">Caption: ${esc(r.caption||'Tidak tersedia')}</p></div>`:'').join('');
 $('resultsList').querySelectorAll('[data-i]').forEach(card=>card.querySelectorAll('[data-field]').forEach(el=>el.onchange=()=>{let r=results[Number(card.dataset.i)],f=el.dataset.field;if(f==='keywords')r.keywords=[...new Set(el.value.split(',').map(x=>x.trim()).filter(Boolean))].slice(0,49);else r[f]=el.value;saveResultsLocal();}));
}
function csvCell(v){return '"'+String(v??'').replace(/"/g,'""')+'"'}
$('csvBtn').onclick=()=>{
 const rows=[['Filename','Title','Description','Keywords','Category'],...results.filter(Boolean).map(r=>[r.filename,r.title,r.description,r.keywords.join(', '),r.category])];
 download('\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n'),'microstock_metadata.csv','text/csv;charset=utf-8');
};
$('jsonBtn').onclick=()=>download(JSON.stringify(results.filter(Boolean),null,2),'microstock_metadata.json','application/json');
$('copyBtn').onclick=async()=>{await navigator.clipboard.writeText(results.filter(Boolean).map(r=>r.keywords.join(', ')).join('\n'));alert('Keyword disalin.')};
function download(data,name,type){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}

// Strategy planner based on the five principles in the supplied video.
const strategyKeys=['researchTopic','competitionA','competitionB','marketplace','researchNotes','seasonName','seasonDate','weeklyTarget','weeklyDone'];
function saveStrategy(){
 const data={};strategyKeys.forEach(k=>{const el=$(k);if(el)data[k]=el.value});
 try{localStorage.setItem('msV2Strategy',JSON.stringify(data))}catch(e){}
}
function loadStrategy(){
 try{const d=JSON.parse(localStorage.getItem('msV2Strategy')||'{}');strategyKeys.forEach(k=>{if($(k)&&d[k]!==undefined)$(k).value=d[k]})}catch(e){}
 updateWeekly();
}
$('saveResearch')?.addEventListener('click',()=>{saveStrategy();$('researchSaved').textContent=' · Catatan riset tersimpan di perangkat ini.'});
$('calcSeason')?.addEventListener('click',()=>{
 const date=$('seasonDate').value,name=$('seasonName').value.trim();
 if(!date){$('seasonResult').textContent='Pilih tanggal hari-H terlebih dahulu.';return}
 const target=new Date(date+'T12:00:00');
 const minus3=new Date(target);minus3.setMonth(minus3.getMonth()-3);
 const minus2=new Date(target);minus2.setMonth(minus2.getMonth()-2);
 const fmt=d=>d.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
 $('seasonResult').textContent=`${name||'Event'}: rentang rekomendasi upload menurut video adalah ${fmt(minus3)} sampai ${fmt(minus2)}. Ini panduan perencanaan, bukan jaminan tren pencarian.`;
});
$('saveSeason')?.addEventListener('click',()=>{saveStrategy();alert('Jadwal musiman tersimpan di perangkat ini.')});
$('makeVariation')?.addEventListener('click',()=>{
 const concept=$('variationConcept').value.trim();
 const selected=[...document.querySelectorAll('.variation:checked')].map(x=>x.value);
 if(!concept||!selected.length){$('variationResult').textContent='Isi konsep dan pilih minimal satu jenis variasi.';return}
 $('variationResult').innerHTML='<b>Ide variasi untuk '+esc(concept)+':</b><ul>'+selected.map(v=>'<li>'+esc(v)+': buat komposisi visual yang benar-benar berbeda.</li>').join('')+'</ul><span class="small">Periksa agar setiap file memiliki perbedaan substantif dan bukan duplikat.</span>';
});
function updateWeekly(){
 const target=Math.max(1,Number($('weeklyTarget')?.value||10)),done=Math.max(0,Number($('weeklyDone')?.value||0));
 const pct=Math.min(100,done/target*100);
 if($('weeklyBar'))$('weeklyBar').style.width=pct+'%';
 if($('weeklyText'))$('weeklyText').textContent=`${done} dari target ${target} aset (${Math.round(pct)}%).${done>=target?' Target mingguan tercapai.':''}`;
}
$('saveWeekly')?.addEventListener('click',()=>{saveStrategy();updateWeekly();alert('Progres mingguan tersimpan di perangkat ini.')});
['weeklyTarget','weeklyDone'].forEach(id=>$(id)?.addEventListener('input',updateWeekly));
loadStrategy();


// Keyword Database Assistant: locally stored research notes, based on the supplied video.
const DBKEY='msV2KeywordResearch';
function readDB(){try{return JSON.parse(localStorage.getItem(DBKEY)||'[]')}catch(e){return []}}
function writeDB(rows){localStorage.setItem(DBKEY,JSON.stringify(rows));renderDB()}
function renderDB(){
 const rows=readDB(),filter=$('dbFilter')?.value||'Semua';
 const visible=filter==='Semua'?rows:rows.filter(x=>x.type===filter);
 if($('dbTotal'))$('dbTotal').textContent=rows.length+' data';
 if(!$('dbList'))return;
 if(!visible.length){$('dbList').textContent='Belum ada data untuk filter ini.';return}
 $('dbList').innerHTML=visible.slice().reverse().map((x,i)=>{
  const low=Number(x.count)<10000;
  return `<div class="asset"><b>${esc(x.keyword)}</b><div>${esc(x.type)} · ${esc(x.market)} · ${Number(x.count).toLocaleString('id-ID')} hasil</div><div class="${low?'good':'status'}">${low?'Di bawah 10.000 hasil — kandidat niche untuk ditinjau':'10.000 hasil atau lebih — periksa persaingan'}</div><div>${esc(x.notes||'')}</div></div>`;
 }).join('');
}
$('dbSave')?.addEventListener('click',()=>{
 const keyword=$('dbKeyword').value.trim(),count=$('dbCount').value;
 if(!keyword||count===''){alert('Isi keyword dan jumlah hasil pencarian.');return}
 const rows=readDB();rows.push({type:$('dbType').value,market:$('dbMarket').value,keyword,count:Number(count),notes:$('dbNotes').value.trim(),savedAt:new Date().toISOString()});
 writeDB(rows);$('dbKeyword').value='';$('dbCount').value='';$('dbNotes').value='';
});
$('dbFilter')?.addEventListener('change',renderDB);
$('dbClear')?.addEventListener('click',()=>{if(confirm('Hapus semua data riset di perangkat ini?'))writeDB([])});
$('dbExport')?.addEventListener('click',()=>{
 const rows=readDB();if(!rows.length){alert('Database masih kosong.');return}
 const csv=[['Type','Marketplace','Keyword','Search results','Notes','Saved at'],...rows.map(x=>[x.type,x.market,x.keyword,x.count,x.notes,x.savedAt])].map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='microstock-keyword-research.csv';a.click();URL.revokeObjectURL(url);
});
renderDB();
// Prompt builder for public no-personal-key image/video generators.
let builtPrompt='';
$('genBuild')?.addEventListener('click',()=>{
 const p=$('genPrompt').value.trim();if(!p){alert('Tulis ide atau subjek terlebih dahulu.');return}
 const style=$('genStyle').value,ratio=$('genRatio').value,type=$('genType').value;
 builtPrompt=`${p}. ${style}. ${ratio}. Commercial stock asset, clear subject, intentional composition, natural realistic details, no logos, no trademarks, no watermark, no text, no copyrighted characters.`;
 $('genOutput').textContent=builtPrompt;
});
$('genCopy')?.addEventListener('click',async()=>{
 if(!builtPrompt){alert('Tekan Susun prompt terlebih dahulu.');return}
 try{await navigator.clipboard.writeText(builtPrompt);alert('Prompt disalin. Tempel di generator yang dipilih.')}catch(e){$('genOutput').textContent=builtPrompt+' (Pilih dan salin teks ini secara manual.)'}
});


$('clearSaved')?.addEventListener('click',async()=>{if(!confirm('Hapus seluruh riwayat metadata tersimpan di browser HP?'))return;try{const db=await openMetaDB();await new Promise((resolve,reject)=>{const tx=db.transaction(META_STORE,'readwrite');tx.objectStore(META_STORE).delete(META_KEY);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();results=[];$('resultsList').innerHTML='';$('resultCount').textContent='0 aset';$('csvBtn').disabled=true;$('jsonBtn').disabled=true;$('copyBtn').disabled=true;alert('Riwayat metadata dihapus.')}catch(e){alert('Gagal menghapus: '+e.message)}});
loadResultsLocal();

if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
