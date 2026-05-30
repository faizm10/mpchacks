function fallbackSummary(question, result) {
  if (result.intent === 'compare_spend' && Array.isArray(result.comparison)) {
    const text = result.comparison
      .map(x => `${x.department} spent $${Number(x.total || 0).toLocaleString()}`)
      .join(', ');
    return `Comparison for \"${question}\": ${text}.`;
  }

  const total = Number(result.total || 0).toLocaleString();
  const top = (result.topMerchants || []).join(', ');
  const topPhrase = top ? ` Most spend came from ${top}.` : '';
  return `${result.department || 'Selected department'} spent $${total} on ${String(result.category || 'the selected category').toLowerCase()} in ${String(result.dateRange || 'the selected period').replace('_', ' ')}.${topPhrase}`;
}

async function generateAISummary(question, result) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallbackSummary(question, result);

  const prompt = {
    question,
    result,
    instruction: 'Explain this computed expense result in 1-2 concise business sentences. Do not recalculate numbers.',
  };

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: JSON.stringify(prompt),
      }),
    });

    if (!response.ok) return fallbackSummary(question, result);

    const json = await response.json();
    const text = json?.output_text?.trim();
    return text || fallbackSummary(question, result);
  } catch (_e) {
    return fallbackSummary(question, result);
  }
}

module.exports = {
  generateAISummary,
};
