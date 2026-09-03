import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ExternalLink, Languages, BarChart3, Database, X, Info, Filter,
  Download, AlertTriangle, RefreshCw, CalendarClock, History, Globe,
  SlidersHorizontal, ChevronDown, RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  indicators, categories, sourcePortals, freqMeta, hasAnomaly,
} from "./data.js";

// --------------------------------------------------------------------------
// 期間裁切
// --------------------------------------------------------------------------

// 從期間標籤取出年份："2023" / "2025-08" / "2025Q3" → 2023 / 2025 / 2025
// 取不到（例如「收入 Rev」「國債」）→ null
const yearOf = (label) => {
  const m = String(label).match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : null;
};

// 這組資料是不是時間序列？標籤全都解析得出年份才算。
// #28（收入／支出）、#32（國債／地方／隱性）、#35（新增／再融資）這類
// 結構拆分不是時間序列，不能裁切。
export const isTimeSeries = (data) =>
  Array.isArray(data) && data.length > 0 && data.every((d) => yearOf(d.p) !== null);

// 回傳資料實際涵蓋的年份範圍，非時間序列回傳 null
export const coverageOf = (data) => {
  if (!isTimeSeries(data)) return null;
  const ys = data.map((d) => yearOf(d.p));
  return { from: Math.min(...ys), to: Math.max(...ys), span: Math.max(...ys) - Math.min(...ys) + 1 };
};

// 依年份區間裁切
function sliceByYears(item, years) {
  const data = item?.data;
  if (!data) return data;
  if (years === "all") return data;
  if (item.chart === "pie") return data;   // 圓餅圖是占比，不裁切
  if (!isTimeSeries(data)) return data;    // 結構拆分，不裁切

  const ys = data.map((d) => yearOf(d.p));
  const cutoff = Math.max(...ys) - years + 1;
  const out = data.filter((_, i) => ys[i] >= cutoff);
  return out.length >= 1 ? out : data;
}

// --------------------------------------------------------------------------

function MiniChart({ item, big = false, years = "all" }) {
  const data = sliceByYears(item, years);

  if (!data)
    return (
      <div className="h-full min-h-32 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed">
        <Database className="w-6 h-6 mb-2" />
        <span className="text-xs px-2 text-center">待官方或國際機構資料 / Awaiting official or intl. data</span>
      </div>
    );

  const common = { data, margin: { top: 8, right: 8, left: big ? 4 : -20, bottom: 0 } };
  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      <XAxis dataKey="p" tick={{ fontSize: 10 }} />
      <YAxis tick={{ fontSize: 10 }} />
      <Tooltip />
    </>
  );
  if (item.chart === "bar")
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart {...common}>{axes}<Bar dataKey="v" fill={item.category.color} radius={[5, 5, 0, 0]} /></BarChart>
      </ResponsiveContainer>
    );
  if (item.chart === "area")
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart {...common}>{axes}<Area type="monotone" dataKey="v" stroke={item.category.color} fill={item.category.color} fillOpacity={0.16} /></AreaChart>
      </ResponsiveContainer>
    );
  if (item.chart === "pie")
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="v" nameKey="p" outerRadius={big ? 95 : 55} label>
            {data.map((_, idx) => (
              <Cell key={idx} fill={[item.category.color, "#94a3b8", "#cbd5e1"][idx % 3]} />
            ))}
          </Pie>
          <Tooltip /><Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart {...common}>{axes}<Line type="monotone" dataKey="v" stroke={item.category.color} strokeWidth={3} dot={{ r: 3 }} /></LineChart>
    </ResponsiveContainer>
  );
}

