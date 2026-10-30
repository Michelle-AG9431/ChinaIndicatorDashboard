import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3, Layers } from "lucide-react";
import { analyze } from "./analysis.js";

// ---------------------------------------------------------------------------
// 指標詳細視窗中的「數據分析」欄位。
//
// 全部在瀏覽器內計算：免費、即時、離線也能用，不呼叫任何 API。
//
// 刻意不計算複合年均成長率（CAGR）：本專案多數指標本身就是成長率或
// 比率（GDP年增率、CPI、失業率、撥備覆蓋率…），對成長率再算成長率
// 沒有意義，遇到負值或零還會算出虛假數字。改以平均、全期變化、
// 迴歸斜率表達。
// ---------------------------------------------------------------------------

const T = {
  title: { zh: "數據分析", en: "Data analysis", ja: "データ分析" },
  insufficient: {
    zh: "資料點不足，無法進行統計分析。補入歷史數值後此欄會自動出現。",
    en: "Not enough data points for statistical analysis. This panel fills in once historical values are added.",
    ja: "データ点が不足しており統計分析できません。過去の数値を追加すると表示されます。",
  },
  latest: { zh: "最新值", en: "Latest", ja: "最新値" },
  vsPrev: { zh: "較前期", en: "vs previous", ja: "前期比" },
  mean: { zh: "期間平均", en: "Period mean", ja: "期間平均" },
  range: { zh: "最高 / 最低", en: "High / Low", ja: "最高／最低" },
  volatility: { zh: "波動度", en: "Volatility", ja: "変動性" },
  volatilityHint: {
    zh: "標準差。數字越大表示期間內起伏越劇烈。",
    en: "Standard deviation. Higher means a more volatile series.",
    ja: "標準偏差。大きいほど変動が激しい。",
  },
  trend: { zh: "整體趨勢", en: "Overall trend", ja: "全体トレンド" },
  trendHint: {
    zh: "最小平方法迴歸斜率（每期平均變化）。R² 表示趨勢線的解釋力，越接近 1 越穩定。",
    en: "Least-squares slope (average change per period). R² shows how well the trend line fits.",
    ja: "最小二乗法の傾き（1期あたり平均変化）。R²は当てはまりの良さ。",
  },
  perPeriod: { zh: "每期", en: "per period", ja: "1期あたり" },
  up: { zh: "上升", en: "Rising", ja: "上昇" },
  down: { zh: "下降", en: "Falling", ja: "低下" },
  flat: { zh: "大致持平", en: "Flat", ja: "横ばい" },
  streak: { zh: "連續變化", en: "Streak", ja: "連続変化" },
  streakUp: { zh: "連續上升 %d 期", en: "%d periods rising", ja: "%d期連続上昇" },
  streakDown: { zh: "連續下降 %d 期", en: "%d periods falling", ja: "%d期連続低下" },
  streakNone: { zh: "無連續方向", en: "No clear streak", ja: "連続性なし" },
  percentile: { zh: "歷史位置", en: "Historical position", ja: "過去との位置" },
  percentileHint: {
    zh: "最新值在整段歷史區間中的相對位置。0 為歷史最低，100 為歷史最高。",
    en: "Where the latest value sits in the full historical range. 0 = lowest ever, 100 = highest.",
    ja: "最新値が過去の範囲内でどの位置にあるか。0が最低、100が最高。",
  },
  biggestMove: { zh: "最大單期變動", en: "Largest single move", ja: "最大単期変動" },
  total: { zh: "合計", en: "Total", ja: "合計" },
  largest: { zh: "最大項", en: "Largest", ja: "最大項目" },
  smallest: { zh: "最小項", en: "Smallest", ja: "最小項目" },
  spread: { zh: "最大／最小倍數", en: "Max-to-min ratio", ja: "最大・最小倍率" },
  share: { zh: "佔比", en: "share", ja: "構成比" },
  items: { zh: "項目數", en: "Items", ja: "項目数" },
  official: { zh: "官方", en: "Official", ja: "公式" },
  wb: { zh: "世界銀行", en: "World Bank", ja: "世界銀行" },
  mixedSource: { zh: "混合來源", en: "Mixed sources", ja: "複数ソース" },
  points: { zh: "點", en: "pts", ja: "点" },
};

const tr = (key, lang) => T[key]?.[lang] ?? T[key]?.zh ?? "";

