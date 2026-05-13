import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Activity, BarChart3, Route, Truck, Wallet, TrendingUp, LineChart } from 'lucide-react';
import { MonthDataProvider } from '../lib/MonthDataContext';

const links = [
  { to: '/', label: 'Visão Geral', icon: BarChart3, end: true },
  { to: '/frota', label: 'Performance Frota', icon: Truck },
  { to: '/faturamento', label: 'Faturamento', icon: Wallet },
  { to: '/telemetria', label: 'Telemetria', icon: Activity },
  { to: '/rotas', label: 'Rotas', icon: Route },
  { to: '/comparativo', label: 'Comparativo', icon: LineChart },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* SIDEBAR */}
      <aside
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
        className={`
          hidden lg:flex
          fixed left-0 top-0 z-50
          ${sidebarOpen ? 'w-64' : 'w-16'}
          transition-all duration-300 ease-in-out
          h-screen
          border-r border-border
          bg-[#0a0e27]
          flex flex-col
          p-2
          overflow-hidden
        `}
      >

        {/* LOGO */}
        <div
          className={`
            flex items-center gap-3
            ${sidebarOpen ? 'ml-0 w-full' : 'ml-1 w-12'}
            transition-all duration-300
            overflow-hidden
          `}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shrink-0">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>

          <div
            className={`
              ${sidebarOpen ? 'opacity-100' : 'opacity-0'}
              transition-opacity duration-300
              whitespace-nowrap
            `}
          >
            <h1 className="text-sm font-bold text-white">
              BWT TRANSPORTE
            </h1>
            <p className="text-xs text-indigo-300">
              Indicador Comercial
            </p>
          </div>
        </div>

        <div className="mt-4 border-b border-indigo-700" />

        {/* NAV */}
        <nav className="mt-6 space-y-2 flex-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `
                  flex items-center h-10 rounded-lg transition-all duration-300
                  w-full
                  ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-indigo-200 hover:bg-[#111a3a]'
                  }
                `
              }
            >
              <div className="w-12 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5" />
              </div>

              <span
                className={`
                  whitespace-nowrap
                  overflow-hidden
                  ${sidebarOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}
                  transition-all duration-300
                `}
              >
                {label}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <main
        className={`
          min-h-screen
          w-full
          min-w-0
          ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-16'}
          transition-all duration-300 ease-in-out
        `}
      >
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur lg:hidden">
          <div className="px-4 py-3">
            <h1 className="font-semibold">BWT · Comercial</h1>
          </div>
        </header>

        <MonthDataProvider>
          <Outlet />
        </MonthDataProvider>
      </main>

    </div>
  );
}