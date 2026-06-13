import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Clock, CheckCircle, XCircle, Loader2, RefreshCw, Trash2, RotateCcw, ExternalLink, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTaskList, deleteTask, retryTask, type ParseTask } from '@api/parser';
import { useTranslation } from 'react-i18next';

const POLL_INTERVAL = 3000;

const simplifyProgress = (progress: string): string => {
  const map: Record<string, string> = {
    '提取视频 ID': '提取ID',
    'WhisperX 转写': '音频转写',
    '字幕 EN→ZH': '翻译字幕',
    '翻译字幕 EN→ZH': '翻译字幕',
    '获取视频元信息': '获取信息',
    'AI 生成元数据': 'AI分析',
    '构建字幕条目': '构建字幕',
    '下载缩略图': '处理媒体',
    '下载视频文件': '处理媒体',
    '上传视频到 R2': '处理媒体',
    'AI 标注高亮词': 'AI标注',
    '写入数据库': '入库',
    '完成': '完成',
    '等待处理': '等待中',
  };
  for (const [key, val] of Object.entries(map)) {
    if (progress.includes(key)) return val;
  }
  return progress;
};

const PROGRESS_STEPS = [
  '提取视频 ID', 'WhisperX 转写', '翻译字幕', '获取视频元信息',
  'AI 生成元数据', '构建字幕条目', '下载缩略图', '下载视频',
  '上传视频到 R2', 'AI 标注高亮词', '写入数据库', '完成',
];

