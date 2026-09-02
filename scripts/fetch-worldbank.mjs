// ---------------------------------------------------------------------------
// fetch-worldbank.mjs
//
// 從世界銀行公開 API 抓取中國長期年度序列，產生 src/worldbank.js。
//
//   node scripts/fetch-worldbank.mjs
//
// 需求：Node 18 以上（使用內建 fetch）。不需要 npm install。
//
// 為什麼全部走世界銀行，而不是分別接 IMF / BIS / OECD？
//   世銀本身就轉載 IMF IFS、BIS、ILO 的資料，並統一成同一套 API 格式。
//   接一個穩定的來源，比接五個各自有 SDMX 格式、金鑰要求與改版風險的
//   來源可靠得多。缺點是更新較慢（多落後 1–2 年），且沒有月度資料。
//
// 產生的 src/worldbank.js 是機器生成檔，請勿手動編輯 —— 每次執行都會整份覆寫。
// 官方核實值仍然放在 data.js 的 V 物件，兩者在 data.js 內合併，
// 重疊年度一律以官方值為準。
// ---------------------------------------------------------------------------

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/worldbank.js");

const BASE = "https://api.worldbank.org/v2";
const COUNTRY = "CHN";
const START_YEAR = 2000; // 想要更長就往前調，世銀多數序列可回溯到 1960

// ---------------------------------------------------------------------------
// 單國時間序列
//
// id       對應 data.js 的指標編號
// code     世界銀行指標代碼
// unit     單位（顯示用）
// caliber  口徑是否與中國官方定義有差異。true 時 UI 應提示不可直接比較。
// mergeable 預設 true。false 表示單位與官方值不同（例如官方用兆元、世銀用%或美元），
//          不可併入同一張圖，data.js 會保留官方值、另存世銀序列。
// origin   世銀轉載自哪個機構（透明度用）
// ---------------------------------------------------------------------------
const SERIES = [
  // ---- 經濟 ----
  { id: 2, code: "NY.GDP.MKTP.KD.ZG", unit: "%", caliber: false, origin: "World Bank / NBS",
    label: { zh: "實質GDP年增率", en: "Real GDP growth", ja: "実質GDP成長率" } },

  { id: 6, code: "NE.GDI.FTOT.ZS", unit: "% of GDP", caliber: true, mergeable: false, origin: "World Bank",
    label: { zh: "固定資本形成占GDP比", en: "Gross fixed capital formation (% of GDP)", ja: "総固定資本形成（対GDP比）" } },

  { id: 8, code: "BX.KLT.DINV.CD.WD", unit: "億美元", caliber: true, origin: "IMF BOP",
    transform: (v) => Math.round((v / 1e8) * 10) / 10,
    label: { zh: "外人直接投資淨流入", en: "FDI net inflows", ja: "対内直接投資（純流入）" } },

  { id: 9, code: "TX.VAL.MRCH.CD.WD", unit: "億美元", caliber: true, mergeable: false, origin: "UN Comtrade via WB",
    transform: (v) => Math.round((v / 1e8) * 10) / 10,
    label: { zh: "貨物出口總額", en: "Merchandise exports", ja: "物品輸出総額" } },

  { id: 11, code: "TX.VAL.TECH.MF.ZS", unit: "%", caliber: false, origin: "UN Comtrade via WB",
    label: { zh: "高科技產品出口占製造業出口比", en: "High-tech exports (% of manufactured exports)", ja: "ハイテク製品輸出比率" } },

  { id: 12, code: "FP.CPI.TOTL.ZG", unit: "%", caliber: false, origin: "IMF IFS via WB",
    label: { zh: "消費者物價年增率", en: "CPI inflation", ja: "消費者物価上昇率" } },

  { id: 16, code: "NV.IND.TOTL.KD.ZG", unit: "%", caliber: true, origin: "World Bank",
    label: { zh: "工業增加值年增率", en: "Industry value added growth", ja: "工業付加価値成長率" } },

  { id: 17, code: "NV.SRV.TOTL.KD.ZG", unit: "%", caliber: true, origin: "World Bank",
    label: { zh: "服務業增加值年增率", en: "Services value added growth", ja: "サービス業付加価値成長率" } },

  // ---- 金融 ----
  { id: 19, code: "FB.BNK.CAPA.ZS", unit: "%", caliber: true, origin: "IMF FSI via WB",
    label: { zh: "銀行資本占資產比", en: "Bank capital to assets ratio", ja: "銀行資本・資産比率" } },

  { id: 20, code: "FR.INR.LEND", unit: "%", caliber: true, origin: "IMF IFS via WB",
    label: { zh: "銀行貸款利率", en: "Lending interest rate", ja: "貸出金利" } },

  { id: 21, code: "FM.LBL.BMNY.ZG", unit: "%", caliber: true, origin: "IMF IFS via WB",
    label: { zh: "廣義貨幣(M2)年增率", en: "Broad money growth", ja: "広義マネー（M2）伸び率" } },

  { id: 22, code: "FB.AST.NPER.ZS", unit: "%", caliber: true, origin: "IMF FSI via WB",
    label: { zh: "不良貸款占總貸款比", en: "NPLs to total gross loans", ja: "不良債権比率" } },

  { id: 23, code: "FS.AST.PRVT.GD.ZS", unit: "% of GDP", caliber: true, origin: "IMF IFS via WB",
    label: { zh: "民間部門國內信貸占GDP比", en: "Domestic credit to private sector (% of GDP)", ja: "民間部門向け国内信用（対GDP比）" } },

  // ---- 財政 ----
  { id: 32, code: "GC.DOD.TOTL.GD.ZS", unit: "% of GDP", caliber: true, origin: "IMF GFS via WB",
    label: { zh: "中央政府債務占GDP比", en: "Central government debt (% of GDP)", ja: "中央政府債務（対GDP比）" } },

  // ---- 社會 ----
  { id: 37, code: "SL.UEM.TOTL.ZS", unit: "%", caliber: true, origin: "ILO modelled estimate",
    label: { zh: "失業率（ILO推估）", en: "Unemployment rate (ILO modelled)", ja: "失業率（ILO推計）" } },

  { id: 38, code: "SI.POV.GINI", unit: "", caliber: true, origin: "World Bank PIP",
    label: { zh: "吉尼係數", en: "Gini index", ja: "ジニ係数" } },

  { id: 40, code: "FS.AST.DOMS.GD.ZS", unit: "% of GDP", caliber: true, origin: "IMF IFS via WB",
    label: { zh: "國內信貸總額占GDP比", en: "Domestic credit provided by financial sector (% of GDP)", ja: "国内信用総額（対GDP比）" } },

  { id: 41, code: "SP.DYN.CBRT.IN", unit: "‰", caliber: true, origin: "UN WPP via WB",
    label: { zh: "粗出生率", en: "Crude birth rate (per 1,000)", ja: "粗出生率（人口千対）" } },

  { id: 42, code: "SP.POP.65UP.TO.ZS", unit: "%", caliber: false, origin: "UN WPP via WB",
    label: { zh: "65歲以上人口占比", en: "Population ages 65+ (% of total)", ja: "65歳以上人口比率" } },
];

