/**
 * UK Passive Tracker Indexes & Top 5 Outperforming Funds Explorer
 * Client-Side Application Logic (UI Redesign Spec Implementation)
 */

// Application State
const state = {
  selectedIndexId: "nasdaq100",
  currentTab: "explore", // "explore" | "compare"
  period: "20Y",         // "20Y" | "10Y" | "5Y" | "3Y" | "2Y" | "2026"
  investAmount: 10000,
  
  // Explore Tab State
  searchQuery: "",
  regionFilter: "All",   // "All" | "Global" | "US" | "UK" | "Other"
  sidebarSort: "period_desc",
  selectedOverlayFundRank: 1, // 0 for Index only, 1..5 for fund
  fundDisplayLimit: 3,        // 3 by default, option to see 5
  top5ViewMode: "cards",      // "cards" | "table"
  accordionOpenRank: 1,       // #1 open by default

  // Compare Tab State
  selectedH2HIndexes: ["nasdaq100", "sp500", "ftse100"], // Pick up to 4
  matrixSortKey: "cagr20",
  matrixSortDirection: "desc",
  matrixHeatmapEnabled: true
};

// Distinct colors matching CSS tokens / spec
const SPEC_COLORS = {
  index: "oklch(0.32 0.07 245)",
  funds: [
    "oklch(0.62 0.15 40)",   // #1 Orange/Coral
    "oklch(0.55 0.13 158)",  // #2 Green
    "oklch(0.72 0.14 85)",   // #3 Amber/Yellow
    "oklch(0.55 0.15 300)",  // #4 Purple/Magenta
    "oklch(0.6 0.12 200)"    // #5 Cyan/Teal
  ],
  h2hPalette: [
    "#0284c7", // Sky Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#ef4444"  // Red
  ]
};

let yearlyBarChartInstance = null;
let growthLineChartInstance = null;
let headToHeadChartInstance = null;

// ============================================================================
// Growth Compounding Helper (as required by Spec Section 4)
// ============================================================================
function getStartYearForPeriod(p = state.period) {
  switch (p) {
    case "10Y": return 2017;
    case "5Y": return 2022;
    case "3Y": return 2024;
    case "2Y": return 2025;
    case "2026": return 2026;
    case "20Y":
    default: return 2007;
  }
}

function growth(yearly, startYear, amount) {
  let v = amount;
  const out = [{ year: startYear - 1, value: amount }];
  for (let y = startYear; y <= 2026; y++) {
    v *= 1 + (Number(yearly[y] || 0) / 100);
    out.push({ year: y, value: Math.round(v) });
  }
  return out;
}

const finalValue = (yearly, start, amt) => growth(yearly, start, amt).at(-1).value;

function getPeriodReturn(item, p = state.period) {
  switch (p) {
    case "10Y": return item.metrics.cagr10;
    case "5Y": return item.metrics.cagr5;
    case "3Y": return item.metrics.cagr3;
    case "2Y": return item.metrics.cagr2;
    case "2026": return Number(item.yearlyReturns["2026"] || 0);
    case "20Y":
    default: return item.metrics.cagr20;
  }
}

// Formatting helpers
function formatGBP(val) {
  return "£" + Math.round(val).toLocaleString("en-GB");
}

function formatCAGR(val) {
  return val.toFixed(2) + "%";
}

function formatYearlyPct(val) {
  const n = Number(val || 0);
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}

// Toast helper
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("visible");
  setTimeout(() => {
    toast.classList.remove("visible");
    toast.classList.add("hidden");
  }, 2200);
}

