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
  const currentDate = new Date();
  const monthName = currentDate
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .toUpperCase();

  return (
    <div className="layout-shell min-h-screen bg-background text-foreground">
      {/* SIDEBAR FIXA */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-16 flex-col border-r border-border bg-[#0a0e27] p-2 md:w-64">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>

          <div className="hidden min-w-0 md:block">
            <h1 className="truncate text-sm font-bold text-white">BWT TRANSPORTE</h1>
            <p className="truncate text-xs text-indigo-300">Indicador Comercial · {monthName}</p>
          </div>
        </div>

        <div className="mt-4 border-b border-indigo-700" />

        <nav className="mt-6 flex-1 space-y-2">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex h-10 items-center rounded-lg transition-colors ${
                  isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-indigo-200 hover:bg-[#111a3a]'
                }`
              }
            >
              <div className="flex w-12 shrink-0 items-center justify-center">
                <Icon className="h-5 w-5" />
              </div>

              <span className="hidden truncate pr-2 text-sm md:block">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <main className="min-w-0 pl-16 md:pl-64">
        <MonthDataProvider>
          <Outlet />
        </MonthDataProvider>
      </main>
    </div>
  );
}
