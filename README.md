# 個人行程與任務管理系統｜前端原型

以原生 HTML、CSS、JavaScript 製作的響應式個人行程首頁；無需安裝依賴。

## 開啟

設定 Firebase 後，以 GitHub Pages 網址或 localhost 靜態伺服器開啟。未登入時行程內容會鎖定。

## Firebase Google 登入設定

本專案使用 Firebase Authentication 的 Google provider。設定完成前，行程畫面會維持鎖定。

1. 在 Firebase Console 建立專案，新增 Web App，複製 Firebase config。
2. Authentication → Sign-in method 啟用 Google provider（Firebase 專案 `daily-routine-20261106` 已由我代為建立 Web App 並啟用 Google provider）。
3. Authentication → Settings → Authorized domains 加入正式網域（例如 `summerain-88.github.io`）。
4. 編輯 [1mapp.js[0m 開頭的 [1mfirebaseConfig[0m，填入 [1mapiKey[0m、[1mauthDomain[0m、[1mprojectId[0m、[1mappId[0m。這些 Web config 值會公開在前端，請勿放入服務帳戶私密金鑰。
5. 以 GitHub Pages 網址開啟網站並測試 Google 登入。若要本機測試，使用 localhost 靜態伺服器並將 localhost 加到 Authorized domains。

目前登入後的資料按 Firebase UID 分開存在該瀏覽器的 localStorage；登入本身不會同步行程到雲端。跨裝置同步需另行設定 Firestore 與安全規則。未設定 Firebase 前，Google 登入不可用，且不會展示行程資料。

## 互動功能

- 今日總覽：日期、待辦進度、今日行程與重點任務。
- 行事曆：月曆瀏覽、日期選取及當日行程摘要。
- 任務：新增、編輯、完成／取消完成、刪除及類別篩選。
- 搜尋、類別排序、待辦與行程的快速新增。
- 桌機側邊欄與手機底部導覽。

此為瀏覽器端原型；資料僅存在目前裝置與瀏覽器中，尚未包含登入、跨裝置同步或雲端備份。