// Clipboard copy helper
function copyToClipboard(text, label) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copied ${label || text}`);
  }).catch(() => {
    // Fallback prompt
    showToast(`Copied ${text}`);
  });
}

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  if (window.UK_PASSIVE_INDEXES && window.UK_PASSIVE_INDEXES.length > 0) {
    state.selectedIndexId = window.UK_PASSIVE_INDEXES[0].id;
  }
  
  initVisitorCounter();
  initDisclaimer();
  initKPIs();
  bindGlobalControls();
  bindSidebarEvents();
  bindCompareEvents();
  
  renderAll();
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

function initVisitorCounter() {
  const countDisplay = document.getElementById("visitor-count-number");
  if (!countDisplay) return;

  let totalVisits = parseInt(localStorage.getItem("uk_passive_trackers_real_visits"), 10);
  if (isNaN(totalVisits) || totalVisits < 1) totalVisits = 1;

  if (!sessionStorage.getItem("uk_passive_trackers_session_counted")) {
    totalVisits += 1;
    localStorage.setItem("uk_passive_trackers_real_visits", totalVisits.toString());
    sessionStorage.setItem("uk_passive_trackers_session_counted", "true");
  }
  countDisplay.textContent = totalVisits.toLocaleString("en-GB");

  fetch("https://api.visitorbadge.io/api/visitors?path=anildutta007-uk-passive-tracker-indexes")
    .then(res => res.text())
    .then(svgText => {
      const match =
        svgText.match(/<text[^>]*font-weight="bold"[^>]*>(\d+)<\/text>/i) ||
        svgText.match(/<title>VISITORS:\s*(\d+)<\/title>/i) ||
        svgText.match(/aria-label="VISITORS:\s*(\d+)"/i);
      if (match && match[1]) {
        const hits = parseInt(match[1], 10);
        if (!isNaN(hits) && hits > totalVisits) {
          totalVisits = hits;
          localStorage.setItem("uk_passive_trackers_real_visits", totalVisits.toString());
          countDisplay.textContent = totalVisits.toLocaleString("en-GB");
        }
      }
    })
    .catch(() => {});
}

function initDisclaimer() {
  const bar = document.getElementById("disclaimer-bar");
  const btn = document.getElementById("btn-dismiss-disclaimer");
  if (sessionStorage.getItem("uk_disclaimer_dismissed") === "true") {
    if (bar) bar.style.display = "none";
  }
  if (btn && bar) {
    btn.addEventListener("click", () => {
      bar.style.display = "none";
      sessionStorage.setItem("uk_disclaimer_dismissed", "true");
    });
  }
}

function initKPIs() {
  const sorted = [...window.UK_PASSIVE_INDEXES].sort((a, b) => b.metrics.cagr20 - a.metrics.cagr20);
  if (sorted.length > 0) {
    const top = sorted[0];
    const cagrEl = document.getElementById("kpi-best-index-cagr");
    const nameEl = document.getElementById("kpi-best-index-name");
    if (cagrEl) cagrEl.textContent = `${top.metrics.cagr20.toFixed(2)}% p.a.`;
    if (nameEl) {
      const potVal = finalValue(top.yearlyReturns, 2007, 10000);
      nameEl.textContent = `${top.name} (10Y: ${top.metrics.cagr10.toFixed(1)}%) · ${formatGBP(potVal)} on £10k`;
    }
  }
}

function bindGlobalControls() {
  // Period toggle buttons
  const periodBtns = document.querySelectorAll(".period-btn");
  periodBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      periodBtns.forEach(b => {
        b.classList.remove("bg-white", "text-slate-900", "shadow-xs", "font-bold");
        b.classList.add("text-slate-600", "font-semibold");
      });
      btn.classList.add("bg-white", "text-slate-900", "shadow-xs", "font-bold");
      btn.classList.remove("text-slate-600", "font-semibold");
      
      state.period = btn.dataset.period;
      
      // Update sidebar sort select if on period_desc
      renderSidebar();
      renderDetail();
      if (state.currentTab === "compare") {
        renderCompareTab();
      }
    });
  });

  // Invest amount input
  const amountInput = document.getElementById("invest-amount-input");
  if (amountInput) {
    amountInput.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      state.investAmount = isNaN(val) || val < 0 ? 0 : val;
      renderDetailStats();
      renderTop5Section();
      renderCharts();
      if (state.currentTab === "compare") {
        renderCompareTab();
      }
    });
  }

  // Export CSV button
  const csvBtn = document.getElementById("btn-export-csv");
  if (csvBtn) {
    csvBtn.addEventListener("click", exportFullDatasetCSV);
  }

  // Tab buttons
  const tabExplore = document.getElementById("tab-btn-explore");
  const tabCompare = document.getElementById("tab-btn-compare");
  const secExplore = document.getElementById("tab-explore");
  const secCompare = document.getElementById("tab-compare");

  if (tabExplore && tabCompare) {
    tabExplore.addEventListener("click", () => {
      state.currentTab = "explore";
      tabExplore.classList.add("active");
      tabExplore.style.borderColor = "var(--primary)";
      tabExplore.style.color = "var(--primary)";
      tabCompare.classList.remove("active");
      tabCompare.style.borderColor = "transparent";
      tabCompare.style.color = "";
      
      secExplore.classList.remove("hidden");
      secCompare.classList.add("hidden");
      renderDetail();
    });

    tabCompare.addEventListener("click", () => {
      state.currentTab = "compare";
      tabCompare.classList.add("active");
      tabCompare.style.borderColor = "var(--primary)";
      tabCompare.style.color = "var(--primary)";
      tabExplore.classList.remove("active");
      tabExplore.style.borderColor = "transparent";
      tabExplore.style.color = "";
      
      secCompare.classList.remove("hidden");
      secExplore.classList.add("hidden");
      renderCompareTab();
    });
  }
}

function bindSidebarEvents() {
  const searchInput = document.getElementById("sidebar-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = (e.target.value || "").trim().toLowerCase();
      renderSidebar();
    });
  }

  const regionChips = document.querySelectorAll(".sidebar-region-chip");
  regionChips.forEach(chip => {
    chip.addEventListener("click", () => {
      regionChips.forEach(c => {
        c.classList.remove("bg-slate-900", "text-white", "font-bold");
        c.classList.add("bg-slate-100", "text-slate-600", "font-semibold");
      });
      chip.classList.add("bg-slate-900", "text-white", "font-bold");
      chip.classList.remove("bg-slate-100", "text-slate-600", "font-semibold");
      
      state.regionFilter = chip.dataset.region;
      renderSidebar();
    });
  });

  const sortSelect = document.getElementById("sidebar-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      state.sidebarSort = e.target.value;
      renderSidebar();
    });
  }
}

function bindCompareEvents() {
  const heatmapToggle = document.getElementById("matrix-heatmap-toggle");
  if (heatmapToggle) {
    heatmapToggle.addEventListener("change", (e) => {
      state.matrixHeatmapEnabled = e.target.checked;
      renderMasterMatrix();
    });
  }
}

// ============================================================================
// Render Master Dispatcher
// ============================================================================
function renderAll() {
  renderSidebar();
  renderDetail();
  if (state.currentTab === "compare") {
    renderCompareTab();
  }
}

// ============================================================================
// 6.1 Sidebar: Search, Filter, Sort & Compact Sparkline Rows
// ============================================================================
function getFilteredAndSortedIndexes() {
  let list = [...window.UK_PASSIVE_INDEXES];

  // Search filter
  if (state.searchQuery) {
    const q = state.searchQuery;
    list = list.filter(idx => {
      return (
        idx.name.toLowerCase().includes(q) ||
        idx.shortName.toLowerCase().includes(q) ||
        idx.category.toLowerCase().includes(q) ||
        idx.cheapestTrackers.some(t => t.name.toLowerCase().includes(q) || t.ticker.toLowerCase().includes(q))
      );
    });
  }

  // Region filter
  if (state.regionFilter !== "All") {
    switch (state.regionFilter) {
      case "Global":
        list = list.filter(idx => idx.region.startsWith("Global"));
        break;
      case "US":
        list = list.filter(idx => idx.region === "North America");
        break;
      case "UK":
        list = list.filter(idx => idx.region === "United Kingdom");
        break;
      case "Other":
        list = list.filter(idx => idx.region !== "North America" && idx.region !== "United Kingdom" && !idx.region.startsWith("Global"));
        break;
    }
  }

  // Sort
  list.sort((a, b) => {
    switch (state.sidebarSort) {
      case "period_desc":
        return getPeriodReturn(b) - getPeriodReturn(a);
      case "cagr20_desc":
        return b.metrics.cagr20 - a.metrics.cagr20;
      case "cagr10_desc":
        return b.metrics.cagr10 - a.metrics.cagr10;
      case "cagr5_desc":
        return b.metrics.cagr5 - a.metrics.cagr5;
      case "cagr3_desc":
        return b.metrics.cagr3 - a.metrics.cagr3;
      case "cagr2_desc":
        return b.metrics.cagr2 - a.metrics.cagr2;
      case "ytd_desc":
        return Number(b.yearlyReturns["2026"] || 0) - Number(a.yearlyReturns["2026"] || 0);
      case "ocf_asc":
        return a.lowestOcf - b.lowestOcf || b.metrics.cagr20 - a.metrics.cagr20;
      default:
        return getPeriodReturn(b) - getPeriodReturn(a);
    }
  });

  return list;
}

function renderSidebar() {
  const container = document.getElementById("sidebar-index-list");
  const countEl = document.getElementById("sidebar-index-count");
  if (!container) return;

  const list = getFilteredAndSortedIndexes();
  if (countEl) countEl.textContent = `${list.length} index${list.length === 1 ? "" : "es"}`;

  if (list.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">No index matches.</div>`;
    return;
  }

  container.innerHTML = list.map(idx => {
    const isSelected = idx.id === state.selectedIndexId;
    const periodVal = getPeriodReturn(idx);
    const isPos = periodVal >= 0;

    // Mini 20-bar sparkline (2007..2026)
    const sparkbars = window.YEARS_20.map(yr => {
      const val = Number(idx.yearlyReturns[yr] || 0);
      const isUp = val >= 0;
      const heightPx = Math.min(18, Math.max(3, Math.round(Math.abs(val) / 2.8)));
      const color = isUp ? "var(--positive)" : "var(--negative)";
      return `<span class="sparkline-bar" style="height:${heightPx}px; background-color:${color}; vertical-align:${isUp ? 'bottom' : 'top'};" title="${yr}: ${formatYearlyPct(val)}"></span>`;
    }).join("");

    return `
      <div onclick="selectIndex('${idx.id}')"
           class="p-2.5 rounded-lg border cursor-pointer transition flex flex-col gap-1.5 ${
             isSelected 
               ? "bg-white border-slate-900 ring-2 ring-slate-900/10 shadow-xs" 
               : "bg-white hover:bg-slate-50 border-slate-200"
           }">
        <div class="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
          <span>#${idx.returnRank} · ${idx.category}</span>
          <span>OCF ${idx.lowestOcf.toFixed(2)}%</span>
        </div>

        <div class="flex items-center justify-between gap-2">
          <h4 class="text-xs font-bold text-slate-900 truncate" title="${idx.name}">
            ${idx.name}
          </h4>
          <span class="text-xs font-black font-mono-num shrink-0 ${isPos ? "text-emerald-700" : "text-rose-700"}">
            ${formatYearlyPct(periodVal)}
          </span>
        </div>

        <!-- Mini 20-bar sparkline (zero line in middle) -->
        <div class="h-5 flex items-center justify-center overflow-hidden border-t border-slate-100 pt-1" title="20-Year Returns (2007–2026)">
          <div class="flex items-center h-4">
            ${sparkbars}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function selectIndex(id) {
  state.selectedIndexId = id;
  state.selectedOverlayFundRank = 1; // Default to #1 fund overlay
  state.accordionOpenRank = 1;
  renderSidebar();
  renderDetail();
}

// ============================================================================
// 6.2 – 6.5 Detail Panel Rendering
// ============================================================================
function renderDetail() {
  const idx = window.UK_PASSIVE_INDEXES.find(x => x.id === state.selectedIndexId) || window.UK_PASSIVE_INDEXES[0];
  if (!idx) return;

  // Header badges & descriptions
  const catEl = document.getElementById("detail-category-badge");
  const regEl = document.getElementById("detail-region-badge");
  const constEl = document.getElementById("detail-constituents-badge");
  const nameEl = document.getElementById("detail-index-name");
  const descEl = document.getElementById("detail-index-desc");

  if (catEl) catEl.textContent = idx.category;
  if (regEl) regEl.textContent = idx.region;
  if (constEl) constEl.textContent = `${idx.constituentsCount.toLocaleString()} Constituents`;
  if (nameEl) nameEl.textContent = idx.name;
  if (descEl) descEl.textContent = idx.description;

  renderDetailStats(idx);
  renderTrackers(idx);
  renderCharts(idx);
  renderTop5Section(idx);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderDetailStats(idx = getSelectedIndex()) {
  const startYr = getStartYearForPeriod();
  const potVal = finalValue(idx.yearlyReturns, startYr, state.investAmount);
  const cumPct = +(((potVal / (state.investAmount || 1)) - 1) * 100).toFixed(1);

  const cagr20El = document.getElementById("detail-tile-cagr20");
  const grewLabel = document.getElementById("detail-tile-grew-label");
  const grewVal = document.getElementById("detail-tile-grew-val");
  const cumPctEl = document.getElementById("detail-tile-cum-pct");
  const cagr105El = document.getElementById("detail-tile-cagr-10-5");
  const cagr32El = document.getElementById("detail-tile-cagr-3-2");
  const posYearsEl = document.getElementById("detail-tile-pos-years");
  const posSubEl = document.getElementById("detail-tile-pos-sub");

  if (cagr20El) cagr20El.textContent = formatCAGR(idx.metrics.cagr20);
  if (grewLabel) grewLabel.textContent = `${formatGBP(state.investAmount)} grew to (${state.period})`;
  if (grewVal) grewVal.textContent = formatGBP(potVal);
  if (cumPctEl) cumPctEl.textContent = `+${cumPct.toLocaleString()}% cumulative`;
  if (cagr105El) cagr105El.textContent = `${idx.metrics.cagr10.toFixed(2)}% · ${idx.metrics.cagr5.toFixed(2)}%`;
  if (cagr32El) cagr32El.textContent = `3Y: ${idx.metrics.cagr3.toFixed(2)}% · 2Y: ${idx.metrics.cagr2.toFixed(2)}%`;
  if (posYearsEl) posYearsEl.textContent = `${idx.metrics.posYears} / 20`;
  if (posSubEl) {
    const pct = Math.round((idx.metrics.posYears / 20) * 100);
    posSubEl.textContent = `${pct}% · best ${formatYearlyPct(idx.metrics.bestYear.val)} · worst ${formatYearlyPct(idx.metrics.worstYear.val)}`;
    posSubEl.title = `${pct}% · best ${idx.metrics.bestYear.year} (${formatYearlyPct(idx.metrics.bestYear.val)}) · worst ${idx.metrics.worstYear.year} (${formatYearlyPct(idx.metrics.worstYear.val)})`;
  }
}

function renderTrackers(idx = getSelectedIndex()) {
  const container = document.getElementById("detail-tracker-cards");
  if (!container) return;

  const trackers = idx.cheapestTrackers || [];
  container.innerHTML = trackers.map((t, i) => {
    const isCheapest = i === 0;
    return `
      <div class="rounded-xl p-3.5 border transition flex flex-col justify-between ${
        isCheapest ? "bg-emerald-50/40 border-emerald-300" : "bg-white border-slate-200"
      }">
        <div>
          <div class="flex items-center justify-between gap-1.5 mb-1.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
              isCheapest ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
            }">
              ${t.structure} ${isCheapest ? "· cheapest" : ""}
            </span>
            <span class="text-xs font-mono font-bold text-slate-900">
              OCF ${t.ocf.toFixed(2)}%
            </span>
          </div>
          <h4 class="text-xs font-bold text-slate-900 leading-snug">${t.name}</h4>
          <p class="text-[11px] text-slate-500 mt-0.5">${t.provider}</p>
        </div>

        <div class="mt-3 pt-2 border-t flex items-center justify-between gap-1 text-[11px]" style="border-color: var(--border);">
          <div class="flex items-center gap-1">
            <span class="text-slate-400 font-mono">Ticker:</span>
            <button onclick="copyToClipboard('${t.ticker}', '${t.ticker}')" class="px-1.5 py-0.5 rounded font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer text-[10px]" title="Click to copy ticker">
              ${t.ticker}
            </button>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-slate-400 font-mono">ISIN:</span>
            <button onclick="copyToClipboard('${t.isin}', '${t.isin}')" class="px-1.5 py-0.5 rounded font-mono font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer text-[10px]" title="Click to copy ISIN">
              ${t.isin.slice(0, 7)}...
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function getSelectedIndex() {
  return window.UK_PASSIVE_INDEXES.find(x => x.id === state.selectedIndexId) || window.UK_PASSIVE_INDEXES[0];
}

