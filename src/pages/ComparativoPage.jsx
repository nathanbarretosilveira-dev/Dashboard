import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Truck,
  DollarSign,
  Activity,
  Fuel,
  Filter,
  BarChart3,
  Gauge,
  Target,
  Route,
} from 'lucide-react';
import { Bar, ComposedChart, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL =
  // @ts-ignore
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001/api';

const ALL_PLACAS = '__all__';

// @ts-ignore
const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(v || 0));

// @ts-ignore
const fmtNum = (v) => new Intl.NumberFormat('pt-BR').format(Number(v || 0));

// @ts-ignore
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// @ts-ignore
const pct = (v) => `${toNumber(v).toFixed(2)}%`;

// @ts-ignore
const monthLabel = (mes, ano) => `${String(mes).padStart(2, '0')}/${ano}`;

// @ts-ignore
const getVariation = (valor1, valor2) => {
  const anterior = toNumber(valor1);
  const atual = toNumber(valor2);
  const variacao = atual - anterior;
  const variacaoPercent = anterior ? (variacao / anterior) * 100 : 0;

  return {
    anterior,
    atual,
    variacao,
    variacaoPercent,
    isPositive: variacao >= 0,
  };
};

// @ts-ignore
const formatByUnit = (value, unit = 'R$') => {
  if (unit === 'R$') return fmt(value);
  if (unit === '%') return pct(value);
  if (unit === 'km/L') return `${toNumber(value).toFixed(2)} km/L`;
  if (unit === 'km') return `${fmtNum(value)} km`;
  if (unit === 'L') return `${fmtNum(value)} L`;
  return fmtNum(value);
};

// @ts-ignore
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 text-xs shadow-lg">
      <p className="mb-2 font-bold text-gray-900">{label}</p>

      {payload.map((
        // @ts-ignore
        item, index) => {
        const name = item.name;
        const value = item.value;

        let formatted = fmt(value);

        if (name?.includes('%')) formatted = pct(value);
        if (name?.includes('KM/L')) formatted = `${toNumber(value).toFixed(2)} km/L`;
        if (name?.includes('KM')) formatted = `${fmtNum(value)} km`;
        if (name?.includes('Litros')) formatted = `${fmtNum(value)} L`;

        return (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="font-medium" style={{ color: item.color }}>
              {name}
            </span>
            <span className="font-semibold text-gray-800">{formatted}</span>
          </div>
        );
      })}
    </div>
  );
};

const VariacaoCard = ({
  // @ts-ignore
  label,
  // @ts-ignore
  valor1,
  // @ts-ignore
  valor2,
  unit = 'R$',
  icon: Icon = TrendingUp,
  color = 'blue',
}) => {
  const { anterior, atual, variacao, variacaoPercent, isPositive } = getVariation(
    valor1,
    valor2
  );

  const colorClasses = {
    blue: 'from-blue-50 to-blue-100/40 border-blue-100 text-blue-700',
    green: 'from-emerald-50 to-emerald-100/40 border-emerald-100 text-emerald-700',
    purple: 'from-purple-50 to-purple-100/40 border-purple-100 text-purple-700',
    amber: 'from-amber-50 to-amber-100/40 border-amber-100 text-amber-700',
    navy: 'from-slate-50 to-slate-100/50 border-slate-200 text-slate-700',
    red: 'from-red-50 to-red-100/40 border-red-100 text-red-700',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${
        // @ts-ignore
        colorClasses[color] || colorClasses.blue
        }`}
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/40" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-70">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatByUnit(atual, unit)}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Anterior: {formatByUnit(anterior, unit)}
          </p>
        </div>

        <div className="rounded-xl bg-white/70 p-2 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div
        className={`relative mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}
      >
        {isPositive ? (
          <TrendingUp className="h-3.5 w-3.5" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5" />
        )}

        {isPositive ? '+' : ''}
        {unit === 'R$' ? fmt(variacao) : formatByUnit(variacao, unit)}

        <span>({variacaoPercent.toFixed(2)}%)</span>
      </div>
    </div>
  );
};

