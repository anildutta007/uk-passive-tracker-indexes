/**
 * UK Passive Tracker Indexes & Top 5 Outperforming Funds Explorer
 * Client-Side Application Logic
 */

const state = {
  selectedIndexId: "nasdaq100",
  regionFilter: "ALL",
  sortBy: "cagr20_desc",
  lumpSum: 10000,
  compareFundRank: 1, // "ALL" or 1..5
  showMasterMatrix: true,
  showAllCatalogMode: false
};

let yearlyBarChartInstance = null;
let cumulativeLineChartInstance = null;

const FUND_COLORS = [
  "#10b981", // #1 Emerald
  "#6366f1", // #2 Indigo
  "#f59e0b", // #3 Amber
  "#ec4899", // #4 Pink
  "#06b6d4"  // #5 Cyan
];

document.addEventListener("DOMContentLoaded", () => {
  if (window.UK_PASSIVE_INDEXES && window.UK_PASSIVE_INDEXES.length > 0) {
    state.selectedIndexId = window.UK_PASSIVE_INDEXES[0].id;
  }
  initTopKPIs();
  bindEvents();
  renderAll();
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

function getSortedIndexes() {
  const list = [...window.UK_PASSIVE_INDEXES];
  switch (state.sortBy) {
    case "cagr10_desc":
      return list.sort((a, b) => b.metrics.cagr10 - a.metrics.cagr10);
    case "cagr5_desc":
      return list.sort((a, b) => b.metrics.cagr5 - a.metrics.cagr5);
    case "ytd_desc":
      return list.sort((a, b) => (b.yearlyReturns["2026 YTD"] || 0) - (a.yearlyReturns["2026 YTD"] || 0));
    case "ocf_asc":
      return list.sort((a, b) => a.lowestOcf - b.lowestOcf || b.metrics.cagr20 - a.metrics.cagr20);
    case "cagr20_desc":
    default:
      return list.sort((a, b) => b.metrics.cagr20 - a.metrics.cagr20);
  }
}

function initTopKPIs() {
  const sortedByCagr = [...window.UK_PASSIVE_INDEXES].sort((a, b) => b.metrics.cagr20 - a.metrics.cagr20);
  if (sortedByCagr.length > 0) {
    const top = sortedByCagr[0];
    const cagrEl = document.getElementById("kpi-best-index-cagr");
    const nameEl = document.getElementById("kpi-best-index-name");
    if (cagrEl) cagrEl.textContent = `${top.metrics.cagr20.toFixed(2)}% p.a.`;
    if (nameEl) nameEl.textContent = `${top.name} (£${(top.metrics.value10k / 1000).toFixed(1)}k on £10k)`;
  }
}

function bindEvents() {
  // Sort Dropdown
  const sortSelect = document.getElementById("index-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      state.sortBy = e.target.value || "cagr20_desc";
      renderIndexCards();
      renderMasterMatrix();
      if (state.showAllCatalogMode) renderAllIndexesCatalog();
    });
  }

  // Region Filter Buttons
  document.querySelectorAll(".region-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.regionFilter = btn.getAttribute("data-filter") || "ALL";
      document.querySelectorAll(".region-btn").forEach(b => {
        b.classList.remove("bg-white", "text-slate-900", "shadow-2xs");
        b.classList.add("text-slate-600");
      });
      btn.classList.add("bg-white", "text-slate-900", "shadow-2xs");
      btn.classList.remove("text-slate-600");
      renderIndexCards();
    });
  });

  // Lump Sum Selector
  const lumpSelect = document.getElementById("lump-sum-select");
  if (lumpSelect) {
    lumpSelect.addEventListener("change", (e) => {
      state.lumpSum = Number(e.target.value) || 10000;
      renderAll();
    });
  }

  // Toggle Master 20-Yr Matrix
  const btnMatrix = document.getElementById("btn-toggle-master-matrix");
  if (btnMatrix) {
    btnMatrix.addEventListener("click", () => {
      state.showMasterMatrix = !state.showMasterMatrix;
      const container = document.getElementById("master-matrix-container");
      const label = document.getElementById("master-matrix-btn-text");
      if (container && label) {
        if (state.showMasterMatrix) {
          container.classList.remove("hidden");
          label.textContent = "Hide All 12 Indexes 20-Yr Matrix";
        } else {
          container.classList.add("hidden");
          label.textContent = "Show All 12 Indexes 20-Yr Matrix";
        }
      }
    });
    // Set initial label
    const label = document.getElementById("master-matrix-btn-text");
    if (label) label.textContent = "Hide All 12 Indexes 20-Yr Matrix";
  }

  // Overlay Fund selector on Yearly Bar Chart
  const compareSelect = document.getElementById("chart-compare-fund-select");
  if (compareSelect) {
    compareSelect.addEventListener("change", (e) => {
      state.compareFundRank = e.target.value === "NONE" ? "NONE" : Number(e.target.value);
      const selectedIdx = getSelectedIndex();
      if (selectedIdx) renderCharts(selectedIdx);
    });
  }

  // Toggle Full 12-Index Report Mode
  const btnToggleCatalog = document.getElementById("btn-toggle-all-catalog");
  const btnCloseCatalog = document.getElementById("btn-close-all-catalog");
  if (btnToggleCatalog) {
    btnToggleCatalog.addEventListener("click", () => {
      state.showAllCatalogMode = !state.showAllCatalogMode;
      updateCatalogViewMode();
    });
  }
  if (btnCloseCatalog) {
    btnCloseCatalog.addEventListener("click", () => {
      state.showAllCatalogMode = false;
      updateCatalogViewMode();
    });
  }

  // Export CSV
  const btnExport = document.getElementById("btn-export-csv");
  if (btnExport) {
    btnExport.addEventListener("click", exportFullDatasetCSV);
  }
}

