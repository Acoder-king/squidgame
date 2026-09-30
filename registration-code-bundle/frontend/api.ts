export interface ArenaEvent {
  id: number;
  slug: string;
  name: string;
  category: 'technical' | 'non-technical';
  tagline: string;
  description: string;
  icon: string;
  stage_code: string;
  team_size: string;
  member_limit: string;
  per_head_fee: string;
  team_fee: string;
  prize: string;
  duration: string;
  eligibility: string;
  rules: string[];
  venue_hint: string;
  fee: string;
  sort_order: number;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
}

export interface ScheduleItem {
  id: number;
  day_label: string;
  start_time: string;
  end_time: string;
  title: string;
  description: string;
  venue_hint: string;
  sort_order: number;
}

export interface GalleryItem {
  id: number;
  src: string;
  title: string;
  caption: string;
  sort_order: number;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
