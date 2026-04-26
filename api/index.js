const fetch = require('node-fetch');
const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN || 'steele-dev.myshopify.com';
const STOREFRONT_TOKEN = process.env.STOREFRONT_TOKEN || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const API_VERSION = '2024-10';
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const url = req.url;
  try {
    if (url.startsWith('/api/admin/products')) {
      if (!ADMIN_TOKEN) return res.status(401).json({error: 'Admin API token not configured. Set ADMIN_TOKEN in Vercel env vars.'});
      const params = new URLSearchParams(url.split('?')[1] || '');
      const limit = params.get('limit') || 250;
      const pageInfo = params.get('page_info') || '';
      const status = params.get('status') || 'any';
      let adminUrl = 'https://' + SHOPIFY_DOMAIN + '/admin/api/' + API_VERSION + '/products.json?limit=' + limit + '&status=' + status;
      if (pageInfo) adminUrl = 'https://' + SHOPIFY_DOMAIN + '/admin/api/' + API_VERSION + '/products.json?limit=' + limit + '&page_info=' + pageInfo;
      const r = await fetch(adminUrl, {headers: {'X-Shopify-Access-Token': ADMIN_TOKEN, 'Content-Type': 'application/json'}});
      const linkHeader = r.headers.get('link') || '';
      const data = await r.json();
      let nextPageInfo = '';
      const nextMatch = linkHeader.match(/page_info=([^>&]*)[^>]*>;\s*rel="next"/);
      if (nextMatch) nextPageInfo = nextMatch[1];
      data._nextPageInfo = nextPageInfo;
      return res.json(data);
    }
    if (url.startsWith('/api/collection/')) {
      const parts = url.replace('/api/collection/', '').split('?');
      const handle = parts[0];
      const params = new URLSearchParams(parts[1] || '');
      const cursor = params.get('cursor');
      const afterClause = cursor ? ', after: "' + cursor + '"' : '';
      const query = JSON.stringify({query: '{ collection(handle: "' + handle + '") { title products(first: 250' + afterClause + ') { pageInfo { hasNextPage endCursor } edges { node { id title handle productType tags availableForSale totalInventory priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } compareAtPriceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } images(first: 8) { edges { node { url altText } } } variants(first: 30) { edges { node { title sku availableForSale quantityAvailable price { amount currencyCode } selectedOptions { name value } } } } } } } } }'});
      const r = await fetch('https://' + SHOPIFY_DOMAIN + '/api/' + API_VERSION + '/graphql.json', {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN}, body: query});
      return res.json(await r.json());
    }
    if (url.startsWith('/api/collections')) {
      const query = JSON.stringify({query: '{ collections(first: 50) { edges { node { id title handle } } } }'});
      const r = await fetch('https://' + SHOPIFY_DOMAIN + '/api/' + API_VERSION + '/graphql.json', {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN}, body: query});
      return res.json(await r.json());
    }
    if (req.method === 'POST' && url.startsWith('/api/storefront')) {
      const r = await fetch('https://' + SHOPIFY_DOMAIN + '/api/' + API_VERSION + '/graphql.json', {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN}, body: JSON.stringify(req.body)});
      return res.json(await r.json());
    }
    return res.status(404).json({error: 'Not found'});
  } catch (e) { return res.status(500).json({error: e.message}); }
};
