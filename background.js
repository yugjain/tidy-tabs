/**
 * Tidy Tabs v2.2 - Background Service Worker (Manifest V3)
 * Features for ADHD Power Users:
 * - Absolute Audio Protection: Active audio tabs/groups are NEVER collapsed (even in Focus Mode)
 * - Immune to idle Archive demotion & RAM discarding while playing sound
 * - Native Tab Bar Speaker Indicator: '🔊 Entertainment (3)'
 * - Global Keyboard Shortcuts: Cmd+Shift+O (Tidy), Cmd+Shift+F (Focus), Cmd+Shift+S (Stash)
 * - Tab Vault ("Parking Lot"): Zero-guilt stashing of idle tabs with instant 1-click restore
 * - Dynamic domain auto-clustering (>= 2 unassigned tabs spawn dedicated groups, e.g. Airbnb, Figma)
 * - Strict 5-minute periodic auto-sweep with full Usage Score sorting
 * - In-popup Tab Spotlight engine: real-time recency heatmap & audio status
 * - Chrome History visit frequency & composite Usage Score intelligence
 * - Automatic RAM Hibernation (chrome.tabs.discard) for silent Archived tabs
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

const DYNAMIC_PALETTE = ['purple', 'pink', 'cyan', 'orange'];

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
  autoSyncMinutes: 5,
  debounceMs: 500,
  categories: DEFAULT_CATEGORIES
};

// State caches
let cachedTimestamps = {}; // { [tabId]: number }
let cachedUrlMetadata = {}; // { [normalizedUrl]: { lastAccessed: number, legacyCategoryHint?: string } }
let cachedDynamicClusters = {}; // { [domain]: { id: string, name: string, color: string } }
let cachedVaultSessions = []; // Array of stashed sessions
let cachedSettings = { ...DEFAULT_SETTINGS };
let isInitialized = false;

const historyVisitCache = new Map();
const HISTORY_CACHE_TTL_MS = 10 * 60 * 1000;

const windowLocks = new Map();
const debounceTimers = new Map();

export function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return rawUrl.split('#')[0];
    }
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

export function extractCleanDomain(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    const host = u.hostname.toLowerCase().replace(/^www\./, '').split(':')[0];
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.includes('newtab') ||
      !host.includes('.')
    ) {
      return '';
    }
    return host;
  } catch {
    return '';
  }
}

export function formatDomainTitle(domain) {
  if (!domain) return 'Other';
  const parts = domain.split('.');
  let main = parts[0];
  if (parts.length >= 2) {
    main = parts[parts.length - 2];
  }
  return main.charAt(0).toUpperCase() + main.slice(1);
}

export function getDynamicColor(domain) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charCodeAt(i);
    hash |= 0;
  }
  return DYNAMIC_PALETTE[Math.abs(hash) % DYNAMIC_PALETTE.length];
}

export function extractBaseGroupName(rawTitle) {
  if (!rawTitle) return '';
  return rawTitle.replace(/^(?:●|🔊)\s*/u, '').replace(/\s*\(\d+\)$/, '').trim();
}

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

async function persistStorage() {
  try {
    const entries = Object.entries(cachedUrlMetadata);
    if (entries.length > 1500) {
      entries.sort((a, b) => (b[1].lastAccessed || 0) - (a[1].lastAccessed || 0));
      cachedUrlMetadata = Object.fromEntries(entries.slice(0, 1200));
    }
    await chrome.storage.local.set({
      tabTimestamps: cachedTimestamps,
      urlMetadata: cachedUrlMetadata,
      dynamicClusters: cachedDynamicClusters,
      stashedSessions: cachedVaultSessions
    });
  } catch (err) {
    console.warn('[TidyTabs] Storage write error:', err);
  }
}

