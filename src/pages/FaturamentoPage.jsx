import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  // @ts-ignore
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
// @ts-ignore
import { FileText, Search, Building2, Weight, DollarSign } from 'lucide-react';
import KPICard from '../components/KPICard';
import { useMonthData } from '../lib/MonthDataContext';

// @ts-ignore
const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
// @ts-ignore
const fmtNum = (v) => new Intl.NumberFormat('pt-BR').format(v);

// @ts-ignore
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {/* @ts-ignore */}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
};

export default function FaturamentoPage() {
  const { data, periodoLabel } = useMonthData();
  const faturamentoData = data.faturamentoData || [];
  const rotasRealizadas = data.rotasRealizadas || [];
  const totalFat = faturamentoData.reduce((s, d) => s + (d.valorTotal || 0), 0);
  const totalVolume = faturamentoData.reduce((s, d) => s + (d.quantidade || 0), 0);
  const totalPedagio = faturamentoData.reduce((s, d) => s + (d.pedagio || 0), 0);
  const bwtFat = faturamentoData.filter(d => d.empresa === "BWT").reduce((s, d) => s + (d.valorTotal || 0), 0);
  const subFat = faturamentoData.filter(d => d.empresa === "SUBCONTRATADO").reduce((s, d) => s + (d.valorTotal || 0), 0);
  const empresaPie = [{ name: "BWT", value: bwtFat, color: "#2563EB" },{ name: "Subcontratado", value: subFat, color: "#7C3AED" }];
  const [search, setSearch] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('Todos');
  const [currentDayIndex, setCurrentDayIndex] = useState(0);


  if (!faturamentoData.length) {
    return <div className="p-4 lg:p-6"><h1 className="text-2xl font-bold text-foreground">Faturamento</h1><p className="text-sm text-muted-foreground mt-2">Sem dados para este mês selecionado.</p></div>;
  }

  // Extrair dias únicos dos dados
  const diasUnicos = [...new Set(faturamentoData.map(d => String(d.data || '').split('/')[0]).filter(Boolean))].sort((a, b) => parseInt(a) - parseInt(b));

  // Filtrar por dia selecionado
  const diaAtual = diasUnicos[currentDayIndex] || '';

  const filtered = faturamentoData.filter(d => {
    const searchTerm = search.toLowerCase();
    const matchSearch = !search || String(d.motorista || '').toLowerCase().includes(searchTerm) || String(d.rota || '').toLowerCase().includes(searchTerm) || String(d.tomador || '').toLowerCase().includes(searchTerm) || String(d.cte || '').includes(search) || String(d.placa || '').toLowerCase().includes(searchTerm);
    const matchEmpresa = filterEmpresa === 'Todos' || d.empresa === filterEmpresa;
    const dia = String(d.data || '').split('/')[0];
    const matchDia = dia === diaAtual;
    return matchSearch && matchEmpresa && matchDia;
  });

  // Navegação de dias
  const goToPreviousDay = () => {
    if (currentDayIndex > 0) {
      setCurrentDayIndex(currentDayIndex - 1);
      setSearch('');
    }
  };

  const goToNextDay = () => {
    if (currentDayIndex < diasUnicos.length - 1) {
      setCurrentDayIndex(currentDayIndex + 1);
      setSearch('');
    }
  };

  // @ts-ignore
  const CustomYAxisTick = ({ x, y, payload }) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={-10} // 👈 leve ajuste só
          y={0}
          dy={4}
          textAnchor="end"
          fill="hsl(var(--muted-foreground))"
          fontSize={10}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Faturamento</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Conhecimentos de transporte emitidos · {periodoLabel}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="Faturamento Total" value={fmt(totalFat)} subtitle={`${faturamentoData.length} CTes emitidos`} icon={DollarSign} color="blue" />
        <KPICard title="BWT" value={fmt(bwtFat)} subtitle={`${faturamentoData.filter(d => d.empresa === 'BWT').length} CTes`} icon={Building2} color="green" />
        <KPICard title="Subcontratado" value={fmt(subFat)} subtitle={`${faturamentoData.filter(d => d.empresa === 'SUBCONTRATADO').length} CTes`} icon={Building2} color="purple" />
        <KPICard title="Volume Transportado" value={`${fmtNum(Math.round(totalVolume / 1000))} m³`} subtitle={`Pedágios destacadas: ${fmt(totalPedagio)}`} icon={Weight} color="amber" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground text-sm mb-4">Faturamento por Rota (Top 8)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={rotasRealizadas.slice(0, 10)}
              layout="vertical"
              margin={{ left: 10, right: 50, top: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />

              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={v => `${(v / 1000)}k`}
              />

              <YAxis
                type="category"
                dataKey="rota"
                width={240}
                // @ts-ignore
                tick={<CustomYAxisTick />}
                interval={0}
              />

              <Tooltip content={<
                // @ts-ignore
                CustomTooltip />} />

              <Bar
                dataKey="valorTotal"
                name="Valor Total"
                fill="#2563EB"
                radius={[0, 4, 4, 0]}
              >

                <LabelList
                  dataKey="viagens"
                  content={({ x, y, width, height, value }) => {
                    if (!value) return null;

                    return (
                      <text
                        // @ts-ignore
                        x={x + width - 6} // 👈 encosta na direita com um pequeno padding
                        // @ts-ignore
                        y={y + height / 2}
                        dy={4}
                        textAnchor="end" // 👈 alinhamento à direita
                        fill="#FFFFFF"
                        fontSize={11}
                        fontWeight="600"
                      >
                        {`${value} viagens`}
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground text-sm mb-4">BWT vs Subcontratado</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={empresaPie} cx="50%" cy="50%" outerRadius={70} dataKey="value" paddingAngle={3}>
                {empresaPie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={v => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {empresaPie.map((e, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                  <span className="text-xs text-muted-foreground">{e.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-foreground">{fmt(e.value)}</p>
                  <p className="text-xs text-muted-foreground">{totalFat ? ((e.value / totalFat) * 100).toFixed(2) : '0.00'}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="mb-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousDay}
                disabled={currentDayIndex === 0}
                className="px-3 py-1 text-xs border border-border rounded-lg bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Dia Anterior
              </button>
              <span className="px-3 py-1 text-sm font-semibold text-foreground">
                Dia {diaAtual} · {periodoLabel}
              </span>
              <button
                onClick={goToNextDay}
                disabled={currentDayIndex === diasUnicos.length - 1}
                className="px-3 py-1 text-xs border border-border rounded-lg bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Próxima Dia →
              </button>
            </div>
            <select
              value={filterEmpresa}
              onChange={e => setFilterEmpresa(e.target.value)}
              className="text-xs border border-border rounded-lg px-2 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option>Todos</option>
              <option>BWT</option>
              <option>SUBCONTRATADO</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <h2 className="font-semibold text-foreground text-sm">CTes do Dia {diaAtual || "--"}</h2>
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground uppercase tracking-wider text-center">
                <th className="px-4 py-3 font-semibold text-center">CTe</th>
                <th className="px-4 py-3 font-semibold text-center">Data</th>
                <th className="px-4 py-3 font-semibold text-center">Placa</th>
                <th className="px-4 py-3 font-semibold text-center">Motorista</th>
                <th className="px-4 py-3 font-semibold text-center">Rota</th>
                <th className="px-4 py-3 font-semibold text-center">Tomador</th>
                <th className="px-4 py-3 font-semibold text-center">Qtd (L)</th>
                <th className="px-4 py-3 font-semibold text-center">Valor Total</th>
                <th className="px-4 py-3 font-semibold text-center">Pedágio</th>
                <th className="px-4 py-3 font-semibold text-center">Empresa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((d, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors text-center">
                  <td className="px-4 py-3 font-mono font-semibold text-primary">{d.cte}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.data}</td>
                  <td className="px-4 py-3 font-mono font-medium text-blue-600">{d.placa}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.motorista}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-muted rounded-full text-xs font-medium">{d.rota}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{d.tomador}</td>
                  <td className="px-4 py-3 text-center">{fmtNum(d.quantidade)}</td>
                  <td className="px-4 py-3 text-center font-semibold text-foreground">{fmt(d.valorTotal)}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    {d.pedagio > 0 ? fmt(d.pedagio) : 'TAG'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${d.empresa === 'BWT' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                      {d.empresa}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">Nenhum registro encontrado para este dia.</div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">{filtered.length} CTes emitidos · Total: <strong className="text-foreground">{fmt(filtered.reduce((s, d) => s + d.valorTotal, 0))}</strong></p>
        </div>
      </div>
    </div>
  );
}