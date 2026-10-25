/**
 * Tidy Tabs v2.0 - Background Service Worker (Manifest V3)
 * Features:
 * - Chrome History visit frequency & Usage Score intelligence
 * - Legacy 'Core' & 'TimePass' group context retention during dissection
 * - Zero-flicker diff-based tab grouping & smart Focus Mode collapsing
 * - Automatic RAM Hibernation (chrome.tabs.discard) for Archived tabs
 * - Cross-restart URL metadata persistence + 1-click deduplication & pruning
 */

export const DEFAULT_CATEGORIES = [
  {
    id: 'work',
    name: 'Work',
    color: 'blue',
    collapsed: false,
    domains: [
      'google.com/docs',
      'google.com/spreadsheets',
      'google.com/presentation',
      'docs.google.com',
      'sheets.google.com',
      'slides.google.com',
      'drive.google.com',
      'mail.google.com',
      'meet.google.com',
      'calendar.google.com',
      'github.com',
      'gitlab.com',
      'bitbucket.org',
      'slack.com',
      'notion.so',
      'jira.com',
      'atlassian.net',
      'linear.app',
      'asana.com',
      'trello.com',
      'linkedin.com',
      'zoom.us',
      'figma.com',
      'miro.com',
      'canva.com',
      'datadoghq.com',
      'sentry.io',
      'vercel.com',
      'netlify.com',
      'render.com',
      'supabase.com',
      'firebase.google.com',
      'stripe.com'
    ]
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    color: 'red',
    collapsed: false,
    domains: [
      'youtube.com',
      'youtu.be',
      'netflix.com',
      'reddit.com',
      'twitter.com',
      'x.com',
      'instagram.com',
      'twitch.tv',
      'spotify.com',
      'primevideo.com',
      'disneyplus.com',
      'hotstar.com',
      'jiocinema.com',
      'sonyliv.com',
      'hulu.com',
      'tiktok.com',
      'facebook.com',
      'pinterest.com',
      'steampowered.com',
      'epicgames.com',
      'chess.com',
      'lichess.org',
      'letterboxd.com',
      'imdb.com',
      'cricbuzz.com',
      'espncricinfo.com'
    ]
  },
  {
    id: 'research',
    name: 'Research',
    color: 'green',
    collapsed: false,
    domains: [
      'stackoverflow.com',
      'stackexchange.com',
      'medium.com',
      'substack.com',
      'wikipedia.org',
      'arxiv.org',
      'developer.mozilla.org',
      'dev.to',
      'hashnode.com',
      'coursera.org',
      'edx.org',
      'udemy.com',
      'chatgpt.com',
      'openai.com',
      'claude.ai',
      'gemini.google.com',
      'aistudio.google.com',
      'perplexity.ai',
      'paperswithcode.com',
      'huggingface.co',
      'kaggle.com',
      'news.ycombinator.com',
      'scholar.google.com',
      'readwise.io'
    ]
  },
  {
    id: 'utilities',
    name: 'Utilities',
    color: 'yellow',
    collapsed: false,
    domains: [
      'amazon.',
      'flipkart.com',
      'swiggy.com',
      'zomato.com',
      'blinkit.com',
      'zeptonow.com',
      'ebay.',
      'paypal.com',
      'zerodha.com',
      'groww.in',
      'hdfcbank.com',
      'icicibank.com',
      'sbi.co.in',
      'chase.com',
      'bankofamerica.com',
      'console.aws.amazon.com',
      'console.cloud.google.com',
      'portal.azure.com',
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      'weather.com',
      'maps.google.com',
      'fast.com',
      'speedtest.net'
    ]
  }
];

export const ARCHIVE_CATEGORY = {
  id: 'archive',
  name: 'Archive',
  color: 'grey',
  collapsed: true
};

