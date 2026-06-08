import { getAuthHeaders } from './auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface GenerateKeyData {
  key: string;
  expires_at: string;
  days_valid: number;
  vip_duration_days: number | null;
}

export const generateKeyApi = async (vipDurationDays: number | null): Promise<GenerateKeyData> => {
  const res = await fetch(`${BASE_URL}/api/admin/keys/generate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ days_valid: 365, vip_duration_days: vipDurationDays }),
  });
  const json = await res.json();
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || 'Failed to generate key');
  }
  return json.data as GenerateKeyData;
};