async function initializeState() {
  const data = await chrome.storage.local.get([
    'tabTimestamps',
    'urlMetadata',
    'dynamicClusters',
    'stashedSessions',
    'settings'
  ]);
  cachedTimestamps = data.tabTimestamps || {};
  cachedUrlMetadata = data.urlMetadata || {};
  cachedDynamicClusters = data.dynamicClusters || {};
  cachedVaultSessions = Array.isArray(data.stashedSessions) ? data.stashedSessions : [];
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

function captureLegacyGroupHints(tabs, existingGroups) {
  const groupTitleById = new Map();
  for (const g of existingGroups) {
    if (g.title) {
      groupTitleById.set(g.id, extractBaseGroupName(g.title));
    }
  }

  let updated = false;
  for (const tab of tabs) {
    if (!tab.groupId || tab.groupId === -1) continue;
    const baseTitle = groupTitleById.get(tab.groupId);
    if (!baseTitle) continue;

    let hint = null;
    if (/^core$/i.test(baseTitle) || /\bcore\b/i.test(baseTitle)) {
      hint = 'work';
    } else if (/time\s*pass/i.test(baseTitle) || /leisure|fun|chill/i.test(baseTitle)) {
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

export function computeUsageScore(tab, now = Date.now(), visitCount = 1) {
  const normUrl = normalizeUrl(tab.url || tab.pendingUrl || '');
  const timestamp =
    cachedTimestamps[tab.id] ||
    (normUrl && cachedUrlMetadata[normUrl]?.lastAccessed) ||
    tab.lastAccessed ||
    now;

  const hoursIdle = Math.max(0, (now - timestamp) / (1000 * 60 * 60));
  const recencyBonus = Math.max(0, 100 - hoursIdle / 2.4);
  const frequencyBonus = Math.min(250, visitCount * 12);
  const activeBonus = tab.active ? 500 : 0;
  const audioBonus = tab.audible ? 400 : 0; // Audio tabs maintain top priority

  return activeBonus + audioBonus + frequencyBonus + recencyBonus;
}

/**
 * Classify a tab into its target category.
 * CRITICAL AUDIO PROTECTION: An audible tab (tab.audible === true) is NEVER archived!
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

  // ABSOLUTE PROTECTION: Never archive active tabs OR audio-playing tabs!
  if (!tab.active && !tab.audible) {
    if (idleMs >= standardTtlMs) {
      return { category: ARCHIVE_CATEGORY, matchType: 'archive', hostname: '', isCandidateForCluster: false };
    }
    if (
      cachedSettings.smartHistoryArchive !== false &&
      idleMs >= clutterTtlMs &&
      visitCount <= clutterMaxVisits
    ) {
      return { category: ARCHIVE_CATEGORY, matchType: 'archive_clutter', hostname: '', isCandidateForCluster: false };
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
      // Internal URL
    }
  }

  if (hostAndPath) {
    for (const cat of cachedSettings.categories) {
      if (Array.isArray(cat.domains)) {
        for (const pattern of cat.domains) {
          const cleanPattern = pattern.trim().toLowerCase();
          if (cleanPattern && hostAndPath.includes(cleanPattern)) {
            return { category: cat, matchType: 'domain_rule', hostname, isCandidateForCluster: false };
          }
        }
      }
    }
  }

  const title = (tab.title || '').toLowerCase();
  for (const rule of HEURISTIC_RULES) {
    const matchedUrl = rule.urlPatterns.some((rx) => rx.test(rawUrl));
    const matchedTitle = rule.titlePatterns.some((rx) => rx.test(title));
    if (matchedUrl || matchedTitle) {
      const cat = cachedSettings.categories.find((c) => c.id === rule.categoryId);
      if (cat) {
        return { category: cat, matchType: 'heuristic', hostname, isCandidateForCluster: false };
      }
    }
  }

  const legacyHint = normUrl && cachedUrlMetadata[normUrl]?.legacyCategoryHint;
  if (legacyHint) {
    const hintedCat = cachedSettings.categories.find((c) => c.id === legacyHint);
    if (hintedCat) {
      return { category: hintedCat, matchType: 'legacy_hint', hostname, isCandidateForCluster: false };
    }
  }

  const cleanDomain = extractCleanDomain(rawUrl);
  const fallback = cachedSettings.categories.find((c) => c.id === 'utilities') || cachedSettings.categories[0];
  return {
    category: fallback || ARCHIVE_CATEGORY,
    matchType: 'fallback',
    hostname: cleanDomain || hostname,
    isCandidateForCluster: Boolean(cleanDomain)
  };
}

/**
 * Diff-based, zero-flicker window organization:
 * - AUDIO PROTECTION: Any group containing tab.audible is NEVER collapsed!
 * - Groups with audio display speaker symbol '🔊 Title (N)'.
 * - Dynamic domain auto-clustering (>= 2 tabs spawn dedicated group).
 * - 5-minute strict Usage-Score re-sorting.
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

  if (captureLegacyGroupHints(unpinnedTabs, existingGroups)) {
    await persistStorage();
  }

  const now = Date.now();

  const visitCounts = new Map();
  await Promise.all(
    unpinnedTabs.map(async (tab) => {
      const count = await getHistoryVisitCount(tab.url || tab.pendingUrl || '');
      visitCounts.set(tab.id, count);
    })
  );

  const preliminaryAssignments = [];
  const candidateDomainCounts = new Map();

  for (const tab of unpinnedTabs) {
    const visits = visitCounts.get(tab.id) || 1;
    const classification = classifyTab(tab, now, visits);
    preliminaryAssignments.push({ tab, classification, visits });

    if (classification.isCandidateForCluster && classification.hostname) {
      const d = classification.hostname;
      candidateDomainCounts.set(d, (candidateDomainCounts.get(d) || 0) + 1);
    }
  }

  let clustersChanged = false;
  const activeWindowClusters = new Map();

  for (const [domain, count] of candidateDomainCounts.entries()) {
    const hasPriorCluster = Boolean(cachedDynamicClusters[domain]);
    if (count >= 2 || (hasPriorCluster && count >= 1)) {
      const clusterConfig = cachedDynamicClusters[domain] || {
        id: `dyn_${domain.replace(/[^a-z0-9]/g, '_')}`,
        name: formatDomainTitle(domain),
        color: getDynamicColor(domain),
        domain,
        isDynamic: true
      };
      if (!cachedDynamicClusters[domain]) {
        cachedDynamicClusters[domain] = clusterConfig;
        clustersChanged = true;
      }
      activeWindowClusters.set(domain, clusterConfig);
    }
  }

  for (const domain of Object.keys(cachedDynamicClusters)) {
    if (!candidateDomainCounts.has(domain) || candidateDomainCounts.get(domain) === 0) {
      delete cachedDynamicClusters[domain];
      clustersChanged = true;
    }
  }

  if (clustersChanged) {
    await persistStorage();
  }

  const corePreCategories = cachedSettings.categories.filter((c) => c.id !== 'utilities');
  const dynamicCategories = Array.from(activeWindowClusters.values()).sort((a, b) => a.name.localeCompare(b.name));
  const utilitiesCategory = cachedSettings.categories.find((c) => c.id === 'utilities') || {
    id: 'utilities',
    name: 'Utilities',
    color: 'yellow'
  };
  const targetCategoryOrder = [
    ...corePreCategories,
    ...dynamicCategories,
    utilitiesCategory,
    ARCHIVE_CATEGORY
  ];

  const buckets = new Map();
  for (const cat of targetCategoryOrder) {
    buckets.set(cat.id, {
      config: cat,
      tabs: []
    });
  }

  for (const item of preliminaryAssignments) {
    const { tab, classification } = item;
    let targetCat = classification.category;

    if (classification.isCandidateForCluster && activeWindowClusters.has(classification.hostname)) {
      targetCat = activeWindowClusters.get(classification.hostname);
    }

    if (!buckets.has(targetCat.id)) {
      buckets.set(targetCat.id, { config: targetCat, tabs: [] });
    }
    buckets.get(targetCat.id).tabs.push(tab);
  }

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

  const groupsByBaseTitle = new Map();
  for (const g of existingGroups) {
    const base = extractBaseGroupName(g.title);
    if (!groupsByBaseTitle.has(base)) {
      groupsByBaseTitle.set(base, g);
    }
  }

  let nextInsertIndex = pinnedTabs.length;

  for (const cat of targetCategoryOrder) {
    const bucket = buckets.get(cat.id);
    if (!bucket || bucket.tabs.length === 0) continue;

    const allBucketTabIds = bucket.tabs.map((t) => t.id);
    const existingGroup = groupsByBaseTitle.get(cat.name);
    let groupId = existingGroup ? existingGroup.id : undefined;

    try {
      if (options.forceSort || !groupId) {
        groupId = await chrome.tabs.group({
          tabIds: allBucketTabIds,
          groupId
        });
      } else {
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

      // ABSOLUTE AUDIO & ACTIVE PROTECTION:
      // Never collapse if viewing the tab OR if playing audio!
      const hasActiveTab = bucket.tabs.some((t) => t.active);
      const hasAudibleTab = bucket.tabs.some((t) => t.audible);
      let desiredCollapsed = false;

      if (hasActiveTab || hasAudibleTab) {
        desiredCollapsed = false; // Strictly expanded!
      } else if (cachedSettings.focusMode) {
        desiredCollapsed = true;
      } else if (cat.id === 'archive') {
        desiredCollapsed = true;
      } else if (existingGroup) {
        desiredCollapsed = Boolean(existingGroup.collapsed);
      } else {
        desiredCollapsed = Boolean(cat.collapsed);
      }

      // Title formatting: Speaker symbol has highest visual urgency
      const titlePrefix = hasAudibleTab ? '🔊 ' : (hasActiveTab ? '● ' : '');
      const dynamicTitle = `${titlePrefix}${cat.name} (${bucket.tabs.length})`;
      const desiredColor = cat.color || 'blue';

      const needsMetadataUpdate =
        !existingGroup ||
        existingGroup.title !== dynamicTitle ||
        existingGroup.color !== desiredColor ||
        existingGroup.collapsed !== desiredCollapsed;

      if (needsMetadataUpdate) {
        await chrome.tabGroups.update(groupId, {
          title: dynamicTitle,
          color: desiredColor,
          collapsed: desiredCollapsed
        });
      }

      const currentTabsInWindow = await chrome.tabs.query({ windowId, groupId });
      const currentFirstIndex =
        currentTabsInWindow.length > 0
          ? Math.min(...currentTabsInWindow.map((t) => t.index))
          : -1;

      if (options.forceSort || currentFirstIndex !== nextInsertIndex) {
        await chrome.tabGroups.move(groupId, { index: nextInsertIndex });
      }

      nextInsertIndex += allBucketTabIds.length;

      // Auto-Hibernate silent tabs in Archive
      if (cat.id === 'archive' && cachedSettings.autoHibernateArchive !== false) {
        for (const tab of bucket.tabs) {
          if (!tab.active && !tab.discarded && !tab.audible) {
            try {
              await chrome.tabs.discard(tab.id);
            } catch {
              // Ignore
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[TidyTabs] Grouping error for category ${cat.name}:`, err);
    }
  }
}

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

/**
 * Tab Vault Stashing Engine:
 * Saves specified tabs into a named, timestamped session and closes them in the browser.
 */
async function stashTabsList(tabsToStash, customSessionName = null) {
  if (!tabsToStash || tabsToStash.length === 0) return null;

  const now = Date.now();
  const dateStr = new Date(now).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const session = {
    id: `vault_${now}_${Math.random().toString(36).slice(2, 7)}`,
    name: customSessionName || `Stashed Session (${dateStr})`,
    timestamp: now,
    tabCount: tabsToStash.length,
    tabs: tabsToStash.map((t) => ({
      title: t.title || 'Untitled',
      url: t.url || '',
      favIconUrl: t.favIconUrl || ''
    }))
  };

  cachedVaultSessions.unshift(session);
  if (cachedVaultSessions.length > 60) {
    cachedVaultSessions = cachedVaultSessions.slice(0, 60);
  }

  await persistStorage();

  const idsToClose = tabsToStash.map((t) => t.id).filter(Boolean);
  if (idsToClose.length > 0) {
    try {
      await chrome.tabs.remove(idsToClose);
    } catch (err) {
      console.warn('[TidyTabs] Error closing stashed tabs:', err);
    }
  }

  return session;
}

/**
 * Stash inactive tabs (Archive or idle > 24h) for a window.
 */
async function stashInactiveTabsForWindow(windowId) {
  const tabs = await chrome.tabs.query({ windowId });
  const unpinned = tabs.filter((t) => !t.pinned && !t.active && !t.audible);

  const now = Date.now();
  const eligible = [];
  for (const tab of unpinned) {
    const visits = await getHistoryVisitCount(tab.url || tab.pendingUrl || '');
    const { category } = classifyTab(tab, now, visits);
    const ts = cachedTimestamps[tab.id] || tab.lastAccessed || now;
    const idleHours = (now - ts) / 3600000;

    if (category.id === 'archive' || idleHours >= 24) {
      eligible.push(tab);
    }
  }

  if (eligible.length > 0) {
    const session = await stashTabsList(eligible);
    await runLocked(windowId, () => organizeWindow(windowId, { forceSort: false }));
    return session;
  }
  return null;
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
    // Tab closed
  }

  await persistStorage();
  scheduleOrganize(activeInfo.windowId, cachedSettings.debounceMs || 500, { forceSort: false });
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.pinned) return;

  // Immediate reaction if audio starts/stops or mutes
  if (changeInfo.audible !== undefined || changeInfo.mutedInfo !== undefined) {
    if (!isInitialized) await initializeState();
    scheduleOrganize(tab.windowId, 50, { forceSort: false });
    return;
  }

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

// Periodic 5-minute alarm: Strict full Usage-Score sorting and clustering
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'tidy-tabs-reorganize') {
    organizeAllWindows({ forceSort: true });
  }
});

