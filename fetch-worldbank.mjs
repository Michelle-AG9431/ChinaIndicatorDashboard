// ---------------------------------------------------------------------------
// fetch-worldbank.mjs
//
// 從世界銀行公開 API 抓取中國長期年度序列，產生 src/worldbank.js。
//
//   node scripts/fetch-worldbank.mjs
//
// 需求：Node 18 以上（使用內建 fetch）。不需要 npm install。
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

const COUNTRY = "CHN";
const START_YEAR = 2000; // 想要更長就往前調，世銀多數序列可回溯到 1960

// ---------------------------------------------------------------------------
// 指標對照表
//
// id       對應 data.js 的指標編號
// code     世界銀行指標代碼
// unit     單位（顯示用）
// caliber  口徑是否與中國官方定義有差異。true 時 UI 應提示不可直接比較。
// ---------------------------------------------------------------------------
const SERIES = [
  {
    id: 2,
    code: "NY.GDP.MKTP.KD.ZG",
    label: { zh: "實質GDP年增率", en: "Real GDP growth", ja: "実質GDP成長率" },
    unit: "%",
    caliber: false, // 與國家統計局公布值高度一致
  },
  {
    id: 12,
    code: "FP.CPI.TOTL.ZG",
    label: { zh: "消費者物價年增率", en: "CPI inflation", ja: "消費者物価上昇率" },
    unit: "%",
    caliber: false,
  },
  {
    id: 11,
    code: "TX.VAL.TECH.MF.ZS",
    label: { zh: "高科技產品出口占製造業出口比", en: "High-tech exports (% of manufactured exports)", ja: "ハイテク製品輸出比率" },
    unit: "%",
    caliber: false,
  },
  {
    id: 37,
    code: "SL.UEM.TOTL.ZS",
    label: { zh: "失業率（ILO推估）", en: "Unemployment rate (ILO modelled)", ja: "失業率（ILO推計）" },
    unit: "%",
    caliber: true, // ILO 全國口徑，含農村；與中國「城鎮調查失業率」不同
  },
  {
    id: 38,
    code: "SI.POV.GINI",
    label: { zh: "吉尼係數", en: "Gini index", ja: "ジニ係数" },
    unit: "",
    caliber: true, // 與「五等分收入」非同一衡量方式
  },
  {
    id: 42,
    code: "SP.POP.65UP.TO.ZS",
    label: { zh: "65歲以上人口占比", en: "Population ages 65+ (% of total)", ja: "65歳以上人口比率" },
    unit: "%",
    caliber: false,
  },
  {
    id: 23,
    code: "FS.AST.PRVT.GD.ZS",
    label: { zh: "民間部門國內信貸占GDP比", en: "Domestic credit to private sector (% of GDP)", ja: "民間部門向け国内信用（対GDP比）" },
    unit: "%",
    caliber: true, // 與「人民幣存放款餘額」口徑不同
  },
  {
    id: 8,
    code: "BX.KLT.DINV.CD.WD",
    label: { zh: "外人直接投資淨流入", en: "FDI net inflows", ja: "対内直接投資（純流入）" },
    unit: "億美元",
    caliber: true, // 世銀以美元計，與商務部人民幣口徑不同
    transform: (v) => Math.round((v / 1e8) * 10) / 10, // 美元 → 億美元
  },
  {
    id: 41,
    code: "SP.DYN.CBRT.IN",
    label: { zh: "粗出生率", en: "Crude birth rate (per 1,000)", ja: "粗出生率（人口千対）" },
    unit: "‰",
    caliber: true, // 官方 #41 為出生人數（萬人），此處為每千人出生率
  },
];

// ---------------------------------------------------------------------------

const api = (code) =>
  `https://api.worldbank.org/v2/country/${COUNTRY}/indicator/${code}` +
  `?format=json&per_page=500&date=${START_YEAR}:${new Date().getFullYear()}`;

async function fetchOne(spec, attempt = 1) {
  const url = api(spec.code);
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    // 世銀回傳 [metadata, rows]；查無資料時 rows 可能是 null
    if (!Array.isArray(json) || json.length < 2) {
      throw new Error("unexpected response shape");
    }
    if (json[0]?.message) {
      throw new Error(json[0].message[0]?.value || "API returned a message");
    }
    const rows = json[1];
    if (!Array.isArray(rows)) return { ...spec, series: [], note: "no rows" };

    const series = rows
      .filter((r) => r && r.value !== null && r.value !== undefined)
      .map((r) => ({
        p: String(r.date),
        v: spec.transform ? spec.transform(r.value) : Math.round(r.value * 100) / 100,
      }))
      .sort((a, b) => Number(a.p) - Number(b.p)); // 世銀預設由新到舊，改為由舊到新

    return { ...spec, series };
  } catch (err) {
    if (attempt < 3) {
      const wait = attempt * 1500;
      console.log(`   重試 ${attempt}/2（${wait}ms 後）— ${err.message}`);
      await new Promise((r) => setTimeout(r, wait));
      return fetchOne(spec, attempt + 1);
    }
    return { ...spec, series: [], error: err.message };
  }
}

function render(results, fetchedAt) {
  const entries = results
    .filter((r) => r.series.length > 0)
    .map((r) => {
      const pts = r.series.map((d) => `{ p: "${d.p}", v: ${d.v} }`).join(", ");
      return `  ${r.id}: {
    code: "${r.code}",
    label: ${JSON.stringify(r.label)},
    unit: ${JSON.stringify(r.unit)},
    caliber: ${r.caliber},
    from: "${r.series[0].p}",
    to: "${r.series[r.series.length - 1].p}",
    data: [${pts}],
  },`;
    })
    .join("\n");

  return `// ---------------------------------------------------------------------------
// 機器生成檔 —— 請勿手動編輯。
// 由 scripts/fetch-worldbank.mjs 產生，每次執行整份覆寫。
//
// 來源：World Bank Open Data (https://data.worldbank.org/)
// 授權：CC BY 4.0
// 抓取時間：${fetchedAt}
//
// 這裡的數值是國際機構估算，不是中國官方公布值。
// caliber: true 表示口徑與中國官方定義有差異，不可直接比較。
// ---------------------------------------------------------------------------

export const fetchedAt = "${fetchedAt}";

export const worldBank = {
${entries}
};

export default worldBank;
`;
}

async function main() {
  console.log(`從世界銀行抓取中國資料（${START_YEAR} 年起）…\n`);

  const results = [];
  for (const spec of SERIES) {
    process.stdout.write(`#${String(spec.id).padStart(2)} ${spec.code.padEnd(22)} `);
    const r = await fetchOne(spec);
    results.push(r);
    if (r.error) {
      console.log(`失敗：${r.error}`);
    } else if (r.series.length === 0) {
      console.log("查無資料");
    } else {
      console.log(`${r.series.length} 筆　${r.series[0].p}–${r.series[r.series.length - 1].p}`);
    }
  }

  const ok = results.filter((r) => r.series.length > 0);
  if (ok.length === 0) {
    console.error("\n全部抓取失敗，未寫入檔案。請確認網路可連上 api.worldbank.org。");
    process.exitCode = 1;
    return;
  }

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, render(results, new Date().toISOString()), "utf8");

  console.log(`\n已寫入 ${OUT}`);
  console.log(`成功 ${ok.length} / ${SERIES.length} 項`);

  const flagged = ok.filter((r) => r.caliber).map((r) => `#${r.id}`);
  if (flagged.length) {
    console.log(`口徑與官方不同，UI 會標示提示：${flagged.join(" ")}`);
  }
}

main();
