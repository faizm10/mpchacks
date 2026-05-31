const categoryAliases = {
  gas: 'Fuel',
  gasoline: 'Fuel',
  diesel: 'Fuel',
  petrol: 'Fuel',
  fuel: 'Fuel',
  office_supplies: 'Equipment',
  'office supplies': 'Equipment',
  supplies: 'Equipment',
  equipment: 'Equipment',
  software: 'Software',
  saas: 'Software',
  meals: 'Meals',
  meal: 'Meals',
  food: 'Meals',
  travel: 'Travel',
  parking: 'Parking',
  shipping: 'Shipping',
  permits: 'Government / Permits',
  permit: 'Government / Permits',
};

function uniqueValues(transactions, field) {
  return [...new Set(
    transactions
      .map(txn => txn[field])
      .filter(value => value !== undefined && value !== null && String(value).trim() !== '')
      .map(String)
  )].sort();
}

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function aliasKey(value) {
  return normalizeKey(value).replace(/\s+/g, '_');
}

function findCanonicalValue(value, availableValues) {
  if (!value) return { value: null, matchType: 'empty' };

  const wanted = normalizeKey(value);
  const exact = availableValues.find(candidate => normalizeKey(candidate) === wanted);
  if (exact) return { value: exact, matchType: 'exact' };

  const partial = availableValues.find(candidate => {
    const normalizedCandidate = normalizeKey(candidate);
    return normalizedCandidate.includes(wanted) || wanted.includes(normalizedCandidate);
  });
  if (partial) return { value: partial, matchType: 'partial' };

  return { value: value, matchType: 'missing' };
}

function resolveCategory(rawCategory, message, availableCategories) {
  const rawCandidates = [rawCategory, message]
    .filter(Boolean)
    .map(String);

  for (const candidate of rawCandidates) {
    const normalized = normalizeKey(candidate);
    const underscored = aliasKey(candidate);

    const directAlias = categoryAliases[normalized] || categoryAliases[underscored];
    if (directAlias) {
      const canonical = findCanonicalValue(directAlias, availableCategories);
      return {
        value: canonical.value,
        requested: rawCategory || candidate,
        matchType: `alias:${directAlias}`,
      };
    }

    for (const [alias, category] of Object.entries(categoryAliases)) {
      const normalizedAlias = normalizeKey(alias);
      if (new RegExp(`\\b${escapeRegExp(normalizedAlias)}\\b`, 'i').test(normalized)) {
        const canonical = findCanonicalValue(category, availableCategories);
        return {
          value: canonical.value,
          requested: rawCategory || alias,
          matchType: `alias:${category}`,
        };
      }
    }
  }

  const canonical = findCanonicalValue(rawCategory, availableCategories);
  return {
    value: canonical.value,
    requested: rawCategory,
    matchType: canonical.matchType,
  };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function closestValue(value, availableValues) {
  if (!value || availableValues.length === 0) return null;
  const wanted = normalizeKey(value);
  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of availableValues) {
    const score = levenshtein(wanted, normalizeKey(candidate));
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function canonicalizeQuery(query, message, transactions) {
  const available = {
    categories: uniqueValues(transactions, 'category'),
    departments: uniqueValues(transactions, 'department'),
    merchantNames: uniqueValues(transactions, 'merchantName'),
    countries: uniqueValues(transactions, 'country'),
    stateProvinces: uniqueValues(transactions, 'stateProvince'),
  };

  const categoryResolution = resolveCategory(query.category, message, available.categories);
  const departmentResolution = findCanonicalValue(query.department, available.departments);
  const merchantResolution = findCanonicalValue(query.merchant, available.merchantNames);
  const countryResolution = findCanonicalValue(query.country, available.countries);
  const stateResolution = findCanonicalValue(query.stateProvince, available.stateProvinces);

  const canonicalQuery = {
    ...query,
    category: categoryResolution.value,
    department: departmentResolution.value,
    merchant: merchantResolution.value,
    country: countryResolution.value,
    stateProvince: stateResolution.value,
  };

  return {
    query: canonicalQuery,
    available,
    resolution: {
      category: {
        ...categoryResolution,
        closest: categoryResolution.matchType === 'missing' ? closestValue(categoryResolution.requested, available.categories) : null,
      },
      department: {
        requested: query.department,
        value: departmentResolution.value,
        matchType: departmentResolution.matchType,
        closest: departmentResolution.matchType === 'missing' ? closestValue(query.department, available.departments) : null,
      },
      merchant: {
        requested: query.merchant,
        value: merchantResolution.value,
        matchType: merchantResolution.matchType,
      },
      country: {
        requested: query.country,
        value: countryResolution.value,
        matchType: countryResolution.matchType,
      },
      stateProvince: {
        requested: query.stateProvince,
        value: stateResolution.value,
        matchType: stateResolution.matchType,
      },
    },
  };
}

module.exports = {
  categoryAliases,
  canonicalizeQuery,
  findCanonicalValue,
  uniqueValues,
};
