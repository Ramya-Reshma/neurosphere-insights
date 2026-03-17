import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Brain, Home, Layers, BarChart3, TrendingUp, Menu, LogOut, Activity } from 'lucide-react';
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
      {/* Sidebar - Glassmorphism */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 glass-sidebar flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border/40">
          <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-glow">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground tracking-tight">NeuroInsight AI</h1>
            <p className="text-[10px] text-muted-foreground">Brain Signal Intelligence</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "glass bg-primary/10 text-primary shadow-sm border-primary/20"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
              end={item.to === '/'}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Status indicator */}
        <div className="px-4 py-3 mx-3 mb-3 rounded-xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="status-dot bg-neuro-green" />
            <span className="text-[10px] font-medium text-foreground">System Active</span>
          </div>
          <p className="text-[10px] text-muted-foreground">AI Engine Ready</p>
        </div>

        {/* User & Sign Out */}
        <div className="px-4 py-3 border-t border-border/40">
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
        <div className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 glass border-b border-border/40 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">NeuroInsight AI</span>
          </div>
        </div>
        <div className="neural-bg min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
