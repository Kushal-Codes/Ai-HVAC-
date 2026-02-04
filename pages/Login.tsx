
import React, { useState } from 'react';
import { User, UserRole, Staff } from '../types';

interface LoginProps {
  staff: Staff[];
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ staff, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const member = staff.find(s => s.username === username && s.password === password && s.active);
    if (member) {
      onLogin({ id: member.id, name: member.name, role: member.role, teamType: member.teamType });
    } else {
      setError('Invalid credentials or account inactive.');
    }
  };

  return (
    <div className="max-w-md mx-auto my-32 p-10 bg-white rounded-3xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-500">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">ArcticFlow Portal</h1>
        <p className="text-slate-400 text-sm">Secure access for field staff and administrators.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
          <input 
            type="text" 
            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="e.g. mike_repair"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
          <input 
            type="password" 
            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        
        {error && <p className="text-xs text-red-500 font-bold text-center bg-red-50 py-2 rounded-xl border border-red-100">{error}</p>}
        
        <button 
          type="submit"
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
        >
          Sign In
        </button>
      </form>
      
      <div className="mt-8 pt-8 border-t border-slate-50">
        <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-widest">Forgot your credentials? Contact your manager.</p>
      </div>
    </div>
  );
};

export default Login;
