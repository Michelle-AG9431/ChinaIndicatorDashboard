// ---------------------------------------------------------------------------
// China Monitoring — 50 indicators dataset (trilingual: zh / en / ja)
// Update this file to maintain the dashboard. Each verified indicator carries
// its data series, update frequency, caliber note (3 languages) and source URL.
// ---------------------------------------------------------------------------

// [zh, en, ja]
import { worldBank, fetchedAt as wbFetchedAt } from "./worldbank.js";

export const names = [
  ["中國經濟成長率預期", "Projected Economic Growth Rate of China", "中国経済成長率見通し（予想）"],
  ["中國經濟成長實際值估計", "Estimated Actual Economic Growth of China", "中国経済成長実績推計値"],
  ["社會消費品零售", "Total Retail Sales of Consumer Goods", "社会消費品小売総額"],
  ["商品房銷售額", "Sales Value of Commercial Residential Properties", "分譲住宅販売額"],
  ["規模以上工業企業產成品資金與產能利用率", "Finished Goods Inventory & Capacity Utilization Rate", "規模型以上工業企業製品在庫資金及び生産能力利用率"],
  ["城鎮固定資產投資（FAI）", "Urban Fixed-Asset Investment (FAI)", "都市部固定資産投資（FAI）"],
  ["高科技製造業投資", "Investment in High-Tech Manufacturing", "ハイテク製造業投資"],
  ["外人直接投資與撤廠估計", "FDI & Factory Relocation/Divestment Estimates", "対中直接投資（FDI）及び工場撤退推計"],
  ["貨物貿易（進出口）", "Trade in Goods (Exports & Imports)", "物品貿易（輸出入）"],
  ["各國對中貿易調查", "Trade & Anti-Dumping Investigations Against China", "各国による対中貿易調査"],
  ["高科技產品出口占比與出口平均價格", "Share of High-Tech Exports & Average Export Prices", "ハイテク製品輸出比率及び平均輸出価格"],
  ["消費者物價指數（CPI）", "Consumer Price Index (CPI)", "消費者物価指数（CPI）"],
  ["生產者物價指數（PPI）", "Producer Price Index (PPI)", "生産者物価指数（PPI）"],
  ["消費者信心指數（CCI）", "Consumer Confidence Index (CCI)", "消費者信頼感指数（CCI）"],
  ["採購經理指數（PMI）", "Purchasing Managers' Index (PMI)", "購買担当者景気指数（PMI）"],
  ["規模以上工業增加值", "Value-Added of Industry Above Designated Size", "規模型以上工業増加値"],
  ["服務業生產指數（ISP）", "Index of Services Production (ISP)", "サービス業生産指数（ISP）"],
  ["撥備覆蓋率（PCR）", "Provision Coverage Ratio (PCR)", "不良債権引当金カバー率（PCR）"],
  ["資本適足率（CAR）", "Capital Adequacy Ratio (CAR)", "自己資本比率（CAR）"],
  ["貨幣市場利率", "Money Market Interest Rates", "短期金融市場金利"],
  ["M2-M1 剪刀差", "M2-M1 Growth Spread (Scissors Gap)", "M1-M2 伸び率格差（シザーズ・ギャップ）"],
  ["不良貸款總額", "Total Non-Performing Loans (NPLs)", "不良債権残高総額"],
  ["人民幣存放款", "RMB Deposits and Loans", "人民幣預貸金残高"],
  ["中國金融機構家數", "Number of Financial Institutions in China", "中国金融機関数"],
  ["股票回購股數統計", "Share Repurchase Volume Statistics", "自社株買い統計及び上海総合指数"],
  ["商業銀行持有政府債務餘額", "Government Debt Held by Commercial Banks", "商業銀行保有政府債務残高"],
  ["商業銀行公債佔資產總額比率", "Ratio of Government Bonds to Total Assets", "商業銀行の総資産に占める国債保有比率"],
  ["中國全國廣義財政收支", "China's Broad National Fiscal Revenue & Expenditure", "中国全国広義財政収支"],
  ["中國地方廣義財政收支", "China's Broad Local Fiscal Revenue & Expenditure", "中国地方広義財政収支"],
  ["中國財政收入結構", "Structure of China's Fiscal Revenue", "中国財政収入構造"],
  ["中國財政支出結構", "Structure of China's Fiscal Expenditure", "中国財政支出構造"],
  ["中國政府債務餘額（中央、地方、城投債）", "Total Government Debt (Central, Local, LGFV)", "中国政府債務残高（中央・地方・城投債）"],
  ["中國隱藏性債務估計", "Estimates of China's Hidden/Implicit Debt", "中国隠れ債務推計"],
  ["G20 政府債務餘額、占GDP比、占財政收入比", "G20 Debt Outstanding, Debt-to-GDP & Debt-to-Revenue", "G20諸国の政府債務残高、対GDP比、対財政収入比"],
  ["新發債務項目與總額", "Newly Issued Debt Projects and Total Volume", "新規起債項目及び発行総額"],
  ["新增財政政策相關法規", "Newly Enacted Fiscal Policy Laws & Regulations", "新設財政政策関連法規"],
  ["失業率：勞動人口及青年失業率", "Unemployment: Total Labor Force & Youth", "失業率：労働力人口及び若年層失業率"],
  ["收入不平等：五等分收入變化", "Income Inequality: Quintile Income Groups", "所得格差：所得5分位階級別変化"],
  ["經濟信心：收入與就業感受及信心指數", "Economic Sentiment: Income & Employment Confidence", "経済信頼感：所得・雇用実感及びマインド指数"],
  ["負債：消費貸款及個人房貸", "Household Debt: Consumer Loans & Mortgages", "家計債務：消費者ローン及び個人住宅ローン"],
  ["家庭：結婚對數及新生兒數量", "Family: Marriages & Registered Newborns", "家族動態：婚姻件数及び出生児数"],
  ["人口結構：老年人口比例與撫養比", "Demographics: Elderly Ratio & Old-Age Dependency", "人口構造：高齢者人口比率及び老年従属人口指数"],
  ["社會保障：養老保險基金收支及結餘", "Pension Fund Revenue, Expenditure & Balance", "社会保障：基本養老保険基金収支及び残高"],
  ["社會穩定：社會抗爭事件統計", "Social Stability: Protests & Incidents", "社会安定性：社会抗議・抗議行動統計"],
  ["社會穩定：萬人以上突發性集體抗爭", "Social Stability: Mass Incidents (10,000+)", "社会安定性：1万人以上の突発的集団抗議件数"],
  ["高層政治：中全會中央委員與候補委員缺席率", "Elite Politics: Absentee Rates at CCP Plenums", "指導部政治：中央委員・候補委員欠席率"],
  ["高層政治：中央委員／候補委員任內遭免職（18–20大）", "Elite Politics: Members Dismissed During Tenure", "指導部政治：在任中免職者数（第18～20回党大会）"],
  ["軍方人事：解放軍將領兼中央委員任內遭免職", "Military: PLA Generals on Central Committee Dismissed", "軍人事：解放軍将官の在任中免職者数"],
  ["高層反腐：中管幹部遭調查及處分人數", "High-Level Anti-Corruption: Senior Officials Disciplined", "高官腐敗撲滅：省・部長級以上幹部の処分者数"],
  ["基層反腐：全國紀檢監察機關處分人員", "Grassroots Anti-Corruption: Personnel Disciplined", "基層腐敗撲滅：全国規律検査・監察機関による処分者数"],
];

