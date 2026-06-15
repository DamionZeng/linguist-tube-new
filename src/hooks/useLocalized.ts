import { useTranslation } from 'react-i18next';

/**
 * 根据当前界面语言选择对应的文本字段。
 * 中文环境下优先使用 *Zh 字段，回退到英文字段。
 */
export function useLocalized() {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh');

  function title(item: { title?: string; titleZh?: string | null }): string {
    if (isZh && item.titleZh) return item.titleZh;
    return item.title || '';
  }

  function desc(item: { desc?: string | null; descZh?: string | null }): string {
    if (isZh && item.descZh) return item.descZh;
    return item.desc || '';
  }

  return { title, desc };
}
