const $=id=>document.getElementById(id), E=KilitEngine, C=KILIT_CONFIG;
document.querySelectorAll('[data-brand]').forEach(n=>n.textContent=C.brand);document.title=C.brand+' · Saldırı Hesaplayıcı';
let villages=[];try{const saved=JSON.parse(localStorage.getItem('kilit-plan-v1')||'[]');if(Array.isArray(saved))villages=saved.filter(v=>typeof v.name==='string'&&Number.isFinite(v.x)&&Number.isFinite(v.y)).slice(0,10)}catch{}
const picks={enemy:null,own:[]};
let armies=[];
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n}
function save(){try{localStorage.setItem('kilit-plan-v1',JSON.stringify(villages));$('villageMessage').textContent=''}catch{$('villageMessage').textContent='Tarayıcı kayda izin vermedi; köyler bu oturum boyunca kullanılabilir.'}renderVillages()}
function renderVillages(){const oldSource=$('source').value,oldTarget=$('target').value;$('villages').replaceChildren();$('count').textContent= villages.length+' / 10';for(const id of ['source','target']){$(id).replaceChildren(new Option(id==='source'?'Köy seç':'Elle koordinat gir',''));villages.forEach((v,i)=>$(id).add(new Option(`${v.name} — ${v.x}, ${v.y}`,String(i))))}if(villages[oldSource])$('source').value=oldSource;else if(villages.length)$('source').value='0';if(villages[oldTarget])$('target').value=oldTarget;villages.forEach((v,i)=>{const row=el('div',undefined,'village'),b=el('button','Sil','secondary');b.type='button';b.setAttribute('aria-label',v.name+' köyünü sil');b.onclick=()=>{villages.splice(i,1);$('target').value='';save();invalidate()};row.append(el('span',`${v.name} (${v.x}, ${v.y})`),b);$('villages').append(row)});if(!villages.length)$('villages').append(el('p','Henüz köy kaydedilmedi.','empty'))}
function num(id){const s=$(id).value.trim();const n=Number(s.replace(',','.'));if(!s||!Number.isFinite(n))throw Error('Eksik veya geçersiz sayı: '+($(id).closest('label')?.firstChild.textContent||id));return n}
$('villageForm').onsubmit=e=>{e.preventDefault();try{if(villages.length>=10)throw Error('En fazla 10 köy kaydedebilirsin.');const name=$('vname').value.trim();if(!name)throw Error('Köy adı gir.');villages.push({name,x:num('vx'),y:num('vy')});save();e.target.reset()}catch(err){$('villageMessage').textContent=err.message}};
function selectionText(members){return members.map(m=>m.race+' / '+m.name).join(', ')}
function picker(kind,race='Selçuklu'){
 const host=$(kind+'Picker');host.replaceChildren();
 let text='Asker seç';if(kind==='own'&&picks.own.length){const info=E.armyDuration(1,picks.own,false,C);text=selectionText(picks.own)+' · En yavaş: '+info.slowest.name}else if(kind==='enemy'&&picks.enemy)text=picks.enemy.race+' · '+picks.enemy.name;
 const status=el('p',text,'picked'),chips=el('div',undefined,'chips'),grid=el('div',undefined,'soldiers');
 Object.keys(E.units).forEach(r=>{const b=el('button',r,'chip'+(r===race?' active':''));b.type='button';b.setAttribute('aria-pressed',String(r===race));b.onclick=()=>picker(kind,r);chips.append(b)});
 Object.entries(E.units[race]).forEach(([name,speed])=>{const b=el('button',name);b.type='button';b.append(el('strong',String(speed)));const selected=kind==='own'?picks.own.some(m=>m.race===race&&m.name===name):picks.enemy?.race===race&&picks.enemy?.name===name;b.setAttribute('aria-pressed',String(selected));if(selected)b.style.borderColor='#e8b94e';b.onclick=()=>{if(kind==='own'){const i=picks.own.findIndex(m=>m.race===race&&m.name===name);if(i>=0)picks.own.splice(i,1);else picks.own.push({race,name})}else picks.enemy={race,name};picker(kind,race);invalidate()};grid.append(b)});
 host.append(status,chips,grid);if(kind==='own'){const clear=el('button','Asker seçimlerini temizle','secondary');clear.type='button';clear.onclick=()=>{picks.own=[];picker(kind,race);invalidate()};host.append(clear)}
}
function invalidate(){$('results').replaceChildren(el('p','Hesaplama bekleniyor…','empty'))}
for(const kind of ['enemy','own']){$(kind+'Mode').onchange=()=>{$(kind+'CellsWrap').hidden=$(kind+'Mode').value!=='cells';invalidate()};picker(kind)}
$('target').onchange=()=>{const v=villages[$('target').value];if(v){$('tx').value=v.x;$('ty').value=v.y}invalidate()};for(const id of ['tx','ty'])$(id).addEventListener('input',()=>{$('target').value='' });
$('calculator').addEventListener('input',invalidate);
function distance(kind){if($(kind==='enemy'?'enemyMode':'ownMode').value==='cells'){const n=num(kind==='enemy'?'enemyCells':'ownCells');if(n<0)throw Error('Mesafe sıfır veya pozitif olmalı.');return n}const ex=num('ex'),ey=num('ey');if(kind==='enemy'){const v=villages[$('source').value];if(!v)throw Error('Saldırı alan köyünü kaydet ve seç.');return Math.hypot(v.x-ex,v.y-ey)}return Math.hypot(num('tx')-ex,num('ty')-ey)}
function fmt(s){const n=Math.round(s);return [Math.floor(n/3600),Math.floor(n%3600/60),n%60].map(x=>String(x).padStart(2,'0')).join(':')}
function box(label,value,detail,full=false){const b=el('div',undefined,'box'+(full?' full':''));b.append(el('span',label),el('strong',value));if(detail)b.append(el('small',detail));$('results').append(b)}
function timeBox(label,ms,full=false){const d=new Date(Math.round(ms/1000)*1000);box(label,d.toLocaleTimeString('tr-TR',{hour12:false}),d.toLocaleDateString('tr-TR'),full)}

