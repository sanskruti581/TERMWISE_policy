const GROQ_MODEL = 'llama-3.1-8b-instant';

const fallbackSummary = (analysis) => {
  if (analysis.semanticNarrative) return analysis.semanticNarrative;

  if (!analysis.detectedRisks.length) {
    return `This ${String(analysis.documentSubtype || analysis.documentType || 'document').toLowerCase()} does not show major high-risk privacy language in the rule-based scan. Review the highlighted operational and legal clauses for practical obligations.`;
  }

  const categories = analysis.detectedRisks.map((risk) => risk.category.toLowerCase()).join(', ');
  const recommendation = analysis.recommendations?.[0]
    ? ` Start by reviewing this recommendation: ${analysis.recommendations[0]}`
    : '';
  return `The rule-based scan found concerns around ${categories}. The overall risk is ${analysis.riskLevel} with a privacy grade of ${analysis.privacyGrade}.${recommendation}`;
};

export const generateGroqSummary = async (text, analysis) => {
  if (!process.env.GROQ_API_KEY) {
    console.log('Groq API key not configured. Using local fallback summary.');
    return fallbackSummary(analysis);
  }

  try {
    const prompt = `Explain this document in plain English. If it appears to be a privacy policy, focus on risky clauses, data collection, retention, consent, and user impact. If it appears to be a contract or administrative document, explain the context and whether any privacy or confidentiality language is present. Keep it concise.\n\nDocument type: ${analysis.documentType}\nDocument subtype: ${analysis.documentSubtype || 'N/A'}\nClassification confidence: ${analysis.documentTypeConfidence}%\nRisk score: ${analysis.riskScore}/100\nGrade: ${analysis.privacyGrade}\nDetected risks: ${analysis.detectedRisks.map((risk) => risk.category).join(', ') || 'None'}\n\nDocument text:\n${text.slice(0, 9000)}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are a privacy policy analyst who explains legal language clearly and neutrally.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 450
      })
    });

    if (!response.ok) {
      console.warn(`Groq summary failed with status ${response.status}. Using fallback summary.`);
      return fallbackSummary(analysis);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || fallbackSummary(analysis);
  } catch (error) {
    console.warn(`Groq summary unavailable: ${error.message}. Using fallback summary.`);
    return fallbackSummary(analysis);
  }
};