export const categories = [
  { id: "economy", zh: "經濟", en: "Economy", ja: "経済", range: [1, 17], color: "#2563eb" },
  { id: "finance", zh: "金融", en: "Finance", ja: "金融", range: [18, 27], color: "#0891b2" },
  { id: "fiscal", zh: "財政", en: "Fiscal", ja: "財政", range: [28, 36], color: "#7c3aed" },
  { id: "society", zh: "社會", en: "Society", ja: "社会", range: [37, 45], color: "#d97706" },
  { id: "politics", zh: "政治", en: "Politics", ja: "政治", range: [46, 50], color: "#dc2626" },
];

export const catFor = (n) =>
  categories.find((c) => n >= c.range[0] && n <= c.range[1]);

export const chartTypes = ["line","bar","area","line","bar","area","bar","area","bar","bar","line","line","line","line","line","bar","line","line","line","line","area","bar","area","bar","line","area","area","bar","bar","pie","pie","area","area","bar","bar","bar","line","bar","line","area","bar","area","area","bar","bar","bar","bar","bar","bar","bar"];

export const freqMap = {1:"annual",2:"annual",3:"monthly",4:"monthly",5:"monthly",6:"monthly",7:"monthly",8:"quarterly",9:"monthly",10:"event",11:"monthly",12:"monthly",13:"monthly",14:"monthly",15:"monthly",16:"monthly",17:"monthly",18:"quarterly",19:"quarterly",20:"daily",21:"monthly",22:"quarterly",23:"monthly",24:"annual",25:"daily",26:"quarterly",27:"quarterly",28:"monthly",29:"monthly",30:"annual",31:"annual",32:"annual",33:"annual",34:"annual",35:"event",36:"event",37:"monthly",38:"annual",39:"quarterly",40:"quarterly",41:"annual",42:"annual",43:"annual",44:"annual",45:"annual",46:"event",47:"event",48:"event",49:"annual",50:"annual"};

