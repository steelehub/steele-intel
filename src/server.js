const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Shopify credentials - set these as environment variables in production
const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN || 'steele-dev.myshopify.com';
const STOREFRONT_TOKEN = process.env.STOREFRONT_TOKEN || '69a579fe61d5eee679ffc364b7642e31';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''; // shpat_xxxxx - set in env
const API_VERSION = '2024-01';

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

// Storefront API proxy - for product browsing (AUD prices)
app.post('/api/storefront', async (req, res) => {
  try {
    const r = await fetch(`https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin API proxy - for orders, inventory, analytics
app.get('/api/admin/:resource', async (req, res) => {
  if (!ADMIN_TOKEN) return res.status(401).json({ error: 'Admin API token not configured' });
  try {
    const params = new URLSearchParams(req.query).toString();
    const url = `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/${req.params.resource}.json${params ? '?' + params : ''}`;
    const r = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': ADMIN_TOKEN },
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Products JSON proxy (returns in store default currency)
app.get('/api/products', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 250;
    const collection = req.query.collection;
    let url = collection
      ? `https://${SHOPIFY_DOMAIN}/collections/${collection}/products.json?limit=${limit}`
      : `https://${SHOPIFY_DOMAIN}/products.json?limit=${limit}&page=${page}`;
    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Collection list
app.get('/api/collections', async (req, res) => {
  try {
    const query = JSON.stringify({
      query: `{ collections(first: 50) { edges { node { id title handle productsCount { count } } } } }`
    });
    const r = await fetch(`https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: query,
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Collection products with AUD prices via Storefront API
app.get('/api/collection/:handle', async (req, res) => {
  try {
    const handle = req.params.handle;
    const cursor = req.query.cursor || null;
    const query = JSON.stringify({
      query: `{
        collection(handle: "${handle}") {
          title
          productsCount { count }
          products(first: 50${cursor ? `, after: "${cursor}"` : ''}) {
            pageInfo { hasNextPage endCursor }
            edges {
              node {
                id title handle productType tags availableForSale totalInventory createdAt updatedAt
                priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
                compareAtPriceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
                images(first: 8) { edges { node { url altText width height } } }
                variants(first: 30) {
                  edges {
                    node {
                      id title sku availableForSale quantityAvailable
                      price { amount currencyCode }
                      compareAtPrice { amount currencyCode }
                      selectedOptions { name value }
                    }
                  }
                }
              }
            }
          }
        }
      }`
    });
    const r = await fetch(`https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: query,
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Steele Product Intelligence running at http://localhost:${PORT}`);
  console.log(`Shopify Domain: ${SHOPIFY_DOMAIN}`);
  console.log(`Admin API: ${ADMIN_TOKEN ? 'Configured' : 'Not configured (set ADMIN_TOKEN env var)'}`);
});
