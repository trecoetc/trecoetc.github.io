import fs from "node:fs";
import path from "node:path";

const root=process.cwd(), out=path.join(root,"dist");
fs.rmSync(out,{recursive:true,force:true}); fs.mkdirSync(out,{recursive:true});

const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const slug=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const md=s=>String(s??"").split(/\n{2,}/).map(p=>{
 const t=p.trim(); if(!t)return "";
 if(/^### /.test(t))return "<h3>"+esc(t.slice(4))+"</h3>";
 if(/^## /.test(t))return "<h2>"+esc(t.slice(3))+"</h2>";
 return "<p>"+esc(t).replace(/\n/g,"<br>")+"</p>";
}).join("\n");
const load=dir=>fs.existsSync(dir)?fs.readdirSync(dir).filter(f=>f.endsWith(".json")).map(f=>({slug:f.replace(/\.json$/,""),...JSON.parse(fs.readFileSync(path.join(dir,f),"utf8"))})).filter(x=>x.published!==false):[];

const articles=load(path.join(root,"content/artigos")).sort((a,b)=>String(a.number).localeCompare(String(b.number)));
const projects=load(path.join(root,"content/projetos"));

let home=fs.readFileSync(path.join(root,"index.html"),"utf8");
const articleCards=articles.map(a=>`<a class="note" href="artigo-${a.slug}.html" target="_blank" rel="noopener"><small>${esc(a.category)} / ${esc(a.number)}</small><h3>${esc(a.title)}</h3><p>${esc(a.excerpt)}</p></a>`).join("\n  ");
const projectCards=projects.map((p,i)=>`<a class="project" href="projeto-${p.slug}.html" target="_blank" rel="noopener" style="color:inherit;text-decoration:none"><div class="project-image">${p.cover?`<img src="${esc(p.cover)}" alt="" style="width:100%;height:100%;object-fit:cover">`:String(i+1).padStart(2,"0")}</div><small>${esc(p.category)}</small><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p></a>`).join("\n  ");
home=home.replace(/<!-- CMS:ARTICLES:START -->[\s\S]*?<!-- CMS:ARTICLES:END -->/,`<!-- CMS:ARTICLES:START -->\n  ${articleCards}\n<!-- CMS:ARTICLES:END -->`);
home=home.replace(/<!-- CMS:PROJECTS:START -->[\s\S]*?<!-- CMS:PROJECTS:END -->/,`<!-- CMS:PROJECTS:START -->\n  ${projectCards}\n<!-- CMS:PROJECTS:END -->`);
const weeks=load(path.join(root,"content/interesses")).sort((a,b)=>String(b.date).localeCompare(String(a.date)) || b.slug.localeCompare(a.slug, "pt-BR", {numeric:true}));
const weekDate=d=>{const [y,m,day]=String(d).slice(0,10).split("-");return `${day}.${m}.${y.slice(-2)}`};
const interestCards=w=>`<div class="weekly-grid">${(w.items||[]).map(x=>`<a class="weekly-item" href="interesses-${slug(x.category)}.html" aria-label="Ver interesses de ${esc(x.category)}"><h3 class="weekly-category">${esc(x.category)}</h3><div class="weekly-content">${x.image?`<img src="${esc(x.image)}" alt="${esc(x.alt||x.title)}" loading="lazy" width="88" height="88">`:""}<h4 class="weekly-title">${esc(x.title)}</h4><p>${esc(x.comment)}</p>${x.credit?`<small style="margin-top:12px;display:block">${esc(x.credit)}</small>`:""}</div></a>`).join("")}</div>`;
if(weeks.length){home=home.replace(/<!-- CMS:INTERESTS:START -->[\s\S]*?<!-- CMS:INTERESTS:END -->/,`<!-- CMS:INTERESTS:START -->${interestCards(weeks[0])}<!-- CMS:INTERESTS:END -->`);home=home.replace(/<time datetime="2026-10-05">05.10.26<\/time>/,`<time datetime="${esc(weeks[0].date)}">${weekDate(weeks[0].date)}</time>`)}
fs.writeFileSync(path.join(out,"index.html"),home);

const shell=(title,kicker,intro,body,cover="",gallery=[])=>`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — Treco&etc.</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Libre+Caslon+Display:ital@0;1&display=swap" rel="stylesheet"><style>:root{--cream:#fff1c9;--yellow:#ffc515;--pink:#ff67a0;--ink:#10100e}*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--ink);font-family:"DM Mono",monospace}.nav{height:62px;border-bottom:2px solid;display:flex;align-items:center;justify-content:space-between;padding:0 5vw}.brand{font:900 25px "Helvetica", Arial, sans-serif;color:inherit;text-decoration:none}.article{padding:75px 5vw 110px}.head{max-width:1120px;margin:auto}.kicker{font-size:11px;text-transform:uppercase;letter-spacing:.08em}h1{font:900 clamp(55px,9vw,132px)/.84 "Helvetica", Arial, sans-serif;letter-spacing:-.065em;text-transform:uppercase;margin:30px 0 42px}.intro{max-width:820px;font:italic clamp(27px,4vw,52px)/1.08 "Libre Caslon Display";background:var(--yellow);border:2px solid;box-shadow:9px 10px 0;padding:20px 25px}.cover{max-width:1120px;margin:65px auto 0;border:2px solid}.cover img{display:block;width:100%}.body{max-width:760px;margin:75px auto 0;border-top:2px solid;padding-top:38px;font-size:17px;line-height:1.75}.body h2,.body h3{font-family:"Helvetica", Arial, sans-serif;font-weight:900!important;line-height:1.05}.gallery{max-width:1120px;margin:55px auto;display:grid;grid-template-columns:repeat(2,1fr);gap:18px}.gallery img{width:100%;border:2px solid}.back{display:inline-block;margin-top:55px;background:var(--pink);border:2px solid;box-shadow:6px 7px 0;padding:13px 17px;color:inherit;text-decoration:none;font:900 13px "Helvetica", Arial, sans-serif;text-transform:uppercase}.footer{border-top:2px solid;padding:18px 5vw;font-size:10px;text-transform:uppercase}@media(max-width:650px){.nav{padding:0 18px}.nav span{display:none}.article{padding:55px 18px 80px}.gallery{grid-template-columns:1fr}}</style></head><body><nav class="nav"><a class="brand" href="index.html">treco&etc.</a><span>não-agência / laboratório criativo</span></nav><main class="article"><header class="head"><div class="kicker">${esc(kicker)}</div><h1>${esc(title)}</h1><div class="intro">${esc(intro)}</div></header>${cover?`<div class="cover"><img src="${esc(cover)}" alt=""></div>`:""}<article class="body">${md(body)}<a class="back" href="index.html">← voltar para o site</a></article>${gallery?.length?`<div class="gallery">${gallery.map(g=>`<img src="${esc(g.image||g)}" alt="">`).join("")}</div>`:""}</main><footer class="footer">© treco&etc 2026 / feito com autenticidade</footer></body></html>`;

for(const a of articles) fs.writeFileSync(path.join(out,`artigo-${a.slug}.html`),shell(a.title,`${a.category} / ${a.number}`,a.excerpt,a.body,a.cover));
for(const p of projects) fs.writeFileSync(path.join(out,`projeto-${p.slug}.html`),shell(p.title,[p.category,p.client,p.year].filter(Boolean).join(" / "),p.excerpt,p.body,p.cover,p.gallery));

for(const name of fs.readdirSync(root)){
 if(["dist","content","build.mjs","wrangler.jsonc",".git"].includes(name)) continue;
 if(/^treco-artigo-/.test(name)) continue;
 const src=path.join(root,name), dst=path.join(out,name);
 if(fs.statSync(src).isDirectory()) fs.cpSync(src,dst,{recursive:true});
 else if(name!=="index.html") fs.copyFileSync(src,dst);
}

let interestArchive=fs.readFileSync(path.join(root,"interesses.html"),"utf8");
const pastWeeks=weeks.slice(1);
interestArchive=interestArchive.replace(/<!-- CMS:INTERESTS:ARCHIVE:START -->[\s\S]*?<!-- CMS:INTERESTS:ARCHIVE:END -->/,`<!-- CMS:INTERESTS:ARCHIVE:START -->${pastWeeks.length?`<div class="weekly-archive-list">${pastWeeks.map(w=>`<details class="weekly-edition"><summary>${weekDate(w.date)}</summary>${interestCards(w)}</details>`).join("")}</div>`:'<p class="weekly-empty">Esta é a primeira semana. As próximas vão deixando as anteriores por aqui.</p>'}<!-- CMS:INTERESTS:ARCHIVE:END -->`);
fs.writeFileSync(path.join(out,"interesses.html"),interestArchive);

const categories=[['Música','#F04424','#10100E'],['Cinema','#FFF1C9','#10100E'],['Design','#FFC515','#10100E'],['Marcas','#FF67A0','#10100E'],['Curiosidades','#064C37','#FFF1C9'],['Etc.','#10100E','#FFF1C9']];
for(const [category,bg,ink] of categories){
 const records=weeks.flatMap(w=>(w.items||[]).filter(x=>x.category===category).map(x=>({...x,date:w.date})));
 const body=records.map(x=>`<article class="entry"><time datetime="${esc(x.date)}">${weekDate(x.date)}</time>${x.image?`<img src="${esc(x.image)}" alt="${esc(x.alt||x.title)}" width="600" height="600">`:""}<h2>${esc(x.title)}</h2><p>${esc(x.comment)}</p>${x.credit?`<small>${esc(x.credit)}</small>`:""}${x.url&&/^https?:\/\//.test(x.url)?`<p><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">abrir referência</a></p>`:""}</article>`).join('');
 const links=categories.map(([c])=>`<a href="interesses-${slug(c)}.html"${c===category?' aria-current="page"':''}>${esc(c)}</a>`).join('');
 const page=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(category)} — Interesses da Treco</title><link href="https://fonts.googleapis.com/css2?family=DM+Mono&family=Libre+Caslon+Display&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;background:${bg};color:${ink};font:16px/1.6 'DM Mono',monospace}a{color:inherit;text-underline-offset:5px}a:focus-visible{outline:3px solid currentColor;outline-offset:5px}header,main,footer{width:min(1120px,90%);margin:auto}header{padding:28px 0;border-bottom:2px solid;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}.brand{font:900 25px 'Helvetica', Arial, sans-serif;text-decoration:none}main{padding:50px 0 70px}h1{font:900 clamp(38px,7vw,100px)/1 'Helvetica', Arial, sans-serif;text-transform:uppercase;letter-spacing:-.045em;margin:18px 0 28px;overflow-wrap:anywhere}nav{display:flex;gap:12px 24px;flex-wrap:wrap;margin:30px 0 50px}nav a[aria-current]{font-weight:bold;text-decoration-thickness:3px}.entry{border-top:2px solid;padding:28px 0 40px;display:flow-root}.entry h2{font:clamp(30px,4vw,52px)/1.12 'Libre Caslon Display';margin:20px 0}.entry p{max-width:700px}.entry img{width:min(320px,100%);height:auto;float:right;margin:20px 0 20px 32px}.entry time,.entry small{display:block;font-size:14px}footer{border-top:2px solid;padding:24px 0 40px}@media(max-width:650px){main{padding-top:35px}.entry img{float:none;margin:22px 0;width:min(320px,100%)}}</style></head><body><header><a class="brand" href="index.html">treco&amp;etc.</a><a href="index.html#interesses">voltar aos interesses da semana</a></header><main><small>INTERESSES DA TRECO</small><h1>${esc(category)}</h1><nav aria-label="Categorias de interesses">${links}</nav>${body||'<p>Essa categoria ainda está esperando o próximo interesse.</p>'}</main><footer><a href="index.html#interesses">voltar aos interesses da semana</a></footer></body></html>`;
 fs.writeFileSync(path.join(out,`interesses-${slug(category)}.html`),page);
}
