# UK Passive Tracker Indexes & Top 5 Outperforming Funds (20-Year Returns)

Interactive UK FinTech web application cataloging **all 12 major UK-investable passive tracker indexes** (ISA, SIPP, and GIA eligible), their **20-year annual percentage returns (`2006`–`2025` + `2026 YTD`)** in GBP (£) Total Return, and the **Top 5 outperforming funds (60 funds total)** that achieved higher long-term growth than each index.

## Key Features
- **12 UK-Investable Passive Tracker Indexes**: S&P 500, NASDAQ-100, FTSE All-World, MSCI World, FTSE 100, FTSE All-Share, FTSE 250, Global Technology, Europe ex-UK, Emerging Markets, Asia Pacific ex-Japan, and Japan.
- **20-Year Yearly % Return Matrix (`2006`–`2025` + `2026 YTD`)**: View year-by-year GBP total returns across all 12 benchmark indexes and compare against each index's Top 5 outperforming funds.
- **Cheapest UK Tracker ETFs & OEICs**: Ticker, ISIN, structure, and Ongoing Charges Figure (OCF %) for Vanguard, BlackRock iShares, Fidelity, HSBC, SPDR, Invesco, and Legal & General trackers.
- **Top 5 Outperforming Funds per Index**: Ranked by 20-year CAGR (%), Excess Annual Alpha (`+% p.a.`), £10,000 20-year compounded value, and calendar-year win ratio.
- **Interactive Dual Charts & CSV Export**: 20-year annual return bar chart, 20-year cumulative compounded growth chart, and one-click CSV spreadsheet export.

## Running Locally
- Double-click `run_passive_trackers.bat` in the root folder, or run:
  ```bash
  node server.js
  # or
  python server.py
  ```
  Opens automatically at `http://127.0.0.1:8075`.