// ---------------------------------------------------------------------------
// 跨國比較快照（取最新有資料的年度，做各國橫向比較）
// 圖表型態為長條圖，p 是國名而非年份。
// ---------------------------------------------------------------------------
const G20 = "ARG;AUS;BRA;CAN;CHN;FRA;DEU;IND;IDN;ITA;JPN;KOR;MEX;RUS;SAU;ZAF;TUR;GBR;USA";

const CROSS = [
  {
    id: 34,
    code: "GC.DOD.TOTL.GD.ZS",
    countries: G20,
    unit: "% of GDP",
    caliber: true,
    origin: "IMF GFS via WB",
    label: { zh: "G20政府債務占GDP比", en: "G20 central government debt (% of GDP)", ja: "G20政府債務（対GDP比）" },
  },
];

// 國名中譯（跨國比較圖表用）
const CN_NAME = {
  Argentina: "阿根廷", Australia: "澳洲", Brazil: "巴西", Canada: "加拿大",
  China: "中國", France: "法國", Germany: "德國", India: "印度",
  Indonesia: "印尼", Italy: "義大利", Japan: "日本", "Korea, Rep.": "南韓",
  Mexico: "墨西哥", "Russian Federation": "俄羅斯", "Saudi Arabia": "沙烏地",
  "South Africa": "南非", "Turkiye": "土耳其", Türkiye: "土耳其",
  "United Kingdom": "英國", "United States": "美國",
};

// ---------------------------------------------------------------------------

async function getJson(url, attempt = 1) {
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json) || json.length < 2) throw new Error("unexpected response shape");
    if (json[0]?.message) throw new Error(json[0].message[0]?.value || "API message");
    return json[1];
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, attempt * 1500));
      return getJson(url, attempt + 1);
    }
    throw err;
  }
}

async function fetchSeries(spec) {
  const url = `${BASE}/country/${COUNTRY}/indicator/${spec.code}` +
    `?format=json&per_page=500&date=${START_YEAR}:${new Date().getFullYear()}`;
  try {
    const rows = await getJson(url);
    if (!Array.isArray(rows)) return { ...spec, series: [] };
    const series = rows
      .filter((r) => r && r.value !== null && r.value !== undefined)
      .map((r) => ({
        p: String(r.date),
        v: spec.transform ? spec.transform(r.value) : Math.round(r.value * 100) / 100,
      }))
      .sort((a, b) => Number(a.p) - Number(b.p));
    return { ...spec, series };
  } catch (err) {
    return { ...spec, series: [], error: err.message };
  }
}

