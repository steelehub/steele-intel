const fetch = require('node-fetch');
const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN || 'steele-dev.myshopify.com';
const STOREFRONT_TOKEN = process.env.STOREFRONT_TOKEN || '69a579fe61d5eee679ffc364b7642e31';
const API_VERSION = '2024-01';
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const url = req.url;
  try {
    if (url.startsWith('/api/collection/')) {
      const handle = url.replace('/api/collection/', '').split('?')[0];
      const query = JSON.stringify({query: '{ collection(handle: "' + handle + '") { title products(first: 50) { edges { node { id title handle productType tags availableForSale totalInventory priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } compareAtPriceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } images(first: 8) { edges { node { url altText } } } variants(first: 30) { edges { node { title sku availableForSale quantityAvailable price { amount currencyCode } selectedOptions { name value } } } } } } } } }'});
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
