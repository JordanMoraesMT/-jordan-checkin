// TeamCheck — componentes compartilhados (login, card, banner, modais)
import { useState, useEffect, useMemo, useRef, memo } from "react";
import { createPortal } from "react-dom";
import { BarChart3, LogIn, LogOut, MessageCircle, Phone, Navigation, Headset, Pencil, UserPlus, Check, ChevronDown, Search, X, Calendar as CalIcon } from "lucide-react";
import {fD1, bairroCanon, CARGOS, cargosDe, CANAIS, crmFire, API, DASH, HOMES, todayLocal, gcalUrl, TYPES, USERS, BRANDS, SECTORS, CAT_IDS, ORIGINS, CC, S, fT, fD, mins, hrsMin, hav, sL, sS, gps, fixMojibake, strip, fetchCNPJ } from "./lib";

const JLOGO=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 424 192"><defs><path id="c" d="M.316.251A.28.28 0 0 0 .255.057.2.2 0 0 0 .09-.012.2.2 0 0 0 .012 0v.109a.13.13 0 0 1 .072-.02Q.2.09.2.27V.7h.116z"/><path id="d" d="M.295-.012a.25.25 0 0 0-.184.07.25.25 0 0 0-.07.186q0 .126.073.197.071.07.194.07A.24.24 0 0 0 .49.444.27.27 0 0 0 .556.252.26.26 0 0 0 .486.06a.25.25 0 0 0-.19-.072M.3.421A.13.13 0 0 1 .196.375.2.2 0 0 1 .157.247q0-.078.04-.124A.13.13 0 0 1 .3.078q.067 0 .103.045.035.044.035.126a.2.2 0 0 1-.035.127A.12.12 0 0 1 .3.421"/><path id="e" d="M.364.392a.1.1 0 0 1-.06.016.1.1 0 0 1-.083-.045.2.2 0 0 1-.034-.124V0H.074v.5h.113V.397h.002A.2.2 0 0 0 .24.479q.035.03.077.03.03 0 .047-.01z"/><path id="f" d="M.528 0H.415v.085H.413a.18.18 0 0 0-.168-.097.18.18 0 0 0-.148.067.28.28 0 0 0-.055.183q0 .125.06.199a.2.2 0 0 0 .164.075q.1 0 .147-.081h.002v.31h.113zM.417.229v.065a.13.13 0 0 1-.035.09.12.12 0 0 1-.089.037.12.12 0 0 1-.1-.047.2.2 0 0 1-.036-.131q0-.076.035-.12A.11.11 0 0 1 .286.077Q.344.077.38.12a.16.16 0 0 1 .037.108"/><path id="g" d="M.458 0h-.11v.078H.346a.17.17 0 0 0-.152-.09.16.16 0 0 0-.116.04.14.14 0 0 0-.041.106Q.037.277.2.3l.148.02q0 .107-.101.107A.24.24 0 0 1 .085.366v.099a.35.35 0 0 0 .183.047q.19 0 .19-.187zm-.11.246L.243.23A.2.2 0 0 1 .17.207Q.145.19.145.147q0-.032.023-.053a.1.1 0 0 1 .06-.02q.053 0 .086.037a.13.13 0 0 1 .034.091z"/><path id="h" d="M.519 0H.406v.282q0 .14-.1.14A.1.1 0 0 1 .222.383.14.14 0 0 1 .188.285V0H.074v.5h.114V.417h.001a.18.18 0 0 0 .163.095q.08 0 .124-.053A.24.24 0 0 0 .52.306z"/><path id="i" d="M.627 0H.492L.38.188.35.231a.2.2 0 0 1-.029.03.1.1 0 0 1-.032.017.1.1 0 0 1-.04.005H.202V0H.086v.7h.23A.3.3 0 0 0 .409.688.2.2 0 0 0 .48.653.2.2 0 0 0 .528.594.2.2 0 0 0 .545.511a.2.2 0 0 0-.01-.068.18.18 0 0 0-.08-.096A.2.2 0 0 0 .39.32V.318A.2.2 0 0 0 .423.295a.5.5 0 0 0 .08-.098zM.202.606V.378H.3q.027 0 .05.009a.1.1 0 0 1 .065.062.1.1 0 0 1 .009.05.1.1 0 0 1-.032.079Q.36.606.3.606z"/><path id="j" d="M.497.22h-.34A.14.14 0 0 1 .198.111.16.16 0 0 1 .311.075q.08 0 .147.048V.03a.34.34 0 0 0-.18-.043.22.22 0 0 0-.174.068.27.27 0 0 0-.062.192q0 .117.069.19a.23.23 0 0 0 .171.074.2.2 0 0 0 .159-.066.27.27 0 0 0 .056-.183zM.387.3q0 .062-.028.095A.1.1 0 0 1 .28.428.11.11 0 0 1 .198.393.16.16 0 0 1 .156.299z"/><path id="l" d="M.189.074H.187V-.23H.074V.5h.113V.412h.002q.058.1.17.1A.18.18 0 0 0 .507.445a.28.28 0 0 0 .054-.18Q.56.14.5.065A.2.2 0 0 0 .335-.01.16.16 0 0 0 .19.074M.186.27V.209q0-.054.035-.093A.12.12 0 0 1 .31.078q.063 0 .098.05a.23.23 0 0 1 .036.136.18.18 0 0 1-.033.116.11.11 0 0 1-.09.041.12.12 0 0 1-.098-.043.16.16 0 0 1-.037-.107"/><path id="m" d="M.042.016V.12a.23.23 0 0 1 .14-.049q.103 0 .103.06a.05.05 0 0 1-.009.03.1.1 0 0 1-.023.021L.218.2.172.216.117.242a.2.2 0 0 0-.041.031.1.1 0 0 0-.025.04.1.1 0 0 0-.008.05Q.043.4.06.428a.2.2 0 0 0 .046.047.2.2 0 0 0 .065.028.34.34 0 0 0 .2-.011v-.1a.2.2 0 0 1-.16.032.1.1 0 0 1-.03-.012L.163.393.156.369q0-.016.007-.027a.1.1 0 0 1 .02-.02L.215.305.258.29.316.263A.2.2 0 0 0 .36.233.12.12 0 0 0 .397.137.12.12 0 0 0 .38.072.2.2 0 0 0 .333.025a.2.2 0 0 0-.068-.028.4.4 0 0 0-.08-.009.34.34 0 0 0-.143.028"/><path id="n" d="M.337.005A.2.2 0 0 0 .25-.01q-.146 0-.146.14v.28H.021V.5h.083v.116l.114.032V.5h.12V.411h-.12v-.25q0-.044.016-.063t.054-.02q.028 0 .05.017z"/><path id="o" d="M.432.023A.3.3 0 0 0 .29-.012a.24.24 0 0 0-.18.07.25.25 0 0 0-.068.18q0 .124.073.199t.197.075a.3.3 0 0 0 .12-.024V.382a.2.2 0 0 1-.111.04.16.16 0 0 1-.118-.05.18.18 0 0 1-.046-.126A.17.17 0 0 1 .2.123.15.15 0 0 1 .316.078q.062 0 .116.044zM.392-.12q0-.095-.142-.095-.022 0-.04.002v.054l.036-.003q.065 0 .065.04 0 .036-.06.036L.232-.088V0H.3v-.046q.042 0 .067-.02A.07.07 0 0 0 .391-.12"/><path id="p" d="M.458 0h-.11v.078H.346a.17.17 0 0 0-.152-.09.16.16 0 0 0-.116.04.14.14 0 0 0-.041.106Q.037.277.2.3l.148.02q0 .107-.101.107A.24.24 0 0 1 .085.366v.099a.35.35 0 0 0 .183.047q.19 0 .19-.187zm-.11.246L.243.23A.2.2 0 0 1 .17.207Q.145.19.145.147q0-.032.023-.053a.1.1 0 0 1 .06-.02q.053 0 .086.037a.13.13 0 0 1 .034.091zM.426.72A.16.16 0 0 0 .4.628.08.08 0 0 0 .333.592a.2.2 0 0 0-.081.023.13.13 0 0 1-.06.022q-.04 0-.04-.054H.096q0 .059.025.093a.08.08 0 0 0 .07.035.16.16 0 0 0 .076-.025.1.1 0 0 1 .061-.021q.04 0 .04.055z"/><path id="q" d="M.206 0h-.12v.7h.12z"/><path id="r" d="M.188 0H.074v.74h.114z"/><path id="s" d="M.13.605a.07.07 0 0 0-.047.018.06.06 0 0 0-.02.046q0 .027.02.046.02.02.048.019A.07.07 0 0 0 .18.715.06.06 0 0 0 .2.67.06.06 0 0 0 .18.624.07.07 0 0 0 .13.605M.188 0H.074v.5h.113z"/><path id="t" d="M.529.04q0-.275-.277-.275a.4.4 0 0 0-.17.032v.104a.3.3 0 0 1 .155-.047q.18 0 .179.175v.055H.414a.18.18 0 0 0-.17-.096q-.09 0-.147.067a.27.27 0 0 0-.055.179q0 .127.06.203a.2.2 0 0 0 .165.075A.16.16 0 0 0 .414.43h.002V.5h.113zM.417.229v.065a.13.13 0 0 1-.035.09.11.11 0 0 1-.088.037.12.12 0 0 1-.1-.047A.2.2 0 0 1 .157.24q0-.075.035-.118A.11.11 0 0 1 .285.079Q.343.079.38.12a.16.16 0 0 1 .037.108"/><path id="u" d="M.372.278q0-.141-.065-.216Q.242-.011.118-.011a.3.3 0 0 0-.102.019v.148a.15.15 0 0 1 .09-.031q.11 0 .109.16V.7h.157z"/><path id="v" d="M.376-.012q-.15 0-.245.098A.35.35 0 0 0 .036.34q0 .166.096.268.097.103.255.103.15 0 .243-.098A.36.36 0 0 0 .722.355.37.37 0 0 0 .626.089a.33.33 0 0 0-.25-.101m.007.588Q.299.576.25.514A.26.26 0 0 1 .202.349q0-.104.049-.164A.16.16 0 0 1 .379.124q.08 0 .13.059.047.06.047.163 0 .11-.046.17a.15.15 0 0 1-.127.06"/><path id="w" d="M.667 0h-.18l-.11.18-.046.064a.1.1 0 0 1-.024.018L.28.268H.238V0H.08v.7h.25Q.585.7.585.51A.2.2 0 0 0 .542.386a.2.2 0 0 0-.05-.043.3.3 0 0 0-.064-.028V.313a.1.1 0 0 0 .03-.016L.486.271a.4.4 0 0 0 .05-.064zm-.43.582V.387h.07q.05 0 .08.03Q.42.447.42.49q0 .092-.11.092z"/><path id="x" d="M.08 0v.7h.248Q.701.7.701.36A.35.35 0 0 0 .6.098.38.38 0 0 0 .33 0zm.158.572V.128h.078q.102 0 .16.061a.23.23 0 0 1 .06.168q0 .101-.059.157a.22.22 0 0 1-.162.058z"/><path id="y" d="M.696 0H.524l-.05.156H.225L.175 0h-.17L.26.7h.187zM.438.277.363.512A.3.3 0 0 0 .35.575H.347a.3.3 0 0 0-.012-.06L.259.276z"/><path id="z" d="M.71 0H.55L.263.44.227.498H.225Q.23.461.23.385V0H.08v.7h.17L.528.274.563.217h.002A1 1 0 0 0 .56.313V.7h.15z"/><clipPath id="a"><path d="M0 192h424V0H0Z" clip-rule="evenodd"/></clipPath><clipPath id="b"><path d="M-508-28H932v291H-508Z" clip-rule="evenodd"/></clipPath></defs><g clip-path="url(#a)"><g clip-path="url(#b)"><use xlink:href="#c" fill="currentColor" data-text="J" transform="matrix(22.5 0 0 -22.5 35.645 227)"/><use xlink:href="#d" fill="currentColor" data-text="o" transform="matrix(22.5 0 0 -22.5 44.94 227)"/><use xlink:href="#e" fill="currentColor" data-text="r" transform="matrix(22.5 0 0 -22.5 58.752 227)"/><use xlink:href="#f" fill="currentColor" data-text="d" transform="matrix(22.5 0 0 -22.5 67.257 227)"/><use xlink:href="#g" fill="currentColor" data-text="a" transform="matrix(22.5 0 0 -22.5 81.189 227)"/><use xlink:href="#h" fill="currentColor" data-text="n" transform="matrix(22.5 0 0 -22.5 93.308 227)"/><use xlink:href="#i" fill="currentColor" data-text="R" transform="matrix(22.5 0 0 -22.5 113.372 227)"/><use xlink:href="#j" fill="currentColor" data-text="e" transform="matrix(22.5 0 0 -22.5 127.161 227)"/><use xlink:href="#l" fill="currentColor" data-text="p" transform="matrix(22.5 0 0 -22.5 139.49 227)"/><use xlink:href="#e" fill="currentColor" data-text="r" transform="matrix(22.5 0 0 -22.5 153.422 227)"/><use xlink:href="#j" fill="currentColor" data-text="e" transform="matrix(22.5 0 0 -22.5 161.927 227)"/><use xlink:href="#m" fill="currentColor" data-text="s" transform="matrix(22.5 0 0 -22.5 174.255 227)"/><use xlink:href="#j" fill="currentColor" data-text="e" transform="matrix(22.5 0 0 -22.5 184.33 227)"/><use xlink:href="#h" fill="currentColor" data-text="n" transform="matrix(22.5 0 0 -22.5 196.659 227)"/><use xlink:href="#n" fill="currentColor" data-text="t" transform="matrix(22.5 0 0 -22.5 210.162 227)"/><use xlink:href="#g" fill="currentColor" data-text="a" transform="matrix(22.5 0 0 -22.5 218.667 227)"/><use xlink:href="#o" fill="currentColor" data-text="ç" transform="matrix(22.5 0 0 -22.5 230.787 227)"/><use xlink:href="#p" fill="currentColor" data-text="ã" transform="matrix(22.5 0 0 -22.5 241.741 227)"/><use xlink:href="#d" fill="currentColor" data-text="o" transform="matrix(22.5 0 0 -22.5 253.86 227)"/><use xlink:href="#q" fill="currentColor" data-text="I" transform="matrix(22.5 0 0 -22.5 274.232 227)"/><use xlink:href="#h" fill="currentColor" data-text="n" transform="matrix(22.5 0 0 -22.5 281.166 227)"/><use xlink:href="#n" fill="currentColor" data-text="t" transform="matrix(22.5 0 0 -22.5 294.67 227)"/><use xlink:href="#j" fill="currentColor" data-text="e" transform="matrix(22.5 0 0 -22.5 303.043 227)"/><use xlink:href="#r" fill="currentColor" data-text="l" transform="matrix(22.5 0 0 -22.5 315.371 227)"/><use xlink:href="#s" fill="currentColor" data-text="i" transform="matrix(22.5 0 0 -22.5 321.624 227)"/><use xlink:href="#t" fill="currentColor" data-text="g" transform="matrix(22.5 0 0 -22.5 327.876 227)"/><use xlink:href="#j" fill="currentColor" data-text="e" transform="matrix(22.5 0 0 -22.5 341.809 227)"/><use xlink:href="#h" fill="currentColor" data-text="n" transform="matrix(22.5 0 0 -22.5 354.137 227)"/><use xlink:href="#n" fill="currentColor" data-text="t" transform="matrix(22.5 0 0 -22.5 367.64 227)"/><use xlink:href="#j" fill="currentColor" data-text="e" transform="matrix(22.5 0 0 -22.5 376.013 227)"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16.5" d="M80.75 170.75a75 75 0 0 1-50.367-19.429 75 75 0 0 1-24.272-48.22A75 75 0 0 1 20.51 51.073a75 75 0 0 1 31.54-24.614 75 75 0 0 1 28.7-5.709H281m62.25 0a75 75 0 0 1 47.58 17.024 75 75 0 0 1 25.172 39.752 75 75 0 0 1 1.887 25.575 75 75 0 0 1-6.84 24.716 75 75 0 0 1-20.22 25.909 75 75 0 0 1-47.579 17.024H143"/><path fill="currentColor" d="M276.5 5 311 20.75 276.5 36.5zm-129 150L113 170.75l34.5 15.75z"/><use xlink:href="#u" fill="currentColor" data-text="J" transform="matrix(72 0 0 -72 60.91 125.75)"/><use xlink:href="#v" fill="currentColor" data-text="O" transform="matrix(72 0 0 -72 94.473 125.75)"/><use xlink:href="#w" fill="currentColor" data-text="R" transform="matrix(72 0 0 -72 150.57 125.75)"/><use xlink:href="#x" fill="currentColor" data-text="D" transform="matrix(72 0 0 -72 199.074 125.75)"/><use xlink:href="#y" fill="currentColor" data-text="A" transform="matrix(72 0 0 -72 252.57 125.75)"/><use xlink:href="#z" fill="currentColor" data-text="N" transform="matrix(72 0 0 -72 304.695 125.75)"/></g></g></svg>`;
export function JordanLogo({color="currentColor",height=46,style={}}){const w=Math.round(height*424/192);return(<span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",color,width:w,height,...style}} dangerouslySetInnerHTML={{__html:JLOGO}}/>);}


// ── Login (visual do modelo Jordan: fundo gradiente + card branco) ──
const TCLG_CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
.tclg{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:calc(24px + env(safe-area-inset-top)) 18px calc(24px + env(safe-area-inset-bottom));overflow:hidden;
  font-family:'IBM Plex Sans',Roboto,system-ui,sans-serif;-webkit-font-smoothing:antialiased;
  background:#0578A6;background-image:radial-gradient(1100px 620px at 82% -12%,rgba(40,224,196,.14),transparent 56%),radial-gradient(1000px 760px at -6% 112%,rgba(3,58,84,.7),transparent 58%),linear-gradient(158deg,#0A7099 0%,#036690 52%,#023E58 100%);}
.tclg-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(234,245,251,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(234,245,251,.05) 1px,transparent 1px);background-size:46px 46px;-webkit-mask-image:radial-gradient(760px 560px at 50% 44%,#000,transparent 78%);mask-image:radial-gradient(760px 560px at 50% 44%,#000,transparent 78%);}
.tclg-orb1{position:absolute;top:-120px;right:-80px;width:380px;height:380px;border-radius:50%;background:radial-gradient(circle,rgba(40,224,196,.16),transparent 70%);filter:blur(8px);animation:tclg-drift 7s ease-in-out infinite alternate;}
.tclg-orb2{position:absolute;bottom:-140px;left:-60px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(11,110,151,.5),transparent 68%);filter:blur(10px);animation:tclg-drift 9s ease-in-out infinite alternate-reverse;}
@keyframes tclg-rise{from{opacity:0;transform:translateY(18px) scale(.98);}to{opacity:1;transform:none;}}
@keyframes tclg-drift{from{transform:translateY(0);}to{transform:translateY(-26px);}}
.tclg-card{position:relative;z-index:2;width:392px;max-width:100%;border-radius:22px;overflow:hidden;background:#fff;text-align:left;
  box-shadow:0 44px 90px -34px rgba(2,40,58,.75),0 0 0 1px rgba(255,255,255,.08),0 2px 4px rgba(2,40,58,.2);animation:tclg-rise .6s cubic-bezier(.22,.9,.3,1) both;}
.tclg-head{padding:32px 34px 18px;text-align:center;}
.tclg-title{font-size:23px;font-weight:700;color:#0578A6;letter-spacing:.005em;margin-top:14px;line-height:1.3;}
.tclg-sub{font-size:12px;color:#7C8893;margin-top:6px;line-height:1.25;}
.tclg-body{padding:4px 34px 28px;}
.tclg-label{display:block;font-size:10.5px;letter-spacing:.12em;color:#7C8893;font-weight:600;margin:0 0 7px;text-transform:none;line-height:1.3;}
.tclg-field{display:flex;align-items:center;gap:11px;background:#F2F5F7;border:1px solid #E2E8EC;border-radius:11px;padding:13px 15px;margin-bottom:16px;transition:border-color .2s,box-shadow .2s,background .2s;}
.tclg-field:focus-within{border-color:#0578A6;background:#fff;box-shadow:0 0 0 3px rgba(5,120,166,.14);}
.tclg-field svg{flex-shrink:0;}
.tclg-input{width:100%;border:none;outline:none;background:transparent;font-family:inherit;font-size:14px;color:#12303F;padding:0;margin:0;height:21px;line-height:21px;border-radius:0;box-shadow:none;}
.tclg-input::placeholder{color:#9AA6B0;}
.tclg-field input:-webkit-autofill,.tclg-field input:-webkit-autofill:hover,.tclg-field input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 1000px #F2F5F7 inset;box-shadow:0 0 0 1000px #F2F5F7 inset;-webkit-text-fill-color:#12303F;caret-color:#12303F;transition:background-color 99999s ease-in-out 0s;}
.tclg-field:focus-within input:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px #fff inset;box-shadow:0 0 0 1000px #fff inset;}
.tclg-eye{cursor:pointer;flex-shrink:0;color:#9AA6B0;}
.tclg-btn{width:100%;background:#0578A6;color:#fff;border:none;border-radius:11px;padding:14px;font-size:14.5px;font-weight:600;line-height:1.2;cursor:pointer;font-family:inherit;box-shadow:0 12px 28px -14px rgba(5,120,166,.8);transition:background .2s,box-shadow .2s,transform .12s;margin:0;}
.tclg-btn:hover{background:#036690;box-shadow:0 16px 34px -14px rgba(3,73,100,.7);}
.tclg-btn:active{transform:translateY(1px);}
.tclg-btn:disabled{opacity:.55;cursor:default;box-shadow:none;}
.tclg-linkrow{text-align:center;margin-top:18px;}
.tclg-link{background:none;border:none;font-family:inherit;font-size:12.5px;font-weight:500;line-height:1.3;color:#0578A6;text-decoration:none;cursor:pointer;padding:0;margin:0;transition:color .2s;box-shadow:none;}
.tclg-link:hover{color:#036690;}
.tclg-or{display:flex;align-items:center;gap:12px;margin-top:18px;}
.tclg-or .ln{flex:1;height:1px;background:#E7EDF0;}
.tclg-or .tx{font-size:10px;letter-spacing:.14em;color:#9AA6B0;font-weight:600;line-height:1.3;}
.tclg-2nd{display:flex;align-items:center;justify-content:center;gap:9px;margin-top:16px;padding:12px;border:1px solid #CDE8EF;border-radius:11px;font-size:13px;font-weight:600;line-height:1.2;color:#0578A6;background:#F4FAFC;cursor:pointer;font-family:inherit;width:100%;transition:background .2s;}
.tclg-2nd:hover{background:#EAF6FA;}
.tclg-hint{font-size:12px;color:#7C8893;line-height:1.5;margin:0 0 14px;}
.tclg-hint b{color:#12303F;}
.tclg-code{letter-spacing:8px;text-align:center;font-size:18px;font-weight:600;height:24px;line-height:24px;}
.tclg-backrow{display:flex;justify-content:space-between;margin-top:16px;}
.tclg-er{font-size:12.5px;color:#E4483A;margin-top:14px;text-align:center;line-height:1.45;}
.tclg-ok{font-size:12.5px;color:#188F7F;margin-top:14px;text-align:center;line-height:1.45;}
.tclg-foot{position:absolute;bottom:calc(18px + env(safe-area-inset-bottom));left:0;right:0;text-align:center;font-size:11px;line-height:1.2;color:rgba(234,245,251,.55);font-family:'IBM Plex Mono',monospace;z-index:2;}
input.tclg-input:-webkit-autofill,input.tclg-input:-webkit-autofill:hover,input.tclg-input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 1000px #F2F5F7 inset;-webkit-text-fill-color:#12303F;caret-color:#12303F;transition:background-color 999999s;}
.tclg-field:focus-within input.tclg-input:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px #fff inset;}
@media (prefers-reduced-motion:reduce){.tclg-card,.tclg-orb1,.tclg-orb2{animation:none;}}
@media (max-width:440px){.tclg-head{padding:26px 24px 14px;}.tclg-body{padding:4px 24px 24px;}.tclg-foot{font-size:10px;}}
`;
const IcMail=()=>(<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8B97A2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7 12 13l8.5-6"/></svg>);
const IcLock=()=>(<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8B97A2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>);
const IcKey=()=>(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="10" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2"/></svg>);
const IcEye=({off})=>(off
  ? (<svg className="tclg-eye" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7c1.7 0 3.2.5 4.5 1.2"/><path d="M9.9 9.9a2.6 2.6 0 0 0 3.7 3.7"/><path d="M21.4 14.6C22 13.7 22 12 22 12s-1.2-2.4-3.4-4"/><path d="m3 3 18 18"/></svg>)
  : (<svg className="tclg-eye" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="2.6"/></svg>));


const LB=({t,children})=><div style={{marginBottom:6}}><p style={{fontSize:10,color:S.ts,margin:"0 0 2px",textTransform:"uppercase",letterSpacing:.5}}>{t}</p>{children}</div>;
function Login({onLogin}){
  useEffect(()=>{if(!document.getElementById("tclg-fonts")){const l=document.createElement("link");l.id="tclg-fonts";l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap";document.head.appendChild(l);}},[]);
  const SS=(k,d)=>{try{const v=sessionStorage.getItem(k);return v==null?d:v;}catch{return d;}};
  const[mode,setMode0]=useState(()=>SS("tc:lmode","login"));
  const setMode=m=>{try{sessionStorage.setItem("tc:lmode",m);}catch{}setMode0(m);};
  const[email,setEmail0]=useState(()=>SS("tc:lemail",""));const setEmail=v=>{try{sessionStorage.setItem("tc:lemail",v);}catch{}setEmail0(v);};const[pw,setPw]=useState("");
  const[code,setCode]=useState("");const[np,setNp]=useState("");const[np2,setNp2]=useState("");
  const[lo,setLo]=useState(false);const[er,setEr]=useState("");const[ok,setOk]=useState("");const[showPw,setShowPw]=useState(false);
  const post=async(ep,b)=>{const r=await fetch(`${API}/${ep}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)});const d=await r.json().catch(()=>({}));return{r,d};};
  const doLogin=async()=>{if(!email.trim()||!pw)return;setLo(true);setEr("");try{const{r,d}=await post("login",{email:email.trim().toLowerCase(),password:pw});if(r.ok&&d.ok&&d.session){try{sessionStorage.removeItem("tc:lmode");sessionStorage.removeItem("tc:lemail");}catch{}onLogin(d.session,{id:d.userId,name:d.name,role:d.role,email:d.email});}else setEr(d.error||"E-mail ou senha incorretos.");}catch(e){setEr("Erro de conexão. Verifique a internet.");}setLo(false);};
  const doForgot=async()=>{if(!email.trim())return;setLo(true);setEr("");setOk("");try{const{r,d}=await post("forgot",{email:email.trim().toLowerCase()});if(r.ok&&d.ok){setMode("reset");setOk("Se o e-mail estiver cadastrado, enviamos um código de 6 dígitos.");}else setEr(d.error||"Não consegui enviar o código agora.");}catch(e){setEr("Erro de conexão. Verifique a internet.");}setLo(false);};
  const doReset=async()=>{if(!code.trim()||!np)return;if(np!==np2){setEr("As senhas não conferem.");return;}if(np.length<8){setEr("A nova senha precisa ter ao menos 8 caracteres.");return;}setLo(true);setEr("");setOk("");try{const{r,d}=await post("reset",{email:email.trim().toLowerCase(),code:code.trim(),password:np});if(r.ok&&d.ok){setMode("login");setPw("");setCode("");setNp("");setNp2("");setOk("Senha redefinida! Entre com a nova senha.");}else setEr(d.error||"Não foi possível redefinir.");}catch(e){setEr("Erro de conexão. Verifique a internet.");}setLo(false);};
  const nav=m=>{setEr("");setOk("");setMode(m);};
  const linkStyle={background:"none",border:"none",color:S.pri,fontSize:13,cursor:"pointer",padding:0,textDecoration:"underline"};
  return(<div className="tclg">
    <style dangerouslySetInnerHTML={{__html:TCLG_CSS}}/>
    <div className="tclg-grid"/>
    <div className="tclg-orb1"/>
    <div className="tclg-orb2"/>
    <div className="tclg-card">
      <div className="tclg-head">
        <JordanLogo color="#0578A6" height={72}/>
        <div className="tclg-title">TeamCheck</div>
        <div className="tclg-sub">Representação Inteligente · Jordan Representações</div>
      </div>
      <div className="tclg-body">
        {mode==="login"&&<>
          <label className="tclg-label">E-mail</label>
          <div className="tclg-field"><IcMail/><input className="tclg-input" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" onKeyDown={e=>e.key==="Enter"&&doLogin()}/></div>
          <label className="tclg-label">Senha</label>
          <div className="tclg-field"><IcLock/><input className="tclg-input" type={showPw?"text":"password"} autoComplete="current-password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Sua senha" onKeyDown={e=>e.key==="Enter"&&doLogin()}/><span onClick={()=>setShowPw(v=>!v)} style={{display:"inline-flex",color:showPw?"#0578A6":"#9AA6B0"}}><IcEye off={showPw}/></span></div>
          <button className="tclg-btn" onClick={doLogin} disabled={lo||!email.trim()||!pw}>{lo?"Entrando...":"Entrar"}</button>
          <div className="tclg-linkrow"><button className="tclg-link" onClick={()=>nav("forgot")}>Esqueci a senha</button></div>
          <div className="tclg-or"><span className="ln"/><span className="tx">OU</span><span className="ln"/></div>
          <button className="tclg-2nd" onClick={()=>{if(!email.trim()){setEr("Digite seu e-mail acima primeiro.");return;}nav("reset");}}><IcKey/> Primeiro acesso — tenho um código</button>
        </>}
        {mode==="forgot"&&<>
          <p className="tclg-hint">Digite seu e-mail que enviaremos um código de 6 dígitos para redefinir a senha.</p>
          <label className="tclg-label">E-mail</label>
          <div className="tclg-field"><IcMail/><input className="tclg-input" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" onKeyDown={e=>e.key==="Enter"&&doForgot()}/></div>
          <button className="tclg-btn" onClick={doForgot} disabled={lo||!email.trim()}>{lo?"Enviando...":"Enviar código"}</button>
          <div className="tclg-linkrow"><button className="tclg-link" onClick={()=>nav("login")}>Voltar ao login</button></div>
        </>}
        {mode==="reset"&&<>
          <p className="tclg-hint">Enviamos um código para <b>{email}</b>. Digite o código e crie a nova senha.</p>
          <label className="tclg-label">Código (6 dígitos)</label>
          <div className="tclg-field"><IcKey/><input className="tclg-input tclg-code" type="text" inputMode="numeric" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,""))} placeholder="000000"/></div>
          <label className="tclg-label">Nova senha</label>
          <div className="tclg-field"><IcLock/><input className="tclg-input" type="password" autoComplete="new-password" value={np} onChange={e=>setNp(e.target.value)} placeholder="Mínimo 8 caracteres"/></div>
          <label className="tclg-label">Confirmar nova senha</label>
          <div className="tclg-field"><IcLock/><input className="tclg-input" type="password" autoComplete="new-password" value={np2} onChange={e=>setNp2(e.target.value)} placeholder="Repita a senha" onKeyDown={e=>e.key==="Enter"&&doReset()}/></div>
          <button className="tclg-btn" onClick={doReset} disabled={lo||!code.trim()||!np||!np2}>{lo?"Redefinindo...":"Redefinir senha"}</button>
          <div className="tclg-backrow"><button className="tclg-link" onClick={()=>nav("forgot")}>Reenviar código</button><button className="tclg-link" onClick={()=>nav("login")}>Voltar ao login</button></div>
        </>}
        {er&&<p className="tclg-er">{er}</p>}
        {ok&&<p className="tclg-ok">{ok}</p>}
      </div>
    </div>
    <div className="tclg-foot">teamcheck.jordanmt.com</div>
  </div>);
}

// ─── Primitivos visuais padrão Dashboard (usados por todas as abas) ───
// Cartão KPI: rótulo maiúsculo + número em IBM Plex Mono (fiel ao Dashboard/mockup)
const Kpi=({k,v,u})=><div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:10,padding:"12px 14px"}}>
  <div style={{fontSize:12.5,color:S.t2,marginBottom:6}}>{k}</div>
  <div className="num" style={{fontSize:22,fontWeight:600,color:S.txt,lineHeight:1.1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v}{u&&<span style={{fontSize:13,color:S.td,fontWeight:400,marginLeft:4}}>{u}</span>}</div>
</div>;
// Controle segmentado (trilho alt + pílula ativa clara com sombra) — padrão do mockup
const SegTabs=({items,value,onChange,size=13})=><div style={{display:"flex",gap:5,background:S.cl,border:`1px solid ${S.brd}`,borderRadius:11,padding:4}}>
  {items.map(([id,l])=><button key={id} onClick={()=>onChange(id)} style={{flex:1,textAlign:"center",padding:"8px 6px",borderRadius:8,fontSize:size,fontWeight:value===id?600:500,background:value===id?"var(--card-solid)":"transparent",color:value===id?S.pl:S.ts,border:"none",boxShadow:value===id?"0 1px 2px rgba(3,73,100,.14)":"none",cursor:"pointer",whiteSpace:"nowrap"}}>{l}</button>)}
</div>;
// Chip pílula de filtro
const Chip=({on,color=S.pl,children,onClick})=><button onClick={onClick} style={{padding:"6px 13px",borderRadius:20,fontSize:12,fontWeight:on?600:500,background:on?(color==="#fff"?S.pl:color):S.inp,color:on?"#fff":S.ts,border:on?"none":`1px solid ${S.inpBdr}`,cursor:"pointer",whiteSpace:"nowrap"}}>{children}</button>;

// ─── Seletores com busca por digitação (padrão Dashboard) ───
// Normaliza opções: aceita ["A","B"] ou [["a","Rótulo A"],["b","Rótulo B"]]
const normOpts=(opts)=>(opts||[]).map(o=>Array.isArray(o)?o:[o,o]);
const panelBase={zIndex:9999,background:"var(--card-solid)",border:`1px solid ${S.brd}`,borderRadius:10,boxShadow:"0 16px 40px rgba(0,0,0,.4)",overflow:"hidden"};
const srchBox={display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderBottom:`1px solid ${S.brd}`,background:S.cl};
const srchInp={flex:1,border:"none",background:"transparent",fontSize:13,color:S.txt,outline:"none",padding:0};
// Ancora o painel ao botão (posição fixa recalculada em scroll/resize) — evita sobreposição por contexto de empilhamento (backdrop-filter dos cards)
function useAnchorRect(open){
  const btnRef=useRef(null);const[rect,setRect]=useState(null);
  useEffect(()=>{if(!open){setRect(null);return;}
    const m=()=>{const el=btnRef.current;if(el)setRect(el.getBoundingClientRect());};
    m();window.addEventListener("scroll",m,true);window.addEventListener("resize",m);
    return()=>{window.removeEventListener("scroll",m,true);window.removeEventListener("resize",m);};
  },[open]);
  return[btnRef,rect];
}
function useOutside(open,close,btnRef,panelRef){
  useEffect(()=>{if(!open)return;const h=e=>{if(btnRef.current&&btnRef.current.contains(e.target))return;if(panelRef.current&&panelRef.current.contains(e.target))return;close();};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[open]);
}

// SELECT único com busca por digitação (substitui <select> nativo)
function SearchSelect({value,onChange,options,placeholder="Selecione",style}){
  const opts=useMemo(()=>normOpts(options),[options]);
  const[open,setOpen]=useState(false);const[q,setQ]=useState("");
  const[btnRef,rect]=useAnchorRect(open);const panelRef=useRef(null);
  const close=()=>{setOpen(false);setQ("");};
  useOutside(open,close,btnRef,panelRef);
  const cur=opts.find(o=>o[0]===value);const label=cur?cur[1]:placeholder;const isPlaceholder=!cur||cur[0]==="";
  const filt=q.trim()?opts.filter(o=>o[1].toLowerCase().includes(q.trim().toLowerCase())):opts;
  return(<div style={{position:"relative",...style}}>
    <button ref={btnRef} type="button" onClick={()=>{setOpen(o=>!o);setQ("");}} style={{width:"100%",display:"flex",alignItems:"center",gap:6,background:S.inp,border:`1px solid ${open?S.pri:S.inpBdr}`,borderRadius:10,padding:"8px 10px",fontSize:12.5,color:isPlaceholder?S.ts:S.txt,cursor:"pointer",textAlign:"left"}}>
      <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</span>
      <ChevronDown size={15} color={S.td} style={{flexShrink:0,transform:open?"rotate(180deg)":"none",transition:"transform .15s"}}/>
    </button>
    {open&&rect&&createPortal(<div ref={panelRef} style={{position:"fixed",top:rect.bottom+4,left:rect.left,width:Math.max(rect.width,180),...panelBase}}>
      <div style={srchBox}><Search size={14} color={S.td}/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar..." style={srchInp}/></div>
      <div style={{maxHeight:260,overflowY:"auto"}}>
        {filt.length===0&&<p style={{margin:0,padding:"12px",fontSize:12.5,color:S.ts,textAlign:"center"}}>Nada encontrado</p>}
        {filt.map(([v,l])=><button key={v} type="button" onClick={()=>{onChange(v);close();}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",textAlign:"left",background:v===value?S.pri+"18":"transparent",border:"none",borderBottom:`1px solid ${S.cl}`,padding:"9px 12px",fontSize:12.5,color:v===value?S.pl:S.txt,fontWeight:v===value?700:400,cursor:"pointer"}}>
          <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l}</span>
          {v===value&&<Check size={14} color={S.pri} style={{flexShrink:0}}/>}
        </button>)}
      </div>
    </div>,document.body)}
  </div>);
}

// MULTI-SELECT com busca (checkboxes) — usado para agrupar botões de status
function MultiSelect({values,onChange,options,placeholder="Selecione",allLabel="Todos",colorFor,style}){
  const opts=useMemo(()=>normOpts(options),[options]);
  const sel=values||[];
  const[open,setOpen]=useState(false);const[q,setQ]=useState("");
  const[btnRef,rect]=useAnchorRect(open);const panelRef=useRef(null);
  const close=()=>{setOpen(false);setQ("");};
  useOutside(open,close,btnRef,panelRef);
  const toggle=(v)=>{onChange(sel.includes(v)?sel.filter(x=>x!==v):[...sel,v]);};
  const filt=q.trim()?opts.filter(o=>o[1].toLowerCase().includes(q.trim().toLowerCase())):opts;
  const label=sel.length===0?allLabel:sel.length===1?(opts.find(o=>o[0]===sel[0])?.[1]||sel[0]):`${sel.length} selecionados`;
  return(<div style={{position:"relative",...style}}>
    <button ref={btnRef} type="button" onClick={()=>{setOpen(o=>!o);setQ("");}} style={{width:"100%",display:"flex",alignItems:"center",gap:6,background:sel.length?S.pri+"14":S.inp,border:`1px solid ${open?S.pri:sel.length?S.pri+"88":S.inpBdr}`,borderRadius:10,padding:"8px 10px",fontSize:12.5,color:sel.length?S.pl:S.ts,fontWeight:sel.length?600:400,cursor:"pointer",textAlign:"left"}}>
      <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{placeholder}: {label}</span>
      <ChevronDown size={15} color={sel.length?S.pri:S.td} style={{flexShrink:0,transform:open?"rotate(180deg)":"none",transition:"transform .15s"}}/>
    </button>
    {open&&rect&&createPortal(<div ref={panelRef} style={{position:"fixed",top:rect.bottom+4,left:rect.left,width:Math.max(rect.width,200),...panelBase}}>
      <div style={srchBox}><Search size={14} color={S.td}/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar..." style={srchInp}/>{sel.length>0&&<button type="button" onClick={()=>onChange([])} title="Limpar" style={{background:"transparent",border:"none",cursor:"pointer",padding:0,display:"flex"}}><X size={15} color={S.dng}/></button>}</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,padding:"7px 12px",borderBottom:`1px solid ${S.cl}`}}>
        <span style={{fontSize:10.5,color:S.td}}>{sel.length} de {opts.length}</span>
        <div style={{display:"flex",gap:12}}>
          <button type="button" onClick={()=>onChange([...new Set([...sel,...filt.map(o=>o[0])])])} style={{background:"transparent",border:"none",padding:0,cursor:"pointer",fontSize:11,fontWeight:700,color:S.pl}}>Selecionar todos</button>
          {sel.length>0&&<button type="button" onClick={()=>{const vis=new Set(filt.map(o=>o[0]));onChange(sel.filter(v=>!vis.has(v)));}} style={{background:"transparent",border:"none",padding:0,cursor:"pointer",fontSize:11,fontWeight:700,color:S.dng}}>Desmarcar todos</button>}
        </div>
      </div>
      <div style={{maxHeight:280,overflowY:"auto"}}>
        {filt.length===0&&<p style={{margin:0,padding:"12px",fontSize:12.5,color:S.ts,textAlign:"center"}}>Nada encontrado</p>}
        {filt.map(([v,l])=>{const on=sel.includes(v);const dot=colorFor?colorFor(v):null;return(<button key={v} type="button" onClick={()=>toggle(v)} style={{display:"flex",alignItems:"center",gap:9,width:"100%",textAlign:"left",background:on?S.pri+"12":"transparent",border:"none",borderBottom:`1px solid ${S.cl}`,padding:"9px 12px",fontSize:12.5,color:S.txt,cursor:"pointer"}}>
          <span style={{width:17,height:17,borderRadius:5,flexShrink:0,border:`1.5px solid ${on?S.pri:S.inpBdr}`,background:on?S.pri:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{on&&<Check size={12} color="#fff" strokeWidth={3}/>}</span>
          {dot&&<span style={{width:8,height:8,borderRadius:"50%",background:dot,flexShrink:0}}/>}
          <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:on?600:400}}>{l}</span>
        </button>);})}
      </div>
    </div>,document.body)}
  </div>);
}
export { Kpi, SegTabs, Chip, SearchSelect, MultiSelect };

// ─── Calendário moderno (estilo Dashboard) — grade mensal reutilizável ───
const WD=["D","S","T","Q","Q","S","S"];
const MON=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const parseYMD=s=>{if(!s)return null;const[y,m,d]=String(s).split("-").map(Number);if(!y||!m||!d)return null;return new Date(y,m-1,d,12);};
const toYMD=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fmtBR=s=>{const p=parseYMD(s);return p?`${String(p.getDate()).padStart(2,"0")}/${String(p.getMonth()+1).padStart(2,"0")}/${p.getFullYear()}`:"";};

function MonthCalendar({value,onSelect,marks={},today,compact}){
  const sel=parseYMD(value);const base=sel||parseYMD(today)||new Date();
  const[ym,setYm]=useState({y:base.getFullYear(),m:base.getMonth()});
  useEffect(()=>{if(sel){setYm({y:sel.getFullYear(),m:sel.getMonth()});}},[value]);
  const daysInMonth=new Date(ym.y,ym.m+1,0).getDate();
  const startDow=new Date(ym.y,ym.m,1).getDay();
  const cells=[];for(let i=0;i<startDow;i++)cells.push(null);for(let d=1;d<=daysInMonth;d++)cells.push(d);
  const fmt=d=>`${ym.y}-${String(ym.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const prev=()=>setYm(p=>{const m=p.m-1;return m<0?{y:p.y-1,m:11}:{y:p.y,m};});
  const next=()=>setYm(p=>{const m=p.m+1;return m>11?{y:p.y+1,m:0}:{y:p.y,m};});
  const navBtn={width:30,height:30,borderRadius:8,border:`1px solid ${S.inpBdr}`,background:S.inp,color:S.txt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,padding:0};
  const cell=compact?30:38;
  return(<div style={{userSelect:"none"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
      <button type="button" onClick={prev} style={navBtn}>‹</button>
      <div style={{fontSize:compact?13:14.5,fontWeight:700,color:S.pl,letterSpacing:.3}}>{MON[ym.m]} <span style={{color:S.ts,fontWeight:500}}>{ym.y}</span></div>
      <button type="button" onClick={next} style={navBtn}>›</button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:compact?3:5}}>
      {WD.map((w,i)=><div key={i} style={{textAlign:"center",fontSize:10,fontWeight:700,color:S.td,textTransform:"uppercase",letterSpacing:.5,padding:"2px 0"}}>{w}</div>)}
      {cells.map((d,i)=>{if(d===null)return <div key={i}/>;const ds=fmt(d);const isSel=value===ds;const isToday=today===ds;const mk=marks[ds];
        return(<button key={i} type="button" onClick={()=>onSelect&&onSelect(ds)} style={{position:"relative",height:cell,borderRadius:9,border:`1px solid ${isSel?S.pri:isToday?S.pri+"77":"transparent"}`,background:isSel?S.pri:isToday?S.pri+"14":"transparent",color:isSel?"#fff":S.txt,fontSize:compact?12:13,fontWeight:isSel||isToday?700:500,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .1s"}}>
          {d}
          {mk&&<span style={{position:"absolute",bottom:4,left:"50%",transform:"translateX(-50%)",display:"flex",gap:2}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:isSel?"#fff":(typeof mk==="string"?mk:S.gold)}}/>
          </span>}
        </button>);})}
    </div>
  </div>);
}

// Campo de data com popover de calendário (substitui <input type="date"> nativo)
function DateField({value,onChange,placeholder="Data",today,marks,style}){
  const[open,setOpen]=useState(false);
  const[btnRef,rect]=useAnchorRect(open);const panelRef=useRef(null);
  useOutside(open,()=>setOpen(false),btnRef,panelRef);
  const W=300;const left=rect?Math.max(8,Math.min(rect.left,window.innerWidth-W-8)):0;
  // v76: perto do rodapé (ex.: folha de check-out no celular) o calendário abre para CIMA — antes saía da tela
  const PH=400;const top=rect?(rect.bottom+6+PH>window.innerHeight&&rect.top-6-PH>=8?rect.top-6-PH:Math.max(8,Math.min(rect.bottom+6,window.innerHeight-PH-8))):0;
  return(<div style={{position:"relative",...style}}>
    <button ref={btnRef} type="button" onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,background:S.inp,border:`1px solid ${open?S.pri:S.inpBdr}`,borderRadius:10,padding:"9px 11px",fontSize:13,color:value?S.txt:S.ts,cursor:"pointer",textAlign:"left"}}>
      <CalIcon size={15} color={S.td} style={{flexShrink:0}}/>
      <span style={{flex:1}}>{value?fmtBR(value):placeholder}</span>
      <ChevronDown size={14} color={S.td} style={{flexShrink:0,transform:open?"rotate(180deg)":"none"}}/>
    </button>
    {open&&rect&&createPortal(<div ref={panelRef} style={{position:"fixed",top,left,zIndex:9999,background:"var(--card-solid)",border:`1px solid ${S.brd}`,borderRadius:14,boxShadow:"0 16px 40px rgba(0,0,0,.4)",padding:14,width:W,maxHeight:"calc(100vh - 16px)",overflowY:"auto"}}>
      <MonthCalendar value={value} today={today} marks={marks} onSelect={d=>{onChange&&onChange(d);setOpen(false);}}/>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:10,borderTop:`1px solid ${S.cl}`,paddingTop:10}}>
        <button type="button" onClick={()=>{onChange&&onChange("");setOpen(false);}} style={{background:"transparent",border:"none",color:S.dng,fontSize:12,fontWeight:600,cursor:"pointer",padding:0}}>Limpar</button>
        {today&&<button type="button" onClick={()=>{onChange&&onChange(today);setOpen(false);}} style={{background:"transparent",border:"none",color:S.pl,fontSize:12,fontWeight:600,cursor:"pointer",padding:0}}>Hoje</button>}
      </div>
    </div>,document.body)}
  </div>);
}
export { MonthCalendar, DateField };

// ─── Modal único de criação de tarefa (usado na Agenda e no Início) ───
// Mesma seleção de responsável(eis) em chips, igual em todo lugar.
function TarefaModal({ open, onClose, token, user, allOrgs, preOrg = null, onCreated }) {
  const [q, setQ] = useState("");
  const [org, setOrg] = useState(preOrg);
  const [type, setType] = useState("VISITA");
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [users, setUsers] = useState(() => [String(user?.id)]);
  const [lo, setLo] = useState(false);
  useEffect(() => { if (open) { setOrg(preOrg); setUsers([String(user?.id)]); setQ(""); setText(""); setDate(""); setType("VISITA"); setTime("09:00"); } }, [open]);
  const results = useMemo(() => {
    if (!q.trim()) return [];
    const s = q.toLowerCase().replace(/[.\-\/]/g, "");
    return (allOrgs || []).filter(o => [o.name, o.nickname, o.cnpj, o.addr?.city_name, o.addr?.city].filter(Boolean).join(" ").toLowerCase().replace(/[.\-\/]/g, "").includes(s)).slice(0, 8);
  }, [q, allOrgs]);
  const criar = async () => {
    if (!org || !text.trim() || !users.length) return; setLo(true);
    const dueEm = date ? `${date}T${time}:00-04:00` : null;
    const tp = (type || "VISITA").toUpperCase(); const tipoOk = ["VISITA", "LIGACAO", "EMAIL", "REUNIAO", "WHATSAPP", "PROPOSTA", "NOTA"].includes(tp) ? tp : "NOTA";
    for (const uid of users) { const U = USERS.find(u => String(u.id) === String(uid));
      await fetch(`${DASH}/api/crm/atividades`, { method: "POST", headers: { "X-Session": token, "Content-Type": "application/json" }, body: JSON.stringify({ org_id: org.id, cnpj: (org.cnpj || "").replace(/\D/g, "") || null, org_nome: org.nickname || org.name, tipo: tipoOk, texto: text, origem: "tarefa", due_em: dueEm, agendor_id: null, user_id: Number(uid) || null, user_nome: U ? U.n : null }) }).catch(() => {}); }
    setLo(false);
    // v41: com prazo definido, abre AUTOMATICAMENTE o Google Agenda com o evento pré-preenchido
    if (date) { const u = gcalUrl({ titulo: `${tipoOk} — ${org.nickname || org.name}`, detalhes: text, inicio: `${date}T${time}:00-04:00`, local: org.nickname || org.name }); if (u) window.open(u, "_blank", "noopener"); }
    onCreated && onCreated(); onClose && onClose();
  };
  if (!open) return null;
  return createPortal(<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998, padding: 16 }} onMouseDown={e => { if (e.target === e.currentTarget) onClose && onClose(); }}>
    <div style={{ background: "var(--card-solid)", borderRadius: 16, padding: "1.4rem", width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto", border: `1px solid ${S.brd}` }}>
      <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 10px" }}>+ Nova tarefa</p>
      {!org ? <>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar cliente..." autoFocus style={{ width: "100%", marginBottom: 6, fontSize: 13 }} />
        {results.map(o => <div key={o.id} onClick={() => setOrg(o)} style={{ padding: "8px", background: S.cl, borderRadius: 8, marginBottom: 4, cursor: "pointer", fontSize: 12.5 }}><b>{o.nickname || o.name}</b><span style={{ color: S.ts, marginLeft: 6, fontSize: 10 }}>{o.addr?.city_name || o.addr?.city || ""}</span></div>)}
        <button onClick={onClose} style={{ width: "100%", marginTop: 8 }}>Cancelar</button>
      </> : <>
        <div style={{ background: S.cl, borderRadius: 8, padding: 8, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><div style={{ minWidth: 0 }}><p style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{org.nickname || org.name}</p><p style={{ fontSize: 10, color: S.ts, margin: 0 }}>{org.cnpj || ""} · {org.addr?.city_name || org.addr?.city || ""}</p></div>{!preOrg && <button onClick={() => setOrg(null)} style={{ fontSize: 11, color: S.pl, background: "transparent", border: "none", cursor: "pointer", flexShrink: 0 }}>trocar</button>}</div>
        <LB t="TIPO"><div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 3 }}>{TYPES.map(t => <button key={t.id} onClick={() => setType(t.id)} style={{ padding: 5, fontSize: 9, borderRadius: 6, border: type === t.id ? `2px solid ${S.pri}` : `1px solid ${S.brd}`, background: type === t.id ? S.cl : S.bg, color: type === t.id ? S.pl : S.ts }}>{t.l}</button>)}</div></LB>
        <LB t="DESCRIÇÃO *"><textarea value={text} onChange={e => setText(e.target.value)} rows={2} placeholder="O que precisa ser feito?" style={{ width: "100%" }} /></LB>
        <LB t="PRAZO"><div style={{ display: "flex", gap: 6 }}><DateField value={date} onChange={setDate} today={todayLocal()} placeholder="Escolher data" style={{ flex: 1 }} /><input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ width: 80 }} /></div></LB>
        <LB t="RESPONSÁVEL(EIS)"><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{USERS.map(u => { const on = users.includes(String(u.id)); return <button key={u.id} type="button" onClick={() => setUsers(p => on ? p.filter(x => x !== String(u.id)) : [...p, String(u.id)])} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: on ? 700 : 500, border: on ? "none" : `1px solid ${S.brd}`, background: on ? S.acc : S.bg, color: on ? "#fff" : S.ts, cursor: "pointer" }}>{u.n.split(" ")[0]}</button>; })}</div><p style={{ fontSize: 10.5, color: S.td, margin: "4px 0 0" }}>Marque um ou mais — cria a tarefa para cada responsável.</p></LB>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}><button onClick={onClose} style={{ flex: 1 }}>Cancelar</button><button onClick={criar} disabled={lo || !text.trim() || !users.length} style={{ flex: 1, background: S.acc, border: "none", fontWeight: 600, color: "#fff" }}>{lo ? "..." : "Criar Tarefa"}</button></div>
        {date && <p style={{ fontSize: 10.5, color: S.td, margin: "6px 0 0", textAlign: "center" }}>📅 Ao criar, o evento abre automaticamente no Google Agenda — é só confirmar "Salvar".</p>}
      </>}
    </div>
  </div>, document.body);
}
export { TarefaModal };
// Cores da Matriz RFV (mesmas classes da tela RFV do Dashboard)
const RFVC={"Campeão":S.gold,"Leal":S.ok,"Em Crescimento":S.pri,"Em Risco":"#E76F51","Inativo":S.td};
// Quadradinho de ação 32px com borda (padrão do mockup)
const IQ={width:32,height:32,borderRadius:8,border:`1px solid ${S.inpBdr}`,background:S.inp,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0};
const SRC_={"Em Dia":S.ok,"Momento de Recompra":S.gold,"Atrasado":S.dng};
const OrgCard=memo(function OrgCardBase({org,active,onIn,onOut,onEdit,onPerson,onQuick,onOpen,ldId,plocs,lastVisit,lastOrder,nearRoad,rfvInfo,pend}){
  // v74: linha (não cartão) — nome, local, números em fonte fixa; ações numa fileira discreta
  const isA=active?.orgId===org.id;const a=org.addr||{};const loc=[a.district,[a.city_name||a.city,a.state].filter(Boolean).join("/")].filter(Boolean).join(" · ");
  const catColor=CC[org.cat]||S.ts;const dV=lastVisit?Math.floor((Date.now()-new Date(lastVisit.time))/86400000):null;
  const rotaUrl=()=>{const g=plocs&&plocs[org.id];const dest=g?`${g.lat},${g.lng}`:encodeURIComponent(`${org.nickname||org.name}, ${a.city_name||a.city||""}, ${a.state||"MT"}`);window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`,"_blank","noopener");};
  const IB={width:38,height:36,borderRadius:8,border:"none",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0,color:"var(--t3)"};
  return(<div id={"org-"+org.id} style={{borderBottom:`1px solid var(--hair)`,padding:isA?"12px 12px 10px":"12px 2px 8px",background:isA?S.cl:"transparent",borderRadius:isA?10:0,margin:isA?"4px 0":0}}>
    <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span title={org.cat||""} style={{width:8,height:8,borderRadius:4,background:catColor,flexShrink:0}}/>
          <button onClick={()=>onOpen&&onOpen(org)} title="Abrir ficha do cliente" style={{background:"transparent",border:"none",padding:0,margin:0,cursor:onOpen?"pointer":"default",textAlign:"left",fontWeight:600,fontSize:15,color:S.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>{org.name||org.nickname}</button>
          {pend&&pend.length>0&&<span title={pend.join(" · ")} style={{flexShrink:0,fontSize:11.5,fontWeight:600,color:S.gold,border:`1px solid ${S.gold}66`,borderRadius:4,padding:"0 6px",lineHeight:"18px"}}>{pend.length>1?`${pend.length} pendências`:"pendência"}</span>}
        </div>
        <p style={{fontSize:13,color:S.t2,margin:"3px 0 0 16px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{loc||"Sem endereço"}{org.sector?` · ${org.sector}`:""}</p>
        <div className="num" style={{display:"flex",flexWrap:"wrap",gap:"2px 12px",margin:"4px 0 0 16px",fontSize:11.5,color:S.ts}}>
          <span style={{color:catColor,fontFamily:"inherit"}}>{org.cat||"—"}</span>
          {lastVisit?<span>visita {dV}d · {String(lastVisit.who||"").split(" ")[0]}</span>:<span style={{color:S.dng}}>sem visita</span>}
          {rfvInfo&&rfvInfo.ultima&&<span style={{color:rfvInfo.status==="Atrasado"?S.dng:S.ts}}>compra {rfvInfo.dias}d{rfvInfo.status==="Atrasado"?" · atrasada":rfvInfo.status==="Momento de Recompra"?" · recomprar":""}</span>}
          {rfvInfo&&<span style={{color:RFVC[rfvInfo.rfv]||S.ts}}>{rfvInfo.rfv}</span>}
          {lastOrder&&<span style={{color:S.gold}}>pedido {fD(lastOrder.time)}</span>}
          {org.dist!=null&&org.dist<9999&&<span style={{color:org.distType==="gps"?S.acc:S.ts}}>{nearRoad[org.id]!=null?`${nearRoad[org.id].toFixed(1)} km`:org.dist<1?`${(org.dist*1000).toFixed(0)} m`:`${org.dist.toFixed(1)} km`}{org.distType==="bairro"?" (aprox.)":""}</span>}
          {org.distType==="sem_ref"&&<span>sem localização</span>}
        </div>
      </div>
      {isA?<button onClick={()=>onOut(org)} disabled={ldId===org.id} style={{display:"flex",alignItems:"center",gap:6,flexShrink:0,background:S.dng,color:"#fff",border:"none",borderRadius:8,height:40,padding:"0 14px",fontSize:14,fontWeight:600,cursor:"pointer"}}><LogOut size={15} strokeWidth={2.1}/>{ldId===org.id?"...":"Check-out"}</button>
      :<button onClick={()=>onIn(org)} disabled={!!active||ldId===org.id} style={{display:"flex",alignItems:"center",gap:6,flexShrink:0,background:"transparent",color:active?S.td:S.pl,border:`1px solid ${active?S.brd:S.pri}`,borderRadius:8,height:40,padding:"0 12px",fontSize:14,fontWeight:600,opacity:active?0.5:1,cursor:active?"default":"pointer"}}><LogIn size={15} strokeWidth={2}/>{ldId===org.id?"...":"Check-in"}</button>}
    </div>
    <div style={{display:"flex",gap:2,margin:"4px 0 0 8px"}}>
      {!isA&&<button onClick={()=>onQuick&&onQuick(org)} title="Atendimento a distância (ligação, WhatsApp, e-mail — sem check-in)" aria-label="Atendimento a distância" style={{...IB,width:"auto",padding:"0 10px",gap:6,fontSize:13,color:S.t2}}><Headset size={16} strokeWidth={1.8}/>A distância</button>}
      <button onClick={rotaUrl} title={plocs&&plocs[org.id]?"Navegar (GPS salvo)":"Navegar (busca pelo nome/cidade)"} aria-label="Rota" style={{...IB,color:plocs&&plocs[org.id]?S.acc:"var(--t3)"}}><Navigation size={16} strokeWidth={1.8}/></button>
      {org.cnpj&&<button onClick={()=>window.open(`https://dashboard.jordanmt.com/?cliente=${org.cnpj.replace(/[.\-\/]/g,"")}`,"_blank","noopener")} title="Ver no Dashboard" aria-label="Dashboard" style={IB}><BarChart3 size={16} strokeWidth={1.8}/></button>}
      <button onClick={()=>onEdit&&onEdit(org)} title="Editar" aria-label="Editar" style={IB}><Pencil size={15} strokeWidth={1.8}/></button>
      <button onClick={()=>onPerson&&onPerson(org)} title="Pessoas" aria-label="Pessoas" style={IB}><UserPlus size={16} strokeWidth={1.8}/></button>
    </div>
    {isA&&<p className="num" style={{fontSize:12,color:S.pl,margin:"6px 0 0 16px"}}>em visita desde {fT(active.checkinTime)}</p>}
  </div>);});
function Banner({v,orgs,onClick}){const o=orgs.find(x=>x.id===v.orgId);const[el,setEl]=useState(0);useEffect(()=>{const fn=()=>setEl(mins(v.checkinTime,new Date()));fn();const iv=setInterval(fn,15000);return()=>clearInterval(iv);},[v.checkinTime]);return(<div onClick={onClick} style={{background:S.cl,border:`1px solid ${S.pri}`,borderRadius:12,padding:"10px 14px",marginBottom:12,cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:S.ok}}/><p style={{fontSize:13,fontWeight:500,color:S.pl,margin:0}}>{o?.name||o?.nickname||v.orgName}</p></div><span style={{fontSize:11,color:S.acc}}>Ir ao cliente →</span></div><p style={{fontSize:12,color:S.ts,margin:"3px 0 0 16px"}}>{fT(v.checkinTime)} — {hrsMin(el)}</p></div>);}
// Pendência: sugestões rápidas (o texto é livre)
const PEND_SUGEST=["Enviar expositor","Levar amostras","Material de PDV","Cobrar retorno do pedido","Conferir gôndola","Treinar equipe"];
function NoteModal({org,onSave,onCancel,pendencias,remoto=false,carregandoPend=false}){
  // v74: folha de baixo, visual liso. remoto=true → "Atendimento a distância" (sem check-in):
  // sem o tipo Visita e com próximo contato opcional; as pendências do cliente aparecem do mesmo jeito.
  const pend=pendencias||[];
  const[res,setRes]=useState({});
  const[querPend,setQuerPend]=useState(null);
  const[novas,setNovas]=useState([]);const[novaTxt,setNovaTxt]=useState("");
  const addNova=t=>{const x=String(t??novaTxt).trim();if(!x)return;setNovas(p=>p.includes(x)?p:[...p,x]);setNovaTxt("");};
  const tipos=remoto?TYPES.filter(t=>t.id!=="VISITA"):TYPES;
  const[n,setN]=useState("");const[tp,setTp]=useState(remoto?"LIGACAO":"VISITA");const[nt,setNt]=useState("VISITA");const[nd,setNd]=useState("");const[nh,setNh]=useState("09:00");const[ndsc,setNdsc]=useState("");
  const[querProx,setQuerProx]=useState(remoto?null:true);
  const[sale,setSale]=useState(false);const[brand,setBrand]=useState("");const[saleVal,setSaleVal]=useState("");
  const today=todayLocal();
  const dateValid=nd>=today;const pendVazia=querPend===true&&!novas.length&&!novaTxt.trim();
  const proxOk=querProx===false||(querProx===true&&nd&&dateValid&&!!ndsc.trim());
  const ok=!!n.trim()&&proxOk&&!pendVazia;
  const Obrig=({t="Preenchimento obrigatório"})=><p style={{fontSize:11.5,color:S.dng,margin:"4px 0 0"}}>{t}</p>;
  const Lbl=({c,children,cor})=><p style={{fontSize:13,fontWeight:600,color:cor||S.t2,margin:"0 0 8px"}}>{children}{c&&<span style={{fontWeight:400,color:S.ts}}> · {c}</span>}</p>;
  const sel=(on)=>({height:44,borderRadius:8,fontSize:14,border:`1px solid ${on?S.txt:S.inpBdr}`,background:on?S.txt:"transparent",color:on?S.bg:S.txt,fontWeight:on?600:400});
  const SimNao=({v,set,lSim="Sim",lNao="Não"})=><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",border:`1px solid ${S.inpBdr}`,borderRadius:8,overflow:"hidden"}}>
    <button type="button" aria-pressed={v===true} onClick={()=>set(true)} style={{height:44,border:"none",borderRadius:0,fontSize:14,background:v===true?S.txt:"transparent",color:v===true?S.bg:S.t2,fontWeight:v===true?600:400}}>{lSim}</button>
    <button type="button" aria-pressed={v===false} onClick={()=>set(false)} style={{height:44,border:"none",borderLeft:`1px solid ${S.inpBdr}`,borderRadius:0,fontSize:14,background:v===false?S.txt:"transparent",color:v===false?S.bg:S.t2,fontWeight:v===false?600:400}}>{lNao}</button>
  </div>;
  const enviar=()=>{if(!ok)return;const pendNovas=[...novas,...(querPend===true&&novaTxt.trim()&&!novas.includes(novaTxt.trim())?[novaTxt.trim()]:[])];
    onSave(n,tp,querProx?{nextType:nt,nextDate:nd,nextTime:nh,nextDesc:ndsc}:null,sale?{brand,value:parseFloat(saleVal)||0}:null,{resolvidas:pend.filter(x=>res[x.id]),novas:pendNovas});};
  return createPortal(<div onClick={e=>{if(e.target===e.currentTarget)onCancel();}} style={{position:"fixed",inset:0,background:"rgba(4,10,18,0.66)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:60}}>
  <div role="dialog" aria-modal="true" aria-label={remoto?"Atendimento a distância":"Encerrar visita"} style={{background:S.cardSolid,borderRadius:"16px 16px 0 0",padding:"8px 16px 20px",width:"100%",maxWidth:520,maxHeight:"94vh",overflowY:"auto",display:"flex",flexDirection:"column",gap:18}}>
  <div style={{width:36,height:4,borderRadius:2,background:S.inpBdr,alignSelf:"center"}}/>
  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
    <div style={{minWidth:0}}>
      <p style={{fontWeight:700,fontSize:21,letterSpacing:"-.3px",margin:0,color:S.txt}}>{remoto?"Atendimento a distância":"Encerrar visita"}</p>
      <p style={{fontSize:14,color:S.t2,margin:"3px 0 0"}}>{org?.name||org?.nickname}{remoto&&<span style={{color:S.ts}}> · sem check-in</span>}</p>
    </div>
    <button onClick={onCancel} aria-label="Fechar" style={{width:44,height:44,border:"none",background:"transparent",color:S.t2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><X size={18}/></button>
  </div>
  <div><Lbl>{remoto?"Como foi o contato":"O que foi feito"}</Lbl>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:6}}>{tipos.map(t=><button key={t.id} type="button" aria-pressed={tp===t.id} onClick={()=>setTp(t.id)} style={sel(tp===t.id)}>{t.l}</button>)}</div></div>
  <label style={{display:"block"}}><Lbl c="obrigatória">Observação</Lbl>
    <textarea value={n} onChange={e=>setN(e.target.value)} placeholder={remoto?"O que foi conversado":"Descreva o atendimento"} rows={3} style={{width:"100%",boxSizing:"border-box",fontSize:15,lineHeight:1.45,padding:12,resize:"none",border:`1px solid ${n.trim()?S.inpBdr:S.dng}`}}/>{!n.trim()&&<Obrig/>}</label>
  <div>
    <label style={{display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:44,borderTop:`1px solid ${S.brd}`,borderBottom:sale?"none":`1px solid ${S.brd}`,cursor:"pointer"}}><span style={{fontSize:15,color:S.txt}}>Houve venda</span><input type="checkbox" checked={sale} onChange={()=>setSale(!sale)} style={{width:22,height:22,accentColor:S.pri}}/></label>
    {sale&&<div style={{display:"flex",gap:6,paddingBottom:10,borderBottom:`1px solid ${S.brd}`}}><select value={brand} onChange={e=>setBrand(e.target.value)} style={{flex:1,height:44}}><option value="">Marca</option>{BRANDS.map(b=><option key={b}>{b}</option>)}</select><input type="number" inputMode="decimal" value={saleVal} onChange={e=>setSaleVal(e.target.value)} placeholder="R$ valor" style={{width:120,height:44,boxSizing:"border-box"}}/></div>}
  </div>
  {(carregandoPend||pend.length>0)&&<div>
    <Lbl cor={S.gold}>{pend.length===1?"Pendência deste cliente":"Pendências deste cliente"}{pend.length>0&&<span style={{fontWeight:400,color:S.ts}}> · resolvida{pend.length>1?"s":""} {remoto?"neste contato":"nesta visita"}?</span>}</Lbl>
    {carregandoPend&&!pend.length&&<p style={{fontSize:13,color:S.ts,margin:0}}>Conferindo pendências…</p>}
    <div style={{display:"flex",flexDirection:"column",gap:12}}>{pend.map(x=>{const ok=!!res[x.id];return(<div key={x.id}>
      <p style={{fontSize:15,fontWeight:600,color:S.txt,margin:0}}>{x.txt}</p>
      <p className="num" style={{fontSize:11.5,color:S.ts,margin:"2px 0 8px"}}>{x.proxima?"próxima visita":`tarefa${x.due_em?` · prazo ${fD1(x.due_em)}`:""}`} · {(x.user_nome||"—").split(" ")[0]} · {fD1(x.criado_em)}</p>
      <SimNao v={ok?true:false} set={v=>setRes(r=>({...r,[x.id]:v}))} lSim="Resolvida" lNao="Continua pendente"/>
    </div>);})}</div>
  </div>}
  <div><Lbl>{remoto?"Deixar algo para o próximo atendimento?":"Deixar algo para a próxima visita?"}</Lbl>
    <SimNao v={querPend} set={v=>{setQuerPend(v);if(!v){setNovas([]);setNovaTxt("");}}}/>
    {querPend===true&&<div style={{marginTop:10,display:"flex",flexDirection:"column",gap:8}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{PEND_SUGEST.map(t=><button key={t} type="button" onClick={()=>addNova(t)} style={{height:36,padding:"0 12px",borderRadius:18,fontSize:13,border:`1px solid ${S.inpBdr}`,background:"transparent",color:S.t2}}>{t}</button>)}</div>
      <div style={{display:"flex",gap:6}}><input value={novaTxt} onChange={e=>setNovaTxt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addNova();}}} placeholder="Ou escreva aqui" aria-label="Pendência" style={{flex:1,minWidth:0,height:44,boxSizing:"border-box",fontSize:15,border:`1px solid ${pendVazia?S.dng:S.inpBdr}`}}/><button type="button" onClick={()=>addNova()} disabled={!novaTxt.trim()} style={{height:44,padding:"0 14px",fontSize:14,fontWeight:600}}>Adicionar</button></div>
      {pendVazia&&<Obrig t={'Escolha uma sugestão ou escreva a pendência — ou marque "Não"'}/>}
      {novas.map(t=><div key={t} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px",background:S.cl,borderRadius:8}}><span style={{flex:1,fontSize:14,color:S.txt}}>{t}</span><button type="button" onClick={()=>setNovas(p=>p.filter(x=>x!==t))} aria-label={"Tirar "+t} style={{border:"none",background:"transparent",color:S.ts,padding:4,display:"flex"}}><X size={15}/></button></div>)}
    </div>}
  </div>
  <div style={{borderTop:`1px solid ${S.brd}`,paddingTop:16}}>
    <Lbl c={remoto?null:"obrigatório"}>Próximo contato</Lbl>
    {remoto&&<div style={{marginBottom:querProx?10:0}}><SimNao v={querProx} set={setQuerProx} lSim="Agendar" lNao="Agora não"/></div>}
    {querProx===true&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:6}}>{TYPES.map(t=><button key={t.id} type="button" aria-pressed={nt===t.id} onClick={()=>setNt(t.id)} style={{...sel(nt===t.id),height:40,fontSize:13.5}}>{t.l}</button>)}</div>
      <div style={{display:"flex",gap:6}}><DateField value={nd} onChange={setNd} today={today} placeholder="Data" style={{flex:1}}/><input type="time" value={nh} onChange={e=>setNh(e.target.value)} aria-label="Hora" className="num" style={{width:96,height:44,boxSizing:"border-box"}}/></div>
      {!nd&&<Obrig t="Escolha a data"/>}{nd&&!dateValid&&<Obrig t="A data não pode ser anterior a hoje"/>}
      <input value={ndsc} onChange={e=>setNdsc(e.target.value)} placeholder="O que fazer no próximo contato" aria-label="Descrição do próximo contato" style={{height:46,boxSizing:"border-box",fontSize:15,border:`1px solid ${ndsc.trim()?S.inpBdr:S.dng}`}}/>{!ndsc.trim()&&<Obrig/>}
    </div>}
    {remoto&&querProx===null&&<Obrig t="Responda se quer agendar o próximo contato"/>}
  </div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:8,position:"sticky",bottom:-20,background:S.cardSolid,padding:"8px 0 0"}}>
    <button onClick={onCancel} style={{height:50,fontSize:15}}>Cancelar</button>
    <button onClick={enviar} disabled={!ok} style={{height:50,fontSize:15,fontWeight:600,background:ok?S.pri:S.cl,border:"none",color:ok?"#fff":S.td}}>{remoto?"Registrar atendimento":"Registrar e sair"}</button>
  </div>
</div></div>,document.body);}
function NewClientModal({token,user,users,allOrgs,onSave,onCancel}){
  const pf=sL("jc:prefill",null);useEffect(()=>{sS("jc:prefill",null);},[]);// Clear prefill after reading
  const[step,setStep]=useState(1);const[orgId,setOrgId]=useState(null);const[orgName,setOrgName]=useState("");const[orgData,setOrgData]=useState(null);
  const[name,setName]=useState(pf?.rfData?.nome_fantasia||"");const[legal,setLegal]=useState(pf?.rfData?.razao_social||"");const[cnpj,setCnpj]=useState(pf?.cnpj||"");const[city,setCity]=useState(pf?.rfData?.municipio||"");const[state,setState]=useState(pf?.rfData?.uf||"MT");const[district,setDistrict]=useState(pf?.rfData?.bairro||"");const[street,setStreet]=useState([pf?.rfData?.descricao_tipo_de_logradouro,pf?.rfData?.logradouro].filter(Boolean).join(" ")||"");const[num,setNum]=useState(pf?.rfData?.numero||"");const[comp,setComp]=useState(pf?.rfData?.complemento||"");const[cep,setCep]=useState(pf?.rfData?.cep||"");const[canal,setCanal]=useState("Presencial");const[ownerId,setOwnerId]=useState(()=>user?.id?String(user.id):"");const[phone,setPhone]=useState(pf?.rfData?.ddd_telefone_1?.replace(/[^\d]/g,"")||"");
  const[catId,setCatId]=useState(3186598);const[sectorId,setSectorId]=useState("");const[originId,setOriginId]=useState("");const[grupo,setGrupo]=useState("");const[newGrupo,setNewGrupo]=useState("");
  const[lo,setLo]=useState(false);const[er,setEr]=useState("");const[fetching,setFetching]=useState(false);
  const[pName,setPName]=useState("");const[pEmail,setPEmail]=useState("");const[pPhone,setPPhone]=useState("");const[pWhats,setPWhats]=useState("");
  const buscarCNPJ=async()=>{const c=cnpj.replace(/[.\-\/]/g,"");if(c.length!==14){setEr("CNPJ deve ter 14 digitos");return;}setFetching(true);setEr("");try{const d=await fetchCNPJ(c);setName(d.nome_fantasia||"");setLegal(d.razao_social||"");setStreet([d.descricao_tipo_de_logradouro,d.logradouro].filter(Boolean).join(" ")||"");setNum(d.numero||"");setComp(d.complemento||"");setDistrict(d.bairro||"");setCity(d.municipio||"");setState(d.uf||"MT");setCep(d.cep||"");if(d.ddd_telefone_1)setPhone(d.ddd_telefone_1.replace(/[^\d]/g,""));}catch(e){setEr(e.message);}setFetching(false);};
  // Endereço no MESMO formato da base: "Rua, Número - Complemento"
  const ruaCompleta=()=>{let e=(street||"").trim();const n=(num||"").trim();const c=(comp||"").trim();
    if(n)e=e?`${e}, ${n}`:n; if(c)e=e?`${e} - ${c}`:c; return e;};
  const ownerNome=()=>ownerId?(((users||[]).find(u=>u.id===parseInt(ownerId))||{}).n||null):null;
  const createOrg=async()=>{if(!name.trim()&&!legal.trim())return;setLo(true);setEr("");try{const body={name:name.trim()||legal.trim(),legalName:legal.trim()};if(cnpj)body.cnpj=cnpj.replace(/[.\-\/]/g,"");const addr={};if(street)addr.street_name=street;const numOk=num&&/\d/.test(num);if(numOk)addr.street_number=num;const _ai=[comp,(num&&!numOk)?num:""].filter(Boolean).join(" ");if(_ai)addr.additional_info=_ai;if(district)addr.district=district;if(city)addr.city=city;if(state)addr.state=state;if(cep)addr.postal_code=cep;if(Object.keys(addr).length)body.address=addr;if(phone)body.contact={work:phone};if(catId)body.category=catId;if(sectorId)body.sector=parseInt(sectorId);if(originId)body.leadOrigin=parseInt(originId);const gFinal=grupo==="__new__"?newGrupo.trim():grupo;if(gFinal)body.description=`Grupo: ${gFinal}`;const cnpjD=cnpj?cnpj.replace(/[.\-\/]/g,""):null;const catNome=catId?(CAT_IDS.find(c=>c.id===catId)?.n||null):null;const segNome=sectorId?(SECTORS.find(s=>s.id===parseInt(sectorId))?.n||null):null;const r=await fetch(`${DASH}/api/crm/cliente-criar`,{method:"POST",headers:{"X-Session":token,"Content-Type":"application/json"},body:JSON.stringify({cnpj:cnpjD,fantasia:name.trim()||legal.trim(),razao:legal.trim()||null,cidade:city||null,uf:state||null,segmento:segNome,grupo:gFinal||null,categoria_id:catId||null,categoria_nome:catNome,telefone:phone||null,rua:ruaCompleta()||null,bairro:bairroCanon(allOrgs,city,district)||null,cep:cep?cep.replace(/\D/g,""):null,email:null,canal,vendedor:ownerNome()})});const dd=await r.json();if(dd&&dd.ok&&dd.id){const st_={id:dd.id,canal,name:name.trim()||legal.trim(),nickname:name.trim()||"",legalName:legal.trim()||"",cnpj:cnpjD||"",cat:catNome||"",catId:catId||null,sector:segNome||"",owner:ownerNome()||"",ownerId:ownerId?parseInt(ownerId):null,grupo:gFinal?`Grupo: ${gFinal}`:"",addr:{street:street||"",number:num||"",district:district||"",city:city||"",city_name:city||"",state:state||""},email:"",phone:phone||"",ranking:0,excluido:0,products:""};setOrgId(dd.id);setOrgName(st_.name);setOrgData(st_);setStep(2);}else setEr("Erro ao criar (D1)");}catch(e){setEr(e.message||"Erro");}setLo(false);};
  const[pCargo,setPCargo]=useState("");
  const existGrp=useMemo(()=>[...new Set((allOrgs||[]).map(o=>fixMojibake(o.grupo?.replace("Grupo: ","")||"")).filter(Boolean))].sort(),[allOrgs]);
  const finish=(wp)=>{const od=orgData||strip({id:orgId,name:orgName||name,legalName:legal,cnpj,address:{city,state,district},category:{id:catId,name:CAT_IDS.find(c=>c.id===catId)?.n},sector:{id:parseInt(sectorId),name:SECTORS.find(s=>s.id===parseInt(sectorId))?.n}});if(wp&&pName.trim()){setLo(true);crmFire(token,"/api/crm/contatos",{org_id:orgId,cnpj:(cnpj||"").replace(/\D/g,"")||null,nome:pName,cargo:pCargo||null,telefone:pPhone||null,whatsapp:pWhats||null,email:pEmail||null});setLo(false);setOrgData(od);setStep(3);}else{setOrgData(od);setStep(3);}};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.cardSolid,borderRadius:16,padding:"1.25rem",width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}>
  {step===1?<><p style={{fontWeight:600,fontSize:16,margin:"0 0 2px"}}>Novo Cliente — Empresa</p><p style={{fontSize:11,color:S.ts,margin:"0 0 10px"}}>Etapa 1 de 3</p>
  <LB t="CNPJ"><div style={{display:"flex",gap:6}}><input value={cnpj} onChange={e=>setCnpj(e.target.value)} placeholder="00.000.000/0000-00" style={{flex:1}} onKeyDown={e=>e.key==="Enter"&&buscarCNPJ()}/><button onClick={buscarCNPJ} disabled={fetching} style={{padding:"8px 12px",background:S.acc,border:"none",fontWeight:600,fontSize:11}}>{fetching?"...":"Buscar"}</button></div></LB>
  {fetching&&<p style={{fontSize:11,color:S.acc,margin:"-4px 0 4px"}}>Consultando Receita Federal...</p>}
  <LB t="NOME FANTASIA"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Preencha o nome fantasia" style={{width:"100%"}}/></LB>
  <LB t="RAZÃO SOCIAL"><input value={legal} onChange={e=>setLegal(e.target.value)} style={{width:"100%"}}/></LB>
  <LB t="ENDEREÇO / Nº"><div style={{display:"flex",gap:6}}><input value={street} onChange={e=>setStreet(e.target.value)} style={{flex:1}}/><input value={num} onChange={e=>setNum(e.target.value)} placeholder="Nº" style={{width:50}}/></div></LB>
  <LB t="COMPLEMENTO / CEP"><div style={{display:"flex",gap:6}}><input value={comp} onChange={e=>setComp(e.target.value)} style={{flex:1}}/><input value={cep} onChange={e=>setCep(e.target.value)} placeholder="CEP" style={{width:85}}/></div></LB>
  <LB t="BAIRRO"><input value={district} onChange={e=>setDistrict(e.target.value)} style={{width:"100%"}}/></LB>
  <LB t="CIDADE / UF"><div style={{display:"flex",gap:6}}><input value={city} onChange={e=>setCity(e.target.value)} style={{flex:1}}/><select value={state} onChange={e=>setState(e.target.value)} style={{width:60}}><option>MT</option><option>MS</option><option>PA</option><option>GO</option><option>RO</option><option>TO</option></select></div></LB>
  <LB t="TELEFONE"><input value={phone} onChange={e=>setPhone(e.target.value)} style={{width:"100%"}}/></LB>
  <LB t="CATEGORIA"><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{CAT_IDS.filter(c=>!CAT_MOTOR.includes(c.n)).map(c=><button key={c.id} type="button" onClick={()=>setCatId(c.id)} style={{padding:"4px 10px",fontSize:10,border:catId===c.id?`2px solid ${CC[c.n]||S.pri}`:`1px solid ${S.brd}`,background:catId===c.id?`${CC[c.n]||S.pri}22`:"transparent",color:catId===c.id?CC[c.n]||S.pri:S.ts,borderRadius:6,fontWeight:catId===c.id?600:400}}>{c.n}</button>)}</div>
    <p style={{fontSize:9.5,color:S.td,margin:"4px 0 0",lineHeight:1.45}}>Ativo · Inativo · Perdido ficam por conta do <b>Motor de Status</b> — assim que o cliente comprar, ele vira Ativo sozinho.</p></LB>
  <LB t="CANAL"><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{CANAIS.map(c=><button key={c} type="button" onClick={()=>setCanal(c)} style={{padding:"4px 10px",fontSize:10,border:canal===c?`2px solid ${S.acc}`:`1px solid ${S.brd}`,background:canal===c?S.acc+"22":"transparent",color:canal===c?S.acc:S.ts,borderRadius:6,fontWeight:canal===c?600:400}}>{c}</button>)}</div></LB>
  <LB t="RESPONSÁVEL"><select value={ownerId} onChange={e=>setOwnerId(e.target.value)} style={{width:"100%",fontSize:12,border:ownerId?undefined:`1px solid ${S.gold}`}}><option value="">Sem responsável</option>{(users||[]).map(u=><option key={u.id} value={u.id}>{u.n}</option>)}</select>
    {!ownerId&&<p style={{fontSize:9.5,color:S.gold,margin:"3px 0 0"}}>⚠️ Sem responsável, o cliente não aparece nos filtros de equipe nem no Relatório.</p>}</LB>
  <LB t="ORIGEM"><select value={originId} onChange={e=>setOriginId(e.target.value)} style={{width:"100%",fontSize:11}}><option value="">Origem</option>{ORIGINS.map(o=><option key={o.id} value={o.id}>{o.n}</option>)}</select></LB>
  <LB t="SETOR / GRUPO"><div style={{display:"flex",gap:6}}><select value={sectorId} onChange={e=>setSectorId(e.target.value)} style={{flex:1,fontSize:11}}><option value="">Setor</option>{SECTORS.map(s=><option key={s.id} value={s.id}>{s.n}</option>)}</select><select value={grupo} onChange={e=>setGrupo(e.target.value)} style={{flex:1,fontSize:11}}><option value="">Grupo</option><option value="__new__">➕ Novo</option>{existGrp.map(g=><option key={g} value={g}>{g}</option>)}</select></div>{grupo==="__new__"&&<input value={newGrupo} onChange={e=>setNewGrupo(e.target.value)} placeholder="Nome do grupo" style={{width:"100%",marginTop:4,fontSize:11}}/>}</LB>
  {er&&<p style={{fontSize:12,color:S.dng,margin:"0 0 6px"}}>{er}</p>}
  <div style={{display:"flex",gap:8,marginTop:4}}><button onClick={onCancel} style={{flex:1}}>Cancelar</button><button onClick={createOrg} disabled={lo||(!name.trim()&&!legal.trim())} style={{flex:1,background:S.pri,border:"none",fontWeight:600}}>{lo?"Salvando...":"Próximo →"}</button></div>
  </>:step===2?<><p style={{fontWeight:600,fontSize:16,margin:"0 0 2px"}}>Contato — {orgName}</p><p style={{fontSize:11,color:S.ts,margin:"0 0 10px"}}>Etapa 2 de 3 (opcional)</p>
  <LB t="NOME"><input value={pName} onChange={e=>setPName(e.target.value)} placeholder="Nome do responsavel" style={{width:"100%"}}/></LB>
  <LB t="CARGO"><select value={pCargo} onChange={e=>setPCargo(e.target.value)} style={{width:"100%",fontSize:12}}><option value="">Selecione...</option>{cargosDe(sectorId?(SECTORS.find(x=>x.id===parseInt(sectorId))?.n||""):"").map(c=><option key={c} value={c}>{c}</option>)}</select></LB>
  <LB t="E-MAIL"><input value={pEmail} onChange={e=>setPEmail(e.target.value)} type="email" style={{width:"100%"}}/></LB>
  <LB t="TELEFONE"><input value={pPhone} onChange={e=>setPPhone(e.target.value)} style={{width:"100%"}}/></LB>
  <LB t="WHATSAPP"><input value={pWhats} onChange={e=>setPWhats(e.target.value)} style={{width:"100%"}}/></LB>
  <div style={{display:"flex",gap:8,marginTop:4}}><button onClick={()=>finish(false)} style={{flex:1,color:S.ts}}>Pular →</button><button onClick={()=>finish(true)} disabled={lo||!pName.trim()} style={{flex:1,background:S.acc,border:"none",fontWeight:600}}>{lo?"...":"Próximo →"}</button></div>
  </>:<><p style={{fontWeight:600,fontSize:16,margin:"0 0 4px",color:S.ok}}>✅ Cliente cadastrado!</p>
  <div style={{background:S.cl,borderRadius:10,padding:12,margin:"8px 0 12px"}}>
    <p style={{fontSize:14,fontWeight:600,margin:"0 0 2px"}}>{orgData?.name||orgName}</p>
    {orgData?.cnpj&&<p style={{fontSize:11,color:S.ts,margin:"0 0 2px"}}>{orgData.cnpj}</p>}
    <p style={{fontSize:11,color:S.ts,margin:0}}>{orgData?.cat||""} · {orgData?.addr?.city_name||orgData?.addr?.city||city}</p>
  </div>
  <p style={{fontSize:12,color:S.gold,fontWeight:500,margin:"0 0 8px"}}>Abrir atendimento?</p>
  <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:12}}>
    {TYPES.map(t=><button key={t.id} onClick={()=>{const note=prompt(`${t.l} com ${orgData?.name||orgName}:`);if(note?.trim()){crmFire(token,"/api/crm/atividades",{org_id:orgId,cnpj:(orgData?.cnpj||"").replace(/\D/g,"")||null,org_nome:orgData?.name||orgName,tipo:t.id,texto:note});alert("Registrado!");onSave(orgData);}}} style={{padding:10,textAlign:"left",fontSize:12,background:S.bg,border:`1px solid ${S.brd}`,borderRadius:8}}>
      {t.id==="VISITA"?"📍":t.id==="WHATSAPP"?"💬":t.id==="LIGACAO"?"📞":t.id==="EMAIL"?"📧":t.id==="REUNIAO"?"🤝":"📄"} {t.l}
    </button>)}
  </div>
  <button onClick={()=>onSave(orgData)} style={{width:"100%",padding:12,fontWeight:500}}>← Voltar ao app</button></>}
</div></div>);}
// CARGOS agora vem do lib (catálogo "Cargos" das Configurações)
function PeopleModal({org,token,onClose}){
  const[people,setPeople]=useState([]);const[lo,setLo]=useState(true);const[mode,setMode]=useState("list");// list | add | edit
  const[editId,setEditId]=useState(null);
  const[n,setN]=useState("");const[cargo,setCargo]=useState("");const[e,setE]=useState("");const[p,setP]=useState("");const[w,setW]=useState("");const[msg,setMsg]=useState("");const[saving,setSaving]=useState(false);
  const reload=async()=>{try{const r=await fetch(`${DASH}/api/crm/contatos?org_id=${org.id}`,{headers:{"X-Session":token},cache:"no-store"});const d=await r.json();setPeople((d&&d.contatos)||[]);}catch(e){console.warn("contatos:",e);}};
  useEffect(()=>{reload().then(()=>setLo(false));},[]);
  const clear=()=>{setN("");setCargo("");setE("");setP("");setW("");setEditId(null);setMode("list");};
  const openAdd=()=>{clear();setMode("add");setMsg("");};
  const openEdit=(pe)=>{setEditId(pe.id);setN(pe.nome||"");setCargo(pe.cargo||"");setE(pe.email||"");setP((pe.telefone||"").replace(/\D/g,""));setW(pe.whatsapp||"");setMode("edit");setMsg("");};
  const canSave=n.trim()&&e.trim()&&w.trim();
  const save=async()=>{if(!canSave)return;setSaving(true);setMsg("");
    const contact={};if(e.trim())contact.email=e.trim();if(p.trim())contact.mobile=p.trim();if(w.trim())contact.whatsapp=w.trim();
    const body={name:n.trim()};if(cargo)body.role=cargo;if(Object.keys(contact).length)body.contact=contact;
    const payload={nome:n.trim(),cargo:cargo||null,telefone:p.trim()||null,whatsapp:w.trim()||null,email:e.trim()||null};
    try{if(mode==="edit"&&editId){await fetch(`${DASH}/api/crm/contatos`,{method:"PUT",headers:{"X-Session":token,"Content-Type":"application/json"},body:JSON.stringify({id:editId,...payload})});setMsg("Atualizado!");}
    else{await fetch(`${DASH}/api/crm/contatos`,{method:"POST",headers:{"X-Session":token,"Content-Type":"application/json"},body:JSON.stringify({org_id:org.id,cnpj:(org.cnpj||"").replace(/\D/g,"")||null,...payload})});setMsg("Adicionado!");}
    await reload();clear();}catch(x){setMsg("Erro: "+(x.message||x));}setSaving(false);};
  const del=async(pe)=>{if(!confirm(`Excluir ${pe.nome}?`))return;setSaving(true);try{await fetch(`${DASH}/api/crm/contatos?id=${pe.id}`,{method:"DELETE",headers:{"X-Session":token}});await reload();setMsg("Excluído!");}catch(x){setMsg("Erro: "+(x.message||x));}setSaving(false);};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.cardSolid,borderRadius:16,padding:"1.25rem",width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}>
    <p style={{fontWeight:600,fontSize:16,margin:"0 0 2px"}}>👤 Contatos</p>
    <p style={{fontSize:12,color:S.ts,margin:"0 0 12px"}}>{org.name}</p>
    {lo&&<p style={{color:S.ts,textAlign:"center",padding:"1rem 0"}}>Carregando...</p>}
    {!lo&&people.length===0&&mode==="list"&&<p style={{fontSize:12,color:S.ts,padding:"1rem 0",textAlign:"center"}}>Nenhum contato cadastrado</p>}
    {mode==="list"&&people.map(pe=><div key={pe.id} style={{background:S.cl,borderRadius:8,padding:10,marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{flex:1}}>
          <p style={{fontSize:13,fontWeight:600,margin:"0 0 2px"}}>{pe.nome}</p>
          {pe.cargo&&<p style={{fontSize:10,color:S.acc,margin:"0 0 3px"}}>{pe.cargo}</p>}
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {pe.email&&<span style={{fontSize:10,color:S.ts}}>📧 {pe.email}</span>}
            {pe.telefone&&<span style={{fontSize:10,color:S.ts}}>📱 {pe.telefone}</span>}
            {pe.whatsapp&&<a href={`https://wa.me/55${pe.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener" style={{fontSize:10,color:S.ok,textDecoration:"none"}}>💬 {pe.whatsapp}</a>}
          </div>
        </div>
        <div style={{display:"flex",gap:4,flexShrink:0}}>
          <button onClick={()=>openEdit(pe)} style={{fontSize:10,padding:"4px 8px",color:S.pri,background:S.pri+"15",border:`1px solid ${S.pri}33`,borderRadius:6}}>✏️</button>
          <button onClick={()=>del(pe)} disabled={saving} style={{fontSize:10,padding:"4px 8px",color:S.dng,background:S.dng+"15",border:`1px solid ${S.dng}33`,borderRadius:6}}>🗑️</button>
        </div>
      </div>
    </div>)}
    {msg&&<p style={{fontSize:11,color:msg.startsWith("Erro")?S.dng:S.ok,margin:"4px 0"}}>{msg}</p>}
    {mode==="list"&&<button onClick={openAdd} style={{width:"100%",padding:10,fontSize:12,background:S.acc,border:"none",fontWeight:600,marginTop:4}}>+ Adicionar Contato</button>}
    {(mode==="add"||mode==="edit")&&<div style={{background:S.cl,borderRadius:8,padding:10,marginTop:6}}>
      <p style={{fontSize:12,fontWeight:600,margin:"0 0 6px",color:mode==="edit"?S.pri:S.acc}}>{mode==="edit"?"✏️ Editar Contato":"+ Novo Contato"}</p>
      <LB t="NOME *"><input value={n} onChange={x=>setN(x.target.value)} style={{width:"100%",border:`1px solid ${n.trim()?S.brd:S.dng}`}}/></LB>
      <LB t="CARGO"><select value={cargo} onChange={x=>setCargo(x.target.value)} style={{width:"100%",fontSize:12}}><option value="">Selecione...</option>{cargosDe(org?.sector).map(c=><option key={c} value={c}>{c}</option>)}</select></LB>
      <LB t="E-MAIL *"><input value={e} onChange={x=>setE(x.target.value)} type="email" style={{width:"100%",border:`1px solid ${e.trim()?S.brd:S.dng}`}} placeholder="Obrigatório"/></LB>
      <LB t="TELEFONE"><input value={p} onChange={x=>setP(x.target.value)} style={{width:"100%"}}/></LB>
      <LB t="WHATSAPP *"><input value={w} onChange={x=>setW(x.target.value)} style={{width:"100%",border:`1px solid ${w.trim()?S.brd:S.dng}`}} placeholder="Obrigatório"/></LB>
      <div style={{display:"flex",gap:8}}><button onClick={clear} style={{flex:1}}>Cancelar</button><button onClick={save} disabled={saving||!canSave} style={{flex:1,background:canSave?(mode==="edit"?S.pri:S.acc):S.cl,border:"none",fontWeight:600}}>{saving?"...":(mode==="edit"?"Atualizar":"Salvar")}</button></div>
    </div>}
    <button onClick={onClose} style={{width:"100%",marginTop:8}}>Fechar</button>
  </div></div>);}
// Categorias governadas pelo Motor de Status (o usuário não marca à mão)
const CAT_MOTOR=["Ativo","Inativo","Perdido"];
const PRODS=[{id:761952,n:"TRAMONTINA"},{id:761953,n:"PADO"},{id:761954,n:"HIPER TEXTIL"},{id:1139796,n:"PLASTILIT"},{id:1392476,n:"FESTCOLOR"},{id:1627655,n:"ZAGONEL"},{id:2046010,n:"RUVOLO"},{id:2260997,n:"SANTANA"}];
function EditModal({org,token,users,allOrgs,onSave,onClose}){const[name,setName]=useState(org.name||"");const[legal,setLegal]=useState(org.legalName||"");const[endeco,setEndeco]=useState(org.addr?.street||"");const[bairro,setBairro]=useState(org.addr?.district||"");const[cep,setCep]=useState(org.addr?.zip||"");const[catId,setCatId]=useState(()=>{const c=CAT_IDS.find(x=>x.n===org.cat);return c?String(c.id):"";});const[canal,setCanal]=useState(org.canal||"Presencial");const[sectorId,setSectorId]=useState("");const[grupo,setGrupo]=useState(org.grupo?.replace("Grupo: ","")||"");const[newGrupo,setNewGrupo]=useState("");const[grupoSearch,setGrupoSearch]=useState(org.grupo?.replace("Grupo: ","")||"");const[grupoOpen,setGrupoOpen]=useState(false);const[ownerId,setOwnerId]=useState("");
  const existGrp=useMemo(()=>[...new Set((allOrgs||[]).map(o=>fixMojibake(o.grupo?.replace("Grupo: ","")||"")).filter(Boolean))].sort(),[allOrgs]);
  const normP=x=>String(x||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
  const curProds=org.products?org.products.split(",").map(x=>x.trim()).filter(p=>p&&!p.startsWith("P_")).map(normP):[];
  const[selProds,setSelProds]=useState(()=>PRODS.filter(p=>curProds.includes(normP(p.n))).map(p=>p.id));
  const[lo,setLo]=useState(false);const[fetching,setFetching]=useState(false);const[msg,setMsg]=useState("");const[libMotor,setLibMotor]=useState(false);
  const toggleProd=id=>setSelProds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const refresh=async()=>{if(!org.cnpj)return;setFetching(true);setMsg("");try{const d=await fetchCNPJ(org.cnpj);
    setName(d.nome_fantasia||name);setLegal(d.razao_social||"");
    // Receita traz o endereço completo — monta "Rua, Número - Complemento" (mesmo formato da base)
    let e=[d.descricao_tipo_de_logradouro,d.logradouro].filter(Boolean).join(" ").trim();
    const n=(d.numero||"").trim(),c=(d.complemento||"").trim();
    if(n&&n.toUpperCase()!=="SN"&&n.toUpperCase()!=="S/N")e=e?`${e}, ${n}`:n;
    if(c)e=e?`${e} - ${c}`:c;
    if(e)setEndeco(e); if(d.bairro)setBairro(d.bairro); if(d.cep)setCep(String(d.cep).replace(/\D/g,""));
    setMsg(e?"Dados da Receita preenchidos!":"Nome/razão atualizados (a Receita não tem o logradouro deste CNPJ).");
  }catch(e){setMsg("Erro: "+e.message);}setFetching(false);};
  const save=async()=>{setLo(true);setMsg("");try{
    const gFinal=grupo==="__new__"?newGrupo.trim():grupo;
    const catNome=catId?(CAT_IDS.find(c=>c.id===parseInt(catId))?.n||null):(org.cat||null);
    const segNome=sectorId?(SECTORS.find(s=>s.id===parseInt(sectorId))?.n||null):(org.sector||null);
    const ownerNome=ownerId?(((users||[]).find(u=>u.id===parseInt(ownerId))||{}).n||null):(org.owner||null);
    // v25: edição gravada só no D1 (cliente-upsert por org_id/CNPJ). Sem Agendor.
    crmFire(token,"/api/crm/cliente-upsert",{cnpj:(org.cnpj||"").replace(/\D/g,"")||null,org_id:org.id,fantasia:name.trim()||org.name,razao:legal.trim()||null,cidade:org.addr?.city_name||org.addr?.city||null,uf:org.addr?.state||null,segmento:segNome,vendedor:ownerNome,grupo:gFinal||null,categoria_id:catId?parseInt(catId):null,categoria_nome:catNome,endereco:endeco.trim()||null,bairro:bairroCanon(allOrgs,org.addr?.city_name||org.addr?.city,bairro)||null,cep:cep.replace(/\D/g,"")||null,canal:canal||null});
    const st_={...org,canal,name:name.trim()||org.name,nickname:name.trim()||org.nickname,legalName:legal.trim()||org.legalName,cat:catNome||org.cat,catId:catId?parseInt(catId):(org.catId||null),excluido:/exclu/i.test(catNome||"")?1:0,sector:segNome||org.sector,owner:ownerNome||org.owner,grupo:gFinal?`Grupo: ${gFinal}`:(org.grupo||""),addr:{...(org.addr||{}),street:endeco.trim()||org.addr?.street||"",district:bairro.trim()||org.addr?.district||"",zip:cep.replace(/\D/g,"")||org.addr?.zip||""},products:selProds.map(id=>PRODS.find(p=>p.id===id)?.n).filter(Boolean).join(", ")};
    onSave(st_);setMsg("Salvo!");
  }catch(e){setMsg("Erro: "+(e.message||e));}setLo(false);};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.cardSolid,borderRadius:16,padding:"1.25rem",width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><p style={{fontWeight:600,fontSize:16,margin:0}}>Editar Cliente</p>{org.cnpj&&<button onClick={refresh} disabled={fetching} style={{padding:"4px 10px",fontSize:11,background:S.acc+"22",border:`1px solid ${S.acc}`,color:S.acc}}>{fetching?"...":"🔄 RF"}</button>}</div>
  {org.cnpj&&<p style={{fontSize:11,color:S.td,margin:"0 0 8px"}}>CNPJ: {org.cnpj}</p>}
  <LB t="NOME FANTASIA"><input value={name} onChange={e=>setName(e.target.value)} style={{width:"100%"}}/></LB>
  <LB t="RAZÃO SOCIAL"><input value={legal} onChange={e=>setLegal(e.target.value)} placeholder="Toque em 🔄 RF para buscar na Receita" style={{width:"100%"}}/></LB>
  <LB t="ENDEREÇO"><input value={endeco} onChange={e=>setEndeco(e.target.value)} placeholder="Rua, número" style={{width:"100%"}}/></LB>
  <div style={{display:"grid",gridTemplateColumns:"1fr 130px",gap:8}}>
    <LB t="BAIRRO"><input value={bairro} onChange={e=>setBairro(e.target.value)} style={{width:"100%"}}/></LB>
    <LB t="CEP"><input value={cep} onChange={e=>setCep(e.target.value)} inputMode="numeric" placeholder="00000-000" style={{width:"100%"}}/></LB>
  </div>
  <LB t="CATEGORIA"><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{CAT_IDS.map(c=>{const doMotor=CAT_MOTOR.includes(c.n);const trava=doMotor&&!libMotor;const sel=catId===String(c.id);
    return <button key={c.id} type="button" disabled={trava} title={trava?"Definido automaticamente pelo Motor de Status (última compra)":""} onClick={()=>setCatId(String(c.id))} style={{padding:"4px 10px",fontSize:10,border:sel?`2px solid ${CC[c.n]||S.pri}`:`1px solid ${S.brd}`,background:sel?`${CC[c.n]||S.pri}22`:"transparent",color:sel?CC[c.n]||S.pri:(trava?S.td:S.ts),borderRadius:6,fontWeight:sel?600:400,cursor:trava?"not-allowed":"pointer",opacity:trava&&!sel?.55:1}}>{doMotor?"🔒 ":""}{c.n}{sel?" ✓":""}</button>;})}</div>
    <p style={{fontSize:9.5,color:S.td,margin:"4px 0 0",lineHeight:1.45}}>🔒 <b>Ativo · Inativo · Perdido</b> são definidos pelo <b>Motor de Status</b> pela última compra (sem comprar há +120 dias → Inativo; +365 dias → Perdido; comprou → volta a Ativo). Marque à mão só <b>Prospecção</b>, <b>Prospectar</b>, <b>Somente Visita</b> ou <b>Excluído</b> (fechou, trocou de CNPJ…). O canal fica no campo abaixo.{!libMotor&&<> <button type="button" onClick={()=>setLibMotor(true)} style={{background:"none",border:"none",padding:0,color:S.gold,fontWeight:700,fontSize:9.5,cursor:"pointer",textDecoration:"underline"}}>Liberar mesmo assim</button></>}</p>
    {libMotor&&<p style={{fontSize:9.5,color:S.gold,margin:"3px 0 0"}}>⚠️ Liberado. Se a régua discordar, o motor volta a trocar na próxima rodada.</p>}</LB>
  <LB t="CANAL"><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{CANAIS.map(c=><button key={c} type="button" onClick={()=>setCanal(c)} style={{padding:"4px 10px",fontSize:10,border:canal===c?`2px solid ${S.acc}`:`1px solid ${S.brd}`,background:canal===c?S.acc+"22":"transparent",color:canal===c?S.acc:S.ts,borderRadius:6,fontWeight:canal===c?600:400}}>{c}{canal===c?" ✓":""}</button>)}</div>
    <p style={{fontSize:9.5,color:S.td,margin:"4px 0 0"}}>Como o cliente compra. É independente da categoria — dá para ser <b>Ativo</b> e <b>Online - B2B</b> ao mesmo tempo.</p></LB>
  <LB t="RESPONSÁVEL"><select value={ownerId} onChange={e=>setOwnerId(e.target.value)} style={{width:"100%",fontSize:12,border:(!ownerId&&!org.owner)?`1px solid ${S.gold}`:undefined}}><option value="">{org.owner?`Manter: ${org.owner}`:"Sem responsável"}</option>{(users||[]).map(u=><option key={u.id} value={u.id}>{u.n}</option>)}</select>
    {!ownerId&&!org.owner&&<p style={{fontSize:9.5,color:S.gold,margin:"3px 0 0"}}>⚠️ Este cliente está sem responsável. Escolha um.</p>}</LB>
  <LB t="SETOR"><select value={sectorId} onChange={e=>setSectorId(e.target.value)} style={{width:"100%",fontSize:12}}><option value="">Atual: {org.sector||"-"}</option>{SECTORS.map(s=><option key={s.id} value={s.id}>{s.n}</option>)}</select></LB>
  <LB t="GRUPO"><div style={{position:"relative"}}>
    <input value={grupoSearch} onChange={e=>{const v=e.target.value;setGrupoSearch(v);setGrupoOpen(true);const match=existGrp.find(g=>g.toLowerCase()===v.toLowerCase());if(match){setGrupo(match);setNewGrupo("");}else if(v.trim()){setGrupo("__new__");setNewGrupo(v);}else{setGrupo("");setNewGrupo("");}}} onFocus={()=>setGrupoOpen(true)} onBlur={()=>setTimeout(()=>setGrupoOpen(false),200)} placeholder="Buscar ou digitar novo grupo..." style={{width:"100%",fontSize:12}}/>
    {grupoOpen&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"var(--inp)",border:`1px solid ${S.brd}`,borderRadius:6,maxHeight:200,overflowY:"auto",zIndex:100,marginTop:2,boxShadow:"0 4px 12px rgba(0,0,0,0.3)"}}>
      {grupoSearch.trim()&&!existGrp.some(g=>g.toLowerCase()===grupoSearch.toLowerCase())&&<div onMouseDown={()=>{setGrupo("__new__");setNewGrupo(grupoSearch);setGrupoOpen(false);}} style={{padding:"8px 10px",fontSize:12,color:S.acc,cursor:"pointer",borderBottom:`1px solid #eee`,fontWeight:600}}>➕ Criar novo grupo: "{grupoSearch}"</div>}
      <div onMouseDown={()=>{setGrupo("");setGrupoSearch("");setNewGrupo("");setGrupoOpen(false);}} style={{padding:"8px 10px",fontSize:12,color:"#666",cursor:"pointer",borderBottom:`1px solid #eee`}}>Sem grupo</div>
      {existGrp.filter(g=>!grupoSearch||g.toLowerCase().includes(grupoSearch.toLowerCase())).map(g=><div key={g} onMouseDown={()=>{setGrupo(g);setGrupoSearch(g);setNewGrupo("");setGrupoOpen(false);}} style={{padding:"8px 10px",fontSize:12,color:"#000",cursor:"pointer",background:grupo===g?"#e0f0ff":"#fff"}} onMouseEnter={e=>e.target.style.background="#f0f8ff"} onMouseLeave={e=>e.target.style.background=grupo===g?"#e0f0ff":"#fff"}>{g}</div>)}
      {existGrp.filter(g=>!grupoSearch||g.toLowerCase().includes(grupoSearch.toLowerCase())).length===0&&!grupoSearch.trim()&&<div style={{padding:"8px 10px",fontSize:11,color:"#888"}}>Nenhum grupo cadastrado</div>}
    </div>}
    {grupo==="__new__"&&grupoSearch.trim()&&<p style={{fontSize:10,color:S.acc,margin:"2px 0 0"}}>➕ Criar novo grupo: "{grupoSearch}"</p>}
    {grupo&&grupo!=="__new__"&&<p style={{fontSize:10,color:S.ok,margin:"2px 0 0"}}>✓ Selecionado: {grupo}</p>}
  </div></LB>
  <LB t="PRODUTOS / MARCAS"><p style={{fontSize:9.5,color:S.td,margin:"0 0 4px"}}>✓ marcadas = marcas que o cliente compra (atualizado pelo motor a partir das vendas)</p><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{PRODS.map(p=><button key={p.id} onClick={()=>toggleProd(p.id)} style={{padding:"4px 8px",fontSize:10,border:selProds.includes(p.id)?`2px solid ${S.ok}`:`1px solid ${S.brd}`,background:selProds.includes(p.id)?S.ok+"22":"transparent",color:selProds.includes(p.id)?S.ok:S.ts,borderRadius:6,fontWeight:selProds.includes(p.id)?600:400}}>{p.n}</button>)}</div></LB>
  {msg&&<p style={{fontSize:12,color:msg.startsWith("Erro")?S.dng:S.ok,margin:"0 0 6px"}}>{msg}</p>}
  <div style={{display:"flex",gap:8,marginTop:4}}><button onClick={onClose} style={{flex:1}}>Cancelar</button><button onClick={save} disabled={lo} style={{flex:1,background:S.pri,border:"none",fontWeight:600}}>{lo?"...":"Salvar"}</button></div></div></div>);}
function HotelGeoInput({name,onNameChange,lat,lng,onCoordsChange,label}){
  const[gpsLo,setGpsLo]=useState(false);const[coordText,setCoordText]=useState(lat&&lng?`${lat},${lng}`:"");
  const parseCoords=(txt)=>{const clean=txt.replace(/\s/g,"");const m=clean.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);if(m)onCoordsChange(parseFloat(m[1]),parseFloat(m[2]));};
  const captureGPS=async()=>{setGpsLo(true);try{const g=await gps();onCoordsChange(g.lat,g.lng);setCoordText(`${g.lat.toFixed(6)},${g.lng.toFixed(6)}`);}catch{alert("GPS indisponivel");}setGpsLo(false);};
  const searchMaps=()=>{const q=encodeURIComponent(name||"hotel");window.open(`https://www.google.com/maps/search/${q}`,"_blank");};
  const hasCoords=lat&&lng;
  return(<div style={{display:"flex",flexDirection:"column",gap:4}}>
    <input value={name} onChange={e=>onNameChange(e.target.value)} placeholder={label||"Nome do hotel / cidade"} style={{width:"100%",fontSize:12}}/>
    <div style={{display:"flex",gap:4}}>
      <button onClick={searchMaps} style={{flex:1,padding:6,fontSize:10,background:S.pri+"22",border:`1px solid ${S.pri}`,color:S.pri}}>🔍 Buscar no Maps</button>
      <button onClick={captureGPS} disabled={gpsLo} style={{flex:1,padding:6,fontSize:10,background:hasCoords?S.ok+"22":S.gold+"22",border:`1px solid ${hasCoords?S.ok:S.gold}`,color:hasCoords?S.ok:S.gold}}>{gpsLo?"📍 GPS...":(hasCoords?"✅ GPS capturado":"📍 Meu GPS")}</button>
    </div>
    <div style={{display:"flex",gap:4,alignItems:"center"}}>
      <input value={coordText} onChange={e=>{setCoordText(e.target.value);parseCoords(e.target.value);}} placeholder="Colar coordenadas: -11.8642,-55.5095" style={{flex:1,fontSize:10,fontFamily:"monospace",padding:"6px 8px"}}/>
      {hasCoords&&<span style={{fontSize:9,color:S.ok,flexShrink:0}}>✅</span>}
    </div>
    {hasCoords&&<p style={{fontSize:9,color:S.ok,margin:0}}>📍 {lat.toFixed(5)}, {lng.toFixed(5)}</p>}
  </div>);}
function JourneyModal({user,onSave,onCancel}){const home=HOMES[user?.id];const[orig,setOrig]=useState("home");const[dest,setDest]=useState("home");const[lo,setLo]=useState(false);const[origName,setOrigName]=useState("");const[destName,setDestName]=useState("");
  const[origLat,setOrigLat]=useState(null);const[origLng,setOrigLng]=useState(null);
  const[destLat,setDestLat]=useState(null);const[destLng,setDestLng]=useState(null);
  const go=async()=>{setLo(true);let startBase,endBase;
    if(orig==="home"&&home){startBase={type:"home",...home};}
    else if(origLat&&origLng){startBase={type:"hotel",lat:origLat,lng:origLng,label:origName||"Hotel"};}
    else{try{const g=await gps();startBase={type:"hotel",lat:g.lat,lng:g.lng,label:origName||"Hotel"};}catch{alert("Defina a localização do hotel de origem.");setLo(false);return;}}
    if(dest==="home"&&home){endBase={type:"home",...home};}
    else if(destLat&&destLng){endBase={type:"hotel",lat:destLat,lng:destLng,label:destName||"Hotel"};}
    else{endBase={type:"hotel",lat:null,lng:null,label:destName||"Hotel (GPS ao fechar)"};}
    onSave({start:startBase,end:endBase});setLo(false);};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.cardSolid,borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}>
    <p style={{fontWeight:600,fontSize:16,margin:"0 0 12px"}}>Jornada de Trabalho</p>
    <p style={{fontSize:12,color:S.acc,fontWeight:600,margin:"0 0 6px"}}>DE ONDE ESTÁ SAINDO?</p>
    {["home","hotel"].map(t=><label key={"o"+t} style={{display:"flex",alignItems:"center",gap:10,padding:10,border:`${orig===t?2:1}px solid ${orig===t?S.pri:S.brd}`,borderRadius:10,marginBottom:6,cursor:"pointer",background:orig===t?S.cl:S.bg}}><input type="radio" checked={orig===t} onChange={()=>setOrig(t)}/><span style={{fontSize:13,fontWeight:500}}>{t==="home"?"🏠 Casa":"🏨 Hotel / Airbnb"}</span></label>)}
    {orig==="hotel"&&<div style={{marginBottom:8}}><HotelGeoInput name={origName} onNameChange={setOrigName} lat={origLat} lng={origLng} onCoordsChange={(la,ln)=>{setOrigLat(la);setOrigLng(ln);}} label="Hotel de origem"/></div>}
    <div style={{borderTop:`1px solid ${S.brd}`,margin:"10px 0",paddingTop:10}}>
    <p style={{fontSize:12,color:S.gold,fontWeight:600,margin:"0 0 6px"}}>PARA ONDE VAI NO FINAL DO DIA?</p>
    {["home","hotel"].map(t=><label key={"d"+t} style={{display:"flex",alignItems:"center",gap:10,padding:10,border:`${dest===t?2:1}px solid ${dest===t?S.gold:S.brd}`,borderRadius:10,marginBottom:6,cursor:"pointer",background:dest===t?S.cl:S.bg}}><input type="radio" checked={dest===t} onChange={()=>setDest(t)}/><span style={{fontSize:13,fontWeight:500}}>{t==="home"?"🏠 Voltar para casa":"🏨 Hotel / Airbnb"}</span></label>)}
    {dest==="hotel"&&<div style={{marginBottom:8}}><HotelGeoInput name={destName} onNameChange={setDestName} lat={destLat} lng={destLng} onCoordsChange={(la,ln)=>{setDestLat(la);setDestLng(ln);}} label="Hotel de destino"/></div>}
    </div>
    <div style={{display:"flex",gap:8,marginTop:8}}><button onClick={onCancel} style={{flex:1}}>Depois</button><button onClick={go} disabled={lo} style={{flex:1,background:S.pri,border:"none",fontWeight:600}}>{lo?"📍 GPS...":"Iniciar Jornada"}</button></div>
  </div></div>);}
function DayEndModal({user,onSave,onCancel}){const home=HOMES[user?.id];const[tp,setTp]=useState("home");const[hn,setHn]=useState("");
  const[htLat,setHtLat]=useState(null);const[htLng,setHtLng]=useState(null);
  const go=()=>{if(tp==="home"&&home){onSave({type:"home",...home});return;}
    if(!htLat||!htLng){alert("Defina a localização do hotel (GPS, busca ou coordenadas).");return;}
    onSave({type:"hotel",lat:htLat,lng:htLng,label:hn||"Hotel/Airbnb"});};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.cardSolid,borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:400}}>
    <p style={{fontWeight:600,fontSize:16,margin:"0 0 4px"}}>Fechar roteiro do dia</p>
    <p style={{fontSize:12,color:S.ts,margin:"0 0 12px"}}>Para onde esta indo agora?</p>
    {["home","hotel"].map(t=><label key={t} style={{display:"flex",alignItems:"center",gap:10,padding:12,border:`${tp===t?2:1}px solid ${tp===t?S.pri:S.brd}`,borderRadius:10,marginBottom:8,cursor:"pointer",background:tp===t?S.cl:S.bg}}><input type="radio" checked={tp===t} onChange={()=>setTp(t)}/><span style={{fontWeight:500}}>{t==="home"?"🏠 Voltando para casa":"🏨 Hotel / Airbnb"}</span></label>)}
    {tp==="hotel"&&<div style={{marginBottom:8}}><HotelGeoInput name={hn} onNameChange={setHn} lat={htLat} lng={htLng} onCoordsChange={(la,ln)=>{setHtLat(la);setHtLng(ln);}} label="Local de repouso"/></div>}
    <div style={{display:"flex",gap:8,marginTop:8}}><button onClick={onCancel} style={{flex:1}}>Cancelar</button><button onClick={go} disabled={tp==="hotel"&&(!htLat||!htLng)} style={{flex:1,background:S.acc,border:"none",fontWeight:600}}>Fechar Roteiro</button></div>
  </div></div>);}
function DivergentModal({org,dist,onAction,onCancel}){return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.cardSolid,borderRadius:16,padding:"1.25rem",width:"100%",maxWidth:400}}><p style={{fontWeight:600,fontSize:16,margin:"0 0 4px",color:S.gold}}>Local divergente</p><p style={{fontSize:13,color:S.ts,margin:"0 0 4px"}}>{org.name}</p><p style={{fontSize:12,color:S.gold,margin:"0 0 16px"}}>Voce esta a {dist}m do cadastrado</p><div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}><button onClick={()=>onAction("checkin")} style={{padding:12,textAlign:"left",fontWeight:500}}>📍 Visita presencial</button>{TYPES.filter(t=>t.id!=="VISITA").map(t=><button key={t.id} onClick={()=>onAction("remote",t.id)} style={{padding:12,textAlign:"left"}}>{t.l} (sem check-in)</button>)}<button onClick={()=>onAction("schedule")} style={{padding:12,textAlign:"left",color:S.acc}}>📅 Agendar futuro</button></div><button onClick={onCancel} style={{width:"100%",color:S.dng}}>Cancelar</button></div></div>);}
function BaseEditInline({day,dayBases,userId,plocs,lastVisitCoord,onSave,onCancel,dayKey}){
  const home=HOMES[userId];const k=dayKey||day;const cur=dayBases[k]?.start||HOMES[userId];const curEnd=dayBases[k]?.end||cur;
  const[origType,setOrigType]=useState(cur?.type||"home");const[destType,setDestType]=useState(curEnd?.type||"home");
  const[origName,setOrigName]=useState(cur?.type==="hotel"?cur.label:"");const[destName,setDestName]=useState(curEnd?.type==="hotel"?curEnd.label:"");
  const[origLat,setOrigLat]=useState(cur?.type==="hotel"?cur.lat:null);const[origLng,setOrigLng]=useState(cur?.type==="hotel"?cur.lng:null);
  const[destLat,setDestLat]=useState(curEnd?.type==="hotel"?curEnd.lat:null);const[destLng,setDestLng]=useState(curEnd?.type==="hotel"?curEnd.lng:null);
  const[kmEst,setKmEst]=useState(null);
  useEffect(()=>{if(destType==="hotel"&&destLat&&lastVisitCoord){setKmEst(hav(lastVisitCoord.lat,lastVisitCoord.lng,destLat,destLng)*1.3);}else if(destType==="home"&&home&&lastVisitCoord){setKmEst(hav(lastVisitCoord.lat,lastVisitCoord.lng,home.lat,home.lng)*1.3);}else{setKmEst(null);}},[destType,destLat,destLng,lastVisitCoord]);
  const save=()=>{
    const start=origType==="home"&&home?{type:"home",...home}:{type:"hotel",lat:origLat||home?.lat,lng:origLng||home?.lng,label:origName||"Hotel"};
    const end=destType==="home"&&home?{type:"home",...home}:{type:"hotel",lat:destLat||home?.lat,lng:destLng||home?.lng,label:destName||"Hotel"};
    onSave(day,start,end);};
  return(<div style={{background:S.cl,border:`1px solid ${S.acc}`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
    <p style={{fontWeight:500,fontSize:13,margin:"0 0 8px"}}>Corrigir {fD(day+"T12:00")}</p>
    <LB t="ORIGEM"><div style={{display:"flex",gap:6,marginBottom:4}}><button onClick={()=>setOrigType("home")} style={{flex:1,padding:6,fontSize:11,border:`1px solid ${origType==="home"?S.pri:S.brd}`,background:origType==="home"?S.pri+"22":"transparent",color:origType==="home"?S.pri:S.ts}}>🏠 Casa</button><button onClick={()=>setOrigType("hotel")} style={{flex:1,padding:6,fontSize:11,border:`1px solid ${origType==="hotel"?S.gold:S.brd}`,background:origType==="hotel"?S.gold+"22":"transparent",color:origType==="hotel"?S.gold:S.ts}}>🏨 Hotel</button></div>
      {origType==="hotel"&&<HotelGeoInput name={origName} onNameChange={setOrigName} lat={origLat} lng={origLng} onCoordsChange={(la,ln)=>{setOrigLat(la);setOrigLng(ln);}} label="Hotel de origem"/>}
    </LB>
    <LB t="DESTINO"><div style={{display:"flex",gap:6,marginBottom:4}}><button onClick={()=>setDestType("home")} style={{flex:1,padding:6,fontSize:11,border:`1px solid ${destType==="home"?S.pri:S.brd}`,background:destType==="home"?S.pri+"22":"transparent",color:destType==="home"?S.pri:S.ts}}>🏠 Casa</button><button onClick={()=>setDestType("hotel")} style={{flex:1,padding:6,fontSize:11,border:`1px solid ${destType==="hotel"?S.gold:S.brd}`,background:destType==="hotel"?S.gold+"22":"transparent",color:destType==="hotel"?S.gold:S.ts}}>🏨 Hotel</button></div>
      {destType==="hotel"&&<HotelGeoInput name={destName} onNameChange={setDestName} lat={destLat} lng={destLng} onCoordsChange={(la,ln)=>{setDestLat(la);setDestLng(ln);}} label="Hotel de destino"/>}
    </LB>
    {kmEst!=null&&<p style={{fontSize:11,color:S.acc,margin:"0 0 8px"}}>Km estimado último PDV → {destType==="hotel"?destName||"Hotel":"Casa"}: {kmEst.toFixed(1)} km</p>}
    <div style={{display:"flex",gap:8}}><button onClick={onCancel} style={{flex:1,fontSize:11}}>Cancelar</button><button onClick={save} style={{flex:1,fontSize:11,background:S.acc,border:"none",fontWeight:600}}>Salvar</button></div>
  </div>);}
function ProgressBar({active,msg}){if(!active)return null;return(<div style={{width:"100%",marginBottom:8}}>
  <div style={{height:4,background:S.brd,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",background:S.pri,borderRadius:2,animation:"progFill 2s ease-in-out infinite",width:"60%"}}/>
  </div><p style={{fontSize:11,color:S.acc,margin:"4px 0 0",textAlign:"center"}}>{msg}</p>
  <style>{`@keyframes progFill{0%{width:5%;margin-left:0}50%{width:60%;margin-left:20%}100%{width:5%;margin-left:95%}}`}</style>
</div>);}
function SearchOrAddModal({token,allOrgs,onFound,onNewClient,onCancel}){
  const[q,setQ]=useState("");const[lo,setLo]=useState(false);const[results,setResults]=useState([]);const[selected,setSelected]=useState(null);const[err,setErr]=useState("");const[step,setStep]=useState("search");
  const[people,setPeople]=useState([]);const[pLo,setPLo]=useState(false);const[showPeople,setShowPeople]=useState(false);
  const[addP,setAddP]=useState(false);const[pName,setPName]=useState("");const[pCargo,setPCargo]=useState("");const[pEmail,setPEmail]=useState("");const[pPhone,setPPhone]=useState("");const[pWhats,setPWhats]=useState("");
  const search=()=>{if(!q.trim()){setErr("Digite CNPJ, nome ou razão social");return;}setLo(true);setErr("");setResults([]);setSelected(null);
    const clean=q.replace(/[.\-\/]/g,"").toLowerCase();
    const matches=allOrgs.filter(o=>{if(o.cnpj?.replace(/[.\-\/]/g,"")===clean)return true;return[o.name,o.nickname,o.legalName].filter(Boolean).some(f=>f.toLowerCase().replace(/[.\-\/]/g,"").includes(clean));}).slice(0,30);
    if(matches.length){setResults(matches);setStep("list");setLo(false);return;}
    if(clean.length===14){setLo(true);fetchCNPJ(clean).then(rf=>{setSelected({rfData:rf,name:rf.nome_fantasia||rf.razao_social||"",cnpj:clean});setStep("notfound_rf");setLo(false);}).catch(()=>{setStep("notfound");setLo(false);});return;}
    setStep("notfound");setLo(false);};
  const selectClient=(org)=>{setSelected(org);setStep("found");};
  const loadPeople=async(orgId)=>{setPLo(true);try{const r=await fetch(`${DASH}/api/crm/contatos?org_id=${orgId}`,{headers:{"X-Session":token},cache:"no-store"});const d=await r.json();setPeople((d&&d.contatos)||[]);}catch(e){console.warn("contatos:",e);setPeople([]);}setPLo(false);setShowPeople(true);};
  const pCanSave=pName.trim()&&pEmail.trim()&&pWhats.trim();
  const addPerson=async()=>{if(!pCanSave||!selected?.id)return;setPLo(true);try{await fetch(`${DASH}/api/crm/contatos`,{method:"POST",headers:{"X-Session":token,"Content-Type":"application/json"},body:JSON.stringify({org_id:selected.id,cnpj:(selected.cnpj||"").replace(/\D/g,"")||null,nome:pName,cargo:pCargo||null,telefone:pPhone||null,whatsapp:pWhats||null,email:pEmail||null})});await loadPeople(selected.id);setAddP(false);setPName("");setPCargo("");setPEmail("");setPPhone("");setPWhats("");}catch(e){alert("Erro: "+(e.message||e));}setPLo(false);};
  const catColor=CC[selected?.cat]||S.ts;const isExcluido=selected?.cat==="Excluido";
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.cardSolid,borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}>
    {step==="search"&&<><p style={{fontWeight:600,fontSize:16,margin:"0 0 4px"}}>Buscar / Cadastrar Cliente</p>
      <p style={{fontSize:12,color:S.ts,margin:"0 0 12px"}}>CNPJ, nome fantasia ou razão social</p>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ex: Compacta, Tropical, Bom Jesus..." style={{width:"100%",marginBottom:8,fontSize:14}} onKeyDown={e=>e.key==="Enter"&&search()} autoFocus/>
      {err&&<p style={{fontSize:12,color:S.dng,margin:"0 0 6px"}}>{err}</p>}
      <div style={{display:"flex",gap:8}}><button onClick={onCancel} style={{flex:1}}>Cancelar</button><button onClick={search} disabled={lo||!q.trim()} style={{flex:1,background:S.pri,border:"none",fontWeight:600}}>{lo?"🔍...":"Buscar"}</button></div></>}
    {step==="list"&&<><p style={{fontWeight:600,fontSize:16,margin:"0 0 4px"}}>{results.length} cliente(s) encontrado(s)</p>
      <p style={{fontSize:12,color:S.ts,margin:"0 0 8px"}}>"{q}"</p>
      <div style={{maxHeight:"55vh",overflowY:"auto",marginBottom:8}}>{results.map(o=><div key={o.id} onClick={()=>selectClient(o)} style={{background:S.cl,borderRadius:8,padding:"10px 12px",marginBottom:4,cursor:"pointer",border:`1px solid ${S.brd}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><p style={{fontSize:13,fontWeight:500,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{o.name||o.nickname}</p><span style={{fontSize:9,color:"#fff",background:CC[o.cat]||S.ts,padding:"2px 6px",borderRadius:4,flexShrink:0}}>{o.cat}</span></div>
        {o.legalName&&o.legalName!==o.name&&<p style={{fontSize:10,color:S.ts,margin:"2px 0 0"}}>{o.legalName}</p>}
        <p style={{fontSize:10,color:S.td,margin:"1px 0 0"}}>{o.cnpj||""}{o.addr?.city_name||o.addr?.city?` · ${o.addr.city_name||o.addr.city}`:""}{o.owner?` · ${o.owner}`:""}</p>
      </div>)}</div>
      <div style={{display:"flex",gap:8}}><button onClick={()=>{setStep("search");setResults([]);}} style={{flex:1}}>← Voltar</button><button onClick={onCancel} style={{flex:1}}>Fechar</button></div></>}
    {step==="found"&&selected&&!showPeople&&<>
      <p style={{fontWeight:600,fontSize:16,margin:"0 0 4px",color:isExcluido?S.gold:S.ok}}>{isExcluido?"📋 Cadastro encontrado":"✅ Cliente selecionado"}</p>
      <div style={{background:S.cl,borderRadius:10,padding:12,margin:"8px 0 12px"}}><p style={{fontSize:14,fontWeight:600,margin:"0 0 2px"}}>{selected.name||selected.nickname}</p>{selected.legalName&&selected.legalName!==selected.name&&<p style={{fontSize:11,color:S.ts,margin:"0 0 2px"}}>{selected.legalName}</p>}{selected.cnpj&&<p style={{fontSize:11,color:S.ts,margin:"0 0 2px"}}>{selected.cnpj}</p>}<div style={{display:"flex",gap:4,alignItems:"center",marginTop:4}}><span style={{fontSize:10,color:"#fff",background:catColor,padding:"2px 8px",borderRadius:4,fontWeight:500}}>{selected.cat||"?"}</span><span style={{fontSize:11,color:S.ts}}>{selected.addr?.city_name||selected.addr?.city||""}</span></div>{selected.owner&&<p style={{fontSize:10,color:S.ts,margin:"4px 0 0"}}>Responsável: {selected.owner}</p>}</div>
      <p style={{fontSize:12,color:S.gold,fontWeight:500,margin:"0 0 8px"}}>Tipo de atendimento:</p>
      <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:12}}>{TYPES.map(t=><button key={t.id} onClick={()=>{const note=prompt(`${t.l} com ${selected.name}:`);if(note?.trim()){crmFire(token,"/api/crm/atividades",{org_id:selected.id,cnpj:(selected.cnpj||"").replace(/\D/g,"")||null,org_nome:selected.name,tipo:t.id,texto:note});alert("Registrado!");onCancel();}}} style={{padding:10,textAlign:"left",fontSize:12,background:S.bg,border:`1px solid ${S.brd}`,borderRadius:8}}>{t.id==="VISITA"?"📍":t.id==="WHATSAPP"?"💬":t.id==="LIGACAO"?"📞":t.id==="EMAIL"?"📧":t.id==="REUNIAO"?"🤝":"📄"} {t.l}</button>)}</div>
      <button onClick={()=>loadPeople(selected.id)} style={{width:"100%",marginBottom:8,padding:10,fontSize:12,background:S.pri+"22",border:`1px solid ${S.pri}`,color:S.pri,fontWeight:500}}>{pLo?"...":"👤 Ver / Adicionar Contatos"}</button>
      <div style={{display:"flex",gap:8}}><button onClick={()=>{setStep("list");setSelected(null);setShowPeople(false);}} style={{flex:1}}>← Voltar</button>{!isExcluido&&<button onClick={()=>{onFound(selected);onCancel();}} style={{flex:1,background:S.acc,border:"none",fontWeight:600}}>Ir ao cliente</button>}{isExcluido&&<button onClick={onCancel} style={{flex:1}}>Fechar</button>}</div></>}
    {step==="found"&&showPeople&&<><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><p style={{fontWeight:600,fontSize:14,margin:0}}>👤 Contatos</p><button onClick={()=>setShowPeople(false)} style={{fontSize:10,padding:"4px 10px"}}>← Voltar</button></div>
      {people.length===0&&!pLo&&<p style={{fontSize:12,color:S.ts,textAlign:"center",padding:"1rem 0"}}>Nenhum contato</p>}
      {people.map(p=><div key={p.id} style={{background:S.cl,borderRadius:8,padding:10,marginBottom:6}}><p style={{fontSize:13,fontWeight:600,margin:"0 0 2px"}}>{p.name}</p>{p.role&&<p style={{fontSize:10,color:S.acc,margin:"0 0 2px"}}>{p.role}</p>}<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{p.contact?.email&&<span style={{fontSize:10,color:S.ts}}>📧 {p.contact.email}</span>}{p.contact?.mobile&&<span style={{fontSize:10,color:S.ts}}>📱 {p.contact.mobile}</span>}{p.contact?.whatsapp&&<a href={`https://wa.me/55${p.contact.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener" style={{fontSize:10,color:S.ok,textDecoration:"none"}}>💬 {p.contact.whatsapp}</a>}</div></div>)}
      {!addP&&<button onClick={()=>setAddP(true)} style={{width:"100%",padding:10,fontSize:12,background:S.acc,border:"none",fontWeight:600,marginTop:4}}>+ Adicionar Contato</button>}
      {addP&&<div style={{background:S.cl,borderRadius:8,padding:10,marginTop:6}}><input value={pName} onChange={e=>setPName(e.target.value)} placeholder="Nome *" style={{width:"100%",marginBottom:4,fontSize:12,border:`1px solid ${pName.trim()?S.brd:S.dng}`}}/><select value={pCargo} onChange={e=>setPCargo(e.target.value)} style={{width:"100%",marginBottom:4,fontSize:12}}><option value="">Cargo...</option>{cargosDe(selected?.sector).map(c=><option key={c} value={c}>{c}</option>)}</select><input value={pEmail} onChange={e=>setPEmail(e.target.value)} placeholder="E-mail *" type="email" style={{width:"100%",marginBottom:4,fontSize:12,border:`1px solid ${pEmail.trim()?S.brd:S.dng}`}}/><input value={pPhone} onChange={e=>setPPhone(e.target.value)} placeholder="Telefone" style={{width:"100%",marginBottom:4,fontSize:12}}/><input value={pWhats} onChange={e=>setPWhats(e.target.value)} placeholder="WhatsApp *" style={{width:"100%",marginBottom:6,fontSize:12,border:`1px solid ${pWhats.trim()?S.brd:S.dng}`}}/><div style={{display:"flex",gap:6}}><button onClick={()=>setAddP(false)} style={{flex:1,fontSize:11}}>Cancelar</button><button onClick={addPerson} disabled={pLo||!pCanSave} style={{flex:1,fontSize:11,background:pCanSave?S.acc:S.cl,border:"none",fontWeight:600}}>{pLo?"...":"Salvar"}</button></div></div>}</>}
    {(step==="notfound"||step==="notfound_rf")&&<><p style={{fontWeight:600,fontSize:16,margin:"0 0 4px",color:S.gold}}>Cliente não encontrado</p><p style={{fontSize:12,color:S.ts,margin:"0 0 8px"}}>{q} não encontrado no cadastro</p>{step==="notfound_rf"&&selected?.rfData&&<div style={{background:S.cl,borderRadius:10,padding:10,margin:"0 0 8px"}}><p style={{fontSize:11,color:S.acc,margin:"0 0 2px"}}>Receita Federal:</p><p style={{fontSize:12,fontWeight:500,margin:"0 0 1px"}}>{selected.rfData.nome_fantasia||"-"}</p><p style={{fontSize:11,color:S.ts,margin:0}}>{selected.rfData.razao_social||""}</p><p style={{fontSize:10,color:S.ts,margin:0}}>{selected.rfData.municipio||""}/{selected.rfData.uf||""}</p></div>}<div style={{display:"flex",gap:8}}><button onClick={()=>{setStep("search");setSelected(null);}} style={{flex:1}}>Voltar</button><button onClick={()=>{onNewClient(q.replace(/[.\-\/]/g,""),selected?.rfData||null);onCancel();}} style={{flex:1,background:S.acc,border:"none",fontWeight:600}}>Cadastrar Novo</button></div></>}
  </div></div>);}

// v69: alerta de pendências ao abrir a visita
function PendenciasAlerta({dados,onClose}){
  return(<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:60,padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:S.cardSolid,borderRadius:16,padding:"1.25rem",width:"100%",maxWidth:440,border:`1px solid ${S.gold}66`,maxHeight:"85vh",overflowY:"auto"}}>
        <p style={{fontWeight:800,fontSize:16,margin:"0 0 2px",color:S.txt}}>📌 Pendências neste cliente</p>
        <p style={{fontSize:12,color:S.ts,margin:"0 0 12px"}}>{dados.org} — antes de começar o atendimento:</p>
        {dados.itens.map(x=><div key={x.id} style={{padding:"9px 11px",background:S.gold+"14",border:`1px solid ${S.gold}44`,borderRadius:10,marginBottom:7}}>
          <p style={{fontSize:13.5,fontWeight:700,color:S.txt,margin:0}}>{x.txt}</p>
          <p style={{fontSize:11,color:S.ts,margin:"3px 0 0"}}>{x.proxima?"Para esta visita":`Tarefa${x.due_em?` · prazo ${fD1(x.due_em)}`:""}`} · registrada por {x.user_nome||"—"} em {fD1(x.criado_em)}</p>
        </div>)}
        <p style={{fontSize:11,color:S.ts,margin:"8px 0 12px"}}>No check-out você marca o que foi resolvido.</p>
        <button onClick={onClose} style={{width:"100%",padding:"11px",fontSize:14,fontWeight:700,background:S.pri,border:"none",color:"#fff",borderRadius:10}}>Entendi</button>
      </div></div>);
}
export { LB, Login, OrgCard, Banner, NoteModal, PendenciasAlerta, NewClientModal, CARGOS, PeopleModal, PRODS, EditModal, HotelGeoInput, JourneyModal, DayEndModal, DivergentModal, BaseEditInline, ProgressBar, SearchOrAddModal };
