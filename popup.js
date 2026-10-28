/**
 * Tidy Tabs 2.2 - ADHD Power User Popup Controller
 * Features:
 * - Now-Playing Audio Bar with 1-click mute and jump
 * - ADHD Overload Shield Banner (stash idle tabs when overwhelmed)
 * - Tab Vault ("Parking Lot") session storage and 1-click restoration
 * - Keyboard-driven Spotlight navigation (↑/↓ to cycle, Enter to jump, ⌫ to close)
 * - Proportional Segmented Tab Strip & Domain Rule Management
 */

let currentSettings = null;
let activeCategoryKey = 'work';
let allSpotlightTabs = [];
let allDynamicCategories = [];
let currentAudibleTab = null;
let selectedSpotlightIndex = -1;

// DOM Elements
const statTotalSummary = document.getElementById('stat-total-summary');
const statPinnedInfo = document.getElementById('stat-pinned-info');
const statHibernatedBadge = document.getElementById('stat-hibernated-badge');
const segmentedBar = document.getElementById('segmented-bar');
const ratioLegend = document.getElementById('ratio-legend');

// Audio Bar
const audioBar = document.getElementById('audio-bar');
const audioTabTitle = document.getElementById('audio-tab-title');
const btnAudioMute = document.getElementById('btn-audio-mute');
const audioMuteLabel = document.getElementById('audio-mute-label');
const btnAudioJump = document.getElementById('btn-audio-jump');

// Overload Banner
const overloadBanner = document.getElementById('overload-banner');
const overloadMsg = document.getElementById('overload-msg');
const btnOverloadStash = document.getElementById('btn-overload-stash');

// Action Dock
const btnOrganize = document.getElementById('btn-organize');
const labelOrganize = document.getElementById('label-organize');
const btnDedupe = document.getElementById('btn-dedupe');
const badgeDuplicates = document.getElementById('badge-duplicates');
const btnToggleVault = document.getElementById('btn-toggle-vault');
const badgeVault = document.getElementById('badge-vault');

// Tab Vault Drawer
const vaultDrawer = document.getElementById('vault-drawer');
const vaultSessionsList = document.getElementById('vault-sessions-list');
const btnStashNow = document.getElementById('btn-stash-now');

// Tab Spotlight
const spotlightSearch = document.getElementById('spotlight-search');
const spotlightList = document.getElementById('spotlight-list');

// Groups & Categories
const groupBreakdown = document.getElementById('group-breakdown');
const uncategorizedSection = document.getElementById('uncategorized-section');
const uncategorizedList = document.getElementById('uncategorized-list');

// Toggles & Controls
const toggleFocusMode = document.getElementById('toggle-focus-mode');
const toggleSmartHistory = document.getElementById('toggle-smart-history');
const graceSlider = document.getElementById('grace-slider');
const graceDisplay = document.getElementById('grace-display');
const ttlSlider = document.getElementById('ttl-slider');
const ttlDisplay = document.getElementById('ttl-display');

const categorySelector = document.getElementById('category-selector');
const domainTags = document.getElementById('domain-tags');
const addDomainForm = document.getElementById('add-domain-form');
const inputDomain = document.getElementById('input-domain');
const btnReset = document.getElementById('btn-reset');
const toastMessage = document.getElementById('toast-message');

let toastTimer = null;

function showToast(text) {
  if (!toastMessage) return;
  toastMessage.textContent = text;
  toastMessage.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.classList.remove('show');
  }, 2200);
}

/**
 * Fetch and render current extension state, tab spotlight, and metrics.
 */
