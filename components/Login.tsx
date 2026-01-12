
import React, { useState, useEffect } from 'react';

interface LoginProps {
  onLogin: (password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const savedPassword = localStorage.getItem('nexus_master_password');
    if (!savedPassword) {
      setIsFirstTime(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedPassword = localStorage.getItem('nexus_master_password');

    if (isFirstTime) {
      if (password.length < 4) {
        setError('Password must be at least 4 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      localStorage.setItem('nexus_master_password', password);
      onLogin(password);
    } else {
      if (password === savedPassword) {
        onLogin(password);
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      {/* Abstract Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl relative z-10 border border-slate-100 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl mb-6 transform rotate-3">
            <i className="fas fa-shield-halved text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">PARA Nexus</h1>
          <p className="text-slate-500 mt-2 font-medium">
            {isFirstTime ? 'Set your master password to begin.' : 'Enter password to access your workspace.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 text-lg focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
              autoFocus
            />
          </div>

          {isFirstTime && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 text-lg focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in slide-in-from-top-2">
              <i className="fas fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98] mt-4"
          >
            {isFirstTime ? 'Initialize Vault' : 'Unlock Workspace'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            Local Encryption Active<br />
            Data stored securely in this browser session
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
