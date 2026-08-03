const dotenv = require('dotenv');
dotenv.config();

const PRIMARY_MODEL = 'gemini-2.0-flash';
const FALLBACK_MODEL = 'gemini-flash-latest';
const BASE_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Centralized Google Gemini REST API Client.
 * Dynamically retrieves process.env.GEMINI_API_KEY on every call.
 * Uses gemini-2.0-flash with automatic failover to gemini-flash-latest if needed.
 * Preserves Google's full error details and status codes.
 */
async function callGemini(prompt, systemInstruction = '') {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_google_gemini_api_key' || !apiKey.trim()) {
    const error = new Error('Google Gemini API key is not configured. Please set GEMINI_API_KEY in the backend .env file.');
    error.statusCode = 500;
    throw error;
  }

  const fullPrompt = systemInstruction ? `${systemInstruction}\n\nUser Prompt:\n${prompt}` : prompt;

  const makeRequest = async (modelName) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 sec timeout

    try {
      const response = await fetch(`${BASE_ENDPOINT}/${modelName}:generateContent?key=${apiKey.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      const data = await response.json();

      return { status: response.status, ok: response.ok, data };
    } catch (netErr) {
      console.error(`[Gemini Request Error - ${modelName}]:`, netErr.message);
      return { status: 502, ok: false, error: netErr.message };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Try Primary Model
  let res = await makeRequest(PRIMARY_MODEL);

  // If Primary returned 404 or 429, retry seamlessly with Fallback Model
  if ((res.status === 404 || res.status === 429) && PRIMARY_MODEL !== FALLBACK_MODEL) {
    console.warn(`[Gemini Client Warning] Model ${PRIMARY_MODEL} returned HTTP ${res.status}. Retrying with ${FALLBACK_MODEL}...`);
    res = await makeRequest(FALLBACK_MODEL);
  }

  if (res.status === 429) {
    const googleMsg = res.data?.error?.message || 'Rate limit or quota exceeded.';
    console.error('[Gemini Rate Limit Exceeded]:', googleMsg);
    const error = new Error(`Gemini AI API quota exceeded: ${googleMsg}`);
    error.statusCode = 429;
    throw error;
  }

  if (res.status === 400 || res.status === 401 || res.status === 403) {
    const googleMsg = res.data?.error?.message || 'Permission denied or invalid request.';
    console.error(`[Gemini Auth/Config Error HTTP ${res.status}]:`, googleMsg);
    const error = new Error(`Google Gemini API error (HTTP ${res.status}): ${googleMsg}`);
    error.statusCode = 500;
    throw error;
  }

  if (!res.ok) {
    const googleMsg = res.data?.error?.message || res.error || `HTTP ${res.status}`;
    console.error(`[Gemini API Error HTTP ${res.status}]:`, googleMsg);
    const error = new Error(`Google Gemini AI service error: ${googleMsg}`);
    error.statusCode = res.status >= 500 ? res.status : 502;
    throw error;
  }

  if (res.data?.candidates && res.data.candidates[0]?.content?.parts?.[0]?.text) {
    return res.data.candidates[0].content.parts[0].text;
  }

  const error = new Error('Gemini AI returned an empty response or content was filtered by safety settings.');
  error.statusCode = 502;
  throw error;
}

module.exports = {
  callGemini,
  PRIMARY_MODEL,
  FALLBACK_MODEL,
};