export const freqMeta = {
  annual: { zh: "年報", en: "Annual", ja: "年次" },
  quarterly: { zh: "季報", en: "Quarterly", ja: "四半期" },
  monthly: { zh: "月報", en: "Monthly", ja: "月次" },
  daily: { zh: "每日", en: "Daily", ja: "日次" },
  event: { zh: "事件驅動", en: "Event-based", ja: "イベント" },
};

const nbsUrl = "https://data.stats.gov.cn/";
const gov2025Url = "https://www.gov.cn/zhuanti/2025zgjjnb/index.htm";
const gongbaoUrl = "https://www.gov.cn/lianbo/202602/content_7059980.htm";
const nfraUrl = "https://www.nfra.gov.cn/cn/view/pages/ItemDetail.html?docId=1233335";
const mofUrl = "https://www.mof.gov.cn/gkml/caizhengshuju/index.htm";
const debtUrl = "http://www.npc.gov.cn/c2/c30834/202608/t20260831_457292.html";
const pbocUrl = "http://www.pbc.gov.cn/diaochatongjisi/116219/index.html";

export const sourcePortals = [
  { zh: "國家統計局國家數據", en: "NBS National Data", ja: "国家統計局データ", url: nbsUrl, scope: "GDP, CPI, PPI, PMI, retail, investment, industry, population" },
  { zh: "中國人民銀行調查統計", en: "PBOC Statistics", ja: "中国人民銀行統計", url: pbocUrl, scope: "Money supply, credit, deposits, loans, interest rates" },
  { zh: "國家金融監督管理總局", en: "NFRA", ja: "国家金融監督管理総局", url: nfraUrl, scope: "NPL, provision coverage, capital adequacy" },
  { zh: "財政部財政數據", en: "Ministry of Finance", ja: "財政部財政データ", url: mofUrl, scope: "Fiscal revenue, expenditure, government funds" },
  { zh: "全國人大政府債務報告", en: "NPC Govt Debt Report", ja: "全人代政府債務報告", url: debtUrl, scope: "Central, local and implicit government debt" },
];

