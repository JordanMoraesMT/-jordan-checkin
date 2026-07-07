/* ============================================================
   TeamCheck v21 — padronização visual TOTAL com o Dashboard.
   Tokens idênticos ao theme.js do Dashboard (2 temas), incluindo
   os derivados "Cyber Tech Premium" (vidro, malha, grade, sombras)
   e os tokens de chrome (sidebar/cabeçalho). Acentos vívidos ficam
   em HEX fixo no lib.js. Padrão: ESCURO (troca na Config/header).
   ============================================================ */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

:root, :root[data-theme="dark"]{
  /* superfícies — ESCURO (Azul Escuro) */
  --bg:#0B1B2C; --card:rgba(18,43,67,.62); --card-solid:#122B43; --alt:#1A3148; --bdr:#1E3A57;
  --inp:#0C2236; --inp-bdr:#294763;
  --t1:#E6EFF6; --t2:#8DA4B8; --t3:#7C92A6; --t4:#5E7488;
  --link:#0AAEE8; --scroll:#294763;
  --alt-rgb:26,49,72; --bdr-rgb:30,58,87; --t3-rgb:124,146,166;
  /* Cyber Tech Premium — derivados */
  --glass-blur:14px; --card-hi:rgba(255,255,255,.05);
  --card-shadow:0 12px 32px -18px rgba(0,0,0,.55);
  --card-shadow-hover:0 24px 46px -22px rgba(10,174,232,.42);
  --track:#0A1E30; --seam-shadow:rgba(0,0,0,.5);
  --mesh-a:rgba(10,174,232,.14); --mesh-b:rgba(139,92,246,.08);
  --grid-line:rgba(255,255,255,.03);
  /* chrome (cabeçalho + menu lateral) — ESCURO */
  --chrome:#0E2942; --chrome-top:#0B2236; --chrome-fg:#E6EFF6;
  --chrome-bdr:rgba(255,255,255,.08);
  --nav-fg:#8DA4B8; --nav-grp:#6F8597;
  --nav-active-bg:rgba(10,174,232,.22); --nav-active-fg:#FFFFFF; --nav-hover:rgba(255,255,255,.06);
  --content-shadow:rgba(0,0,0,.55);
}
:root[data-theme="light"]{
  /* superfícies — CLARO (Azul) */
  --bg:#CED5D9; --card:rgba(252,253,254,.62); --card-solid:#FBFCFD; --alt:#EEF2F5; --bdr:#DCE3E7;
  --inp:#FFFFFF; --inp-bdr:#D3DBE1;
  --t1:#14202B; --t2:#2E3A45; --t3:#54616C; --t4:#9AA6B0;
  --link:#0578A6; --scroll:#B9C4CC;
  --alt-rgb:238,242,245; --bdr-rgb:220,227,231; --t3-rgb:84,97,108;
  --glass-blur:16px; --card-hi:rgba(255,255,255,.95);
  --card-shadow:0 12px 30px -14px rgba(14,41,66,.20);
  --card-shadow-hover:0 22px 44px -18px rgba(10,120,180,.30);
  --track:#DBE2E7; --seam-shadow:rgba(4,60,90,.22);
  --mesh-a:rgba(10,174,232,.20); --mesh-b:rgba(139,92,246,.10);
  --grid-line:rgba(5,120,166,.045);
  /* chrome — CLARO */
  --chrome:#0578A6; --chrome-top:#036690; --chrome-fg:#FFFFFF;
  --chrome-bdr:rgba(255,255,255,.18);
  --nav-fg:rgba(255,255,255,.82); --nav-grp:rgba(255,255,255,.55);
  --nav-active-bg:rgba(255,255,255,.20); --nav-active-fg:#FFFFFF; --nav-hover:rgba(255,255,255,.12);
  --content-shadow:rgba(20,32,43,.20);
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  background: var(--chrome);
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 15px;
  color: var(--t1);
  overscroll-behavior-y: contain;
  -webkit-tap-highlight-color: transparent;
}
#root { min-height: 100vh; }

input, select, textarea {
  font-family: inherit;
  font-size: 14px;
  color: var(--t1);
  background: var(--inp);
  border: 1px solid var(--inp-bdr);
  border-radius: 8px;
  padding: 9px 10px;
  outline: none;
  width: auto;
}
input::placeholder, textarea::placeholder { color: var(--t4); }
input:focus, select:focus, textarea:focus { border-color: #0AAEE8; }
option { background: var(--inp); color: var(--t1); }
button {
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  color: var(--t1);
  background: var(--alt);
  border: 1px solid var(--bdr);
  border-radius: 8px;
  padding: 9px 12px;
}
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--scroll); border-radius: 4px; }
:focus-visible{outline:2px solid #0AAEE8;outline-offset:2px;border-radius:8px}

/* ── Cyber Tech Premium (idêntico ao Dashboard): malha + grade,
      fio azure, vidro nos cards e fonte mono — aplica a TODAS as
      telas via seletor de atributo dentro de .jc-main ── */
.jc-main{position:relative;background:var(--bg);}
.jc-main::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;
  background:
    radial-gradient(720px 460px at 10% -10%,var(--mesh-a),transparent 60%),
    radial-gradient(620px 420px at 110% 6%,var(--mesh-b),transparent 58%),
    radial-gradient(520px 520px at 50% 120%,var(--mesh-a),transparent 62%),
    linear-gradient(var(--grid-line) 1px,transparent 1px) 0 0/34px 34px,
    linear-gradient(90deg,var(--grid-line) 1px,transparent 1px) 0 0/34px 34px;}
.jc-main::after{content:"";position:absolute;top:0;left:0;width:2px;height:120px;
  background:linear-gradient(180deg,#0AAEE8,transparent);border-radius:22px 0 0 0;opacity:.6;pointer-events:none;z-index:1}
.jc-main>*{position:relative;z-index:1}
.jc-main [style*="var(--card)"]{
  -webkit-backdrop-filter:blur(var(--glass-blur)) saturate(1.15);
  backdrop-filter:blur(var(--glass-blur)) saturate(1.15);}
/* dropdowns/popovers/sticky flutuam SOBRE conteúdo → opacos */
.jc-main [style*="var(--card)"][style*="position: absolute"],
.jc-main [style*="var(--card)"][style*="position: fixed"],
.jc-main [style*="var(--card)"][style*="position: sticky"]{
  background:var(--card-solid)!important;
  -webkit-backdrop-filter:none!important;backdrop-filter:none!important;}
.jc-main [style*="var(--card)"][style*="border-radius"]{
  box-shadow:inset 0 1px 0 var(--card-hi),var(--card-shadow)!important;
  transition:transform .2s cubic-bezier(.2,.7,.3,1),border-color .18s,box-shadow .2s;}
.jc-main [style*="var(--card)"][style*="border-radius"]:hover{
  transform:translateY(-3px);border-color:rgba(10,174,232,.45)!important;
  box-shadow:inset 0 1px 0 var(--card-hi),var(--card-shadow-hover)!important;}
.mono{font-family:'IBM Plex Mono',ui-monospace,monospace}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .jc-main [style*="var(--card)"]{background:var(--card-solid)!important}}
@media (prefers-reduced-motion:reduce){.jc-main *{animation:none!important;transition:none!important}}

/* modais fora do .jc-main também ganham vidro sólido */
.jc-modal{background:var(--card-solid)!important;}

/* hover do menu lateral (mesma classe do Dashboard) */
.navit:hover{background:var(--nav-hover)!important;}
.hr:hover{background:var(--alt);}

@keyframes spin{to{transform:rotate(360deg)}}
.spin{animation:spin 1s linear infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
