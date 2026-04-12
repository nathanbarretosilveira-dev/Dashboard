import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin, Search, Route, TrendingUp, DollarSign } from 'lucide-react';
import KPICard from '../components/KPICard';
import { rotasCatalogo, rotasRealizadas } from '../lib/bwtData';

// @ts-ignore
const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
// @ts-ignore
const fmtNum = (v) => new Intl.NumberFormat('pt-BR').format(v);

const totalViagens = rotasRealizadas.reduce((s, r) => s + r.viagens, 0);
const totalReceita = rotasRealizadas.reduce((s, r) => s + r.valorTotal, 0);
const mediaValorViagem = totalReceita / totalViagens;
const totalPedagios = rotasCatalogo.reduce((s, r) => s + r.valorPedagios, 0);

// @ts-ignore
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {/* @ts-ignore */}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.color }}>{p.name}: {typeof p.value === 'number' && p.name.includes('R$') ? fmt(p.value) : p.name === 'Viagens' ? `${p.value} viagens` : fmt(p.value)}</p>
      ))}
    </div>
  );
};

export default function RotasPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('realizadas');

  const filteredRealizadas = rotasRealizadas.filter(r =>
    !search || r.rota.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCatalogo = rotasCatalogo.filter(r =>
    !search || r.rota.toLowerCase().includes(search.toLowerCase()) || r.origem.toLowerCase().includes(search.toLowerCase()) || r.destino.toLowerCase().includes(search.toLowerCase())
  );

  const kmData = rotasCatalogo.map(r => ({ rota: r.rota.split('/')[1] || r.rota, km: r.km, pedagio: r.valorPedagios }));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rotas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Rotas realizadas e catálogo de rotas homologadas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="Total de Viagens" value={fmtNum(totalViagens)} subtitle={`${rotasRealizadas.length} rotas distintas`} icon={Route} color="blue" />
        <KPICard title="Receita Total" value={fmt(totalReceita)} subtitle="Todas as rotas" icon={DollarSign} color="green" />
        <KPICard title="Média por Viagem" value={fmt(mediaValorViagem)} subtitle="Valor médio" icon={TrendingUp} color="navy" />
        <KPICard title="Rotas Cadastradas" value={rotasCatalogo.length} subtitle="Com KM e pedágio" icon={MapPin} color="amber" />
      </div>

      {/* KM vs Pedágio */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="font-semibold text-foreground text-sm mb-4">KM e Valor de Pedágio por Rota</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={kmData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="rota" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `R$${v}`} />
            {/* @ts-ignore */}
            <Tooltip content={<CustomTooltip />} />
            <Bar yAxisId="left" dataKey="km" name="KM" fill="#2563EB" radius={[3, 3, 0, 0]} />
            <Bar yAxisId="right" dataKey="pedagio" name="Pedágio (R$)" fill="#7C3AED" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setTab('realizadas')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${tab === 'realizadas' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Rotas Realizadas
            </button>
            <button
              onClick={() => setTab('catalogo')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${tab === 'catalogo' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Catálogo de Rotas
            </button>
          </div>
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar rota..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {tab === 'realizadas' ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Rota</th>
                  <th className="text-right px-4 py-3 font-semibold">Viagens</th>
                  <th className="text-right px-4 py-3 font-semibold">Valor Total</th>
                  <th className="text-right px-4 py-3 font-semibold">Média / Viagem</th>
                  <th className="text-right px-4 py-3 font-semibold hidden lg:table-cell">% do Total</th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell">Participação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRealizadas.map((r, i) => {
                  const pct = (r.valorTotal / totalReceita) * 100;
                  return (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{r.rota}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full font-semibold">{r.viagens}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{fmt(r.valorTotal)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{fmt(r.valorTotal / r.viagens)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">{pct}%</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Rota</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Origem</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Destino</th>
                  <th className="text-right px-4 py-3 font-semibold">KM</th>
                  <th className="text-right px-4 py-3 font-semibold">Praças</th>
                  <th className="text-right px-4 py-3 font-semibold">Valor Pedágio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCatalogo.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{r.rota}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r.origem}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r.destino}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmtNum(r.km)} km</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{r.pedagios}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">{r.valorPedagios > 0 ? fmt(r.valorPedagios) : <span className="text-muted-foreground">Isento</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}