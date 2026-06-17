import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 全局错误边界。
 *
 * 设计要点：
 * 1. 放在 App 树的最外层，ThemeProvider/AuthProvider/BrowserRouter 任何一层抛错都能兜住，避免白屏。
 * 2. Fallback UI 不读 theme/auth/router 任何上下文，纯静态样式，保证自身不会因为同样的原因二次崩。
 * 3. 提供 reset 方法：清除错误状态并重渲子节点，用户可一键恢复而无需刷新整页（保留 localStorage 中的登录态等）。
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 仅记录到 console，避免引入第三方依赖
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] caught error:', error, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}

interface FallbackProps {
  error: Error | null;
  onReset: () => void;
}

function ErrorFallback({ error, onReset }: FallbackProps) {
  return (
    <div
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F5F5F0] p-8 text-[#4A4A40]"
    >
      <h1 className="text-2xl font-serif font-bold">页面出错了</h1>
      <p className="max-w-md text-center text-sm text-[#8A8A7A]">
        抱歉，页面遇到一个意外问题。你可以点击下方按钮重试。
      </p>
      {error && (
        <pre className="max-w-lg overflow-auto rounded-lg border border-[#E0E0D5] bg-white/70 p-3 text-xs text-[#A0A090]">
          {error.message}
        </pre>
      )}
      <button
        type="button"
        onClick={onReset}
        className="rounded-full bg-[#D48166] px-6 py-2 font-bold text-white shadow-md transition-all hover:bg-[#C27055] active:scale-95"
      >
        重试
      </button>
    </div>
  );
}