// Secondary keyword heuristics for URL path & tab title when domain is unknown
const HEURISTIC_RULES = [
  {
    categoryId: 'work',
    urlPatterns: [
      /\/pull\/\d+/i,
      /\/issues\/\d+/i,
      /\/merge_requests\//i,
      /\.ipynb$/i,
      /\/dashboard/i,
      /\/admin/i,
      /\/workspace/i,
      /confluence/i
    ],
    titlePatterns: [
      /\bpull request\b/i,
      /\bjira\b/i,
      /\bkanban\b/i,
      /\bsprint\b/i,
      /\bdeployment\b/i,
      /\bconsole\b/i
    ]
  },
  {
    categoryId: 'entertainment',
    urlPatterns: [
      /\/watch\?v=/i,
      /\/shorts\//i,
      /\/reels\//i,
      /\/episode/i,
      /\/stream/i,
      /\/anime/i,
      /\/manga/i
    ],
    titlePatterns: [
      /\bwatch online\b/i,
      /\bepisode \d+/i,
      /\bseason \d+/i,
      /\blive stream\b/i,
      /\btrailer\b/i
    ]
  },
  {
    categoryId: 'research',
    urlPatterns: [
      /\/docs\//i,
      /\/documentation\//i,
      /\/wiki\//i,
      /\/blog\//i,
      /\/tutorial/i,
      /\/reference\//i,
      /\/api\//i,
      /\.pdf$/i
    ],
    titlePatterns: [
      /\bdocumentation\b/i,
      /\btutorial\b/i,
      /\bguide\b/i,
      /\bwhitepaper\b/i,
      /\barxiv\b/i,
      /\bbenchmark\b/i
    ]
  }
];

const DEFAULT_SETTINGS = {
  ttlDays: 14,
  clutterTtlDays: 3,
  clutterMaxVisits: 2,
  smartHistoryArchive: true,
  autoHibernateArchive: true,
  focusMode: false,
  debounceMs: 500,
  categories: DEFAULT_CATEGORIES
};

// In-memory state cache synchronized with chrome.storage.local
let cachedTimestamps = {}; // { [tabId]: number }
let cachedUrlMetadata = {}; // { [normalizedUrl]: { lastAccessed: number, legacyCategoryHint?: string } }
let cachedSettings = { ...DEFAULT_SETTINGS };
let isInitialized = false;

// In-memory Chrome History visit cache: { [url]: { visits: number, fetchedAt: number } }
const historyVisitCache = new Map();
const HISTORY_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Per-window concurrency mutex and debounce timers
const windowLocks = new Map();
const debounceTimers = new Map();

/**
 * Normalize URLs for deduplication and cross-restart persistence.
 */
export function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return rawUrl.split('#')[0];
    }
    // Strip common tracking query parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'mc_cid', 'mc_eid', 'ref', 'si'
    ];
    for (const p of trackingParams) {
      u.searchParams.delete(p);
    }
    const cleanPath = u.pathname.replace(/\/+$/, '') || '/';
    const search = u.searchParams.toString();
    return `${u.protocol}//${u.hostname.toLowerCase()}${cleanPath}${search ? '?' + search : ''}`;
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Execute a task serially per window to prevent race conditions during tab grouping/moving.
 */
function runLocked(windowId, task) {
  const currentLock = windowLocks.get(windowId) || Promise.resolve();
  const nextLock = currentLock
    .then(task)
    .catch((err) => {
      console.warn(`[TidyTabs] Organization error in window ${windowId}:`, err);
    });
  windowLocks.set(windowId, nextLock);
  return nextLock;
}

/**
 * Debounce wrapper for organizing a specific window.
 */
function scheduleOrganize(windowId, delay = cachedSettings.debounceMs || 500, options = { forceSort: false }) {
  if (debounceTimers.has(windowId)) {
    clearTimeout(debounceTimers.get(windowId));
  }
  const timer = setTimeout(() => {
    debounceTimers.delete(windowId);
    runLocked(windowId, () => organizeWindow(windowId, options));
  }, delay);
  debounceTimers.set(windowId, timer);
}

/**
 * Persist state changes to chrome.storage.local.
 */
