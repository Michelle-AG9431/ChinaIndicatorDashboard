// ---------------------------------------------------------------------------
// analysis.js — 指標數據分析（純前端計算，不需要網路、不產生費用）
//
// 所有統計都在瀏覽器內即時算出，不呼叫任何 API。
// AI 解讀是另一層（api/analyze.js），由使用者按鈕觸發。
//
// 設計上刻意「不算」複合年均成長率（CAGR）：
//   本專案多數指標本身就是成長率或比率（GDP年增率、CPI、失業率、
//   撥備覆蓋率…），對「成長率」再算「成長率」沒有意義，而且遇到
//   負值或零會算出虛假數字。改以平均、全期變化、趨勢斜率表達。
// ---------------------------------------------------------------------------

const yearOf = (label) => {
  const m = String(label).match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : null;
};

/**
 * 判斷這組資料的性質：
 *   "series"    時間序列（期間標籤可解析出年份）
 *   "breakdown" 結構拆分或跨國比較（標籤是「收入 Rev」「日本」這類）
 */
export function detectKind(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  return data.every((d) => yearOf(d.p) !== null) ? "series" : "breakdown";
}

const round = (n, p = 2) => {
  const f = 10 ** p;
  return Math.round(n * f) / f;
};

// 最小平方法直線斜率（每期變化量）與判定係數 R²
function linearTrend(values) {
  const n = values.length;
  if (n < 3) return null;
  const xs = values.map((_, i) => i);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (values[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  if (den === 0) return null;
  const slope = num / den;
  const intercept = my - slope * mx;

  // R²：趨勢線解釋了多少變異
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) {
    const pred = slope * xs[i] + intercept;
    ssTot += (values[i] - my) ** 2;
    ssRes += (values[i] - pred) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope: round(slope, 3), r2: round(Math.max(0, r2), 3) };
}

// 連續同向變化的期數（正為連續上升，負為連續下降）
function currentStreak(values) {
  if (values.length < 2) return 0;
  let streak = 0;
  for (let i = values.length - 1; i > 0; i--) {
    const diff = values[i] - values[i - 1];
    if (diff === 0) break;
    const dir = diff > 0 ? 1 : -1;
    if (streak === 0) streak = dir;
    else if (Math.sign(streak) === dir) streak += dir;
    else break;
  }
  return streak;
}

// 母體標準差
function stdev(values) {
  const n = values.length;
  if (n < 2) return 0;
  const m = values.reduce((a, b) => a + b, 0) / n;
  return Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / n);
}

/**
 * 計算一項指標的統計摘要。
 * 回傳 null 表示資料不足（少於 2 點）或沒有資料。
 */
