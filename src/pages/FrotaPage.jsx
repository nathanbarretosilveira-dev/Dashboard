import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Truck, TrendingDown, TrendingUp, Fuel, ChevronDown, ChevronUp } from 'lucide-react';
import KPICard from '../components/KPICard';
import { frotaVeiculos, kpiGeral } from '../lib/bwtData';

// @ts-ignore
const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
// @ts-ignore
const fmtNum = (v) => new Intl.NumberFormat('pt-BR').format(v);

const totalKm = frotaVeiculos.reduce((s, v) => s + v.hodometro, 0);
const totalFat = frotaVeiculos.reduce((s, v) => s + v.faturamento, 0);
const totalLitros = frotaVeiculos.reduce((s, v) => s + v.litros, 0);
const veiculosAtivos = frotaVeiculos.filter(v => v.kmCarregado > 0).length;

export default function FrotaPage() {
  const [sort, setSort] = useState('resultado');
  // @ts-ignore
  const [expandedRow, setExpandedRow] = useState(null);

  // @ts-ignore
  const sorted = [...frotaVeiculos].sort((a, b) => Number(b[sort]) - Number(a[sort]));

  const chartData = frotaVeiculos.slice(0, 10).map(v => ({
    placa: v.placa,
    carregado: v.kmCarregado,
    vazio: v.kmVazio,
  }));

  // @ts-ignore
  const statusColor = (resultado) => {
    if (resultado > 0) return 'text-emerald-600 bg-emerald-50';
    if (resultado > -10000) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  // @ts-ignore
  const ebitdaColor = (v) => {
    if (v > 0) return 'text-emerald-600';
    if (v > -0.3) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performance da Frota</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Análise individual por veículo · Abril 2026</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="Total KM Rodados" value={fmtNum(totalKm)} subtitle="Frota completa" icon={Truck} color="blue" />
        <KPICard title="Veículos Ativos" value={`${veiculosAtivos}/${frotaVeiculos.length}`} subtitle="Com KM carregado" icon={Truck} color="green" />
        <KPICard title="Faturamento Frota" value={fmt(totalFat)} subtitle="BWT próprio" icon={TrendingUp} color="navy" />
        <KPICard title="Combustível Total" value={`${fmtNum(totalLitros)} L`} subtitle={`Média ${(totalKm/totalLitros)} km/L`} icon={Fuel} color="amber" />
      </div>

      {/* KM chart */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="font-semibold text-foreground text-sm mb-4">KM Carregado vs Vazio por Veículo</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="placa" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v/1000)}k`} />
            <Tooltip formatter={(v) => [`${fmtNum(Number(v))} km`]} />
            <Bar dataKey="carregado" name="Carregado" fill="#2563EB" stackId="a" />
            <Bar dataKey="vazio" name="Vazio" fill="#BFDBFE" stackId="a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela detalhada */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm">Detalhamento por Veículo</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Ordenar:</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="resultado">Resultado</option>
              <option value="faturamento">Faturamento</option>
              <option value="hodometro">KM Total</option>
              <option value="kmL">KM/L</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">Placa</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Motorista</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Rota</th>
                <th className="text-right px-4 py-3 font-semibold">Hodômetro</th>
                <th className="text-right px-4 py-3 font-semibold">Faturamento</th>
                <th className="text-right px-4 py-3 font-semibold">EBITDA %</th>
                <th className="text-right px-4 py-3 font-semibold">Resultado</th>
                <th className="text-right px-4 py-3 font-semibold hidden lg:table-cell">KM/L</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((v, i) => (
                <>
                  <tr
                    key={v.placa}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    // @ts-ignore
                    onClick={() => setExpandedRow(expandedRow === v.placa ? null : v.placa)}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-foreground">{v.placa}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell truncate max-w-[140px]">{v.motorista}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{v.rota}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{fmtNum(v.hodometro)} km</td>
                    <td className="px-4 py-3 text-right font-medium">{v.faturamento > 0 ? fmt(v.faturamento) : <span className="text-muted-foreground">—</span>}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${ebitdaColor(v.ebitdaAtingido)}`}>
                      {(v.ebitdaAtingido * 100)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-1 rounded-full font-semibold ${statusColor(v.resultado)}`}>
                        {fmt(v.resultado)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">{v.kmL.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      {expandedRow === v.placa ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </td>
                  </tr>
                  {expandedRow === v.placa && (
                    <tr key={`${v.placa}-detail`} className="bg-muted/20">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-card rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground">Modelo</p>
                            <p className="text-sm font-semibold text-foreground mt-1">{v.modelo}</p>
                          </div>
                          <div className="bg-card rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground">KM Carregado</p>
                            <p className="text-sm font-semibold text-foreground mt-1">{fmtNum(v.kmCarregado)} km</p>
                          </div>
                          <div className="bg-card rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground">KM Vazio</p>
                            <p className="text-sm font-semibold text-foreground mt-1">{fmtNum(v.kmVazio)} km</p>
                          </div>
                          <div className="bg-card rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground">Litros Consumidos</p>
                            <p className="text-sm font-semibold text-foreground mt-1">{fmtNum(v.litros)} L</p>
                          </div>
                          <div className="bg-card rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground">EBITDA Estimado</p>
                            <p className="text-sm font-semibold text-foreground mt-1">{fmt(v.ebitdaEstimado)}</p>
                          </div>
                          <div className="bg-card rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground">Ano do Veículo</p>
                            <p className="text-sm font-semibold text-foreground mt-1">{v.ano}</p>
                          </div>
                          <div className="bg-card rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground">Eficiência</p>
                            <p className="text-sm font-semibold text-foreground mt-1">{v.kmL.toFixed(2)} km/L</p>
                          </div>
                          <div className="bg-card rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground">Margem</p>
                            <p className="text-sm font-semibold text-foreground mt-1">{v.margem != null ? `${v.margem}%` : '—'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}