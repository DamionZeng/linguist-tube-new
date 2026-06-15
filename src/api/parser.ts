/**
 * Parse Task API
 * - 提交/重试 → 直接调 video-parser-api
 * - 查询/列表/删除 → 调主后端 (带认证，按用户隔离)
 */

import { getStoredToken } from './auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const PARSER_URL = import.meta.env.VITE_PARSER_API_BASE_URL || 'http://localhost:8001';

interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

// ── 主后端请求 (带 Token) ──

async function backendGet<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getStoredToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  const json: ApiResponse<T> = await res.json();
  if (res.status === 401) window.dispatchEvent(new Event('auth:unauthorized'));
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }
  return json.data;
}

async function backendDelete<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getStoredToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers });
  const json: ApiResponse<T> = await res.json();
  if (res.status === 401) window.dispatchEvent(new Event('auth:unauthorized'));
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }
  return json.data;
}

// ── video-parser-api 请求 (直接调用) ──

async function parserPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${PARSER_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }
  return json.data;
}

// ── 类型定义 ──

export interface ParseTask {
  task_id: string;
  username: string;
  youtube_url: string;
  download: boolean;
  quality?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: string;
  current_step: number;
  video_id?: string;
  error?: string;
  result?: {
    status: string;
    video_id: string;
    title_en: string;
    title_zh: string;
    level: string;
    category: string;
    tags: string[];
    transcript_count: number;
  };
  created_at?: string;
  started_at?: string;
  finished_at?: string;
  queue_position?: number | null;
}

export interface TaskListData {
  total: number;
  items: ParseTask[];
}

// ── API 方法 ──

/** 提交解析任务 → video-parser-api */
export const submitParseTask = async (url: string, username: string, download: boolean = false, quality?: string): Promise<{
  task_id: string;
  status: string;
  progress: string;
}> => {
  return parserPost('/api/tasks', { url, username, download, quality });
};

/** 重试任务 → video-parser-api */
export const retryTask = async (taskId: string): Promise<{ task_id: string; status: string; resume_step: number }> => {
  return parserPost(`/api/tasks/${taskId}/retry`);
};

/** 查询单个任务 → 主后端 */
export const getTaskStatus = async (taskId: string): Promise<ParseTask> => {
  return backendGet(`/api/parse-tasks/${taskId}`);
};

/** 查询任务列表 → 主后端 */
export const getTaskList = async (status?: string, limit: number = 20, offset: number = 0): Promise<TaskListData> => {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (status) params.set('status', status);
  return backendGet(`/api/parse-tasks?${params.toString()}`);
};

/** 删除任务 → 主后端 */
export const deleteTask = async (taskId: string): Promise<boolean> => {
  return backendDelete(`/api/parse-tasks/${taskId}`);
};
