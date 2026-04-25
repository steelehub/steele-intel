# steele. Product Intelligence Platform

Live Shopify-connected analytics dashboard for Steele Label's product team.

## Features

- **Product Grid** - Browse all products with images, pricing, stock status
- **Collection Analysis** - Category breakdown, price architecture, size availability
- **Print Analysis** - Which prints/patterns are performing, with avg RRP per print
- **Silhouette Analysis** - Mini vs Midi vs Maxi dress split, category silhouette overview
- **Product Detail** - Full product view with all images, variant-level stock, tags
- **Live Data** - Pulls directly from Shopify Storefront API in real-time (AUD pricing)

## Quick Deploy to Vercel (5 minutes)

### Prerequisites
- A GitHub account
- A Vercel account (free at vercel.com)

### Steps

1. **Push to GitHub:**
   ```bash
   cd steele-intel
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create steele-intel --private --push
   ```

2. **Deploy to Vercel:**
   - Go to vercel.com/new
   - Import your GitHub repo
   - Add environment variables:
     - `SHOPIFY_DOMAIN` = `steele-dev.myshopify.com`
     - `STOREFRONT_TOKEN` = your Storefront API token
     - `ADMIN_TOKEN` = your Admin API token (optional, for orders/analytics)
   - Click Deploy

3. **Done!** Your app will be at `https://steele-intel.vercel.app`

## Run Locally

```bash
npm install
npm start
```

Open http://localhost:3000

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| SHOPIFY_DOMAIN | Yes | Your .myshopify.com domain |
| STOREFRONT_TOKEN | Yes | Storefront API access token |
| ADMIN_TOKEN | No | Admin API token for orders/analytics |
| PORT | No | Server port (default: 3000) |

## Architecture

- **Backend**: Express.js server that proxies Shopify API calls (solves CORS)
- **Frontend**: Vanilla JS single-page app (no build step needed)
- **Data**: Real-time from Shopify Storefront API (AUD pricing)
- **Hosting**: Any Node.js host (Vercel, Railway, Render, etc.)

## Security Notes

- Storefront API tokens are public-safe (read-only, same as what your website uses)
- Admin API token should be kept secret (set as env var, never in code)
- Rotate tokens periodically from Shopify Admin > Apps > Your App

## Upcoming Features

- Order data integration (requires Admin API)
- Sell-through rate tracking
- Season-over-season comparison
- Export to CSV/Excel
- Automated weekly reports
