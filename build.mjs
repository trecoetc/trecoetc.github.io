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
const weeks=load(path.join(root,"content/interesses")).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
const weekDate=d=>{const [y,m,day]=String(d).slice(0,10).split("-");return `${day}.${m}.${y.slice(-2)}`};
const interestCards=w=>`<div class="weekly-grid">${(w.items||[]).map(x=>`<article class="weekly-item">${x.image?`<img src="${esc(x.image)}" alt="${esc(x.alt||x.title)}" loading="lazy" width="600" height="600">`:""}<small>${esc(x.category).toUpperCase()}</small><h3>${x.url&&/^https?:\/\//.test(x.url)?`<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title)}</a>`:esc(x.title)}</h3><p>${esc(x.comment)}</p>${x.credit?`<small style="margin-top:12px">${esc(x.credit)}</small>`:""}</article>`).join("")}</div>`;
if(weeks.length){home=home.replace(/<!-- CMS:INTERESTS:START -->[\s\S]*?<!-- CMS:INTERESTS:END -->/,`<!-- CMS:INTERESTS:START -->${interestCards(weeks[0])}<!-- CMS:INTERESTS:END -->`);home=home.replace(/<time datetime="2026-10-05">05.10.26<\/time>/,`<time datetime="${esc(weeks[0].date)}">${weekDate(weeks[0].date)}</time>`)}
fs.writeFileSync(path.join(out,"index.html"),home);

const shell=(title,kicker,intro,body,cover="",gallery=[])=>`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — Treco&etc.</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Mono:wght@300;400;500&family=Libre+Caslon+Display:ital@0;1&display=swap" rel="stylesheet"><style>:root{--cream:#fff1c9;--yellow:#ffc515;--pink:#ff67a0;--ink:#10100e}*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--ink);font-family:"DM Mono",monospace}.nav{height:62px;border-bottom:2px solid;display:flex;align-items:center;justify-content:space-between;padding:0 5vw}.brand{font:25px "Archivo Black";color:inherit;text-decoration:none}.article{padding:75px 5vw 110px}.head{max-width:1120px;margin:auto}.kicker{font-size:11px;text-transform:uppercase;letter-spacing:.08em}h1{font:clamp(55px,9vw,132px)/.84 "Archivo Black";letter-spacing:-.065em;text-transform:uppercase;margin:30px 0 42px}.intro{max-width:820px;font:italic clamp(27px,4vw,52px)/1.08 "Libre Caslon Display";background:var(--yellow);border:2px solid;box-shadow:9px 10px 0;padding:20px 25px}.cover{max-width:1120px;margin:65px auto 0;border:2px solid}.cover img{display:block;width:100%}.body{max-width:760px;margin:75px auto 0;border-top:2px solid;padding-top:38px;font-size:17px;line-height:1.75}.body h2,.body h3{font-family:"Archivo Black";line-height:1.05}.gallery{max-width:1120px;margin:55px auto;display:grid;grid-template-columns:repeat(2,1fr);gap:18px}.gallery img{width:100%;border:2px solid}.back{display:inline-block;margin-top:55px;background:var(--pink);border:2px solid;box-shadow:6px 7px 0;padding:13px 17px;color:inherit;text-decoration:none;font:13px "Archivo Black";text-transform:uppercase}.footer{border-top:2px solid;padding:18px 5vw;font-size:10px;text-transform:uppercase}@media(max-width:650px){.nav{padding:0 18px}.nav span{display:none}.article{padding:55px 18px 80px}.gallery{grid-template-columns:1fr}}</style></head><body><nav class="nav"><a class="brand" href="index.html">treco&etc.</a><span>não-agência / laboratório criativo</span></nav><main class="article"><header class="head"><div class="kicker">${esc(kicker)}</div><h1>${esc(title)}</h1><div class="intro">${esc(intro)}</div></header>${cover?`<div class="cover"><img src="${esc(cover)}" alt=""></div>`:""}<article class="body">${md(body)}<a class="back" href="index.html">← voltar para o site</a></article>${gallery?.length?`<div class="gallery">${gallery.map(g=>`<img src="${esc(g.image||g)}" alt="">`).join("")}</div>`:""}</main><footer class="footer">© treco&etc 2026 / feito com autenticidade</footer></body></html>`;

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
