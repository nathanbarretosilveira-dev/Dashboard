import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

// @ts-ignore
const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
// @ts-ignore
const fmtNum = (v) => new Intl.NumberFormat('pt-BR').format(v ?? 0);

// @ts-ignore
const VariacaoCard = ({ label, valor1, valor2, unit = 'R$' }) => {
  const variacao = valor2 - valor1;
  const variacaoPercent = valor1 ? (variacao / valor1) * 100 : 0;
  const isPositive = variacao >= 0;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500">Anterior</p>
          <p className="font-semibold">{unit === 'R$' ? fmt(valor1) : fmtNum(valor1)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Atual</p>
          <p className="font-semibold">{unit === 'R$' ? fmt(valor2) : fmtNum(valor2)}</p>
        </div>
      </div>
      <div className={`flex items-center gap-2 p-2 rounded ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
        <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{unit === 'R$' ? fmt(variacao) : fmtNum(variacao)} ({variacaoPercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
};

export default function ComparativoPage() {
  const [meses, setMeses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMes1, setSelectedMes1] = useState('');
  const [selectedMes2, setSelectedMes2] = useState('');
  const [comparativo, setComparativo] = useState(null);
  const [comparativoLoading, setComparativoLoading] = useState(false);
  const [error, setError] = useState(null);

  // Buscar lista de meses
  useEffect(() => {
    fetchMeses();
  }, []);

  const fetchMeses = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/meses');
      const result = await response.json();
      if (result.success) {
        setMeses(result.data || []);
        if (result.data?.length >= 2) {
          setSelectedMes1(result.data[result.data.length - 1].id);
          setSelectedMes2(result.data[result.data.length - 2].id);
        }
      }
    } catch (err) {
      // @ts-ignore
      setError('Erro ao carregar meses: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Buscar comparativo quando mudar seleção
  useEffect(() => {
    if (selectedMes1 && selectedMes2 && selectedMes1 !== selectedMes2) {
      fetchComparativo();
    }
  }, [selectedMes1, selectedMes2]);

  const fetchComparativo = async () => {
    // @ts-ignore
    const m1 = meses.find((m) => m.id == selectedMes1);
    // @ts-ignore
    const m2 = meses.find((m) => m.id == selectedMes2);

    if (!m1 || !m2) return;

    setComparativoLoading(true);
    try {
      // @ts-ignore
      const response = await fetch(`http://localhost:3001/api/comparativo/${m1.mes}/${m1.ano}/${m2.mes}/${m2.ano}`);
      const result = await response.json();
      if (result.success) {
        setComparativo(result.data);
        setError(null);
      } else {
        // @ts-ignore
        setError('Erro ao carregar comparativo');
      }
    } catch (err) {
      // @ts-ignore
      setError('Erro ao carregar comparativo: ' + err.message);
    } finally {
      setComparativoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Carregando meses disponíveis...</p>
        </div>
      </div>
    );
  }

  if (meses.length < 2) {
    // Estado sem dados suficientes

    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Comparativo de Períodos</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-yellow-800">
            ⚠️ Você precisa de pelo menos 2 períodos de dados para fazer comparações. Execute o script de importação em diferentes meses para ativar esse recurso.
          </p>
        </div>
      </div>
    );
  }

  if (error && !comparativo) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Comparativo de Períodos</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  const chartData = comparativo ? [
    {
      // @ts-ignore
      name: comparativo.periodo1,
      // @ts-ignore
      ebitdaBWT: comparativo.kpiGeral.ebitdaBWT.p1,
      // @ts-ignore
      ebitdaSub: comparativo.kpiGeral.ebitdaSubcontratado.p1,
      // @ts-ignore
      resultado: comparativo.kpiGeral.resultadoTotal.p1,
    },
    {
      // @ts-ignore
      name: comparativo.periodo2,
      // @ts-ignore
      ebitdaBWT: comparativo.kpiGeral.ebitdaBWT.p2,
      // @ts-ignore
      ebitdaSub: comparativo.kpiGeral.ebitdaSubcontratado.p2,
      // @ts-ignore
      resultado: comparativo.kpiGeral.resultadoTotal.p2,
    },
  ] : [];

  // @ts-ignore
  const COLORS = ['#2563EB', '#7C3AED', '#059669'];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Comparativo de Períodos</h1>
        <p className="text-gray-600">Compare KPIs e métricas entre diferentes meses/períodos</p>
      </div>

      {/* Seletor de Meses */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Selecionar Períodos para Comparação
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Período Anterior</label>
            <select
              value={selectedMes1}
              onChange={(e) => setSelectedMes1(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {meses.map((m) => (
                <option key={m.
// @ts-ignore
                id} value={m.id}>
                  {m.
// @ts-ignore
                  mes}/{m.ano}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Período Atual</label>
            <select
              value={selectedMes2}
              onChange={(e) => setSelectedMes2(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {meses.map((m) => (
                <option key={m.
// @ts-ignore
                id} value={m.id}>
                  {m.
// @ts-ignore
                  mes}/{m.ano}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {comparativoLoading ? (
        <div className="flex items-center justify-center p-12">
          <p className="text-gray-500">Carregando comparativo...</p>
        </div>
      ) : comparativo ? (
        <>
          {/* KPIs Comparativos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <VariacaoCard
              label="EBITDA BWT"
              // @ts-ignore
              valor1={comparativo.kpiGeral.ebitdaBWT.p1}
              // @ts-ignore
              valor2={comparativo.kpiGeral.ebitdaBWT.p2}
            />
            <VariacaoCard
              label="EBITDA Subcontratado"
              // @ts-ignore
              valor1={comparativo.kpiGeral.ebitdaSubcontratado.p1}
              // @ts-ignore
              valor2={comparativo.kpiGeral.ebitdaSubcontratado.p2}
            />
            <VariacaoCard
              label="Resultado Total"
              // @ts-ignore
              valor1={comparativo.kpiGeral.resultadoTotal.p1}
              // @ts-ignore
              valor2={comparativo.kpiGeral.resultadoTotal.p2}
            />
          </div>

          {/* Gráfico Comparativo */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Evolução de EBITDA e Resultado</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => fmt(value)} />
                <Legend />
                <Bar dataKey="ebitdaBWT" fill="#2563EB" name="EBITDA BWT" />
                <Bar dataKey="ebitdaSub" fill="#7C3AED" name="EBITDA Subcontratado" />
                <Bar dataKey="resultado" fill="#059669" name="Resultado Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Faturamento Comparativo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Faturamento Total</h3>
              <div className="space-y-3">
                <VariacaoCard
                  label="Faturamento Total"
                  // @ts-ignore
                  valor1={comparativo.faturamentoPorDia.p1}
                  // @ts-ignore
                  valor2={comparativo.faturamentoPorDia.p2}
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Métricas de Frota</h3>
              <div className="space-y-3">
                <VariacaoCard
                  label="Quantidade de Veículos"
                  // @ts-ignore
                  valor1={comparativo.frotaMetricas.p1.count || 0}
                  // @ts-ignore
                  valor2={comparativo.frotaMetricas.p2.count || 0}
                  unit="un"
                />
                <VariacaoCard
                  label="KM Total Rodado"
                  // @ts-ignore
                  valor1={comparativo.frotaMetricas.p1.km || 0}
                  // @ts-ignore
                  valor2={comparativo.frotaMetricas.p2.km || 0}
                  unit="km"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
