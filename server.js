const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data', 'assets.json');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

function readAssets() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
function writeAssets(assets) {
  const temp = DATA_FILE + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(assets, null, 2));
  fs.renameSync(temp, DATA_FILE);
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'AssetFlow API' }));
app.get('/api/assets', (_req, res) => {
  try { res.json(readAssets()); }
  catch (error) { res.status(500).json({ error: 'Unable to read asset database.' }); }
});
app.put('/api/assets', (req, res) => {
  const assets = req.body;
  if (!Array.isArray(assets)) return res.status(400).json({ error: 'Request body must be an array of assets.' });
  const ids = new Set();
  for (const asset of assets) {
    if (!asset || typeof asset !== 'object' || !asset.assetId || !asset.name || !asset.category)
      return res.status(400).json({ error: 'Every asset needs an asset ID, name, and category.' });
    const id = String(asset.assetId).trim().toLowerCase();
    if (ids.has(id)) return res.status(409).json({ error: `Duplicate asset ID: ${asset.assetId}` });
    ids.add(id);
    if (asset.value !== undefined && (!Number.isFinite(Number(asset.value)) || Number(asset.value) < 0))
      return res.status(400).json({ error: `Invalid asset value for ${asset.assetId}.` });
  }
  try { writeAssets(assets); res.json({ message: 'Assets saved successfully.', count: assets.length }); }
  catch (error) { res.status(500).json({ error: 'Unable to save asset database.' }); }
});

// Express 4 and Express 5 compatible frontend fallback.
// Avoid app.get('*'), which is invalid in Express 5.
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API route not found.' });
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
app.listen(PORT, () => console.log(`AssetFlow running at http://localhost:${PORT}`));