function updateCatalogViewMode() {
  const singleContainer = document.getElementById("single-index-deep-dive");
  const allCatalogContainer = document.getElementById("all-indexes-full-catalog");
  const label = document.getElementById("toggle-all-catalog-label");

  if (state.showAllCatalogMode) {
    singleContainer.classList.add("hidden");
    allCatalogContainer.classList.remove("hidden");
    if (label) label.textContent = "Single-Index Interactive View";
    renderAllIndexesCatalog();
  } else {
    singleContainer.classList.remove("hidden");
    allCatalogContainer.classList.add("hidden");
    if (label) label.textContent = "Full 12-Index Report View";
  }
  if (window.lucide) window.lucide.createIcons();
}

function getSelectedIndex() {
  return window.UK_PASSIVE_INDEXES.find(i => i.id === state.selectedIndexId) || window.UK_PASSIVE_INDEXES[0];
}

function selectIndex(indexId, scrollIntoView = false) {
  state.selectedIndexId = indexId;
  if (state.showAllCatalogMode) {
    state.showAllCatalogMode = false;
    updateCatalogViewMode();
  }
  renderAll();
  if (scrollIntoView) {
    const el = document.getElementById("single-index-deep-dive");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function formatGBP(num) {
  return "£" + Math.round(num).toLocaleString("en-GB");
}

function formatPct(val, showPlus = true) {
  const n = Number(val);
  const sign = showPlus && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function getReturnCellClass(val) {
  const n = Number(val);
  if (n >= 18) return "ret-pos-strong";
  if (n >= 0) return "ret-pos-mid";
  if (n <= -15) return "ret-neg-strong";
  return "ret-neg-mid";
}

function renderAll() {
  renderIndexCards();
  renderMasterMatrix();
  const idx = getSelectedIndex();
  if (idx) {
    renderSelectedIndexDetail(idx);
  }
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * 1. Render the 12 UK Passive Tracker Index Cards (Sorted Descending by Return)
 */
function renderIndexCards() {
  const grid = document.getElementById("index-cards-grid");
  if (!grid) return;

  const sorted = getSortedIndexes();
  const filtered = sorted.filter(idx => {
    if (state.regionFilter === "ALL") return true;
    if (state.regionFilter === "Global") return idx.region.includes("Global");
    if (state.regionFilter === "North America") return idx.region === "North America";
    if (state.regionFilter === "United Kingdom") return idx.region === "United Kingdom";
    return !idx.region.includes("Global") && idx.region !== "North America" && idx.region !== "United Kingdom";
  });

  const scaleFactor = state.lumpSum / 10000;

  grid.innerHTML = filtered.map((idx, pos) => {
    const isSelected = idx.id === state.selectedIndexId;
    const topFund = idx.topFunds[0];
    const scaledPot = Math.round(idx.metrics.value10k * scaleFactor);
    const rankNum = idx.returnRank || (pos + 1);

    return `
      <div onclick="selectIndex('${idx.id}', false)"
           class="group rounded-xl p-3.5 border transition cursor-pointer flex flex-col justify-between ${
             isSelected
               ? "bg-brand-50/70 border-brand-600 ring-2 ring-brand-500/30 shadow-sm"
               : "bg-white border-slate-200 hover:border-brand-400 hover:shadow-xs"
           }">
        <div>
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <div class="flex items-center gap-1.5">
              <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-black ${
                rankNum <= 3 ? "bg-emerald-600 text-white" : "bg-slate-800 text-white"
              }" title="20-Year Return Rank #${rankNum} of 12">
                #${rankNum}
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isSelected ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
              }">
                ${idx.category}
              </span>
            </div>
            <span class="text-[11px] font-mono font-semibold text-slate-500">
              OCF ${idx.lowestOcf.toFixed(2)}%
            </span>
          </div>

          <h3 class="text-sm font-extrabold text-slate-900 group-hover:text-brand-700 transition">
            ${idx.name}
          </h3>
          <p class="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
            Tracker: ${idx.cheapestTrackers[0].name}
          </p>
        </div>

        <div class="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2">
          <div>
            <span class="text-[10px] uppercase tracking-wider text-slate-400 block">20-Yr Annualised</span>
            <span class="text-base font-black text-emerald-600 font-mono">${idx.metrics.cagr20.toFixed(2)}% <span class="text-[10px] font-normal text-slate-500">p.a.</span></span>
          </div>
          <div class="text-right">
            <span class="text-[10px] uppercase tracking-wider text-slate-400 block">${formatGBP(state.lumpSum)} → 20 Yrs</span>
            <span class="text-sm font-extrabold text-slate-900 font-mono">${formatGBP(scaledPot)}</span>
          </div>
        </div>

        <div class="mt-2 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
          <span class="text-slate-500 font-medium truncate max-w-[72%]" title="#1 Outperforming Fund: ${topFund.name}">
            <strong class="text-indigo-600">#1 Beat:</strong> ${topFund.name}
          </span>
          <span class="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
            ${topFund.metrics.cagr20.toFixed(1)}%
          </span>
        </div>
      </div>
    `;
  }).join("");
}

/**
 * 2. Render Master 20-Year Annual % Return Matrix for All 12 Passive Indexes (Sorted Descending)
 */
function renderMasterMatrix() {
  const thead = document.getElementById("master-matrix-thead");
  const tbody = document.getElementById("master-matrix-tbody");
  if (!thead || !tbody) return;

  const yearHeaders = window.YEARS_20.map(yr => `<th class="py-2.5 px-2 text-right font-mono">${yr}</th>`).join("");
  thead.innerHTML = `
    <th class="py-2.5 px-3 text-left sticky-col bg-slate-900 min-w-[235px]">Rank &amp; Passive Tracker Index (UK)</th>
    <th class="py-2.5 px-2.5 text-right bg-slate-800 text-emerald-300">20-Yr CAGR ↓</th>
    <th class="py-2.5 px-2.5 text-right bg-slate-800">${formatGBP(state.lumpSum)} (20Y)</th>
    ${yearHeaders}
    <th class="py-2.5 px-2 text-right bg-slate-800 text-amber-300 font-mono">2026 YTD</th>
  `;

  const scaleFactor = state.lumpSum / 10000;
  const sorted = getSortedIndexes();

  tbody.innerHTML = sorted.map((idx, pos) => {
    const isSelected = idx.id === state.selectedIndexId;
    const scaledPot = Math.round(idx.metrics.value10k * scaleFactor);
    const rankNum = idx.returnRank || (pos + 1);

    const yearCells = window.YEARS_20.map(yr => {
      const val = idx.yearlyReturns[yr];
      const cls = getReturnCellClass(val);
      return `<td class="py-2 px-1.5 text-right font-mono text-[11px] ${cls}">${formatPct(val)}</td>`;
    }).join("");

    const ytdVal = idx.yearlyReturns["2026 YTD"];

    return `
      <tr onclick="selectIndex('${idx.id}', true)"
          class="cursor-pointer transition hover:bg-brand-50/50 ${isSelected ? "ring-2 ring-inset ring-brand-500 bg-brand-50/30" : ""}">
        <td class="py-2.5 px-3 font-bold text-slate-900 sticky-col sticky-col-shadow ${isSelected ? "bg-brand-50" : "bg-white"}">
          <div class="flex items-center justify-between gap-1.5">
            <div class="flex items-center gap-1.5 truncate">
              <span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-extrabold ${
                rankNum <= 3 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
              }">#${rankNum}</span>
              <span class="truncate">${idx.shortName}</span>
            </div>
            <span class="text-[10px] font-mono text-brand-600 shrink-0">${idx.lowestOcf.toFixed(2)}% OCF</span>
          </div>
        </td>
        <td class="py-2 px-2.5 text-right font-mono font-extrabold text-emerald-700 bg-emerald-50/60">
          ${idx.metrics.cagr20.toFixed(2)}%
        </td>
        <td class="py-2 px-2.5 text-right font-mono font-bold text-slate-900 bg-slate-50">
          ${formatGBP(scaledPot)}
        </td>
        ${yearCells}
        <td class="py-2 px-2 text-right font-mono font-bold text-brand-700 bg-brand-50/40">
          ${formatPct(ytdVal)}
        </td>
      </tr>
    `;
  }).join("");
}

/**
 * 3. Render Selected Index Deep-Dive, Trackers, Charts, Top 5 Funds & 20-Yr Table
 */
function renderSelectedIndexDetail(idx) {
  const scaleFactor = state.lumpSum / 10000;
  const scaledIndexPot = Math.round(idx.metrics.value10k * scaleFactor);

  // Header metadata
  document.getElementById("detail-index-category").textContent = `${idx.category} • ${idx.region}`;
  document.getElementById("detail-index-constituents").textContent = `${idx.constituentsCount.toLocaleString()} Constituents`;
  document.getElementById("detail-index-currency").textContent = idx.currency;
  document.getElementById("detail-index-name").textContent = idx.name;
  document.getElementById("detail-index-desc").textContent = idx.description;

  document.getElementById("detail-cagr-20").textContent = `${idx.metrics.cagr20.toFixed(2)}%`;
  document.getElementById("detail-lump-label").textContent = `${formatGBP(state.lumpSum)} Grew To (20 Yrs)`;
  document.getElementById("detail-value-10k").textContent = formatGBP(scaledIndexPot);
  document.getElementById("detail-cum-pct").textContent = `+${idx.metrics.cumulativePct.toLocaleString()}% cumulative return`;
  document.getElementById("detail-cagr-10-5").textContent = `${idx.metrics.cagr10.toFixed(2)}% / ${idx.metrics.cagr5.toFixed(2)}%`;
  document.getElementById("detail-pos-years").textContent = `${idx.metrics.posYears} / 20 Yrs (${Math.round(idx.metrics.posYears / 20 * 100)}%)`;

  // Cheapest UK Passive Tracker Funds / ETFs
  const trackersEl = document.getElementById("detail-cheapest-trackers");
  trackersEl.innerHTML = idx.cheapestTrackers.map(t => `
    <div class="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between gap-1.5 mb-1">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
            ${t.structure}
          </span>
          <span class="px-2 py-0.5 rounded text-[11px] font-mono font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            OCF: ${t.ocf.toFixed(2)}%
          </span>
        </div>
        <div class="font-bold text-xs text-slate-900 mt-1">${t.name}</div>
      </div>
      <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>Ticker: <strong class="text-slate-800">${t.ticker}</strong></span>
        <span>${t.provider}</span>
      </div>
    </div>
  `).join("");

  // Populate Compare Fund Select for Yearly Bar Chart
  const compareSelect = document.getElementById("chart-compare-fund-select");
  if (compareSelect) {
    compareSelect.innerHTML = [
      ...idx.topFunds.map(f => `<option value="${f.rank}" ${state.compareFundRank === f.rank ? "selected" : ""}>#${f.rank}: ${f.name} (${f.metrics.cagr20.toFixed(2)}% p.a.)</option>`),
      `<option value="NONE" ${state.compareFundRank === "NONE" ? "selected" : ""}>Show Passive Index Only</option>`
    ].join("");
  }

  // Render Top 5 Outperforming Funds Section
  document.getElementById("top5-heading-index-name").textContent = idx.name;
  document.getElementById("top5-benchmark-cagr-badge").textContent = `${idx.metrics.cagr20.toFixed(2)}% p.a.`;
  document.getElementById("th-lump-sum-col").textContent = `${formatGBP(state.lumpSum)} Value (20 Yrs)`;

  renderTop5FundCards(idx, scaleFactor, scaledIndexPot);
  renderTop5ComparisonTable(idx, scaleFactor, scaledIndexPot);
  renderIndexVsTop5YearlyTable(idx);
  renderCharts(idx);
}

/**
 * Render Top 5 Outperforming Funds Cards
 */
function renderTop5FundCards(idx, scaleFactor, scaledIndexPot) {
  const container = document.getElementById("top5-funds-cards");
  if (!container) return;

  container.innerHTML = idx.topFunds.map((f, i) => {
    const scaledFundPot = Math.round(f.metrics.value10k * scaleFactor);
    const scaledExtra = scaledFundPot - scaledIndexPot;
    const badgeColor = FUND_COLORS[i] || "#10b981";

    return `
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${badgeColor}"></div>

        <div>
          <!-- Rank & Alpha Badge -->
          <div class="flex items-center justify-between gap-1.5 mb-2">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black text-white" style="background-color: ${badgeColor}">
              #${f.rank} Outperformer
            </span>
            <span class="px-2 py-0.5 rounded-md text-[11px] font-mono font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              +${f.alphaAnnual.toFixed(2)}% p.a. Alpha
            </span>
          </div>

          <!-- Fund Name & House -->
          <h3 class="text-sm font-extrabold text-slate-900 leading-snug">
            ${f.name}
          </h3>
          <div class="text-[11px] font-semibold text-slate-500 mt-0.5">
            ${f.house} • <span class="text-indigo-600">${f.vehicleType}</span>
          </div>

          <!-- Key Metrics Box -->
          <div class="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-2">
            <div>
              <span class="text-[10px] uppercase text-slate-400 font-bold block">20-Yr CAGR</span>
              <span class="text-base font-black text-slate-900 font-mono">${f.metrics.cagr20.toFixed(2)}%</span>
              <span class="text-[10px] text-emerald-600 font-semibold block">vs ${idx.metrics.cagr20.toFixed(2)}% Index</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase text-slate-400 font-bold block">${formatGBP(state.lumpSum)} → 20Y</span>
              <span class="text-sm font-black text-emerald-700 font-mono">${formatGBP(scaledFundPot)}</span>
              <span class="text-[10px] text-emerald-600 font-bold block">+${formatGBP(scaledExtra)} extra</span>
            </div>
          </div>

          <!-- Strategy Note -->
          <p class="text-[11px] text-slate-600 mt-2.5 leading-relaxed">
            ${f.strategyNote}
          </p>
        </div>

        <!-- Footer Meta -->
        <div class="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-[11px]">
          <div class="flex items-center justify-between text-slate-500">
            <span>Ticker / ISIN:</span>
            <span class="font-mono font-bold text-slate-800">${f.ticker}</span>
          </div>
          <div class="flex items-center justify-between text-slate-500">
            <span>Ongoing Charge (OCF):</span>
            <span class="font-mono font-semibold text-slate-800">${f.ocf.toFixed(2)}%</span>
          </div>
          <div class="flex items-center justify-between text-slate-500">
            <span>Years Beat Index:</span>
            <span class="font-mono font-bold text-emerald-700">${f.yearsBeatIndex} / 20 Yrs</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

/**
 * Render Summary Comparison Table (Benchmark Row + Top 5 Outperforming Funds)
 */
function renderTop5ComparisonTable(idx, scaleFactor, scaledIndexPot) {
  const tbody = document.getElementById("top5-comparison-tbody");
  if (!tbody) return;

  const benchmarkRow = `
    <tr class="bg-slate-900 text-white font-bold">
      <td class="py-2.5 px-3 font-mono text-[11px] uppercase text-amber-300">INDEX</td>
      <td class="py-2.5 px-3">${idx.name} (Passive Benchmark)</td>
      <td class="py-2.5 px-3 text-slate-300">Passive Tracker (${idx.cheapestTrackers[0].provider})</td>
      <td class="py-2.5 px-3 font-mono text-slate-300">${idx.cheapestTrackers[0].ticker}</td>
      <td class="py-2.5 px-3 text-right font-mono text-emerald-300">${idx.lowestOcf.toFixed(2)}%</td>
      <td class="py-2.5 px-3 text-right font-mono text-base text-white">${idx.metrics.cagr20.toFixed(2)}%</td>
      <td class="py-2.5 px-3 text-right font-mono text-slate-400">Baseline (0.00%)</td>
      <td class="py-2.5 px-3 text-right font-mono text-slate-200">${idx.metrics.cagr10.toFixed(2)}%</td>
      <td class="py-2.5 px-3 text-right font-mono text-amber-300">${formatGBP(scaledIndexPot)}</td>
      <td class="py-2.5 px-3 text-right font-mono text-slate-400">—</td>
      <td class="py-2.5 px-3 text-center font-mono text-slate-300">Benchmark</td>
    </tr>
  `;

  const fundRows = idx.topFunds.map((f, i) => {
    const scaledFundPot = Math.round(f.metrics.value10k * scaleFactor);
    const scaledExtra = scaledFundPot - scaledIndexPot;
    const dotColor = FUND_COLORS[i] || "#10b981";

    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-2.5 px-3 font-mono font-black text-slate-800">
          <span class="inline-flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${dotColor}"></span>
            #${f.rank}
          </span>
        </td>
        <td class="py-2.5 px-3 font-bold text-slate-900">
          <div>${f.name}</div>
          <div class="text-[11px] font-normal text-slate-500">Manager: ${f.manager}</div>
        </td>
        <td class="py-2.5 px-3 text-slate-600">
          <div class="font-semibold text-slate-800">${f.house}</div>
          <div class="text-[11px] text-indigo-600 font-medium">${f.vehicleType}</div>
        </td>
        <td class="py-2.5 px-3 font-mono text-slate-700">${f.ticker}</td>
        <td class="py-2.5 px-3 text-right font-mono text-slate-700">${f.ocf.toFixed(2)}%</td>
        <td class="py-2.5 px-3 text-right font-mono font-black text-emerald-700 text-sm bg-emerald-50/50">${f.metrics.cagr20.toFixed(2)}%</td>
        <td class="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">+${f.alphaAnnual.toFixed(2)}% p.a.</td>
        <td class="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">${f.metrics.cagr10.toFixed(2)}%</td>
        <td class="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900">${formatGBP(scaledFundPot)}</td>
        <td class="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">+${formatGBP(scaledExtra)}</td>
        <td class="py-2.5 px-3 text-center font-mono font-bold text-slate-700">${f.yearsBeatIndex} / 20</td>
      </tr>
    `;
  }).join("");

  tbody.innerHTML = benchmarkRow + fundRows;
}

/**
 * 4. Render 20-Year Year-by-Year Annual % Return Table (Selected Index vs Top 5 Funds)
 */
function renderIndexVsTop5YearlyTable(idx) {
  document.getElementById("yearly-table-index-name").textContent = idx.name;
  const thead = document.getElementById("detail-yearly-thead");
  const tbody = document.getElementById("detail-yearly-tbody");
  if (!thead || !tbody) return;

  const yearHeaders = window.YEARS_20.map(yr => `<th class="py-2.5 px-2 text-right font-mono">${yr}</th>`).join("");
  thead.innerHTML = `
    <th class="py-2.5 px-3 text-left sticky-col bg-slate-900 min-w-[235px]">Index / Outperforming Fund</th>
    <th class="py-2.5 px-2.5 text-right bg-slate-800 text-emerald-300">20-Yr CAGR</th>
    <th class="py-2.5 px-2 text-right bg-slate-800 text-amber-300">Alpha</th>
    ${yearHeaders}
    <th class="py-2.5 px-2 text-right bg-slate-800 text-cyan-300 font-mono">2026 YTD</th>
  `;

  // Row 1: Passive Benchmark Index
  const indexYearCells = window.YEARS_20.map(yr => {
    const val = idx.yearlyReturns[yr];
    return `<td class="py-2.5 px-1.5 text-right font-mono font-bold text-white bg-slate-800 border-r border-slate-700/60">${formatPct(val)}</td>`;
  }).join("");

  const indexRow = `
    <tr class="bg-slate-900 text-white font-bold">
      <td class="py-2.5 px-3 sticky-col sticky-col-shadow bg-slate-900 text-amber-300">
        <div class="flex items-center gap-1.5">
          <span class="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30">INDEX</span>
          <span class="truncate">${idx.name}</span>
        </div>
      </td>
      <td class="py-2.5 px-2.5 text-right font-mono font-black text-emerald-300 bg-slate-800">${idx.metrics.cagr20.toFixed(2)}%</td>
      <td class="py-2.5 px-2 text-right font-mono text-slate-400 bg-slate-800">Base</td>
      ${indexYearCells}
      <td class="py-2.5 px-2 text-right font-mono font-bold text-cyan-300 bg-slate-800">${formatPct(idx.yearlyReturns["2026 YTD"])}</td>
    </tr>
  `;

  // Rows 2..6: Top 5 Outperforming Funds
  const fundRows = idx.topFunds.map((f, i) => {
    const dotColor = FUND_COLORS[i] || "#10b981";
    const cells = window.YEARS_20.map(yr => {
      const fVal = f.yearlyReturns[yr];
      const idxVal = idx.yearlyReturns[yr];
      const beat = fVal > idxVal;
      const cls = getReturnCellClass(fVal);
      return `<td class="py-2 px-1.5 text-right font-mono text-[11px] ${cls} ${beat ? "beat-index-cell" : ""}" title="${yr}: Fund ${formatPct(fVal)} vs Index ${formatPct(idxVal)}">${formatPct(fVal)}</td>`;
    }).join("");

    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-2.5 px-3 font-bold text-slate-900 sticky-col sticky-col-shadow bg-white">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${dotColor}"></span>
            <span class="text-slate-500 font-mono text-[11px]">#${f.rank}</span>
            <span class="truncate" title="${f.name}">${f.name}</span>
          </div>
        </td>
        <td class="py-2 px-2.5 text-right font-mono font-extrabold text-emerald-700 bg-emerald-50/60">${f.metrics.cagr20.toFixed(2)}%</td>
        <td class="py-2 px-2 text-right font-mono font-bold text-indigo-700 bg-indigo-50/50">+${f.alphaAnnual.toFixed(2)}%</td>
        ${cells}
        <td class="py-2 px-2 text-right font-mono font-bold text-brand-700 bg-brand-50/40">${formatPct(f.yearlyReturns["2026 YTD"])}</td>
      </tr>
    `;
  }).join("");

  tbody.innerHTML = indexRow + fundRows;
}

/**
 * 5. Render Chart.js Visualisations (Yearly % Bar Chart + 20-Yr Cumulative Compounded Growth Chart)
 */
function renderCharts(idx) {
  if (typeof Chart === "undefined") return;

  const labels = [...window.YEARS_20, "2026 YTD"];
  const indexData = labels.map(yr => idx.yearlyReturns[yr]);

  // --- Chart 1: Yearly % Bar Chart ---
  const barCtx = document.getElementById("yearlyBarChart");
  if (barCtx) {
    if (yearlyBarChartInstance) yearlyBarChartInstance.destroy();

    const datasets = [
      {
        label: `${idx.shortName} (Passive Index)`,
        data: indexData,
        backgroundColor: "#0f172a",
        borderRadius: 3
      }
    ];

    if (state.compareFundRank !== "NONE") {
      const compareFund = idx.topFunds.find(f => f.rank === state.compareFundRank) || idx.topFunds[0];
      if (compareFund) {
        datasets.push({
          label: `#${compareFund.rank}: ${compareFund.name}`,
          data: labels.map(yr => compareFund.yearlyReturns[yr]),
          backgroundColor: FUND_COLORS[compareFund.rank - 1] || "#10b981",
          borderRadius: 3
        });
      }
    }

    yearlyBarChartInstance = new Chart(barCtx, {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            labels: { boxWidth: 12, font: { size: 11, weight: "600" } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y > 0 ? "+" : ""}${ctx.parsed.y.toFixed(1)}%`
            }
          }
        },
        scales: {
          x: {
            ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 },
            grid: { display: false }
          },
          y: {
            ticks: {
              font: { size: 10 },
              callback: (val) => `${val}%`
            },
            grid: { color: "#e2e8f0" }
          }
        }
      }
    });
  }

  // --- Chart 2: Cumulative £ Growth Line Chart (2006–2025) ---
  const lineCtx = document.getElementById("cumulativeLineChart");
  const cumTitleEl = document.getElementById("cum-chart-title");
  if (cumTitleEl) {
    cumTitleEl.textContent = `${formatGBP(state.lumpSum)} Compounded Growth Over 20 Years (2006–2025)`;
  }

  if (lineCtx) {
    if (cumulativeLineChartInstance) cumulativeLineChartInstance.destroy();

    const lineLabels = ["Start (2006)", ...window.YEARS_20];

    const buildCumulativeSeries = (returnsObj) => {
      let current = state.lumpSum;
      const points = [current];
      window.YEARS_20.forEach(yr => {
        current = current * (1 + (returnsObj[yr] || 0) / 100);
        points.push(Math.round(current));
      });
      return points;
    };

    const lineDatasets = [
      {
        label: `${idx.shortName} (Passive Benchmark)`,
        data: buildCumulativeSeries(idx.yearlyReturns),
        borderColor: "#0f172a",
        backgroundColor: "rgba(15, 23, 42, 0.08)",
        borderWidth: 3,
        borderDash: [5, 4],
        pointRadius: 1.5,
        tension: 0.25
      },
      ...idx.topFunds.map((f, i) => ({
        label: `#${f.rank} ${f.name.split("(")[0].trim()}`,
        data: buildCumulativeSeries(f.yearlyReturns),
        borderColor: FUND_COLORS[i] || "#10b981",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 1.5,
        tension: 0.25
      }))
    ];

    cumulativeLineChartInstance = new Chart(lineCtx, {
      type: "line",
      data: { labels: lineLabels, datasets: lineDatasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            labels: { boxWidth: 12, font: { size: 10, weight: "600" } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: £${ctx.parsed.y.toLocaleString("en-GB")}`
            }
          }
        },
        scales: {
          x: {
            ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 },
            grid: { display: false }
          },
          y: {
            ticks: {
              font: { size: 10 },
              callback: (val) => "£" + (val >= 1000 ? (val / 1000).toFixed(0) + "k" : val)
            },
            grid: { color: "#e2e8f0" }
          }
        }
      }
    });
  }
}

/**
 * 6. Render Complete All-12-Index & 60-Fund Catalog Report View
 */
function renderAllIndexesCatalog() {
  const container = document.getElementById("all-indexes-catalog-list");
  if (!container) return;

  const scaleFactor = state.lumpSum / 10000;
  const sorted = getSortedIndexes();

  container.innerHTML = sorted.map((idx, idxNum) => {
    const scaledIndexPot = Math.round(idx.metrics.value10k * scaleFactor);

    const yearHeaders = window.YEARS_20.map(yr => `<th class="py-1.5 px-1.5 text-right font-mono">${yr}</th>`).join("");
    const indexYearCells = window.YEARS_20.map(yr => {
      const val = idx.yearlyReturns[yr];
      return `<td class="py-1.5 px-1.5 text-right font-mono font-bold ${getReturnCellClass(val)}">${formatPct(val)}</td>`;
    }).join("");

    const top5Rows = idx.topFunds.map(f => {
      const scaledFundPot = Math.round(f.metrics.value10k * scaleFactor);
      const scaledExtra = scaledFundPot - scaledIndexPot;
      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50">
          <td class="py-2 px-3 font-mono font-bold text-indigo-700">#${f.rank}</td>
          <td class="py-2 px-3 font-bold text-slate-900">${f.name}</td>
          <td class="py-2 px-3 text-slate-600">${f.house} (${f.vehicleType})</td>
          <td class="py-2 px-3 font-mono text-slate-600">${f.ticker}</td>
          <td class="py-2 px-3 text-right font-mono">${f.ocf.toFixed(2)}%</td>
          <td class="py-2 px-3 text-right font-mono font-extrabold text-emerald-700">${f.metrics.cagr20.toFixed(2)}%</td>
          <td class="py-2 px-3 text-right font-mono font-bold text-emerald-600">+${f.alphaAnnual.toFixed(2)}%</td>
          <td class="py-2 px-3 text-right font-mono font-bold text-slate-900">${formatGBP(scaledFundPot)}</td>
          <td class="py-2 px-3 text-right font-mono font-semibold text-emerald-700">+${formatGBP(scaledExtra)}</td>
        </tr>
      `;
    }).join("");

    return `
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span class="text-xs font-mono text-brand-400 font-bold">INDEX ${idxNum + 1} OF 12 • ${idx.category.toUpperCase()}</span>
            <h3 class="text-lg font-black">${idx.name}</h3>
            <p class="text-xs text-slate-300">Cheapest UK Tracker: ${idx.cheapestTrackers[0].name} (${idx.cheapestTrackers[0].ticker} • OCF ${idx.cheapestTrackers[0].ocf.toFixed(2)}%)</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <span class="text-[10px] uppercase text-slate-400 block">20-Yr Annualised Return</span>
              <span class="text-xl font-black text-emerald-400 font-mono">${idx.metrics.cagr20.toFixed(2)}% p.a.</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase text-slate-400 block">${formatGBP(state.lumpSum)} → 20 Yrs</span>
              <span class="text-xl font-black text-white font-mono">${formatGBP(scaledIndexPot)}</span>
            </div>
            <button onclick="selectIndex('${idx.id}', true)" class="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition cursor-pointer">
              Interactive Charts
            </button>
          </div>
        </div>

        <div class="p-4 space-y-4">
          <!-- 20-Year Index Yearly Returns Strip -->
          <div>
            <div class="text-xs font-bold text-slate-700 mb-1.5">20-Year Yearly % Return Series (2006–2025 + 2026 YTD):</div>
            <div class="overflow-x-auto custom-scrollbar border border-slate-200 rounded-lg">
              <table class="min-w-full text-[11px] border-collapse">
                <thead>
                  <tr class="bg-slate-100 text-slate-700">
                    ${yearHeaders}
                    <th class="py-1.5 px-1.5 text-right font-mono bg-brand-50 text-brand-800">2026 YTD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    ${indexYearCells}
                    <td class="py-1.5 px-1.5 text-right font-mono font-bold bg-brand-50 text-brand-800">${formatPct(idx.yearlyReturns["2026 YTD"])}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Top 5 Outperforming Funds Table -->
          <div>
            <div class="text-xs font-bold text-slate-700 mb-1.5">Top 5 Funds Achieving Higher Growth Than ${idx.name}:</div>
            <div class="overflow-x-auto border border-slate-200 rounded-lg">
              <table class="min-w-full text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-50 text-slate-600 border-b border-slate-200 text-left">
                    <th class="py-2 px-3">Rank</th>
                    <th class="py-2 px-3">Outperforming Fund Name</th>
                    <th class="py-2 px-3">House &amp; Structure</th>
                    <th class="py-2 px-3">Ticker</th>
                    <th class="py-2 px-3 text-right">OCF</th>
                    <th class="py-2 px-3 text-right">20-Yr CAGR</th>
                    <th class="py-2 px-3 text-right">Alpha p.a.</th>
                    <th class="py-2 px-3 text-right">${formatGBP(state.lumpSum)} (20Y)</th>
                    <th class="py-2 px-3 text-right">Extra Gain</th>
                  </tr>
                </thead>
                <tbody>
                  ${top5Rows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

/**
 * 7. Export Complete 20-Year Dataset (All 12 Indexes + All 60 Outperforming Funds) to CSV
 */
function exportFullDatasetCSV() {
  const headers = [
    "Benchmark Index",
    "Row Type",
    "Rank",
    "Name",
    "Provider / House",
    "Vehicle Type",
    "Ticker / ISIN",
    "OCF %",
    "20-Yr CAGR %",
    "Annual Alpha vs Index %",
    "10-Yr CAGR %",
    "£10,000 Compounded 20-Yr Value (£)",
    ...window.YEARS_20,
    "2026 YTD"
  ];

  const rows = [headers.join(",")];

  window.UK_PASSIVE_INDEXES.forEach(idx => {
    const idxYears = window.YEARS_20.map(yr => idx.yearlyReturns[yr]);
    rows.push([
      `"${idx.name}"`,
      `"Passive Index Benchmark"`,
      `"INDEX"`,
      `"${idx.name} (${idx.cheapestTrackers[0].name})"`,
      `"${idx.cheapestTrackers[0].provider}"`,
      `"Passive Index"`,
      `"${idx.cheapestTrackers[0].ticker}"`,
      idx.lowestOcf,
      idx.metrics.cagr20,
      0.00,
      idx.metrics.cagr10,
      idx.metrics.value10k,
      ...idxYears,
      idx.yearlyReturns["2026 YTD"]
    ].join(","));

    idx.topFunds.forEach(f => {
      const fYears = window.YEARS_20.map(yr => f.yearlyReturns[yr]);
      rows.push([
        `"${idx.name}"`,
        `"Top 5 Outperforming Fund"`,
        `"#$${f.rank}"`.replace("$", ""),
        `"${f.name}"`,
        `"${f.house}"`,
        `"${f.vehicleType}"`,
        `"${f.ticker}"`,
        f.ocf,
        f.metrics.cagr20,
        f.alphaAnnual,
        f.metrics.cagr10,
        f.metrics.value10k,
        ...fYears,
        f.yearlyReturns["2026 YTD"]
      ].join(","));
    });
  });

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "uk-passive-tracker-indexes-20yr-returns-and-top5-funds.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
