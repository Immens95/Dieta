import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Apple, 
  UtensilsCrossed, 
  Users, 
  Calendar,
  User,
  LogOut
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: User, label: 'Profilo', href: '/profilo' },
  { icon: Apple, label: 'Alimenti', href: '/alimenti' },
  { icon: UtensilsCrossed, label: 'Ricette', href: '/ricette' },
  { icon: Users, label: 'Utenti', href: '/utenti' },
  { icon: Calendar, label: 'Piani Dietetici', href: '/piani' },
];

export const Sidebar = () => {
  return (
    <div className="flex flex-col h-screen w-64 bg-slate-900 text-white fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary-400">DietaApp</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) => cn(
              "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
              isActive 
                ? "bg-primary-600 text-white" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center space-x-3 px-4 py-3 w-full text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Esci</span>
        </button>
      </div>
    </div>
  );
};
