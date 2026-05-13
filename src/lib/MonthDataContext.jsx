import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { kpiGeral as fallbackKpiGeral, faturamentoPorDia as fallbackFaturamentoPorDia, rotasRealizadas as fallbackRotasRealizadas, frotaVeiculos as fallbackFrotaVeiculos, faturamentoData as fallbackFaturamentoData, rotasCatalogo as fallbackRotasCatalogo, telemetriaData as fallbackTelemetriaData } from './bwtData';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001/api';

const MonthDataContext = createContext(null);

const normalizeVehicle = (v = {}) => ({
  ...v,
  // @ts-ignore
  kmCarregado: v.kmCarregado ?? v.km_carregado ?? 0,
  // @ts-ignore
  kmVazio: v.kmVazio ?? v.km_vazio ?? 0,
  // @ts-ignore
  hodometro: v.hodometro ?? 0,
  // @ts-ignore
  faturamento: v.faturamento ?? 0,
  // @ts-ignore
  ebitdaEstimado: v.ebitdaEstimado ?? v.ebitda_estimado ?? 0,
  // @ts-ignore
  ebitdaAtingido: v.ebitdaAtingido ?? v.ebitda_atingido ?? 0,
  // @ts-ignore
  resultado: v.resultado ?? 0,
  // @ts-ignore
  margem: v.margem ?? 0,
  // @ts-ignore
  kmL: v.kmL ?? v.km_l ?? 0,
  // @ts-ignore
  litros: v.litros ?? 0,
});

const normalizeTelemetria = (t = {}) => ({
  ...t,
  // @ts-ignore
  kmRodado: t.kmRodado ?? t.km_rodado ?? 0,
  // @ts-ignore
  motorParado: t.motorParado ?? t.motor_parado ?? 0,
  // @ts-ignore
  faixaVerde: t.faixaVerde ?? t.faixa_verde ?? 0,
  // @ts-ignore
  faixaAzul: t.faixaAzul ?? t.faixa_azul ?? 0,
  // @ts-ignore
  faixaAmarela: t.faixaAmarela ?? t.faixa_amarela ?? 0,
  // @ts-ignore
  faixaVermelha: t.faixaVermelha ?? t.faixa_vermelha ?? 0,
});

const normalizeData = (raw = {}) => ({
  ...raw,
  // @ts-ignore
  frotaVeiculos: (raw.frotaVeiculos || []).map(normalizeVehicle),
  // @ts-ignore
  telemetriaData: (raw.telemetriaData || []).map(normalizeTelemetria),
  // @ts-ignore
  faturamentoData: (raw.faturamentoData || []).map((d = {}) => ({
    ...d,
    // @ts-ignore
    valorTotal: d.valorTotal ?? d.valor_total ?? 0,
  })),
  // @ts-ignore
  rotasCatalogo: (raw.rotasCatalogo || []).map((r = {}) => ({
    ...r,
    // @ts-ignore
    valorPedagios: r.valorPedagios ?? r.valor_pedagios ?? 0,
  })),
});

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// @ts-ignore
export function MonthDataProvider({ children }) {
  const [meses, setMeses] = useState([]);
  const [selectedMesId, setSelectedMesId] = useState('');
  const [data, setData] = useState({
    kpiGeral: fallbackKpiGeral,
    faturamentoPorDia: fallbackFaturamentoPorDia,
    rotasRealizadas: fallbackRotasRealizadas,
    frotaVeiculos: fallbackFrotaVeiculos,
    faturamentoData: fallbackFaturamentoData,
    rotasCatalogo: fallbackRotasCatalogo,
    telemetriaData: fallbackTelemetriaData,
  });

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/meses`);
        const result = await resp.json();
        if (result?.success && result.data?.length) {
          setMeses(result.data);
          setSelectedMesId(String(result.data[0].id));
        }
      } catch { }
    })();
  }, []);

  useEffect(() => {
    // @ts-ignore
    const selected = meses.find((m) => String(m.id) === String(selectedMesId));
    if (!selected) return;
    (async () => {
      try {
        // @ts-ignore
        const resp = await fetch(`${API_BASE_URL}/mes/${selected.mes}/${selected.ano}`);
        const result = await resp.json();
        // @ts-ignore
        if (result?.success && result?.data) setData(normalizeData(result.data));
      } catch { }
    })();
  }, [meses, selectedMesId]);

  const periodoLabel = useMemo(() => {
    // @ts-ignore
    const selected = meses.find((m) => String(m.id) === String(selectedMesId));
    if (!selected) return 'Mês atual';
    // @ts-ignore
    return `${monthNames[Number(selected.mes) - 1] || selected.mes} ${selected.ano}`;
  }, [meses, selectedMesId]);

  // @ts-ignore
  return <MonthDataContext.Provider value={{ meses, selectedMesId, setSelectedMesId, periodoLabel, data }}>{children}</MonthDataContext.Provider>;
}

export function useMonthData() {
  const ctx = useContext(MonthDataContext);
  if (!ctx) throw new Error('useMonthData must be used within MonthDataProvider');
  return ctx;
}