async function loadState() {
  try {
    const res = await chrome.runtime.sendMessage({ action: 'GET_STATE' });
    if (!res) return;

    currentSettings = res.settings;
    allSpotlightTabs = res.spotlightTabs || [];
    allDynamicCategories = res.dynamicCategories || [];

    const totalTabs = res.totalTabs || 0;
    const unpinnedCount = res.unpinnedCount || 0;
    const pinnedCount = res.pinnedCount || 0;
    const hibernatedCount = res.hibernatedCount || 0;

    statTotalSummary.textContent = `${totalTabs} ${totalTabs === 1 ? 'Tab' : 'Tabs'}`;
    statPinnedInfo.textContent = `${pinnedCount} Pinned (Ignored)`;
    statHibernatedBadge.textContent = `${hibernatedCount} sleeping`;

    // 1. Now-Playing Audio Bar
    const audibleTabs = res.audibleTabs || [];
    if (audibleTabs.length > 0) {
      currentAudibleTab = audibleTabs[0];
      audioTabTitle.textContent = currentAudibleTab.title;
      audioMuteLabel.textContent = currentAudibleTab.muted ? 'Unmute' : 'Mute';
      audioBar.style.display = 'flex';
    } else {
      currentAudibleTab = null;
      audioBar.style.display = 'none';
    }

    // 2. ADHD Overload Banner (Suggest stashing when tabs > 25)
    if (unpinnedCount > 25) {
      overloadMsg.textContent = `${unpinnedCount} tabs open — feeling crowded?`;
      overloadBanner.style.display = 'flex';
    } else {
      overloadBanner.style.display = 'none';
    }

    // 3. Action Dock & Vault Badge
    const dupCount = res.duplicateCount || 0;
    badgeDuplicates.textContent = dupCount;
    btnDedupe.disabled = dupCount === 0;

    const vaultCount = res.vaultSessionsCount || 0;
    badgeVault.textContent = vaultCount;

    // 4. Combined Categories
    const activeCategories = [
      ...res.settings.categories.filter((c) => c.id !== 'utilities'),
      ...allDynamicCategories,
      res.settings.categories.find((c) => c.id === 'utilities') || { id: 'utilities', name: 'Utilities', color: 'yellow' },
      { id: 'archive', name: 'Archive', color: 'grey' }
    ];

    renderProportionalBar(res.counts, activeCategories, unpinnedCount);
    renderGroupRows(res.counts, activeCategories);
    renderSpotlightList(spotlightSearch.value);
    renderUncategorizedDomains(res.uncategorizedDomains || []);

    // 5. Toggles & TTL Slider
    toggleFocusMode.checked = Boolean(currentSettings.focusMode);
    toggleSmartHistory.checked = currentSettings.smartHistoryArchive !== false;

    if (graceSlider && graceDisplay) {
      const graceMin = currentSettings.gracePeriodMinutes || 4;
      graceSlider.value = graceMin;
      graceDisplay.textContent = `${graceMin} ${graceMin === 1 ? 'Min' : 'Mins'}`;
    }

    if (currentSettings.ttlDays) {
      ttlSlider.value = currentSettings.ttlDays;
      ttlDisplay.textContent = `${currentSettings.ttlDays} Days`;
    }

    renderDomainChips();

    // If Vault drawer is open, refresh sessions
    if (vaultDrawer.style.display === 'flex') {
      await loadVaultSessions();
    }
  } catch (err) {
    console.error('Failed to load state from background:', err);
  }
}

/**
 * Render Proportional Segmented Tab Strip.
 */
function renderProportionalBar(counts = {}, categories = [], totalUnpinned = 0) {
  segmentedBar.innerHTML = '';
  ratioLegend.innerHTML = '';

  if (totalUnpinned === 0) {
    const emptySeg = document.createElement('div');
    emptySeg.className = 'bar-segment';
    emptySeg.style.width = '100%';
    emptySeg.style.backgroundColor = 'var(--bg-subtle)';
    segmentedBar.appendChild(emptySeg);
    return;
  }

  for (const cat of categories) {
    const count = counts[cat.id] || 0;
    if (count === 0) continue;

    const pct = ((count / totalUnpinned) * 100).toFixed(1);

    const seg = document.createElement('div');
    seg.className = `bar-segment seg-${cat.color || cat.id}`;
    seg.style.width = `${pct}%`;
    seg.title = `${cat.name}: ${count} tabs (${pct}%)`;
    segmentedBar.appendChild(seg);

    const chip = document.createElement('div');
    chip.className = 'legend-chip';

    const dot = document.createElement('span');
    dot.className = `chip-dot dot-${cat.color || cat.id}`;

    const text = document.createElement('span');
    text.textContent = `${cat.name} (${count})`;

    chip.appendChild(dot);
    chip.appendChild(text);
    ratioLegend.appendChild(chip);
  }
}

/**
 * Render group items in the main window breakdown.
 */
