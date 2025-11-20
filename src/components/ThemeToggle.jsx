import { useEffect, useState } from 'react';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';

const getSystemPref = () => (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

const applyTheme = (mode) => {
  const root = document.documentElement;
  if (mode === 'system') {
    const sys = getSystemPref();
    root.classList.toggle('dark', sys === 'dark');
  } else {
    root.classList.toggle('dark', mode === 'dark');
  }
  localStorage.setItem('devlink-theme', mode);
};

export default function ThemeToggle() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('system');

  // carregar preferência
  useEffect(() => {
    const saved = localStorage.getItem('devlink-theme') || 'system';
    setMode(saved);
    applyTheme(saved);

    // acompanhar mudança do sistema quando em "system"
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const current = localStorage.getItem('devlink-theme') || 'system';
      if (current === 'system') applyTheme('system');
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const select = (val) => {
    setMode(val);
    applyTheme(val);
    setOpen(false);
  };

  const Icon = mode === 'dark' ? FiMoon : mode === 'light' ? FiSun : FiMonitor;

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="ml-3 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors" aria-label="Trocar tema" title="Tema">
        <Icon size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black/5 z-50">
          <button onClick={() => select('light')} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700">
            <FiSun /> Claro {mode === 'light' && <span className="ml-auto text-xs text-sky-600">ativo</span>}
          </button>
          <button onClick={() => select('dark')} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700">
            <FiMoon /> Escuro {mode === 'dark' && <span className="ml-auto text-xs text-sky-400">ativo</span>}
          </button>
          <button onClick={() => select('system')} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700">
            <FiMonitor /> Sistema {mode === 'system' && <span className="ml-auto text-xs text-emerald-500">ativo</span>}
          </button>
        </div>
      )}
    </div>
  );
}
