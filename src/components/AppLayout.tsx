import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Brain, Home, Layers, BarChart3, TrendingUp, Menu, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/modules', icon: Layers, label: 'Modules' },
  { to: '/results', icon: BarChart3, label: 'Results' },
  { to: '/tracking', icon: TrendingUp, label: 'Tracking' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-60 bg-card border-r border-border flex flex-col transition-transform lg:relative lg:translate-x-0 shadow-card",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center glow-primary">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">NeuroInsight AI</h1>
            <p className="text-[10px] text-muted-foreground">Brain Signal Intelligence</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              end={item.to === '/'}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User & Sign Out */}
        <div className="px-4 py-3 border-t border-border">
          {user && (
            <div className="mb-2">
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-xs text-muted-foreground hover:text-foreground">
            <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-card/80 backdrop-blur-md border-b border-border lg:hidden shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-md hover:bg-muted">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground">NeuroInsight AI</span>
        </div>
        <div className="neural-bg min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
