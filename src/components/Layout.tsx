import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Skull, LayoutDashboard, CheckSquare, ShoppingBag, Users, LogOut, Shield, Crown, Zap } from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const getRank = (essence: number) => {
    if (essence < 100) return { title: "Unkindled", next: 100, icon: <Shield size={12}/> };
    if (essence < 500) return { title: "Neophyte", next: 500, icon: <Shield size={12}/> };
    if (essence < 1000) return { title: "Adept", next: 1000, icon: <Skull size={12}/> };
    if (essence < 2500) return { title: "Warlock", next: 2500, icon: <Skull size={12}/> };
    if (essence < 5000) return { title: "Lich", next: 5000, icon: <Crown size={12}/> };
    return { title: "Demi-God", next: 10000, icon: <Zap size={12}/> };
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const navigate = useNavigate();
  const rank = getRank(user.essence);
  const progress = Math.min(100, (user.essence / rank.next) * 100);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
      isActive 
        ? 'bg-ritual-accent/10 text-ritual-accent border border-ritual-accent/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
    }`;

  return (
    <div className="min-h-screen bg-ritual-black text-zinc-100 flex font-sans">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-zinc-900 bg-ritual-dark/95 backdrop-blur hidden md:flex flex-col z-50">
        <div className="p-6 flex items-center gap-3">
          <Skull className="w-8 h-8 text-ritual-accent animate-pulse-slow" />
          <span className="font-display font-bold text-xl tracking-wider text-white">RitualKiller</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavLink to="/app/dashboard" className={navItemClass}>
            <LayoutDashboard size={20} />
            <span>Altar</span>
          </NavLink>
          <NavLink to="/app/habits" className={navItemClass}>
            <CheckSquare size={20} />
            <span>Rituals</span>
          </NavLink>
          <NavLink to="/app/social" className={navItemClass}>
            <Users size={20} />
            <span>Coven</span>
          </NavLink>
          <NavLink to="/app/shop" className={navItemClass}>
            <ShoppingBag size={20} />
            <span>Black Market</span>
          </NavLink>
        </nav>

        {/* User Profile Section */}
        <div className="p-6 border-t border-zinc-900 bg-zinc-950/30">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 text-ritual-accent font-display font-bold shadow-inner">
                    {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div className="font-bold text-sm text-zinc-100">{user.username}</div>
                    <div className="text-[10px] text-ritual-accent flex items-center gap-1 uppercase tracking-wider">
                        {rank.icon} {rank.title}
                    </div>
                </div>
            </div>
            
            <div className="mb-4">
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">
                    <span>Progress</span>
                    <span>{user.essence} / {rank.next}</span>
                 </div>
                 <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-800">
                    <div className="h-full bg-ritual-accent transition-all duration-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" style={{ width: `${progress}%` }}></div>
                 </div>
            </div>

            <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-zinc-500 hover:text-red-500 transition-colors text-xs uppercase tracking-widest w-full pt-3 border-t border-zinc-800/50"
            >
                <LogOut size={14} />
                <span>Sever Connection</span>
            </button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-ritual-dark border-t border-zinc-900 z-50 px-4 py-3 flex justify-between items-center safe-pb">
        <NavLink to="/app/dashboard" className={({isActive}) => isActive ? 'text-ritual-accent' : 'text-zinc-600'}><LayoutDashboard /></NavLink>
        <NavLink to="/app/habits" className={({isActive}) => isActive ? 'text-ritual-accent' : 'text-zinc-600'}><CheckSquare /></NavLink>
        <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 text-ritual-accent text-xs font-bold">
            {user.essence}
        </div>
        <NavLink to="/app/social" className={({isActive}) => isActive ? 'text-ritual-accent' : 'text-zinc-600'}><Users /></NavLink>
        <NavLink to="/app/shop" className={({isActive}) => isActive ? 'text-ritual-accent' : 'text-zinc-600'}><ShoppingBag /></NavLink>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};