# Tidy Tabs v2.0 — History-Aware Smart Chrome Tab Organizer (Manifest V3)

Tidy Tabs automatically cleans up and organizes your unpinned tabs into native, color-coded Chrome Tab Groups based on **Chrome History visit frequency**, **domain & keyword heuristics**, **legacy group context (`Core` / `TimePass`)**, and **TTL recency**.

---

## What's New in v2.0

1. **Chrome History Intelligence (`chrome.history`)**:
   - Computes a composite **Usage Score** combining historical visit frequency (`visitCount`) and recency.
   - **Smart Clutter Filter**: Tabs opened once or twice ($\le 2$ visits) and left untouched for $\ge 3$ days fast-track to `Archive` instead of cluttering `Work` or `Entertainment` for two weeks.
   - Clicking **Organize Now** sorts tabs inside each category left-to-right from highest Usage Score to lowest.
2. **Legacy `Core` & `TimePass` Context Retention**:
   - Before dissecting your existing `Core` / `CORE` and `TimePass` groups, Tidy Tabs records each tab's legacy group hint in `chrome.storage.local`.
   - Unrecognized domains that lived in `Core` automatically default to `Work`, and unrecognized domains from `TimePass` default to `Entertainment`.
3. **Zero-Flicker Diff Engine & Intra-Group Stability**:
   - During everyday tab switching, Tidy Tabs only calls `chrome.tabs.group` when a tab's category actually changes—keeping tab positions inside a group completely stable under your cursor.
   - Never collapses a group containing your currently active tab, and respects your manual expand/collapse toggles on active groups.
   - Optional **Focus Mode** automatically collapses all groups except the one containing your active tab.
4. **Automatic RAM Hibernation (`chrome.tabs.discard`) & 1-Click Tab Hygiene**:
   - Automatically suspends background tabs in `Archive` from RAM (`chrome.tabs.discard`) while keeping them safely in the collapsed `Archive` group until clicked.
   - **Close Duplicates (`N`)** & **Close Archived (`N`)** 1-click actions right in the popup header.
5. **1-Click Open Domain Classifier**:
   - Surfaces any unrecognized domains currently open in your window with 1-click `+Work`, `+Ent`, `+Res`, `+Util` pills in the popup.

---

## How to Load / Reload in Profile `yugrjain@gmail.com`

1. Open Google Chrome in your **`yugrjain@gmail.com`** profile.
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select `/Users/yugjain/Downloads/Tidy Tabs` (or click the **Reload ↻** icon on the Tidy Tabs card if already loaded).