async function fetchCross(spec) {
  const url = `${BASE}/country/${spec.countries}/indicator/${spec.code}` +
    `?format=json&per_page=2000&date=${new Date().getFullYear() - 12}:${new Date().getFullYear()}`;
  try {
    const rows = await getJson(url);
    if (!Array.isArray(rows)) return { ...spec, series: [] };

    const valid = rows.filter((r) => r && r.value !== null && r.value !== undefined);
    if (!valid.length) return { ...spec, series: [] };

    // 選一個涵蓋國家數最多的年度（越新越好）
    const byYear = {};
    for (const r of valid) {
      (byYear[r.date] ||= []).push(r);
    }
    const best = Object.entries(byYear)
      .sort((a, b) => b[1].length - a[1].length || Number(b[0]) - Number(a[0]))[0];

    const [year, entries] = best;
    const series = entries
      .map((r) => ({
        p: CN_NAME[r.country?.value] || r.country?.value || r.countryiso3code,
        v: Math.round(r.value * 10) / 10,
      }))
      .sort((a, b) => b.v - a.v);

    return { ...spec, series, snapshotYear: year, countryCount: series.length };
  } catch (err) {
    return { ...spec, series: [], error: err.message };
  }
}

function renderEntry(r) {
  const pts = r.series.map((d) => `{ p: ${JSON.stringify(d.p)}, v: ${d.v} }`).join(", ");
  const extra = r.snapshotYear
    ? `\n    snapshotYear: "${r.snapshotYear}",\n    kind: "cross-country",`
    : `\n    from: "${r.series[0].p}",\n    to: "${r.series[r.series.length - 1].p}",\n    kind: "series",`;
  return `  ${r.id}: {
    code: "${r.code}",
    label: ${JSON.stringify(r.label)},
    unit: ${JSON.stringify(r.unit)},
    origin: ${JSON.stringify(r.origin)},
    caliber: ${r.caliber},
    mergeable: ${r.mergeable !== false},${extra}
    data: [${pts}],
  },`;
}

function render(results, fetchedAt) {
  const entries = results.filter((r) => r.series.length > 0).map(renderEntry).join("\n");
  return `// ---------------------------------------------------------------------------
// 機器生成檔 —— 請勿手動編輯。
// 由 scripts/fetch-worldbank.mjs 產生，每次執行整份覆寫。
//
// 來源：World Bank Open Data (https://data.worldbank.org/)
// 授權：CC BY 4.0
// 抓取時間：${fetchedAt}
//
// 這裡的數值是國際機構估算或轉載，不是中國官方公布值。
// caliber: true 表示口徑與中國官方定義有差異，不可直接比較。
// origin   表示世銀本身是轉載自哪個機構。
// kind     "series" 為時間序列；"cross-country" 為某一年度的各國橫向比較。
// mergeable false 表示單位與官方值不同，不可併入同一張圖。
// ---------------------------------------------------------------------------

export const fetchedAt = "${fetchedAt}";

export const worldBank = {
${entries}
};

export default worldBank;
`;
}

async function main() {
  console.log(`從世界銀行抓取（${START_YEAR} 年起）\n`);
  const results = [];

  console.log("── 單國時間序列 ──");
  for (const spec of SERIES) {
    process.stdout.write(`#${String(spec.id).padStart(2)} ${spec.code.padEnd(22)} `);
    const r = await fetchSeries(spec);
    results.push(r);
    if (r.error) console.log(`失敗：${r.error}`);
    else if (!r.series.length) console.log("查無資料");
    else console.log(`${String(r.series.length).padStart(2)} 筆　${r.series[0].p}–${r.series[r.series.length - 1].p}`);
  }

  console.log("\n── 跨國比較 ──");
  for (const spec of CROSS) {
    process.stdout.write(`#${String(spec.id).padStart(2)} ${spec.code.padEnd(22)} `);
    const r = await fetchCross(spec);
    results.push(r);
    if (r.error) console.log(`失敗：${r.error}`);
    else if (!r.series.length) console.log("查無資料");
    else console.log(`${r.countryCount} 國　${r.snapshotYear} 年快照`);
  }

  const ok = results.filter((r) => r.series.length > 0);
  if (!ok.length) {
    console.error("\n全部抓取失敗，未寫入檔案。請確認可連上 api.worldbank.org。");
    process.exitCode = 1;
    return;
  }

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, render(results, new Date().toISOString()), "utf8");

  console.log(`\n已寫入 ${OUT}`);
  console.log(`成功 ${ok.length} / ${results.length} 項`);

  const failed = results.filter((r) => !r.series.length).map((r) => `#${r.id}`);
  if (failed.length) console.log(`無資料：${failed.join(" ")}（世銀該指標對中國覆蓋不足，屬正常）`);

  const flagged = ok.filter((r) => r.caliber).map((r) => `#${r.id}`);
  if (flagged.length) console.log(`口徑與官方不同，UI 標示提示：${flagged.join(" ")}`);

  const nomerge = ok.filter((r) => r.mergeable === false).map((r) => `#${r.id}`);
  if (nomerge.length) console.log(`單位與官方不同，不併入同圖：${nomerge.join(" ")}`);
}

main();
