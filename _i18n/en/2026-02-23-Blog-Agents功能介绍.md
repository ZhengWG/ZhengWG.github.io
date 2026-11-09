---
title: "Introducing the Blog Agents"
description: "An overview of the Agents page on this blog: its hub and sub-agent architecture, the house_price_analyzer and ai_tracker agents, and the technology behind them."
---

## Preface

I recently added an [**Agents**](https://johneyzheng.top/agents/) page to the blog: an interactive analysis tool platform integrated into the blog sidebar. Unlike traditional static posts, the Agents page offers analysis that is interactive, configurable, and backed by continuously updated data. Two agents are live so far: **house_price_analyzer** (housing price analyzer) and **ai_tracker** (AI frontier tracker).

This post covers the design of the whole Agents system, the features of each agent, and the technical implementation behind them.

Mainly helped by [Cluade](http://claude.ai/).

## Overall Architecture

### Agent Hub

The Agents page uses a two-level **Hub + Sub-agent** architecture:

- **Hub layer**: shows an overview card for every available agent, including its name, description, tags, and online status. Clicking a card opens that agent's detail page
- **Sub-agent layer**: each agent has its own interactive interface

### Tech Stack

- **Frontend rendering**: plain JavaScript plus the Plotly.js charting library, with no additional framework dependencies
- **Data storage**: static JSON files hosted under `assets/data/`, updated automatically by GitHub Actions
- **Data collection**: a Python crawler toolchain (`tools/house_price/`) that supports aggregating multiple data sources
- **AI analysis**: integrates the DeepSeek API and supports streaming output (SSE)

## Agent 1: house_price_analyzer

The housing price analyzer is a multi-dimensional data analysis tool for the real estate market in Chinese cities. It currently covers all 12 districts of Hangzhou.

### Feature Modules

#### 1. Price Trend (Trend)

- **City-wide trend**: shows the historical trend line of average prices for second-hand and new homes, with an MA6 moving average overlaid to help judge the trend direction
- **District comparison**: pick multiple districts with the Chip selector and compare their trends on the same axes
- Supports switching between second-hand and new homes

#### 2. Latest Prices (Latest)

- **Key metric cards**: the citywide average price, the highest and lowest districts, and the total number of districts at a glance
- **District bar chart**: sorted by average price in descending order, with colors distinguishing year-over-year rises and falls
- **District detail table**: shows each district's latest average price and its year-over-year change
- **Sub-district average prices**: after you choose a district, shows the price details of each sub-district in it
- **Residential community price breakdown**:
  - Price range distribution chart (<20k, 20-30k, 30-40k... 80k+)
  - Paginated browsing of all community data, with page number jumping

#### 3. Buy Timing Assessment (Timing)

This is the core analysis module. It uses a quantitative scoring system:

**Five-dimension scoring model (100 points total)**:

| Dimension | Weight | Evaluation logic |
|------|------|----------|
| Price position | 30% | The percentile of the current price within its historical range; lower is better |
| Trend | 25% | MA3/MA6 crossover to judge rising, falling, or consolidating |
| Momentum | 20% | Pattern recognition on the month-over-month changes of the last 3 months (such as a bottom reversal signal) |
| Year-over-year | 15% | The larger the year-over-year drop, the higher the buying value |
| Volatility | 10% | Standard deviation divided by mean over the last 6 months; lower volatility is more stable |

**Rating criteria**:

- ≥80 points: strongly recommended to buy
- ≥65 points: recommended to buy
- ≥50 points: worth considering
- ≥35 points: recommended to wait and see
- <35 points: strongly recommended to wait and see

It also provides:
- **Radar chart**: a visual comparison of the five-dimension metrics of the Top 6 districts
- **District detail expansion panel**: each district can be expanded to show a mini chart of the last 12 months, key metrics, and community-level data

#### 4. AI Deep Analysis

Integrates the DeepSeek large language model and supports two analysis modes:

- **Global analysis**: aggregates the scores, sub-districts, and Top 20 community data of all districts in the city to generate a comprehensive report covering a market phase judgment, a district comparison, and value-for-money recommendations
- **District deep analysis**: for a single district, takes the last 36 months of historical prices, sub-district average prices, and the full community data as input, and generates a sub-district divergence analysis, community-level recommendations, and an outlook on future trends

Analysis reports are streamed over SSE, and the Markdown content is rendered in real time.

### Data Pipeline

The data collection layer uses a multi-source aggregation strategy:
- **GoToHui**: provides city- and district-level historical average price series (from 2018 to the present)
- **Beike**: provides community-level real-time prices and month-over-month data

A GitHub Actions workflow runs automatically every day. It includes data validation (at least 3 districts, at least 12 historical records) and a failure rollback mechanism, so the online data is always usable.

## Agent 2: ai_tracker

The AI frontier tracker helps you quickly keep up with the latest papers and open-source project updates in the AI Infra field.

### Paper Tracking (Papers)

- Searches arXiv papers by keyword through the **Semantic Scholar API**
- Supports filtering by title, author, and keyword
- Supports filtering by date range
- Shows the paper abstract (expandable), authors, and category tags
- Built-in translation feature

The default tracked keywords cover the core directions of LLM inference optimization:
- Eagle VLM inference / LLM inference optimization
- Speculative decoding / FlashAttention kernel
- Continuous batching / RL infrastructure
- vLLM & SGLang serving

### Project Tracking (GitHub Repos)

- Tracks the **Releases**, **Milestones**, and **Hot Issues** of specified GitHub repositories
- Shows the star count, the latest version number, and the release date
- Release notes can be expanded to view the full content

The projects tracked by default include SGLang, vLLM, OpenRLHF, Verl, Slime, AReaL, and other core open-source projects in the AI Infra field.

### Configurability

Through the Settings panel, users can:
- Customize the arXiv search keywords (add, delete, edit)
- Customize the tracked GitHub repositories
- Configure a GitHub Token to raise the API request quota (from 60 req/h to 5000 req/h)
- Adjust the maximum number of papers returned for each keyword

All settings are stored in the browser's localStorage, so your privacy is protected.

## Other

Future plans include extending housing price data support to more cities (the configurations for Beijing and Shanghai are already in place) and exploring more interesting agent scenarios. You are welcome to try it out on the Agents page!
