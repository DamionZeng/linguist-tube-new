import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FIXED_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const DURATION_OPTIONS = [
  { key: 'All', label: 'filter.all' },
  { key: 'short', label: 'filter.short' },
  { key: 'medium', label: 'filter.medium' },
  { key: 'long', label: 'filter.long' },
  { key: 'extended', label: 'filter.extended' },
];

interface FilterBarProps {
  categories: string[];
  activeCategory: string;
  activeLevel: string;
  activeDuration: string;
  onCategoryChange: (cat: string) => void;
  onLevelChange: (level: string) => void;
  onDurationChange: (duration: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  categories,
  activeCategory,
  activeLevel,
  activeDuration,
  onCategoryChange,
  onLevelChange,
  onDurationChange,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const activeCount = (activeCategory !== 'All' ? 1 : 0) + (activeLevel !== 'All' ? 1 : 0) + (activeDuration !== 'All' ? 1 : 0);

  const categoryOptions = [
    { key: 'All', label: t('filter.all') },
    ...categories.map(cat => ({ key: cat, label: cat })),
  ];

  const levelOptions = [
    { key: 'All', label: t('filter.all') },
    ...FIXED_LEVELS.map(lv => ({ key: lv, label: lv })),
  ];

  const durationOptions = DURATION_OPTIONS.map(o => ({ ...o, label: t(o.label) }));

  if (!expanded) {
    return (
      <div className="mb-4">
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1E293B] border border-[#E0E0D5] dark:border-[#334155] rounded-xl text-sm font-bold text-[#6A6A5A] dark:text-[#94A3B8] hover:border-[#94A684] hover:text-[#4A4A40] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {t('filter.title', '筛选')}
          {activeCount > 0 && (
            <span className="bg-[#D48166] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{activeCount}</span>
          )}
        </button>
      </div>
    );
  }

  const FilterRow: React.FC<{ label: string; options: { key: string; label: string }[]; active: string; onChange: (key: string) => void }> = ({ label, options, active, onChange }) => (
    <div className="shrink-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A7A] dark:text-[#64748B] mb-1 block px-1">{label}</span>
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
        {options.map(opt => (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
              active === opt.key
                ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-sm'
                : 'bg-white dark:bg-[#1E293B] border-[#E0E0D5] dark:border-[#334155] text-[#6A6A5A] dark:text-[#94A3B8] hover:border-[#94A684] hover:text-[#4A4A40] dark:hover:text-[#F8FAFC]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mb-4 bg-white dark:bg-[#1E293B] border border-[#E0E0D5] dark:border-[#334155] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[#4A4A40] dark:text-[#F8FAFC] flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          {t('filter.title', '筛选')}
        </span>
        <button
          onClick={() => setExpanded(false)}
          className="text-xs font-bold text-[#8A8A7A] dark:text-[#64748B] hover:text-[#D48166] transition-colors cursor-pointer"
        >
          {t('filter.collapse', '收起')}
        </button>
      </div>
      <FilterRow label={t('filter.category')} options={categoryOptions} active={activeCategory} onChange={onCategoryChange} />
      <FilterRow label={t('filter.level')} options={levelOptions} active={activeLevel} onChange={onLevelChange} />
      <FilterRow label={t('filter.duration')} options={durationOptions} active={activeDuration} onChange={onDurationChange} />
    </div>
  );
};