function renderGroupRows(counts = {}, categories = []) {
  groupBreakdown.innerHTML = '';

  for (const cat of categories) {
    const count = counts[cat.id] || 0;
    const row = document.createElement('div');
    row.className = 'group-row';

    const left = document.createElement('div');
    left.className = 'group-left';

    const bar = document.createElement('span');
    bar.className = `group-bar-indicator bar-${cat.color || cat.id}`;

    const name = document.createElement('span');
    name.className = 'group-name';
    name.textContent = cat.name;

    left.appendChild(bar);
    left.appendChild(name);

    const badge = document.createElement('span');
    badge.className = 'group-meta-pill';
    badge.textContent = `${count} ${count === 1 ? 'tab' : 'tabs'}`;

    row.appendChild(left);
    row.appendChild(badge);
    groupBreakdown.appendChild(row);
  }
}

/**
 * Render Tab Spotlight with Keyboard Navigation Support.
 */
function renderSpotlightList(query = '') {
  spotlightList.innerHTML = '';
  const cleanQ = (query || '').trim().toLowerCase();

  const filtered = cleanQ
    ? allSpotlightTabs.filter(
        (t) =>
          t.title.toLowerCase().includes(cleanQ) ||
          t.url.toLowerCase().includes(cleanQ) ||
          t.categoryName.toLowerCase().includes(cleanQ)
      )
    : allSpotlightTabs;

  if (filtered.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.style.padding = '10px';
    emptyMsg.style.textAlign = 'center';
    emptyMsg.style.fontSize = '11px';
    emptyMsg.style.color = 'var(--text-muted)';
    emptyMsg.textContent = cleanQ ? 'No matching tabs found.' : 'No open tabs.';
    spotlightList.appendChild(emptyMsg);
    selectedSpotlightIndex = -1;
    return;
  }

  // Ensure index stays in bounds
  if (selectedSpotlightIndex >= filtered.length) {
    selectedSpotlightIndex = filtered.length - 1;
  }

  filtered.forEach((tab, index) => {
    const item = document.createElement('div');
    item.className = 'spotlight-item';
    if (index === selectedSpotlightIndex) {
      item.classList.add('keyboard-selected');
    }
    item.title = `Jump to: ${tab.title}\n(${tab.url})`;

    const left = document.createElement('div');
    left.className = 'spotlight-left';

    if (tab.favIconUrl && tab.favIconUrl.startsWith('http')) {
      const img = document.createElement('img');
      img.className = 'spotlight-fav';
      img.src = tab.favIconUrl;
      img.onerror = () => {
        img.replaceWith(createFallbackIcon(tab.title));
      };
      left.appendChild(img);
    } else {
      left.appendChild(createFallbackIcon(tab.title));
    }

    const textBox = document.createElement('div');
    textBox.className = 'spotlight-text-box';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'spotlight-tab-title';
    titleSpan.textContent = tab.title;

    textBox.appendChild(titleSpan);
    left.appendChild(textBox);

    const badgesBox = document.createElement('div');
    badgesBox.className = 'spotlight-badges-box';

    const catBadge = document.createElement('span');
    catBadge.className = 'badge-cat-tag';
    catBadge.textContent = tab.categoryName;

    const recBadge = document.createElement('span');
    recBadge.className = `badge-recency badge-recency-${tab.recencyStatus}`;
    recBadge.textContent = tab.recencyLabel;

    const closeBtn = document.createElement('span');
    closeBtn.className = 'spotlight-close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.title = 'Close this tab';
    closeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await chrome.runtime.sendMessage({ action: 'CLOSE_TAB', tabId: tab.id });
      await loadState();
      showToast('Closed tab');
    });

    badgesBox.appendChild(catBadge);
    badgesBox.appendChild(recBadge);
    badgesBox.appendChild(closeBtn);

    item.appendChild(left);
    item.appendChild(badgesBox);

    item.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({
        action: 'SWITCH_TO_TAB',
        tabId: tab.id
      });
      window.close();
    });

    spotlightList.appendChild(item);
  });
}

function createFallbackIcon(title) {
  const box = document.createElement('span');
  box.className = 'spotlight-fav-fallback';
  box.textContent = (title || 'T').charAt(0).toUpperCase();
  return box;
}

/**
 * Load and render saved Tab Vault sessions.
 */
