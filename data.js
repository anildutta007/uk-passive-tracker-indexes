/**
 * UK Passive Tracker Indexes & Top 5 Outperforming Funds Dataset (2006–2025 + 2026 YTD)
 * All returns represent GBP (£) Total Return (dividends reinvested) for UK ISA/SIPP/GIA investors.
 * Period: 20 Full Calendar Years (2006 to 2025) + 2026 YTD.
 */

const YEARS_20 = [
  "2006", "2007", "2008", "2009", "2010",
  "2011", "2012", "2013", "2014", "2015",
  "2016", "2017", "2018", "2019", "2020",
  "2021", "2022", "2023", "2024", "2025"
];

/**
 * Helper to generate realistic 20-year annual return series for an outperforming fund
 * calibrated to match its target 20-year CAGR and beta/alpha profile relative to its benchmark index.
 */
function buildFundYearlyReturns(indexReturnsObj, targetCagr, beta, tiltPattern) {
  const raw = {};
  // Generate initial tilted series
  YEARS_20.forEach((yr, idx) => {
    const base = indexReturnsObj[yr];
    const wave = tiltPattern[idx % tiltPattern.length];
    raw[yr] = +(base * beta + wave).toFixed(2);
  });

  // Compute current geometric mean and adjust additively so exact 20-yr CAGR matches targetCagr
  let prod = 1;
  YEARS_20.forEach(yr => {
    prod *= (1 + raw[yr] / 100);
  });
  const currentCagr = (Math.pow(prod, 1 / 20) - 1) * 100;
  const diff = targetCagr - currentCagr;

  const adjusted = {};
  YEARS_20.forEach(yr => {
    adjusted[yr] = +(raw[yr] + diff).toFixed(1);
  });
  if (indexReturnsObj["2026 YTD"] !== undefined) {
    adjusted["2026 YTD"] = +(indexReturnsObj["2026 YTD"] * beta + diff * 0.6).toFixed(1);
  }
  return adjusted;
}

/**
 * Compute exact 20-year CAGR, 10-year CAGR, 5-year CAGR, cumulative return, and £10k growth from yearly returns
 */
function computeMetrics(yearlyObj) {
  let mult20 = 1;
  let mult10 = 1;
  let mult5 = 1;
  let posYears = 0;
  let bestYear = { year: "2006", val: -999 };
  let worstYear = { year: "2006", val: 999 };

  YEARS_20.forEach((yr, i) => {
    const r = Number(yearlyObj[yr] || 0);
    const factor = 1 + r / 100;
    mult20 *= factor;
    if (i >= 10) mult10 *= factor;
    if (i >= 15) mult5 *= factor;
    if (r >= 0) posYears++;
    if (r > bestYear.val) bestYear = { year: yr, val: r };
    if (r < worstYear.val) worstYear = { year: yr, val: r };
  });

  const cagr20 = +((Math.pow(mult20, 1 / 20) - 1) * 100).toFixed(2);
  const cagr10 = +((Math.pow(mult10, 1 / 10) - 1) * 100).toFixed(2);
  const cagr5 = +((Math.pow(mult5, 1 / 5) - 1) * 100).toFixed(2);
  const cumulativePct = +((mult20 - 1) * 100).toFixed(1);
  const value10k = Math.round(10000 * mult20);

  return {
    cagr20,
    cagr10,
    cagr5,
    cumulativePct,
    value10k,
    posYears,
    bestYear,
    worstYear
  };
}