// Verified reference values (last-verified official figures).
export const V = {
  1: { latest: "4.5%–5.0%", period: "2026 目標 target", freq: "annual", data: [{ p: "2026目標", v: 4.75 }], noteZh: "政府工作報告目標區間，屬預測；與實績不可混用。", noteEn: "Govt Work Report target range (forecast); not comparable to actual outcomes.", noteJa: "政府活動報告の目標レンジ（予想）。実績とは混用不可。", source: "中國政府工作報告", url: gov2025Url },
  2: { latest: "5.0%", period: "2025", freq: "annual", data: [{ p: "2021", v: 8.4 }, { p: "2022", v: 3.0 }, { p: "2023", v: 5.2 }, { p: "2024", v: 5.0 }, { p: "2025", v: 5.0 }], noteZh: "國家統計局初步核算實質GDP年增率。2020年因疫情基期異常，近5年趨勢供參考。", noteEn: "NBS preliminary real GDP growth. 2020 base distorted by pandemic; last 5 years shown.", noteJa: "国家統計局の実質GDP速報値。2020年はコロナで基準が歪むため直近5年を表示。", source: "2025中國經濟年報／統計公報", url: gov2025Url },
  3: { latest: "50.12兆元", period: "2025 (+3.7%)", freq: "monthly", data: [{ p: "2025", v: 50.12 }], noteZh: "社會消費品零售總額，全年年增3.7%。月度數據可於國家數據查詢。", noteEn: "Total retail sales, +3.7% YoY. Monthly series on NBS portal.", noteJa: "社会消費品小売総額、前年比+3.7%。月次は国家統計局で照会可。", source: "2025中國經濟年報", url: gov2025Url },
  6: { latest: "48.52兆元", period: "2025 (−3.8%)", freq: "monthly", data: [{ p: "2025", v: 48.52 }], noteZh: "固定資產投資（不含農戶）全年年減3.8%，民間投資年減6.4%。", noteEn: "FAI excl. rural households −3.8% YoY; private investment −6.4%.", noteJa: "固定資産投資（農家除く）前年比−3.8%、民間投資−6.4%。", source: "2025中國經濟年報", url: gov2025Url },
  9: { latest: "45.47兆元", period: "2025 (+3.8%)", freq: "monthly", data: [{ p: "2025", v: 45.47 }], noteZh: "貨物進出口總額年增3.8%，出口+6.1%、進口+0.5%。", noteEn: "Goods trade +3.8% YoY; exports +6.1%, imports +0.5%.", noteJa: "物品貿易総額+3.8%、輸出+6.1%、輸入+0.5%。", source: "2025中國經濟年報", url: gov2025Url },
  12: { latest: "0.0%", period: "2025 年 annual", freq: "monthly", data: [{ p: "2021", v: 0.9 }, { p: "2022", v: 2.0 }, { p: "2023", v: 0.2 }, { p: "2024", v: 0.2 }, { p: "2025", v: 0.0 }], noteZh: "全年CPI與上年持平，接近通縮邊緣。月度公布。", noteEn: "Annual CPI flat vs prior year; near deflation. Published monthly.", noteJa: "通年CPIは前年同水準、デフレ寸前。月次公表。", source: "2025中國經濟年報", url: gov2025Url },
  13: { latest: "-2.6%", period: "2025 年 annual", freq: "monthly", data: [{ p: "2021", v: 8.1 }, { p: "2022", v: 4.1 }, { p: "2023", v: -3.0 }, { p: "2024", v: -2.2 }, { p: "2025", v: -2.6 }], noteZh: "PPI連續多年為負，反映工業通縮。月度公布。", noteEn: "PPI negative for several years, reflecting industrial deflation. Monthly.", noteJa: "PPIは数年連続マイナス、工業デフレを反映。月次。", source: "2025中國經濟年報", url: gov2025Url },
  15: { latest: "50.1", period: "2025-12", freq: "monthly", data: [{ p: "2025-08", v: 49.4 }, { p: "2025-09", v: 49.8 }, { p: "2025-10", v: 49.0 }, { p: "2025-11", v: 49.2 }, { p: "2025-12", v: 50.1 }], noteZh: "官方製造業PMI，50為榮枯線。近月在臨界值附近波動。", noteEn: "Official manufacturing PMI; 50 is the expansion line. Hovering near threshold.", noteJa: "公式製造業PMI、50が景気分岐点。閾値付近で推移。", source: "2025中國經濟年報", url: gov2025Url },
  16: { latest: "+5.9%", period: "2025 年 annual", freq: "monthly", data: [{ p: "2025", v: 5.9 }], noteZh: "規模以上工業增加值年增5.9%。月度公布。", noteEn: "Value-added industrial output +5.9% YoY. Monthly.", noteJa: "規模以上工業増加値+5.9%。月次。", source: "2025中國經濟年報", url: gov2025Url },
  17: { latest: "+5.0%", period: "2025-12", freq: "monthly", data: [{ p: "2025-12", v: 5.0 }], noteZh: "12月服務業生產指數同比+5.0%。", noteEn: "Dec Index of Services Production +5.0% YoY.", noteJa: "12月サービス業生産指数+5.0%。", source: "2025中國經濟年報", url: gov2025Url },
  18: { latest: "207.15%", period: "2025 Q3", freq: "quarterly", data: [{ p: "2024Q4", v: 211.19 }, { p: "2025Q1", v: 208.13 }, { p: "2025Q2", v: 211.97 }, { p: "2025Q3", v: 207.15 }], noteZh: "商業銀行撥備覆蓋率，季度公布。", noteEn: "Commercial banks' provision coverage ratio; quarterly.", noteJa: "商業銀行の引当金カバー率、四半期。", source: "NFRA 監管指標", url: nfraUrl },
  19: { latest: "15.36%", period: "2025 Q3", freq: "quarterly", data: [{ p: "2024Q4", v: 15.74 }, { p: "2025Q1", v: 15.28 }, { p: "2025Q2", v: 15.58 }, { p: "2025Q3", v: 15.36 }], noteZh: "資本充足率。⚠️2024年起改用《商業銀行資本管理辦法（新）》，與2023年前資料不可直接比較。", noteEn: "CAR. ⚠️New capital rules since 2024; not directly comparable with pre-2024 data.", noteJa: "自己資本比率。⚠️2024年から新資本規則、2023年以前と直接比較不可。", source: "NFRA 監管指標", url: nfraUrl },
  22: { latest: "3.5兆元", period: "2025 Q3", freq: "quarterly", data: [{ p: "2025Q1", v: 3.4 }, { p: "2025Q2", v: 3.4 }, { p: "2025Q3", v: 3.5 }], noteZh: "商業銀行不良貸款餘額，季度公布；不含關注類貸款。", noteEn: "Commercial banks' NPL balance; quarterly; excludes special-mention loans.", noteJa: "商業銀行の不良債権残高、四半期。要注意先貸出は除く。", source: "NFRA 監管指標", url: nfraUrl },
  28: { latest: "21.60 / 28.74兆元", period: "2025", freq: "monthly", data: [{ p: "收入 Rev", v: 21.60 }, { p: "支出 Exp", v: 28.74 }], noteZh: "全國一般公共預算收入21.60兆、支出28.74兆元；為狹義口徑，廣義另含政府性基金。", noteEn: "National general public budget: revenue 21.60T / expenditure 28.74T. Broad measure adds govt funds.", noteJa: "全国一般公共予算：歳入21.60兆／歳出28.74兆。広義は政府性基金を含む。", source: "財政部：2025預算執行", url: mofUrl },
  32: { latest: "102.5兆元", period: "2025 年末", freq: "annual", data: [{ p: "國債", v: 41.2 }, { p: "地方法定", v: 54.8 }, { p: "隱性", v: 6.5 }], noteZh: "全國政府債務餘額，含法定與存量隱性債務。城投債另計，口徑不同。", noteEn: "Total govt debt incl. statutory & implicit. LGFV debt counted separately (different caliber).", noteJa: "政府債務残高、法定＋隠れ債務。城投債は別集計（定義が異なる）。", source: "全國人大：2025債務報告", url: debtUrl },
  33: { latest: "6.5兆元", period: "2025 年末", freq: "annual", data: [{ p: "2025", v: 6.5 }], noteZh: "官方所列地方政府存量隱性債務；學界估計值通常遠高於此。", noteEn: "Official local-govt implicit debt; academic estimates are typically far higher.", noteJa: "公式の地方政府隠れ債務；学術推計は通常これを大きく上回る。", source: "全國人大：2025債務報告", url: debtUrl },
  35: { latest: "10.3兆元", period: "2025", freq: "event", data: [{ p: "新增 New", v: 5.4 }, { p: "再融資 Refi", v: 4.9 }], noteZh: "地方政府債券發行總額，含新增與再融資。", noteEn: "Local govt bond issuance: new + refinancing.", noteJa: "地方政府債発行総額：新規＋借換。", source: "全國人大：2025債務報告", url: debtUrl },
  37: { latest: "5.2%", period: "2025 平均", freq: "monthly", data: [{ p: "2021", v: 5.1 }, { p: "2022", v: 5.6 }, { p: "2023", v: 5.2 }, { p: "2024", v: 5.1 }, { p: "2025", v: 5.2 }], noteZh: "全國城鎮調查失業率年均。⚠️青年失業率2023年停發後改口徑（排除在校生），須另列，不可與舊值連續比較。", noteEn: "Surveyed urban unemployment (annual avg). ⚠️Youth rate re-based in 2023 (excl. students); show separately.", noteJa: "都市部調査失業率（年平均）。⚠️若年層は2023年に定義変更（在学者除外）、別掲が必要。", source: "2025中國經濟年報", url: gov2025Url },
  41: { latest: "792萬人", period: "2025 出生", freq: "annual", data: [{ p: "2021", v: 1062 }, { p: "2022", v: 956 }, { p: "2023", v: 902 }, { p: "2024", v: 954 }, { p: "2025", v: 792 }], noteZh: "全年出生人口（萬人）。結婚對數需由民政部另行核對。2025年降幅明顯，已標警示。", noteEn: "Annual births (10k). Marriages need MCA series. 2025 drop flagged as anomaly.", noteJa: "年間出生数（万人）。婚姻件数は民政部で別途確認。2025年の急減を警告表示。", source: "國家統計局統計公報", url: gongbaoUrl },
};