async function loadVaultSessions() {
  try {
    const res = await chrome.runtime.sendMessage({ action: 'GET_VAULT_SESSIONS' });
    const sessions = res?.sessions || [];
    vaultSessionsList.innerHTML = '';

    if (sessions.length === 0) {
      vaultSessionsList.innerHTML = '<span style="color: var(--text-muted); font-size: 11px; padding: 6px;">Vault is empty. Click "+ Stash Idle Tabs" to park tabs safely!</span>';
      return;
    }

    sessions.forEach((s) => {
      const card = document.createElement('div');
      card.className = 'vault-session-card';

      const info = document.createElement('div');
      info.className = 'vault-session-info';

      const name = document.createElement('span');
      name.className = 'vault-session-name';
      name.textContent = s.name;

      const meta = document.createElement('span');
      meta.className = 'vault-session-meta';
      meta.textContent = `${s.tabCount} tabs saved`;

      info.appendChild(name);
      info.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'vault-session-actions';

      const restoreBtn = document.createElement('button');
      restoreBtn.className = 'btn-vault-restore';
      restoreBtn.textContent = 'Restore';
      restoreBtn.title = 'Reopen all tabs from this session in a new group';
      restoreBtn.addEventListener('click', async () => {
        const rRes = await chrome.runtime.sendMessage({
          action: 'RESTORE_VAULT_SESSION',
          sessionId: s.id,
          deleteAfterRestore: false
        });
        await loadState();
        showToast(`Restored ${rRes?.restoredCount || 0} tabs!`);
      });

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-vault-del';
      delBtn.innerHTML = '&times;';
      delBtn.title = 'Delete saved session';
      delBtn.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({
          action: 'DELETE_VAULT_SESSION',
          sessionId: s.id
        });
        await loadVaultSessions();
        showToast('Deleted vault session');
      });

      actions.appendChild(restoreBtn);
      actions.appendChild(delBtn);

      card.appendChild(info);
      card.appendChild(actions);
      vaultSessionsList.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load vault sessions:', err);
  }
}

/**
 * Render 1-click domain classification cards for unrecognized open domains.
 */
function renderUncategorizedDomains(domains = []) {
  uncategorizedList.innerHTML = '';
  if (!domains || domains.length === 0) {
    uncategorizedSection.style.display = 'none';
    return;
  }

  uncategorizedSection.style.display = 'flex';
  const categoryPills = [
    { id: 'work', label: '+Work' },
    { id: 'entertainment', label: '+Ent' },
    { id: 'research', label: '+Res' },
    { id: 'utilities', label: '+Util' }
  ];

  for (const item of domains) {
    const card = document.createElement('div');
    card.className = 'uncat-card';

    const host = document.createElement('span');
    host.className = 'uncat-hostname';
    host.textContent = `${item.hostname} (${item.count})`;
    host.title = `${item.hostname} is currently routed to ${item.currentCatName}`;

    const pillsWrap = document.createElement('div');
    pillsWrap.className = 'uncat-pills-wrap';

    for (const p of categoryPills) {
      const btn = document.createElement('button');
      btn.className = 'btn-pill-cat';
      btn.textContent = p.label;
      btn.title = `Always assign ${item.hostname} to ${p.id}`;
      btn.addEventListener('click', async () => {
        await assignDomainToCategory(item.hostname, p.id);
        showToast(`Assigned ${item.hostname} to ${p.id}`);
      });
      pillsWrap.appendChild(btn);
    }

    card.appendChild(host);
    card.appendChild(pillsWrap);
    uncategorizedList.appendChild(card);
  }
}

async function assignDomainToCategory(domainStr, categoryId) {
  if (!currentSettings) return;
  const clean = domainStr.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  if (!clean) return;

  for (const cat of currentSettings.categories) {
    if (Array.isArray(cat.domains)) {
      cat.domains = cat.domains.filter((d) => d !== clean);
    }
  }

  const targetCat = currentSettings.categories.find((c) => c.id === categoryId);
  if (targetCat) {
    if (!targetCat.domains) targetCat.domains = [];
    targetCat.domains.push(clean);
    await saveSettings();
    await loadState();
  }
}

