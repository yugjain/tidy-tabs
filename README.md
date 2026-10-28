# 🗂️ Tidy Tabs

> **Clean, intelligent, and automatic tab organization built from first principles for power users and ADHD minds.**  
> Effortlessly turns tab overload into organized native Chrome Tab Groups with absolute audio protection, zero-guilt tab vault stashing, and global keyboard shortcuts.

---

## ✨ Why Tidy Tabs?

If you constantly have 40–100+ open tabs, you know the struggle:
- **Audio Chaos**: Background music or a podcast is playing from some unknown tab, and collapsing your groups hides the controls.
- **Tab Hoarding Anxiety**: You can't close 30 tabs because you're terrified of losing that research rabbit hole or reading list forever.
- **Lost in Groups**: You're hyperfocused on a task, open 15 tabs, and lose track of your primary work.
- **Chrome eating your RAM**: 60 inactive tabs draining your battery and memory.

**Tidy Tabs fixes this without breaking your flow.** It protects your media, provides a 1-click **Tab Vault** to park tabs guilt-free, auto-clusters related tasks, and lets you drive everything via keyboard shortcuts.

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

## ⌨️ Global Keyboard Shortcuts (ADHD Power User)

Control your entire browser tabstrip with zero mouse clicks:

| Shortcut (Mac) | Shortcut (Win / Linux) | Action |
| :--- | :---: | :--- |
| <kbd>⌘</kbd> + <kbd>⇧</kbd> + <kbd>O</kbd> | <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>O</kbd> | **Quick Tidy**: Instantly regroup & sort all tabs by Usage Score in the background. |
| <kbd>⌘</kbd> + <kbd>⇧</kbd> + <kbd>F</kbd> | <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> | **Zen Focus Mode**: Collapse distraction groups *(playing audio & active groups stay open!)*. |
| <kbd>⌘</kbd> + <kbd>⇧</kbd> + <kbd>S</kbd> | <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | **Stash to Vault**: Instantly park all idle tabs into a saved session and clear your tab bar. |

> ⚙️ Customize shortcuts anytime at `chrome://extensions/shortcuts`.

---

## ⚡ Superpowers Built for ADHD

### 🔊 Absolute Audio Protection (New in v2.2)
- **Never Collapsed**: Any group containing a tab playing audio (`tab.audible === true`) is **strictly immune to collapsing**, even in Zen Focus Mode!
- **Tab Bar Speaker Indicator**: Group titles dynamically update with a speaker icon: `🔊 Entertainment (3)` so you can locate audio in 0.1 seconds.
- **Zero Audio Hibernation**: Audio tabs are never demoted to Archive or discarded while sound is playing.
- **Now-Playing Media Bar**: A floating bar at the top of the popup shows the active audio tab with 1-click **Mute/Unmute** and **Jump**.

### 📦 The Tab Vault ("Parking Lot") (New in v2.2)
The #1 cause of tab hoarding is the fear of losing context. The **Tab Vault** removes all guilt:
- 1-click to park 20+ idle tabs into a clean, searchable, timestamped session in `chrome.storage.local`.
- Frees 100% of RAM and clears the tab strip immediately.
- Browse past sessions in the popup and click **Restore** to bring all tabs back into a dedicated native group in 1 second!

### 🔦 Keyboard-Navigable Tab Spotlight (New in v2.2)
Open the popup and drive everything with your keyboard:
- <kbd>↑</kbd> and <kbd>↓</kbd> to cycle through open tabs.
- <kbd>Enter</kbd> to jump to the selected tab.
- <kbd>⌘</kbd>+<kbd>⌫</kbd> (or <kbd>Delete</kbd>) to close the selected tab right from the list.
- Real-time search filter and visual heatmap: 🟢 *Active Now*, 🔊 *Audio*, ⚡ *Fresh (<1h)*, ⏳ *Warm (<24h)*, 🍂 *Idle (>2d)*, 💤 *Sleeping (0 MB)*.

### 🛡️ ADHD Overload Shield Banner (New in v2.2)
When your unpinned tabs exceed 25, a gentle banner appears in the popup: *"32 tabs open — feeling crowded? [Stash Idle Tabs]"*. 1 click clears the visual clutter into the Vault.

### 🔮 Dynamic Domain Auto-Clustering
Whenever you open **2 or more tabs** on a new site (e.g. `airbnb.com`, `stripe.com`, `coursera.org`), Tidy Tabs automatically spawns a dedicated native Tab Group named after that site (e.g., `Airbnb (2)`) with a unique vibrant color. It keeps your tabs neatly clustered for your current task and automatically dissolves only when all tabs in that cluster are closed.

### ⏱️ Strict 5-Minute Auto-Sweep
A background timer automatically evaluates tabs, updates group counts, and performs a full Chrome History Usage-Score sort **every 5 minutes** so your browser stays perpetually tidy.

### 🧹 1-Click Duplicate Cleaner
Accidentally opened the same YouTube video, GitHub issue, or article three times? Click **Dupes** in the popup to close all duplicates in 1 click, automatically keeping the active or newest tab.

### 💤 RAM Saver (Tab Hibernation)
Background tabs inside the **Archive** group are automatically hibernated (`chrome.tabs.discard`). They stay right there in your tab bar for whenever you need them, but consume **0 MB of RAM** until clicked.

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

> 📌 **Note**: Any group containing actively playing audio (`🔊`) or your current active tab (`●`) is **strictly forbidden from collapsing**, guaranteeing you never lose visual control.

---

## 🔒 100% Private & Local

- **Zero Tracking**: No analytics, telemetry, or third-party SDKs.
- **Runs Completely Offline**: All grouping, history scoring, vault storage, and audio monitoring happen strictly inside your browser using Chrome's native local APIs (`chrome.storage.local`).
- **No Cloud Required**: Your browsing history and tab URLs never leave your computer.

---

## 📄 License

Distributed under the [MIT License](LICENSE). Free for personal and commercial use.
