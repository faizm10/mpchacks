const fs = require('fs');
const path = require('path');

function readJson(relativePath, fallback = null) {
  const fullPath = path.join(__dirname, '..', relativePath);
  if (!fs.existsSync(fullPath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (_err) {
    return fallback;
  }
}

function writeJson(relativePath, data) {
  const fullPath = path.join(__dirname, '..', relativePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
  return fullPath;
}

module.exports = {
  readJson,
  writeJson,
};
