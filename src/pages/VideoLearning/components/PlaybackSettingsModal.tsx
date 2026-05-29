import React from 'react';
import { X, Download } from 'lucide-react';

interface PlaybackSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlaybackSettingsModal: React.FC<PlaybackSettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity" 
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-[60] overflow-hidden shadow-2xl animate-in slide-in-from-bottom mx-auto max-w-xl">
        <div className="p-6 pb-safe">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#4A4A40] flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#5A5A40]"><path d="M21 3v18"/><path d="M3 3v18"/><path d="M21 12H3"/></svg>
               播放设置
            </h3>
            <button onClick={onClose} className="p-2 bg-[#F9F9F7] text-[#8A8A7A] hover:bg-[#EAEAE0] hover:text-[#4A4A40] rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between py-2">
               <span className="font-bold text-[#4A4A40] text-[15px]">字幕下载</span>
               <button className="bg-[#4169E1] text-white p-2 rounded-full hover:bg-blue-600 transition-colors">
                 <Download className="w-4 h-4" />
               </button>
            </div>
            
            <SettingToggle label="隐藏标注" />
            <SettingToggle label="全文音标" />
            <SettingToggle label="自动词汇" />
            <SettingToggle label="屏下字幕" />
            <SettingToggle label="实时字幕" />

            <div className="pt-4 border-t border-[#EAEAE0]">
               <div className="font-bold text-[#4A4A40] text-[15px] mb-3">字幕大小</div>
               <div className="flex bg-[#F9F9F7] rounded-xl p-1 gap-1 border border-[#EAEAE0]">
                  <SizeOption label="小号" />
                  <SizeOption label="标准" isActive />
                  <SizeOption label="中号" />
                  <SizeOption label="大号" />
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
      <div className="flex items-center justify-between py-2 cursor-pointer select-none" onClick={() => setChecked(!checked)}>
         <span className="font-bold text-[#4A4A40] text-[15px]">{label}</span>
         <div className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${checked ? 'bg-[#4169E1]' : 'bg-[#E0E0D5]'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
         </div>
      </div>
   );
};

const SizeOption = ({ label, isActive = false }: { label: string, isActive?: boolean }) => {
   return (
      <div className={`flex-1 text-center py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors ${isActive ? 'bg-[#4169E1] text-white shadow-sm' : 'text-[#6A6A5A] hover:bg-white'}`}>
         {label}
      </div>
   );
};