// ============================================================================
// 6.4 Charts: Annual % Bar Chart + Compounded Growth Line Chart
// ============================================================================
function renderCharts(idx = getSelectedIndex()) {
  renderOverlayChips(idx);
  renderYearlyBarChart(idx);
  renderGrowthLineChart(idx);
}

function renderOverlayChips(idx) {
  const container = document.getElementById("bar-chart-overlay-chips");
  if (!container) return;

  const chips = [
    { rank: 0, label: "Index only", color: "var(--primary)" },
    ...idx.topFunds.map(f => ({
      rank: f.rank,
      label: `#${f.rank} ${f.name.slice(0, 15)}...`,
      fullName: f.name,
      color: SPEC_COLORS.funds[f.rank - 1]
    }))
  ];

  container.innerHTML = chips.map(c => {
    const isSelected = state.selectedOverlayFundRank === c.rank;
    return `
      <button onclick="setOverlayFund(${c.rank})"
              title="${c.fullName || c.label}"
              class="px-2 py-0.5 text-[11px] font-bold rounded-md border transition cursor-pointer ${
                isSelected ? "text-white" : "text-slate-600 bg-white hover:bg-slate-50 border-slate-200"
              }"
              style="${isSelected ? `background-color: ${c.color}; border-color: ${c.color};` : ''}">
        ${c.label}
      </button>
    `;
  }).join("");
}

