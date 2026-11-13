import { auth } from '../firebase/config';

export interface ImportedEvent {
  title: string; description: string; location: string; category: string;
  startTime: string; endtime: string; timeZone: string; link: string;
}
export interface EventCandidate {
  id: string; version: string; sourceId: string; sourceName: string; sourceUrl: string;
  status: 'pending' | 'published' | 'rejected'; updatedAt: string;
  publishedEventId: string; event: ImportedEvent; issues: string[];
}
export interface ImportList {
  items: EventCandidate[]; nextPageToken: string;
}
export async function requestImports<T>(action: 'list' | 'crawl' | 'review', payload: unknown): Promise<T> {
  const base = (import.meta.env.VITE_AI_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (!base) throw new Error('The activity import service has not been configured.');
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user || user.isAnonymous) throw new Error('Sign in with your administrator account to review activities.');
  const token = await user.getIdToken();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(`${base}/admin/imports/${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload), signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Activity import request failed.');
    return data as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('Request timed out. Refresh the list before retrying; the operation may have completed.');
    throw error;
  } finally { window.clearTimeout(timer); }
}
