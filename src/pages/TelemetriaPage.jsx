import { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Activity, Fuel, Clock, TrendingUp, Search } from 'lucide-react';
import KPICard from '../components/KPICard';
import { telemetriaData } from '../lib/bwtData';

// @ts-ignore
const fmtNum = (v) => new Intl.NumberFormat('pt-BR').format(v);

const avgMedia = telemetriaData.reduce((s, d) => s + d.media, 0) / telemetriaData.length;
const avgMotorParado = telemetriaData.reduce((s, d) => s + d.motorParado, 0) / telemetriaData.length;
const totalKm = telemetriaData.reduce((s, d) => s + d.kmRodado, 0);
const totalLitros = telemetriaData.reduce((s, d) => s + d.litros, 0);

const faixaColors = {
  faixaVerde: '#10B981',
  faixaAzul: '#3B82F6',
  faixaAmarela: '#F59E0B',
  faixaVermelha: '#EF4444',
};

const faixaLabels = {
  faixaVerde: 'Verde (Ideal)',
  faixaAzul: 'Azul (Boa)',
  faixaAmarela: 'Amarela (Atenção)',
  faixaVermelha: 'Vermelha (Crítico)',
};

// @ts-ignore
const mediaScore = (m) => {
  if (m >= 1.8) return { label: 'Excelente', color: 'text-emerald-600 bg-emerald-50' };
  if (m >= 1.6) return { label: 'Bom', color: 'text-blue-600 bg-blue-50' };
  if (m >= 1.4) return { label: 'Regular', color: 'text-amber-600 bg-amber-50' };
  return { label: 'Baixo', color: 'text-red-600 bg-red-50' };
};

const faixaChart = telemetriaData.slice(0, 10).map(d => ({
  name: d.motorista.split(' ')[0],
  verde: d.faixaVerde,
  azul: d.faixaAzul,
  amarela: d.faixaAmarela,
  vermelha: d.faixaVermelha,
}));

// @ts-ignore
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {/* @ts-ignore */}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill }}>{p.name}: {p.value}h</p>
      ))}
    </div>
  );
};

export default function TelemetriaPage() {
  const [search, setSearch] = useState('');

  const filtered = telemetriaData.filter(d =>
    !search || d.motorista.toLowerCase().includes(search.toLowerCase()) || d.placa.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Telemetria Sighra</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Desempenho de condutores e eficiência de frota · Abril 2026</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="KM Total Rastreado" value={fmtNum(totalKm)} subtitle={`${telemetriaData.length} veículos`} icon={Activity} color="blue" />
        <KPICard title="Média Frota km/L" value={avgMedia.toFixed(2)} subtitle="Consumo médio" icon={Fuel} color="green" />
        <KPICard title="Combustível Total" value={`${fmtNum(totalLitros)} L`} subtitle="Consumo total" icon={Fuel} color="amber" />
        <KPICard title="Motor Parado (Média)" value={`${avgMotorParado}h`} subtitle="Por veículo" icon={Clock} color="red" />
      </div>

      {/* Faixa chart */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="mb-4">
          <h2 className="font-semibold text-foreground text-sm">Tempo por Faixa de Condução (horas)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Verde = econômico · Vermelho = agressivo</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={faixaChart} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            {/* @ts-ignore */}
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="verde" name="Verde" fill="#10B981" stackId="a" />
            <Bar dataKey="azul" name="Azul" fill="#3B82F6" stackId="a" />
            <Bar dataKey="amarela" name="Amarela" fill="#F59E0B" stackId="a" />
            <Bar dataKey="vermelha" name="Vermelha" fill="#EF4444" stackId="a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3">
          {Object.entries(faixaColors).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              {/* @ts-ignore */}
              <span className="text-xs text-muted-foreground">{faixaLabels[key]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Driver table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between gap-3">
          <h2 className="font-semibold text-foreground text-sm">Ranking de Motoristas</h2>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar motorista..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">#</th>
                <th className="text-left px-4 py-3 font-semibold">Motorista</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Placa</th>
                <th className="text-right px-4 py-3 font-semibold">KM Rodado</th>
                <th className="text-right px-4 py-3 font-semibold">Consumo (L)</th>
                <th className="text-right px-4 py-3 font-semibold">km/L</th>
                <th className="text-right px-4 py-3 font-semibold hidden lg:table-cell">Motor Parado</th>
                <th className="text-right px-4 py-3 font-semibold hidden lg:table-cell">Faixa Verde</th>
                <th className="text-center px-4 py-3 font-semibold">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...filtered].sort((a, b) => b.media - a.media).map((d, i) => {
                const score = mediaScore(d.media);
                return (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-muted-foreground">#{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{d.motorista}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground hidden md:table-cell">{d.placa}</td>
                    <td className="px-4 py-3 text-right">{fmtNum(d.kmRodado)} km</td>
                    <td className="px-4 py-3 text-right">{fmtNum(d.litros)} L</td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">{d.media.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">{d.motorParado}h</td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (d.faixaVerde / (d.faixaVerde + d.faixaAmarela + d.faixaVermelha + d.faixaAzul)) * 100)}%` }} />
                        </div>
                        <span>{d.faixaVerde}h</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${score.color}`}>
                        {score.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}