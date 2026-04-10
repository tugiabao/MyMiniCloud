import React, { type ChangeEvent, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  loading: boolean;
}

export const RegisterSystemModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSubmit, loading }) => {
  const [name, setName] = React.useState<string>('');
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (name.trim()) {
      await onSubmit(name.trim());
      setName('');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">{t('register_new_system')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              {t('system_code')}
            </label>
            <input
              type="text"
              value={name}
              onChange={handleInputChange}
              placeholder={t('system_code_placeholder')}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/30 outline-none transition-all font-bold"
              autoFocus
              disabled={loading}
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-2 italic">
              * {t('enter_system_info')}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all
              ${loading || !name.trim() 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none'}`}
          >
            {loading ? t('loading') : t('register')}
          </button>
        </form>
      </div>
    </div>
  );
};