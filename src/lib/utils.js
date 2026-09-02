/**
 * cn() — 合併 Tailwind class，並解決衝突。
 *
 * 零依賴版本，不需要 clsx / tailwind-merge。
 * 當同一類型的 class 出現多次時（例如 bg-white 與 bg-transparent），
 * 保留「最後傳入的」，讓 component 的 className prop
 * 能正確覆蓋 variant 的預設樣式。
 *
 * 也支援變體前綴：hover:bg-x 與 bg-x 視為不同群組，
 * hover:bg-a 與 hover:bg-b 才會互相覆蓋。
 */

// Tailwind 內建色名。用來分辨 text-sm（字級）與 text-white（顏色）。
const COLOR_NAMES = new Set([
  "inherit", "current", "transparent", "black", "white",
  "slate", "gray", "grey", "zinc", "neutral", "stone",
  "red", "orange", "amber", "yellow", "lime", "green", "emerald",
  "teal", "cyan", "sky", "blue", "indigo", "violet", "purple",
  "fuchsia", "pink", "rose",
]);

const FONT_SIZES = new Set([
  "xs", "sm", "base", "lg", "xl",
  "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl",
]);

const FONT_WEIGHTS = new Set([
  "thin", "extralight", "light", "normal", "medium",
  "semibold", "bold", "extrabold", "black",
]);

const DISPLAY = new Set([
  "block", "inline-block", "inline", "flex", "inline-flex",
  "grid", "inline-grid", "table", "contents", "hidden", "flow-root",
]);

const POSITION = new Set([
  "static", "fixed", "absolute", "relative", "sticky",
]);

// 直接對應到單一群組的前綴（取第一段就能判斷）。
const SIMPLE_PREFIXES = {
  bg: "bg", ring: "ring-width", shadow: "shadow", opacity: "opacity",
  rounded: "rounded", fill: "fill", stroke: "stroke",
  p: "p", px: "px", py: "py", pt: "pt", pr: "pr", pb: "pb", pl: "pl",
  m: "m", mx: "mx", my: "my", mt: "mt", mr: "mr", mb: "mb", ml: "ml",
  w: "w", h: "h", "min-w": "min-w", "min-h": "min-h",
  "max-w": "max-w", "max-h": "max-h",
  gap: "gap", "gap-x": "gap-x", "gap-y": "gap-y",
  z: "z", basis: "basis", grow: "grow", shrink: "shrink",
  leading: "leading", tracking: "tracking",
  cursor: "cursor", overflow: "overflow",
};

// 判斷 xxx-yyy 的 yyy 是不是顏色（含 white/5、[#fff]、slate-300 等寫法）。
function looksLikeColor(rest) {
  if (!rest) return false;
  if (rest.startsWith("[")) return true;
  const base = rest.split("/")[0].split("-")[0];
  return COLOR_NAMES.has(base);
}

/** 回傳這個 class 所屬的群組名稱；無法判斷則回傳 null（永遠保留）。 */
function groupOf(cls) {
  // 拆掉變體前綴：hover:focus:bg-red-500 → ["hover","focus"] + "bg-red-500"
  const parts = cls.split(":");
  const base = parts.pop();
  const variant = parts.join(":");
  const neg = base.startsWith("-");
  const body = neg ? base.slice(1) : base;

  const key = (g) => (variant ? `${variant}:${g}` : g);

  // 無值的單體 class
  if (DISPLAY.has(body)) return key("display");
  if (POSITION.has(body)) return key("position");
  if (body === "border") return key("border-w");
  if (body === "ring") return key("ring-width");
  if (body === "italic" || body === "not-italic") return key("font-style");
  if (body === "underline" || body === "line-through" || body === "no-underline")
    return key("text-decoration");
  if (body === "truncate") return key("truncate");

  const dash = body.indexOf("-");
  if (dash === -1) return null;

  const head = body.slice(0, dash);
  const rest = body.slice(dash + 1);

  // text-：需要分辨 顏色 / 字級 / 對齊
  if (head === "text") {
    if (["left", "center", "right", "justify", "start", "end"].includes(rest))
      return key("text-align");
    if (FONT_SIZES.has(rest)) return key("font-size");
    if (looksLikeColor(rest)) return key("text-color");
    return key("font-size");
  }

  // border-：分辨 顏色 / 寬度 / 單邊
  if (head === "border") {
    if (looksLikeColor(rest)) return key("border-color");
    if (["x", "y", "t", "r", "b", "l"].includes(rest.split("-")[0]))
      return key(`border-w-${rest.split("-")[0]}`);
    if (["solid", "dashed", "dotted", "double", "none"].includes(rest))
      return key("border-style");
    return key("border-w");
  }

  // font-：weight 或 family
  if (head === "font") {
    return key(FONT_WEIGHTS.has(rest) ? "font-weight" : "font-family");
  }

  // ring-offset / ring 顏色
  if (head === "ring") {
    if (rest.startsWith("offset-")) return key("ring-offset");
    if (looksLikeColor(rest)) return key("ring-color");
    return key("ring-width");
  }

  // 兩段式前綴（min-w、max-h、gap-x…）
  const twoWord = body.split("-").slice(0, 2).join("-");
  if (SIMPLE_PREFIXES[twoWord]) return key(SIMPLE_PREFIXES[twoWord]);
  if (SIMPLE_PREFIXES[head]) return key(SIMPLE_PREFIXES[head]);

  return null;
}

/** 把各種輸入（字串、陣列、物件、falsy）攤平成字串。 */
function flatten(input) {
  if (!input) return "";
  if (typeof input === "string") return input;
  if (typeof input === "number") return String(input);
  if (Array.isArray(input)) return input.map(flatten).filter(Boolean).join(" ");
  if (typeof input === "object") {
    return Object.keys(input).filter((k) => input[k]).join(" ");
  }
  return "";
}

export function cn(...inputs) {
  const classes = flatten(inputs).split(/\s+/).filter(Boolean);

  const seen = new Map(); // group -> 該群組最後出現的 class
  const keep = [];        // 無法歸類的 class，全部保留

  for (const cls of classes) {
    const g = groupOf(cls);
    if (g === null) {
      keep.push(cls);
    } else {
      seen.set(g, cls); // 後面的蓋掉前面的
    }
  }

  // 去除 keep 內的重複，並維持原順序
  const uniqueKeep = [...new Set(keep)];
  return [...uniqueKeep, ...seen.values()].join(" ");
}