const SimpleKpiCard = ({
  // @ts-ignore
  label,
  // @ts-ignore
  value,
  // @ts-ignore
  subtitle,
  icon: Icon = Activity,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    navy: 'bg-slate-50 text-slate-700 border-slate-200',
    red: 'bg-red-50 text-red-700 border-red-100',
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>

        <div className={`rounded-xl border p-2 ${
          // @ts-ignore
          colorClasses[color] || colorClasses.blue}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const InsightCard = ({
  // @ts-ignore
  title,
  // @ts-ignore
  value,
  // @ts-ignore
  description,
  icon: Icon = Activity,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    navy: 'bg-slate-50 text-slate-700 border-slate-200',
    red: 'bg-red-50 text-red-700 border-red-100',
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex gap-3">
        <div className={`h-fit rounded-xl border p-2 ${
          // @ts-ignore
          colorClasses[color] || colorClasses.blue}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default function ComparativoPage() {
  // @ts-ignore
  const [meses, setMeses] = useState([]);
  // @ts-ignore
  const [loading, setLoading] = useState(true);

  // @ts-ignore
  const [viewMode, setViewMode] = useState('ano');

  // @ts-ignore
  const [selectedAno, setSelectedAno] = useState('');
  // @ts-ignore
  const [selectedMesMensal, setSelectedMesMensal] = useState('');
  // @ts-ignore
  const [selectedMes1, setSelectedMes1] = useState('');
  // @ts-ignore
  const [selectedMes2, setSelectedMes2] = useState('');

  // @ts-ignore
  const [comparativo, setComparativo] = useState(null);
  // @ts-ignore
  const [comparativoLoading, setComparativoLoading] = useState(false);

  // @ts-ignore
  const [dadosMensais, setDadosMensais] = useState(null);
  // @ts-ignore
  const [dadosMensaisLoading, setDadosMensaisLoading] = useState(false);

  // @ts-ignore
  const [faturamentoMensal, setFaturamentoMensal] = useState([]);
  // @ts-ignore
  const [faturamentoMensalLoading, setFaturamentoMensalLoading] = useState(false);

  // @ts-ignore
  const [error, setError] = useState(null);
  // @ts-ignore
  const [selectedPlaca, setSelectedPlaca] = useState(ALL_PLACAS);

  // @ts-ignore
  useEffect(() => {
    const fetchMeses = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/meses`);
        const result = await response.json();

        if (result.success) {
          const mesesData = result.data || [];
          setMeses(mesesData);

          if (mesesData.length > 0) {
            // @ts-ignore
            const anos = Array.from(new Set(mesesData.map((m) => Number(m.ano)))).sort(
              (a, b) => b - a
            );

            const anoMaisRecente = anos[0];
            setSelectedAno(String(anoMaisRecente));

            const mesesDoAno = mesesData
              // @ts-ignore
              .filter((m) => Number(m.ano) === Number(anoMaisRecente))
              // @ts-ignore
              .sort((a, b) => Number(a.mes) - Number(b.mes));

            const ultimoMes = mesesDoAno[mesesDoAno.length - 1];

            if (ultimoMes) {
              setSelectedMesMensal(String(ultimoMes.id));
            }

            if (mesesData.length >= 2) {
              const ordenadosAsc = [...mesesData].sort((a, b) => {
                if (Number(a.ano) !== Number(b.ano)) return Number(a.ano) - Number(b.ano);
                return Number(a.mes) - Number(b.mes);
              });

              setSelectedMes1(String(ordenadosAsc[ordenadosAsc.length - 2].id));
              setSelectedMes2(String(ordenadosAsc[ordenadosAsc.length - 1].id));
            }
          }
        } else {
          // @ts-ignore
          setError('Erro ao carregar meses disponíveis.');
        }
      } catch (err) {
        // @ts-ignore
        setError(`Erro ao carregar meses: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMeses();
  }, []);

  // @ts-ignore
  useEffect(() => {
    const fetchFaturamentoMensal = async () => {
      if (!selectedAno) return;

      setFaturamentoMensalLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/faturamento-mensal/${selectedAno}`);
        const result = await response.json();

        if (result.success) {
          setFaturamentoMensal(result.data || []);
        } else {
          setFaturamentoMensal([]);
        }
      } catch (err) {
        console.error('Erro ao carregar faturamento mensal:', err);
        setFaturamentoMensal([]);
      } finally {
        setFaturamentoMensalLoading(false);
      }
    };

    if (viewMode === 'ano' && selectedAno) {
      fetchFaturamentoMensal();
    }
  }, [viewMode, selectedAno]);

  // @ts-ignore
  useEffect(() => {
    const fetchDadosMensais = async () => {
      // @ts-ignore
      const mesSelecionado = meses.find((m) => String(m.id) === String(selectedMesMensal));
      if (!mesSelecionado) return;

      setDadosMensaisLoading(true);

      try {
        const response = await fetch(
          // @ts-ignore
          `${API_BASE_URL}/mes/${mesSelecionado.mes}/${mesSelecionado.ano}`
        );

        const result = await response.json();

        if (result.success) {
          setDadosMensais(result.data);
          setError(null);
        } else {
          setDadosMensais(null);
          // @ts-ignore
          setError('Erro ao carregar dados mensais.');
        }
      } catch (err) {
        setDadosMensais(null);
        // @ts-ignore
        setError(`Erro ao carregar dados mensais: ${err.message}`);
      } finally {
        setDadosMensaisLoading(false);
      }
    };

    if (viewMode === 'mensal' && selectedMesMensal) {
      fetchDadosMensais();
    }
  }, [viewMode, selectedMesMensal, meses]);

  // @ts-ignore
  useEffect(() => {
    const fetchComparativo = async () => {
      // @ts-ignore
      const m1 = meses.find((m) => String(m.id) === String(selectedMes1));
      // @ts-ignore
      const m2 = meses.find((m) => String(m.id) === String(selectedMes2));

      if (!m1 || !m2) return;

      setComparativoLoading(true);

      try {
        const response = await fetch(
          // @ts-ignore
          `${API_BASE_URL}/comparativo/${m1.mes}/${m1.ano}/${m2.mes}/${m2.ano}`
        );

        const result = await response.json();

        if (result.success) {
          setComparativo(result.data);
          setError(null);
        } else {
          setComparativo(null);
          // @ts-ignore
          setError('Erro ao carregar comparativo.');
        }
      } catch (err) {
        setComparativo(null);
        // @ts-ignore
        setError(`Erro ao carregar comparativo: ${err.message}`);
      } finally {
        setComparativoLoading(false);
      }
    };

    if (
      viewMode === 'comparativo' &&
      selectedMes1 &&
      selectedMes2 &&
      selectedMes1 !== selectedMes2 &&
      meses.length > 0
    ) {
      fetchComparativo();
    }
  }, [viewMode, selectedMes1, selectedMes2, meses]);

  // @ts-ignore
  const anosDisponiveis = useMemo(() => {
    // @ts-ignore
    return Array.from(new Set(meses.map((m) => Number(m.ano))))
      .filter(Boolean)
      .sort((a, b) => b - a);
  }, [meses]);

  // @ts-ignore
  const mesesDoAnoSelecionado = useMemo(() => {
    return meses
      // @ts-ignore
      .filter((m) => Number(m.ano) === Number(selectedAno))
      // @ts-ignore
      .sort((a, b) => Number(a.mes) - Number(b.mes));
  }, [meses, selectedAno]);

  // @ts-ignore
  const faturamentoMensalChartData = useMemo(() => {
    if (!faturamentoMensal.length) return [];

    const dadosOrdenados = [...faturamentoMensal]
      .map((item) => ({
        // @ts-ignore
        mes: Number(item.mes),
        // @ts-ignore
        ano: Number(item.ano),
        // @ts-ignore
        periodo: item.periodo || monthLabel(item.mes, item.ano),
        // @ts-ignore
        faturamento: toNumber(item.faturamento),
        // @ts-ignore
        ebitdaBWT: toNumber(item.ebitdaBWT),
        // @ts-ignore
        ebitdaSubcontratado: toNumber(item.ebitdaSubcontratado),
        // @ts-ignore
        resultadoTotal: toNumber(item.resultadoTotal),
      }))
      .sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.mes - b.mes;
      });

    let acumulado = 0;

    const dadosComAcumulado = dadosOrdenados.map((item, index) => {
      acumulado += item.faturamento;

      return {
        ...item,
        index: index + 1,
        acumulado,
      };
    });

    const n = dadosComAcumulado.length;

    if (n < 2) {
      return dadosComAcumulado.map((item) => ({
        ...item,
        tendenciaAcumulado: item.acumulado,
      }));
    }

    const somaX = dadosComAcumulado.reduce((s, item) => s + item.index, 0);
    const somaY = dadosComAcumulado.reduce((s, item) => s + item.acumulado, 0);
    const somaXY = dadosComAcumulado.reduce(
      (s, item) => s + item.index * item.acumulado,
      0
    );
    const somaX2 = dadosComAcumulado.reduce(
      (s, item) => s + item.index * item.index,
      0
    );

    const divisor = n * somaX2 - somaX * somaX;
    const inclinacao = divisor ? (n * somaXY - somaX * somaY) / divisor : 0;
    const intercepto = (somaY - inclinacao * somaX) / n;

    return dadosComAcumulado.map((item) => ({
      ...item,
      tendenciaAcumulado: intercepto + inclinacao * item.index,
    }));
  }, [faturamentoMensal]);

  // @ts-ignore
  const resumoAnual = useMemo(() => {
    const totalFaturamento = faturamentoMensalChartData.reduce(
      // @ts-ignore
      (s, d) => s + d.faturamento,
      0
    );
    const totalResultado = faturamentoMensalChartData.reduce(
      // @ts-ignore
      (s, d) => s + d.resultadoTotal,
      0
    );
    const totalEbitdaBWT = faturamentoMensalChartData.reduce(
      // @ts-ignore
      (s, d) => s + d.ebitdaBWT,
      0
    );
    const mediaMensal = faturamentoMensalChartData.length
      ? totalFaturamento / faturamentoMensalChartData.length
      : 0;

    const melhorMes = [...faturamentoMensalChartData].sort(
      (a, b) => b.faturamento - a.faturamento
    )[0];

    return {
      totalFaturamento,
      totalResultado,
      totalEbitdaBWT,
      mediaMensal,
      melhorMes,
    };
  }, [faturamentoMensalChartData]);

  // @ts-ignore
  const frotaP1 = useMemo(() => comparativo?.frotaVeiculos?.p1 || [], [comparativo]);
  // @ts-ignore
  const frotaP2 = useMemo(() => comparativo?.frotaVeiculos?.p2 || [], [comparativo]);

  // @ts-ignore
  const placasDisponiveis = useMemo(() => {
    return Array.from(
      // @ts-ignore
      new Set([...frotaP1.map((v) => v.placa), ...frotaP2.map((v) => v.placa)].filter(Boolean))
    ).sort();
  }, [frotaP1, frotaP2]);

  const isPlacaFiltrada = selectedPlaca && selectedPlaca !== ALL_PLACAS;

  // @ts-ignore
  useEffect(() => {
    if (viewMode !== 'comparativo') return;

    if (placasDisponiveis.length === 0) {
      if (selectedPlaca !== ALL_PLACAS) {
        setSelectedPlaca(ALL_PLACAS);
      }
      return;
    }

    const placaAindaExiste = placasDisponiveis.includes(selectedPlaca);

    if (selectedPlaca !== ALL_PLACAS && !placaAindaExiste) {
      setSelectedPlaca(ALL_PLACAS);
    }
  }, [viewMode, placasDisponiveis, selectedPlaca]);

  // @ts-ignore
  const placaP1 = useMemo(() => {
    if (!isPlacaFiltrada) return null;
    // @ts-ignore
    return frotaP1.find((v) => v.placa === selectedPlaca);
  }, [frotaP1, selectedPlaca, isPlacaFiltrada]);

  // @ts-ignore
  const placaP2 = useMemo(() => {
    if (!isPlacaFiltrada) return null;
    // @ts-ignore
    return frotaP2.find((v) => v.placa === selectedPlaca);
  }, [frotaP2, selectedPlaca, isPlacaFiltrada]);

  // @ts-ignore
  const chartDataComparativo = useMemo(() => {
    if (!comparativo) return [];

    if (isPlacaFiltrada) {
      return [
        {
          // @ts-ignore
          name: comparativo.periodo1,
          faturamento: toNumber(placaP1?.faturamento),
          resultado: toNumber(placaP1?.resultado),
          ebitdaPercent: toNumber(placaP1?.ebitdaAtingido) * 100,
        },
        {
          // @ts-ignore
          name: comparativo.periodo2,
          faturamento: toNumber(placaP2?.faturamento),
          resultado: toNumber(placaP2?.resultado),
          ebitdaPercent: toNumber(placaP2?.ebitdaAtingido) * 100,
        },
      ];
    }

    return [
      {
        // @ts-ignore
        name: comparativo.periodo1,
        // @ts-ignore
        ebitdaBWT: toNumber(comparativo.kpiGeral?.ebitdaBWT?.p1),
        // @ts-ignore
        ebitdaSub: toNumber(comparativo.kpiGeral?.ebitdaSubcontratado?.p1),
        // @ts-ignore
        resultado: toNumber(comparativo.kpiGeral?.resultadoTotal?.p1),
        // @ts-ignore
        faturamento: toNumber(comparativo.faturamentoPorDia?.p1),
      },
      {
        // @ts-ignore
        name: comparativo.periodo2,
        // @ts-ignore
        ebitdaBWT: toNumber(comparativo.kpiGeral?.ebitdaBWT?.p2),
        // @ts-ignore
        ebitdaSub: toNumber(comparativo.kpiGeral?.ebitdaSubcontratado?.p2),
        // @ts-ignore
        resultado: toNumber(comparativo.kpiGeral?.resultadoTotal?.p2),
        // @ts-ignore
        faturamento: toNumber(comparativo.faturamentoPorDia?.p2),
      },
    ];
  }, [comparativo, isPlacaFiltrada, placaP1, placaP2]);

  // @ts-ignore
  const placaEvolutionData = useMemo(() => {
    if (!comparativo || !isPlacaFiltrada) return [];

    return [
      {
        // @ts-ignore
        periodo: comparativo.periodo1,
        faturamento: toNumber(placaP1?.faturamento),
        resultado: toNumber(placaP1?.resultado),
        km: toNumber(placaP1?.hodometro || placaP1?.km),
        ebitda: toNumber(placaP1?.ebitdaAtingido) * 100,
        kmL: toNumber(placaP1?.kmL),
      },
      {
        // @ts-ignore
        periodo: comparativo.periodo2,
        faturamento: toNumber(placaP2?.faturamento),
        resultado: toNumber(placaP2?.resultado),
        km: toNumber(placaP2?.hodometro || placaP2?.km),
        ebitda: toNumber(placaP2?.ebitdaAtingido) * 100,
        kmL: toNumber(placaP2?.kmL),
      },
    ];
  }, [comparativo, isPlacaFiltrada, placaP1, placaP2]);

  // @ts-ignore
  const mensalFrota = useMemo(() => {
    // @ts-ignore
    const frota = dadosMensais?.frotaVeiculos || [];

    // @ts-ignore
    const faturamento = frota.reduce((s, v) => s + toNumber(v.faturamento), 0);
    // @ts-ignore
    const resultado = frota.reduce((s, v) => s + toNumber(v.resultado), 0);
    // @ts-ignore
    const km = frota.reduce((s, v) => s + toNumber(v.hodometro), 0);
    // @ts-ignore
    const litros = frota.reduce((s, v) => s + toNumber(v.litros), 0);
    const kmL = litros ? km / litros : 0;
    const margem = faturamento ? (resultado / faturamento) * 100 : 0;

    const topVeiculos = [...frota]
      .sort((a, b) => toNumber(b.resultado) - toNumber(a.resultado))
      .slice(0, 10);

    const bottomVeiculos = [...frota]
      .sort((a, b) => toNumber(a.resultado) - toNumber(b.resultado))
      .slice(0, 10);

    return {
      faturamento,
      resultado,
      km,
      litros,
      kmL,
      margem,
      topVeiculos,
      bottomVeiculos,
    };
  }, [dadosMensais]);

  // @ts-ignore
  const frotaInsights = useMemo(() => {
    if (!comparativo) return null;

    // @ts-ignore
    let p1 = comparativo.frotaMetricas?.p1 || {};
    // @ts-ignore
    let p2 = comparativo.frotaMetricas?.p2 || {};

    if (isPlacaFiltrada) {
      p1 = {
        km: toNumber(placaP1?.hodometro || placaP1?.km),
        litros: toNumber(placaP1?.litros),
        resultado: toNumber(placaP1?.resultado),
        faturamento: toNumber(placaP1?.faturamento),
      };

      p2 = {
        km: toNumber(placaP2?.hodometro || placaP2?.km),
        litros: toNumber(placaP2?.litros),
        resultado: toNumber(placaP2?.resultado),
        faturamento: toNumber(placaP2?.faturamento),
      };
    }

    const kmP1 = toNumber(p1.km);
    const kmP2 = toNumber(p2.km);

    const litrosP1 = toNumber(p1.litros);
    const litrosP2 = toNumber(p2.litros);

    const resultadoP1 = toNumber(p1.resultado);
    const resultadoP2 = toNumber(p2.resultado);

    const faturamentoP1 = toNumber(p1.faturamento);
    const faturamentoP2 = toNumber(p2.faturamento);

    const kmLP1 = litrosP1 ? kmP1 / litrosP1 : 0;
    const kmLP2 = litrosP2 ? kmP2 / litrosP2 : 0;

    const resultadoPorKmP1 = kmP1 ? resultadoP1 / kmP1 : 0;
    const resultadoPorKmP2 = kmP2 ? resultadoP2 / kmP2 : 0;

    const margemP1 = faturamentoP1 ? (resultadoP1 / faturamentoP1) * 100 : 0;
    const margemP2 = faturamentoP2 ? (resultadoP2 / faturamentoP2) * 100 : 0;

    const receitaPorKmP1 = kmP1 ? faturamentoP1 / kmP1 : 0;
    const receitaPorKmP2 = kmP2 ? faturamentoP2 / kmP2 : 0;

    return {
      kmP1,
      kmP2,
      litrosP1,
      litrosP2,
      resultadoP1,
      resultadoP2,
      faturamentoP1,
      faturamentoP2,
      kmLP1,
      kmLP2,
      resultadoPorKmP1,
      resultadoPorKmP2,
      margemP1,
      margemP2,
      receitaPorKmP1,
      receitaPorKmP2,
    };
  }, [comparativo, isPlacaFiltrada, placaP1, placaP2]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex h-96 items-center justify-center">
          <p className="text-gray-500">Carregando meses disponíveis...</p>
        </div>
      </div>
    );
  }

  if (meses.length < 1) {
    return (
      <div className="p-6">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Análise Comparativa</h1>

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800">
            ⚠️ Nenhum período foi encontrado. Execute o script de importação para ativar essa página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900">Análise Comparativa</h1>
        <p className="text-sm text-gray-500">
          Evolução mensal, análise por período e insights estratégicos de frota
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">Filtros de Análise</h2>
              <p className="text-sm text-gray-500">
                Escolha entre visão anual, mensal ou comparativo entre períodos
              </p>
            </div>
          </div>

          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode('ano')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${viewMode === 'ano'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              ANO
            </button>

            <button
              type="button"
              onClick={() => setViewMode('mensal')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${viewMode === 'mensal'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              MENSAL
            </button>

            <button
              type="button"
              onClick={() => setViewMode('comparativo')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${viewMode === 'comparativo'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              COMPARATIVO
            </button>
          </div>
        </div>

        {viewMode === 'ano' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Ano
              </label>

              <select
                value={selectedAno}
                onChange={(e) => setSelectedAno(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {anosDisponiveis.map((
// @ts-ignore
                ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {viewMode === 'mensal' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Ano
              </label>

              <select
                value={selectedAno}
                onChange={(e) => {
                  const ano = e.target.value;
                  setSelectedAno(ano);

                  // @ts-ignore
                  const mesesAno = meses
                    // @ts-ignore
                    .filter((m) => Number(m.ano) === Number(ano))
                    // @ts-ignore
                    .sort((a, b) => Number(a.mes) - Number(b.mes));

                  if (mesesAno.length > 0) {
                    setSelectedMesMensal(String(mesesAno[mesesAno.length - 1].id));
                  }
                }}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {anosDisponiveis.map((
// @ts-ignore
                ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Mês
              </label>

              <select
                value={selectedMesMensal}
                onChange={(e) => setSelectedMesMensal(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {mesesDoAnoSelecionado.map((
// @ts-ignore
                m) => (
                  <option key={m.id} value={m.id}>
                    {monthLabel(m.mes, m.ano)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {viewMode === 'comparativo' && (
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-[1fr_auto_1fr]">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Período Anterior
              </label>

              <select
                value={selectedMes1}
                onChange={(e) => setSelectedMes1(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {meses.map((
// @ts-ignore
                m) => (
                  <option key={m.
                    // @ts-ignore
                    id} value={m.id}>
                    {monthLabel(m.
                      // @ts-ignore
                      mes, m.ano)}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden h-11 items-center justify-center rounded-full bg-gray-100 px-4 text-xs font-bold text-gray-500 md:flex">
              VS
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Período Atual
              </label>

              <select
                value={selectedMes2}
                onChange={(e) => setSelectedMes2(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {meses.map((
// @ts-ignore
                m) => (
                  <option key={m.
                    // @ts-ignore
                    id} value={m.id}>
                    {monthLabel(m.
                      // @ts-ignore
                      mes, m.ano)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {viewMode === 'ano' && (
        <>
          {faturamentoMensalLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 shadow-sm">
              <p className="text-gray-500">Carregando evolução mensal...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <SimpleKpiCard
                  label="Faturamento acumulado"
                  value={fmt(resumoAnual.totalFaturamento)}
                  subtitle={`Ano ${selectedAno}`}
                  icon={DollarSign}
                  color="blue"
                />

                <SimpleKpiCard
                  label="Média mensal"
                  value={fmt(resumoAnual.mediaMensal)}
                  subtitle="Média dos meses importados"
                  icon={Activity}
                  color="green"
                />

                <SimpleKpiCard
                  label="Resultado acumulado"
                  value={fmt(resumoAnual.totalResultado)}
                  subtitle="Resultado total do ano"
                  icon={TrendingUp}
                  color="purple"
                />

                <SimpleKpiCard
                  label="Melhor mês"
                  value={resumoAnual.melhorMes?.periodo || '—'}
                  subtitle={resumoAnual.melhorMes ? fmt(resumoAnual.melhorMes.faturamento) : 'Sem dados'}
                  icon={Target}
                  color="amber"
                />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Evolução Mensal de Faturamento
                    </h2>
                    <p className="text-sm text-gray-500">
                      Faturamento mensal, acumulado e tendência do ano selecionado
                    </p>
                  </div>

                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Ano {selectedAno}
                  </div>
                </div>

                {faturamentoMensalChartData.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Nenhum dado mensal encontrado para o ano selecionado.
                  </div>
                ) : (
                  <
// @ts-ignore
                  ResponsiveContainer width="100%" height={380}>
                    <
// @ts-ignore
                    ComposedChart
                      data={faturamentoMensalChartData}
                      margin={{ top: 20, right: 25, bottom: 5, left: 0 }}
                    >
                      <defs>
                        <linearGradient id="barFaturamentoGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.85} />
                        </linearGradient>

                        <linearGradient id="acumuladoMensalGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>

                      <
// @ts-ignore
                      CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <
// @ts-ignore
                      XAxis dataKey="periodo" tick={{ fontSize: 11, fill: '#6B7280' }} />

                      <
// @ts-ignore
                      YAxis
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                        // @ts-ignore
                        tickFormatter={(v) => `R$ ${(v / 1000000).toFixed(1)}M`}
                      />

                      <
// @ts-ignore
                      Tooltip content={<
                        // @ts-ignore
                        CustomTooltip />} />
                      <
// @ts-ignore
                      Legend />

                      <
// @ts-ignore
                      Bar
                        dataKey="faturamento"
                        name="Faturamento Mensal"
                        fill="url(#barFaturamentoGradient)"
                        radius={[10, 10, 0, 0]}
                        barSize={38}
                      >
                        <
// @ts-ignore
                        LabelList
                          dataKey="faturamento"
                          position="top"
                          // @ts-ignore
                          formatter={(v) => `R$ ${(toNumber(v) / 1000000).toFixed(1)}M`}
                          style={{ fontSize: 10, fontWeight: 700, fill: '#374151' }}
                        />
                      // @ts-ignore
                      // @ts-ignore
                      // @ts-ignore
                      // @ts-ignore
                      // @ts-ignore
                      // @ts-ignore
                      // @ts-ignore
                      </Bar>

                      <
// @ts-ignore
                      Area
                        type="monotone"
                        dataKey="acumulado"
                        name="Acumulado"
                        fill="url(#acumuladoMensalGradient)"
                        stroke="#059669"
                        strokeWidth={3}
                      />

                      <
// @ts-ignore
                      Line
                        type="monotone"
                        dataKey="tendenciaAcumulado"
                        name="Tendência Acumulada"
                        stroke="#F59E0B"
                        strokeWidth={3}
                        strokeDasharray="7 7"
                        dot={false}
                      />
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    </ComposedChart>
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  </ResponsiveContainer>
                )}
              </div>
            </>
          )}
        </>
      )}

      {viewMode === 'mensal' && (
        <>
          {dadosMensaisLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 shadow-sm">
              <p className="text-gray-500">Carregando mês selecionado...</p>
            </div>
          ) : dadosMensais ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <SimpleKpiCard
                  label="Faturamento"
                  value={fmt(mensalFrota.faturamento)}
                  // @ts-ignore
                  subtitle={monthLabel(dadosMensais.mes, dadosMensais.ano)}
                  icon={DollarSign}
                  color="blue"
                />

                <SimpleKpiCard
                  label="Resultado"
                  value={fmt(mensalFrota.resultado)}
                  subtitle={`Margem ${pct(mensalFrota.margem)}`}
                  icon={TrendingUp}
                  color={mensalFrota.resultado >= 0 ? 'green' : 'red'}
                />

                <SimpleKpiCard
                  label="KM Rodado"
                  value={`${fmtNum(mensalFrota.km)} km`}
                  subtitle={`${fmtNum(mensalFrota.litros)} litros`}
                  icon={Truck}
                  color="amber"
                />

                <SimpleKpiCard
                  label="Consumo médio"
                  value={`${mensalFrota.kmL.toFixed(2)} km/L`}
                  subtitle="Eficiência operacional"
                  icon={Fuel}
                  color="navy"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-1 text-lg font-bold text-gray-900">
                    Top 10 Veículos por Resultado
                  </h2>
                  <p className="mb-5 text-sm text-gray-500">
                    Ranking dos veículos com maior contribuição no mês
                  </p>

                  <
// @ts-ignore
                  ResponsiveContainer width="100%" height={360}>
                    <
// @ts-ignore
                    ComposedChart
                      data={mensalFrota.topVeiculos}
                      layout="vertical"
                      margin={{ top: 10, right: 75, bottom: 5, left: 10 }}
                    >
                      <defs>
                        <linearGradient id="topResultadoGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity={0.85} />
                          <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.95} />
                        </linearGradient>
                      </defs>

                      <
// @ts-ignore
                      CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                      <
// @ts-ignore
                      XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#6B7280' }} />
                      <
// @ts-ignore
                      YAxis type="category" dataKey="placa" width={75} tick={{ fontSize: 11, fill: '#374151', fontWeight: 700 }} />
                      <
// @ts-ignore
                      Tooltip formatter={(v) => fmt(v)} />

                      <
// @ts-ignore
                      Bar dataKey="resultado" name="Resultado" fill="url(#topResultadoGradient)" radius={[0, 8, 8, 0]} barSize={20}>
                        <
// @ts-ignore
                        LabelList dataKey="resultado" position="right" formatter={(
                          // @ts-ignore
                          v) => fmt(v)} style={{ fontSize: 10, fontWeight: 700, fill: '#374151' }} />
                      // @ts-ignore
                      // @ts-ignore
                      // @ts-ignore
                      // @ts-ignore
                      // @ts-ignore
                      // @ts-ignore
                      // @ts-ignore
                      </Bar>
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    </ComposedChart>
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  </ResponsiveContainer>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-1 text-lg font-bold text-gray-900">
                    10 Veículos em Atenção
                  </h2>
                  <p className="mb-5 text-sm text-gray-500">
                    Veículos com menor resultado no mês selecionado
                  </p>

                  <
// @ts-ignore
                  ResponsiveContainer width="100%" height={360}>
                    <
// @ts-ignore
                    ComposedChart
                      // @ts-ignore
                      data={mensalFrota.bottomVeiculos.map((v) => ({
                        ...v,
                        resultadoVisual: Math.abs(toNumber(v.resultado)),
                      }))}
                      layout="vertical"
                      margin={{ top: 10, right: 75, bottom: 5, left: 10 }}
                    >
                      <defs>
                        <linearGradient id="bottomResultadoGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity={0.82} />
                          <stop offset="100%" stopColor="#FCA5A5" stopOpacity={0.95} />
                        </linearGradient>
                      </defs>

                      <
// @ts-ignore
                      CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                      <
// @ts-ignore
                      XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#6B7280' }} />
                      <
// @ts-ignore
                      YAxis type="category" dataKey="placa" width={75} tick={{ fontSize: 11, fill: '#374151', fontWeight: 700 }} />
                      <
// @ts-ignore
                      Tooltip formatter={(
                        // @ts-ignore
                        // @ts-ignore
                        // @ts-ignore
                        // @ts-ignore
                        // @ts-ignore
                        // @ts-ignore
                        // @ts-ignore
                        // @ts-ignore
                        v, name, props) => [fmt(props.payload.resultado), 'Resultado']} />

                      <
// @ts-ignore
                      Bar dataKey="resultadoVisual" name="Resultado" fill="url(#bottomResultadoGradient)" radius={[0, 8, 8, 0]} barSize={20}>
                        <
// @ts-ignore
                        LabelList dataKey="resultado" position="right" formatter={(
                          // @ts-ignore
                          v) => fmt(v)} style={{ fontSize: 10, fontWeight: 700, fill: '#374151' }} />
                      // @ts-ignore
                      // @ts-ignore
                      // @ts-ignore
                      // @ts-ignore
                      // @ts-ignore
                      // @ts-ignore
                      // @ts-ignore
                      </Bar>
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    </ComposedChart>
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}

      {viewMode === 'comparativo' && (
        <>
          {comparativoLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 shadow-sm">
              <p className="text-gray-500">Carregando comparativo...</p>
            </div>
          ) : comparativo ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <VariacaoCard
                  label="EBITDA BWT"
                  // @ts-ignore
                  valor1={comparativo.kpiGeral?.ebitdaBWT?.p1}
                  // @ts-ignore
                  valor2={comparativo.kpiGeral?.ebitdaBWT?.p2}
                  icon={Truck}
                  color="blue"
                />

                <VariacaoCard
                  label="EBITDA Subcontratado"
                  // @ts-ignore
                  valor1={comparativo.kpiGeral?.ebitdaSubcontratado?.p1}
                  // @ts-ignore
                  valor2={comparativo.kpiGeral?.ebitdaSubcontratado?.p2}
                  icon={Activity}
                  color="purple"
                />

                <VariacaoCard
                  label="Resultado Total"
                  // @ts-ignore
                  valor1={comparativo.kpiGeral?.resultadoTotal?.p1}
                  // @ts-ignore
                  valor2={comparativo.kpiGeral?.resultadoTotal?.p2}
                  icon={DollarSign}
                  color="green"
                />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-bold text-gray-900">
                        Comparativo Executivo
                      </h2>
                    </div>

                    <p className="text-sm text-gray-500">
                      {isPlacaFiltrada
                        ? `Faturamento, resultado e EBITDA da placa ${selectedPlaca}`
                        : 'Faturamento, EBITDA e resultado consolidado entre períodos'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {comparativo.
                        // @ts-ignore
                        periodo1} vs {comparativo.periodo2}
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                      <Filter className="h-4 w-4 text-gray-500" />

                      <select
                        value={selectedPlaca}
                        onChange={(e) => setSelectedPlaca(e.target.value)}
                        className="bg-transparent text-sm font-semibold text-gray-800 outline-none"
                        disabled={placasDisponiveis.length === 0}
                      >
                        <option value={ALL_PLACAS}>Todas as placas</option>

                        {placasDisponiveis.map((
// @ts-ignore
                        placa) => (
                          <option key={placa} value={placa}>
                            {placa}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <
// @ts-ignore
                ResponsiveContainer width="100%" height={350}>
                  <
// @ts-ignore
                  ComposedChart
                    data={chartDataComparativo}
                    margin={{ top: 20, right: 25, bottom: 5, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="comparativoFatGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#93C5FD" stopOpacity={0.85} />
                      </linearGradient>

                      <linearGradient id="comparativoResultadoGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.24} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <
// @ts-ignore
                    CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

                    <
// @ts-ignore
                    XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />

                    <
// @ts-ignore
                    YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11, fill: '#6B7280' }}
                      // @ts-ignore
                      tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                    />

                    {isPlacaFiltrada && (
                      // @ts-ignore
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                        // @ts-ignore
                        tickFormatter={(v) => `${toNumber(v).toFixed(0)}%`}
                      />
                    )}

                    <
// @ts-ignore
                    Tooltip content={<
                      // @ts-ignore
                      CustomTooltip />} />
                    <
// @ts-ignore
                    Legend />

                    <
// @ts-ignore
                    Bar
                      yAxisId="left"
                      dataKey="faturamento"
                      fill="url(#comparativoFatGradient)"
                      name="Faturamento"
                      radius={[10, 10, 0, 0]}
                      barSize={46}
                    />

                    {!isPlacaFiltrada && (
                      // @ts-ignore
                      <Bar
                        yAxisId="left"
                        dataKey="ebitdaBWT"
                        fill="#7C3AED"
                        name="EBITDA BWT"
                        radius={[10, 10, 0, 0]}
                        barSize={36}
                      />
                    )}

                    <
// @ts-ignore
                    Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="resultado"
                      fill="url(#comparativoResultadoGradient)"
                      stroke="#059669"
                      strokeWidth={3}
                      name="Resultado Total"
                    />

                    {isPlacaFiltrada && (
                      // @ts-ignore
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="ebitdaPercent"
                        name="EBITDA %"
                        stroke="#F59E0B"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                      />
                    )}
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  </ComposedChart>
                // @ts-ignore
                // @ts-ignore
                // @ts-ignore
                // @ts-ignore
                // @ts-ignore
                // @ts-ignore
                // @ts-ignore
                </ResponsiveContainer>
              </div>

              {frotaInsights && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-5">
                    <h2 className="text-lg font-bold text-gray-900">
                      {isPlacaFiltrada
                        ? `Métricas Estratégicas da Placa ${selectedPlaca}`
                        : 'Métricas Estratégicas de Frota'}
                    </h2>

                    <p className="text-sm text-gray-500">
                      {isPlacaFiltrada
                        ? 'Indicadores individuais de eficiência, receita e rentabilidade da placa selecionada'
                        : 'Indicadores de eficiência operacional e rentabilidade por quilômetro'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <VariacaoCard
                      label="KM Total Rodado"
                      valor1={frotaInsights.kmP1}
                      valor2={frotaInsights.kmP2}
                      unit="km"
                      icon={Route}
                      color="amber"
                    />

                    <VariacaoCard
                      label="Consumo Médio"
                      valor1={frotaInsights.kmLP1}
                      valor2={frotaInsights.kmLP2}
                      unit="km/L"
                      icon={Fuel}
                      color="navy"
                    />

                    <VariacaoCard
                      label="Resultado por KM"
                      valor1={frotaInsights.resultadoPorKmP1}
                      valor2={frotaInsights.resultadoPorKmP2}
                      unit="R$"
                      icon={Gauge}
                      color="green"
                    />

                    <VariacaoCard
                      label="Receita por KM"
                      valor1={frotaInsights.receitaPorKmP1}
                      valor2={frotaInsights.receitaPorKmP2}
                      unit="R$"
                      icon={BarChart3}
                      color="blue"
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <InsightCard
                      title="Margem operacional"
                      value={pct(frotaInsights.margemP2)}
                      description={`No período anterior era ${pct(frotaInsights.margemP1)}. Mede quanto do faturamento virou resultado operacional.`}
                      icon={Target}
                      color={frotaInsights.margemP2 >= frotaInsights.margemP1 ? 'green' : 'red'}
                    />

                    <InsightCard
                      title="Eficiência de combustível"
                      value={`${frotaInsights.kmLP2.toFixed(2)} km/L`}
                      description={`Variação frente ao período anterior: ${(frotaInsights.kmLP2 - frotaInsights.kmLP1).toFixed(2)} km/L.`}
                      icon={Fuel}
                      color={frotaInsights.kmLP2 >= frotaInsights.kmLP1 ? 'green' : 'amber'}
                    />

                    <InsightCard
                      title="Rentabilidade da operação"
                      value={fmt(frotaInsights.resultadoPorKmP2)}
                      description={`Resultado gerado para cada KM rodado. Anterior: ${fmt(frotaInsights.resultadoPorKmP1)} por KM.`}
                      icon={Gauge}
                      color={frotaInsights.resultadoPorKmP2 >= frotaInsights.resultadoPorKmP1 ? 'green' : 'red'}
                    />
                  </div>
                </div>
              )}

              {isPlacaFiltrada && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">
                          Evolução por Placa
                        </h2>
                      </div>

                      <p className="text-sm text-gray-500">
                        Acompanhe faturamento, resultado, KM e EBITDA da placa entre os meses
                      </p>
                    </div>

                    <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {selectedPlaca}
                    </div>
                  </div>

                  <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <VariacaoCard
                      label="Faturamento da Placa"
                      valor1={placaP1?.faturamento}
                      valor2={placaP2?.faturamento}
                      icon={DollarSign}
                      color="blue"
                    />

                    <VariacaoCard
                      label="Resultado da Placa"
                      valor1={placaP1?.resultado}
                      valor2={placaP2?.resultado}
                      icon={TrendingUp}
                      color="green"
                    />

                    <VariacaoCard
                      label="KM Rodado"
                      valor1={placaP1?.hodometro || placaP1?.km}
                      valor2={placaP2?.hodometro || placaP2?.km}
                      unit="km"
                      icon={Truck}
                      color="amber"
                    />

                    <VariacaoCard
                      label="KM/L"
                      valor1={placaP1?.kmL}
                      valor2={placaP2?.kmL}
                      unit="km/L"
                      icon={Fuel}
                      color="navy"
                    />
                  </div>

                  <
// @ts-ignore
                  ResponsiveContainer width="100%" height={330}>
                    <
// @ts-ignore
                    ComposedChart
                      data={placaEvolutionData}
                      margin={{ top: 20, right: 25, bottom: 5, left: 0 }}
                    >
                      <defs>
                        <linearGradient id="placaFatGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#93C5FD" stopOpacity={0.85} />
                        </linearGradient>

                        <linearGradient id="placaResultadoGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#059669" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#6EE7B7" stopOpacity={0.85} />
                        </linearGradient>
                      </defs>

                      <
// @ts-ignore
                      CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

                      <
// @ts-ignore
                      XAxis dataKey="periodo" tick={{ fontSize: 12, fill: '#6B7280' }} />

                      <
// @ts-ignore
                      YAxis
                        yAxisId="left"
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                        // @ts-ignore
                        tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                      />

                      <
// @ts-ignore
                      YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                        // @ts-ignore
                        tickFormatter={(v) => `${toNumber(v).toFixed(0)}%`}
                      />

                      <
// @ts-ignore
                      Tooltip content={<
                        // @ts-ignore
                        CustomTooltip />} />
                      <
// @ts-ignore
                      Legend />

                      <
// @ts-ignore
                      Bar
                        yAxisId="left"
                        dataKey="faturamento"
                        name="Faturamento"
                        fill="url(#placaFatGradient)"
                        radius={[10, 10, 0, 0]}
                        barSize={44}
                      />

                      <
// @ts-ignore
                      Bar
                        yAxisId="left"
                        dataKey="resultado"
                        name="Resultado"
                        fill="url(#placaResultadoGradient)"
                        radius={[10, 10, 0, 0]}
                        barSize={36}
                      />

                      <
// @ts-ignore
                      Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="ebitda"
                        name="EBITDA %"
                        stroke="#F59E0B"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                      />
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    </ComposedChart>
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  // @ts-ignore
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