function setOverlayFund(rank) {
  state.selectedOverlayFundRank = rank;
  renderCharts();
}

function renderYearlyBarChart(idx) {
  const ctx = document.getElementById("yearlyBarChart");
  if (!ctx) return;

  const labels = window.YEARS_20.map(y => `'${y.slice(2)}`);
  const indexReturns = window.YEARS_20.map(y => Number(idx.yearlyReturns[y] || 0));

  const datasets = [
    {
      label: idx.shortName,
      data: indexReturns,
      backgroundColor: indexReturns.map(v => v >= 0 ? "rgba(15, 23, 42, 0.85)" : "rgba(225, 29, 72, 0.85)"),
      borderRadius: 2
    }
  ];

  if (state.selectedOverlayFundRank > 0) {
    const fund = idx.topFunds.find(f => f.rank === state.selectedOverlayFundRank);
    if (fund) {
      const fundReturns = window.YEARS_20.map(y => Number(fund.yearlyReturns[y] || 0));
      const fundColor = SPEC_COLORS.funds[fund.rank - 1];
      datasets.push({
        label: `#${fund.rank}: ${fund.name}`,
        data: fundReturns,
        backgroundColor: fundColor,
        borderRadius: 2
      });
    }
  }

  if (yearlyBarChartInstance) yearlyBarChartInstance.destroy();

  yearlyBarChartInstance = new Chart(ctx, {
    type: "bar",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: datasets.length > 1, position: "top", labels: { boxWidth: 10, font: { size: 10 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatYearlyPct(ctx.raw)}`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: "IBM Plex Mono", size: 10 } } },
        y: {
          ticks: {
            font: { family: "IBM Plex Mono", size: 10 },
            callback: (v) => `${v}%`
          },
          grid: { color: "rgba(0,0,0,0.06)" }
        }
      }
    }
  });
}

function renderGrowthLineChart(idx) {
  const ctx = document.getElementById("growthChart");
  const titleEl = document.getElementById("growth-chart-title");
  if (!ctx) return;

  const startYr = getStartYearForPeriod();
  if (titleEl) {
    titleEl.textContent = `${formatGBP(state.investAmount)} compounded growth (${state.period})`;
  }

  const indexSeries = growth(idx.yearlyReturns, startYr, state.investAmount);
  const labels = indexSeries.map(pt => pt.year);

  const datasets = [
    {
      label: `${idx.shortName} (Index)`,
      data: indexSeries.map(pt => pt.value),
      borderColor: "#0f172a",
      borderWidth: 2.2,
      borderDash: [5, 4],
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.15
    }
  ];

  idx.topFunds.forEach(f => {
    const fSeries = growth(f.yearlyReturns, startYr, state.investAmount);
    const color = SPEC_COLORS.funds[f.rank - 1];
    datasets.push({
      label: `#${f.rank} ${f.name}`,
      data: fSeries.map(pt => pt.value),
      borderColor: color,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.15
    });
  });

  if (growthLineChartInstance) growthLineChartInstance.destroy();

  growthLineChartInstance = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: { boxWidth: 12, font: { size: 10 }, padding: 8 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatGBP(ctx.raw)}`
          }
        }
      },
      scales: {
        x: { ticks: { font: { family: "IBM Plex Mono", size: 10 } }, grid: { display: false } },
        y: {
          ticks: {
            font: { family: "IBM Plex Mono", size: 10 },
            callback: (v) => v >= 1000000 ? `£${(v/1000000).toFixed(1)}M` : `£${Math.round(v/1000)}k`
          },
          grid: { color: "rgba(0,0,0,0.06)" }
        }
      }
    }
  });
}

// ============================================================================
// 6.5 Top 5 Funds Section: Cards (Accordion) | Table View
// ============================================================================
function renderTop5Section(idx = getSelectedIndex()) {
  const indexNameEl = document.getElementById("top5-index-name");
  const cagrBadge = document.getElementById("top5-benchmark-cagr-badge");
  const thAmountCol = document.getElementById("th-top5-amount-col");

  if (indexNameEl) indexNameEl.textContent = idx.name;
  if (cagrBadge) cagrBadge.textContent = `20Y: ${idx.metrics.cagr20.toFixed(2)}% p.a. | 10Y: ${idx.metrics.cagr10.toFixed(2)}% p.a.`;
  if (thAmountCol) thAmountCol.textContent = `${formatGBP(state.investAmount)} (${state.period})`;

  const btnCards = document.getElementById("view-toggle-cards");
  const btnTable = document.getElementById("view-toggle-table");
  const secCards = document.getElementById("top5-cards-view");
  const secTable = document.getElementById("top5-table-view");

  if (btnCards && btnTable && secCards && secTable) {
    btnCards.onclick = () => {
      state.top5ViewMode = "cards";
      btnCards.classList.add("bg-slate-900", "text-white", "font-bold");
      btnCards.classList.remove("text-slate-600", "font-semibold");
      btnTable.classList.remove("bg-slate-900", "text-white", "font-bold");
      btnTable.classList.add("text-slate-600", "font-semibold");
      secCards.classList.remove("hidden");
      secTable.classList.add("hidden");
    };

    btnTable.onclick = () => {
      state.top5ViewMode = "table";
      btnTable.classList.add("bg-slate-900", "text-white", "font-bold");
      btnTable.classList.remove("text-slate-600", "font-semibold");
      btnCards.classList.remove("bg-slate-900", "text-white", "font-bold");
      btnCards.classList.add("text-slate-600", "font-semibold");
      secTable.classList.remove("hidden");
      secCards.classList.add("hidden");
    };
  }

  // Bind Top 3 / Top 5 Toggle
  const btnTop3 = document.getElementById("fund-count-top3");
  const btnTop5 = document.getElementById("fund-count-top5");
  if (btnTop3 && btnTop5) {
    btnTop3.onclick = () => {
      state.fundDisplayLimit = 3;
      btnTop3.classList.add("bg-slate-900", "text-white", "font-bold");
      btnTop3.classList.remove("text-slate-600", "font-semibold");
      btnTop5.classList.remove("bg-slate-900", "text-white", "font-bold");
      btnTop5.classList.add("text-slate-600", "font-semibold");
      renderTop5Section(idx);
    };

    btnTop5.onclick = () => {
      state.fundDisplayLimit = 5;
      btnTop5.classList.add("bg-slate-900", "text-white", "font-bold");
      btnTop5.classList.remove("text-slate-600", "font-semibold");
      btnTop3.classList.remove("bg-slate-900", "text-white", "font-bold");
      btnTop3.classList.add("text-slate-600", "font-semibold");
      renderTop5Section(idx);
    };
  }

  renderTop5Cards(idx);
  renderTop5Table(idx);
}

function renderTop5Cards(idx) {
  const container = document.getElementById("top5-cards-view");
  if (!container) return;

  const startYr = getStartYearForPeriod();
  const indexFinal = finalValue(idx.yearlyReturns, startYr, state.investAmount);

  const displayedFunds = idx.topFunds.slice(0, state.fundDisplayLimit);

  container.innerHTML = displayedFunds.map(f => {
    const isOpen = state.accordionOpenRank === f.rank;
    const color = SPEC_COLORS.funds[f.rank - 1];
    const fundFinal = finalValue(f.yearlyReturns, startYr, state.investAmount);
    const extraVsIndex = fundFinal - indexFinal;

    return `
      <div class="rounded-xl border transition overflow-hidden bg-white ${
        isOpen ? "border-slate-400 shadow-sm" : "border-slate-200"
      }">
        <!-- Collapsed Row Header -->
        <button type="button" onclick="toggleAccordion(${f.rank})"
                class="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition cursor-pointer">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0"
                  style="background-color: ${color}">
              ${f.rank === 1 ? '<i data-lucide="trophy" class="w-4 h-4 text-white"></i>' : `#${f.rank}`}
            </span>
            <div class="min-w-0">
              <h4 class="text-sm font-bold text-slate-900 truncate">${f.name}</h4>
              <p class="text-[11px] text-slate-500 truncate">${f.house} · ${f.vehicleType}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <div class="text-right hidden sm:block">
              <span class="text-xs font-mono font-black text-slate-900">${f.metrics.cagr20.toFixed(2)}%</span>
              <span class="text-[10px] text-slate-400 block font-mono">20Y CAGR</span>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              +${f.alphaAnnual.toFixed(2)}% p.a. alpha
            </span>
            <i data-lucide="${isOpen ? 'chevron-up' : 'chevron-down'}" class="w-4 h-4 text-slate-400 transition-transform"></i>
          </div>
        </button>

        <!-- Expanded Body -->
        ${isOpen ? `
          <div class="p-4 border-t bg-slate-50/50 space-y-3" style="border-color: var(--border);">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div class="p-2.5 rounded bg-white border border-slate-200">
                <span class="text-[10px] uppercase font-bold text-slate-400 block font-mono">20Y CAGR (07–26)</span>
                <span class="text-sm font-black font-mono-num text-slate-900">${f.metrics.cagr20.toFixed(2)}%</span>
                <span class="text-[10px] text-emerald-600 font-semibold block font-mono">vs ${idx.metrics.cagr20.toFixed(2)}%</span>
              </div>
              <div class="p-2.5 rounded bg-white border border-slate-200">
                <span class="text-[10px] uppercase font-bold text-slate-400 block font-mono">10Y CAGR (17–26)</span>
                <span class="text-sm font-black font-mono-num text-indigo-700">${f.metrics.cagr10.toFixed(2)}%</span>
                <span class="text-[10px] text-indigo-600 font-semibold block font-mono">vs ${idx.metrics.cagr10.toFixed(2)}%</span>
              </div>
              <div class="p-2.5 rounded bg-white border border-slate-200">
                <span class="text-[10px] uppercase font-bold text-slate-400 block font-mono">5Y / 3Y / 2Y</span>
                <span class="text-xs font-bold font-mono-num text-slate-800">${f.metrics.cagr5.toFixed(1)}% · ${f.metrics.cagr3.toFixed(1)}%</span>
                <span class="text-[10px] text-slate-500 block font-mono">2Y: ${f.metrics.cagr2.toFixed(1)}%</span>
              </div>
              <div class="p-2.5 rounded bg-white border border-slate-200">
                <span class="text-[10px] uppercase font-bold text-slate-400 block font-mono">${formatGBP(state.investAmount)} → ${state.period}</span>
                <span class="text-sm font-black font-mono-num text-emerald-700">${formatGBP(fundFinal)}</span>
                <span class="text-[10px] ${extraVsIndex >= 0 ? 'text-emerald-600' : 'text-rose-600'} font-bold block font-mono">
                  ${extraVsIndex >= 0 ? '+' : ''}${formatGBP(extraVsIndex)} vs index
                </span>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div class="p-2 rounded bg-white border border-slate-200">
                <span class="text-slate-400 text-[10px] block font-mono">Ongoing Charge (OCF):</span>
                <span class="font-bold text-slate-900 font-mono">${f.ocf.toFixed(2)}%</span>
                <span class="text-[10px] text-slate-500 block">Ticker / ISIN: ${f.ticker}</span>
              </div>
              <div class="p-2 rounded bg-white border border-slate-200">
                <span class="text-slate-400 text-[10px] block font-mono">Years Beat Index:</span>
                <span class="font-bold text-emerald-700 font-mono">${f.yearsBeatIndex} / 20</span>
                <span class="text-[10px] text-slate-500 block">Manager: ${f.manager}</span>
              </div>
              <div class="p-2 rounded bg-white border border-slate-200 col-span-2 sm:col-span-1">
                <span class="text-slate-400 text-[10px] block font-mono">Vehicle Structure:</span>
                <span class="font-bold text-slate-900">${f.vehicleType}</span>
                <span class="text-[10px] text-slate-500 block">${f.house}</span>
              </div>
            </div>

            <div class="p-3 rounded bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <strong>Strategy &amp; Alpha Rationale:</strong> ${f.strategyNote}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }).join("");
}

function toggleAccordion(rank) {
  state.accordionOpenRank = state.accordionOpenRank === rank ? 0 : rank;
  renderTop5Cards(getSelectedIndex());
  if (window.lucide) window.lucide.createIcons();
}

function renderTop5Table(idx) {
  const tbody = document.getElementById("top5-comparison-tbody");
  if (!tbody) return;

  const startYr = getStartYearForPeriod();
  const indexFinal = finalValue(idx.yearlyReturns, startYr, state.investAmount);

  // Baseline row (shaded)
  const baselineRow = `
    <tr class="bg-slate-900 text-white font-bold">
      <td class="py-2.5 px-3 font-mono text-[11px] uppercase text-amber-300">INDEX</td>
      <td class="py-2.5 px-3">${idx.name} <span class="text-slate-400 font-normal">(Passive Benchmark)</span></td>
      <td class="py-2.5 px-3 text-slate-300">Passive Tracker (${idx.cheapestTrackers[0].provider})</td>
      <td class="py-2.5 px-3 font-mono text-slate-300">${idx.cheapestTrackers[0].ticker}</td>
      <td class="py-2.5 px-2 text-right font-mono text-emerald-300">${idx.lowestOcf.toFixed(2)}%</td>
      <td class="py-2.5 px-2 text-right font-mono text-white font-bold">${idx.metrics.cagr20.toFixed(2)}%</td>
      <td class="py-2.5 px-2 text-right font-mono text-slate-400">Baseline</td>
      <td class="py-2.5 px-2 text-right font-mono text-cyan-300">${idx.metrics.cagr10.toFixed(2)}%</td>
      <td class="py-2.5 px-2 text-right font-mono text-slate-300">${idx.metrics.cagr5.toFixed(2)}%</td>
      <td class="py-2.5 px-2 text-right font-mono text-teal-300">${idx.metrics.cagr3.toFixed(2)}%</td>
      <td class="py-2.5 px-2 text-right font-mono text-amber-300">${idx.metrics.cagr2.toFixed(2)}%</td>
      <td class="py-2.5 px-2.5 text-right font-mono text-amber-300">${formatGBP(indexFinal)}</td>
      <td class="py-2.5 px-2 text-right font-mono text-slate-400">—</td>
      <td class="py-2.5 px-2 text-center font-mono text-slate-300">Benchmark</td>
    </tr>
  `;

  const displayedFunds = idx.topFunds.slice(0, state.fundDisplayLimit);
  const fundRows = displayedFunds.map(f => {
    const fundFinal = finalValue(f.yearlyReturns, startYr, state.investAmount);
    const extraVsIndex = fundFinal - indexFinal;
    const color = SPEC_COLORS.funds[f.rank - 1];

    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="py-2.5 px-3 font-mono font-bold text-slate-900">
          <span class="inline-flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${color}"></span>
            #${f.rank}
          </span>
        </td>
        <td class="py-2.5 px-3 font-bold text-slate-900">
          <div>${f.name}</div>
          <div class="text-[10px] font-normal text-slate-500">Manager: ${f.manager}</div>
        </td>
        <td class="py-2.5 px-3 text-slate-600">
          <div class="font-semibold text-slate-800">${f.house}</div>
          <div class="text-[10px] text-slate-500">${f.vehicleType}</div>
        </td>
        <td class="py-2.5 px-3 font-mono text-slate-700">${f.ticker}</td>
        <td class="py-2.5 px-2 text-right font-mono text-slate-700">${f.ocf.toFixed(2)}%</td>
        <td class="py-2.5 px-2 text-right font-mono font-extrabold text-emerald-700 bg-emerald-50/50">${f.metrics.cagr20.toFixed(2)}%</td>
        <td class="py-2.5 px-2 text-right font-mono font-bold text-emerald-600">+${f.alphaAnnual.toFixed(2)}%</td>
        <td class="py-2.5 px-2 text-right font-mono font-bold text-indigo-700 bg-indigo-50/40">${f.metrics.cagr10.toFixed(2)}%</td>
        <td class="py-2.5 px-2 text-right font-mono font-semibold text-slate-700">${f.metrics.cagr5.toFixed(2)}%</td>
        <td class="py-2.5 px-2 text-right font-mono font-bold text-cyan-800">${f.metrics.cagr3.toFixed(2)}%</td>
        <td class="py-2.5 px-2 text-right font-mono font-bold text-amber-800">${f.metrics.cagr2.toFixed(2)}%</td>
        <td class="py-2.5 px-2.5 text-right font-mono font-black text-slate-900">${formatGBP(fundFinal)}</td>
        <td class="py-2.5 px-2 text-right font-mono font-bold ${extraVsIndex >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
          ${extraVsIndex >= 0 ? '+' : ''}${formatGBP(extraVsIndex)}
        </td>
        <td class="py-2.5 px-2 text-center font-mono font-bold text-slate-700">${f.yearsBeatIndex} / 20</td>
      </tr>
    `;
  }).join("");

  tbody.innerHTML = baselineRow + fundRows;
}

