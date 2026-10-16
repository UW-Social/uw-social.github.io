import { auth } from '../firebase/config';

export async function requestAi<T>(path: '/chat' | '/extract-event', payload: unknown): Promise<T> {
  const baseUrl = (import.meta.env.VITE_AI_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (!baseUrl) throw new Error('AI service is not available yet. Please try again later.');
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user || user.isAnonymous) throw new Error('Please log in to use AI features.');
  const token = await user.getIdToken();
  const controller = new AbortController();
  const configuredTimeout = Number(import.meta.env.VITE_CHATBOT_TIMEOUT_MS || '30000');
  const timeout = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 30000;
  const timeoutId = window.setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      signal: controller.signal,
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'AI request failed. Please try again later.');
    return data as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('AI request timed out. Please try again.');
    }
    throw error;
  } finally { window.clearTimeout(timeoutId); }
}
