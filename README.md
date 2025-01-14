# 和信醫院2025春酒抽獎系統

一個現代化的抽獎系統，專為和信醫院2025年春酒活動設計。採用React、TypeScript和Tailwind CSS構建，具有完整的抽獎功能與流暢的動畫效果。

## 主要功能

- 🎯 隨機抽獎與動畫效果
- 📤 文字檔名單上傳支援 (.txt)
- ⚡ 快抽模式
- 🚫 跳過已中獎者選項
- 🎉 中獎慶祝動畫與音效
- 📱 響應式設計
- 📥 中獎名單下載 (CSV格式)
- 📚 中獎歷史紀錄
- 🔄 重置與重新使用功能
- 📊 抽獎進度條顯示

## 快速開始

### 安裝

```bash
npm install
# 或
yarn install
```

### 運行應用程式

```bash
npm run dev
# 或
yarn dev
```

應用程式將在 `http://localhost:5173` 啟動

## 使用說明

### 1. 載入參與者名單

有兩種方式載入參與者名單：
- **上傳文字檔**：點擊上傳按鈕並選擇包含參與者姓名的 .txt 檔案（每行一個姓名）
- **手動輸入**：直接在文字輸入框中輸入姓名並按下 Enter

### 2. 進行抽獎

1. 載入名單後，參與者數量將顯示在右側
2. 設定抽獎人數（預設為1人）
3. 選擇是否跳過已中獎者
4. 點擊「開始抽獎」按鈕啟動動畫抽獎
   - 或使用「快抽模式」立即顯示結果
5. 中獎者將顯示在右側名單中
6. 中獎時會播放慶祝動畫與音效

### 3. 中獎名單管理

- **下載名單**：將中獎名單匯出為CSV檔案
- **清除名單**：重置當前中獎名單
- **加入歷史**：將當前中獎者加入歷史紀錄
- **查看歷史**：在抽獎時可選擇跳過歷史中獎者

### 4. 其他設定

- **音效控制**：點擊頁面底部版權聲明可停止所有音效
- **重置系統**：使用「重新載入」按鈕清除所有設定與名單

## 開發技術

本專案使用以下技術：
- React 18+
- Vite
- Tailwind CSS
- TypeScript
- Radix UI 元件庫
- Howler.js (音效處理)
- Fireworks.js (慶祝動畫)

## 授權

© 2025 林協霆。保留所有權利。