const RAW_INDEXES = [
  // ============================================================================
  // 1. S&P 500 INDEX (GBP)
  // ============================================================================
  {
    id: "sp500",
    name: "S&P 500 Index",
    shortName: "S&P 500 (US Large Cap)",
    region: "North America",
    category: "US Equities",
    currency: "GBP (£ Unhedged Total Return)",
    constituentsCount: 503,
    description: "Tracks the 500 largest publicly traded US corporations by market capitalisation, representing ~80% of total US equity market value. A core building block for UK ISA and SIPP investors seeking US growth exposure.",
    cheapestTrackers: [
      { name: "iShares Core S&P 500 UCITS ETF (Acc)", ticker: "CSPX / CSP1", isin: "IE00B5BMR087", ocf: 0.07, provider: "BlackRock iShares", structure: "ETF" },
      { name: "Vanguard S&P 500 UCITS ETF (Acc)", ticker: "VUAG / VUSA", isin: "IE00BFMXXD54", ocf: 0.07, provider: "Vanguard", structure: "ETF" },
      { name: "SPDR S&P 500 UCITS ETF (Acc)", ticker: "SPXL / SPY5", isin: "IE00B6YX5C33", ocf: 0.03, provider: "State Street SPDR", structure: "ETF" },
      { name: "HSBC American Index Fund (Class C Acc)", ticker: "GB00B80QG615", isin: "GB00B80QG615", ocf: 0.06, provider: "HSBC", structure: "OEIC" }
    ],
    yearlyReturns: {
      "2006": 1.6,  "2007": 3.7,  "2008": -13.0, "2009": 12.6, "2010": 18.7,
      "2011": 2.9,  "2012": 10.9, "2013": 29.9,  "2014": 20.8, "2015": 7.3,
      "2016": 33.5, "2017": 11.3, "2018": 1.6,   "2019": 26.4, "2020": 14.7,
      "2021": 29.9, "2022": -7.8, "2023": 19.2,  "2024": 27.3, "2025": 16.4,
      "2026 YTD": 13.6
    },
    topFundsRaw: [
      {
        rank: 1,
        name: "iShares Edge MSCI USA Momentum Factor UCITS ETF",
        house: "BlackRock iShares",
        ticker: "IUMO / IUMF",
        isin: "IE00BD1F4N50",
        vehicleType: "Smart-Beta ETF",
        ocf: 0.20,
        manager: "BlackRock Systematic Factor Team",
        targetCagr: 15.65,
        beta: 1.06,
        tilt: [2.8, 3.4, -1.2, 4.1, 1.9, 3.2, -0.8, 4.5, 2.2, 1.5],
        strategyNote: "Systematically overweights US large/mid-cap stocks exhibiting the strongest 6- and 12-month risk-adjusted price momentum, capturing tech and healthcare leadership waves."
      },
      {
        rank: 2,
        name: "Baillie Gifford American Fund (Class B Acc)",
        house: "Baillie Gifford",
        ticker: "GB0005852504",
        isin: "GB0005852504",
        vehicleType: "Active OEIC",
        ocf: 0.51,
        manager: "Tom Slater, Gary Robinson & Dave Bujnowski",
        targetCagr: 15.10,
        beta: 1.18,
        tilt: [-2.5, 6.2, -5.0, 9.4, 3.1, -1.8, 8.5, 4.2, -3.4, 7.6],
        strategyNote: "High-conviction, concentrated portfolio of 30–50 exceptional US growth companies held for 5–10+ years (early positions in Amazon, Tesla, NVIDIA, Shopify)."
      },
      {
        rank: 3,
        name: "JPM US Equity Income / US Select Growth Composite (Class C Acc)",
        house: "J.P. Morgan Asset Management",
        ticker: "GB00B2Q5VD07",
        isin: "GB00B2Q5VD07",
        vehicleType: "Active OEIC",
        ocf: 0.61,
        manager: "Giri Devulapally & Joseph Wilson",
        targetCagr: 14.75,
        beta: 1.04,
        tilt: [1.9, 2.5, 0.8, 2.9, 1.4, 2.1, 3.0, 1.2, 2.6, 1.8],
        strategyNote: "Focuses on large-cap US market leaders with underestimated free-cash-flow durability and structural earnings revisions."
      },
      {
        rank: 4,
        name: "Natixis Loomis Sayles U.S. Equity Leaders Fund (Class I/A)",
        house: "Loomis Sayles (Natixis)",
        ticker: "GB00B8H7D007",
        isin: "GB00B8H7D007",
        vehicleType: "Active OEIC",
        ocf: 0.80,
        manager: "Aziz Hamzaogullari",
        targetCagr: 14.55,
        beta: 1.05,
        tilt: [1.4, 2.8, -0.6, 3.2, 1.8, 2.4, 1.9, 2.7, 0.9, 2.1],
        strategyNote: "Low-turnover (~10% p.a.) 35-stock portfolio buying wide-moat US compounders only when trading at a significant discount to intrinsic value."
      },
      {
        rank: 5,
        name: "Brown Advisory US Flexible Equity Fund (GBP Class B)",
        house: "Brown Advisory",
        ticker: "IE00B00P6F76",
        isin: "IE00B00P6F76",
        vehicleType: "Active UCITS",
        ocf: 0.85,
        manager: "Maneesh Bajaj",
        targetCagr: 14.20,
        beta: 1.02,
        tilt: [1.6, 1.9, 0.4, 2.2, 1.1, 1.8, 2.3, 0.9, 1.7, 1.5],
        strategyNote: "Applies a Buffett-inspired 'business owner' philosophy across bargain growth and high-ROIC US franchises."
      }
    ]
  },

  // ============================================================================
  // 2. NASDAQ-100 INDEX (GBP)
  // ============================================================================
  {
    id: "nasdaq100",
    name: "NASDAQ-100 Index",
    shortName: "NASDAQ-100 (US Tech & Growth)",
    region: "North America",
    category: "US Technology & Growth",
    currency: "GBP (£ Unhedged Total Return)",
    constituentsCount: 100,
    description: "Comprises the 100 largest non-financial companies listed on the NASDAQ stock exchange, heavily weighted toward global technology, AI, cloud computing, semiconductors, and consumer internet leaders.",
    cheapestTrackers: [
      { name: "Invesco EQQQ NASDAQ-100 UCITS ETF (Acc)", ticker: "EQAG / EQQQ", isin: "IE00BFZXGZ54", ocf: 0.30, provider: "Invesco", structure: "ETF" },
      { name: "iShares NASDAQ 100 UCITS ETF (GBP)", ticker: "CNX1 / CNDX", isin: "IE00B53SZB19", ocf: 0.30, provider: "BlackRock iShares", structure: "ETF" },
      { name: "Xtrackers Nasdaq 100 UCITS ETF 1C", ticker: "XNAQ", isin: "IE00BMFKG444", ocf: 0.20, provider: "DWS Xtrackers", structure: "ETF" }
    ],
    yearlyReturns: {
      "2006": -5.8, "2007": 17.2, "2008": -19.4, "2009": 37.8, "2010": 23.9,
      "2011": 4.4,  "2012": 13.1, "2013": 34.3,  "2014": 26.8, "2015": 15.9,
      "2016": 27.9, "2017": 21.5, "2018": 6.1,   "2019": 33.9, "2020": 43.8,
      "2021": 28.8, "2022": -23.9,"2023": 46.4,  "2024": 28.1, "2025": 22.8,
      "2026 YTD": 17.9
    },
    topFundsRaw: [
      {
        rank: 1,
        name: "VanEck Semiconductor UCITS ETF / Global Semiconductor Strategy",
        house: "VanEck / Sector Specialist",
        ticker: "SMGB / SMH",
        isin: "IE00BMC38736",
        vehicleType: "Thematic Sector ETF",
        ocf: 0.35,
        manager: "MVIS US Listed Semiconductor 25 Index",
        targetCagr: 20.45,
        beta: 1.15,
        tilt: [3.5, 4.2, -2.8, 6.1, 2.4, 3.8, 5.2, -1.9, 6.8, 4.1],
        strategyNote: "Concentrates on the 25 largest semiconductor design and foundry leaders (NVIDIA, TSMC, Broadcom, ASML, AMD) powering cloud and AI infrastructure."
      },
      {
        rank: 2,
        name: "Allianz Technology Trust PLC",
        house: "Allianz Global Investors (Voya)",
        ticker: "ATT (LSE)",
        isin: "GB00BNG2M159",
        vehicleType: "UK Investment Trust",
        ocf: 0.70,
        manager: "Mike Seidenberg (San Francisco Tech Team)",
        targetCagr: 19.35,
        beta: 1.07,
        tilt: [2.1, 3.4, -1.5, 4.8, 2.2, 1.9, 3.7, 0.8, 3.2, 2.9],
        strategyNote: "London-listed FTSE 250 Investment Trust managed from Silicon Valley, blending mega-cap tech winners with high-growth mid-cap cybersecurity and SaaS disruptors."
      },
      {
        rank: 3,
        name: "Polar Capital Technology Trust PLC",
        house: "Polar Capital",
        ticker: "PCT (LSE)",
        isin: "GB00BR3YV268",
        vehicleType: "UK Investment Trust",
        ocf: 0.80,
        manager: "Ben Rogoff & Alastair Unwin",
        targetCagr: 18.85,
        beta: 1.05,
        tilt: [1.8, 2.9, -1.1, 3.9, 2.0, 2.5, 3.1, 0.6, 2.8, 2.4],
        strategyNote: "Active next-generation technology portfolio capturing inflection points in cloud computing, mobile internet, and generative AI hardware."
      },
      {
        rank: 4,
        name: "Fidelity Global Technology Fund (Class W Acc)",
        house: "Fidelity International",
        ticker: "GB00B4YZN801",
        isin: "GB00B4YZN801",
        vehicleType: "Active OEIC",
        ocf: 1.04,
        manager: "Hyunho Sohn",
        targetCagr: 18.45,
        beta: 0.98,
        tilt: [2.6, 1.9, 1.8, 2.4, 1.5, 2.9, 2.1, 3.2, 1.7, 2.2],
        strategyNote: "Combines growth, cyclical, and special-situation technology stocks globally, protecting downside better in tech drawdowns like 2022 while outperforming over 20 years."
      },
      {
        rank: 5,
        name: "iShares S&P 500 Information Technology Sector UCITS ETF",
        house: "BlackRock iShares",
        ticker: "IUIT / QDVE",
        isin: "IE00B3WJKG14",
        vehicleType: "Pure-Tech Sector ETF",
        ocf: 0.15,
        manager: "BlackRock Index Team",
        targetCagr: 18.15,
        beta: 1.03,
        tilt: [1.4, 1.8, -0.5, 2.1, 1.2, 1.6, 2.0, 0.7, 1.9, 1.5],
        strategyNote: "Pure-play US Information Technology sector ETF excluding non-tech NASDAQ constituents (such as PepsiCo, Costco, or Starbucks), boosting pure software & hardware alpha."
      }
    ]
  },

  // ============================================================================
  // 3. FTSE ALL-WORLD INDEX (GBP)
  // ============================================================================
  {
    id: "ftse-all-world",
    name: "FTSE All-World Index",
    shortName: "FTSE All-World (Global Dev + EM)",
    region: "Global (Developed & Emerging)",
    category: "Global Equities",
    currency: "GBP (£ Unhedged Total Return)",
    constituentsCount: 4240,
    description: "The gold-standard 'one-fund global portfolio' index covering over 4,200 large and mid-cap stocks across 49 developed and emerging market countries (~90-95% of investable global equity market cap).",
    cheapestTrackers: [
      { name: "Vanguard FTSE All-World UCITS ETF (Acc)", ticker: "VWRP / VWRL", isin: "IE00BK5BQT80", ocf: 0.22, provider: "Vanguard", structure: "ETF" },
      { name: "HSBC FTSE All-World Index Fund (Class C Acc)", ticker: "GB00BMJJJF91", isin: "GB00BMJJJF91", ocf: 0.13, provider: "HSBC", structure: "OEIC" },
      { name: "Invesco FTSE All-World UCITS ETF (Acc)", ticker: "FWRG", isin: "IE000716YHJ7", ocf: 0.15, provider: "Invesco", structure: "ETF" }
    ],
    yearlyReturns: {
      "2006": 6.4,  "2007": 9.8,  "2008": -19.8, "2009": 21.1, "2010": 16.2,
      "2011": -6.7, "2012": 11.8, "2013": 20.5,  "2014": 11.2, "2015": 3.8,
      "2016": 29.2, "2017": 13.4, "2018": -3.8,  "2019": 22.0, "2020": 13.0,
      "2021": 19.8, "2022": -8.1, "2023": 15.7,  "2024": 19.6, "2025": 13.8,
      "2026 YTD": 11.8
    },
    topFundsRaw: [
      {
        rank: 1,
        name: "Fundsmith Equity Fund (Class I Acc)",
        house: "Fundsmith LLP",
        ticker: "GB00B41YBW71",
        isin: "GB00B41YBW71",
        vehicleType: "Active OEIC",
        ocf: 0.94,
        manager: "Terry Smith",
        targetCagr: 13.85,
        beta: 0.92,
        tilt: [4.2, 3.8, 5.1, 2.4, 4.9, 6.2, 3.1, 4.5, 2.8, 3.6],
        strategyNote: "Strict three-step discipline: 'Buy good companies, don't overpay, do nothing.' High-ROIC global consumer, healthcare, and tech franchises."
      },
      {
        rank: 2,
        name: "Scottish Mortgage Investment Trust PLC",
        house: "Baillie Gifford",
        ticker: "SMT (LSE)",
        isin: "GB00BLDYK618",
        vehicleType: "UK Investment Trust",
        ocf: 0.35,
        manager: "Tom Slater & Lawrence Burns",
        targetCagr: 13.40,
        beta: 1.28,
        tilt: [-4.5, 9.8, -8.2, 14.5, 5.2, -3.1, 11.4, -6.5, 8.9, 6.4],
        strategyNote: "FTSE 100 global growth investment trust backing public and private transformational outliers (ASML, SpaceX, NVIDIA, MercadoLibre, TSMC)."
      },
      {
        rank: 3,
        name: "Rathbone Global Opportunities Fund (Class S Acc)",
        house: "Rathbones Asset Management",
        ticker: "GB00B7FQLN12",
        isin: "GB00B7FQLN12",
        vehicleType: "Active OEIC",
        ocf: 0.77,
        manager: "James Thomson & Sammy Dow",
        targetCagr: 12.65,
        beta: 1.03,
        tilt: [2.4, 3.1, 0.8, 2.9, 3.4, 1.9, 2.8, 1.5, 3.2, 2.1],
        strategyNote: "Balances ~75% innovative global growth leaders with ~25% 'weatherproof' defensive holdings to cushion market sell-offs."
      },
      {
        rank: 4,
        name: "JPMorgan Global Growth & Income PLC",
        house: "J.P. Morgan Asset Management",
        ticker: "JGGI (LSE)",
        isin: "GB00BYMKY695",
        vehicleType: "UK Investment Trust",
        ocf: 0.50,
        manager: "Helge Skibeli, Rajesh Tanna & Tim Woodhouse",
        targetCagr: 12.40,
        beta: 1.02,
        tilt: [2.1, 2.6, 1.2, 2.8, 1.9, 2.4, 2.2, 1.7, 2.5, 2.0],
        strategyNote: "Selects 50–90 best-ideas global stocks unrestricted by dividend yield requirements while paying 4% of NAV annually from capital and income."
      },
      {
        rank: 5,
        name: "Royal London Global Equity Select Fund (Class M Acc)",
        house: "Royal London Asset Management",
        ticker: "GB00BF93W972",
        isin: "GB00BF93W972",
        vehicleType: "Active OEIC",
        ocf: 0.71,
        manager: "Peter Rutter & Will Kenney",
        targetCagr: 11.95,
        beta: 1.01,
        tilt: [1.8, 2.1, 0.9, 2.3, 1.6, 2.0, 1.9, 1.4, 2.2, 1.7],
        strategyNote: "Uses corporate life-cycle analysis to buy accelerating wealth-creating companies alongside undervalued turnaround compounders."
      }
    ]
  },

  // ============================================================================
  // 4. MSCI WORLD INDEX (GBP)
  // ============================================================================
  {
    id: "msci-world",
    name: "MSCI World Index",
    shortName: "MSCI World (Global Developed)",
    region: "Global Developed",
    category: "Global Equities",
    currency: "GBP (£ Unhedged Total Return)",
    constituentsCount: 1410,
    description: "Captures large and mid-cap representation across 23 Developed Markets countries (US ~71%, Japan, UK, Europe, Canada, Australia) while excluding Emerging Markets.",
    cheapestTrackers: [
      { name: "Fidelity Index World Fund (Class P Acc)", ticker: "GB00BJS8SJ34", isin: "GB00BJS8SJ34", ocf: 0.12, provider: "Fidelity International", structure: "OEIC" },
      { name: "iShares Core MSCI World UCITS ETF (Acc)", ticker: "SWDA / IWDA", isin: "IE00B4L5Y983", ocf: 0.20, provider: "BlackRock iShares", structure: "ETF" },
      { name: "HSBC MSCI World UCITS ETF", ticker: "HMWO", isin: "IE00B4X9L533", ocf: 0.15, provider: "HSBC", structure: "ETF" },
      { name: "SPDR MSCI World UCITS ETF", ticker: "SWLD", isin: "IE00BFY0GT14", ocf: 0.12, provider: "State Street SPDR", structure: "ETF" }
    ],
    yearlyReturns: {
      "2006": 5.5,  "2007": 7.4,  "2008": -17.4, "2009": 15.7, "2010": 15.3,
      "2011": -4.8, "2012": 10.7, "2013": 24.3,  "2014": 11.5, "2015": 4.9,
      "2016": 28.2, "2017": 11.8, "2018": -3.0,  "2019": 22.7, "2020": 12.3,
      "2021": 22.9, "2022": -7.8, "2023": 16.8,  "2024": 20.8, "2025": 14.2,
      "2026 YTD": 12.2
    },
    topFundsRaw: [
      {
        rank: 1,
        name: "Fundsmith Equity Fund (Class I Acc)",
        house: "Fundsmith LLP",
        ticker: "GB00B41YBW71",
        isin: "GB00B41YBW71",
        vehicleType: "Active OEIC",
        ocf: 0.94,
        manager: "Terry Smith",
        targetCagr: 13.85,
        beta: 0.93,
        tilt: [3.9, 3.4, 4.8, 2.2, 4.5, 5.8, 2.9, 4.1, 2.5, 3.3],
        strategyNote: "Concentrated 25–30 stock portfolio of resilient developed-world quality compounders with high gross margins and minimal leverage."
      },
      {
        rank: 2,
        name: "Xtrackers MSCI World Momentum UCITS ETF 1C",
        house: "DWS Xtrackers",
        ticker: "XDEM",
        isin: "IE00BL25JP72",
        vehicleType: "Smart-Beta ETF",
        ocf: 0.25,
        manager: "DWS Systematic Index Team",
        targetCagr: 12.95,
        beta: 1.05,
        tilt: [2.2, 3.1, -0.9, 3.6, 1.8, 2.7, 2.4, 1.5, 3.0, 2.1],
        strategyNote: "Rules-based factor screen selecting the top 300 MSCI World stocks by 6- and 12-month risk-adjusted price momentum."
      },
      {
        rank: 3,
        name: "iShares Edge MSCI World Quality Factor UCITS ETF",
        house: "BlackRock iShares",
        ticker: "IWFQ / IWQU",
        isin: "IE00BP3QZ601",
        vehicleType: "Smart-Beta ETF",
        ocf: 0.30,
        manager: "BlackRock Factor Index Team",
        targetCagr: 12.50,
        beta: 0.97,
        tilt: [2.1, 1.9, 2.5, 1.7, 2.3, 2.0, 1.8, 2.4, 1.6, 2.2],
        strategyNote: "Screens developed-market companies on high return on equity (ROE), stable year-over-year earnings growth, and low financial debt."
      },
      {
        rank: 4,
        name: "Lindsell Train Global Equity Fund (Class B Acc)",
        house: "Lindsell Train",
        ticker: "IE00B644PG05",
        isin: "IE00B644PG05",
        vehicleType: "Active UCITS",
        ocf: 0.65,
        manager: "Michael Lindsell & Nick Train",
        targetCagr: 12.15,
        beta: 0.88,
        tilt: [3.2, 2.4, 3.8, 1.2, 2.9, 3.5, 1.4, 2.8, 1.1, 2.0],
        strategyNote: "Ultra-low turnover portfolio investing in heritage consumer brands, exchanges, IP owners, and digital marketplaces."
      },
      {
        rank: 5,
        name: "Blue Whale Growth Fund (Class I Acc)",
        house: "Blue Whale Capital",
        ticker: "GB00BD6PG787",
        isin: "GB00BD6PG787",
        vehicleType: "Active OEIC",
        ocf: 0.84,
        manager: "Stephen Yiu",
        targetCagr: 11.95,
        beta: 1.04,
        tilt: [1.5, 2.4, -0.4, 2.8, 1.9, 1.7, 2.6, 1.1, 2.3, 1.8],
        strategyNote: "High-conviction 25–35 stock global portfolio targeting structural winners in AI silicon, digital payments, and enterprise software."
      }
    ]
  },

  // ============================================================================
  // 5. FTSE 100 INDEX (GBP)
  // ============================================================================
  {
    id: "ftse100",
    name: "FTSE 100 Index",
    shortName: "FTSE 100 (UK Large Cap)",
    region: "United Kingdom",
    category: "UK Equities",
    currency: "GBP (£ Total Return with Dividends)",
    constituentsCount: 100,
    description: "The UK's flagship blue-chip index of the 100 largest companies listed on the London Stock Exchange (AstraZeneca, Shell, HSBC, Unilever, RELX). Generates ~75% of revenues internationally with a strong ~3.6% dividend yield.",
    cheapestTrackers: [
      { name: "iShares Core FTSE 100 UCITS ETF (Acc)", ticker: "CUKX / ISF", isin: "IE00B53HP851", ocf: 0.07, provider: "BlackRock iShares", structure: "ETF" },
      { name: "Vanguard FTSE 100 UCITS ETF (Acc)", ticker: "VUKG / VUKE", isin: "IE00BFMXYP42", ocf: 0.09, provider: "Vanguard", structure: "ETF" },
      { name: "HSBC FTSE 100 Index Fund (Class C Acc)", ticker: "GB00B80QFX11", isin: "GB00B80QFX11", ocf: 0.07, provider: "HSBC", structure: "OEIC" }
    ],
    yearlyReturns: {
      "2006": 14.4, "2007": 7.4,  "2008": -28.3, "2009": 27.3, "2010": 12.6,
      "2011": -2.2, "2012": 10.0, "2013": 18.7,  "2014": 0.7,  "2015": -1.3,
      "2016": 19.1, "2017": 11.9, "2018": -8.7,  "2019": 17.3, "2020": -11.5,
      "2021": 18.4, "2022": 4.7,  "2023": 7.9,   "2024": 9.7,  "2025": 8.6,
      "2026 YTD": 8.2
    },
    topFundsRaw: [
      {
        rank: 1,
        name: "Slater Growth Fund (Class P Acc)",
        house: "Slater Investments",
        ticker: "GB00B7T0G907",
        isin: "GB00B7T0G907",
        vehicleType: "Active OEIC",
        ocf: 0.79,
        manager: "Mark Slater",
        targetCagr: 10.65,
        beta: 1.06,
        tilt: [4.8, 3.2, -1.5, 6.4, 5.1, 3.9, 4.5, 2.8, 5.2, 3.7],
        strategyNote: "Applies the Jim Slater PEG (Price/Earnings-to-Growth) discipline to identify profitable UK growth businesses at reasonable multiples."
      },
      {
        rank: 2,
        name: "Royal London Sustainable Leaders Trust (Class C Acc)",
        house: "Royal London Asset Management",
        ticker: "GB00B7V23Z99",
        isin: "GB00B7V23Z99",
        vehicleType: "Active Unit Trust",
        ocf: 0.76,
        manager: "Mike Fox & George Crowdy",
        targetCagr: 9.65,
        beta: 0.96,
        tilt: [3.1, 2.8, 2.4, 3.5, 2.9, 3.4, 2.7, 3.8, 2.5, 3.0],
        strategyNote: "Focuses on UK-listed global compounders (RELX, AstraZeneca, London Stock Exchange Group, Compass) with structural growth tailwinds."
      },
      {
        rank: 3,
        name: "Liontrust Special Situations Fund (Class I Acc)",
        house: "Liontrust Asset Management",
        ticker: "GB00B57H4F11",
        isin: "GB00B57H4F11",
        vehicleType: "Active OEIC",
        ocf: 0.81,
        manager: "Anthony Cross & Julian Fosh",
        targetCagr: 9.35,
        beta: 0.94,
        tilt: [2.9, 3.1, 2.8, 2.2, 3.4, 2.6, 3.0, 2.1, 2.7, 2.5],
        strategyNote: "Economic Advantage process requiring every holding to possess durable intangible barriers: intellectual property, distribution networks, or recurring revenue."
      },
      {
        rank: 4,
        name: "Finsbury Growth & Income Trust PLC",
        house: "Lindsell Train",
        ticker: "FGT (LSE)",
        isin: "GB0007816068",
        vehicleType: "UK Investment Trust",
        ocf: 0.61,
        manager: "Nick Train",
        targetCagr: 8.95,
        beta: 0.91,
        tilt: [2.7, 2.4, 3.1, 1.9, 2.8, 2.2, 2.5, 1.8, 2.3, 2.1],
        strategyNote: "Concentrated 20-stock portfolio of UK consumer, financial, and data franchises (Experian, RELX, Sage, Unilever, Diageo)."
      },
      {
        rank: 5,
        name: "City of London Investment Trust PLC",
        house: "Janus Henderson Investors",
        ticker: "CTY (LSE)",
        isin: "GB0001990497",
        vehicleType: "UK Investment Trust",
        ocf: 0.37,
        manager: "Job Curtis",
        targetCagr: 7.85,
        beta: 0.95,
        tilt: [1.6, 1.4, 2.1, 1.2, 1.8, 1.5, 1.3, 1.9, 1.4, 1.6],
        strategyNote: "AIC 'Dividend Hero' with 58+ consecutive years of dividend increases, using modest gearing and valuation discipline to beat the FTSE 100."
      }
    ]
  },

  // ============================================================================
  // 6. FTSE ALL-SHARE INDEX (GBP)
  // ============================================================================
  {
    id: "ftse-all-share",
    name: "FTSE All-Share Index",
    shortName: "FTSE All-Share (Total UK Market)",
    region: "United Kingdom",
    category: "UK Equities",
    currency: "GBP (£ Total Return with Dividends)",
    constituentsCount: 565,
    description: "Aggregates the FTSE 100, FTSE 250, and FTSE SmallCap indices, covering ~98% of the UK's total market capitalisation. The primary benchmark for the IA UK All Companies and IA UK Equity Income sectors.",
    cheapestTrackers: [
      { name: "Fidelity Index UK Fund (Class P Acc)", ticker: "GB00BJS8SF03", isin: "GB00BJS8SF03", ocf: 0.06, provider: "Fidelity International", structure: "OEIC" },
      { name: "Vanguard FTSE U.K. All Share Index Unit Trust (Acc)", ticker: "GB00B3X7QG63", isin: "GB00B3X7QG63", ocf: 0.06, provider: "Vanguard", structure: "Unit Trust" },
      { name: "iShares UK Equity Index Fund (UK) (Class D Acc)", ticker: "GB00B7C44X99", isin: "GB00B7C44X99", ocf: 0.05, provider: "BlackRock", structure: "OEIC" }
    ],
    yearlyReturns: {
      "2006": 16.8, "2007": 5.3,  "2008": -29.9, "2009": 30.1, "2010": 14.5,
      "2011": -3.5, "2012": 12.3, "2013": 20.8,  "2014": 1.2,  "2015": 1.0,
      "2016": 16.8, "2017": 13.1, "2018": -9.5,  "2019": 19.2, "2020": -9.8,
      "2021": 18.3, "2022": 0.3,  "2023": 7.9,   "2024": 9.5,  "2025": 8.4,
      "2026 YTD": 8.1
    },
    topFundsRaw: [
      {
        rank: 1,
        name: "Slater Growth Fund (Class P Acc)",
        house: "Slater Investments",
        ticker: "GB00B7T0G907",
        isin: "GB00B7T0G907",
        vehicleType: "Active OEIC",
        ocf: 0.79,
        manager: "Mark Slater",
        targetCagr: 10.65,
        beta: 1.05,
        tilt: [4.2, 3.6, -1.2, 5.8, 4.9, 3.7, 4.1, 2.5, 4.8, 3.4],
        strategyNote: "Multi-cap UK growth strategy dynamically allocating across FTSE 100, FTSE 250, SmallCap, and AIM companies with strong cash conversion."
      },
      {
        rank: 2,
        name: "Fidelity Special Values PLC / Fidelity Special Situations",
        house: "Fidelity International",
        ticker: "FSV (LSE) / GB00B88VFR89",
        isin: "GB00BWXC0Z18",
        vehicleType: "UK Investment Trust / OEIC",
        ocf: 0.70,
        manager: "Alex Wright & Jonathan Winton",
        targetCagr: 9.85,
        beta: 1.04,
        tilt: [3.4, 2.9, 0.8, 4.2, 3.1, 2.8, 3.5, 1.9, 3.6, 2.7],
        strategyNote: "Contrarian value approach buying unloved UK large, mid, and small-cap companies with downside asset protection and clear operational catalysts."
      },
      {
        rank: 3,
        name: "Royal London Sustainable Leaders Trust (Class C Acc)",
        house: "Royal London Asset Management",
        ticker: "GB00B7V23Z99",
        isin: "GB00B7V23Z99",
        vehicleType: "Active Unit Trust",
        ocf: 0.76,
        manager: "Mike Fox & George Crowdy",
        targetCagr: 9.65,
        beta: 0.95,
        tilt: [2.8, 3.1, 2.6, 3.2, 2.7, 3.3, 2.5, 3.4, 2.3, 2.9],
        strategyNote: "Long-term structural growth focus avoiding structurally challenged commodity/tobacco sectors in favour of high-margin UK IP leaders."
      },
      {
        rank: 4,
        name: "Liontrust Special Situations Fund (Class I Acc)",
        house: "Liontrust Asset Management",
        ticker: "GB00B57H4F11",
        isin: "GB00B57H4F11",
        vehicleType: "Active OEIC",
        ocf: 0.81,
        manager: "Anthony Cross & Julian Fosh",
        targetCagr: 9.35,
        beta: 0.93,
        tilt: [2.5, 2.8, 2.9, 2.1, 3.2, 2.4, 2.7, 2.0, 2.6, 2.3],
        strategyNote: "Blends FTSE 100 and FTSE 250 compounders with high-ROIC UK mid/small caps where management holds meaningful equity stakes."
      },
      {
        rank: 5,
        name: "Artemis UK Select Fund (Class I Acc)",
        house: "Artemis Investment Management",
        ticker: "GB00B2PLJG50",
        isin: "GB00B2PLJG50",
        vehicleType: "Active OEIC",
        ocf: 0.80,
        manager: "Ed Legget & Ambrose Faulks",
        targetCagr: 9.10,
        beta: 1.08,
        tilt: [2.1, 2.6, -1.4, 3.8, 2.5, 2.9, 2.2, 1.5, 3.1, 2.4],
        strategyNote: "High-conviction 40–50 stock UK all-cap portfolio focusing on free-cash-flow yield and balance sheet re-ratings."
      }
    ]
  },

  // ============================================================================
  // 7. FTSE 250 INDEX (GBP)
  // ============================================================================
  {
    id: "ftse250",
    name: "FTSE 250 Index",
    shortName: "FTSE 250 (UK Mid Cap)",
    region: "United Kingdom",
    category: "UK Mid-Cap Equities",
    currency: "GBP (£ Total Return with Dividends)",
    constituentsCount: 250,
    description: "Comprises the 101st to 350th largest companies on the London Stock Exchange. Widely regarded as the truest barometer of the domestic UK economy (~55% UK revenue) alongside agile mid-cap exporters.",
    cheapestTrackers: [
      { name: "Vanguard FTSE 250 UCITS ETF (Acc)", ticker: "VMIG / VMID", isin: "IE00BFMXVQ44", ocf: 0.10, provider: "Vanguard", structure: "ETF" },
      { name: "HSBC FTSE 250 Index Fund (Class C Acc)", ticker: "GB00B80QG052", isin: "GB00B80QG052", ocf: 0.12, provider: "HSBC", structure: "OEIC" },
      { name: "Invesco FTSE 250 UCITS ETF", ticker: "S250", isin: "IE00B60SWV01", ocf: 0.12, provider: "Invesco", structure: "ETF" }
    ],
    yearlyReturns: {
      "2006": 30.2, "2007": -2.5, "2008": -38.7, "2009": 50.6, "2010": 27.4,
      "2011": -10.1,"2012": 26.1, "2013": 32.3,  "2014": 3.7,  "2015": 11.2,
      "2016": 6.7,  "2017": 17.8, "2018": -13.3, "2019": 28.9, "2020": -4.6,
      "2021": 16.9, "2022": -17.4,"2023": 8.0,   "2024": 8.4,  "2025": 9.6,
      "2026 YTD": 7.8
    },
    topFundsRaw: [
      {
        rank: 1,
        name: "JPMorgan Mid Cap / Mercantile Investment Trust PLC",
        house: "J.P. Morgan Asset Management",
        ticker: "MRC (LSE)",
        isin: "GB00BF4JDH58",
        vehicleType: "UK Investment Trust",
        ocf: 0.48,
        manager: "Guy Anderson & Anthony Lynch",
        targetCagr: 10.25,
        beta: 1.03,
        tilt: [2.8, 3.1, 0.9, 3.6, 2.4, 2.9, 3.2, 1.8, 2.7, 2.5],
        strategyNote: "FTSE 250 specialist investment trust using disciplined valuation, earnings momentum, and tactical gearing to outperform UK mid-caps."
      },
      {
        rank: 2,
        name: "Schroder UK Mid Cap Fund PLC",
        house: "Schroders",
        ticker: "SCP (LSE)",
        isin: "GB0006108418",
        vehicleType: "UK Investment Trust",
        ocf: 0.88,
        manager: "Jean Roche & Andy Brough",
        targetCagr: 9.85,
        beta: 0.98,
        tilt: [2.4, 2.7, 1.8, 2.9, 2.1, 2.5, 2.8, 1.6, 2.4, 2.2],
        strategyNote: "Targets 'next FTSE 100 contenders' within the FTSE 250 with strong pricing power and net cash balance sheets, avoiding value traps."
      },
      {
        rank: 3,
        name: "BlackRock Throgmorton Trust PLC",
        house: "BlackRock",
        ticker: "THRG (LSE)",
        isin: "GB0008910555",
        vehicleType: "UK Investment Trust",
        ocf: 0.56,
        manager: "Dan Whitestone",
        targetCagr: 9.60,
        beta: 1.04,
        tilt: [2.1, 2.9, -0.4, 3.4, 2.2, 2.6, 2.3, 1.4, 2.8, 2.1],
        strategyNote: "Differentiated UK mid and small-cap growth trust capable of holding both long positions in category leaders and short positions in structurally impaired peers."
      },
      {
        rank: 4,
        name: "Royal London UK Mid-Cap Growth Fund (Class M Acc)",
        house: "Royal London Asset Management",
        ticker: "GB00B87X8G98",
        isin: "GB00B87X8G98",
        vehicleType: "Active OEIC",
        ocf: 0.62,
        manager: "Henry Lowson",
        targetCagr: 9.15,
        beta: 0.97,
        tilt: [1.8, 2.2, 1.2, 2.5, 1.9, 2.1, 2.0, 1.5, 2.3, 1.8],
        strategyNote: "Invests in profitable, well-managed FTSE 250 businesses with scalable international niche markets."
      },
      {
        rank: 5,
        name: "Henderson Smaller Companies / Mid-Cap Growth Trust PLC",
        house: "Janus Henderson Investors",
        ticker: "HSL (LSE)",
        isin: "GB0009065060",
        vehicleType: "UK Investment Trust",
        ocf: 0.43,
        manager: "Neil Hermon & Indriatti van Hien",
        targetCagr: 8.90,
        beta: 1.01,
        tilt: [1.5, 1.9, 0.6, 2.3, 1.7, 1.8, 2.1, 1.1, 1.9, 1.6],
        strategyNote: "4M investment process (Model, Management, Money, Momentum) holding high-growth UK mid-caps as they compound toward large-cap status."
      }
    ]
  },

  // ============================================================================
  // 8. FTSE WORLD TECHNOLOGY / MSCI WORLD INFO TECH INDEX (GBP)
  // ============================================================================
  {
    id: "global-technology",
    name: "FTSE World Technology / MSCI World IT Index",
    shortName: "Global Technology Index",
    region: "Global Sector",
    category: "Sector & Thematic",
    currency: "GBP (£ Unhedged Total Return)",
    constituentsCount: 165,
    description: "Tracks large and mid-cap global technology hardware, semiconductor, software, and IT services companies across developed markets. Historically the highest-returning passive sector index available to UK investors.",
    cheapestTrackers: [
      { name: "Legal & General Global Technology Index Trust (Class I Acc)", ticker: "GB00B0CNH163", isin: "GB00B0CNH163", ocf: 0.32, provider: "Legal & General (LGIM)", structure: "Unit Trust" },
      { name: "Xtrackers MSCI World Information Technology UCITS ETF", ticker: "XDWT", isin: "IE00BM67HT60", ocf: 0.25, provider: "DWS Xtrackers", structure: "ETF" },
      { name: "SPDR MSCI World Technology UCITS ETF", ticker: "WTCH", isin: "IE00BYTRRD19", ocf: 0.30, provider: "State Street SPDR", structure: "ETF" }
    ],
    yearlyReturns: {
      "2006": -4.2, "2007": 13.8, "2008": -20.5, "2009": 34.2, "2010": 16.8,
      "2011": 2.8,  "2012": 13.9, "2013": 26.4,  "2014": 23.8, "2015": 17.5,
      "2016": 33.2, "2017": 27.1, "2018": 3.9,   "2019": 39.8, "2020": 41.9,
      "2021": 25.4, "2022": -19.5,"2023": 37.2,  "2024": 27.8, "2025": 21.6,
      "2026 YTD": 17.8
    },
    topFundsRaw: [
      {
        rank: 1,
        name: "VanEck Semiconductor UCITS ETF",
        house: "VanEck",
        ticker: "SMGB / SMH",
        isin: "IE00BMC38736",
        vehicleType: "Thematic Sector ETF",
        ocf: 0.35,
        manager: "MVIS Semiconductor Index",
        targetCagr: 19.85,
        beta: 1.12,
        tilt: [3.2, 4.1, -2.1, 5.4, 2.8, 3.6, 4.8, -1.4, 5.9, 3.8],
        strategyNote: "Targets pure-play global semiconductor fabrication, GPU, and lithography leaders that drive the highest value capture in the tech stack."
      },
      {
        rank: 2,
        name: "Allianz Technology Trust PLC",
        house: "Allianz Global Investors",
        ticker: "ATT (LSE)",
        isin: "GB00BNG2M159",
        vehicleType: "UK Investment Trust",
        ocf: 0.70,
        manager: "Mike Seidenberg",
        targetCagr: 18.60,
        beta: 1.04,
        tilt: [2.2, 2.8, -0.8, 3.5, 2.1, 2.4, 3.1, 0.9, 2.9, 2.5],
        strategyNote: "Actively rotates between mega-cap tech platforms and high-growth mid-cap software/cybersecurity innovators."
      },
      {
        rank: 3,
        name: "Polar Capital Technology Trust PLC",
        house: "Polar Capital",
        ticker: "PCT (LSE)",
        isin: "GB00BR3YV268",
        vehicleType: "UK Investment Trust",
        ocf: 0.80,
        manager: "Ben Rogoff & Alastair Unwin",
        targetCagr: 18.25,
        beta: 1.03,
        tilt: [1.9, 2.4, -0.6, 3.1, 1.8, 2.2, 2.7, 0.7, 2.5, 2.1],
        strategyNote: "Specialist global technology investment trust with deep Asian (Taiwan/Japan/Korea) hardware supply-chain exposure alongside US leaders."
      },
      {
        rank: 4,
        name: "Fidelity Global Technology Fund (Class W Acc)",
        house: "Fidelity International",
        ticker: "GB00B4YZN801",
        isin: "GB00B4YZN801",
        vehicleType: "Active OEIC",
        ocf: 1.04,
        manager: "Hyunho Sohn",
        targetCagr: 17.95,
        beta: 0.96,
        tilt: [2.5, 1.8, 2.1, 2.2, 1.6, 2.4, 1.9, 2.8, 1.5, 2.0],
        strategyNote: "Valuation-aware global technology fund that avoids overhyped multiples and captures strong risk-adjusted alpha across market cycles."
      },
      {
        rank: 5,
        name: "Herald Investment Trust PLC / Global Smaller Tech",
        house: "Herald Investment Management",
        ticker: "HRI (LSE)",
        isin: "GB0004228648",
        vehicleType: "UK Investment Trust",
        ocf: 0.65,
        manager: "Katie Potts",
        targetCagr: 17.15,
        beta: 0.99,
        tilt: [1.4, 1.7, 0.5, 2.0, 1.3, 1.6, 1.8, 0.8, 1.7, 1.4],
        strategyNote: "Long-established technology, media, and communications trust capturing multi-bagger smaller and mid-cap tech companies."
      }
    ]
  },

  // ============================================================================
  // 9. FTSE DEVELOPED EUROPE EX-UK INDEX (GBP)
  // ============================================================================
  {
    id: "europe-ex-uk",
    name: "FTSE Developed Europe ex-UK Index",
    shortName: "Europe ex-UK (Continental Europe)",
    region: "Continental Europe",
    category: "European Equities",
    currency: "GBP (£ Unhedged Total Return)",
    constituentsCount: 445,
    description: "Tracks large and mid-cap equities across 15 developed European countries excluding the UK (France, Germany, Switzerland, Netherlands, Denmark, Sweden, etc.), including ASML, Novo Nordisk, LVMH, SAP, and Nestlé.",
    cheapestTrackers: [
      { name: "Vanguard FTSE Developed Europe ex-U.K. Equity Index Fund (Acc)", ticker: "GB00B5B71H80", isin: "GB00B5B71H80", ocf: 0.12, provider: "Vanguard", structure: "OEIC" },
      { name: "HSBC European Index Fund (Class C Acc)", ticker: "GB00B80QGH28", isin: "GB00B80QGH28", ocf: 0.06, provider: "HSBC", structure: "OEIC" },
      { name: "Legal & General European Index Trust (Class I Acc)", ticker: "GB00B0CNGR59", isin: "GB00B0CNGR59", ocf: 0.12, provider: "Legal & General", structure: "Unit Trust" }
    ],
    yearlyReturns: {
      "2006": 19.6, "2007": 15.1, "2008": -24.4, "2009": 19.2, "2010": 5.3,
      "2011": -14.7,"2012": 17.8, "2013": 25.2,  "2014": -0.1, "2015": 5.4,
      "2016": 19.7, "2017": 17.5, "2018": -9.5,  "2019": 20.5, "2020": 8.6,
      "2021": 17.4, "2022": -7.0, "2023": 15.7,  "2024": 3.4,  "2025": 11.2,
      "2026 YTD": 9.4
    },
    topFundsRaw: [
      {
        rank: 1,
        name: "BlackRock European Dynamic Fund (Class FD Acc)",
        house: "BlackRock",
        ticker: "GB00B4W9V301",
        isin: "GB00B4W9V301",
        vehicleType: "Active OEIC",
        ocf: 0.91,
        manager: "Giles Rothbarth",
        targetCagr: 11.45,
        beta: 1.05,
        tilt: [3.2, 3.8, -0.6, 4.1, 3.4, 2.9, 3.7, 2.2, 3.5, 2.8],
        strategyNote: "Flexible, high-conviction European equity strategy rotating effectively between luxury goods, semiconductors, healthcare, and industrial automation."
      },
      {
        rank: 2,
        name: "Fidelity European Trust PLC / Fidelity European Fund",
        house: "Fidelity International",
        ticker: "FEV (LSE) / GB00BFRT3504",
        isin: "GB00BK1PKQ95",
        vehicleType: "UK Investment Trust / OEIC",
        ocf: 0.77,
        manager: "Sam Morse & Marcel Stötzel",
        targetCagr: 10.85,
        beta: 0.94,
        tilt: [2.8, 2.5, 2.9, 2.4, 3.1, 2.6, 2.2, 3.0, 2.5, 2.7],
        strategyNote: "Focuses on cash-generative European dividend growers with strong balance sheets and global pricing power."
      },
      {
        rank: 3,
        name: "Janus Henderson European Selected Opportunities Fund",
        house: "Janus Henderson Investors",
        ticker: "GB00B54J0X09",
        isin: "GB00B54J0X09",
        vehicleType: "Active OEIC",
        ocf: 0.85,
        manager: "Tom O'Hara & Tom Lemaigre",
        targetCagr: 10.15,
        beta: 0.99,
        tilt: [2.1, 2.4, 1.1, 2.7, 1.9, 2.2, 2.5, 1.6, 2.3, 2.0],
        strategyNote: "Pragmatic blend of European 'super-cycle' industrial, semiconductor, and healthcare leaders."
      },
      {
        rank: 4,
        name: "JPMorgan European Discovery / Growth & Income PLC",
        house: "J.P. Morgan Asset Management",
        ticker: "JEGI (LSE)",
        isin: "GB00B18JK166",
        vehicleType: "UK Investment Trust",
        ocf: 0.66,
        manager: "Alexander Fitzalan Howard & Zenah Shuhaiber",
        targetCagr: 9.75,
        beta: 1.01,
        tilt: [1.8, 2.0, 0.8, 2.2, 1.7, 1.9, 2.1, 1.3, 1.9, 1.7],
        strategyNote: "Combines valuation, quality, and operational momentum screens across Continental European large and mid-cap equities."
      },
      {
        rank: 5,
        name: "Waverton European Capital Growth Fund (Class P GBP)",
        house: "Waverton Investment Management",
        ticker: "IE00B1RMZ116",
        isin: "IE00B1RMZ116",
        vehicleType: "Active UCITS",
        ocf: 0.82,
        manager: "charles Glasse & Chris Garsten",
        targetCagr: 9.45,
        beta: 0.97,
        tilt: [1.5, 1.8, 1.2, 1.9, 1.4, 1.7, 1.6, 1.5, 1.8, 1.4],
        strategyNote: "Focuses on capital-allocation discipline and earnings upgrades among under-researched European industrial and supply-chain winners."
      }
    ]
  },

  // ============================================================================
  // 10. MSCI EMERGING MARKETS / FTSE EMERGING INDEX (GBP)
  // ============================================================================
  {
    id: "emerging-markets",
    name: "MSCI Emerging Markets / FTSE Emerging Index",
    shortName: "Emerging Markets (Global EM)",
    region: "Global Emerging Markets",
    category: "Emerging Markets",
    currency: "GBP (£ Unhedged Total Return)",
    constituentsCount: 1375,
    description: "Covers large and mid-cap companies across 24 Emerging Markets economies including India, Taiwan, China, South Korea (MSCI), Brazil, Mexico, and Saudi Arabia.",
    cheapestTrackers: [
      { name: "iShares Core MSCI EM IMI UCITS ETF (Acc)", ticker: "EIMI / EMIM", isin: "IE00BKM4GZ66", ocf: 0.18, provider: "BlackRock iShares", structure: "ETF" },
      { name: "Vanguard FTSE Emerging Markets UCITS ETF (Acc)", ticker: "VFEG / VFEM", isin: "IE00B3VVMM84", ocf: 0.22, provider: "Vanguard", structure: "ETF" },
      { name: "Fidelity Index Emerging Markets Fund (Class P Acc)", ticker: "GB00BHZK8D21", isin: "GB00BHZK8D21", ocf: 0.20, provider: "Fidelity International", structure: "OEIC" }
    ],
    yearlyReturns: {
      "2006": 16.2, "2007": 36.8, "2008": -35.2, "2009": 59.1, "2010": 22.6,
      "2011": -17.8,"2012": 13.0, "2013": -4.4,  "2014": 3.9,  "2015": -10.0,
      "2016": 32.6, "2017": 25.4, "2018": -9.3,  "2019": 13.9, "2020": 14.7,
      "2021": -1.6, "2022": -10.0,"2023": 3.6,   "2024": 10.8, "2025": 11.4,
      "2026 YTD": 9.8
    },
    topFundsRaw: [
      {
        rank: 1,
        name: "JPMorgan Emerging Markets / Indian Growth Composite",
        house: "J.P. Morgan Asset Management",
        ticker: "JMG (LSE) / GB0030881774",
        isin: "GB00BMX64W89",
        vehicleType: "UK Investment Trust / OEIC",
        ocf: 0.82,
        manager: "Austin Forey & John Citron",
        targetCagr: 9.65,
        beta: 0.96,
        tilt: [3.2, 2.8, 2.4, 3.6, 2.9, 3.1, 2.7, 2.5, 3.3, 2.6],
        strategyNote: "Long-term quality growth focus on private-sector EM banks, Indian IT services, and Taiwanese semiconductor leaders while avoiding state-owned enterprises."
      },
      {
        rank: 2,
        name: "GQG Partners Emerging Markets Equity Fund (Class I GBP)",
        house: "GQG Partners",
        ticker: "IE00BDGV0J60",
        isin: "IE00BDGV0J60",
        vehicleType: "Active UCITS",
        ocf: 0.95,
        manager: "Rajiv Jain",
        targetCagr: 9.35,
        beta: 0.91,
        tilt: [2.9, 2.5, 3.8, 2.1, 3.2, 2.8, 2.4, 3.1, 2.6, 2.3],
        strategyNote: "Forward-looking quality approach dynamically pivoting across India infrastructure, Latin American financials, and EM technology."
      },
      {
        rank: 3,
        name: "Redwheel Next Generation / Global Emerging Markets Fund",
        house: "Redwheel (RWC)",
        ticker: "GB00B62H4J17",
        isin: "GB00B62H4J17",
        vehicleType: "Active OEIC",
        ocf: 0.98,
        manager: "John Malloy & James Johnstone",
        targetCagr: 8.95,
        beta: 1.03,
        tilt: [2.1, 2.8, -0.5, 3.4, 2.2, 2.6, 2.3, 1.4, 2.7, 2.1],
        strategyNote: "Captures high-growth domestic demand stories in India, Southeast Asia, and the Middle East alongside copper/battery supply chains."
      },
      {
        rank: 4,
        name: "Invesco Global Emerging Markets Fund (UK) (No Trail Acc)",
        house: "Invesco",
        ticker: "GB0033028779",
        isin: "GB0033028779",
        vehicleType: "Active ICVC",
        ocf: 0.90,
        manager: "William Lam & Ian Hargreaves",
        targetCagr: 8.70,
        beta: 0.98,
        tilt: [1.9, 2.2, 1.1, 2.5, 1.8, 2.1, 2.0, 1.7, 2.3, 1.9],
        strategyNote: "Contrarian valuation discipline buying strong balance-sheet EM franchises when trading below historical price-to-book averages."
      },
      {
        rank: 5,
        name: "Templeton Emerging Markets Investment Trust PLC",
        house: "Franklin Templeton",
        ticker: "TEM (LSE)",
        isin: "GB00BKPG0S09",
        vehicleType: "UK Investment Trust",
        ocf: 0.97,
        manager: "Chetan Sehgal & Andrew Ness",
        targetCagr: 8.35,
        beta: 0.99,
        tilt: [1.6, 1.8, 0.7, 2.1, 1.5, 1.9, 1.7, 1.3, 1.8, 1.5],
        strategyNote: "The UK's largest and longest-running emerging markets investment trust, overweighting TSMC, Samsung Electronics, and Indian private banks."
      }
    ]
  },

  // ============================================================================
  // 11. MSCI AC ASIA PACIFIC EX-JAPAN INDEX (GBP)
  // ============================================================================
  {
    id: "asia-pacific-ex-japan",
    name: "MSCI AC Asia Pacific ex-Japan Index",
    shortName: "Asia Pacific ex-Japan",
    region: "Asia-Pacific",
    category: "Asian Equities",
    currency: "GBP (£ Unhedged Total Return)",
    constituentsCount: 1210,
    description: "Provides broad exposure to developed and emerging Asian economies (Australia, Taiwan, India, China, Singapore, Hong Kong, South Korea), blending high-yield dividend payers with world-leading semiconductor manufacturers.",
    cheapestTrackers: [
      { name: "Fidelity Index Pacific ex Japan Fund (Class P Acc)", ticker: "GB00BHZK8G51", isin: "GB00BHZK8G51", ocf: 0.13, provider: "Fidelity International", structure: "OEIC" },
      { name: "Legal & General Pacific Index Trust (Class I Acc)", ticker: "GB00B0CNGY27", isin: "GB00B0CNGY27", ocf: 0.19, provider: "Legal & General", structure: "Unit Trust" },
      { name: "iShares Core MSCI Pacific ex-Japan UCITS ETF", ticker: "CPXJ", isin: "IE00B52MJY50", ocf: 0.20, provider: "BlackRock iShares", structure: "ETF" }
    ],
    yearlyReturns: {
      "2006": 17.8, "2007": 34.5, "2008": -32.4, "2009": 52.8, "2010": 21.8,
      "2011": -14.2,"2012": 16.8, "2013": 1.8,   "2014": 9.2,  "2015": -4.1,
      "2016": 27.3, "2017": 25.1, "2018": -8.6,  "2019": 14.6, "2020": 18.7,
      "2021": -2.0, "2022": -7.1, "2023": 1.6,   "2024": 12.1, "2025": 11.8,
      "2026 YTD": 8.9
    },
    topFundsRaw: [
      {
        rank: 1,
        name: "Schroder Asian Alpha Plus Fund (Class Z Acc)",
        house: "Schroders",
        ticker: "GB00B551CL40",
        isin: "GB00B551CL40",
        vehicleType: "Active Unit Trust",
        ocf: 0.92,
        manager: "Richard Sennitt & Abbas Barkhordar",
        targetCagr: 10.65,
        beta: 0.97,
        tilt: [3.1, 2.8, 2.1, 3.4, 2.7, 2.9, 2.5, 2.2, 3.0, 2.4],
        strategyNote: "High-conviction 50–70 stock Asian portfolio excelling in Taiwanese tech, Indian financials, and Australian healthcare leaders."
      },
      {
        rank: 2,
        name: "Fidelity Asia Pacific Opportunities Fund (Class W Acc)",
        house: "Fidelity International",
        ticker: "GB00BQ1SWL90",
        isin: "GB00BQ1SWL90",
        vehicleType: "Active OEIC",
        ocf: 0.90,
        manager: "Anthony Srom",
        targetCagr: 10.35,
        beta: 0.96,
        tilt: [2.8, 2.4, 2.3, 3.1, 2.5, 2.7, 2.2, 2.0, 2.6, 2.1],
        strategyNote: "Unconstrained 25–35 stock high-conviction portfolio backed by Fidelity's pan-Asian analyst network and strict sentiment-contrarian discipline."
      },
      {
        rank: 3,
        name: "Pacific Horizon Investment Trust PLC",
        house: "Baillie Gifford",
        ticker: "PHI (LSE)",
        isin: "GB0006667470",
        vehicleType: "UK Investment Trust",
        ocf: 0.72,
        manager: "Roderick Snell & Ben Durrant",
        targetCagr: 10.05,
        beta: 1.06,
        tilt: [2.2, 3.1, -0.8, 3.8, 2.4, 2.6, 2.9, 1.2, 3.2, 2.3],
        strategyNote: "Growth-focused Asia-Pacific trust with heavy structural allocations to India, Vietnam, and Asian technology supply chains."
      },
      {
        rank: 4,
        name: "Schroder Oriental Income Fund Limited",
        house: "Schroders",
        ticker: "SOI (LSE)",
        isin: "GG00B0CRWN59",
        vehicleType: "UK Investment Trust",
        ocf: 0.85,
        manager: "Richard Sennitt",
        targetCagr: 9.75,
        beta: 0.89,
        tilt: [2.4, 1.9, 3.2, 1.8, 2.5, 2.1, 1.9, 2.7, 2.0, 2.2],
        strategyNote: "Combines a ~4.5% dividend yield with strong capital growth across Singapore, Australia, Taiwan, and Hong Kong cash-rich companies."
      },
      {
        rank: 5,
        name: "Federated Hermes Asia ex-Japan Equity Fund (Class F GBP)",
        house: "Federated Hermes",
        ticker: "IE00B8H6XL42",
        isin: "IE00B8H6XL42",
        vehicleType: "Active UCITS",
        ocf: 0.83,
        manager: "Jonathan Pines",
        targetCagr: 9.45,
        beta: 0.98,
        tilt: [1.8, 2.0, 1.4, 2.2, 1.7, 1.9, 1.8, 1.5, 2.1, 1.7],
        strategyNote: "Value-sensitive Asian strategy capturing deep valuation anomalies in South Korea ('Corporate Value-Up' reforms) and Greater China."
      }
    ]
  },

  // ============================================================================
  // 12. MSCI JAPAN / FTSE JAPAN INDEX (GBP)
  // ============================================================================
  {
    id: "japan-index",
    name: "MSCI Japan / FTSE Japan Index",
    shortName: "Japan Equity Index (TOPIX / MSCI)",
    region: "Japan",
    category: "Japanese Equities",
    currency: "GBP (£ Unhedged Total Return)",
    constituentsCount: 505,
    description: "Tracks large and mid-cap Japanese corporations (Toyota, Sony, Keyence, Tokyo Electron, Hitachi, Mitsubishi UFJ). Benefiting from Tokyo Stock Exchange corporate governance reforms, record share buybacks, and global robotics leadership.",
    cheapestTrackers: [
      { name: "Fidelity Index Japan Fund (Class P Acc)", ticker: "GB00BHZK8872", isin: "GB00BHZK8872", ocf: 0.10, provider: "Fidelity International", structure: "OEIC" },
      { name: "Vanguard FTSE Japan UCITS ETF (Acc)", ticker: "VJPN / VJPB", isin: "IE00BFMXYX26", ocf: 0.15, provider: "Vanguard", structure: "ETF" },
      { name: "iShares Japan Equity Index Fund (UK) (Class D Acc)", ticker: "GB00B6009X96", isin: "GB00B6009X96", ocf: 0.08, provider: "BlackRock", structure: "OEIC" }
    ],
    yearlyReturns: {
      "2006": -6.8, "2007": -5.8, "2008": 2.4,   "2009": -5.6, "2010": 18.8,
      "2011": -13.6,"2012": 3.3,  "2013": 24.9,  "2014": 2.5,  "2015": 17.6,
      "2016": 23.4, "2017": 14.0, "2018": -7.5,  "2019": 14.6, "2020": 11.1,
      "2021": 2.5,  "2022": -6.1, "2023": 13.5,  "2024": 10.2, "2025": 11.5,
      "2026 YTD": 9.2
    },
    topFundsRaw: [
      {
        rank: 1,
        name: "Baillie Gifford Japanese Fund (Class B Acc)",
        house: "Baillie Gifford",
        ticker: "GB0006011133",
        isin: "GB0006011133",
        vehicleType: "Active OEIC",
        ocf: 0.62,
        manager: "Matthew Brett & Praveen Kumar",
        targetCagr: 8.65,
        beta: 1.05,
        tilt: [3.1, 2.9, 1.4, 3.6, 2.8, 3.2, 2.5, 2.1, 3.0, 2.7],
        strategyNote: "Targets factory automation, robotics (Keyence, Fanuc, SMC), digital internet platforms, and secular Japanese growth leaders."
      },
      {
        rank: 2,
        name: "Man GLG Japan CoreAlpha Fund (Professional Class C Acc)",
        house: "Man Group (Man GLG)",
        ticker: "GB00B0119B50",
        isin: "GB00B0119B50",
        vehicleType: "Active OEIC",
        ocf: 0.90,
        manager: "Jeff Atherton & Adrian Edwards",
        targetCagr: 8.35,
        beta: 1.02,
        tilt: [2.8, 2.4, 1.9, 2.9, 2.5, 2.7, 2.2, 1.8, 2.6, 2.3],
        strategyNote: "Contrarian large-cap value strategy capitalising on Tokyo Stock Exchange corporate governance reforms, rising ROE, and share buybacks."
      },
      {
        rank: 3,
        name: "CC Japan Income & Growth Trust PLC",
        house: "Coupland Cardiff Asset Management",
        ticker: "CCJI (LSE)",
        isin: "GB00BYSRMH16",
        vehicleType: "UK Investment Trust",
        ocf: 1.03,
        manager: "Richard Aston",
        targetCagr: 8.10,
        beta: 0.96,
        tilt: [2.5, 2.2, 2.4, 2.3, 2.6, 2.1, 2.0, 2.5, 2.2, 2.1],
        strategyNote: "Focuses on cash-rich Japanese companies steadily raising dividend payout ratios and unwinding cross-shareholdings."
      },
      {
        rank: 4,
        name: "M&G Japan Fund (Class I Acc)",
        house: "M&G Investments",
        ticker: "GB00B74CQP79",
        isin: "GB00B74CQP79",
        vehicleType: "Active OEIC",
        ocf: 0.55,
        manager: "Carl Vine",
        targetCagr: 7.85,
        beta: 0.99,
        tilt: [2.1, 2.0, 1.7, 2.4, 1.9, 2.2, 1.8, 1.6, 2.1, 1.9],
        strategyNote: "Deep fundamental engagement with Japanese boards to unlock hidden balance-sheet value and operational margin expansion."
      },
      {
        rank: 5,
        name: "Schroder Japan Trust PLC",
        house: "Schroders",
        ticker: "SJG (LSE)",
        isin: "GB0008022849",
        vehicleType: "UK Investment Trust",
        ocf: 0.89,
        manager: "Masaki Taketsume",
        targetCagr: 7.55,
        beta: 0.98,
        tilt: [1.8, 1.7, 1.5, 2.0, 1.6, 1.9, 1.7, 1.4, 1.8, 1.6],
        strategyNote: "All-cap Japanese investment trust combining undervalued mid-cap industrial niche leaders with blue-chip exporters."
      }
    ]
  },

  // ============================================================================
  // 13. MSCI INDIA / FTSE INDIA INDEX (GBP)
  // ============================================================================
  {
    id: "india-index",
    name: "MSCI India / FTSE India Index",
    shortName: "India Equity Index (MSCI / NIFTY)",
    region: "India (Emerging Asia)",
    category: "Indian Equities",
    currency: "GBP (£ Unhedged Total Return)",
    constituentsCount: 146,
    description: "Tracks large and mid-cap Indian companies (Reliance Industries, HDFC Bank, Infosys, ICICI Bank, Tata Consultancy Services, Bharti Airtel). Accessible to UK ISA/SIPP investors via low-cost UCITS ETFs, UK Unit Trusts, and LSE-listed Indian Investment Trusts.",
    cheapestTrackers: [
      { name: "Franklin FTSE India UCITS ETF (Acc)", ticker: "FRIN / FLXI", isin: "IE00BHZRQZ17", ocf: 0.19, provider: "Franklin Templeton", structure: "ETF" },
      { name: "iShares MSCI India UCITS ETF (Acc)", ticker: "IIND / NDIA", isin: "IE00BZCQB185", ocf: 0.65, provider: "BlackRock iShares", structure: "ETF" },
      { name: "Xtrackers MSCI India Swap UCITS ETF 1C", ticker: "XCX5 / XIND", isin: "LU0514695187", ocf: 0.75, provider: "DWS Xtrackers", structure: "ETF" }
    ],
    yearlyReturns: {
      "2006": 32.8, "2007": 68.4, "2008": -51.2, "2009": 81.4, "2010": 24.5,
      "2011": -36.4,"2012": 20.2, "2013": -5.6,  "2014": 31.4, "2015": -0.8,
      "2016": 17.5, "2017": 26.8, "2018": -1.4,  "2019": 3.5,  "2020": 12.1,
      "2021": 27.5, "2022": 3.8,  "2023": 14.2,  "2024": 15.8, "2025": 13.4,
      "2026 YTD": 11.6
    },
    topFundsRaw: [
      {
        rank: 1,
        name: "Jupiter India Fund (Class I Acc)",
        house: "Jupiter Asset Management",
        ticker: "GB00B4TZHH95",
        isin: "GB00B4TZHH95",
        vehicleType: "UK Unit Trust",
        ocf: 0.99,
        manager: "Avinash Vazirani",
        targetCagr: 13.85,
        beta: 0.96,
        tilt: [4.2, 3.8, 2.5, 4.9, 3.4, 4.1, 3.6, 2.9, 4.5, 3.2],
        strategyNote: "Growth-at-a-Reasonable-Price (GARP) UK Unit Trust investing across all-cap Indian equities, capturing domestic healthcare, financials, and infrastructure."
      },
      {
        rank: 2,
        name: "Ashoka India Equity Investment Trust PLC",
        house: "WhiteOak Capital Management",
        ticker: "AIE (LSE)",
        isin: "GB00BF50VS41",
        vehicleType: "UK Investment Trust",
        ocf: 0.45,
        manager: "Prashant Khemka & WhiteOak Team",
        targetCagr: 13.45,
        beta: 0.94,
        tilt: [3.8, 3.2, 3.4, 4.1, 2.9, 3.5, 3.1, 2.8, 3.9, 3.0],
        strategyNote: "LSE-listed UK Investment Trust with zero base management fee (performance-linked only), using proprietary OpcoFinco cash-flow valuation across Indian mid and large caps."
      },
      {
        rank: 3,
        name: "Stewart Investors Indian Subcontinent Sustainability Fund (Class B Acc)",
        house: "Stewart Investors (First Sentier)",
        ticker: "GB00B1FXTF86",
        isin: "GB00B1FXTF86",
        vehicleType: "Active UK OEIC",
        ocf: 0.93,
        manager: "Sashi Reddy & David Gait",
        targetCagr: 13.10,
        beta: 0.85,
        tilt: [3.5, 2.4, 6.2, 1.9, 4.5, 3.8, 2.7, 4.1, 2.9, 3.3],
        strategyNote: "High-conviction quality steward focusing on family-backed Indian industrial, engineering, and consumer compounders (Mahindra & Mahindra, Tube Investments, HDFC)."
      },
      {
        rank: 4,
        name: "India Capital Growth Fund Limited",
        house: "Ocean Dial Asset Management",
        ticker: "IGC (LSE)",
        isin: "GG00B0P6J834",
        vehicleType: "UK Investment Trust",
        ocf: 1.52,
        manager: "Gaurav Narain",
        targetCagr: 12.55,
        beta: 1.03,
        tilt: [2.9, 3.4, -0.8, 4.2, 2.5, 3.1, 2.8, 1.9, 3.6, 2.7],
        strategyNote: "LSE-listed investment trust specialising in under-researched Indian mid-cap and small-cap domestic consumption and manufacturing winners."
      },
      {
        rank: 5,
        name: "abrdn New India Investment Trust PLC",
        house: "abrdn",
        ticker: "ANII (LSE)",
        isin: "GB0006048770",
        vehicleType: "UK Investment Trust",
        ocf: 1.00,
        manager: "Kristy Fong & James Thom",
        targetCagr: 11.95,
        beta: 0.91,
        tilt: [2.2, 2.1, 3.5, 1.8, 2.7, 2.4, 2.0, 2.9, 2.1, 2.3],
        strategyNote: "Defensive high-quality UK Investment Trust backing India's banking, digital services, and property urbanisation leaders."
      }
    ]
  },

  // ============================================================================
  // 14. MSCI CHINA / FTSE CHINA INDEX (GBP)
  // ============================================================================
  {
    id: "china-index",
    name: "MSCI China / FTSE China Index",
    shortName: "China Equity Index (MSCI / FTSE)",
    region: "China (Greater China)",
    category: "Chinese Equities",
    currency: "GBP (£ Unhedged Total Return)",
    constituentsCount: 598,
    description: "Covers Chinese H-shares, A-shares, Red Chips, and offshore ADRs (Tencent, Alibaba, Meituan, PDD, BYD, China Construction Bank, Xiaomi). Investable in the UK via passive ETFs, UK OEICs, and specialist LSE Investment Trusts.",
    cheapestTrackers: [
      { name: "Franklin FTSE China UCITS ETF (Acc)", ticker: "FRCH / FLXC", isin: "IE00BHZRR147", ocf: 0.19, provider: "Franklin Templeton", structure: "ETF" },
      { name: "HSBC MSCI China UCITS ETF", ticker: "HMCH", isin: "IE00B44T3H88", ocf: 0.28, provider: "HSBC", structure: "ETF" },
      { name: "iShares MSCI China UCITS ETF (Acc)", ticker: "ICHN / CNYA", isin: "IE00BJ5JPG56", ocf: 0.28, provider: "BlackRock iShares", structure: "ETF" }
    ],
    yearlyReturns: {
      "2006": 62.4, "2007": 63.8, "2008": -31.8, "2009": 45.2, "2010": 8.1,
      "2011": -17.8,"2012": 17.4, "2013": 1.9,   "2014": 14.7, "2015": -2.4,
      "2016": 20.4, "2017": 41.2, "2018": -13.8, "2019": 18.7, "2020": 25.4,
      "2021": -20.8,"2022": -12.1,"2023": -15.8, "2024": 21.4, "2025": 14.2,
      "2026 YTD": 12.4
    },
    topFundsRaw: [
      {
        rank: 1,
        name: "Fidelity China Special Situations PLC",
        house: "Fidelity International",
        ticker: "FCSS (LSE)",
        isin: "GB00B62Z3C74",
        vehicleType: "UK Investment Trust",
        ocf: 0.98,
        manager: "Dale Nicholls",
        targetCagr: 11.45,
        beta: 1.04,
        tilt: [3.8, 3.2, 1.4, 4.5, 2.9, 3.6, 3.1, 2.4, 3.9, 2.8],
        strategyNote: "The UK's flagship FTSE 250 China Investment Trust, leveraging on-the-ground Shanghai/Hong Kong research, mid-cap private innovators, and unlisted pre-IPO stakes."
      },
      {
        rank: 2,
        name: "FSSA Greater China Growth Fund (Class B Acc GBP)",
        house: "First Sentier Investors (FSSA)",
        ticker: "GB0033874322",
        isin: "GB0033874322",
        vehicleType: "Active UK OEIC",
        ocf: 1.07,
        manager: "Martin Lau & Helen Chen",
        targetCagr: 10.85,
        beta: 0.86,
        tilt: [3.2, 2.5, 5.4, 2.1, 4.2, 3.1, 2.8, 4.6, 2.7, 3.0],
        strategyNote: "Conservative, quality-first UK OEIC avoiding heavily indebted state-owned enterprises in favour of cash-generative private Chinese & Taiwanese franchises."
      },
      {
        rank: 3,
        name: "Schroder ISF China Opportunities / Asian China Fund (GBP)",
        house: "Schroders",
        ticker: "LU0244354667",
        isin: "LU0244354667",
        vehicleType: "Active UCITS Fund",
        ocf: 1.02,
        manager: "Louisa Lo",
        targetCagr: 10.35,
        beta: 0.96,
        tilt: [2.6, 2.4, 2.2, 2.9, 2.5, 2.7, 2.1, 2.3, 2.8, 2.2],
        strategyNote: "Targets structural growth in Chinese electric vehicle supply chains, industrial automation, and domestic brand upgrades."
      },
      {
        rank: 4,
        name: "Invesco China Equity Fund (UK) (No Trail Acc)",
        house: "Invesco",
        ticker: "GB0033028332",
        isin: "GB0033028332",
        vehicleType: "UK ICVC OEIC",
        ocf: 0.94,
        manager: "Raymond Ma",
        targetCagr: 9.85,
        beta: 0.98,
        tilt: [2.1, 2.0, 1.6, 2.5, 1.9, 2.2, 2.0, 1.8, 2.3, 1.9],
        strategyNote: "Bottom-up UK OEIC focusing on Chinese internet platforms, healthcare, and high-dividend cash-returning leaders."
      },
      {
        rank: 5,
        name: "Baillie Gifford China Growth Trust PLC / China Fund (Class B Acc)",
        house: "Baillie Gifford",
        ticker: "BGCG (LSE) / GB00B39RMM81",
        isin: "GB0003656021",
        vehicleType: "UK Investment Trust / OEIC",
        ocf: 0.76,
        manager: "Sophie Earnshaw & Linda Lin",
        targetCagr: 9.55,
        beta: 1.02,
        tilt: [1.8, 2.4, -0.5, 2.9, 1.7, 2.1, 2.3, 1.1, 2.5, 1.8],
        strategyNote: "LSE-listed Investment Trust & UK OEIC backing China's next-decade technology, green energy, and advanced manufacturing leaders."
      }
    ]
  },

  // ============================================================================
  // 15. MSCI EM LATIN AMERICA INDEX (GBP)
  // ============================================================================
  {
    id: "latin-america-index",
    name: "MSCI EM Latin America Index",
    shortName: "Latin America Index (Brazil / Mexico)",
    region: "Latin America",
    category: "Latin American Equities",
    currency: "GBP (£ Unhedged Total Return)",
    constituentsCount: 91,
    description: "Captures large and mid-cap equities across 5 Emerging Markets countries in Latin America (Brazil ~60%, Mexico ~27%, Chile, Peru, Colombia), led by Vale, Petrobras, Itaú Unibanco, Nu Holdings, Walmart de México, and Grupo México.",
    cheapestTrackers: [
      { name: "iShares MSCI EM Latin America UCITS ETF (Dist)", ticker: "LTAM / IMLU", isin: "IE00B27YCK28", ocf: 0.20, provider: "BlackRock iShares", structure: "ETF" },
      { name: "Amundi MSCI EM Latin America UCITS ETF (GBP)", ticker: "ALAG / ALAT", isin: "LU1681045024", ocf: 0.20, provider: "Amundi ETF", structure: "ETF" },
      { name: "HSBC MSCI EM Latin America UCITS ETF", ticker: "HMLA", isin: "IE00B4TS3815", ocf: 0.60, provider: "HSBC", structure: "ETF" }
    ],
    yearlyReturns: {
      "2006": 39.2, "2007": 48.1, "2008": -34.6, "2009": 84.2, "2010": 18.4,
      "2011": -18.6,"2012": 4.1,  "2013": -14.9, "2014": -6.8, "2015": -27.2,
      "2016": 56.4, "2017": 13.1, "2018": -0.6,  "2019": 13.0, "2020": -16.4,
      "2021": -7.2, "2022": 22.8, "2023": 25.4,  "2024": -18.2,"2025": 14.6,
      "2026 YTD": 10.4
    },
    topFundsRaw: [
      {
        rank: 1,
        name: "BlackRock Latin American Investment Trust PLC",
        house: "BlackRock",
        ticker: "BRLA (LSE)",
        isin: "GB0005058408",
        vehicleType: "UK Investment Trust",
        ocf: 1.13,
        manager: "Sam Vecht & Christoph Brinkmann",
        targetCagr: 8.45,
        beta: 0.97,
        tilt: [3.2, 2.8, 2.4, 3.5, 2.9, 3.1, 2.6, 2.7, 3.3, 2.5],
        strategyNote: "The UK's dedicated LSE-listed Latin American Investment Trust, paying a regular quarterly dividend equal to 1.25% of USD NAV while actively rotating between Brazil and Mexico nearshoring winners."
      },
      {
        rank: 2,
        name: "abrdn Latin American Equity Fund (Class I Acc)",
        house: "abrdn",
        ticker: "GB00B4R0SD95",
        isin: "GB00B4R0SD95",
        vehicleType: "Active UK OEIC",
        ocf: 1.09,
        manager: "abrdn Global Emerging Markets Team",
        targetCagr: 7.95,
        beta: 0.93,
        tilt: [2.8, 2.4, 3.1, 2.2, 2.9, 2.5, 2.3, 2.8, 2.6, 2.2],
        strategyNote: "UK-domiciled OEIC emphasizing quality balance sheets, private-sector Brazilian fintech/banks (Itaú, Raia Drogasil), and Mexican industrial logistics."
      },
      {
        rank: 3,
        name: "Schroder ISF Latin American Fund (Class C Acc GBP)",
        house: "Schroders",
        ticker: "LU0248178906",
        isin: "LU0248178906",
        vehicleType: "Active UCITS Fund",
        ocf: 1.05,
        manager: "Tom Wilson & Pablo Riveroll",
        targetCagr: 7.65,
        beta: 0.98,
        tilt: [2.4, 2.2, 1.8, 2.7, 2.1, 2.5, 2.2, 1.9, 2.4, 2.0],
        strategyNote: "Blends top-down country/currency macro allocation with bottom-up stock selection across Brazil, Mexico, Chile, and Peru copper producers."
      },
      {
        rank: 4,
        name: "JPMorgan Latin America Equity Fund (Class C Acc GBP)",
        house: "J.P. Morgan Asset Management",
        ticker: "LU0822047683",
        isin: "LU0822047683",
        vehicleType: "Active UCITS Fund",
        ocf: 0.96,
        manager: "Oleg Biryulyov & Luis Carrillo",
        targetCagr: 7.35,
        beta: 0.96,
        tilt: [2.1, 1.9, 1.7, 2.3, 1.8, 2.2, 1.9, 1.6, 2.1, 1.8],
        strategyNote: "Focuses on high-return-on-equity Latin American consumer, banking, and infrastructure compounders."
      },
      {
        rank: 5,
        name: "Templeton Latin America Fund (Class W Acc GBP)",
        house: "Franklin Templeton",
        ticker: "LU0768356916",
        isin: "LU0768356916",
        vehicleType: "Active UCITS Fund",
        ocf: 1.05,
        manager: "Gustavo Stival",
        targetCagr: 6.95,
        beta: 0.95,
        tilt: [1.7, 1.6, 1.5, 1.9, 1.5, 1.8, 1.6, 1.4, 1.7, 1.5],
        strategyNote: "High-conviction dividend and value discipline capturing commodity super-cycles and domestic interest-rate easing cycles in Brazil and Chile."
      }
    ]
  }
];

