import React from 'react';
import { X, Download, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PlaybackSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showHighlights: boolean;
  onToggleHighlights: () => void;
  highlightColor: string;
  onHighlightColorChange: (color: string) => void;
  subtitleSize: 'small' | 'standard' | 'medium' | 'large';
  onChangeSubtitleSize: (size: 'small' | 'standard' | 'medium' | 'large') => void;
  onDownloadSubtitles: () => void;
  isMaskActive: boolean;
  onToggleMask: () => void;
}

export const PlaybackSettingsModal: React.FC<PlaybackSettingsModalProps> = ({ 
  isOpen, 
  onClose,
  showHighlights,
  onToggleHighlights,
  highlightColor,
  onHighlightColorChange,
  subtitleSize,
  onChangeSubtitleSize,
  onDownloadSubtitles,
  isMaskActive,
  onToggleMask
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity" 
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0B0E14] rounded-t-[24px] z-[60] overflow-hidden shadow-2xl animate-in slide-in-from-bottom mx-auto max-w-xl border-t border-[#E0E0D5] dark:border-[#1E293B]">
        <div className="p-4 md:p-5 pb-safe">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#4A4A40] dark:text-[#F8FAFC] flex items-center gap-2">
               <SlidersHorizontal className="w-5 h-5 text-[#5A5A40] dark:text-[#94A3B8]" />
               {t('settings.playbackSettings')}
            </h3>
            <button onClick={onClose} className="p-1.5 bg-[#F9F9F7] dark:bg-[#1C222C] text-[#8A8A7A] dark:text-[#64748B] hover:bg-[#EAEAE0] dark:hover:bg-[#1E293B] hover:text-[#4A4A40] dark:hover:text-[#E2E8F0] rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between py-1.5">
               <span className="font-bold text-[#4A4A40] dark:text-[#E2E8F0] text-sm">{t('settings.downloadSubtitles') || '下载字幕'}</span>
               <button onClick={onDownloadSubtitles} className="bg-[#D48166] text-white p-1.5 rounded-full hover:bg-[#C27055] transition-colors">
                 <Download className="w-4 h-4" />
               </button>
            </div>
            
            <div className="flex items-center justify-between py-1.5">
               <div className="flex items-center gap-3">
                 <span className="font-bold text-[#4A4A40] dark:text-[#E2E8F0] text-sm">{t('settings.vocabHighlight', '生词标注')}</span>
                 {showHighlights && (
                    <input 
                      type="color" 
                      value={highlightColor} 
                      onChange={(e) => onHighlightColorChange(e.target.value)}
                      className="w-6 h-6 p-0 border-0 rounded cursor-pointer mt-0.5"
                    />
                 )}
               </div>
               <div 
                 className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${showHighlights ? 'bg-[#94A684]' : 'bg-[#E0E0D5] dark:bg-[#334155]'}`}
                 onClick={onToggleHighlights}
               >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${showHighlights ? 'translate-x-5' : 'translate-x-0'}`} />
               </div>
            </div>

            <div className="flex items-center justify-between py-1.5">
               <span className="font-bold text-[#4A4A40] dark:text-[#E2E8F0] text-sm">{t('settings.hideMask', '遮罩板')}</span>
               <div 
                 className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${isMaskActive ? 'bg-[#94A684]' : 'bg-[#E0E0D5] dark:bg-[#334155]'}`}
                 onClick={onToggleMask}
               >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${isMaskActive ? 'translate-x-5' : 'translate-x-0'}`} />
               </div>
            </div>

            <div className="pt-3 border-t border-[#EAEAE0] dark:border-[#1E293B]">
               <div className="font-bold text-[#4A4A40] dark:text-[#E2E8F0] text-sm mb-2">{t('settings.subtitleSize') || '字幕大小'}</div>
               <div className="flex bg-[#F9F9F7] dark:bg-[#1C222C] rounded-xl p-1 gap-1 border border-[#EAEAE0] dark:border-[#1E293B]">
                  <SizeOption label={t('settings.sizeSmall') || '小'} isActive={subtitleSize === 'small'} onClick={() => onChangeSubtitleSize('small')} />
                  <SizeOption label={t('settings.sizeStandard') || '标准'} isActive={subtitleSize === 'standard'} onClick={() => onChangeSubtitleSize('standard')} />
                  <SizeOption label={t('settings.sizeMedium') || '中'} isActive={subtitleSize === 'medium'} onClick={() => onChangeSubtitleSize('medium')} />
                  <SizeOption label={t('settings.sizeLarge') || '大'} isActive={subtitleSize === 'large'} onClick={() => onChangeSubtitleSize('large')} />
               </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const SizeOption = ({ label, isActive = false, onClick }: { label: string, isActive?: boolean, onClick?: () => void }) => {
   return (
      <div 
         onClick={onClick}
         className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${isActive ? 'bg-[#5A5A40] dark:bg-[#334155] text-white shadow-sm' : 'text-[#6A6A5A] dark:text-[#94A3B8] hover:bg-white dark:hover:bg-[#151B25]'}`}>
         {label}
      </div>
   );
};