async function persistStorage() {
  try {
    // Cap urlMetadata at 1500 entries (keep most recent) to bound storage size
    const entries = Object.entries(cachedUrlMetadata);
    if (entries.length > 1500) {
      entries.sort((a, b) => (b[1].lastAccessed || 0) - (a[1].lastAccessed || 0));
      cachedUrlMetadata = Object.fromEntries(entries.slice(0, 1200));
    }
    await chrome.storage.local.set({
      tabTimestamps: cachedTimestamps,
      urlMetadata: cachedUrlMetadata
    });
  } catch (err) {
    console.warn('[TidyTabs] Storage write error:', err);
  }
}

/**
 * Initialize state from storage and synchronize with currently open tabs.
 */
async function initializeState() {
  const data = await chrome.storage.local.get(['tabTimestamps', 'urlMetadata', 'settings']);
  cachedTimestamps = data.tabTimestamps || {};
  cachedUrlMetadata = data.urlMetadata || {};
  cachedSettings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };

  if (!cachedSettings.categories || cachedSettings.categories.length === 0) {
    cachedSettings.categories = structuredClone(DEFAULT_CATEGORIES);
  }

  try {
    const allTabs = await chrome.tabs.query({});
    const activeTabIds = new Set(allTabs.map((t) => t.id));
    let hasChanges = false;

    for (const tab of allTabs) {
      const rawUrl = tab.url || tab.pendingUrl || '';
      const normUrl = normalizeUrl(rawUrl);

      if (!cachedTimestamps[tab.id]) {
        // Recover timestamp across browser restarts via URL fingerprint or native tab.lastAccessed
        const urlTs = normUrl && cachedUrlMetadata[normUrl]?.lastAccessed;
        const resolvedTs = tab.lastAccessed || urlTs || Date.now();
        cachedTimestamps[tab.id] = resolvedTs;
        hasChanges = true;
      }

      if (normUrl) {
        const existingMeta = cachedUrlMetadata[normUrl] || {};
        const bestTs = Math.max(existingMeta.lastAccessed || 0, cachedTimestamps[tab.id] || 0);
        if (existingMeta.lastAccessed !== bestTs) {
          cachedUrlMetadata[normUrl] = { ...existingMeta, lastAccessed: bestTs };
          hasChanges = true;
        }
      }
    }

    // Prune closed tab IDs
    for (const idStr of Object.keys(cachedTimestamps)) {
      const id = Number(idStr);
      if (!activeTabIds.has(id)) {
        delete cachedTimestamps[id];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await persistStorage();
    }
  } catch (err) {
    console.warn('[TidyTabs] Error syncing tabs during init:', err);
  }

  isInitialized = true;
}

/**
 * Inspect existing non-TidyTabs groups (like 'Core', 'CORE', 'TimePass') and record origin hints
 * before dissecting them so unknown domains preserve their intended context.
 */
function captureLegacyGroupHints(tabs, existingGroups) {
  const groupTitleById = new Map();
  for (const g of existingGroups) {
    if (g.title) {
      groupTitleById.set(g.id, g.title.trim());
    }
  }

  let updated = false;
  for (const tab of tabs) {
    if (!tab.groupId || tab.groupId === -1) continue;
    const groupTitle = groupTitleById.get(tab.groupId);
    if (!groupTitle) continue;

    let hint = null;
    if (/^core$/i.test(groupTitle) || /\bcore\b/i.test(groupTitle)) {
      hint = 'work';
    } else if (/time\s*pass/i.test(groupTitle) || /leisure|fun|chill/i.test(groupTitle)) {
      hint = 'entertainment';
    }

    if (hint) {
      const normUrl = normalizeUrl(tab.url || tab.pendingUrl || '');
      if (normUrl) {
        const current = cachedUrlMetadata[normUrl] || {};
        if (current.legacyCategoryHint !== hint) {
          cachedUrlMetadata[normUrl] = {
            ...current,
            lastAccessed: current.lastAccessed || cachedTimestamps[tab.id] || tab.lastAccessed || Date.now(),
            legacyCategoryHint: hint
          };
          updated = true;
        }
      }
    }
  }
  return updated;
}

