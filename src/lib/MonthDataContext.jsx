import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { kpiGeral as fallbackKpiGeral, faturamentoPorDia as fallbackFaturamentoPorDia, rotasRealizadas as fallbackRotasRealizadas, frotaVeiculos as fallbackFrotaVeiculos, faturamentoData as fallbackFaturamentoData, rotasCatalogo as fallbackRotasCatalogo, telemetriaData as fallbackTelemetriaData } from './bwtData';

const MonthDataContext = createContext(null);
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
        if (result?.success && result?.data) setData(result.data);
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