function renderDomainChips() {
  domainTags.innerHTML = '';
  if (!currentSettings || !currentSettings.categories) return;

  const cat = currentSettings.categories.find((c) => c.id === activeCategoryKey);
  if (!cat || !cat.domains || cat.domains.length === 0) {
    domainTags.innerHTML = '<span style="color: var(--text-muted); font-size: 11px; padding: 4px;">No custom rules set.</span>';
    return;
  }

  cat.domains.forEach((dom) => {
    const chip = document.createElement('span');
    chip.className = 'domain-chip';

    const text = document.createElement('span');
    text.textContent = dom;

    const removeBtn = document.createElement('span');
    removeBtn.className = 'chip-remove';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = `Remove ${dom}`;
    removeBtn.addEventListener('click', () => removeDomain(dom));

    chip.appendChild(text);
    chip.appendChild(removeBtn);
    domainTags.appendChild(chip);
  });
}

async function removeDomain(domainStr) {
  if (!currentSettings) return;
  const cat = currentSettings.categories.find((c) => c.id === activeCategoryKey);
  if (cat && cat.domains) {
    cat.domains = cat.domains.filter((d) => d !== domainStr);
    await saveSettings();
    await loadState();
    showToast(`Removed ${domainStr}`);
  }
}

async function saveSettings() {
  try {
    const res = await chrome.runtime.sendMessage({
      action: 'UPDATE_SETTINGS',
      settings: currentSettings
    });
    if (res && res.settings) {
      currentSettings = res.settings;
    }
  } catch (err) {
    console.error('Failed to update settings:', err);
  }
}

// ==========================================
// Event Listeners & Keyboard Accelerators
// ==========================================

// Keyboard navigation in Tab Spotlight (↑, ↓, Enter, ⌫)
window.addEventListener('keydown', async (e) => {
  const cleanQ = (spotlightSearch.value || '').trim().toLowerCase();
  const filtered = cleanQ
    ? allSpotlightTabs.filter(
        (t) =>
          t.title.toLowerCase().includes(cleanQ) ||
          t.url.toLowerCase().includes(cleanQ) ||
          t.categoryName.toLowerCase().includes(cleanQ)
      )
    : allSpotlightTabs;

  if (filtered.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedSpotlightIndex = (selectedSpotlightIndex + 1) % filtered.length;
    renderSpotlightList(spotlightSearch.value);
    const selectedEl = spotlightList.children[selectedSpotlightIndex];
    if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedSpotlightIndex = (selectedSpotlightIndex - 1 + filtered.length) % filtered.length;
    renderSpotlightList(spotlightSearch.value);
    const selectedEl = spotlightList.children[selectedSpotlightIndex];
    if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    const targetTab = filtered[selectedSpotlightIndex >= 0 ? selectedSpotlightIndex : 0];
    if (targetTab) {
      await chrome.runtime.sendMessage({ action: 'SWITCH_TO_TAB', tabId: targetTab.id });
      window.close();
    }
  } else if ((e.key === 'Backspace' || e.key === 'Delete') && (e.metaKey || document.activeElement !== spotlightSearch)) {
    if (selectedSpotlightIndex >= 0 && selectedSpotlightIndex < filtered.length) {
      e.preventDefault();
      const tabToClose = filtered[selectedSpotlightIndex];
      await chrome.runtime.sendMessage({ action: 'CLOSE_TAB', tabId: tabToClose.id });
      await loadState();
      showToast('Closed tab');
    }
  }
});

// Search in Tab Spotlight
spotlightSearch.addEventListener('input', (e) => {
  selectedSpotlightIndex = -1;
  renderSpotlightList(e.target.value);
});

// Audio Bar Actions
btnAudioMute.addEventListener('click', async () => {
  if (!currentAudibleTab) return;
  const res = await chrome.runtime.sendMessage({
    action: 'TOGGLE_MUTE_TAB',
    tabId: currentAudibleTab.id
  });
  if (res?.success) {
    audioMuteLabel.textContent = res.muted ? 'Unmute' : 'Mute';
    showToast(res.muted ? 'Muted audio tab' : 'Unmuted audio tab');
  }
});

btnAudioJump.addEventListener('click', async () => {
  if (!currentAudibleTab) return;
  await chrome.runtime.sendMessage({
    action: 'SWITCH_TO_TAB',
    tabId: currentAudibleTab.id
  });
  window.close();
});

// Overload Banner Action
btnOverloadStash.addEventListener('click', async () => {
  btnOverloadStash.disabled = true;
  try {
    const res = await chrome.runtime.sendMessage({ action: 'STASH_INACTIVE_TABS' });
    await loadState();
    showToast(`Parked ${res?.session?.tabCount || 0} tabs in the Vault!`);
  } finally {
    btnOverloadStash.disabled = false;
  }
});

