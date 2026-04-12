import { NavLink, Outlet } from 'react-router-dom';
import { Activity, BarChart3, Route, Truck, Wallet, TrendingUp } from 'lucide-react';

const links = [
  { to: '/', label: 'Visão Geral', icon: BarChart3, end: true },
  { to: '/frota', label: 'Performance Frota', icon: Truck },
  { to: '/faturamento', label: 'Faturamento', icon: Wallet },
  { to: '/telemetria', label: 'Telemetria', icon: Activity },
  { to: '/rotas', label: 'Rotas', icon: Route },
];

export default function Layout() {
  const currentDate = new Date();
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="hidden lg:flex w-64 min-h-screen border-r border-border bg-[#0a0e27] p-4 flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">BWT LOGÍSTICA</h1>
              <p className="text-xs text-indigo-300">Indicador Comercial</p>
            </div>
          </div>
          
          <div className="mt-4 border-b border-indigo-700" />
          
          <nav className="mt-6 space-y-2 flex-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-indigo-200 hover:bg-[#111a3a] hover:shadow-md'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur lg:hidden">
            <div className="px-4 py-3">
              <h1 className="font-semibold">BWT · Comercial</h1>
            </div>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
