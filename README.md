# 個人行程與任務管理系統｜前端原型

以原生 HTML、CSS、JavaScript 製作的響應式個人行程首頁；無需安裝依賴。

## 開啟

設定 Firebase 後，以 GitHub Pages 網址或 localhost 靜態伺服器開啟。未登入時行程內容會鎖定。

## Firebase 登入與 Firestore 設定

本專案使用 Firebase Authentication 的 Google provider 與 Firestore。未登入時行程內容會鎖定。

1. Firebase 專案 `daily-routine-20261106` 已連結 Web App，`app.js` 中已有 Firebase config。這些 Web config 值會公開在前端，請勿放入服務帳戶私密金鑰。
2. Authentication → Sign-in method 啟用 Google provider；Authentication → Settings → Authorized domains 加入正式網域（例如 `summerain-88.github.io`）。
3. 在 Firestore Database 建立 Standard edition 資料庫，使用預設資料庫 `(default)`。若主要使用者在台灣，可選 `asia-east1`；資料位置建立後不能變更。選 Production mode。
4. 登入 Firebase CLI 後，在專案根目錄部署安全規則：`npx -y firebase-tools@latest deploy --only firestore:rules`。規則檔為 `firestore.rules`。
5. 以 GitHub Pages 網址開啟網站並測試 Google 登入。若要本機測試，使用 localhost 靜態伺服器並將 localhost 加到 Authorized domains。

登入後，分類、待辦與行程會分別存入 `users/{uid}/categories`、`users/{uid}/tasks`、`users/{uid}/events`。第一次登入時，若 Firestore 尚無資料，系統會遷移該 UID 的舊 localStorage 資料；若沒有舊資料，會載入原型預設內容。localStorage 仍保留本機備份。Firestore 規則部署前，Production mode 會拒絕資料讀寫。

## 互動功能

- 今日總覽：日期、待辦進度、今日行程與重點任務。
- 行事曆：月曆瀏覽、日期選取及當日行程摘要。
- 任務：新增、編輯、完成／取消完成、刪除及類別篩選。
- 搜尋、類別排序、待辦與行程的快速新增。
- 桌機側邊欄與手機底部導覽。

此為瀏覽器端應用；資料會儲存在 Firestore，並按 Firebase UID 隔離。localStorage 保留作本機備份與舊資料遷移來源。

## AI 小幫手（Firebase AI Logic）

Firebase Console 已啟用 Gemini Developer API，AI 小幫手使用 Firebase AI Logic 的 Gemini 4 Hydrogen。提問時會送出登入者近期與未來的待辦／行程摘要。標題、日期、時間、分類和待辦狀態會用於一般回答；只有提問備註或地點時，才會附上相應欄位。聊天記錄只保留在目前頁面記憶體中，不會寫入 Firestore，也不會修改行程。Firebase JavaScript SDK 固定使用 13.4.0；Gemini 4 使用 LOW 思考等級及 2,048 個輸出 token，AI 請求 SDK 逾時設為 60 秒，另有 65 秒的取消保護。若模型沒有回傳文字，畫面會顯示完成原因。每次更新 AI 程式時，也要更新 `index.html` 的 `app.js` 版本參數及 `app.js` 中 AI 模組的版本參數，讓瀏覽器載入新版。

Firebase AI Logic 已強制使用 App Check；「日常行程管理網站」已註冊 Fraud Defense（reCAPTCHA Enterprise），`app.js` 也已設定對應的公開網站金鑰。要在正式網站使用 AI 小幫手，請發布最新版靜態網站：

1. 將目前最新版網站檔案（包含 `index.html`、`app.js`、`styles.css`、`ai-assistant.js` 與 `firestore-store.js`）發布至 GitHub Pages。
2. 用正式網站登入，開啟 AI 小幫手並試問「今天有哪些行程？」。Firebase AI Logic 的 App Check 驗證已強制啟用；未註冊或沒有有效 App Check token 時，Gemini 請求會遭拒。

Firebase Console 已完成 AI Logic 啟用與 Web App 的 App Check 註冊，不需要再次初始化；`.firebaserc` 指向 `daily-routine-20261106`。

本機測試可用 `localhost` 加上 `?appCheckDebug=1`；Firebase SDK 會產生 Debug token，需在 Firebase Console 登記該 token。Debug token 是私密值，不要寫入程式碼或提交版本控制。
