import { NavLink, Outlet } from 'react-router-dom';
import { Activity, BarChart3, Route, Truck, Wallet, TrendingUp, LineChart } from 'lucide-react';

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
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-[1600px]">

        {/* SIDEBAR */}
        <aside className="
  hidden lg:flex group
  w-16 hover:w-64
  transition-all duration-300 ease-in-out
  min-h-screen
  border-r border-border
  bg-[#0a0e27]
  flex flex-col
  p-2
  overflow-hidden
">

          {/* LOGO */}
          <div className="
  flex items-center gap-3
  ml-1 group-hover:ml-0
  w-12 group-hover:w-full
  transition-all duration-300
  overflow-hidden
">

            {/* ÍCONE SEMPRE VISÍVEL */}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shrink-0">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>

            {/* TEXTO (SÓ APARECE NO HOVER) */}
            <div className="
    opacity-0
    group-hover:opacity-100
    transition-opacity duration-300
    whitespace-nowrap
  ">
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
    ${isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-indigo-200 hover:bg-[#111a3a]'
                  }
  `
                }
              >
                {/* ÍCONE sempre fixo */}
                <div className="w-12 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" />
                </div>

                {/* TEXTO sem empurrar layout */}
                <span className="
    whitespace-nowrap
    overflow-hidden
    opacity-0
    max-w-0

    group-hover:opacity-100
    group-hover:max-w-[200px]
    transition-all duration-300
  ">
                  {label}
                </span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* MAIN */}
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