// Global Keyboard Accelerators
chrome.commands.onCommand.addListener(async (command) => {
  if (!isInitialized) await initializeState();
  const currentWin = await chrome.windows.getCurrent();
  if (!currentWin) return;

  if (command === 'organize_tabs') {
    await runLocked(currentWin.id, () => organizeWindow(currentWin.id, { forceSort: true }));
  } else if (command === 'toggle_focus') {
    cachedSettings.focusMode = !cachedSettings.focusMode;
    await chrome.storage.local.set({ settings: cachedSettings });
    await runLocked(currentWin.id, () => organizeWindow(currentWin.id, { forceSort: false }));
  } else if (command === 'stash_inactive') {
    await stashInactiveTabsForWindow(currentWin.id);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  await initializeState();
  await chrome.alarms.create('tidy-tabs-reorganize', {
    periodInMinutes: 5
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
      for (const dyn of Object.values(cachedDynamicClusters)) {
        counts[dyn.id] = 0;
      }

      const uncategorizedMap = new Map();
      const spotlightTabs = [];
      const audibleTabs = [];
      let hibernatedCount = 0;
      const now = Date.now();

      for (const tab of unpinned) {
        if (tab.discarded) hibernatedCount++;
        const visits = await getHistoryVisitCount(tab.url || tab.pendingUrl || '');
        const classification = classifyTab(tab, now, visits);

        let finalCategory = classification.category;
        if (classification.isCandidateForCluster && cachedDynamicClusters[classification.hostname]) {
          finalCategory = cachedDynamicClusters[classification.hostname];
        }

        counts[finalCategory.id] = (counts[finalCategory.id] || 0) + 1;

        if (
          classification.hostname &&
          (classification.matchType === 'fallback' || classification.matchType === 'legacy_hint') &&
          !classification.hostname.includes('newtab') &&
          !cachedDynamicClusters[classification.hostname]
        ) {
          const prev = uncategorizedMap.get(classification.hostname) || {
            hostname: classification.hostname,
            count: 0,
            currentCatName: finalCategory.name
          };
          prev.count += 1;
          uncategorizedMap.set(classification.hostname, prev);
        }

        // Recency heatmap determination
        const ts = cachedTimestamps[tab.id] || tab.lastAccessed || now;
        const idleHours = (now - ts) / 3600000;
        let recencyStatus = 'recent';
        let recencyLabel = `${Math.max(1, Math.round(idleHours))}h ago`;

        if (tab.audible) {
          recencyStatus = 'audible';
          recencyLabel = 'Playing Audio';
          audibleTabs.push({
            id: tab.id,
            title: tab.title || 'Audio Stream',
            url: tab.url || '',
            favIconUrl: tab.favIconUrl || '',
            muted: Boolean(tab.mutedInfo?.muted)
          });
        } else if (tab.active) {
          recencyStatus = 'active';
          recencyLabel = 'Active Now';
        } else if (tab.discarded) {
          recencyStatus = 'sleeping';
          recencyLabel = 'Sleeping';
        } else if (idleHours < 1) {
          recencyStatus = 'fresh';
          recencyLabel = 'Fresh (<1h)';
        } else if (idleHours > 48) {
          recencyStatus = 'idle';
          recencyLabel = `${Math.round(idleHours / 24)}d idle`;
        }

        spotlightTabs.push({
          id: tab.id,
          title: tab.title || 'New Tab',
          url: tab.url || '',
          favIconUrl: tab.favIconUrl || '',
          active: Boolean(tab.active),
          audible: Boolean(tab.audible),
          muted: Boolean(tab.mutedInfo?.muted),
          discarded: Boolean(tab.discarded),
          categoryName: finalCategory.name,
          categoryColor: finalCategory.color || 'blue',
          recencyStatus,
          recencyLabel,
          usageScore: computeUsageScore(tab, now, visits)
        });
      }

      spotlightTabs.sort((a, b) => {
        if (a.audible !== b.audible) return a.audible ? -1 : 1;
        if (a.active !== b.active) return a.active ? -1 : 1;
        return b.usageScore - a.usageScore;
      });

      const duplicateIds = findDuplicateTabIds(unpinned);
      const uncategorizedDomains = Array.from(uncategorizedMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      const dynamicCategoriesList = Object.values(cachedDynamicClusters);

      sendResponse({
        settings: cachedSettings,
        counts,
        totalTabs: tabs.length,
        unpinnedCount: unpinned.length,
        pinnedCount: tabs.length - unpinned.length,
        hibernatedCount,
        duplicateCount: duplicateIds.length,
        uncategorizedDomains,
        dynamicCategories: dynamicCategoriesList,
        spotlightTabs,
        audibleTabs,
        vaultSessionsCount: cachedVaultSessions.length
      });
    })();
    return true;
  }

  if (message.action === 'SWITCH_TO_TAB') {
    (async () => {
      const tabId = Number(message.tabId);
      if (tabId) {
        const tab = await chrome.tabs.get(tabId);
        await chrome.tabs.update(tabId, { active: true });
        await chrome.windows.update(tab.windowId, { focused: true });
      }
      sendResponse({ success: true });
    })();
    return true;
  }

  if (message.action === 'CLOSE_TAB') {
    (async () => {
      const tabId = Number(message.tabId);
      if (tabId) {
        await chrome.tabs.remove(tabId);
      }
      sendResponse({ success: true });
    })();
    return true;
  }

  if (message.action === 'TOGGLE_MUTE_TAB') {
    (async () => {
      const tabId = Number(message.tabId);
      if (tabId) {
        const tab = await chrome.tabs.get(tabId);
        const shouldMute = !tab.mutedInfo?.muted;
        await chrome.tabs.update(tabId, { muted: shouldMute });
        sendResponse({ success: true, muted: shouldMute });
        return;
      }
      sendResponse({ success: false });
    })();
    return true;
  }

  if (message.action === 'STASH_INACTIVE_TABS') {
    (async () => {
      if (!isInitialized) await initializeState();
      const currentWin = await chrome.windows.getCurrent();
      const session = await stashInactiveTabsForWindow(currentWin.id);
      sendResponse({ success: true, session });
    })();
    return true;
  }

  if (message.action === 'GET_VAULT_SESSIONS') {
    (async () => {
      if (!isInitialized) await initializeState();
      sendResponse({ sessions: cachedVaultSessions });
    })();
    return true;
  }

  if (message.action === 'RESTORE_VAULT_SESSION') {
    (async () => {
      if (!isInitialized) await initializeState();
      const session = cachedVaultSessions.find((s) => s.id === message.sessionId);
      if (!session || !session.tabs || session.tabs.length === 0) {
        sendResponse({ success: false });
        return;
      }

      const currentWin = await chrome.windows.getCurrent();
      const createdTabIds = [];

      for (const tabData of session.tabs) {
        if (tabData.url) {
          const newTab = await chrome.tabs.create({
            windowId: currentWin.id,
            url: tabData.url,
            active: false
          });
          createdTabIds.push(newTab.id);
        }
      }

      if (createdTabIds.length > 0) {
        const groupId = await chrome.tabs.group({ tabIds: createdTabIds });
        await chrome.tabGroups.update(groupId, {
          title: session.name.replace(/\s*\([^)]*\)$/, ''),
          color: 'cyan'
        });
      }

      // Optionally delete session if requested
      if (message.deleteAfterRestore) {
        cachedVaultSessions = cachedVaultSessions.filter((s) => s.id !== message.sessionId);
        await persistStorage();
      }

      sendResponse({ success: true, restoredCount: createdTabIds.length });
    })();
    return true;
  }

  if (message.action === 'DELETE_VAULT_SESSION') {
    (async () => {
      if (!isInitialized) await initializeState();
      cachedVaultSessions = cachedVaultSessions.filter((s) => s.id !== message.sessionId);
      await persistStorage();
      sendResponse({ success: true });
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
        if (tab.active || tab.audible) continue; // NEVER close audio tabs!
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
      cachedDynamicClusters = {};
      await chrome.storage.local.set({ settings: cachedSettings, dynamicClusters: {} });
      const currentWin = await chrome.windows.getCurrent();
      await runLocked(currentWin.id, () => organizeWindow(currentWin.id, { forceSort: true }));
      sendResponse({ success: true, settings: cachedSettings });
    })();
    return true;
  }
});
