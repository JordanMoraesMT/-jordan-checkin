// TeamCheck v108 — Planilha de prospecção (Excel .xlsx) gerada e lida no próprio app, sem biblioteca externa.
// gerarPlanilhaProsp(): monta um .xlsx (zip sem compressão) com uma coluna por marca, lista suspensa "X",
//   "compra" em cinza para marcas que o cliente já compra, cabeçalho fixo, filtro e aba "Como usar".
// lerPlanilha(file): lê .xlsx (descompacta com DecompressionStream) ou .csv → { cab: [...], linhas: [[...], ...] }.

const enc = new TextEncoder();
const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
const col = n => { let s = ""; n++; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };

// ── ZIP (método "stored") ─────────────────────────────────────────────
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zipStore(arquivos) {
  const partes = [], centrais = []; let off = 0;
  for (const [nome, txt] of arquivos) {
    const nb = enc.encode(nome), dados = enc.encode(txt), crc = crc32(dados);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, dados.length, true); h.setUint32(22, dados.length, true);
    h.setUint16(26, nb.length, true); h.setUint16(28, 0, true);
    partes.push(new Uint8Array(h.buffer), nb, dados);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, dados.length, true); c.setUint32(24, dados.length, true);
    c.setUint16(28, nb.length, true); c.setUint32(42, off, true);
    centrais.push(new Uint8Array(c.buffer), nb);
    off += 30 + nb.length + dados.length;
  }
  const tamC = centrais.reduce((t, p) => t + p.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, arquivos.length, true); e.setUint16(10, arquivos.length, true); e.setUint32(12, tamC, true); e.setUint32(16, off, true);
  return new Blob([...partes, ...centrais, new Uint8Array(e.buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

// ── Gerar a planilha ──────────────────────────────────────────────────
// clientes: [{ cnpj, nome, razao, cidade, uf, resp, cat, compra:[marcas], prosp:[marcas] }]; marcas: [nomes]
// modo "colunas" = uma coluna por marca com "X" (qualquer programa)
// modo "celula"  = uma célula "Marcas em prospecção" com lista das marcas — no Google Planilhas dá para ligar
//                  "Permitir várias seleções"; no Excel escolhe uma e digita as outras separadas por vírgula.
export function gerarPlanilhaProsp(clientes, marcas, chaveMarca, modo = "colunas") {
  const umaCel = modo === "celula";
  const fixas = ["CNPJ", "Nome", "Razão social", "Cidade", "UF", "Responsável", "Categoria", "Já compra"];
  const cab = umaCel ? [...fixas, "Marcas em prospecção", "Observação"] : [...fixas, ...marcas, "Observação"];
  const nM0 = fixas.length, nM1 = umaCel ? fixas.length : fixas.length + marcas.length - 1, ult = cab.length - 1, nL = clientes.length + 1;
  const cel = (r, c, v, s) => `<c r="${col(c)}${r}" t="inlineStr" s="${s}"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
  const vazio = (r, c, s) => `<c r="${col(c)}${r}" s="${s}"/>`;
  const linhas = [`<row r="1" ht="30" customHeight="1">${cab.map((h, c) => cel(1, c, h, c >= nM0 && c <= nM1 ? 2 : 1)).join("")}</row>`];
  clientes.forEach((o, i) => {
    const r = i + 2, kC = new Set((o.compra || []).map(chaveMarca)), kP = new Set((o.prosp || []).map(chaveMarca));
    const fix = [o.cnpj, o.nome, o.razao, o.cidade, o.uf, o.resp, o.cat, (o.compra || []).join(", ")].map((v, c) => v ? cel(r, c, v, 3) : vazio(r, c, 3)).join("");
    const mc = umaCel ? (() => { const v = marcas.filter(m => kP.has(chaveMarca(m)) && !kC.has(chaveMarca(m))).join(", "); return v ? cel(r, nM0, v, 5) : vazio(r, nM0, 5); })() : marcas.map((m, j) => { const c = nM0 + j, k = chaveMarca(m); return kC.has(k) ? cel(r, c, "compra", 4) : kP.has(k) ? cel(r, c, "X", 5) : vazio(r, c, 5); }).join("");
    linhas.push(`<row r="${r}">${fix}${mc}${vazio(r, ult, 3)}</row>`);
  });
  const larg = [16, 34, 30, 18, 5, 16, 13, 22, ...(umaCel ? [42] : marcas.map(m => Math.max(12, Math.min(15, m.length + 3)))), 30];
  const listaM = esc(`"${marcas.join(",")}"`);
  const regras = umaCel
    ? `<conditionalFormatting sqref="${col(nM0)}2:${col(nM0)}${Math.max(2, nL)}"><cfRule type="notContainsBlanks" dxfId="0" priority="1"><formula>LEN(TRIM(${col(nM0)}2))&gt;0</formula></cfRule></conditionalFormatting>
<dataValidations count="1"><dataValidation type="list" errorStyle="warning" allowBlank="1" showInputMessage="1" showErrorMessage="1" errorTitle="Várias marcas" error="Para mais de uma marca, separe por vírgula (ex.: Zagonel, PADO). Clique em Sim para manter." promptTitle="Marcas em prospecção" prompt="Escolha a marca. Para várias: separe por vírgula (no Google Planilhas, ative Permitir várias seleções)." sqref="${col(nM0)}2:${col(nM0)}${Math.max(2, nL)}"><formula1>${listaM}</formula1></dataValidation></dataValidations>`
    : null;
  const faixa = `${col(nM0)}2:${col(nM1)}${Math.max(2, nL)}`;
  const sheet1 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr filterMode="false"><pageSetUpPr fitToPage="1"/></sheetPr>
<dimension ref="A1:${col(ult)}${nL}"/>
<sheetViews><sheetView workbookViewId="0" tabSelected="1"><pane xSplit="2" ySplit="1" topLeftCell="C2" activePane="bottomRight" state="frozen"/><selection pane="bottomRight" activeCell="${col(nM0)}2" sqref="${col(nM0)}2"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>${larg.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>
<sheetData>${linhas.join("")}</sheetData>
<autoFilter ref="A1:${col(ult)}${nL}"/>
${regras || `<conditionalFormatting sqref="${faixa}"><cfRule type="cellIs" dxfId="0" priority="1" operator="equal"><formula>"X"</formula></cfRule></conditionalFormatting>
<dataValidations count="1"><dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="1" errorTitle="Valor inválido" error="Marque com X a marca em prospecção (ou deixe vazio). &quot;compra&quot; = o cliente já compra a marca." promptTitle="Prospecção" prompt="X = em prospecção · vazio = não" sqref="${faixa}"><formula1>"X"</formula1></dataValidation></dataValidations>`}
<pageMargins left="0.3" right="0.3" top="0.4" bottom="0.4" header="0.2" footer="0.2"/>
<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
  const ajuda = umaCel ? [
    "Planilha de prospecção — TeamCheck (uma célula com várias marcas)",
    "",
    "1. Na aba Prospecção, a coluna \"Marcas em prospecção\" recebe TODAS as marcas do cliente, separadas por vírgula. Ex.: Zagonel, PADO, Tintas Dacar",
    "2. GOOGLE PLANILHAS: Arquivo › Importar este arquivo › selecione a coluna › Dados › Validação de dados › clique na regra › Avançado › marque \"Permitir várias seleções\". Aí a lista deixa escolher várias marcas na mesma célula.",
    "3. EXCEL: escolha uma marca na lista e digite as outras separadas por vírgula. Se aparecer o aviso, clique em Sim para manter.",
    "4. Célula vazia = sem prospecção. Tirar uma marca da célula encerra a prospecção dela (você confirma antes de gravar).",
    "5. \"Já compra\" mostra as marcas que o cliente já compra; se forem digitadas na prospecção, são ignoradas.",
    "6. Não altere a coluna CNPJ: é ela que identifica o cliente. Pode filtrar, ordenar e apagar linhas à vontade.",
    "7. Baixe como .xlsx (ou CSV) e carregue em TeamCheck › CRM › Empresas › Carregar prospecção. Antes de gravar aparece um resumo.",
    "",
    `Gerada em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Cuiaba" })} · ${clientes.length} clientes · marcas: ${marcas.join(", ")}`,
  ] : [
    "Planilha de prospecção — TeamCheck",
    "",
    "1. Na aba Prospecção, cada coluna de marca tem uma lista suspensa: escolha X para marcar a marca em prospecção.",
    "2. Vazio = não está em prospecção. Apagar um X encerra a prospecção daquela marca (você confirma antes de gravar).",
    "3. \"compra\" (cinza) = o cliente já compra a marca. Não precisa marcar; essas células são ignoradas.",
    "4. Não altere a coluna CNPJ: é ela que identifica o cliente. Pode filtrar, ordenar e apagar linhas à vontade.",
    "5. Salve e carregue em TeamCheck › CRM › Empresas › Carregar prospecção. Antes de gravar aparece um resumo.",
    "",
    `Gerada em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Cuiaba" })} · ${clientes.length} clientes · marcas: ${marcas.join(", ")}`,
  ];
  const sheet2 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="120" customWidth="1"/></cols>
<sheetData>${ajuda.map((t, i) => `<row r="${i + 1}">${t ? cel(i + 1, 0, t, i === 0 ? 6 : 0) : ""}</row>`).join("")}</sheetData></worksheet>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="5"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF8A8A8A"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF1F6F4A"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF0578A6"/><name val="Calibri"/></font></fonts>
<fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F1B2D"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0578A6"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEDEDED"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF8E8"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD0D7DE"/></left><right style="thin"><color rgb="FFD0D7DE"/></right><top style="thin"><color rgb="FFD0D7DE"/></top><bottom style="thin"><color rgb="FFD0D7DE"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="7">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="49" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="49" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="49" fontId="2" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf numFmtId="49" fontId="3" fillId="5" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
<dxfs count="1"><dxf><font><b/><color rgb="FF006100"/></font><fill><patternFill patternType="solid"><bgColor rgb="FFC6EFCE"/></patternFill></fill></dxf></dxfs>
</styleSheet>`;
  const wb = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<bookViews><workbookView activeTab="0"/></bookViews>
<sheets><sheet name="Prospecção" sheetId="1" r:id="rId1"/><sheet name="Como usar" sheetId="2" r:id="rId2"/></sheets>
<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'Prospecção'!$A$1:$${col(ult)}$${nL}</definedName></definedNames>
</workbook>`;
  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  return zipStore([["[Content_Types].xml", ct], ["_rels/.rels", rels], ["xl/workbook.xml", wb], ["xl/_rels/workbook.xml.rels", wbRels], ["xl/styles.xml", styles], ["xl/worksheets/sheet1.xml", sheet1], ["xl/worksheets/sheet2.xml", sheet2]]);
}

// ── Ler a planilha ────────────────────────────────────────────────────
async function inflar(bytes) {
  if (typeof DecompressionStream === "undefined") throw new Error("Este navegador não abre .xlsx compactado. Salve a planilha como CSV e carregue de novo.");
  const ds = new DecompressionStream("deflate-raw");
  const buf = await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer();
  return new Uint8Array(buf);
}
async function unzip(buf) {
  const u8 = new Uint8Array(buf), dv = new DataView(buf); let e = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error("Arquivo não é um Excel (.xlsx) válido.");
  const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const out = {};
  const dec = new TextDecoder();
  for (let k = 0; k < n; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const met = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
    const nome = dec.decode(u8.subarray(p + 46, p + 46 + nl));
    out[nome] = { met, csz, lo };
    p += 46 + nl + xl + cl;
  }
  const ler = async nome => { const f = out[nome]; if (!f) return null; const ln = dv.getUint16(f.lo + 26, true), lx = dv.getUint16(f.lo + 28, true); const ini = f.lo + 30 + ln + lx; const raw = u8.subarray(ini, ini + f.csz);
    return dec.decode(f.met === 0 ? raw : await inflar(raw)); };
  return { nomes: Object.keys(out), ler };
}
const idxCol = ref => { const m = String(ref || "").match(/^([A-Z]+)/); if (!m) return -1; let n = 0; for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };
async function lerXlsx(buf) {
  const z = await unzip(buf);
  const dp = new DOMParser();
  // 1ª aba do livro (normalmente "Prospecção")
  let alvo = "xl/worksheets/sheet1.xml";
  try { const wb = dp.parseFromString(await z.ler("xl/workbook.xml"), "application/xml"); const rels = dp.parseFromString(await z.ler("xl/_rels/workbook.xml.rels"), "application/xml");
    const s0 = wb.getElementsByTagName("sheet")[0]; const rid = s0 && (s0.getAttribute("r:id") || s0.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id"));
    const rel = [...rels.getElementsByTagName("Relationship")].find(r => r.getAttribute("Id") === rid); if (rel) { const t = rel.getAttribute("Target").replace(/^\/?(xl\/)?/, ""); alvo = "xl/" + t; } } catch { /* usa sheet1 */ }
  const ss = [];
  const sx = await z.ler("xl/sharedStrings.xml");
  if (sx) { const d = dp.parseFromString(sx, "application/xml"); for (const si of d.getElementsByTagName("si")) ss.push([...si.getElementsByTagName("t")].map(t => t.textContent).join("")); }
  const sh = await z.ler(alvo); if (!sh) throw new Error("Não encontrei a aba de dados na planilha.");
  const d = dp.parseFromString(sh, "application/xml");
  const linhas = [];
  for (const row of d.getElementsByTagName("row")) {
    const r = Number(row.getAttribute("r")) - 1; const vals = [];
    for (const c of row.getElementsByTagName("c")) {
      const ci = idxCol(c.getAttribute("r")); const t = c.getAttribute("t"); let v = "";
      if (t === "s") { const vv = c.getElementsByTagName("v")[0]; v = vv ? (ss[Number(vv.textContent)] ?? "") : ""; }
      else if (t === "inlineStr") v = [...c.getElementsByTagName("t")].map(x => x.textContent).join("");
      else { const vv = c.getElementsByTagName("v")[0]; v = vv ? vv.textContent : ""; }
      if (ci >= 0) vals[ci] = v;
    }
    linhas[r >= 0 ? r : linhas.length] = vals;
  }
  const todas = linhas.filter(Boolean).map(l => Array.from(l, x => x ?? ""));
  return { cab: todas[0] || [], linhas: todas.slice(1) };
}
function lerCsv(txt) {
  txt = txt.replace(/^﻿/, "");
  const prim = txt.split(/\r?\n/)[0] || ""; const sep = (prim.match(/;/g) || []).length >= (prim.match(/,/g) || []).length ? ";" : ",";
  const out = []; let lin = [], cur = "", q = false;
  for (let i = 0; i < txt.length; i++) { const ch = txt[i];
    if (q) { if (ch === '"') { if (txt[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true; else if (ch === sep) { lin.push(cur); cur = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && txt[i + 1] === "\n") i++; lin.push(cur); out.push(lin); lin = []; cur = ""; }
    else cur += ch; }
  if (cur || lin.length) { lin.push(cur); out.push(lin); }
  const todas = out.filter(l => l.some(c => String(c).trim()));
  return { cab: todas[0] || [], linhas: todas.slice(1) };
}
export async function lerPlanilha(file) {
  const nome = String(file.name || "").toLowerCase();
  if (nome.endsWith(".csv") || nome.endsWith(".txt")) return lerCsv(await file.text());
  if (nome.endsWith(".xls")) throw new Error("Formato .xls antigo não é aceito. Salve como .xlsx (Pasta de Trabalho do Excel) ou CSV.");
  return lerXlsx(await file.arrayBuffer());
}
// Célula "Marcas em prospecção" → marcas reconhecidas + nomes não reconhecidos (aceita , ; / | e quebra de linha)
export const marcasDaCelula = (v, marcas, chaveMarca) => {
  const ok = [], nao = [];
  String(v ?? "").split(/[,;\/|\n]+/).map(t => t.trim()).filter(Boolean).forEach(t => { const k = chaveMarca(t);
    const m = marcas.find(x => chaveMarca(x) === k) || (k.length >= 4 ? marcas.find(x => chaveMarca(x).includes(k) || k.includes(chaveMarca(x))) : null);
    if (m) { if (!ok.includes(m)) ok.push(m); } else nao.push(t); });
  return { ok, nao };
};
// Valor da célula de marca → marcado?  (X, SIM, S, 1, OK, ✓, P/PROSP…)  "compra" e vazio = não
export const marcado = v => { const t = String(v ?? "").trim().toLowerCase(); if (!t || t.startsWith("compra")) return false; return /^(x|sim|s|1|ok|✓|✔|p|prosp)/.test(t); };
