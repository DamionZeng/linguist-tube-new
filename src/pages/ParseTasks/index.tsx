import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Clock, CheckCircle, XCircle, Loader2, RefreshCw, Trash2, RotateCcw, TrendingUp, ExternalLink, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTaskList, getTaskStatus, deleteTask, retryTask, type ParseTask } from '@api/parser';
import { useTranslation } from 'react-i18next';

const POLL_INTERVAL = 3000;

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

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 轮询：如果有 pending/processing 任务则持续轮询
  useEffect(() => {
    const hasActive = tasks.some(t => t.status === 'pending' || t.status === 'processing');
    if (hasActive) {
      pollRef.current = setInterval(fetchTasks, POLL_INTERVAL);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [tasks, fetchTasks]);

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.task_id !== taskId));
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const handleRetry = async (taskId: string) => {
    try {
      await retryTask(taskId);
      fetchTasks();
    } catch (e) {
      console.error('Retry failed', e);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-[#8A8A7A]" />;
      case 'processing': return <Loader2 className="w-5 h-5 text-[#D48166] animate-spin" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-[#22c55e]" />;
      case 'failed': return <XCircle className="w-5 h-5 text-[#ef4444]" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t('parseTasks.pending');
      case 'processing': return t('parseTasks.processing');
      case 'completed': return t('parseTasks.completed');
      case 'failed': return t('parseTasks.failed');
      default: return status;
    }
  };

  const getProgressPercent = (task: ParseTask): number => {
    if (task.status === 'completed') return 100;
    if (task.status === 'failed') return 0;
    if (task.status === 'pending') return 0;
    // processing: 根据 current_step 计算 (共 8 步)
    const step = task.current_step || 0;
    if (step > 0) {
      return Math.round((step / 8) * 100);
    }
    // fallback: 根据进度描述估算
    const progress = task.progress || '';
    const steps = [
      '提取视频 ID',
      'WhisperX 转写',
      '翻译字幕',
      '获取视频元信息',
      'AI 生成元数据',
      '构建字幕条目',
      '下载缩略图',
      '下载视频',
      '上传视频到 R2',
      '写入数据库',
      '完成',
    ];
    for (let i = steps.length - 1; i >= 0; i--) {
      if (progress.includes(steps[i])) {
        return Math.round(((i + 1) / steps.length) * 100);
      }
    }
    return 10;
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
      {/* 顶部导航栏 */}
      <div className="shrink-0 flex items-center justify-between px-4 h-14 bg-white/80 dark:bg-[#151B25]/80 backdrop-blur-md border-b border-[#E0E0D5] dark:border-[#1E293B] z-40">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-[#F9F9F7] dark:hover:bg-[#1E293B] active:scale-95 transition-all text-[#4A4A40] dark:text-[#F8FAFC]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-serif font-bold text-[#4A4A40] dark:text-[#F8FAFC]">
          {t('parseTasks.title')}
        </h1>
        <button
          onClick={fetchTasks}
          className="p-2 hover:bg-[#F9F9F7] dark:hover:bg-[#1E293B] rounded-full transition-colors text-[#6A6A5A] dark:text-[#94A3B8]"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* 可滚动内容区 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* 筛选标签 */}
          <div className="flex gap-2.5 overflow-x-auto pb-4 hide-scrollbar mb-6">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => { setActiveFilter(f.key); setLoading(true); }}
            className={`whitespace-nowrap px-4 py-1.5 rounded-xl text-sm font-bold border transition-colors cursor-pointer shrink-0 ${
              activeFilter === f.key
                ? 'bg-[#5A5A40] dark:bg-[#D48166] text-white border-[#5A5A40] dark:border-[#D48166] shadow-sm'
                : 'bg-white dark:bg-[#1E293B] border-[#E0E0D5] dark:border-[#334155] text-[#6A6A5A] dark:text-[#94A3B8] hover:border-[#94A684]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 任务列表 */}
      {loading ? (
        <div className="flex items-center justify-center p-8 min-h-[30vh]">
          <div className="w-8 h-8 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 min-h-[30vh] text-[#8A8A7A] dark:text-[#94A3B8]">
          <Clock className="w-12 h-12 mb-4 opacity-30" />
          <p className="font-bold text-lg mb-1">{t('parseTasks.noTasks')}</p>
          <p className="text-sm">{t('parseTasks.noTasksDesc')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => {
            const ytId = extractYoutubeId(task.youtube_url);
            const percent = getProgressPercent(task);
            const isHighlight = task.task_id === highlightTaskId;
            const isActive = task.status === 'pending' || task.status === 'processing';

            return (
              <div
                key={task.task_id}
                className={`bg-white dark:bg-[#1E293B] rounded-[20px] border transition-all overflow-hidden ${
                  isHighlight ? 'border-[#D48166] shadow-lg ring-2 ring-[#D48166]/20' : 'border-[#E0E0D5] dark:border-[#334155] hover:border-[#94A684]'
                }`}
              >
                <div className="p-5 flex gap-4">
                  {/* 缩略图 */}
                  <div className="w-28 md:w-36 shrink-0">
                    {ytId ? (
                      <img
                        src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                        alt="thumbnail"
                        className="w-full aspect-video rounded-xl object-cover bg-[#EAEAE0] dark:bg-[#0B0E14]"
                      />
                    ) : (
                      <div className="w-full aspect-video rounded-xl bg-[#EAEAE0] dark:bg-[#0B0E14] flex items-center justify-center">
                        <Play className="w-6 h-6 text-[#8A8A7A]" />
                      </div>
                    )}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {getStatusIcon(task.status)}
                        <span className={`text-sm font-bold ${
                          task.status === 'completed' ? 'text-[#22c55e]' :
                          task.status === 'failed' ? 'text-[#ef4444]' :
                          task.status === 'processing' ? 'text-[#D48166]' :
                          'text-[#8A8A7A]'
                        }`}>
                          {getStatusLabel(task.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {task.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(task.task_id)}
                            className="p-1.5 hover:bg-[#F9F9F7] dark:hover:bg-[#0B0E14] rounded-lg transition-colors text-[#8A8A7A] dark:text-[#94A3B8] hover:text-[#D48166]"
                            title={t('parseTasks.retry')}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        {!isActive && (
                          <button
                            onClick={() => handleDelete(task.task_id)}
                            className="p-1.5 hover:bg-[#F9F9F7] dark:hover:bg-[#0B0E14] rounded-lg transition-colors text-[#8A8A7A] dark:text-[#94A3B8] hover:text-[#ef4444]"
                            title={t('parseTasks.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* URL */}
                    <p className="text-xs text-[#8A8A7A] dark:text-[#64748B] truncate mb-2 font-mono">
                      {task.youtube_url}
                    </p>

                    {/* 进度描述 */}
                    <p className="text-sm text-[#4A4A40] dark:text-[#F8FAFC] font-medium mb-2">
                      {task.progress}
                    </p>

                    {/* 进度条 */}
                    {isActive && (
                      <div className="w-full bg-[#E0E0D5] dark:bg-[#334155] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-[#D48166] rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    )}

                    {/* 完成后显示结果 */}
                    {task.status === 'completed' && task.result && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#6A6A5A] dark:text-[#94A3B8] bg-[#F9F9F7] dark:bg-[#0B0E14] px-2 py-1 rounded-md border border-[#E0E0D5] dark:border-[#334155]">
                          <TrendingUp className="w-3 h-3 inline mr-1 text-[#94A684]" />
                          {task.result.level}
                        </span>
                        <span className="text-xs font-bold text-[#6A6A5A] dark:text-[#94A3B8] bg-[#F9F9F7] dark:bg-[#0B0E14] px-2 py-1 rounded-md border border-[#E0E0D5] dark:border-[#334155]">
                          {task.result.category}
                        </span>
                        {task.result.tags?.map((tag, idx) => (
                          <span key={idx} className="text-xs font-bold text-[#D48166] bg-[#D48166]/10 px-2 py-1 rounded-md">
                            {tag}
                          </span>
                        ))}
                        <button
                          onClick={() => navigate(`/video/${task.result.video_id}`)}
                          className="ml-auto flex items-center gap-1 text-xs font-bold text-[#D48166] hover:text-[#C27055] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {t('parseTasks.viewVideo')}
                        </button>
                      </div>
                    )}

                    {/* 失败显示错误 */}
                    {task.status === 'failed' && task.error && (
                      <p className="mt-2 text-xs text-[#ef4444] font-medium bg-[#ef4444]/5 px-3 py-2 rounded-lg">
                        {task.error}
                        {task.current_step > 0 && (
                          <span className="block mt-1 text-[#8A8A7A]">
                            {t('parseTasks.resumeHint', { step: task.current_step })}
                          </span>
                        )}
                      </p>
                    )}

                    {/* 时间 */}
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-[#8A8A7A] dark:text-[#64748B]">
                      {task.created_at && (
                        <span>{t('parseTasks.createdAt')}: {new Date(task.created_at).toLocaleString()}</span>
                      )}
                      {task.finished_at && (
                        <span>{t('parseTasks.finishedAt')}: {new Date(task.finished_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
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
