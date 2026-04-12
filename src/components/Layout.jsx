import { NavLink, Outlet } from 'react-router-dom';
import { Activity, BarChart3, Route, Truck, Wallet } from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: BarChart3, end: true },
  { to: '/frota', label: 'Frota', icon: Truck },
  { to: '/faturamento', label: 'Faturamento', icon: Wallet },
  { to: '/telemetria', label: 'Telemetria', icon: Activity },
  { to: '/rotas', label: 'Rotas', icon: Route },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="hidden lg:flex w-64 min-h-screen border-r border-border bg-card p-4 flex-col">
          <h1 className="text-lg font-bold">BWT · Comercial</h1>
          <p className="mt-1 text-xs text-muted-foreground">Dashboard Operacional</p>
          <nav className="mt-6 space-y-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
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
