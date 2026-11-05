import React,{useEffect,useMemo,useState} from 'react';

const STORE='acl-foundboard-v3';
// Fictional campus locations for this standalone teaching demo.
// A found report can exist before the item has been received by staff.
const seed=[
 {id:'f1',title:'Black backpack',category:'accessories',status:'lost',location:'Library - second floor',description:'Black backpack with a small red keychain. Left near the study desks.',owner:'you',created:'Oct 23',emoji:'🎒'},
 {id:'f2',title:'Dark backpack',category:'accessories',status:'found',location:'Library - main stairwell',description:'Found a dark backpack with a small red keychain near the library stairs.',owner:'other',created:'Oct 24',emoji:'🎒',collectionPoint:'Campus Security Desk',handoverStatus:'received'},
 {id:'f3',title:'Student ID card',category:'documents',status:'found',location:'Near Gate 3',description:'A student card was turned in. No personal details are published.',owner:'other',created:'Oct 24',emoji:'🪪',collectionPoint:'Student Services Office',handoverStatus:'received'},
 {id:'f4',title:'Wireless earbuds',category:'electronics',status:'lost',location:'Main cafeteria',description:'White earbuds in a distinctive blue case. Lost on Monday.',owner:'other',created:'Oct 24',emoji:'🎧'},
 {id:'f5',title:'Earbuds in blue case',category:'electronics',status:'found',location:'Cafeteria entrance',description:'White earbuds in a blue charging case found near the coffee counter.',owner:'other',created:'Oct 25',emoji:'🎧',collectionPoint:'',handoverStatus:'reported'},
 {id:'f6',title:'Blue sports bottle',category:'other',status:'lost',location:'Sports Hall - lockers',description:'Tall blue metal water bottle, possibly left after practice.',owner:'other',created:'Oct 25',emoji:'🥤'},
 {id:'f7',title:'Metal water bottle',category:'other',status:'found',location:'Sports Hall - benches',description:'Blue reusable metal bottle found after a basketball session.',owner:'other',created:'Oct 25',emoji:'🥤',collectionPoint:'Campus Security Desk',handoverStatus:'received'},
 {id:'f8',title:'Engineering lab coat',category:'clothing',status:'claimed',location:'Building C',description:'Owner verified the item and collected it from the reception desk.',owner:'you',created:'Oct 22',emoji:'🥼',collectionPoint:'Library Reception',handoverStatus:'released'},
 {id:'f9',title:'Small notebook',category:'other',status:'lost',location:'C7 lecture room',description:'Brown cover with handwritten engineering notes.',owner:'other',created:'Oct 25',emoji:'📒'},
 {id:'f10',title:'Scientific calculator',category:'electronics',status:'lost',location:'B2 lecture hall',description:'Black scientific calculator with a protective cover.',owner:'other',created:'Oct 26',emoji:'🧮'},
 {id:'f11',title:'Calculator',category:'electronics',status:'found',location:'B2 study area',description:'Scientific calculator with a black cover, found on a desk.',owner:'you',created:'Oct 26',emoji:'🧮',collectionPoint:'Library Reception',handoverStatus:'received'},
 {id:'f12',title:'Canvas tote bag',category:'accessories',status:'lost',location:'Main campus bus stop',description:'Beige tote with green writing on one side.',owner:'other',created:'Oct 26',emoji:'👜'},
 {id:'f13',title:'USB flash drive',category:'electronics',status:'found',location:'Building A computer lab',description:'A small black flash drive was found beside a workstation.',owner:'other',created:'Oct 27',emoji:'💾',collectionPoint:'',handoverStatus:'reported'},
];
const categories=['all','electronics','clothing','documents','accessories','other'];
const statuses=['lost','found','claimed'];
const clean={title:'',category:'',status:'',location:'',description:''};
function getSaved(){try{const s=JSON.parse(localStorage.getItem(STORE));return Array.isArray(s)?s:seed;}catch{return seed;}}
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
// Same rules as before, but every problem is returned against its field so it can be shown where it happened.
function validate(f,arr,id){
 const e={};
 if(!statuses.includes(f.status))e.status='Choose lost, found or claimed.';
 if(!f.title.trim()||f.title.trim().length<2)e.title='Title must be at least 2 characters.';
 else if(arr.some(r=>r.id!==id&&r.title.toLowerCase()===f.title.trim().toLowerCase()&&(r.location||'').toLowerCase()===(f.location||'').trim().toLowerCase())){e.title='An item with the same title has already been reported at this location.';e.duplicate=true;}
 if(!categories.slice(1).includes(f.category))e.category='Choose a category.';
 return e;
}
const collectionPoints='Campus Security Desk, Student Services Office or Library Reception';
// Field wording follows the status, because a finder and an owner are answering different questions.
const formCopy={
 lost:{location:'Where did you last have it?',locationHint:'e.g., Library - second floor',details:'Describe your item',detailsHint:'Colour, brand or anything that makes it recognisable'},
 found:{location:'Where did you find it?',locationHint:'e.g., Near Gate 3',details:'Describe what you found',detailsHint:'What it looks like. Leave out names, ID numbers and other personal details.'},
 default:{location:'Location',locationHint:'e.g., Building C',details:'More details',detailsHint:'Describe the item'},
};
// Turns stored handover data into what the student should do next. A report alone never counts as held by staff.
function handoverInfo(item){
 if(item.status==='lost')return null;
 if(item.handoverStatus==='released')return {tone:'done',label:'✓ Collected by owner',place:item.collectionPoint,next:'Ownership was checked at handover.'};
 if(item.status==='claimed')return {tone:'claimed',label:'✓ Claimed',next:'This item is no longer waiting for its owner.'};
 if(item.handoverStatus==='received'&&item.collectionPoint)return {tone:'ready',label:'✓ Ready to collect',place:item.collectionPoint,next:"Bring proof that it's yours. Staff check ownership at handover."};
 return {tone:'pending',label:'… Not at a collection point yet',next:"A student reported this, but staff haven't received it. Check back before going to a collection point."};
}
export default function App(){
 const [items,setItems]=useState(getSaved);
 const [page,setPage]=useState('board');
 const [q,setQ]=useState('');
 const [cat,setCat]=useState('all');
 const [filterStatus,setFilterStatus]=useState('all');
 const [current,setCurrent]=useState(null);
 const [form,setForm]=useState(clean);
 const [errors,setErrors]=useState({});
 const [message,setMessage]=useState('');
 const [openMenu,setOpenMenu]=useState(null);
 useEffect(()=>localStorage.setItem(STORE,JSON.stringify(items)),[items]);
 // Each page starts at the top, so confirmation messages and form headings are always seen.
 useEffect(()=>{window.scrollTo(0,0);},[page]);
 // Search by word: every typed word must appear somewhere in the report, in any order.
 const words=useMemo(()=>q.toLowerCase().split(/\s+/).filter(Boolean),[q]);
 const filtered=useMemo(()=>items.filter(x=>(cat==='all'||x.category===cat)&&(filterStatus==='all'||x.status===filterStatus)&&words.every(w=>`${x.title} ${x.location} ${x.description}`.toLowerCase().includes(w))),[items,words,cat,filterStatus]);
 const clearFilters=()=>{setQ('');setCat('all');setFilterStatus('all');};
 const showBoard=status=>{setFilterStatus(status);setPage('board');};
 const activeFilters=[
  q.trim()&&{key:'q',label:`Search: "${q.trim()}"`,clear:()=>setQ('')},
  cat!=='all'&&{key:'cat',label:`Category: ${cap(cat)}`,clear:()=>setCat('all')},
  filterStatus!=='all'&&{key:'status',label:`Status: ${cap(filterStatus)}`,clear:()=>setFilterStatus('all')},
 ].filter(Boolean);
 const columns=[{key:'lost',title:'LOST',sub:'Searching for these things',icon:'↗'},{key:'found',title:'FOUND',sub:'Looking for the owners',icon:'⌁'},{key:'claimed',title:'CLAIMED',sub:'Back where they belong',icon:'✓'}].filter(col=>filterStatus==='all'||col.key===filterStatus);
 function create(){setCurrent(null);setForm({...clean});setErrors({});setPage('form');}
 function edit(row){if(row.owner!=='you')return;setCurrent(row.id);setForm({title:row.title,category:row.category,status:row.status,location:row.location,description:row.description});setOpenMenu(null);setErrors({});setPage('form');}
 function setField(key,value){setForm(s=>({...s,[key]:value}));setErrors(x=>{const n={...x};if(key==='title'||(key==='location'&&n.duplicate)){delete n.title;delete n.duplicate;}delete n[key];return n;});}
 function viewExisting(){setQ(form.title.trim());setCat('all');setFilterStatus('all');setErrors({});setPage('board');}
 function submit(e){e.preventDefault();const v=validate(form,items,current);if(Object.keys(v).length){setErrors(v);document.getElementById(`field-${['status','title','category'].find(k=>v[k])}`)?.focus();return;}const d={...form,title:form.title.trim(),location:form.location.trim(),description:form.description.trim(),owner:'you',created:'Today',emoji:current?items.find(x=>x.id===current)?.emoji:'📌',...(current?{}:{collectionPoint:'',handoverStatus:'reported'})};
 if(current){setItems(items.map(x=>x.id===current?{...x,...d}:x));setMessage('Report updated.');}else{setItems([{id:`f-${Date.now()}`,...d},...items]);setMessage(form.status==='found'?`Your report has been posted. Next step: hand the item in at ${collectionPoints}. It shows as ready to collect once staff receive it.`:form.status==='lost'?'Your report has been posted. Keep checking the Found column for a match.':'Your report has been posted.');}setPage('board');setCurrent(null);}
 function reset(){setItems(seed);setPage('board');setQ('');setCat('all');setFilterStatus('all');setMessage('Example reports restored.');}
 const copy=formCopy[form.status]||formCopy.default;
 const fieldError=key=>errors[key]&&<span className="field-error" id={`error-${key}`} role="alert">{errors[key]}</span>;
 const fieldProps=key=>({id:`field-${key}`,'aria-invalid':errors[key]?true:undefined,'aria-describedby':errors[key]?`error-${key}`:undefined});
 return <div className="notice-app"><header className="header"><div className="headline"><span className="sun">✺</span><button onClick={()=>showBoard('all')} className="wordmark">FOUND<span>on campus</span></button><p>Community noticeboard</p></div><nav className="header-links" aria-label="Noticeboard views">{[['all','Noticeboard'],['lost','Missing items'],['found','Recently found']].map(([status,label])=><button key={status} aria-current={page==='board'&&filterStatus===status?'page':undefined} onClick={()=>showBoard(status)}>{label}</button>)}</nav><button className="report-button" onClick={create}>+ Post a report</button></header>
  <div className="ruleline"><span>SEARCH • DISCOVER • REUNITE</span><span>Helping lost things find their way back.</span></div>
  {page==='board'?<main className="workspace"><aside className="filters"><p className="kicker">YOUR NOTICEBOARD</p><h1>Lost something?<br/><em>You're in the right place.</em></h1><p className="intro">Browse what the campus community has shared or post what you've lost or found.</p><div className="filterbox"><h3>Browse reports</h3><label>Search items<input value={q} onChange={e=>setQ(e.target.value)} placeholder="What are you looking for?"/></label><label>Item category<select value={cat} onChange={e=>setCat(e.target.value)}><option value="all">All categories</option>{categories.slice(1).map(c=><option key={c} value={c}>{cap(c)}</option>)}</select></label><label>Report status<select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option value="all">All statuses</option>{statuses.map(s=><option key={s} value={s}>{cap(s)}</option>)}</select></label><div className="filterbuttons"><button onClick={clearFilters} disabled={!activeFilters.length}>Clear filters</button></div></div><div className="side-message"><span>📍</span><strong>Lost or found something?</strong><p>Every report gets us a little closer.</p><button onClick={create}>Share your report →</button></div><button className="reset" onClick={reset}>Reset demo data</button></aside>
   <section className="board"><div className="board-top"><div><p className="kicker">CAMPUS COMMUNITY</p><h2>Latest notices <span aria-live="polite">({filtered.length})</span></h2></div><span className="time-note">Updated today</span></div>{message&&<div className="message" role="status">{message}<button onClick={()=>setMessage('')}>✕</button></div>}
    {activeFilters.length>0&&<div className="active-filters"><span>Showing {filtered.length} of {items.length} reports</span>{activeFilters.map(f=><button className="chip" key={f.key} onClick={f.clear} aria-label={`Remove filter ${f.label}`}>{f.label} <b aria-hidden="true">✕</b></button>)}<button className="chip-clear" onClick={clearFilters}>Clear all</button></div>}
    {filtered.length===0?<div className="no-results"><h3>No reports match your search</h3><p>Try fewer or different words, or clear the filters. If nobody has reported it yet, post a report so others can look out for it.</p><div><button className="secondary-button" onClick={clearFilters}>Clear filters</button><button className="report-button" onClick={create}>+ Post a report</button></div></div>:<div className={'board-grid'+(columns.length===1?' single':'')}>{columns.map(col=><div className="board-column" key={col.key}><div className="column-head"><span className={'col-icon '+col.key}>{col.icon}</span><div><strong>{col.title}</strong><small>{col.sub}</small></div><span className="col-count">{filtered.filter(r=>r.status===col.key).length}</span></div><div className="sticky-list">{filtered.filter(r=>r.status===col.key).map((item,i)=>{const handover=handoverInfo(item);return <article className="sticky" key={item.id}><div className="sticky-top"><span>{item.category}</span><div className="menu-holder"><button className="menu" onClick={()=>setOpenMenu(openMenu===item.id?null:item.id)} aria-label={`Actions for ${item.title}`}>···</button>{openMenu===item.id&&<div className="menu-popup">{item.owner==='you'?<button onClick={()=>edit(item)}>Edit your report</button>:<span>Reported by another student</span>}</div>}</div></div><div className="sticky-emoji">{item.emoji}</div><h3>{item.title}</h3><p>{item.description||'No additional description.'}</p>{handover&&<div className={'handover '+handover.tone}><strong>{handover.label}</strong>{handover.place&&<span className="handover-place">{handover.place}</span>}<span>{handover.next}</span></div>}<div className="sticky-bottom"><span>⌖ {item.location||'Location not provided'}</span><small>{item.created}</small></div></article>;})}{filtered.every(x=>x.status!==col.key)&&<div className="empty-column">{activeFilters.length?`No ${col.key} reports match`:'Nothing here yet'}</div>}</div></div>)}</div>}
   </section></main>:<main className="report-page"><div className="crumbs"><button onClick={()=>setPage('board')}>← Noticeboard</button><span>/</span><span>{current?'Edit report':'Report an item'}</span></div><div className="report-layout"><div className="report-intro"><span className="seal">✺</span><p className="kicker">HELP THE COMMUNITY</p><h1>{current?'Update your report':'Tell us what happened.'}</h1><p>Small details can help someone recognize their belongings.</p><div className="paper-note">Your report will appear on the public campus noticeboard with the details you provide.</div></div><section className="form-paper"><header><p>{current?'EDIT NOTICE':'NEW NOTICE'} / FORM 01</p><h2>{current?'Edit report':'Report an item'}</h2></header><form onSubmit={submit} noValidate><p className="required-note"><b>*</b> Required</p>
    <label><span>Status <b>*</b></span><select {...fieldProps('status')} value={form.status} onChange={e=>setField('status',e.target.value)}><option value="">Did you lose or find this item?</option>{statuses.map(s=><option key={s} value={s}>{cap(s)}</option>)}</select>{fieldError('status')}</label>
    <label><span>Item title <b>*</b></span><input {...fieldProps('title')} value={form.title} onChange={e=>setField('title',e.target.value)} placeholder="e.g., Black backpack"/>{fieldError('title')}{errors.duplicate&&<button type="button" className="inline-action" onClick={viewExisting}>View the existing report</button>}</label>
    <label><span>Category <b>*</b></span><select {...fieldProps('category')} value={form.category} onChange={e=>setField('category',e.target.value)}><option value="">Select item category</option>{categories.slice(1).map(s=><option key={s} value={s}>{cap(s)}</option>)}</select>{fieldError('category')}</label>
    <label><span>{copy.location} <small>(optional)</small></span><input id="field-location" aria-invalid={errors.duplicate?true:undefined} value={form.location} onChange={e=>setField('location',e.target.value)} placeholder={copy.locationHint}/></label>
    <label><span>{copy.details} <small>(optional)</small></span><textarea id="field-description" rows="6" value={form.description} onChange={e=>setField('description',e.target.value)} placeholder={copy.detailsHint}/></label>
    {form.status==='found'&&!current&&<div className="handover pending"><strong>After you publish</strong><span>Hand the item in at {collectionPoints}. Your report doesn't mean staff have it until they receive it.</span></div>}
    <div className="form-actions"><button type="button" onClick={()=>setPage('board')}>Go back</button><button className="report-button" type="submit">{current?'Save report':'Publish notice'}</button></div></form></section></div></main>}
  <footer className="pagefooter"><span>FOUND / Campus noticeboard</span><span>Community project • Demo only</span></footer>
 </div>;
}