export default function App() {
  const [lang, setLang] = useState("zh");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [years, setYears] = useState(5);
  const [filtersOpen, setFiltersOpen] = useState(false); // 手機版篩選面板
  const [selected, setSelected] = useState(null);
  const [refreshed, setRefreshed] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const t = (zh, en, ja) => (lang === "zh" ? zh : lang === "ja" ? ja || en : en);
  const nm = (x) => (lang === "zh" ? x.zh : lang === "ja" ? x.ja : x.en);
  const note = (x) => (lang === "zh" ? x.noteZh : lang === "ja" ? x.noteJa || x.noteEn : x.noteEn);

  const filtered = useMemo(
    () =>
      indicators.filter(
        (x) =>
          (cat === "all" || x.category.id === cat) &&
          (status === "all"
            ? true
            : status === "anomaly"
            ? hasAnomaly(x.data)
            : x.status === status) &&
          `${x.id} ${x.zh} ${x.en} ${x.ja}`.toLowerCase().includes(search.toLowerCase())
      ),
    [search, cat, status, lang]
  );

  // 目前篩選結果中，時間序列最長涵蓋幾年 —— 用來提示資料是否足以支撐所選區間
  const maxSpan = useMemo(() => {
    const spans = filtered.map((x) => coverageOf(x.data)?.span || 0);
    return spans.length ? Math.max(...spans) : 0;
  }, [filtered]);

  const shortOfData = years !== "all" && maxSpan > 0 && maxSpan < years;

  const langLabel = lang === "zh" ? "繁體中文" : lang === "en" ? "English" : "日本語";
  const cycleLang = () => setLang(lang === "zh" ? "en" : lang === "en" ? "ja" : "zh");
  const anomalyCount = indicators.filter((x) => hasAnomaly(x.data)).length;

  // Attempt a live probe of an official source through the serverless proxy.
  const doRefresh = async () => {
    setRefreshing(true);
    let ok = false;
    try {
      const target = "https://www.gov.cn/zhuanti/2025zgjjnb/index.htm";
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(target)}`);
      ok = res.ok;
    } catch {
      ok = false;
    }
    setRefreshed({ time: new Date().toLocaleString(), ok });
    setRefreshing(false);
  };

  // 手機版：顯示目前套用了幾個非預設篩選條件
  const activeFilterCount =
    (cat !== "all" ? 1 : 0) + (status !== "all" ? 1 : 0) + (years !== 5 ? 1 : 0);

  const resetFilters = () => {
    setCat("all");
    setStatus("all");
    setYears(5);
    setSearch("");
  };

  const exportCsv = () => {
    const rows = [
      ["#", "中文", "English", "日本語", "Category", "Status", "Freq", "Latest", "Period", "Source URL"],
      ...filtered.map((x) => [x.id, x.zh, x.en, x.ja, x.category.en, x.status, x.freq, x.latest || "", x.period || "", x.url || ""]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "china-50-indicators.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <header className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-5 py-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div>
              <div className="flex gap-2 mb-3 flex-wrap">
                <Badge className="bg-blue-500">2026 Dashboard</Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-300">50 indicators</Badge>
                <Badge variant="outline" className="border-amber-500 text-amber-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />{anomalyCount} {t("警示", "alerts", "警告")}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                {t("中國觀測 50 指標", "China Monitoring: 50 Indicators", "中国観測 50 指標")}
              </h1>
              <p className="mt-3 text-slate-300 max-w-3xl">
                {t(
                  "經濟、金融、財政、社會與政治的三語互動追蹤框架，串接官方原始來源",
                  "A trilingual interactive framework across economy, finance, fiscal, society and politics, linked to official sources",
                  "経済・金融・財政・社会・政治を対象とする三言語対応の対話型フレームワーク"
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={doRefresh} variant="outline" className="border-slate-600 bg-transparent text-white hover:bg-slate-800">
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                {t("更新資料", "Refresh", "更新")}
              </Button>
              <Button onClick={cycleLang} variant="outline" className="border-slate-600 bg-transparent text-white hover:bg-slate-800">
                <Languages className="w-4 h-4 mr-2" />{langLabel}
              </Button>
            </div>
          </div>
          {refreshed && (
            <div className="mt-4 text-xs text-slate-400 flex items-center gap-2">
              <CalendarClock className="w-3.5 h-3.5" />
              {t("上次更新", "Last refresh", "最終更新")}: {refreshed.time} —{" "}
              {refreshed.ok
                ? t("已成功連線官方來源，可擴充解析器抓取最新值。", "Connected to official source; add a parser to pull latest values.", "公式ソースへ接続成功。パーサー追加で最新値取得可。")
                : t("即時抓取失敗（可能於本機無代理或官方限制）；顯示為已核實官方值，點來源連結查最新。", "Live fetch failed (no proxy locally or site blocked); showing verified values — click source links.", "ライブ取得失敗（ローカルにプロキシ無し／サイト制限）。検証済み値を表示。")}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-7">
        {/* ---------- 篩選列 ----------
            手機（< md）：搜尋框 + 右上角篩選鈕，點開才展開下拉選單
            桌機（≥ md）：全部並排顯示                                      */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            {/* 第一列：搜尋 + 手機版篩選鈕 */}
            <div className="flex gap-2 md:hidden">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("搜尋編號或指標", "Search", "検索")}
                  className="pl-9"
                />
              </div>
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                aria-expanded={filtersOpen}
                className="relative shrink-0 h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 flex items-center gap-1.5 text-sm font-medium active:bg-slate-50 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* 手機版展開面板 */}
            <AnimatePresence initial={false}>
              {filtersOpen && (
                <motion.div
                  key="mobile-filters"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="md:hidden overflow-hidden"
                >
                  <div className="pt-3 space-y-2">
                    <Select value={cat} onValueChange={setCat}>
                      <SelectTrigger><Filter className="w-4 h-4 mr-2 shrink-0" /><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("全部面向", "All dimensions", "全分野")}</SelectItem>
                        {categories.map((c) => (
                          <SelectItem value={c.id} key={c.id}>{t(c.zh, c.en, c.ja)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("全部狀態", "All status", "全ステータス")}</SelectItem>
                        <SelectItem value="reference">{t("已有參考值", "Reference value", "参考値あり")}</SelectItem>
                        <SelectItem value="estimate">{t("國際機構估算", "Intl. estimate", "国際機関推計")}</SelectItem>
                        <SelectItem value="pending">{t("待驗證", "Pending", "検証待ち")}</SelectItem>
                        <SelectItem value="anomaly">{t("⚠ 異常波動", "⚠ Anomaly", "⚠ 異常変動")}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={String(years)} onValueChange={(v) => setYears(v === "all" ? "all" : Number(v))}>
                      <SelectTrigger><History className="w-4 h-4 mr-2 shrink-0" /><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">{t("近 5 年", "Last 5 years", "直近 5 年")}</SelectItem>
                        <SelectItem value="10">{t("近 10 年", "Last 10 years", "直近 10 年")}</SelectItem>
                        <SelectItem value="15">{t("近 15 年", "Last 15 years", "直近 15 年")}</SelectItem>
                        <SelectItem value="20">{t("近 20 年", "Last 20 years", "直近 20 年")}</SelectItem>
                        <SelectItem value="all">{t("全部期間", "All periods", "全期間")}</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2 pt-1">
                      <Button onClick={exportCsv} variant="outline" className="flex-1">
                        <Download className="w-4 h-4 mr-2" />CSV
                      </Button>
                      {activeFilterCount > 0 && (
                        <Button onClick={resetFilters} variant="ghost" className="shrink-0">
                          <RotateCcw className="w-4 h-4 mr-1.5" />{t("清除", "Reset", "リセット")}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 桌機版：搜尋 + 狀態 + 期間 + CSV 並排。
                不放分類選單 —— 分類由下方五個大按鈕負責，避免同一功能有兩個入口 */}
            <div className="hidden md:grid md:grid-cols-[1fr_190px_170px_auto] gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("搜尋編號或指標", "Search number or indicator", "番号・指標を検索")} className="pl-9" />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("全部狀態", "All status", "全ステータス")}</SelectItem>
                  <SelectItem value="reference">{t("已有參考值", "Reference value", "参考値あり")}</SelectItem>
                  <SelectItem value="estimate">{t("國際機構估算", "Intl. estimate", "国際機関推計")}</SelectItem>
                  <SelectItem value="pending">{t("待驗證", "Pending", "検証待ち")}</SelectItem>
                  <SelectItem value="anomaly">{t("⚠ 異常波動", "⚠ Anomaly", "⚠ 異常変動")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(years)} onValueChange={(v) => setYears(v === "all" ? "all" : Number(v))}>
                <SelectTrigger><History className="w-4 h-4 mr-2 shrink-0" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">{t("近 5 年", "Last 5 years", "直近 5 年")}</SelectItem>
                  <SelectItem value="10">{t("近 10 年", "Last 10 years", "直近 10 年")}</SelectItem>
                  <SelectItem value="15">{t("近 15 年", "Last 15 years", "直近 15 年")}</SelectItem>
                  <SelectItem value="20">{t("近 20 年", "Last 20 years", "直近 20 年")}</SelectItem>
                  <SelectItem value="all">{t("全部期間", "All periods", "全期間")}</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportCsv} variant="outline"><Download className="w-4 h-4 mr-2" />CSV</Button>
            </div>

            {shortOfData && (
              <div className="mt-3 flex gap-2 items-start text-[11px] leading-relaxed text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  {t(
                    `目前 data.js 中最長的時間序列僅涵蓋 ${maxSpan} 年，短於所選的 ${years} 年區間，圖表顯示的是全部可用資料。補入更早年度後即會自動延長。`,
                    `The longest series in data.js currently spans ${maxSpan} years, shorter than the selected ${years}-year window; charts show all available data. Add earlier years to extend automatically.`,
                    `現在 data.js の最長系列は ${maxSpan} 年分で、選択した ${years} 年より短いため、利用可能な全データを表示しています。過去年度を追加すれば自動的に延長されます。`
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 分類大按鈕：僅桌機顯示。手機版改用篩選面板裡的分類選單 */}
        <div className="hidden md:grid md:grid-cols-5 gap-3 mb-7">
          {categories.map((c) => (
            <button key={c.id} onClick={() => setCat(cat === c.id ? "all" : c.id)}
              className={`text-left rounded-2xl p-4 bg-white border transition shadow-sm ${cat === c.id ? "ring-2 ring-offset-2" : "hover:-translate-y-0.5"}`}
              style={{ borderColor: c.color }}>
              <div className="text-2xl font-bold" style={{ color: c.color }}>{c.range[1] - c.range[0] + 1}</div>
              <div className="text-sm font-medium">{t(c.zh, c.en, c.ja)}</div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <p className="text-sm text-slate-500">{t(`顯示 ${filtered.length} / 50 項`, `Showing ${filtered.length} / 50`, `表示 ${filtered.length} / 50`)}</p>
          <div className="flex gap-3 text-xs flex-wrap">
            <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-emerald-500" />{t("已有參考值", "Reference", "参考値")}</span>
            <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-sky-500" />{t("國際機構估算", "Intl. estimate", "国際機関推計")}</span>
            <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-slate-300" />{t("待驗證", "Pending", "検証待ち")}</span>
            <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="w-3 h-3" />{t("異常波動警示", "Anomaly alert", "異常変動警告")}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item, idx) => {
            const anom = hasAnomaly(item.data);
            const cov = coverageOf(item.data);
            return (
              <motion.button layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx * 0.012, 0.2) }} key={item.id} onClick={() => setSelected(item)} className="text-left">
                <Card className={`h-full border-0 shadow-sm hover:shadow-lg transition rounded-2xl overflow-hidden ${anom ? "ring-1 ring-amber-300" : ""}`}>
                  <div className="h-1.5" style={{ background: item.category.color }} />
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold rounded-lg px-2 py-1 text-white" style={{ background: item.category.color }}>#{item.id}</span>
                        <span className="text-xs text-slate-500">{t(item.category.zh, item.category.en, item.category.ja)}</span>
                        <span className="text-[10px] rounded-md px-1.5 py-0.5 bg-slate-100 text-slate-500 flex items-center gap-1"><CalendarClock className="w-3 h-3" />{t(freqMeta[item.freq].zh, freqMeta[item.freq].en, freqMeta[item.freq].ja)}</span>
                      </div>
                      {anom ? <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" /> : <span className={`w-2.5 h-2.5 rounded-full mt-1 ${item.status === "reference" ? "bg-emerald-500" : item.status === "estimate" ? "bg-sky-500" : "bg-slate-300"}`} />}
                    </div>
                    <h2 className="font-semibold text-base mt-4 leading-snug min-h-12">{nm(item)}</h2>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{lang === "zh" ? item.en : item.zh}</p>
                    <div className="h-36 mt-4"><MiniChart item={item} years={years} /></div>
                    {cov && (
                      <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                        <History className="w-3 h-3" />
                        {t("資料涵蓋", "Data covers", "データ範囲")} {cov.from}–{cov.to}
                      </div>
                    )}
                    {(item.wbOnly || item.wbMerged) && (
                      <div className="mt-1 text-[10px] text-sky-600 flex items-center gap-1">
                        <Globe className="w-3 h-3 shrink-0" />
                        {item.wbOnly
                          ? t("資料來自世界銀行", "Data from World Bank", "世界銀行データ")
                          : t("早期年度由世界銀行補充", "Earlier years from World Bank", "過去年度は世界銀行で補完")}
                        {item.wbMeta?.origin ? ` · ${item.wbMeta.origin}` : ""}
                      </div>
                    )}
                    {anom && (
                      <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] leading-relaxed text-amber-900 flex gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span><strong>{t("異常波動：", "Anomaly: ", "異常変動：")}</strong>{t("偵測到期間內單點變動偏大，請核對口徑或事件因素。", "A large point-to-point change was detected; verify caliber or one-off events.", "期間内で大幅な変動を検出。定義や一時要因を確認してください。")}</span>
                      </div>
                    )}
                    {item.noteZh && (
                      <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
                        <strong>{t("備註：", "Note: ", "備考：")}</strong>{note(item)}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t flex justify-between items-end">
                      <div>
                        <div className="text-xl font-bold">{item.latest || t("待補", "Pending", "未定")}</div>
                        <div className="text-xs text-slate-400">{item.period || t("尚無期間", "No period", "期間未定")}</div>
                      </div>
                      <BarChart3 className="w-5 h-5 text-slate-300" />
                    </div>
                  </CardContent>
                </Card>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl bg-amber-50 border border-amber-200 p-5 flex gap-3">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-950">
            <strong>{t("資料透明度與口徑說明：", "Data transparency & caliber note: ", "データ透明性・定義に関する注記：")}</strong>
            {t(
              "每項指標標註更新頻率與來源連結，並允許整合不同期間或口徑，但凡定義變更、估計值、序列中斷或不可直接比較者，均於卡片備註與詳細視窗說明。異常波動以警示標記。官方未公開之指標，須改採IMF、世界銀行、OECD、ILO等國際機構估算並註明。",
              "Each indicator shows its update frequency and source link. Charts may combine periods/calibers, but definition changes, estimates, breaks and comparability limits are disclosed in card notes and the detail view. Anomalies are flagged. Where China does not publish, use IMF/World Bank/OECD/ILO estimates and label them.",
              "各指標に更新頻度とソースリンクを表示。異なる期間・定義の統合は可能だが、定義変更・推計・系列断絶・比較不能はカード備考と詳細で明示。異常は警告表示。公式未公表はIMF・世界銀行・OECD・ILO等の推計で代替し明記。"
            )}
          </div>
        </div>

        <section className="mt-6">
          <h3 className="text-lg font-bold mb-3">{t("主要官方資料入口", "Primary official data portals", "主要公式データ入口")}</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sourcePortals.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="bg-white border rounded-2xl p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-sm">{t(s.zh, s.en, s.ja)}</div>
                  <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
                </div>
                <div className="text-xs text-slate-500 mt-2 leading-relaxed">{s.scope}</div>
              </a>
            ))}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/55 z-50 p-4 flex items-center justify-center" onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.96, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 15 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 md:p-8">
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge style={{ background: selected.category.color }}>{t(selected.category.zh, selected.category.en, selected.category.ja)}</Badge>
                      <Badge variant="outline">#{selected.id}</Badge>
                      <Badge variant="outline" className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />{t(freqMeta[selected.freq].zh, freqMeta[selected.freq].en, freqMeta[selected.freq].ja)}</Badge>
                      {hasAnomaly(selected.data) && <Badge className="bg-amber-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{t("警示", "Alert", "警告")}</Badge>}
                    </div>
                    <h2 className="text-2xl font-bold mt-4">{nm(selected)}</h2>
                    <p className="text-slate-500 mt-1">{lang === "zh" ? selected.en : selected.zh}{lang !== "ja" ? ` ・ ${selected.ja}` : ""}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setSelected(null)}><X /></Button>
                </div>
                <div className="grid md:grid-cols-[1fr_220px] gap-6 mt-7">
                  <div>
                    <div className="h-72 rounded-2xl bg-slate-50 p-3"><MiniChart item={selected} years={years} big /></div>
                    {(() => {
                      const cov = coverageOf(selected.data);
                      if (!cov) return null;
                      return (
                        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5" />
                          {t(
                            `資料涵蓋 ${cov.from}–${cov.to}（共 ${cov.span} 年）`,
                            `Data covers ${cov.from}–${cov.to} (${cov.span} years)`,
                            `データ範囲 ${cov.from}–${cov.to}（${cov.span} 年分）`
                          )}
                          {years !== "all" && cov.span < years &&
                            ` — ${t("短於所選區間", "shorter than selected window", "選択期間より短い")}`}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="space-y-4">
                    <Card className="shadow-none">
                      <CardContent className="p-4">
                        <div className="text-xs text-slate-500">{t("最新參考值", "Latest reference", "最新参考値")}</div>
                        <div className="text-3xl font-bold mt-1">{selected.latest || "N/A"}</div>
                        <div className="text-xs text-slate-400 mt-1">{selected.period || t("待驗證", "Pending", "検証待ち")}</div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none">
                      <CardContent className="p-4">
                        <div className="text-xs text-slate-500 mb-2">{t("口徑與限制", "Definition & caveat", "定義・留意点")}</div>
                        <p className="text-sm leading-relaxed">{selected.noteZh ? note(selected) : t("尚未取得足以標示為官方最新值的可驗證資料；建議改採國際機構估算。", "No verifiable official value yet; consider IMF/World Bank/OECD/ILO estimates.", "検証可能な公式値は未取得。IMF等の推計採用を推奨。")}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border p-4">
                  <div className="text-xs text-slate-500 mb-2">{t("消息來源與資料連結", "Source and data link", "出典・データリンク")}</div>
                  {(selected.wbOnly || selected.wbMerged) && (
                    <div className="mb-3 rounded-lg bg-sky-50 border border-sky-200 px-3 py-2 text-[11px] leading-relaxed text-sky-900 flex gap-1.5">
                      <Globe className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        <strong>
                          {selected.wbOnly
                            ? t("國際機構估算：", "International estimate: ", "国際機関推計：")
                            : t("含世界銀行補充資料：", "Includes World Bank data: ", "世界銀行データを含む：")}
                        </strong>
                        {selected.wbOnly
                          ? t("本項中國官方未公布可驗證數值，圖表資料取自世界銀行。", "No verifiable official Chinese figure; chart data comes from the World Bank.", "中国公式の検証可能値がないため、世界銀行データを使用。")
                          : t("較早年度由世界銀行補足，與官方值重疊的年度一律採用官方值。", "Earlier years filled from the World Bank; official values take priority where they overlap.", "過去年度は世界銀行で補完。重複年度は公式値を優先。")}
                        {selected.wbMeta?.origin && ` ${t("原始來源", "Originally from", "原典")}：${selected.wbMeta.origin}。`}
                        {selected.wbCaliber && t(" ⚠️口徑與中國官方定義不同，不可直接比較。", " ⚠️Caliber differs from the official definition; not directly comparable.", " ⚠️定義が中国公式と異なるため直接比較は不可。")}
                      </span>
                    </div>
                  )}
                  {selected.url ? (
                    <a href={selected.url} target="_blank" rel="noreferrer" className="text-blue-700 font-medium flex items-center gap-2 hover:underline">{selected.source}<ExternalLink className="w-4 h-4" /></a>
                  ) : (
                    <span className="text-sm text-slate-400">{t("待補入官方或國際機構來源", "Pending official or intl. source", "公式・国際機関のソース待ち")}</span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