// 從期間標籤取出年份，取不到回傳 null
const yearOfLabel = (label) => {
  const m = String(label).match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : null;
};

// 這組資料是不是純年度序列？（月度「2025-08」、季度「2025Q3」、
// 結構拆分「收入 Rev」都不算，不與世銀年度資料合併）
const isAnnualSeries = (data) =>
  Array.isArray(data) &&
  data.length > 0 &&
  data.every((d) => /^(19|20)\d{2}$/.test(String(d.p).trim()));

/**
 * 合併官方值與世銀估算。
 * 規則：重疊年度一律以官方值為準，世銀只補官方沒有的較早年度。
 * 每個點都會帶 src 欄位（"official" 或 "wb"），供 UI 標示來源。
 */
function mergeWithWorldBank(id, officialData) {
  const wb = worldBank[id];
  if (!wb || !wb.data?.length) {
    return { data: officialData, merged: false };
  }

  // 官方沒有任何序列 → 直接用世銀的
  if (!officialData?.length) {
    return {
      data: wb.data.map((d) => ({ ...d, src: "wb" })),
      merged: true,
      wbOnly: true,
      wbMeta: wb,
    };
  }

  // 官方是月度／季度／結構拆分 → 不合併，避免口徑混雜
  if (!isAnnualSeries(officialData)) {
    return { data: officialData, merged: false, wbAvailable: true, wbMeta: wb };
  }

  const officialYears = new Set(officialData.map((d) => yearOfLabel(d.p)));
  const filler = wb.data
    .filter((d) => !officialYears.has(yearOfLabel(d.p)))
    .map((d) => ({ ...d, src: "wb" }));

  if (!filler.length) {
    return { data: officialData, merged: false, wbAvailable: true, wbMeta: wb };
  }

  const combined = [
    ...filler,
    ...officialData.map((d) => ({ ...d, src: "official" })),
  ].sort((a, b) => yearOfLabel(a.p) - yearOfLabel(b.p));

  return { data: combined, merged: true, wbMeta: wb };
}