// ============================================================================
// 7. Compare All 15 Tab: Head-to-Head Chart & Master Matrix
// ============================================================================
function renderCompareTab() {
  renderHeadToHeadSection();
  renderMasterMatrix();
  if (window.lucide) window.lucide.createIcons();
}

function renderHeadToHeadSection() {
  const titleEl = document.getElementById("head-to-head-title");
  const subEl = document.getElementById("head-to-head-subtitle");
  const chipsContainer = document.getElementById("h2h-index-chips");

  const startYr = getStartYearForPeriod();
  if (titleEl) titleEl.textContent = `Head-to-head growth of ${formatGBP(state.investAmount)}`;
  if (subEl) subEl.textContent = `Pick up to 4 indexes · ${startYr}–2026 (Dividends reinvested, GBP)`;

  if (chipsContainer) {
    chipsContainer.innerHTML = window.UK_PASSIVE_INDEXES.map((idx, i) => {
      const isSelected = state.selectedH2HIndexes.includes(idx.id);
      const colorIndex = state.selectedH2HIndexes.indexOf(idx.id);
      const color = colorIndex >= 0 ? SPEC_COLORS.h2hPalette[colorIndex % SPEC_COLORS.h2hPalette.length] : "";

      return `
        <button type="button" onclick="toggleH2HIndex('${idx.id}')"
                class="px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                  isSelected ? "text-white shadow-xs" : "bg-white text-slate-700 hover:bg-slate-50 border-slate-300"
                }"
                style="${isSelected ? `background-color:${color}; border-color:${color};` : ''}">
          ${idx.shortName}
        </button>
      `;
    }).join("");
  }

  renderHeadToHeadChart();
}

