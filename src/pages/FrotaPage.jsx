import { useState, useEffect } from 'react';
// @ts-ignore
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, LabelList } from 'recharts';
// @ts-ignore
import { Truck, TrendingDown, TrendingUp, Fuel, ChevronDown, ChevronUp } from 'lucide-react';
import KPICard from '../components/KPICard';
// @ts-ignore
import { frotaVeiculos, kpiGeral } from '../lib/bwtData';
import { Customized } from 'recharts';

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

  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // @ts-ignore
  const sorted = [...frotaVeiculos].sort((a, b) => Number(b[sort]) - Number(a[sort]));

  // @ts-ignore
  const CustomTickPlaca = ({ x, y, payload }) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={10}
          textAnchor="middle"
          fill="hsl(var(--foreground))"
          fontSize={10}
          fontWeight="700" // 👈 NEGRITO REAL
        >
          {payload.value}
        </text>
      </g>
    );
  };

  const chartData = [...frotaVeiculos]
    .sort((a, b) => b.ebitdaAtingido - a.ebitdaAtingido)
    .slice(0, 10)
    .map((v, i) => ({
      placa: v.placa,
      ebitda: v.ebitdaAtingido * 100,
      fundo: 100,
      ebitdaValor: v.resultado, // ✅ correto agora
      rank: i + 1,
    }));

  const getRankStyle = (/** @type {number} */ index) => {
    if (index === 0) return { label: '1º', color: '#F59E0B' }; // ouro
    if (index === 1) return { label: '2º', color: '#9CA3AF' }; // prata
    if (index === 2) return { label: '3º', color: '#CD7C2F' }; // bronze
    return null;
  };

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

  // @ts-ignore
  const renderEbitdaLabel = (props) => {
    const { x, y, width, value, index } = props;

    const medal =
      index === 0 ? '🥇' :
        index === 1 ? '🥈' :
          index === 2 ? '🥉' : '';

    return (
      <text
        x={x + width / 1.5}
        y={y - 15}
        textAnchor="middle"
        fontSize={11}
        fontWeight="600"
        fill="#111827"
      >
        {medal} {Number(value).toFixed(1)}%
      </text>
    );
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
        <KPICard title="Combustível Total" value={`${fmtNum(totalLitros)} L`} subtitle={`Média ${Math.floor((totalKm / totalLitros) * 100) / 100} km/L`} icon={Fuel} color="amber" />
      </div>

      {/* TOP Veículos */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="font-semibold text-foreground text-sm mb-4">
          Top 10 Veículos por EBITDA
        </h2>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            key={width} // 👈 AQUI ESTÁ A SOLUÇÃO
            data={chartData}
            margin={{ top: 30, right: 10, left: 0, bottom: 0 }}
            barGap={-20}
          >

            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

            <XAxis
              dataKey="placa"
              // @ts-ignore
              tick={<CustomTickPlaca />}
              interval={0}
            />

            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {

                  const data = payload.find(p => p.dataKey === 'ebitda')?.payload;

                  if (!data) return null;

                  return (
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                      <p className="text-xs text-gray-500">{label}</p>

                      <p className="text-sm font-semibold text-gray-900">
                        EBITDA: {fmt(data.ebitdaValor)}
                      </p>

                      <p className="text-xs text-gray-500">
                        ({data.ebitda.toFixed(2)}%)
                      </p>
                    </div>
                  );
                }

                return null;
              }}
            />

            {/* ⚪ FUNDO */}
            <Bar
              dataKey="fundo"
              fill="#E5E7EB"
              barSize={20}
              radius={[3, 3, 0, 0]}
            />

            {/* 🔵 VALOR REAL */}
            <Bar
              dataKey="ebitda"
              fill="#2563EB"
              barSize={20}
              radius={[3, 3, 0, 0]}
            >

              <LabelList content={renderEbitdaLabel} />
            </Bar>

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
              <option value="ebitdaAtingido">EBITDA %</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground uppercase tracking-wider text-center">
                <th className="px-4 py-3 font-semibold">Placa</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Motorista</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Rota</th>
                <th className="px-4 py-3 font-semibold">Hodômetro</th>
                <th className="px-4 py-3 font-semibold">Faturamento</th>
                <th className="px-4 py-3 font-semibold">EBITDA %</th>
                <th className="px-4 py-3 font-semibold">Resultado</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">KM/L</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((v,
                // @ts-ignore
                i) => (
                <>
                  <tr
                    key={v.placa}
                    className="hover:bg-muted/30 cursor-pointer transition-colors text-center"
                    // @ts-ignore
                    onClick={() => setExpandedRow(expandedRow === v.placa ? null : v.placa)}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-foreground">
                      {v.placa}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {v.motorista}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                        {v.rota}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {fmtNum(v.hodometro)} km
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {v.faturamento > 0 ? fmt(v.faturamento) : <span className="text-muted-foreground">—</span>}
                    </td>

                    <td className={`px-4 py-3 font-semibold ${ebitdaColor(v.ebitdaAtingido)}`}>
                      {(v.ebitdaAtingido * 100).toFixed(2)}%
                    </td>

                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full font-semibold ${statusColor(v.resultado)}`}>
                        {fmt(v.resultado)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {v.kmL.toFixed(2)}
                    </td>

                    <td className="px-4 py-3">
                      {expandedRow === v.placa
                        ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground mx-auto" />
                        : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground mx-auto" />}
                    </td>
                  </tr>
                  {expandedRow === v.placa && (
                    <tr key={`${v.placa}-detail`} className="bg-muted/20 text-center">
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
                            <p className="text-xs text-muted-foreground">Consumo</p>
                            <p className="text-sm font-semibold text-foreground mt-1">{v.kmL.toFixed(2)} km/L</p>
                          </div>
                          <div className="bg-card rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground">Margem</p>
                            <p className="text-sm font-semibold text-foreground mt-1">{v.margem != null ? `${(v.margem * 100).toFixed(2)}%` : '—'}</p>
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