// Vault Drawer Toggle
btnToggleVault.addEventListener('click', async () => {
  const isHidden = vaultDrawer.style.display === 'none';
  vaultDrawer.style.display = isHidden ? 'flex' : 'none';
  if (isHidden) {
    await loadVaultSessions();
  }
});

// Stash Now button in Vault drawer
btnStashNow.addEventListener('click', async () => {
  btnStashNow.disabled = true;
  try {
    const res = await chrome.runtime.sendMessage({ action: 'STASH_INACTIVE_TABS' });
    await loadState();
    await loadVaultSessions();
    showToast(`Parked ${res?.session?.tabCount || 0} tabs in the Vault!`);
  } finally {
    btnStashNow.disabled = false;
  }
});

// Organize Now button
btnOrganize.addEventListener('click', async () => {
  btnOrganize.disabled = true;
  labelOrganize.textContent = 'Sorting...';
  try {
    await chrome.runtime.sendMessage({ action: 'ORGANIZE_NOW' });
    await loadState();
    showToast('Sorted tabs by Usage Score');
  } finally {
    labelOrganize.textContent = 'Organize';
    btnOrganize.disabled = false;
  }
});

// Close Duplicates button
btnDedupe.addEventListener('click', async () => {
  btnDedupe.disabled = true;
  try {
    const res = await chrome.runtime.sendMessage({ action: 'DEDUPLICATE_TABS' });
    await loadState();
    showToast(`Closed ${res?.closedCount || 0} duplicate tab(s)`);
  } finally {
    btnDedupe.disabled = false;
  }
});

// Focus Mode toggle
toggleFocusMode.addEventListener('change', async (e) => {
  if (!currentSettings) return;
  currentSettings.focusMode = e.target.checked;
  await saveSettings();
  await loadState();
  showToast(e.target.checked ? 'Zen Focus Mode active' : 'Focus Mode disabled');
});

// Smart History & RAM Saver toggle
toggleSmartHistory.addEventListener('change', async (e) => {
  if (!currentSettings) return;
  currentSettings.smartHistoryArchive = e.target.checked;
  currentSettings.autoHibernateArchive = e.target.checked;
  await saveSettings();
  await loadState();
  showToast(e.target.checked ? 'Smart History & RAM Saver on' : 'Smart History disabled');
});

// Multitasking Grace Period Slider
if (graceSlider) {
  graceSlider.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    if (graceDisplay) graceDisplay.textContent = `${val} ${val === 1 ? 'Min' : 'Mins'}`;
  });

  graceSlider.addEventListener('change', async (e) => {
    const val = Number(e.target.value);
    if (currentSettings) {
      currentSettings.gracePeriodMinutes = val;
      await saveSettings();
      await loadState();
      showToast(`Multitasking grace period set to ${val} mins`);
    }
  });
}

// TTL Slider
ttlSlider.addEventListener('input', (e) => {
  const val = Number(e.target.value);
  ttlDisplay.textContent = `${val} Days`;
});

ttlSlider.addEventListener('change', async (e) => {
  const val = Number(e.target.value);
  if (currentSettings) {
    currentSettings.ttlDays = val;
    await saveSettings();
    await loadState();
    showToast(`Archive TTL set to ${val} days`);
  }
});

// Category selector segmented tabs
categorySelector.addEventListener('click', (e) => {
  const btn = e.target.closest('.segment-tab');
  if (!btn) return;

  document.querySelectorAll('.segment-tab').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  activeCategoryKey = btn.dataset.cat;
  renderDomainChips();
});

// Add domain form submit
addDomainForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const val = inputDomain.value;
  if (val) {
    await assignDomainToCategory(val, activeCategoryKey);
    inputDomain.value = '';
    showToast(`Added ${val} to ${activeCategoryKey}`);
  }
});

// Reset defaults
btnReset.addEventListener('click', async () => {
  if (confirm('Reset domain patterns, smart toggles, and TTL to default rules?')) {
    await chrome.runtime.sendMessage({ action: 'RESET_SETTINGS' });
    await loadState();
    showToast('Reset to default rules');
  }
});

// Initial boot
loadState();
