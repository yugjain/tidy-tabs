/**
 * Tidy Tabs 2.0 - Refined Popup Dashboard Controller
 */

let currentSettings = null;
let activeCategoryKey = 'work';

// DOM Selectors
const statTotalSummary = document.getElementById('stat-total-summary');
const statPinnedInfo = document.getElementById('stat-pinned-info');
const statHibernatedBadge = document.getElementById('stat-hibernated-badge');
const segmentedBar = document.getElementById('segmented-bar');
const ratioLegend = document.getElementById('ratio-legend');

const btnOrganize = document.getElementById('btn-organize');
const labelOrganize = document.getElementById('label-organize');
const btnDedupe = document.getElementById('btn-dedupe');
const badgeDuplicates = document.getElementById('badge-duplicates');
const btnPruneArchive = document.getElementById('btn-prune-archive');
const badgeArchive = document.getElementById('badge-archive');

const groupBreakdown = document.getElementById('group-breakdown');
const uncategorizedSection = document.getElementById('uncategorized-section');
const uncategorizedList = document.getElementById('uncategorized-list');

const toggleFocusMode = document.getElementById('toggle-focus-mode');
const toggleSmartHistory = document.getElementById('toggle-smart-history');
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
 * Fetch and render current extension state and live window metrics.
 */
async function loadState() {
  try {
    const res = await chrome.runtime.sendMessage({ action: 'GET_STATE' });
    if (!res) return;

    currentSettings = res.settings;

    // Header summaries
    const totalTabs = res.totalTabs || 0;
    const unpinnedCount = res.unpinnedCount || 0;
    const pinnedCount = res.pinnedCount || 0;
    const hibernatedCount = res.hibernatedCount || 0;

    statTotalSummary.textContent = `${totalTabs} ${totalTabs === 1 ? 'Tab' : 'Tabs'}`;
    statPinnedInfo.textContent = `${pinnedCount} Pinned (Ignored)`;
    statHibernatedBadge.textContent = `${hibernatedCount} sleeping`;

    // Action buttons & count badges
    const dupCount = res.duplicateCount || 0;
    const archCount = res.counts?.archive || 0;

    badgeDuplicates.textContent = dupCount;
    badgeArchive.textContent = archCount;
    btnDedupe.disabled = dupCount === 0;
    btnPruneArchive.disabled = archCount === 0;

    // Render Proportional Segmented Tab Strip & Legend
    renderProportionalBar(res.counts, res.settings.categories, unpinnedCount);

    // Render Group Rows
    renderGroupRows(res.counts, res.settings.categories);

    // Render 1-Click Uncategorized Open Domains
    renderUncategorizedDomains(res.uncategorizedDomains || []);

    // Toggles & TTL Slider
    toggleFocusMode.checked = Boolean(currentSettings.focusMode);
    toggleSmartHistory.checked = currentSettings.smartHistoryArchive !== false;

    if (currentSettings.ttlDays) {
      ttlSlider.value = currentSettings.ttlDays;
      ttlDisplay.textContent = `${currentSettings.ttlDays} Days`;
    }

    // Render Domain Chips for Active Category
    renderDomainChips();
  } catch (err) {
    console.error('Failed to load state from background:', err);
  }
}

/**
 * Render Proportional Segmented Tab Strip showing live distribution.
 */
function renderProportionalBar(counts = {}, categories = [], totalUnpinned = 0) {
  segmentedBar.innerHTML = '';
  ratioLegend.innerHTML = '';

  const allCategories = [
    ...categories,
    { id: 'archive', name: 'Archive' }
  ];

  if (totalUnpinned === 0) {
    const emptySeg = document.createElement('div');
    emptySeg.className = 'bar-segment';
    emptySeg.style.width = '100%';
    emptySeg.style.backgroundColor = 'var(--bg-subtle)';
    segmentedBar.appendChild(emptySeg);
    return;
  }

  for (const cat of allCategories) {
    const count = counts[cat.id] || 0;
    if (count === 0) continue;

    const pct = ((count / totalUnpinned) * 100).toFixed(1);

    // Bar segment
    const seg = document.createElement('div');
    seg.className = `bar-segment seg-${cat.id}`;
    seg.style.width = `${pct}%`;
    seg.title = `${cat.name}: ${count} tabs (${pct}%)`;
    segmentedBar.appendChild(seg);

    // Legend chip
    const chip = document.createElement('div');
    chip.className = 'legend-chip';

    const dot = document.createElement('span');
    dot.className = `chip-dot dot-${cat.id}`;

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

  const allCategories = [
    ...categories,
    { id: 'archive', name: 'Archive' }
  ];

  for (const cat of allCategories) {
    const count = counts[cat.id] || 0;
    const row = document.createElement('div');
    row.className = 'group-row';

    const left = document.createElement('div');
    left.className = 'group-left';

    const bar = document.createElement('span');
    bar.className = `group-bar-indicator bar-${cat.id}`;

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

/**
 * Assign a domain pattern to a target category and regroup tabs.
 */
async function assignDomainToCategory(domainStr, categoryId) {
  if (!currentSettings) return;
  const clean = domainStr.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  if (!clean) return;

  // Remove from any other category to avoid duplicates
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

/**
 * Render domain chips for the currently selected category tab.
 */
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

/**
 * Remove domain from active category.
 */
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

/**
 * Persist modified settings to background worker.
 */
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
// Event Listeners
// ==========================================

// Organize Now button (runs full Chrome History usage-score sort)
btnOrganize.addEventListener('click', async () => {
  btnOrganize.disabled = true;
  labelOrganize.textContent = 'Sorting...';
  try {
    await chrome.runtime.sendMessage({ action: 'ORGANIZE_NOW' });
    await loadState();
    showToast('Sorted tabs by Usage Score');
  } finally {
    labelOrganize.textContent = 'Organize Now';
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

// Close Archived Tabs button
btnPruneArchive.addEventListener('click', async () => {
  const count = Number(badgeArchive.textContent) || 0;
  if (count === 0) return;
  if (confirm(`Close all ${count} inactive tab(s) in the Archive group?`)) {
    btnPruneArchive.disabled = true;
    try {
      const res = await chrome.runtime.sendMessage({ action: 'PRUNE_ARCHIVE' });
      await loadState();
      showToast(`Pruned ${res?.closedCount || 0} archived tab(s)`);
    } finally {
      btnPruneArchive.disabled = false;
    }
  }
});

// Focus Mode toggle
toggleFocusMode.addEventListener('change', async (e) => {
  if (!currentSettings) return;
  currentSettings.focusMode = e.target.checked;
  await saveSettings();
  await loadState();
  showToast(e.target.checked ? 'Focus Mode active' : 'Focus Mode disabled');
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