function renderArmies(){
 $('armies').replaceChildren();armies.forEach((a,i)=>{const row=el('div',undefined,'village'),b=el('button','Kaldır','secondary');b.type='button';b.onclick=()=>{armies.splice(i,1);renderArmies();invalidate()};row.append(el('span',a.label+' · '+selectionText(a.members)+' · En yavaş: '+E.armyDuration(1,a.members,false,C).slowest.name+' · '+a.distance.toLocaleString('tr-TR',{maximumFractionDigits:4})+' hücre'+(a.diamond?' · 💎':'')),b);$('armies').append(row)});
 if(!armies.length)$('armies').append(el('p','Liste boşsa seçili asker ve yukarıdaki mesafe ile tek ordu hesaplanır.','muted'));
}
$('addArmy').onclick=()=>{try{if(!picks.own.length)throw Error('Önce ordunun asker türlerini seç.');const d=distance('own');const source=$('target').selectedOptions[0]?.textContent||'';armies.push({members:picks.own.map(m=>({...m})),distance:d,diamond:$('ownDiamond').checked,label:$('armyName').value.trim()||('Ordu '+(armies.length+1)),origin:$('ownMode').value==='cells'?'Elle mesafe':($('target').value!==''?source:($('tx').value+', '+$('ty').value))});$('armyName').value='';$('armyMessage').textContent='Ordu eklendi. Yeni ordu için asker seçimlerini temizleyip yeni bileşimi seçebilir, köyü veya elmas durumunu değiştirebilirsin.';renderArmies();invalidate()}catch(err){$('armyMessage').textContent=err.message}};
$('calculator').onsubmit=e=>{e.preventDefault();$('error').textContent='';try{
 if(!picks.enemy)throw Error('Düşman askerini seç.');if(!armies.length&&!picks.own.length)throw Error('Kendi askerini seç veya ordu ekle.');
 const ed=distance('enemy'),es=E.duration(ed,picks.enemy.race,picks.enemy.name,$('enemyDiamond').checked,C),arrival=new Date($('arrival').value).getTime();
 const active=armies.length?armies:[{members:picks.own.map(m=>({...m})),distance:distance('own'),diamond:$('ownDiamond').checked,label:'Ordun',origin:''}];
 const plans=active.map(a=>{const {seconds,slowest}=E.armyDuration(a.distance,a.members,a.diamond,C);return {a,seconds,slowest,plan:E.plan(arrival,es,seconds)}});
 $('results').replaceChildren();box('Düşman gidiş',fmt(es));box('Düşman mesafesi',ed.toLocaleString('tr-TR',{maximumFractionDigits:4})+' hücre');timeBox('Düşman çıkış',plans[0].plan.departure);timeBox('Düşman varış',arrival);timeBox('Düşman dönüş',plans[0].plan.returnAt);
 plans.forEach(({a,seconds,slowest,plan})=>{box(a.label+' · '+selectionText(a.members),fmt(seconds),'En yavaş: '+slowest.race+' / '+slowest.name+' · '+a.distance.toLocaleString('tr-TR',{maximumFractionDigits:4})+' hücre'+(a.diamond?' · Elmaslı':'')+(a.origin?' · '+a.origin:''));timeBox(a.label+' gönderme saati',plan.sendAt,true)});
 }catch(err){invalidate();$('error').textContent=err.message}};
renderArmies();
function defaultDate(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());$('arrival').value=d.toISOString().slice(0,19)}
$('clear').onclick=()=>{$('calculator').reset();armies=[];renderArmies();$('armyMessage').textContent='';picks.enemy=null;picks.own=[];for(const k of ['enemy','own']){$(k+'CellsWrap').hidden=true;picker(k)}defaultDate();$('error').textContent='';invalidate()};$('enter').onclick=()=>{$('welcome').hidden=true;$('app').hidden=false};$('exit').onclick=()=>{$('app').hidden=true;$('welcome').hidden=false};renderVillages();defaultDate();
