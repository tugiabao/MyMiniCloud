import React from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface AddAquariumCardProps {
  onClick: () => void;
  loading?: boolean;
}

export const AddAquariumCard: React.FC<AddAquariumCardProps> = ({ onClick, loading }) => {
  const { t } = useLanguage();

  return (
    <div 
      onClick={!loading ? onClick : undefined}
      className={`bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 flex flex-col items-center justify-center min-h-[200px] hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-all duration-300 cursor-pointer group ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
        <Plus size={28} className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
      </div>
      <span className="text-slate-600 dark:text-slate-300 font-bold text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {loading ? t('loading') : t('add_new')}
      </span>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-widest font-bold">
        {t('register_new_system')}
      </p>
    </div>
  );
};