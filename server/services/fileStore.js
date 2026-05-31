const fs = require('fs');
const path = require('path');

function readJson(relativePath, fallback = null) {
  const fullPath = resolveJsonPath(relativePath);
  if (!fs.existsSync(fullPath)) {
    console.warn('[fileStore] JSON file not found', { relativePath, fullPath });
    return fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (err) {
    console.error('[fileStore] Failed to parse JSON', { relativePath, fullPath, error: err.message });
    return fallback;
  }
}

function writeJson(relativePath, data) {
  const fullPath = resolveJsonPath(relativePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
  return fullPath;
}

function resolveJsonPath(relativePath) {
  return path.join(__dirname, '..', relativePath);
}

module.exports = {
  readJson,
  writeJson,
  resolveJsonPath,
};
