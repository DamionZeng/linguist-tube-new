import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Gift, QrCode, Smartphone, Layers, Headphones, Sparkles, Monitor } from 'lucide-react';

export const GetKeyPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    { icon: <Layers className="w-6 h-6" />, title: t('getKey.feature1Title'), desc: t('getKey.feature1Desc') },
    { icon: <Headphones className="w-6 h-6" />, title: t('getKey.feature2Title'), desc: t('getKey.feature2Desc') },
    { icon: <Sparkles className="w-6 h-6" />, title: t('getKey.feature3Title'), desc: t('getKey.feature3Desc') },
    { icon: <Smartphone className="w-6 h-6" />, title: t('getKey.feature4Title'), desc: t('getKey.feature4Desc') },
    { icon: <Monitor className="w-6 h-6" />, title: t('getKey.feature5Title'), desc: t('getKey.feature5Desc') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5F0] to-[#EDEDE8] dark:from-[#1A1A2E] dark:to-[#16213E]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-md border-b border-[#EAEAE0] dark:border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-[#F0F0EB] dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#5A5A40] dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-bold text-[#5A5A40] dark:text-white">{t('getKey.title')}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-10">
        {/* QR Code Section */}
        <div className="bg-white dark:bg-[#1A1A2E] rounded-3xl shadow-sm border border-[#EAEAE0] dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#D48166] to-[#C27055] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-[#5A5A40] dark:text-white mb-2">{t('getKey.qrTitle')}</h2>
          <p className="text-sm text-[#848464] dark:text-gray-400 mb-6 leading-relaxed">{t('getKey.qrDesc')}</p>

          <div className="inline-block p-3 bg-white rounded-2xl shadow-inner border border-[#EAEAE0] dark:bg-gray-800 dark:border-gray-600 mb-4">
            <img src="/contact.jpg" alt={t('getKey.qrAlt')} className="w-48 h-48 object-contain rounded-xl" />
          </div>

          <p className="text-sm font-bold text-[#D48166] dark:text-orange-400">{t('getKey.vipReward')}</p>
        </div>

        {/* Features Section */}
        <div>
          <div className="flex items-center justify-center gap-2 mb-6">
            <QrCode className="w-5 h-5 text-[#D48166]" />
            <h2 className="text-lg font-bold text-[#5A5A40] dark:text-white">{t('getKey.featuresTitle')}</h2>
          </div>
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="bg-white dark:bg-[#1A1A2E] rounded-2xl border border-[#EAEAE0] dark:border-gray-700 p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="shrink-0 w-11 h-11 bg-[#D48166]/10 dark:bg-[#D48166]/20 rounded-xl flex items-center justify-center text-[#D48166] dark:text-orange-400">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#5A5A40] dark:text-white">{f.title}</h3>
                  <p className="text-xs text-[#848464] dark:text-gray-400 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image Gallery */}
        <div>
          <div className="flex items-center justify-center gap-2 mb-6">
            <Smartphone className="w-5 h-5 text-[#D48166]" />
            <h2 className="text-lg font-bold text-[#5A5A40] dark:text-white">{t('getKey.galleryTitle')}</h2>
          </div>
          <div className="space-y-4">
            <img src="/1.jpg" alt={t('getKey.img1Alt')} className="w-full rounded-2xl shadow-sm border border-[#EAEAE0] dark:border-gray-700" />
            <img src="/2.jpg" alt={t('getKey.img2Alt')} className="w-full rounded-2xl shadow-sm border border-[#EAEAE0] dark:border-gray-700" />
            <img src="/3.jpg" alt={t('getKey.img3Alt')} className="w-full rounded-2xl shadow-sm border border-[#EAEAE0] dark:border-gray-700" />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pb-8">
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-[#D48166] text-white font-bold rounded-xl hover:bg-[#C27055] transition-colors shadow-sm"
          >
            {t('getKey.backToRegister')}
          </button>
        </div>
      </div>
    </div>
  );
};
