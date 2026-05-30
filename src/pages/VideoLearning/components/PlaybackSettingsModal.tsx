import React from 'react';
import { X, Download, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PlaybackSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlaybackSettingsModal: React.FC<PlaybackSettingsModalProps> = ({ isOpen, onClose }) => {
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
               <span className="font-bold text-[#4A4A40] dark:text-[#E2E8F0] text-sm">{t('settings.downloadSubtitles')}</span>
               <button className="bg-[#D48166] text-white p-1.5 rounded-full hover:bg-[#C27055] transition-colors">
                 <Download className="w-4 h-4" />
               </button>
            </div>
            
            <SettingToggle label={t('settings.hideAnnotations')} />
            <SettingToggle label={t('settings.showPhonetics')} />
            <SettingToggle label={t('settings.autoVocab')} />
            <SettingToggle label={t('settings.subtitlesUnderScreen')} />
            <SettingToggle label={t('settings.realtimeSubtitles')} />

            <div className="pt-3 border-t border-[#EAEAE0] dark:border-[#1E293B]">
               <div className="font-bold text-[#4A4A40] dark:text-[#E2E8F0] text-sm mb-2">{t('settings.subtitleSize')}</div>
               <div className="flex bg-[#F9F9F7] dark:bg-[#1C222C] rounded-xl p-1 gap-1 border border-[#EAEAE0] dark:border-[#1E293B]">
                  <SizeOption label={t('settings.sizeSmall')} />
                  <SizeOption label={t('settings.sizeStandard')} isActive />
                  <SizeOption label={t('settings.sizeMedium')} />
                  <SizeOption label={t('settings.sizeLarge')} />
               </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const SettingToggle = ({ label, defaultChecked = false }: { label: string, defaultChecked?: boolean }) => {
   const [checked, setChecked] = React.useState(defaultChecked);
   return (
      <div className="flex items-center justify-between py-1.5 cursor-pointer select-none" onClick={() => setChecked(!checked)}>
         <span className="font-bold text-[#4A4A40] dark:text-[#E2E8F0] text-sm">{label}</span>
         <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${checked ? 'bg-[#94A684]' : 'bg-[#E0E0D5] dark:bg-[#334155]'}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
         </div>
      </div>
   );
};

const SizeOption = ({ label, isActive = false }: { label: string, isActive?: boolean }) => {
   return (
      <div className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${isActive ? 'bg-[#5A5A40] dark:bg-[#334155] text-white shadow-sm' : 'text-[#6A6A5A] dark:text-[#94A3B8] hover:bg-white dark:hover:bg-[#151B25]'}`}>
         {label}
      </div>
   );
};
