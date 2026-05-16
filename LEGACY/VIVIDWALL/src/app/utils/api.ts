import { projectId, publicAnonKey } from './supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-df5dd726`;

export async function fetchElements() {
  const res = await fetch(`${BASE_URL}/elements?t=${Date.now()}`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`
    },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch elements');
  return res.json();
}

export async function saveElement(element: any) {
  const res = await fetch(`${BASE_URL}/element`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify(element)
  });
  if (!res.ok) throw new Error('Failed to save element');
  return res.json();
}

export const deleteElement = async (id: string) => {
  const response = await fetch(`${BASE_URL}/elements/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`
    }
  });
  if (!response.ok) throw new Error('Failed to delete element');
  return response.json();
};

export async function clearElements() {
  const res = await fetch(`${BASE_URL}/elements`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`
    }
  });
  if (!res.ok) throw new Error('Failed to clear elements');
  return res.json();
}