function toggleH2HIndex(id) {
  const idx = state.selectedH2HIndexes.indexOf(id);
  if (idx >= 0) {
    if (state.selectedH2HIndexes.length > 1) {
      state.selectedH2HIndexes.splice(idx, 1);
    } else {
      showToast("Keep at least 1 index selected");
      return;
    }
  } else {
    if (state.selectedH2HIndexes.length >= 4) {
      // Drop oldest (first)
      state.selectedH2HIndexes.shift();
    }
    state.selectedH2HIndexes.push(id);
  }
  renderHeadToHeadSection();
}

function renderHeadToHeadChart() {
  const ctx = document.getElementById("headToHeadChart");
  if (!ctx) return;

  const startYr = getStartYearForPeriod();
  const labels = [];
  for (let y = startYr - 1; y <= 2026; y++) labels.push(y);

  const datasets = state.selectedH2HIndexes.map((id, i) => {
    const item = window.UK_PASSIVE_INDEXES.find(x => x.id === id);
    if (!item) return null;
    const series = growth(item.yearlyReturns, startYr, state.investAmount);
    const color = SPEC_COLORS.h2hPalette[i % SPEC_COLORS.h2hPalette.length];

    return {
      label: item.name,
      data: series.map(pt => pt.value),
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2.5,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.15
    };
  }).filter(Boolean);

  if (headToHeadChartInstance) headToHeadChartInstance.destroy();

  headToHeadChartInstance = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: { boxWidth: 12, font: { size: 11, family: "IBM Plex Sans" }, padding: 12 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatGBP(ctx.raw)}`
          }
        }
      },
      scales: {
        x: { ticks: { font: { family: "IBM Plex Mono", size: 10 } }, grid: { display: false } },
        y: {
          ticks: {
            font: { family: "IBM Plex Mono", size: 10 },
            callback: (v) => v >= 1000000 ? `£${(v/1000000).toFixed(1)}M` : `£${Math.round(v/1000)}k`
          },
          grid: { color: "rgba(0,0,0,0.06)" }
        }
      }
    }
  });
}

function renderMasterMatrix() {
  const thead = document.getElementById("master-matrix-thead");
  const tbody = document.getElementById("master-matrix-tbody");
  if (!thead || !tbody) return;

  const startYr = getStartYearForPeriod();

  // Columns: Rank & Index | 20Y | 10Y | 5Y | 3Y | 2Y | OCF | £{amount} ({period}) | 2007..2026
  const getHeader = (key, label, isRight = true) => {
    const isActive = state.matrixSortKey === key;
    const arrow = isActive ? (state.matrixSortDirection === "desc" ? " ↓" : " ↑") : "";
    return `
      <th onclick="sortMatrixBy('${key}')"
          class="py-2.5 px-2 cursor-pointer transition select-none hover:bg-slate-800 ${isRight ? 'text-right' : 'text-left'} ${
            isActive ? 'text-amber-300 font-extrabold bg-slate-800' : ''
          }">
        ${label}${arrow}
      </th>
    `;
  };

  const yearHeaders = window.YEARS_20.map(yr => `
    <th onclick="sortMatrixBy('${yr}')" class="py-2.5 px-2 text-right font-mono cursor-pointer hover:bg-slate-800 ${yr === '2026' ? 'bg-slate-800 text-amber-300' : ''}">
      ${yr}${state.matrixSortKey === yr ? (state.matrixSortDirection === "desc" ? "↓" : "↑") : ""}
    </th>
  `).join("");

  thead.innerHTML = `
    <th onclick="sortMatrixBy('rank')" class="py-2.5 px-3 text-left sticky-col bg-slate-900 min-w-[224px] cursor-pointer hover:bg-slate-800">
      Rank &amp; Index ${state.matrixSortKey === 'rank' ? (state.matrixSortDirection === 'asc' ? '↑' : '↓') : ''}
    </th>
    ${getHeader("cagr20", "20Y")}
    ${getHeader("cagr10", "10Y")}
    ${getHeader("cagr5", "5Y")}
    ${getHeader("cagr3", "3Y")}
    ${getHeader("cagr2", "2Y")}
    ${getHeader("lowestOcf", "OCF")}
    ${getHeader("amount", `${formatGBP(state.investAmount)} (${state.period})`)}
    ${yearHeaders}
  `;

  // Sort list
  const list = [...window.UK_PASSIVE_INDEXES];
  list.sort((a, b) => {
    let aVal, bVal;
    if (state.matrixSortKey === "rank") {
      aVal = a.returnRank;
      bVal = b.returnRank;
    } else if (state.matrixSortKey === "lowestOcf") {
      aVal = a.lowestOcf;
      bVal = b.lowestOcf;
    } else if (state.matrixSortKey === "amount") {
      aVal = finalValue(a.yearlyReturns, startYr, state.investAmount);
      bVal = finalValue(b.yearlyReturns, startYr, state.investAmount);
    } else if (["cagr20", "cagr10", "cagr5", "cagr3", "cagr2"].includes(state.matrixSortKey)) {
      aVal = a.metrics[state.matrixSortKey];
      bVal = b.metrics[state.matrixSortKey];
    } else if (window.YEARS_20.includes(state.matrixSortKey)) {
      aVal = Number(a.yearlyReturns[state.matrixSortKey] || 0);
      bVal = Number(b.yearlyReturns[state.matrixSortKey] || 0);
    } else {
      aVal = a.metrics.cagr20;
      bVal = b.metrics.cagr20;
    }

    if (state.matrixSortDirection === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  tbody.innerHTML = list.map(idx => {
    const isSelected = idx.id === state.selectedIndexId;
    const finalAmt = finalValue(idx.yearlyReturns, startYr, state.investAmount);

    const yearCells = window.YEARS_20.map(yr => {
      const val = Number(idx.yearlyReturns[yr] || 0);
      let bgStyle = "";
      if (state.matrixHeatmapEnabled) {
        const intensity = Math.min(0.5, Math.abs(val) / 60);
        if (val >= 0) {
          bgStyle = `background-color: oklch(0.55 0.13 158 / ${intensity.toFixed(2)}); color: #064e3b;`;
        } else {
          bgStyle = `background-color: oklch(0.58 0.19 27 / ${intensity.toFixed(2)}); color: #7f1d1d;`;
        }
      }
      return `
        <td class="py-2 px-1.5 text-right font-mono text-[11px] font-semibold" style="${bgStyle}">
          ${formatYearlyPct(val)}
        </td>
      `;
    }).join("");

    return `
      <tr onclick="switchToExploreAndSelect('${idx.id}')"
          class="cursor-pointer transition hover:bg-slate-100/70 ${isSelected ? 'ring-2 ring-inset ring-slate-900 bg-slate-50' : ''}">
        <td class="py-2.5 px-3 font-bold text-slate-900 sticky-col sticky-col-shadow bg-white">
          <div class="flex items-center justify-between gap-1.5">
            <div class="flex items-center gap-1.5 truncate">
              <span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-black ${
                idx.returnRank <= 3 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
              }">#${idx.returnRank}</span>
              <span class="truncate">${idx.shortName}</span>
            </div>
          </div>
          <div class="text-[10px] text-slate-500 font-mono font-normal">
            OCF: ${idx.lowestOcf.toFixed(2)}% · ${idx.category}
          </div>
        </td>
        <td class="py-2 px-2 text-right font-mono font-extrabold text-emerald-700 bg-emerald-50/50">${idx.metrics.cagr20.toFixed(2)}%</td>
        <td class="py-2 px-2 text-right font-mono font-bold text-slate-800">${idx.metrics.cagr10.toFixed(2)}%</td>
        <td class="py-2 px-2 text-right font-mono font-semibold text-slate-700">${idx.metrics.cagr5.toFixed(2)}%</td>
        <td class="py-2 px-2 text-right font-mono font-bold text-cyan-800">${idx.metrics.cagr3.toFixed(2)}%</td>
        <td class="py-2 px-2 text-right font-mono font-bold text-amber-800">${idx.metrics.cagr2.toFixed(2)}%</td>
        <td class="py-2 px-2 text-right font-mono font-semibold text-slate-700">${idx.lowestOcf.toFixed(2)}%</td>
        <td class="py-2 px-2.5 text-right font-mono font-black text-slate-900 bg-slate-50">${formatGBP(finalAmt)}</td>
        ${yearCells}
      </tr>
    `;
  }).join("");
}

