# Model Benchmarking Q2 2026

A static HTML/CSS/JS report tracking ten frontier models: specs, public benchmarks, pricing, and which job each one is actually built for. Entries without primary-source evidence are clearly marked as unpublished.

**Designed & Developed By: Prateek Dutta**  
Copyright © 2026. All rights reserved.

## Open the report

No build step or server is required.

1. Open `index.html` in a browser (double-click, or drag it into Chrome, Edge, Firefox, or Safari).
2. Optional local server (avoids some `file://` quirks with fonts/CDNs):

```bash
npx serve .
```

Then visit the URL printed in the terminal.

## What it covers

| Model | Lab | Access |
| --- | --- | --- |
| Hy4 Preview | Tencent Hunyuan | Open weights (Apache 2.0) + API |
| Moonshot Kimi K3 | Moonshot AI | Open weights (custom licence) + API |
| Claude Fable 5.1 | Anthropic | Generally available API |
| Claude Mythos 5.1 | Anthropic | Project Glasswing (restricted) |
| GLM-5.3 Flash | Z.ai (Zhipu) | Open weights (MIT) + API |
| Gemini 3.8 Flash | Google DeepMind | Generally available API |
| GPT-5.6 Cyber | OpenAI | Daybreak Red (restricted) |
| GPT 6 Astra | OpenAI | Unannounced; awaiting primary-source verification |
| Muse Glimmer 30B | Meta | Open weights, consumer GPU |
| Qwen3.8-Max | Alibaba Qwen | API + open weights (custom licence) |

Scores are compiled from vendor launch tables and independent boards (Artificial Analysis, vals.ai, DeepSWE, BenchLM) as of **3 September 2026**. Harnesses and effort levels differ; treat rankings as directional, not a single procurement score.

## Pages and sections

- **Method** — how this compilation is scored and how to read gaps vs noise
- **Models** — filterable cards (open / closed / restricted / local)
- **Benches** — what each eval tests (Terminal-Bench, SWE-Pro, DeepSWE, GPQA, HLE, OSWorld, GDPval, and related splits)
- **Charts** — capability radar and per-benchmark bars
- **Scores** — sortable table on desktop; stacked cards on phones
- **Findings** — four conclusions that survive the footnotes
- **Use cases** — best pick + alternative for coding, cost, local, science, cyber, computer-use, self-host
- **Technical details** — parameters, architecture, licence, serving floor
- **Pricing** — list USD per million tokens, with cache and intro-rate notes
- **Sources** — links to primary lab posts

## Theme

Light mode is the default. Use **Light / Dark** in the header to switch. The choice is stored in `localStorage` under `mb-theme`.

## Layout and browsers

Built to fit phones, tablets, laptops, and desktops (safe-area padding, hamburger nav, swipeable table). Aimed at current Chrome, Edge, Firefox, Safari (iOS 15+), Samsung Internet, and Opera.

Charts load Chart.js from jsDelivr, with a cdnjs fallback. If charts are blocked, tables and write-ups still work.

## Project files

```
benchmarking/
├── index.html      # Report shell
├── css/styles.css  # Layout, themes, responsive rules
├── js/data.js      # Model specs, scores, method copy
├── js/app.js       # Filters, charts, table, theme
└── README.md
```

To update numbers or copy, edit `js/data.js` and refresh the page.

## Disclaimer

This is a compiled professional brief, not a new live eval harness. It is not affiliated with the model providers. Re-run your own workload before a purchase or deployment decision.
