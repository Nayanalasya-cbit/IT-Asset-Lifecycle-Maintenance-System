const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], KEY="assetflow-assets-v1";
const today=()=>new Date().toISOString().slice(0,10), plus=n=>{let d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}, date=v=>v?new Date(v+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—", money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(n)||0);
const seed=[
{assetId:"AST-1001",name:"Dell Latitude 5440",category:"Laptop",purchaseDate:plus(-250),warrantyEnd:plus(45),maintenanceDate:plus(5),employee:"Ananya Rao",value:68000,status:"Assigned",location:"IT Department",notes:"Primary work laptop"},
{assetId:"AST-1002",name:"HP ProDesk 400",category:"Desktop",purchaseDate:plus(-500),warrantyEnd:plus(-12),maintenanceDate:plus(-2),employee:"",value:42000,status:"Available",location:"Lab 1",notes:"Warranty expired; inspect before allocation"},
{assetId:"AST-1003",name:"LG UltraWide 29WQ",category:"Monitor",purchaseDate:plus(-150),warrantyEnd:plus(210),maintenanceDate:plus(70),employee:"Rohan Kumar",value:19000,status:"Assigned",location:"IT Department",notes:""},
{assetId:"AST-1004",name:"Lenovo ThinkPad E14",category:"Laptop",purchaseDate:plus(-370),warrantyEnd:plus(20),maintenanceDate:today(),employee:"",value:59000,status:"Under Maintenance",location:"Service Desk",notes:"Keyboard inspection"},
{assetId:"AST-1005",name:"Cisco 24-Port Switch",category:"Network Device",purchaseDate:plus(-700),warrantyEnd:plus(120),maintenanceDate:plus(14),employee:"Network Team",value:37000,status:"Assigned",location:"Server Room",notes:"Quarterly maintenance"}];
let assets=structuredClone(seed),editing=null,timer;
async function save(){
  try {
    const response=await fetch('/api/assets',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(assets)});
    const raw=await response.text();
    let result={};
    if(raw){try{result=JSON.parse(raw)}catch{result={message:raw}}}
    if(!response.ok) throw new Error(result.error||result.message||`HTTP ${response.status} ${response.statusText}`);
    return true;
  } catch(error) {
    toast('Backend save failed: '+error.message);
    return false;
  }
}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function expired(a){return a.warrantyEnd&&a.warrantyEnd<today()}function due(a){return a.maintenanceDate&&a.maintenanceDate<=today()&&a.status!=="Retired"}function attention(a){return expired(a)||due(a)||a.status==="Under Maintenance"}function pill(s){return `<span class="pill ${s.replaceAll(" ","-")}">${esc(s)}</span>`}
function toast(s){$("#toast").textContent=s;$("#toast").classList.add("show");clearTimeout(timer);timer=setTimeout(()=>$("#toast").classList.remove("show"),2400)}
function render(){dashboard();inventory();maintenance();reports()}
function dashboard(){
$("#total").textContent=assets.length;$("#assigned").textContent=assets.filter(a=>a.status==="Assigned").length;$("#available").textContent=assets.filter(a=>a.status==="Available").length;$("#attention").textContent=assets.filter(attention).length;
$("#recent").innerHTML=assets.slice(-5).reverse().map(a=>`<div class="row"><div><strong>${esc(a.name)}</strong><small>${esc(a.assetId)} · ${esc(a.category)} · ${esc(a.location||"No location")}</small></div>${pill(a.status)}</div>`).join("")||'<div class="empty">No assets yet.</div>';
$("#alerts").innerHTML=assets.filter(attention).slice(0,6).map(a=>`<div class="row"><div><strong>${esc(a.name)} · ${esc(a.assetId)}</strong><small>${due(a)?"Maintenance due "+date(a.maintenanceDate):""}${due(a)&&expired(a)?" · ":""}${expired(a)?"Warranty expired "+date(a.warrantyEnd):""}${a.status==="Under Maintenance"&&!due(a)?"Currently under maintenance":""}</small></div><span>⚠</span></div>`).join("")||'<div class="empty">No assets need attention.</div>';
const groups=[["Available","#168567"],["Assigned","#3568e8"],["Under Maintenance","#d87926"],["Retired","#98a1b1"]];$("#dashboard .hero").nextElementSibling.insertAdjacentHTML("afterend","");let el=$("#lifecycle");if(!el){$("#dashboard").insertAdjacentHTML("beforeend",'<article class="panel" id="lifecycle"><h3>Asset lifecycle</h3><div id="bars"></div></article>');el=$("#lifecycle")}$("#bars").innerHTML=groups.map(([s,c])=>{let n=assets.filter(a=>a.status===s).length,p=assets.length?n/assets.length*100:0;return `<div class="barrow"><span>${s}</span><div class="bar"><div class="fill" style="width:${p}%;background:${c}"></div></div><strong>${n}</strong></div>`}).join("");
}
function inventory(){let q=($("#search")?.value||"").toLowerCase(),cat=$("#cat")?.value||"",st=$("#statusfilter")?.value||"";let list=assets.filter(a=>(!cat||a.category===cat)&&(!st||a.status===st)&&[a.assetId,a.name,a.category,a.employee,a.location].some(v=>String(v||"").toLowerCase().includes(q)));
$("#table").innerHTML=list.map(a=>`<tr><td><strong>${esc(a.name)}</strong><small>${esc(a.assetId)} · ${esc(a.location||"No location")}</small></td><td>${esc(a.category)}</td><td>${esc(a.employee||"Unassigned")}</td><td>${date(a.warrantyEnd)}${expired(a)?'<small style="color:#bd6b1c">Expired</small>':""}</td><td>${pill(a.status)}</td><td><button class="mini" data-edit="${esc(a.assetId)}">Edit</button><button class="mini" data-maint="${esc(a.assetId)}">Record maintenance</button></td></tr>`).join("")||'<tr><td colspan="6" class="empty">No matching assets.</td></tr>'}
function maintenance(){let list=assets.filter(a=>a.status!=="Retired").sort((a,b)=>(a.maintenanceDate||"9999").localeCompare(b.maintenanceDate||"9999"));$("#maintcards").innerHTML=list.slice(0,6).map(a=>`<div class="maintcard"><strong>${esc(a.name)}</strong><p>${esc(a.assetId)} · ${esc(a.category)}</p><p>Next maintenance: <b>${date(a.maintenanceDate)}</b></p>${due(a)?'<span class="pill Under-Maintenance">Due / overdue</span>':'<span class="pill Available">Scheduled</span>'}<p><button class="mini" data-maint="${esc(a.assetId)}">Record maintenance</button></p></div>`).join("")||'<div class="empty">No active assets.</div>';
$("#mainttable").innerHTML=list.map(a=>`<tr><td><strong>${esc(a.name)}</strong><small>${esc(a.assetId)}</small></td><td>${date(a.maintenanceDate)}</td><td>${date(a.warrantyEnd)}</td><td>${due(a)?pill("Under Maintenance"):pill("Available")}</td><td><button class="mini" data-maint="${esc(a.assetId)}">Record</button></td></tr>`).join("")||'<tr><td colspan="5" class="empty">No maintenance records.</td></tr>'}
function reports(){$("#value").textContent=money(assets.reduce((n,a)=>n+(Number(a.value)||0),0));$("#expired").textContent=assets.filter(expired).length;$("#due").textContent=assets.filter(due).length;$("#retired").textContent=assets.filter(a=>a.status==="Retired").length;let cats=[...new Set(assets.map(a=>a.category))].sort();$("#categoryreport").innerHTML=cats.map(c=>{let n=assets.filter(a=>a.category===c).length;return `<div class="barrow"><span>${esc(c)}</span><div class="bar"><div class="fill" style="width:${assets.length?n/assets.length*100:0}%"></div></div><strong>${n}</strong></div>`}).join("")||'<div class="empty">Add assets to generate reports.</div>'}
function openForm(a=null){editing=a?.assetId||null;$("#form").reset();$("#error").textContent="";$("#formtitle").textContent=a?"Edit asset":"Add new asset";if(a)Object.entries(a).forEach(([k,v])=>{if($("#form").elements[k])$("#form").elements[k].value=v??""});$("#form").elements.assetId.disabled=!!a;$("#modal").hidden=false;$("#form").elements.name.focus()}
function closeForm(){$("#modal").hidden=true;editing=null;$("#form").elements.assetId.disabled=false}
async function record(id){let a=assets.find(x=>x.assetId===id);if(!a)return;let next=prompt("Enter next maintenance date (YYYY-MM-DD):",plus(90));if(next===null)return;if(next&&!/^\d{4}-\d{2}-\d{2}$/.test(next)){toast("Use YYYY-MM-DD date format.");return}const previous={...a};a.maintenanceDate=next;if(a.status==="Under Maintenance")a.status=a.employee?"Assigned":"Available";a.notes=[a.notes,"Maintenance recorded "+today()].filter(Boolean).join(" | ");if(await save()){render();toast("Maintenance record updated.")}else{Object.assign(a,previous);render()}}
$$("[data-tab]").forEach(b=>b.onclick=()=>{let id=b.dataset.tab;$$(".tab").forEach(t=>t.classList.toggle("shown",t.id===id));$$("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));$("#title").textContent=({dashboard:"Dashboard",assets:"Asset Inventory",maintenance:"Maintenance",reports:"Reports"})[id]});
$("#add").onclick=$("#add2").onclick=()=>openForm();$("#close").onclick=$("#cancel").onclick=closeForm;$("#modal").onclick=e=>{if(e.target.id==="modal")closeForm()};document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#modal").hidden)closeForm()});
$("#search").oninput=inventory;$("#cat").onchange=inventory;$("#statusfilter").onchange=inventory;
document.addEventListener("click",e=>{let edit=e.target.closest("[data-edit]"),maint=e.target.closest("[data-maint]");if(edit)openForm(assets.find(a=>a.assetId===edit.dataset.edit));if(maint)record(maint.dataset.maint)});
$("#form").onsubmit=async e=>{e.preventDefault();let d=Object.fromEntries(new FormData(e.currentTarget).entries());d.value=Number(d.value)||0;if(assets.some(a=>a.assetId.toLowerCase()===d.assetId.toLowerCase()&&a.assetId!==editing)){$("#error").textContent="Asset ID already exists. Use a unique ID.";return}if(d.warrantyEnd&&d.purchaseDate&&d.warrantyEnd<d.purchaseDate){$("#error").textContent="Warranty end cannot be before purchase date.";return}if(d.status==="Assigned"&&!d.employee.trim()){$("#error").textContent="Enter the assigned employee/team.";return}if(!["Assigned","Under Maintenance"].includes(d.status))d.employee="";const previous=structuredClone(assets),wasEditing=!!editing;if(editing){let i=assets.findIndex(a=>a.assetId===editing);assets[i]={...assets[i],...d}}else assets.push(d);if(await save()){closeForm();render();toast(wasEditing?"Asset updated.":"Asset added successfully.")}else{assets=previous;render()}};
$("#csv").onclick=()=>{let cols=["assetId","name","category","purchaseDate","warrantyEnd","maintenanceDate","employee","value","status","location","notes"];let csv=[cols.join(","),...assets.map(a=>cols.map(k=>'"'+String(a[k]??"").replaceAll('"','""')+'"').join(","))].join("\r\n");let url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));let link=document.createElement("a");link.href=url;link.download="assetflow-inventory.csv";link.click();URL.revokeObjectURL(url);toast("CSV exported.")};
async function initialize(){
  try {
    const response=await fetch('/api/assets');
    if(!response.ok) throw new Error('API unavailable');
    assets=await response.json();
    if(!assets.length){assets=structuredClone(seed);await save();}
    render();
    toast('Connected to AssetFlow backend.');
  } catch(error) {
    render();
    toast('Backend unavailable. Start the app using npm start.');
  }
}
initialize();