export const indicators = names.map((n, i) => {
  const id = i + 1;
  const v = V[id] || {};
  const m = mergeWithWorldBank(id, v.data);

  return {
    id,
    zh: n[0],
    en: n[1],
    ja: n[2],
    category: catFor(id),
    chart: chartTypes[i],
    freq: v.freq || freqMap[id],
    ...v,
    data: m.data,
    // 來源標記，供 UI 顯示提示
    wbMerged: !!m.merged,          // 圖表含世銀補充資料
    wbOnly: !!m.wbOnly,            // 完全來自世銀（無官方值）
    wbCaliber: !!m.wbMeta?.caliber, // 世銀口徑與官方定義不同
    wbMeta: m.wbMeta || null,
    status: V[id] ? "reference" : m.wbOnly ? "estimate" : "pending",
  };
});

export const worldBankFetchedAt = wbFetchedAt;

// Flag a point-to-point change larger than 40% (or a jump from ~0).
export const hasAnomaly = (data) => {
  if (!data || data.length < 2) return false;
  for (let i = 1; i < data.length; i++) {
    const a = data[i - 1].v,
      b = data[i].v;
    // 跨來源的接縫不算異常（口徑不同造成的落差不是真實波動）
    if (data[i - 1].src && data[i].src && data[i - 1].src !== data[i].src) continue;
    if (a !== 0 && Math.abs((b - a) / Math.abs(a)) > 0.4) return true;
    if (a === 0 && Math.abs(b) > 2) return true;
  }
  return false;
};
