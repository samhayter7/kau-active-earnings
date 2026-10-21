# KAU Active Earnings — UI concepts

Nine responsive concepts for showing **live, counting-up active earnings** on pledged KAU in the Kinesis asset page, each shown on desktop and mobile side by side.

**Live page:** https://samhayter7.github.io/kau-active-earnings/

| # | Concept | Effort |
|---|---------|--------|
| 01 | Live earnings card (evolution of today's card) | Low |
| 02 | Odometer hero | Medium |
| 03 | Payout ring | Medium |
| 04 | Pledge ledger | Medium |
| 05 | Unified balance (P&L widget) | Medium–High |
| 06 | Live accrual chart | High |
| 07 | Ambient pill + earnings sheet | Medium |
| 08 | Empty state: pledge calculator | Medium |
| 09 | Buy & pledge + live activity row | Medium |

The page closes with implementation notes (precision vs tick rate, the live engine, motion and accessibility, copy) and a list of open product questions.

Use the **Time** control to fast-forward (1 day/s shows a monthly payout landing), and **Primary unit** to switch between KAU and USD.

Static HTML/CSS/JS with no build step. Run locally with `python3 -m http.server`. All data is demo data.