/**
 * Query Chrome History visit count for a tab URL (with 10-minute in-memory caching).
 */
async function getHistoryVisitCount(rawUrl) {
  if (!rawUrl || !chrome.history) return 1;
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return 1;
  } catch {
    return 1;
  }

  const norm = normalizeUrl(rawUrl);
  const now = Date.now();
  const cached = historyVisitCache.get(norm);
  if (cached && now - cached.fetchedAt < HISTORY_CACHE_TTL_MS) {
    return cached.visits;
  }

  try {
    const visits = await chrome.history.getVisits({ url: rawUrl });
    const count = Array.isArray(visits) ? visits.length : 1;
    historyVisitCache.set(norm, { visits: count, fetchedAt: now });
    return count;
  } catch {
    return 1;
  }
}

/**
 * Compute composite Usage Score combining Chrome History visit count and recency.
 * Higher score = positioned further left inside its category group on 'Organize Now'.
 */
export function computeUsageScore(tab, now = Date.now(), visitCount = 1) {
  const normUrl = normalizeUrl(tab.url || tab.pendingUrl || '');
  const timestamp =
    cachedTimestamps[tab.id] ||
    (normUrl && cachedUrlMetadata[normUrl]?.lastAccessed) ||
    tab.lastAccessed ||
    now;

  const hoursIdle = Math.max(0, (now - timestamp) / (1000 * 60 * 60));
  const recencyBonus = Math.max(0, 100 - hoursIdle / 2.4); // 100 pts if just clicked, 0 pts at 10 days
  const frequencyBonus = Math.min(250, visitCount * 12); // Up to 250 pts for high-visit tabs
  const activeBonus = tab.active ? 500 : 0;

  return activeBonus + frequencyBonus + recencyBonus;
}

/**
 * Classify a tab into its target category and report how it was matched.
 * Returns { category, matchType, hostname }
 */
export function classifyTab(tab, now = Date.now(), visitCount = 1) {
  const rawUrl = tab.url || tab.pendingUrl || '';
  const normUrl = normalizeUrl(rawUrl);
  const timestamp =
    cachedTimestamps[tab.id] ||
    (normUrl && cachedUrlMetadata[normUrl]?.lastAccessed) ||
    tab.lastAccessed ||
    now;

  const idleMs = Math.max(0, now - timestamp);
  const standardTtlMs = (cachedSettings.ttlDays || 14) * 24 * 60 * 60 * 1000;
  const clutterTtlMs = (cachedSettings.clutterTtlDays || 3) * 24 * 60 * 60 * 1000;
  const clutterMaxVisits = cachedSettings.clutterMaxVisits ?? 2;

  // Never archive the currently active tab
  if (!tab.active) {
    // 1. Standard TTL expiration (e.g. > 14 days untouched)
    if (idleMs >= standardTtlMs) {
      return { category: ARCHIVE_CATEGORY, matchType: 'archive', hostname: '' };
    }
    // 2. Smart History Filter: "Opened-Once & Forgotten" clutter demotion (e.g. >= 3 days idle & <= 2 visits)
    if (
      cachedSettings.smartHistoryArchive !== false &&
      idleMs >= clutterTtlMs &&
      visitCount <= clutterMaxVisits
    ) {
      return { category: ARCHIVE_CATEGORY, matchType: 'archive_clutter', hostname: '' };
    }
  }

  let hostname = '';
  let hostAndPath = '';
  if (rawUrl) {
    try {
      const urlObj = new URL(rawUrl);
      hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');
      hostAndPath = (urlObj.hostname + urlObj.pathname).toLowerCase();
    } catch {
      // Internal or non-standard URL
    }
  }

  // 3. Explicit domain rules (User + Default categories)
  if (hostAndPath) {
    for (const cat of cachedSettings.categories) {
      if (Array.isArray(cat.domains)) {
        for (const pattern of cat.domains) {
          const cleanPattern = pattern.trim().toLowerCase();
          if (cleanPattern && hostAndPath.includes(cleanPattern)) {
            return { category: cat, matchType: 'domain_rule', hostname };
          }
        }
      }
    }
  }

  // 4. URL & Title keyword heuristics
  const title = (tab.title || '').toLowerCase();
  for (const rule of HEURISTIC_RULES) {
    const matchedUrl = rule.urlPatterns.some((rx) => rx.test(rawUrl));
    const matchedTitle = rule.titlePatterns.some((rx) => rx.test(title));
    if (matchedUrl || matchedTitle) {
      const cat = cachedSettings.categories.find((c) => c.id === rule.categoryId);
      if (cat) {
        return { category: cat, matchType: 'heuristic', hostname };
      }
    }
  }

  // 5. Legacy Group Context Hint ('Core' -> Work, 'TimePass' -> Entertainment)
  const legacyHint = normUrl && cachedUrlMetadata[normUrl]?.legacyCategoryHint;
  if (legacyHint) {
    const hintedCat = cachedSettings.categories.find((c) => c.id === legacyHint);
    if (hintedCat) {
      return { category: hintedCat, matchType: 'legacy_hint', hostname };
    }
  }

  // 6. Fallback to Utilities
  const fallback =
    cachedSettings.categories.find((c) => c.id === 'utilities') || cachedSettings.categories[0];
  return {
    category: fallback || ARCHIVE_CATEGORY,
    matchType: 'fallback',
    hostname
  };
}