export function analyze(item) {
  const data = item?.data;
  if (!Array.isArray(data) || data.length === 0) return null;

  const kind = detectKind(data);
  const values = data.map((d) => d.v).filter((v) => typeof v === "number" && isFinite(v));
  if (values.length === 0) return null;

  const maxV = Math.max(...values);
  const minV = Math.min(...values);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const maxPoint = data.find((d) => d.v === maxV);
  const minPoint = data.find((d) => d.v === minV);

  // 來源組成（官方 vs 世銀）
  const srcCount = data.reduce((acc, d) => {
    const k = d.src || "official";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const base = {
    kind,
    count: data.length,
    mean: round(mean),
    max: { value: round(maxV), label: maxPoint?.p },
    min: { value: round(minV), label: minPoint?.p },
    range: round(maxV - minV),
    sources: srcCount,
  };

  // ---- 結構拆分／跨國比較 ----
  if (kind === "breakdown") {
    const total = values.reduce((a, b) => a + b, 0);
    const sorted = [...data].sort((a, b) => b.v - a.v);
    return {
      ...base,
      total: round(total),
      // 最大項佔整體比重
      topShare: total !== 0 ? round((sorted[0].v / total) * 100, 1) : null,
      top: { label: sorted[0].p, value: round(sorted[0].v) },
      bottom: { label: sorted[sorted.length - 1].p, value: round(sorted[sorted.length - 1].v) },
      // 最大與最小的倍數關係
      spread: sorted[sorted.length - 1].v !== 0
        ? round(sorted[0].v / sorted[sorted.length - 1].v, 1)
        : null,
    };
  }

  // ---- 時間序列 ----
  const first = data[0];
  const last = data[data.length - 1];
  const prev = data.length >= 2 ? data[data.length - 2] : null;

  // 逐期變化量（絕對差，非百分比 —— 多數指標本身已是百分比）
  const deltas = [];
  for (let i = 1; i < data.length; i++) {
    deltas.push(data[i].v - data[i - 1].v);
  }

  const trend = linearTrend(values);
  const streak = currentStreak(values);

  // 最大單期變動
  let biggestMove = null;
  if (deltas.length) {
    let idx = 0;
    deltas.forEach((d, i) => {
      if (Math.abs(d) > Math.abs(deltas[idx])) idx = i;
    });
    biggestMove = {
      from: data[idx].p,
      to: data[idx + 1].p,
      delta: round(deltas[idx]),
    };
  }

  return {
    ...base,
    from: first.p,
    to: last.p,
    latest: round(last.v),
    previous: prev ? round(prev.v) : null,
    changeFromPrevious: prev ? round(last.v - prev.v) : null,
    changeOverPeriod: round(last.v - first.v),
    volatility: round(stdev(values)),
    trend,                                    // { slope, r2 } 或 null
    direction: trend
      ? trend.slope > 0.05 ? "up" : trend.slope < -0.05 ? "down" : "flat"
      : null,
    streak,                                   // 正=連續上升期數，負=連續下降
    biggestMove,
    // 最新值在歷史分布中的位置（百分位，0=最低，100=最高）
    percentile: maxV === minV ? 50 : round(((last.v - minV) / (maxV - minV)) * 100, 0),
  };
}

/**
 * 把統計結果壓縮成給 AI 的精簡文字。
 * 刻意不傳整條序列 —— 控制 token 用量，也避免模型自行重算。
 */
export function toPromptFacts(item, stats, lang = "zh") {
  if (!stats) return null;
  const lines = [];
  const name = lang === "ja" ? item.ja : lang === "en" ? item.en : item.zh;

  lines.push(`指標：#${item.id} ${name}`);
  lines.push(`分類：${item.category?.zh || ""}`);
  if (item.wbMeta?.unit) lines.push(`單位：${item.wbMeta.unit}`);

  if (stats.kind === "series") {
    lines.push(`期間：${stats.from} 至 ${stats.to}（${stats.count} 點）`);
    lines.push(`最新值：${stats.latest}${stats.previous !== null ? `（前期 ${stats.previous}，變化 ${stats.changeFromPrevious > 0 ? "+" : ""}${stats.changeFromPrevious}）` : ""}`);
    lines.push(`全期變化：${stats.changeOverPeriod > 0 ? "+" : ""}${stats.changeOverPeriod}`);
    lines.push(`平均 ${stats.mean}；最高 ${stats.max.value}（${stats.max.label}）；最低 ${stats.min.value}（${stats.min.label}）`);
    lines.push(`標準差 ${stats.volatility}；最新值位於歷史區間第 ${stats.percentile} 百分位`);
    if (stats.trend) {
      lines.push(`線性趨勢：每期 ${stats.trend.slope > 0 ? "+" : ""}${stats.trend.slope}，R²=${stats.trend.r2}`);
    }
    if (stats.streak !== 0) {
      lines.push(`目前連續${stats.streak > 0 ? "上升" : "下降"} ${Math.abs(stats.streak)} 期`);
    }
    if (stats.biggestMove) {
      lines.push(`最大單期變動：${stats.biggestMove.from}→${stats.biggestMove.to}，${stats.biggestMove.delta > 0 ? "+" : ""}${stats.biggestMove.delta}`);
    }
  } else {
    lines.push(`組成項目 ${stats.count} 項，合計 ${stats.total}`);
    lines.push(`最大：${stats.top.label} ${stats.top.value}${stats.topShare !== null ? `（佔 ${stats.topShare}%）` : ""}`);
    lines.push(`最小：${stats.bottom.label} ${stats.bottom.value}`);
    if (stats.spread !== null) lines.push(`最大為最小的 ${stats.spread} 倍`);
  }

  // 資料來源組成
  const s = stats.sources;
  if (s.wb && s.official) {
    lines.push(`資料來源：官方 ${s.official} 點 + 世界銀行 ${s.wb} 點（混合，接縫處口徑可能不同）`);
  } else if (s.wb) {
    lines.push(`資料來源：世界銀行國際估算（非中國官方公布值）`);
  } else {
    lines.push(`資料來源：中國官方公布值`);
  }

  if (item.noteZh) lines.push(`既有口徑備註：${item.noteZh}`);
  if (item.wbCaliber) lines.push(`注意：此序列口徑與中國官方定義不同，不可直接比較。`);

  return lines.join("\n");
}
