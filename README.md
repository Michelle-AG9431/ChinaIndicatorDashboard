# 中國觀測 50 指標互動儀表板 · China Monitoring 50 Indicators

三語（繁中／English／日本語）互動式儀表板，追蹤中國經濟、金融、財政、社會與政治 50 項觀測指標，串接官方原始來源，並具備更新頻率標註、統計口徑備註、異常波動警示與 CSV 匯出。

A trilingual (Traditional Chinese / English / Japanese) interactive dashboard tracking 50 China-monitoring indicators across economy, finance, fiscal affairs, society and politics — linked to official sources, with update-frequency labels, caliber notes, anomaly alerts and CSV export.

---

## 功能 Features

- **三語切換 Trilingual** — 一鍵循環 繁中 → English → 日本語（同時滿足中英版與中日版）
- **視覺化圖表** — 折線／長條／面積／圓餅，依指標特質自動選型
- **更新頻率標註** — 年報／季報／月報／每日／事件驅動
- **數據溯源** — 每項指標附來源單位與可點擊的官方連結
- **統計口徑備註** — 定義變更、估計值、序列中斷、口徑差異均標註於卡片下方
- **異常波動警示** — 自動偵測單點變動 > 40% 並以警示標記
- **即時抓取（選配）** — 透過 `/api/proxy` serverless function 繞過官方網站 CORS 限制
- **CSV 匯出** — 匯出目前篩選結果（含三語名稱與來源連結）

---

## 本機開發 Local development

```bash
npm install
npm run dev
```

開啟 http://localhost:5173

---

## 部署到 Vercel Deploy to Vercel

1. 將本專案推上 GitHub：

   ```bash
   git init
   git add .
   git commit -m "China Monitoring Dashboard"
   git branch -M main
   git remote add origin https://github.com/<你的帳號>/china-monitoring-dashboard.git
   git push -u origin main
   ```

2. 前往 https://vercel.com → **Add New Project** → 匯入此 repository → **Deploy**。

3. 部署完成後會得到類似 `https://china-monitoring-dashboard.vercel.app` 的網址。
   `api/proxy.js` 會自動成為 serverless function，供前端「更新資料」按鈕呼叫。

---

## 即時更新如何運作 How live refresh works

瀏覽器無法直接抓取中國官方網站（CORS 限制）。本專案改由 `api/proxy.js`
（僅允許官方統計網域的白名單）在伺服器端代抓，再回傳給前端。

目前 proxy 會取回官方頁面 HTML 並驗證連線；若要真正把數字自動填入，
只需在 `doRefresh()` 或一支新的 serverless function 內，針對各來源頁面加上
對應的解析（parser）即可，資料結構已預留於 `src/data.js` 的 `V` 物件。

---

## 維護資料 Maintaining the data

所有指標資料集中在 **`src/data.js`**：

- `names` — 50 項指標的 [中文, English, 日本語] 名稱
- `V` — 已核實數值、時間序列、三語備註、來源連結、更新頻率
- `hasAnomaly()` — 異常波動偵測門檻（預設 40%）

更新時只需編輯 `V` 物件對應的指標編號即可。

---

## 資料來源 Data sources

- 國家統計局國家數據 — https://data.stats.gov.cn/
- 中國政府網 2025 中國經濟年報 — https://www.gov.cn/zhuanti/2025zgjjnb/index.htm
- 國家金融監督管理總局 — https://www.nfra.gov.cn/
- 財政部財政數據 — https://www.mof.gov.cn/gkml/caizhengshuju/index.htm
- 全國人大政府債務報告 — http://www.npc.gov.cn/
- 中國人民銀行調查統計 — http://www.pbc.gov.cn/

官方未公開之指標，改採 IMF / World Bank / OECD / ILO 等國際機構估算並於備註標明。
