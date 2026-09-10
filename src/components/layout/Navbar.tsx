'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, History, Activity, TrendingUp } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  // No mostrar la barra de navegación en la pantalla de entrenamiento activo a pantalla completa
  if (pathname === '/workout/active') {
    return null;
  }

  const navItems = [
    { href: '/', label: 'Hoy', icon: Home },
    { href: '/workouts/new', label: 'Entrenar', icon: PlusCircle, isMain: true },
    { href: '/history', label: 'Historial', icon: History },
    { href: '/tests', label: 'Tests', icon: Activity },
    { href: '/progress', label: 'Progreso', icon: TrendingUp },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-graphite-950/95 backdrop-blur-lg border-t border-chalk-300 dark:border-graphite-800 transition-colors pb-safe"
    >
      <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.isMain) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-5 group select-none"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform group-active:scale-95 ${
                    isActive
                      ? 'bg-terracotta text-white ring-4 ring-chalk-100 dark:ring-graphite-950'
                      : 'bg-terracotta hover:bg-terracotta-600 text-white ring-4 ring-chalk-100 dark:ring-graphite-950'
                  }`}
                >
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-terracotta mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all select-none ${
                isActive
                  ? 'text-terracotta dark:text-terracotta-400 font-bold'
                  : 'text-graphite-500 hover:text-graphite-800 dark:text-graphite-400 dark:hover:text-graphite-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
