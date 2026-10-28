# 🗂️ Tidy Tabs

> **Clean, intelligent, and automatic tab organization for Google Chrome.**  
> Effortlessly turns tab overload into organized native tab groups based on domain rules, Chrome history frequency, dynamic auto-clustering, and access recency.

---

## ✨ Why Tidy Tabs?

If you constantly have 30+ tabs open, you know the struggle:
- **Lost tabs**: Can't find the Google Doc, Figma file, or PR you opened an hour ago.
- **Forgotten clutter**: One-off articles, random search results, and videos sitting untouched for days.
- **Duplicate tabs**: Accidentally opening the same GitHub repo or YouTube link three times.
- **Chrome eating your RAM**: Inactive tabs draining battery and memory in the background.

**Tidy Tabs fixes this automatically without changing your browsing habits.** It sorts your unpinned tabs into clean, color-coded Chrome Tab Groups in a stable left-to-right order, auto-spawns dynamic topic groups when you open multiple tabs on a new site, demotes stale tabs to a collapsed Archive, and hibernates them to save memory.

---

## 🚀 60-Second Installation Guide

You don't need any programming experience to use Tidy Tabs!

### Step 1: Download the Extension
Choose either option:
- **Option A (Easiest)**: Click the green **Code** button at the top of this GitHub page and select **Download ZIP**. Unzip it on your computer.
- **Option B (Git)**:
  ```bash
  git clone https://github.com/yugjain/tidy-tabs.git
  ```

### Step 2: Load into Google Chrome
1. Open Google Chrome.
2. In the address bar, type:
   ```text
   chrome://extensions/
   ```
   *(or click the three dots Menu $\rightarrow$ Extensions $\rightarrow$ Manage Extensions)*.
3. In the top-right corner, toggle **Developer mode** to **ON**.
4. In the top-left corner, click **Load unpacked**.
5. Select the `tidy-tabs` folder you just downloaded or cloned.

🎉 **Done!** Tidy Tabs is now active. Pin it to your Chrome toolbar for easy access.

---

## 🎨 How It Organizes Your Tabs

Tidy Tabs maintains a fixed, stable left-to-right order of native Chrome Tab Groups:

| Group | Color | Default State | Included Sites & Workflows |
| :--- | :---: | :---: | :--- |
| **Work** | 🔵 Blue | Expanded | Google Docs, Sheets, Slides, Drive, Gmail, Meet, GitHub, GitLab, Slack, Notion, Jira, Linear, LinkedIn, Zoom, Figma, etc. |
| **Entertainment** | 🔴 Rose | Expanded | YouTube, Netflix, Reddit, X (Twitter), Instagram, Twitch, Spotify, Prime Video, Disney+, Hotstar, Chess.com, etc. |
| **Research** | 🟢 Green | Expanded | Stack Overflow, Medium, Substack, Wikipedia, arXiv, MDN, Dev.to, ChatGPT, Claude, Gemini, documentation & tech blogs. |
| **Dynamic Groups** *(e.g. Airbnb, Coursera)* | 🟣/🌸/🔷 Vibrant | Expanded | **Auto-created** when $\ge 2$ tabs share an unassigned site. Persists until all tabs close. |
| **Utilities** | 🟡 Amber | Expanded | AWS, GCP, Azure, localhost / 127.0.0.1, Amazon, Flipkart, online banking, maps, speed tests, and tools. |
| **Archive** | ⚪ Slate | **Auto-Collapsed** | Inactive tabs untouched for > 14 days (or opened-once clutter). **Hibernated from RAM.** |

> 📌 **Note**: Pinned tabs are always ignored and remain untouched on the far left.

---

## ⚡ Superpowers

### 🔮 Dynamic Domain Auto-Clustering (New in v2.1)
Whenever you open **2 or more tabs** on a new site (e.g. `airbnb.com`, `stripe.com`, `coursera.org`), Tidy Tabs automatically spawns a dedicated native Tab Group named after that site (e.g., `Airbnb (2)`) with a unique vibrant color. It keeps your tabs neatly clustered for your current task and automatically dissolves only when all tabs in that cluster are closed.

### ⏱️ Strict 5-Minute Auto-Sweep (New in v2.1)
No need to manually click buttons: a background timer automatically evaluates tabs, updates group counts, and performs a full Chrome History Usage-Score sort **every 5 minutes** so your browser stays perpetually tidy.

### 🎯 Native Tab Group Visual Indicators (New in v2.1)
Your native Chrome Tab Group titles automatically update with live tab counts and active indicators:
- `● Work (4)` — Shows you are currently viewing a tab inside the Work group.
- `Figma (3)` — Group tab count indicator right on your browser tab strip.

### 🔦 In-Popup Tab Spotlight & Switcher (New in v2.1)
Open the popup to see a real-time searchable list of all open tabs across all groups:
- 🟢 **Active Now**: The tab you are currently viewing.
- ⚡ **Fresh (<1h)**: Recently accessed tabs.
- ⏳ **Idle (>2d)**: Tabs approaching archive.
- 💤 **Sleeping**: Hibernated tabs consuming 0 MB RAM.
- **1-Click Jump**: Click any tab in the spotlight to immediately jump to it.

### 🧠 Chrome History Usage Intelligence
- **Daily Drivers Stay Active**: Tabs you visit frequently stay in their active categories.
- **Clutter Filter**: Tabs you opened just once or twice ($\le 2$ visits) and haven't clicked in 3+ days are automatically fast-tracked to the collapsed **Archive** so they don't crowd your daily view.

### 🧹 1-Click Duplicate Cleaner
Accidentally opened the same YouTube video, GitHub issue, or article three times? Click **Duplicates** in the popup to close all duplicates in 1 click, automatically keeping the active or newest tab.

### 💤 RAM Saver (Tab Hibernation)
Background tabs inside the **Archive** group are automatically hibernated (`chrome.tabs.discard`). They stay right there in your tab bar for whenever you need them, but consume **0 MB of RAM** until clicked.

### 🎯 Focus Mode
Want zero distractions? Toggle **Focus Mode** on in the popup. Inactive tab groups will automatically collapse, keeping only the group you are currently working in expanded.

### 🏷️ 1-Click Custom Domain Classifier
Whenever you open a 1-off site that isn't pre-configured, Tidy Tabs detects it and displays a quick-action row in the popup:
```text
my-internal-tool.com  ->  [ +Work ]  [ +Ent ]  [ +Res ]  [ +Util ]
```
Click once, and all tabs for that site are permanently categorized.

---

## 🔒 100% Private & Local

- **Zero Tracking**: No analytics, telemetry, or third-party SDKs.
- **Runs Completely Offline**: All grouping, history scoring, and storage happen strictly inside your browser using Chrome's native local APIs (`chrome.storage.local`).
- **No Cloud Required**: Your browsing history and tab URLs never leave your computer.

---

## 📄 License

Distributed under the [MIT License](LICENSE). Free for personal and commercial use.
