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
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-[60] overflow-hidden shadow-2xl animate-in slide-in-from-bottom mx-auto max-w-xl">
        <div className="p-4 md:p-5 pb-safe">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#4A4A40] flex items-center gap-2">
               <SlidersHorizontal className="w-5 h-5 text-[#5A5A40]" />
               {t('settings.playbackSettings')}
            </h3>
            <button onClick={onClose} className="p-1.5 bg-[#F9F9F7] text-[#8A8A7A] hover:bg-[#EAEAE0] hover:text-[#4A4A40] rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between py-1.5">
               <span className="font-bold text-[#4A4A40] text-sm">{t('settings.downloadSubtitles')}</span>
               <button className="bg-[#4169E1] text-white p-1.5 rounded-full hover:bg-blue-600 transition-colors">
                 <Download className="w-4 h-4" />
               </button>
            </div>
            
            <SettingToggle label={t('settings.hideAnnotations')} />
            <SettingToggle label={t('settings.showPhonetics')} />
            <SettingToggle label={t('settings.autoVocab')} />
            <SettingToggle label={t('settings.subtitlesUnderScreen')} />
            <SettingToggle label={t('settings.realtimeSubtitles')} />

            <div className="pt-3 border-t border-[#EAEAE0]">
               <div className="font-bold text-[#4A4A40] text-sm mb-2">{t('settings.subtitleSize')}</div>
               <div className="flex bg-[#F9F9F7] rounded-xl p-1 gap-1 border border-[#EAEAE0]">
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
         <span className="font-bold text-[#4A4A40] text-sm">{label}</span>
         <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${checked ? 'bg-[#4169E1]' : 'bg-[#E0E0D5]'}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
         </div>
      </div>
   );
};

const SizeOption = ({ label, isActive = false }: { label: string, isActive?: boolean }) => {
   return (
      <div className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${isActive ? 'bg-[#4169E1] text-white shadow-sm' : 'text-[#6A6A5A] hover:bg-white'}`}>
         {label}
      </div>
   );
};
