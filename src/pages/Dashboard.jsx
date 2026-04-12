import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, Truck, TrendingUp, MapPin, Activity, Package } from 'lucide-react';
import KPICard from '../components/KPICard';
import { kpiGeral, faturamentoPorDia, rotasRealizadas, frotaVeiculos } from '../lib/bwtData';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
const fmtNum = (v) => new Intl.NumberFormat('pt-BR').format(v);

const totalFat = faturamentoPorDia.reduce((s, d) => s + d.faturamento, 0);
const totalKm = frotaVeiculos.reduce((s, v) => s + v.hodometro, 0);
const totalLitros = frotaVeiculos.reduce((s, v) => s + v.litros, 0);
const mediaKmL = totalKm / totalLitros;

const ebitdaData = [
  { name: 'BWT', value: kpiGeral.ebitdaBWT, color: '#2563EB' },
  { name: 'Subcontratado', value: kpiGeral.ebitdaSubcontratado, color: '#7C3AED' },
];

const topRotas = rotasRealizadas.slice(0, 5);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Visão Geral</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Indicador Comercial · Abril 2026 · 01 a 12/04</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard title="Faturamento Total" value={fmt(totalFat)} subtitle="12 dias apurados" icon={DollarSign} color="blue" className="col-span-2 xl:col-span-2" />
        <KPICard title="EBITDA BWT" value={fmt(kpiGeral.ebitdaBWT)} subtitle="Frota própria" icon={TrendingUp} color="green" />
        <KPICard title="EBITDA Subcontr." value={fmt(kpiGeral.ebitdaSubcontratado)} subtitle="Terceiros" icon={TrendingUp} color="purple" />
        <KPICard title="Resultado Total" value={fmt(kpiGeral.resultadoTotal)} subtitle="EBITDA consolidado" icon={Activity} color="navy" />
        <KPICard title="KM Total" value={fmtNum(Math.round(totalKm))} subtitle={`Média ${mediaKmL.toFixed(2)} km/L`} icon={Truck} color="amber" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Faturamento diário */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-foreground text-sm">Faturamento Diário</h2>
              <p className="text-xs text-muted-foreground">BWT vs Subcontratado</p>
            </div>
            <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-1 rounded-full">Abr/2026</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={faturamentoPorDia} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gbwt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gsub" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="bwt" name="BWT" stroke="#2563EB" strokeWidth={2} fill="url(#gbwt)" />
              <Area type="monotone" dataKey="subcontratado" name="Subcontratado" stroke="#7C3AED" strokeWidth={2} fill="url(#gsub)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* EBITDA Pie */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-foreground text-sm">EBITDA por Origem</h2>
            <p className="text-xs text-muted-foreground">Distribuição consolidada</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={ebitdaData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {ebitdaData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={v => fmt(v)} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-foreground">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-2">
            {ebitdaData.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-muted-foreground">{d.name}</span>
                </div>
                <span className="text-xs font-semibold text-foreground">{fmt(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top rotas + frota status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Rotas */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground text-sm">Top Rotas Realizadas</h2>
          </div>
          <div className="space-y-3">
            {topRotas.map((r, i) => {
              const pct = (r.valorTotal / topRotas[0].valorTotal) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground truncate">{r.rota}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-xs text-muted-foreground">{r.viagens}v</span>
                      <span className="text-xs font-semibold text-foreground">{fmt(r.valorTotal)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Frota Quick Stats */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground text-sm">Status da Frota</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={frotaVeiculos.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="placa" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={65} />
              <Tooltip formatter={v => [`${fmtNum(v)} km`]} />
              <Bar dataKey="kmCarregado" name="KM Carregado" fill="#2563EB" stackId="a" radius={[0,0,0,0]} />
              <Bar dataKey="kmVazio" name="KM Vazio" fill="#93C5FD" stackId="a" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded bg-primary" /><span className="text-xs text-muted-foreground">Carregado</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded bg-blue-200" /><span className="text-xs text-muted-foreground">Vazio</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}