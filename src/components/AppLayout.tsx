import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Brain, GraduationCap, Building2, HeartPulse, Search, Smile, Home, Menu, History, LogOut, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/student', icon: GraduationCap, label: 'Student' },
  { to: '/workplace', icon: Building2, label: 'Workplace' },
  { to: '/healthcare', icon: HeartPulse, label: 'Healthcare' },
  { to: '/investigation', icon: Search, label: 'Investigation' },
  { to: '/emotion', icon: Smile, label: 'Emotion' },
  { to: '/meditation', icon: Heart, label: 'Meditation' },
  { to: '/history', icon: History, label: 'History' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform lg:relative lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">NeuroInsight AI</h1>
            <p className="text-[10px] text-muted-foreground">Cognitive Analysis Platform</p>
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
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
              end={item.to === '/'}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User & Sign Out */}
        <div className="px-4 py-3 border-t border-sidebar-border">
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
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-md hover:bg-secondary">
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