function Stat({ label, value, sub, hint, accent }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 px-3 py-2.5" title={hint}>
      <div className="text-[11px] text-slate-500 flex items-center gap-1">
        {label}
        {hint && <span className="text-slate-300 cursor-help">ⓘ</span>}
      </div>
      <div className={`text-base font-semibold mt-0.5 tabular-nums ${accent || "text-slate-900"}`}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

const fmt = (n) => (typeof n === "number" ? (Number.isInteger(n) ? n : n.toFixed(2)) : n);
const signed = (n) => (typeof n === "number" ? `${n > 0 ? "+" : ""}${fmt(n)}` : n);

export default function AnalysisPanel({ item, lang = "zh" }) {
  const stats = useMemo(() => analyze(item), [item]);

  if (!stats || stats.count < 2) {
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 p-4">
        <div className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" />
          {tr("title", lang)}
        </div>
        <p className="text-sm text-slate-400">{tr("insufficient", lang)}</p>
      </div>
    );
  }

  const isSeries = stats.kind === "series";
  const dirIcon =
    stats.direction === "up" ? <TrendingUp className="w-3.5 h-3.5" />
    : stats.direction === "down" ? <TrendingDown className="w-3.5 h-3.5" />
    : <Minus className="w-3.5 h-3.5" />;
  const dirLabel =
    stats.direction === "up" ? tr("up", lang)
    : stats.direction === "down" ? tr("down", lang)
    : tr("flat", lang);

  const streakText =
    stats.streak > 0 ? tr("streakUp", lang).replace("%d", stats.streak)
    : stats.streak < 0 ? tr("streakDown", lang).replace("%d", Math.abs(stats.streak))
    : tr("streakNone", lang);

  const src = stats.sources;
  const sourceChip =
    src.wb && src.official
      ? `${tr("mixedSource", lang)}：${tr("official", lang)} ${src.official} + ${tr("wb", lang)} ${src.wb} ${tr("points", lang)}`
      : src.wb
      ? `${tr("wb", lang)} ${src.wb} ${tr("points", lang)}`
      : `${tr("official", lang)} ${src.official} ${tr("points", lang)}`;

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          {isSeries ? <BarChart3 className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
          {tr("title", lang)}
        </div>
        <div className="text-[11px] text-slate-400">{sourceChip}</div>
      </div>

      {isSeries ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          <Stat
            label={`${tr("latest", lang)} · ${stats.to}`}
            value={fmt(stats.latest)}
            sub={
              stats.changeFromPrevious !== null
                ? `${tr("vsPrev", lang)} ${signed(stats.changeFromPrevious)}`
                : null
            }
            accent={
              stats.changeFromPrevious > 0 ? "text-emerald-600"
              : stats.changeFromPrevious < 0 ? "text-rose-600"
              : undefined
            }
          />
          <Stat label={tr("mean", lang)} value={fmt(stats.mean)} sub={`${stats.from}–${stats.to}`} />
          <Stat
            label={tr("range", lang)}
            value={`${fmt(stats.max.value)} / ${fmt(stats.min.value)}`}
            sub={`${stats.max.label} · ${stats.min.label}`}
          />
          <Stat
            label={tr("volatility", lang)}
            value={fmt(stats.volatility)}
            hint={tr("volatilityHint", lang)}
          />
          {stats.trend && (
            <Stat
              label={tr("trend", lang)}
              value={
                <span className="flex items-center gap-1.5">
                  {dirIcon}
                  {dirLabel}
                </span>
              }
              sub={`${signed(stats.trend.slope)} / ${tr("perPeriod", lang)} · R²=${stats.trend.r2}`}
              hint={tr("trendHint", lang)}
              accent={
                stats.direction === "up" ? "text-emerald-600"
                : stats.direction === "down" ? "text-rose-600"
                : "text-slate-600"
              }
            />
          )}
          <Stat
            label={tr("percentile", lang)}
            value={`${stats.percentile}%`}
            sub={`${tr("streak", lang)}：${streakText}`}
            hint={tr("percentileHint", lang)}
          />
          {stats.biggestMove && (
            <Stat
              label={tr("biggestMove", lang)}
              value={signed(stats.biggestMove.delta)}
              sub={`${stats.biggestMove.from} → ${stats.biggestMove.to}`}
              accent={stats.biggestMove.delta > 0 ? "text-emerald-600" : "text-rose-600"}
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          <Stat label={tr("items", lang)} value={stats.count} />
          <Stat label={tr("total", lang)} value={fmt(stats.total)} />
          <Stat
            label={tr("largest", lang)}
            value={fmt(stats.top.value)}
            sub={
              stats.topShare !== null
                ? `${stats.top.label} · ${stats.topShare}% ${tr("share", lang)}`
                : stats.top.label
            }
          />
          <Stat label={tr("smallest", lang)} value={fmt(stats.bottom.value)} sub={stats.bottom.label} />
          <Stat label={tr("mean", lang)} value={fmt(stats.mean)} />
          {stats.spread !== null && (
            <Stat label={tr("spread", lang)} value={`${stats.spread}×`} />
          )}
        </div>
      )}
    </div>
  );
}