export const ParseTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const highlightTaskId = searchParams.get('highlight');

  const [tasks, setTasks] = useState<ParseTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const fetchTasks = useCallback(async () => {
    try {
      const status = activeFilter === 'all' ? undefined : activeFilter;
      const data = await getTaskList(status, 50, 0);
      setTasks(data.items);
    } catch (e) {
      console.error('Failed to fetch tasks', e);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    const hasActive = tasks.some(t => t.status === 'pending' || t.status === 'processing');
    if (hasActive) pollRef.current = setInterval(fetchTasks, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [tasks, fetchTasks]);

  const handleDelete = async (taskId: string) => {
    try { await deleteTask(taskId); setTasks(prev => prev.filter(t => t.task_id !== taskId)); }
    catch (e) { console.error('Delete failed', e); }
  };

  const handleRetry = async (taskId: string) => {
    try { await retryTask(taskId); fetchTasks(); }
    catch (e) { console.error('Retry failed', e); }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3.5 h-3.5" />;
      case 'processing': return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
      case 'completed': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'failed': return <XCircle className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-[#22c55e]';
      case 'failed': return 'text-[#ef4444]';
      case 'processing': return 'text-[#D48166]';
      default: return 'text-[#8A8A7A]';
    }
  };

  const getProgressPercent = (task: ParseTask): number => {
    if (task.status === 'completed') return 100;
    if (task.status === 'failed' || task.status === 'pending') return 0;
    const step = task.current_step || 0;
    if (step > 0) return Math.round((step / 9) * 100);
    const progress = task.progress || '';
    for (let i = PROGRESS_STEPS.length - 1; i >= 0; i--) {
      if (progress.includes(PROGRESS_STEPS[i])) return Math.round(((i + 1) / PROGRESS_STEPS.length) * 100);
    }
    return 5;
  };

  const extractYoutubeId = (url: string): string | null => {
    const match = url.match(/(?:v=|\/)([\w-]{11})(?:\?|&|$)/);
    return match ? match[1] : null;
  };

  const filters = [
    { key: 'all', label: t('parseTasks.all') },
    { key: 'processing', label: t('parseTasks.processing') },
    { key: 'completed', label: t('parseTasks.completed') },
    { key: 'failed', label: t('parseTasks.failed') },
  ];

  return (
    <div className="w-full h-[100dvh] bg-[#F5F5F0] dark:bg-[#0B0E14] font-sans text-[#4A4A40] dark:text-[#F8FAFC] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 h-12 bg-white/80 dark:bg-[#151B25]/80 backdrop-blur-md border-b border-[#E0E0D5] dark:border-[#1E293B] z-40">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-[#F9F9F7] dark:hover:bg-[#1E293B] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-base font-serif font-bold">{t('parseTasks.title')}</h1>
        <button onClick={fetchTasks} className="p-1.5 hover:bg-[#F9F9F7] dark:hover:bg-[#1E293B] rounded-full transition-colors text-[#6A6A5A]">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 md:px-8 max-w-3xl mx-auto">
          {/* Filter tabs */}
          <div className="flex gap-2 mb-4">
            {filters.map(f => (
              <button key={f.key} onClick={() => { setActiveFilter(f.key); setLoading(true); }}
                className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                  activeFilter === f.key
                    ? 'bg-[#5A5A40] dark:bg-[#D48166] text-white border-transparent'
                    : 'bg-white dark:bg-[#1E293B] border-[#E0E0D5] dark:border-[#334155] text-[#6A6A5A] hover:border-[#94A684]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Task list */}
          {loading ? (
            <div className="flex items-center justify-center p-8 min-h-[30vh]">
              <div className="w-6 h-6 rounded-full border-2 border-[#E0E0D5] border-t-[#D48166] animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 min-h-[25vh] text-[#8A8A7A]">
              <Clock className="w-10 h-10 mb-3 opacity-20" />
              <p className="font-bold text-sm mb-0.5">{t('parseTasks.noTasks')}</p>
              <p className="text-xs">{t('parseTasks.noTasksDesc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => {
                const ytId = extractYoutubeId(task.youtube_url);
                const percent = getProgressPercent(task);
                const isActive = task.status === 'pending' || task.status === 'processing';
                const isDone = task.status === 'completed';
                const isFailed = task.status === 'failed';
                const statusColor = getStatusColor(task.status);

                return (
                  <div
                    key={task.task_id}
                    className={`bg-white dark:bg-[#1E293B] rounded-2xl border transition-all overflow-hidden ${
                      task.task_id === highlightTaskId
                        ? 'border-[#D48166] shadow-sm'
                        : 'border-[#E0E0D5] dark:border-[#334155] hover:border-[#94A684]'
                    }`}
                  >
                    {/* Row 1: Thumbnail + Info */}
                    <div className="flex gap-3 p-3">
                      {/* Thumbnail */}
                      <div className="shrink-0 w-[120px]">
                        {ytId ? (
                          <img
                            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                            alt=""
                            className="w-full aspect-video rounded-lg object-cover bg-[#EAEAE0] dark:bg-[#0B0E14]"
                          />
                        ) : (
                          <div className="w-full aspect-video rounded-lg bg-[#EAEAE0] dark:bg-[#0B0E14] flex items-center justify-center">
                            <Play className="w-4 h-4 text-[#8A8A7A]" />
                          </div>
                        )}
                      </div>

                      {/* Info column */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                        {/* Status + URL */}
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 shrink-0 ${statusColor}`}>
                            {getStatusIcon(task.status)}
                            <span className="text-xs font-semibold">
                              {isDone ? t('parseTasks.completed') : isFailed ? t('parseTasks.failed') : isActive ? t('parseTasks.processing') : t('parseTasks.pending')}
                            </span>
                          </span>
                          <span className="text-xs text-[#8A8A7A] truncate font-mono">
                            {task.youtube_url}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#A0A090] shrink-0 min-w-[3rem]">
                            {simplifyProgress(task.progress)}
                          </span>
                          <div className="flex-1 bg-[#EAEAE0] dark:bg-[#334155] rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ease-out ${
                                isDone ? 'bg-[#22c55e]' : isFailed ? 'bg-[#ef4444]' : 'bg-[#D48166]'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-[#A0A090] tabular-nums w-8 text-right shrink-0">
                            {percent}%
                          </span>
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-3 text-[11px] text-[#A0A090]">
                          {task.created_at && (
                            <span>{t('parseTasks.createdAt')} {new Date(task.created_at).toLocaleString()}</span>
                          )}
                          {task.finished_at && (
                            <span>{t('parseTasks.finishedAt')} {new Date(task.finished_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Tags / Error / Actions — full width below */}
                    <div className="px-3 pb-3 flex items-center gap-2 flex-wrap">
                      {/* Completed: tags */}
                      {isDone && task.result && (
                        <>
                          <span className="text-[11px] font-semibold text-[#6A6A5A] dark:text-[#94A3B8] bg-[#F5F5F0] dark:bg-[#0B0E14] px-2 py-0.5 rounded-md border border-[#EAEAE0] dark:border-[#334155]">
                            {task.result.level}
                          </span>
                          <span className="text-[11px] font-semibold text-[#94A684] bg-[#94A684]/10 px-2 py-0.5 rounded-md border border-[#94A684]/20">
                            {task.result.category}
                          </span>
                          {task.result.tags?.map(tag => (
                            <span key={tag} className="text-[11px] font-medium text-[#D48166] bg-[#D48166]/10 px-2 py-0.5 rounded-md">
                              #{tag}
                            </span>
                          ))}
                          <span className="flex-1" />
                          <button
                            onClick={() => navigate(`/video/${task.result!.video_id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#D48166] hover:text-white hover:bg-[#D48166] rounded-md transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />{t('parseTasks.viewVideo')}
                          </button>
                        </>
                      )}

                      {/* Failed: error + retry */}
                      {isFailed && (
                        <>
                          <p className="text-[11px] text-[#ef4444] line-clamp-1 flex-1 min-w-0">
                            {task.error}
                          </p>
                          <button
                            onClick={() => handleRetry(task.task_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#D48166] hover:text-white hover:bg-[#D48166] rounded-md transition-colors"
                            title={t('parseTasks.retry')}
                          >
                            <RotateCcw className="w-3 h-3" />{t('parseTasks.retry')}
                          </button>
                        </>
                      )}

                      {/* Delete button (non-active tasks) */}
                      {!isActive && !isDone && !isFailed && (
                        <span className="flex-1" />
                      )}
                      {!isActive && (
                        <button
                          onClick={() => handleDelete(task.task_id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-[#8A8A7A] hover:text-[#ef4444] hover:bg-[#ef4444]/5 rounded-md transition-colors"
                          title={t('parseTasks.delete')}
                        >
                          <Trash2 className="w-3 h-3" />{t('parseTasks.delete')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
