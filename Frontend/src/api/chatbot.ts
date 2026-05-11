import type { ChatbotRequest, ChatbotResponse, ChatEventCitation } from '../types/chatbot';

// MVP only!!!
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

function getApiKey(): string {
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

function getModel(): string {
  return import.meta.env.VITE_GEMINI_MODEL || FALLBACK_MODEL;
}

function getTimeoutMs(): number {
  const parsed = Number(import.meta.env.VITE_CHATBOT_TIMEOUT_MS || '20000');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20000;
}

function buildPrompt(payload: ChatbotRequest): string {
  const trimmedHistory = payload.history.slice(-8);

  return [
    'You are a UW Social assistant helping users discover events.',
    'Rules:',
    '- Answer using only the provided context when possible.',
    '- Keep answers concise and practical.',
    '- If context is insufficient, say what is missing.',
    '- Return valid JSON only with this shape:',
    '{"text": "string", "citations": [{"eventId": "string", "title": "string"}] }',
    '',
    `Current route: ${payload.context.routePath}`,
    `Logged in: ${payload.context.isLoggedIn}`,
    `User interests: ${JSON.stringify(payload.context.userSignals)}`,
    `Event context: ${JSON.stringify(payload.context.events)}`,
    `Conversation history: ${JSON.stringify(trimmedHistory)}`,
    `User question: ${payload.message}`,
  ].join('\n');
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) return trimmed;

  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

function parseGeminiJson(text: string): ChatbotResponse {
  const normalized = stripCodeFence(text);

  try {
    const parsed = JSON.parse(normalized) as Partial<ChatbotResponse>;
    if (!parsed.text || typeof parsed.text !== 'string') {
      throw new Error('Missing text');
    }

    const citations = Array.isArray(parsed.citations)
      ? parsed.citations.filter(
          (item): item is ChatEventCitation =>
            !!item &&
            typeof item.eventId === 'string' &&
            typeof item.title === 'string',
        )
      : [];

    return {
      text: parsed.text,
      citations,
    };
  } catch {
    return {
      text: normalized,
      citations: [],
    };
  }
}

export async function sendChatbotMessage(payload: ChatbotRequest): Promise<ChatbotResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Set VITE_GEMINI_API_KEY to enable chatbot requests.');
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}/${getModel()}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: buildPrompt(payload) }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 500,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini request failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini response did not include text content.');
    }

    return parseGeminiJson(text);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Chatbot request timed out. Please try again.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
