import { useLanguage } from '../context/LanguageContext';

export default function About() {
  const { t } = useLanguage();
  return (
    <div className='py-20 px-4 max-w-6xl mx-auto'>
      <h1 className='text-3xl font-bold mb-4 text-slate-800'>{t('about.title')}</h1>
      <p className='mb-4 text-slate-700'>{t('about.p1')}</p>
      <p className='mb-4 text-slate-700'>{t('about.p2')}</p>
      <p className='mb-4 text-slate-700'>{t('about.p3')}</p>
    </div>
  );
}
