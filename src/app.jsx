import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import FrotaPage from '@/pages/FrotaPage';
import FaturamentoPage from '@/pages/FaturamentoPage';
import TelemetriaPage from '@/pages/TelemetriaPage';
import RotasPage from '@/pages/RotasPage';
import ComparativoPage from '@/pages/ComparativoPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/frota" element={<FrotaPage />} />
          <Route path="/faturamento" element={<FaturamentoPage />} />
          <Route path="/telemetria" element={<TelemetriaPage />} />
          <Route path="/rotas" element={<RotasPage />} />
          <Route path="/comparativo" element={<ComparativoPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  );
}