/**
 * Diff-based, zero-flicker window organization:
 * - Captures legacy 'Core'/'TimePass' group context before dissecting.
 * - Uses Chrome History visit counts + TTL to bucket tabs.
 * - Only calls chrome.tabs.group for tabs not already in their target group (unless forceSort = true).
 * - Preserves manual group collapse state, never collapses the active tab's group, and supports Focus Mode.
 * - Automatically hibernates (chrome.tabs.discard) inactive tabs in Archive to free RAM.
 */
async function organizeWindow(windowId, options = { forceSort: false }) {
  if (!isInitialized) {
    await initializeState();
  }

  const tabs = await chrome.tabs.query({ windowId });
  if (!tabs || tabs.length === 0) return;

  const pinnedTabs = tabs.filter((t) => t.pinned);
  const unpinnedTabs = tabs.filter((t) => !t.pinned);
  if (unpinnedTabs.length === 0) return;

  const existingGroups = await chrome.tabGroups.query({ windowId });

  // Capture 'Core' and 'TimePass' legacy hints before moving tabs out of those groups
  if (captureLegacyGroupHints(unpinnedTabs, existingGroups)) {
    await persistStorage();
  }

  const now = Date.now();

  // Fetch Chrome History visit counts in parallel
  const visitCounts = new Map();
  await Promise.all(
    unpinnedTabs.map(async (tab) => {
      const count = await getHistoryVisitCount(tab.url || tab.pendingUrl || '');
      visitCounts.set(tab.id, count);
    })
  );

  const targetCategoryOrder = [...cachedSettings.categories, ARCHIVE_CATEGORY];
  const buckets = new Map();
  for (const cat of targetCategoryOrder) {
    buckets.set(cat.id, {
      config: cat,
      tabs: []
    });
  }

  for (const tab of unpinnedTabs) {
    const visits = visitCounts.get(tab.id) || 1;
    const { category } = classifyTab(tab, now, visits);
    if (!buckets.has(category.id)) {
      buckets.set(category.id, { config: category, tabs: [] });
    }
    buckets.get(category.id).tabs.push(tab);
  }

  // Sort inside each bucket:
  // - If forceSort (startup or 'Organize Now'): sort by Chrome History Usage Score (highest first)
  // - Otherwise (regular tab switch): keep existing visual tab-strip index so tabs don't jump under the cursor
  for (const bucket of buckets.values()) {
    if (options.forceSort) {
      bucket.tabs.sort((a, b) => {
        const scoreB = computeUsageScore(b, now, visitCounts.get(b.id) || 1);
        const scoreA = computeUsageScore(a, now, visitCounts.get(a.id) || 1);
        return scoreB - scoreA;
      });
    } else {
      bucket.tabs.sort((a, b) => a.index - b.index);
    }
  }

  // Map existing groups by title (if duplicate groups with same title exist, merge into the first)
  const groupsByTitle = new Map();
  for (const g of existingGroups) {
    if (!groupsByTitle.has(g.title)) {
      groupsByTitle.set(g.title, g);
    }
  }

  let nextInsertIndex = pinnedTabs.length;

  for (const cat of targetCategoryOrder) {
    const bucket = buckets.get(cat.id);
    if (!bucket || bucket.tabs.length === 0) continue;

    const allBucketTabIds = bucket.tabs.map((t) => t.id);
    const existingGroup = groupsByTitle.get(cat.name);
    let groupId = existingGroup ? existingGroup.id : undefined;

    try {
      if (options.forceSort || !groupId) {
        // Full grouping pass (creates group or reorders all tabs inside it)
        groupId = await chrome.tabs.group({
          tabIds: allBucketTabIds,
          groupId
        });
      } else {
        // Diff-only pass: only group tabs that aren't already in this target group!
        const tabsNeedingRegroup = bucket.tabs
          .filter((t) => t.groupId !== groupId)
          .map((t) => t.id);

        if (tabsNeedingRegroup.length > 0) {
          groupId = await chrome.tabs.group({
            tabIds: tabsNeedingRegroup,
            groupId
          });
        }
      }

      // Determine desired collapsed state:
      // NEVER collapse a group containing the active tab (prevents Chrome API errors & UX disruption)
      const hasActiveTab = bucket.tabs.some((t) => t.active);
      let desiredCollapsed = false;

      if (hasActiveTab) {
        desiredCollapsed = false;
      } else if (cachedSettings.focusMode) {
        desiredCollapsed = true;
      } else if (cat.id === 'archive') {
        desiredCollapsed = true;
      } else if (existingGroup) {
        // Respect user's manual expand/collapse state on active categories
        desiredCollapsed = Boolean(existingGroup.collapsed);
      } else {
        desiredCollapsed = Boolean(cat.collapsed);
      }

      const desiredColor = cat.color || 'blue';
      const needsMetadataUpdate =
        !existingGroup ||
        existingGroup.title !== cat.name ||
        existingGroup.color !== desiredColor ||
        existingGroup.collapsed !== desiredCollapsed;

      if (needsMetadataUpdate) {
        await chrome.tabGroups.update(groupId, {
          title: cat.name,
          color: desiredColor,
          collapsed: desiredCollapsed
        });
      }

      // Check if group needs to move to maintain left-to-right visual order
      const currentTabsInWindow = await chrome.tabs.query({ windowId, groupId });
      const currentFirstIndex =
        currentTabsInWindow.length > 0
          ? Math.min(...currentTabsInWindow.map((t) => t.index))
          : -1;

      if (options.forceSort || currentFirstIndex !== nextInsertIndex) {
        await chrome.tabGroups.move(groupId, { index: nextInsertIndex });
      }

      nextInsertIndex += allBucketTabIds.length;

      // Auto-Hibernate (chrome.tabs.discard) non-active tabs in Archive to free RAM
      if (cat.id === 'archive' && cachedSettings.autoHibernateArchive !== false) {
        for (const tab of bucket.tabs) {
          if (!tab.active && !tab.discarded && !tab.audible) {
            try {
              await chrome.tabs.discard(tab.id);
            } catch {
              // Ignore if tab cannot be discarded right now
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[TidyTabs] Grouping error for category ${cat.name}:`, err);
    }
  }
}

/**
 * Organize all normal browser windows.
 */
async function organizeAllWindows(options = { forceSort: false }) {
  try {
    const windows = await chrome.windows.getAll({ windowTypes: ['normal'] });
    for (const win of windows) {
      scheduleOrganize(win.id, 100, options);
    }
  } catch (err) {
    console.warn('[TidyTabs] Error organizing all windows:', err);
  }
}

/**
 * Find duplicate unpinned tabs in a window (matching normalized URL).
 * Returns array of duplicate tab IDs to close (keeping active or most recently accessed tab).
 */
function findDuplicateTabIds(unpinnedTabs) {
  const byNormUrl = new Map();
  for (const tab of unpinnedTabs) {
    const rawUrl = tab.url || tab.pendingUrl || '';
    if (!rawUrl || rawUrl.startsWith('chrome://newtab')) continue;
    const norm = normalizeUrl(rawUrl);
    if (!norm) continue;
    if (!byNormUrl.has(norm)) {
      byNormUrl.set(norm, []);
    }
    byNormUrl.get(norm).push(tab);
  }

  const duplicateIds = [];
  for (const group of byNormUrl.values()) {
    if (group.length <= 1) continue;
    // Sort so the tab to KEEP is index 0 (active tab first, else most recently accessed)
    group.sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      const tsB = cachedTimestamps[b.id] || b.lastAccessed || 0;
      const tsA = cachedTimestamps[a.id] || a.lastAccessed || 0;
      return tsB - tsA;
    });
    for (let i = 1; i < group.length; i++) {
      duplicateIds.push(group[i].id);
    }
  }
  return duplicateIds;
}

// ==========================================
// Chrome Event Listeners
// ==========================================

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!isInitialized) await initializeState();
  const now = Date.now();
  cachedTimestamps[activeInfo.tabId] = now;

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    const normUrl = normalizeUrl(tab.url || tab.pendingUrl || '');
    if (normUrl) {
      cachedUrlMetadata[normUrl] = {
        ...(cachedUrlMetadata[normUrl] || {}),
        lastAccessed: now
      };
    }
  } catch {
    // Tab may have closed immediately
  }

  await persistStorage();
  scheduleOrganize(activeInfo.windowId, cachedSettings.debounceMs || 500, { forceSort: false });
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.pinned) return;

  if (changeInfo.status === 'complete' || changeInfo.url) {
    if (!isInitialized) await initializeState();
    const now = Date.now();
    if (!cachedTimestamps[tabId]) {
      cachedTimestamps[tabId] = now;
    }
    const normUrl = normalizeUrl(tab.url || tab.pendingUrl || '');
    if (normUrl) {
      cachedUrlMetadata[normUrl] = {
        ...(cachedUrlMetadata[normUrl] || {}),
        lastAccessed: cachedTimestamps[tabId]
      };
    }
    await persistStorage();
    scheduleOrganize(tab.windowId, cachedSettings.debounceMs || 500, { forceSort: false });
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (cachedTimestamps[tabId]) {
    delete cachedTimestamps[tabId];
    await persistStorage();
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'tidy-tabs-reorganize') {
    organizeAllWindows({ forceSort: false });
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  await initializeState();
  await chrome.alarms.create('tidy-tabs-reorganize', {
    periodInMinutes: 15
  });
  organizeAllWindows({ forceSort: true });
});

chrome.runtime.onStartup.addListener(async () => {
  await initializeState();
  organizeAllWindows({ forceSort: true });
});

// ==========================================
// Popup Dashboard Messaging API
// ==========================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'GET_STATE') {
    (async () => {
      if (!isInitialized) await initializeState();
      const currentWin = await chrome.windows.getCurrent();
      const tabs = await chrome.tabs.query({ windowId: currentWin.id });
      const unpinned = tabs.filter((t) => !t.pinned);

      const counts = { archive: 0 };
      for (const cat of cachedSettings.categories) {
        counts[cat.id] = 0;
      }

      const uncategorizedMap = new Map(); // hostname -> { hostname, count, currentCatId }
      let hibernatedCount = 0;
      const now = Date.now();

      for (const tab of unpinned) {
        if (tab.discarded) hibernatedCount++;
        const visits = await getHistoryVisitCount(tab.url || tab.pendingUrl || '');
        const { category, matchType, hostname } = classifyTab(tab, now, visits);
        counts[category.id] = (counts[category.id] || 0) + 1;

        if (
          hostname &&
          (matchType === 'fallback' || matchType === 'legacy_hint') &&
          !hostname.includes('newtab')
        ) {
          const prev = uncategorizedMap.get(hostname) || {
            hostname,
            count: 0,
            currentCatName: category.name
          };
          prev.count += 1;
          uncategorizedMap.set(hostname, prev);
        }
      }

      const duplicateIds = findDuplicateTabIds(unpinned);
      const uncategorizedDomains = Array.from(uncategorizedMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      sendResponse({
        settings: cachedSettings,
        counts,
        totalTabs: tabs.length,
        unpinnedCount: unpinned.length,
        pinnedCount: tabs.length - unpinned.length,
        hibernatedCount,
        duplicateCount: duplicateIds.length,
        uncategorizedDomains
      });
    })();
    return true;
  }

  if (message.action === 'ORGANIZE_NOW') {
    (async () => {
      if (!isInitialized) await initializeState();
      const currentWin = await chrome.windows.getCurrent();
      await runLocked(currentWin.id, () => organizeWindow(currentWin.id, { forceSort: true }));
      sendResponse({ success: true });
    })();
    return true;
  }

  if (message.action === 'DEDUPLICATE_TABS') {
    (async () => {
      if (!isInitialized) await initializeState();
      const currentWin = await chrome.windows.getCurrent();
      const tabs = await chrome.tabs.query({ windowId: currentWin.id });
      const unpinned = tabs.filter((t) => !t.pinned);
      const duplicateIds = findDuplicateTabIds(unpinned);

      if (duplicateIds.length > 0) {
        await chrome.tabs.remove(duplicateIds);
      }
      await runLocked(currentWin.id, () => organizeWindow(currentWin.id, { forceSort: false }));
      sendResponse({ success: true, closedCount: duplicateIds.length });
    })();
    return true;
  }

  if (message.action === 'PRUNE_ARCHIVE') {
    (async () => {
      if (!isInitialized) await initializeState();
      const currentWin = await chrome.windows.getCurrent();
      const tabs = await chrome.tabs.query({ windowId: currentWin.id });
      const unpinned = tabs.filter((t) => !t.pinned);
      const now = Date.now();
      const archiveTabIds = [];

      for (const tab of unpinned) {
        if (tab.active) continue;
        const visits = await getHistoryVisitCount(tab.url || tab.pendingUrl || '');
        const { category } = classifyTab(tab, now, visits);
        if (category.id === 'archive') {
          archiveTabIds.push(tab.id);
        }
      }

      if (archiveTabIds.length > 0) {
        await chrome.tabs.remove(archiveTabIds);
      }
      sendResponse({ success: true, closedCount: archiveTabIds.length });
    })();
    return true;
  }

  if (message.action === 'UPDATE_SETTINGS') {
    (async () => {
      if (!isInitialized) await initializeState();
      cachedSettings = { ...cachedSettings, ...message.settings };
      await chrome.storage.local.set({ settings: cachedSettings });
      const currentWin = await chrome.windows.getCurrent();
      await runLocked(currentWin.id, () => organizeWindow(currentWin.id, { forceSort: false }));
      sendResponse({ success: true, settings: cachedSettings });
    })();
    return true;
  }

  if (message.action === 'RESET_SETTINGS') {
    (async () => {
      cachedSettings = structuredClone(DEFAULT_SETTINGS);
      await chrome.storage.local.set({ settings: cachedSettings });
      const currentWin = await chrome.windows.getCurrent();
      await runLocked(currentWin.id, () => organizeWindow(currentWin.id, { forceSort: true }));
      sendResponse({ success: true, settings: cachedSettings });
    })();
    return true;
  }
});