function sortMatrixBy(key) {
  if (state.matrixSortKey === key) {
    state.matrixSortDirection = state.matrixSortDirection === "desc" ? "asc" : "desc";
  } else {
    state.matrixSortKey = key;
    // OCF and rank default to ascending
    state.matrixSortDirection = (key === "lowestOcf" || key === "rank") ? "asc" : "desc";
  }
  renderMasterMatrix();
}

function switchToExploreAndSelect(id) {
  state.selectedIndexId = id;
  const tabExplore = document.getElementById("tab-btn-explore");
  if (tabExplore) tabExplore.click();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================================================
// 7. CSV Export
// ============================================================================
function exportFullDatasetCSV() {
  const startYr = getStartYearForPeriod();
  const headers = [
    "Benchmark Index",
    "Row Type",
    "Rank",
    "Name",
    "Provider / House",
    "Vehicle Type",
    "Ticker / ISIN",
    "OCF %",
    "20-Yr CAGR % (2007-2026)",
    "Annual Alpha vs Index %",
    "10-Yr CAGR % (2017-2026)",
    "5-Yr CAGR % (2022-2026)",
    "3-Yr CAGR % (2024-2026)",
    "2-Yr CAGR % (2025-2026)",
    `Invested Compounded Value (${state.period})`,
    ...window.YEARS_20
  ];

  const rows = [headers.join(",")];

  window.UK_PASSIVE_INDEXES.forEach(idx => {
    const idxYears = window.YEARS_20.map(yr => idx.yearlyReturns[yr]);
    const finalAmt = finalValue(idx.yearlyReturns, startYr, state.investAmount);
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
      idx.metrics.cagr5,
      idx.metrics.cagr3,
      idx.metrics.cagr2,
      finalAmt,
      ...idxYears
    ].join(","));

    idx.topFunds.forEach(f => {
      const fYears = window.YEARS_20.map(yr => f.yearlyReturns[yr]);
      const fundFinal = finalValue(f.yearlyReturns, startYr, state.investAmount);
      rows.push([
        `"${idx.name}"`,
        `"Top 5 Outperforming Fund"`,
        `"#${f.rank}"`,
        `"${f.name}"`,
        `"${f.house}"`,
        `"${f.vehicleType}"`,
        `"${f.ticker}"`,
        f.ocf,
        f.metrics.cagr20,
        f.alphaAnnual,
        f.metrics.cagr10,
        f.metrics.cagr5,
        f.metrics.cagr3,
        f.metrics.cagr2,
        fundFinal,
        ...fYears
      ].join(","));
    });
  });

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "uk-passive-tracker-indexes-and-top5-funds.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