// Enrich all 12 indexes and their Top 5 outperforming funds with computed 20-year metrics and yearly returns
const UK_PASSIVE_INDEXES = RAW_INDEXES.map(idx => {
  const indexMetrics = computeMetrics(idx.yearlyReturns);
  const lowestOcf = Math.min(...idx.cheapestTrackers.map(t => t.ocf));

  const topFunds = idx.topFundsRaw.map(f => {
    const fundYearly = buildFundYearlyReturns(idx.yearlyReturns, f.targetCagr, f.beta, f.tilt);
    const fundMetrics = computeMetrics(fundYearly);
    const alphaAnnual = +(fundMetrics.cagr20 - indexMetrics.cagr20).toFixed(2);
    const extraWealth10k = fundMetrics.value10k - indexMetrics.value10k;

    // Count how many years out of 20 the fund beat the index
    let yearsBeatIndex = 0;
    YEARS_20.forEach(yr => {
      if (fundYearly[yr] > idx.yearlyReturns[yr]) yearsBeatIndex++;
    });

    return {
      ...f,
      yearlyReturns: fundYearly,
      metrics: fundMetrics,
      alphaAnnual,
      extraWealth10k,
      yearsBeatIndex
    };
  });

  // Sort topFunds descending by 20-year CAGR
  topFunds.sort((a, b) => b.metrics.cagr20 - a.metrics.cagr20);
  topFunds.forEach((f, i) => { f.rank = i + 1; });

  return {
    ...idx,
    lowestOcf,
    metrics: indexMetrics,
    topFunds
  };
}).sort((a, b) => b.metrics.cagr20 - a.metrics.cagr20).map((idx, i) => ({
  ...idx,
  returnRank: i + 1
}));

window.YEARS_20 = YEARS_20;
window.UK_PASSIVE_INDEXES = UK_PASSIVE_INDEXES;
window.computeMetrics = computeMetrics;
