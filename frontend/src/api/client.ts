const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

export interface Islander {
  id: string;
  name: string;
  bio: string;
}

export async function fetchIslanders(): Promise<Islander[]> {
  const res = await fetch(`${API_BASE_URL}/islanders`);
  if (!res.ok) {
    throw new Error(`Failed to load islanders: ${res.status}`);
  }
  return res.json();
}
