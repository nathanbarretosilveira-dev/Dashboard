import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  kpiGeral as fallbackKpiGeral,
  faturamentoPorDia as fallbackFaturamentoPorDia,
  rotasRealizadas as fallbackRotasRealizadas,
  frotaVeiculos as fallbackFrotaVeiculos,
  faturamentoData as fallbackFaturamentoData,
  rotasCatalogo as fallbackRotasCatalogo,
  telemetriaData as fallbackTelemetriaData,
} from './bwtData';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001/api';

const MonthDataContext = createContext(null);

const normalizeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeVehicle = (v = {}) => ({
  ...v,
  kmCarregado: normalizeNumber(v.kmCarregado ?? v.km_carregado),
  kmVazio: normalizeNumber(v.kmVazio ?? v.km_vazio),
  hodometro: normalizeNumber(v.hodometro),
  faturamento: normalizeNumber(v.faturamento),
  ebitdaEstimado: normalizeNumber(v.ebitdaEstimado ?? v.ebitda_estimado),
  ebitdaAtingido: normalizeNumber(v.ebitdaAtingido ?? v.ebitda_atingido),
  resultado: normalizeNumber(v.resultado),
  margem: normalizeNumber(v.margem),
  kmL: normalizeNumber(v.kmL ?? v.km_l),
  litros: normalizeNumber(v.litros),
});

const normalizeTelemetria = (t = {}) => ({
  ...t,
  kmRodado: normalizeNumber(t.kmRodado ?? t.km_rodado),
  motorParado: normalizeNumber(t.motorParado ?? t.motor_parado),
  faixaVerde: normalizeNumber(t.faixaVerde ?? t.faixa_verde),
  faixaAzul: normalizeNumber(t.faixaAzul ?? t.faixa_azul),
  faixaAmarela: normalizeNumber(t.faixaAmarela ?? t.faixa_amarela),
  faixaVermelha: normalizeNumber(t.faixaVermelha ?? t.faixa_vermelha),
});

const normalizeData = (raw = {}) => ({
  ...raw,

  kpiGeral: {
    ebitdaBWT: normalizeNumber(raw.kpiGeral?.ebitdaBWT),
    ebitdaSubcontratado: normalizeNumber(raw.kpiGeral?.ebitdaSubcontratado),
    resultadoTotal: normalizeNumber(raw.kpiGeral?.resultadoTotal),
  },

  faturamentoPorDia: (raw.faturamentoPorDia || []).map((d = {}) => ({
    ...d,
    bwt: normalizeNumber(d.bwt),
    subcontratado: normalizeNumber(d.subcontratado),
    faturamento: normalizeNumber(
      d.faturamento ??
        normalizeNumber(d.bwt) + normalizeNumber(d.subcontratado)
    ),
  })),

  rotasRealizadas: (raw.rotasRealizadas || []).map((r = {}) => ({
    ...r,
    rota: r.rota || 'SEM ROTA',
    viagens: normalizeNumber(r.viagens),
    valorTotal: normalizeNumber(r.valorTotal ?? r.valortotal ?? r.valor_total),
  })),

  frotaVeiculos: (raw.frotaVeiculos || []).map(normalizeVehicle),

  faturamentoData: (raw.faturamentoData || []).map((d = {}) => ({
    ...d,
    valorTotal: normalizeNumber(d.valorTotal ?? d.valor_total),
    pedagio: normalizeNumber(d.pedagio),
    quantidade: normalizeNumber(d.quantidade),
    peso: normalizeNumber(d.peso),
  })),

  rotasCatalogo: (raw.rotasCatalogo || []).map((r = {}) => ({
    ...r,
    km: normalizeNumber(r.km),
    pedagios: normalizeNumber(r.pedagios),
    valorPedagios: normalizeNumber(r.valorPedagios ?? r.valor_pedagios),
  })),

  telemetriaData: (raw.telemetriaData || []).map(normalizeTelemetria),
});

const monthNames = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function MonthDataProvider({ children }) {
  const [meses, setMeses] = useState([]);
  const [selectedMesId, setSelectedMesId] = useState('');
  const [monthLoading, setMonthLoading] = useState(false);

  const [data, setData] = useState(() =>
    normalizeData({
      kpiGeral: fallbackKpiGeral,
      faturamentoPorDia: fallbackFaturamentoPorDia,
      rotasRealizadas: fallbackRotasRealizadas,
      frotaVeiculos: fallbackFrotaVeiculos,
      faturamentoData: fallbackFaturamentoData,
      rotasCatalogo: fallbackRotasCatalogo,
      telemetriaData: fallbackTelemetriaData,
    })
  );

  useEffect(() => {
    let cancelled = false;

    const fetchMeses = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/meses`);
        const result = await resp.json();

        if (!cancelled && result?.success && result.data?.length) {
          setMeses(result.data);
          setSelectedMesId(String(result.data[0].id));
        }
      } catch (err) {
        console.error('Erro ao carregar meses:', err);
      }
    };

    fetchMeses();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const selected = meses.find((m) => String(m.id) === String(selectedMesId));

    if (!selected) return;

    let cancelled = false;

    const fetchMonthData = async () => {
      try {
        setMonthLoading(true);

        const resp = await fetch(
          `${API_BASE_URL}/mes/${selected.mes}/${selected.ano}`
        );

        const result = await resp.json();

        if (!cancelled && result?.success && result?.data) {
          setData(normalizeData(result.data));
        }
      } catch (err) {
        console.error('Erro ao carregar dados do mês:', err);
      } finally {
        if (!cancelled) {
          setMonthLoading(false);
        }
      }
    };

    fetchMonthData();

    return () => {
      cancelled = true;
    };
  }, [meses, selectedMesId]);

  const periodoLabel = useMemo(() => {
    const selected = meses.find((m) => String(m.id) === String(selectedMesId));

    if (!selected) return 'Mês atual';

    return `${monthNames[Number(selected.mes) - 1] || selected.mes} ${
      selected.ano
    }`;
  }, [meses, selectedMesId]);

  const value = useMemo(
    () => ({
      meses,
      selectedMesId,
      setSelectedMesId,
      periodoLabel,
      data,
      monthLoading,
    }),
    [meses, selectedMesId, periodoLabel, data, monthLoading]
  );

  return (
    <MonthDataContext.Provider value={value}>
      {children}
    </MonthDataContext.Provider>
  );
}

export function useMonthData() {
  const ctx = useContext(MonthDataContext);

  if (!ctx) {
    throw new Error('useMonthData must be used within MonthDataProvider');
  }

  return ctx;
}