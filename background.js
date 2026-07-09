/* TeamCheck para WhatsApp Web — painel no padrão da tela de login (azul Jordan + claro) */
.tcx-painel{position:fixed;top:0;right:0;height:100vh;width:330px;z-index:99999;background:#F4F8FA;color:#12303F;
  font-family:'IBM Plex Sans',Roboto,Arial,sans-serif;border-left:1px solid #D9E4EA;display:flex;flex-direction:column;
  box-shadow:-6px 0 24px rgba(2,40,58,.18);transition:width .22s ease}
.tcx-painel.tcx-fechado{width:44px}
.tcx-painel.tcx-fechado{cursor:pointer}
.tcx-painel.tcx-fechado .tcx-corpo,.tcx-painel.tcx-fechado .tcx-logo,.tcx-painel.tcx-fechado #tcx-lupa{display:none}
.tcx-painel.tcx-fechado .tcx-top{justify-content:center;padding:10px 4px}
.tcx-painel.tcx-fechado .tcx-btn-min{width:34px;height:34px;font-size:16px}
.tcx-top{display:flex;align-items:center;justify-content:space-between;padding:11px 12px;border-bottom:1px solid #04688F;
  background:linear-gradient(158deg,#0A7099 0%,#0578A6 60%,#036690 100%)}
.tcx-logo{font-weight:800;font-size:14px;letter-spacing:.4px;color:#fff}
.tcx-logo small{color:rgba(255,255,255,.75)}
.tcx-top-btns{display:flex;gap:6px;align-items:center}
.tcx-btn-min{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.35);color:#fff;border-radius:8px;width:30px;height:30px;cursor:pointer;font-size:14px;line-height:1}
.tcx-btn-min:hover{background:rgba(255,255,255,.28)}
.tcx-corpo{flex:1;overflow-y:auto;padding:12px}
.tcx-msg{font-size:12.5px;color:#5E7080;text-align:center;padding:14px 6px}
.tcx-t{font-size:14px;font-weight:700;margin:2px 0 10px;text-align:center;color:#0578A6}
.tcx-inp{width:100%;box-sizing:border-box;background:#fff;border:1px solid #D9E4EA;border-radius:10px;color:#12303F;
  padding:9px 11px;font-size:13px;margin-bottom:8px;font-family:inherit}
.tcx-inp:focus{outline:none;border-color:#0578A6;box-shadow:0 0 0 3px rgba(5,120,166,.14)}
.tcx-btn{display:block;width:100%;box-sizing:border-box;background:#0578A6;border:none;border-radius:10px;color:#fff;
  padding:10px;font-size:13px;font-weight:700;cursor:pointer;text-align:center;margin-bottom:8px;text-decoration:none;
  box-shadow:0 10px 22px -12px rgba(5,120,166,.8)}
.tcx-btn:hover{background:#036690}
.tcx-btn.tcx-link{background:#F4FAFC;color:#0578A6;border:1px solid #CDE8EF;box-shadow:none}
.tcx-btn.tcx-link:hover{background:#EAF6FA}
.tcx-nome{font-size:15px;font-weight:800;margin:0 0 2px;color:#12303F}
.tcx-sub{font-size:12px;color:#5E7080;margin:0 0 8px}
.tcx-pill{background:#2A9D8F;color:#fff;font-size:10px;font-weight:700;border-radius:6px;padding:2px 8px;margin-right:5px}
.tcx-marcas{margin:0 0 4px;display:flex;gap:4px;flex-wrap:wrap}
.tcx-marca{font-size:9.5px;font-weight:700;color:#A8762F;border:1px solid #C8964E66;background:#FBF4E8;border-radius:6px;padding:1px 7px}
.tcx-bloco{background:#fff;border:1px solid #E2E8EC;border-radius:12px;padding:10px 12px;margin-bottom:10px;
  box-shadow:0 2px 8px rgba(2,40,58,.05)}
.tcx-bt{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#0578A6;margin:0 0 6px}
.tcx-li{font-size:12px;margin:0 0 6px;line-height:1.45;word-break:break-word;color:#33475A}
.tcx-tipo{background:#0578A6;color:#fff;font-size:9.5px;font-weight:700;border-radius:5px;padding:1px 6px;margin-right:4px}
.tcx-data{font-size:10.5px;color:#7C8893}
.tcx-vazio{color:#7C8893;font-style:italic}
.tcx-erro-box{background:#FDEBE9;color:#B3261E;border:1px solid #F3C2BC;font-size:12.5px;font-weight:600;border-radius:10px;padding:10px 12px;margin:0 0 10px;line-height:1.5;word-break:break-word}
.tcx-erro-box small{font-weight:400;opacity:.9}
.tcx-emp:first-of-type{border-top:none;padding-top:2px}
.tcx-emp-nome{font-size:13px;font-weight:700;margin:0 0 3px;color:#12303F}
.tcx-emp-sub{font-size:11.5px;color:#5E7080;margin:0 0 4px}

.tcx-emp{display:block;padding:8px 6px;border-top:1px solid #EDF2F5;text-decoration:none;color:inherit;border-radius:8px}
.tcx-emp:first-of-type{border-top:none;padding-top:2px}
.tcx-emp-link{cursor:pointer}
.tcx-emp-link:hover{background:#F2F7FA}
.tcx-emp-link .tcx-emp-nome{color:#0578A6}
.tcx-mini{display:block;width:100%;background:none;border:none;color:#0578A6;font-size:11.5px;text-align:left;cursor:pointer;padding:6px 0 0;text-decoration:underline;font-family:inherit}
.tcx-mini:hover{color:#036690}
.tcx-pessoa{display:flex;gap:6px;align-items:stretch;margin-bottom:8px}
.tcx-pessoa .tcx-pessoa-btn{flex:1;margin-bottom:0}
.tcx-opt{display:block;width:100%;box-sizing:border-box;text-align:left;background:#fff;border:1px solid #DCE5EC;border-radius:10px;color:#12303F;padding:9px 11px;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:8px;font-family:inherit}
.tcx-opt:hover{border-color:#0578A6;background:#F4FAFC}
.tcx-opt .tcx-opt-sub{display:block;font-size:11px;font-weight:400;color:#5E7080;margin-top:2px}
.tcx-sec{display:block;width:100%;box-sizing:border-box;background:#EEF3F6;border:1px solid #DCE5EC;border-radius:10px;color:#33475A;padding:10px;font-size:13px;font-weight:700;cursor:pointer;text-align:center;margin-bottom:8px;font-family:inherit;text-decoration:none}
.tcx-sec:hover{background:#E3EBF0}
.tcx-del{width:40px;background:#FDEBE9;border:1px solid #F3C2BC;color:#B3261E;border-radius:10px;cursor:pointer;font-size:15px}
.tcx-del:hover{background:#F9DAD6}
.tcx-vinc-tag{font-size:9px;font-weight:700;color:#0578A6;border:1px solid #0578A655;background:#EAF6FA;border-radius:5px;padding:1px 5px;vertical-align:middle;margin-left:2px}
