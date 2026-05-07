import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { kpiGeral as fallbackKpiGeral, faturamentoPorDia as fallbackFaturamentoPorDia, rotasRealizadas as fallbackRotasRealizadas, frotaVeiculos as fallbackFrotaVeiculos, faturamentoData as fallbackFaturamentoData, rotasCatalogo as fallbackRotasCatalogo, telemetriaData as fallbackTelemetriaData } from './bwtData';

const MonthDataContext = createContext(null);

const normalizeVehicle = (v = {}) => ({
  ...v,
  kmCarregado: v.kmCarregado ?? v.km_carregado ?? 0,
  kmVazio: v.kmVazio ?? v.km_vazio ?? 0,
  hodometro: v.hodometro ?? 0,
  faturamento: v.faturamento ?? 0,
  ebitdaEstimado: v.ebitdaEstimado ?? v.ebitda_estimado ?? 0,
  ebitdaAtingido: v.ebitdaAtingido ?? v.ebitda_atingido ?? 0,
  resultado: v.resultado ?? 0,
  margem: v.margem ?? 0,
  kmL: v.kmL ?? v.km_l ?? 0,
  litros: v.litros ?? 0,
});

const normalizeTelemetria = (t = {}) => ({
  ...t,
  kmRodado: t.kmRodado ?? t.km_rodado ?? 0,
  motorParado: t.motorParado ?? t.motor_parado ?? 0,
  faixaVerde: t.faixaVerde ?? t.faixa_verde ?? 0,
  faixaAzul: t.faixaAzul ?? t.faixa_azul ?? 0,
  faixaAmarela: t.faixaAmarela ?? t.faixa_amarela ?? 0,
  faixaVermelha: t.faixaVermelha ?? t.faixa_vermelha ?? 0,
});

const normalizeData = (raw = {}) => ({
  ...raw,
  frotaVeiculos: (raw.frotaVeiculos || []).map(normalizeVehicle),
  telemetriaData: (raw.telemetriaData || []).map(normalizeTelemetria),
  faturamentoData: (raw.faturamentoData || []).map((d = {}) => ({
    ...d,
    valorTotal: d.valorTotal ?? d.valor_total ?? 0,
  })),
  rotasCatalogo: (raw.rotasCatalogo || []).map((r = {}) => ({
    ...r,
    valorPedagios: r.valorPedagios ?? r.valor_pedagios ?? 0,
  })),
});

const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

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
        const resp = await fetch('http://localhost:3001/api/meses');
        const result = await resp.json();
        if (result?.success && result.data?.length) {
          setMeses(result.data);
          setSelectedMesId(String(result.data[0].id));
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const selected = meses.find((m) => String(m.id) === String(selectedMesId));
    if (!selected) return;
    (async () => {
      try {
        const resp = await fetch(`http://localhost:3001/api/mes/${selected.mes}/${selected.ano}`);
        const result = await resp.json();
        if (result?.success && result?.data) setData(normalizeData(result.data));
      } catch {}
    })();
  }, [meses, selectedMesId]);

  const periodoLabel = useMemo(() => {
    const selected = meses.find((m) => String(m.id) === String(selectedMesId));
    if (!selected) return 'Mês atual';
    return `${monthNames[Number(selected.mes)-1] || selected.mes} ${selected.ano}`;
  }, [meses, selectedMesId]);

  return <MonthDataContext.Provider value={{ meses, selectedMesId, setSelectedMesId, periodoLabel, data }}>{children}</MonthDataContext.Provider>;
}

export function useMonthData() {
  const ctx = useContext(MonthDataContext);
  if (!ctx) throw new Error('useMonthData must be used within MonthDataProvider');
  return ctx;
}
