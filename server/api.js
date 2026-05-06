import express from 'express';
import cors from 'cors';
import { dbRun, dbGet, dbAll } from './db.js';

const router = express.Router();

// Middleware
router.use(cors());
router.use(express.json());

// Helper para formatar resposta
const formatResponse = (data, error = null) => {
  return { success: !error, data, error };
};

// ============================================
// ENDPOINTS PARA GERENCIAR DADOS MENSAIS
// ============================================

// GET /api/meses - Listar todos os meses disponíveis
router.get('/meses', async (req, res) => {
  try {
    const meses = await dbAll(`
      SELECT id, mes, ano, data_importacao FROM monthly_data 
      ORDER BY ano DESC, mes DESC
    `);
    res.json(formatResponse(meses));
  } catch (error) {
    res.status(500).json(formatResponse(null, error.message));
  }
});

// GET /api/mes/:mes/:ano - Obter dados de um mês específico
router.get('/mes/:mes/:ano', async (req, res) => {
  try {
    const { mes, ano } = req.params;

    const monthlyData = await dbGet(`
      SELECT * FROM monthly_data WHERE mes = ? AND ano = ?
    `, [mes, ano]);

    if (!monthlyData) {
      return res.status(404).json(formatResponse(null, 'Mês não encontrado'));
    }

    const [faturamentoPorDia, rotasRealizadas, frotaVeiculos, faturamentoData, rotasCatalogo, telemetriaData] = await Promise.all([
      dbAll(`SELECT dia, bwt, subcontratado, faturamento FROM faturamento_por_dia WHERE monthly_data_id = ?`, [monthlyData.id]),
      dbAll(`SELECT rota, viagens, valor_total as valorTotal FROM rotas_realizadas WHERE monthly_data_id = ?`, [monthlyData.id]),
      dbAll(`SELECT * FROM frota_veiculos WHERE monthly_data_id = ?`, [monthlyData.id]),
      dbAll(`SELECT * FROM faturamento_data WHERE monthly_data_id = ?`, [monthlyData.id]),
      dbAll(`SELECT * FROM rotas_catalogo WHERE monthly_data_id = ?`, [monthlyData.id]),
      dbAll(`SELECT * FROM telemetria_data WHERE monthly_data_id = ?`, [monthlyData.id])
    ]);

    const data = {
      id: monthlyData.id,
      mes: monthlyData.mes,
      ano: monthlyData.ano,
      dataImportacao: monthlyData.data_importacao,
      kpiGeral: {
        ebitdaBWT: monthlyData.kpi_geral_ebitda_bwt,
        ebitdaSubcontratado: monthlyData.kpi_geral_ebitda_subcontratado,
        resultadoTotal: monthlyData.kpi_geral_resultado_total,
      },
      faturamentoPorDia,
      rotasRealizadas,
      frotaVeiculos,
      faturamentoData,
      rotasCatalogo,
      telemetriaData,
    };

    res.json(formatResponse(data));
  } catch (error) {
    res.status(500).json(formatResponse(null, error.message));
  }
});

// POST /api/importar - Importar dados de um mês (chamado pelo Python)
router.post('/importar', async (req, res) => {
  try {
    const { mes, ano, kpiGeral, faturamentoPorDia, rotasRealizadas, frotaVeiculos, faturamentoData, rotasCatalogo, telemetriaData, sobrescrever } = req.body;

    if (!mes || !ano) {
      return res.status(400).json(formatResponse(null, 'mes e ano são obrigatórios'));
    }

    // Verificar se o mês já existe
    const existing = await dbGet(`
      SELECT id FROM monthly_data WHERE mes = ? AND ano = ?
    `, [mes, ano]);

    // Inserir monthly_data
    if (existing && !sobrescrever) {
      return res.status(400).json(formatResponse(null, `Dados do mês ${mes}/${ano} já existem no banco`));
    }

    let monthlyDataId = existing?.id;

    if (existing && sobrescrever) {
      await dbRun(`DELETE FROM faturamento_por_dia WHERE monthly_data_id = ?`, [monthlyDataId]);
      await dbRun(`DELETE FROM rotas_realizadas WHERE monthly_data_id = ?`, [monthlyDataId]);
      await dbRun(`DELETE FROM frota_veiculos WHERE monthly_data_id = ?`, [monthlyDataId]);
      await dbRun(`DELETE FROM faturamento_data WHERE monthly_data_id = ?`, [monthlyDataId]);
      await dbRun(`DELETE FROM rotas_catalogo WHERE monthly_data_id = ?`, [monthlyDataId]);
      await dbRun(`DELETE FROM telemetria_data WHERE monthly_data_id = ?`, [monthlyDataId]);

      await dbRun(`
        UPDATE monthly_data
        SET kpi_geral_ebitda_bwt = ?,
            kpi_geral_ebitda_subcontratado = ?,
            kpi_geral_resultado_total = ?,
            data_completa = ?,
            data_importacao = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [kpiGeral.ebitdaBWT, kpiGeral.ebitdaSubcontratado, kpiGeral.resultadoTotal, JSON.stringify({ kpiGeral, faturamentoPorDia, rotasRealizadas, frotaVeiculos, faturamentoData, rotasCatalogo, telemetriaData }), monthlyDataId]);
    }

    if (!existing) {

      const result = await dbRun(`
        INSERT INTO monthly_data (mes, ano, kpi_geral_ebitda_bwt, kpi_geral_ebitda_subcontratado, kpi_geral_resultado_total, data_completa)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [mes, ano, kpiGeral.ebitdaBWT, kpiGeral.ebitdaSubcontratado, kpiGeral.resultadoTotal, JSON.stringify({ kpiGeral, faturamentoPorDia, rotasRealizadas, frotaVeiculos, faturamentoData, rotasCatalogo, telemetriaData })]);

      monthlyDataId = result.lastID;
    }

    // Inserir faturamento por dia
    for (const item of faturamentoPorDia) {
      await dbRun(`
        INSERT INTO faturamento_por_dia (monthly_data_id, dia, bwt, subcontratado, faturamento)
        VALUES (?, ?, ?, ?, ?)
      `, [monthlyDataId, item.dia, item.bwt, item.subcontratado, item.faturamento]);
    }

    // Inserir rotas realizadas
    for (const item of rotasRealizadas) {
      await dbRun(`
        INSERT INTO rotas_realizadas (monthly_data_id, rota, viagens, valor_total)
        VALUES (?, ?, ?, ?)
      `, [monthlyDataId, item.rota, item.viagens, item.valorTotal]);
    }

    // Inserir frota
    for (const item of frotaVeiculos) {
      await dbRun(`
        INSERT INTO frota_veiculos (monthly_data_id, modelo, ano, placa, rota, motorista, km_carregado, km_vazio, hodometro, faturamento, ebitda_estimado, ebitda_atingido, resultado, margem, km_l, litros)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [monthlyDataId, item.modelo, item.ano, item.placa, item.rota, item.motorista, item.kmCarregado, item.kmVazio, item.hodometro, item.faturamento, item.ebitdaEstimado, item.ebitdaAtingido, item.resultado, item.margem, item.kmL, item.litros]);
    }

    // Inserir faturamento data
    for (const item of faturamentoData) {
      await dbRun(`
        INSERT INTO faturamento_data (monthly_data_id, cte, data, motorista, placa, rota, tomador, quantidade, peso, valor_total, pedagio, empresa)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [monthlyDataId, item.cte, item.data, item.motorista, item.placa, item.rota, item.tomador, item.quantidade, item.peso, item.valorTotal, item.pedagio, item.empresa]);
    }

    // Inserir rotas catálogo
    for (const item of rotasCatalogo) {
      await dbRun(`
        INSERT INTO rotas_catalogo (monthly_data_id, origem, destino, rota, km, pedagios, valor_pedagios)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [monthlyDataId, item.origem, item.destino, item.rota, item.km, item.pedagios, item.valorPedagios]);
    }

    // Inserir telemetria
    for (const item of telemetriaData) {
      await dbRun(`
        INSERT INTO telemetria_data (monthly_data_id, motorista, placa, km_rodado, litros, media, motor_parado, faixa_verde, faixa_azul, faixa_amarela, faixa_vermelha)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [monthlyDataId, item.motorista, item.placa, item.kmRodado, item.litros, item.media, item.motorParado, item.faixaVerde, item.faixaAzul, item.faixaAmarela, item.faixaVermelha]);
    }

    res.status(existing && sobrescrever ? 200 : 201).json(formatResponse({ id: monthlyDataId, mes, ano, sobrescrito: !!(existing && sobrescrever) }, null));
  } catch (error) {
    res.status(500).json(formatResponse(null, error.message));
  }
});

// ============================================
// ENDPOINTS PARA COMPARATIVOS
// ============================================

// GET /api/comparativo/:mes1/:ano1/:mes2/:ano2 - Comparar dois meses
router.get('/comparativo/:mes1/:ano1/:mes2/:ano2', async (req, res) => {
  try {
    const { mes1, ano1, mes2, ano2 } = req.params;

    const data1 = await dbGet(`SELECT * FROM monthly_data WHERE mes = ? AND ano = ?`, [mes1, ano1]);
    const data2 = await dbGet(`SELECT * FROM monthly_data WHERE mes = ? AND ano = ?`, [mes2, ano2]);

    if (!data1 || !data2) {
      return res.status(404).json(formatResponse(null, 'Um ou ambos os meses não encontrados'));
    }

    const fat1 = await dbGet(`SELECT SUM(faturamento) as total FROM faturamento_por_dia WHERE monthly_data_id = ?`, [data1.id]);
    const fat2 = await dbGet(`SELECT SUM(faturamento) as total FROM faturamento_por_dia WHERE monthly_data_id = ?`, [data2.id]);
    const frota1 = await dbGet(`SELECT COUNT(*) as count, SUM(hodometro) as km, SUM(litros) as litros FROM frota_veiculos WHERE monthly_data_id = ?`, [data1.id]);
    const frota2 = await dbGet(`SELECT COUNT(*) as count, SUM(hodometro) as km, SUM(litros) as litros FROM frota_veiculos WHERE monthly_data_id = ?`, [data2.id]);

    const comparativo = {
      periodo1: `${mes1}/${ano1}`,
      periodo2: `${mes2}/${ano2}`,
      kpiGeral: {
        ebitdaBWT: {
          p1: data1.kpi_geral_ebitda_bwt,
          p2: data2.kpi_geral_ebitda_bwt,
          variacao: data2.kpi_geral_ebitda_bwt - data1.kpi_geral_ebitda_bwt,
          variacaoPercent: data1.kpi_geral_ebitda_bwt ? ((data2.kpi_geral_ebitda_bwt - data1.kpi_geral_ebitda_bwt) / data1.kpi_geral_ebitda_bwt) * 100 : 0,
        },
        ebitdaSubcontratado: {
          p1: data1.kpi_geral_ebitda_subcontratado,
          p2: data2.kpi_geral_ebitda_subcontratado,
          variacao: data2.kpi_geral_ebitda_subcontratado - data1.kpi_geral_ebitda_subcontratado,
          variacaoPercent: data1.kpi_geral_ebitda_subcontratado ? ((data2.kpi_geral_ebitda_subcontratado - data1.kpi_geral_ebitda_subcontratado) / data1.kpi_geral_ebitda_subcontratado) * 100 : 0,
        },
        resultadoTotal: {
          p1: data1.kpi_geral_resultado_total,
          p2: data2.kpi_geral_resultado_total,
          variacao: data2.kpi_geral_resultado_total - data1.kpi_geral_resultado_total,
          variacaoPercent: data1.kpi_geral_resultado_total ? ((data2.kpi_geral_resultado_total - data1.kpi_geral_resultado_total) / data1.kpi_geral_resultado_total) * 100 : 0,
        },
      },
      faturamentoPorDia: {
        p1: fat1.total || 0,
        p2: fat2.total || 0,
      },
      frotaMetricas: {
        p1: frota1,
        p2: frota2,
      },
    };

    res.json(formatResponse(comparativo));
  } catch (error) {
    res.status(500).json(formatResponse(null, error.message));
  }
});

// GET /api/comparativo-anual/:ano - Comparar todos os meses de um ano
router.get('/comparativo-anual/:ano', async (req, res) => {
  try {
    const { ano } = req.params;

    const meses = await dbAll(`
      SELECT mes, ano, kpi_geral_ebitda_bwt, kpi_geral_ebitda_subcontratado, kpi_geral_resultado_total, id
      FROM monthly_data 
      WHERE ano = ?
      ORDER BY mes ASC
    `, [ano]);

    if (meses.length === 0) {
      return res.status(404).json(formatResponse(null, `Nenhum dado encontrado para o ano ${ano}`));
    }

    const dados = [];
    for (const m of meses) {
      const fat = await dbGet(`SELECT SUM(faturamento) as total FROM faturamento_por_dia WHERE monthly_data_id = ?`, [m.id]);
      dados.push({
        mes: m.mes,
        ebitdaBWT: m.kpi_geral_ebitda_bwt,
        ebitdaSubcontratado: m.kpi_geral_ebitda_subcontratado,
        resultadoTotal: m.kpi_geral_resultado_total,
        faturamento: fat.total || 0,
      });
    }

    const comparativoAnual = {
      ano,
      dados,
    };

    res.json(formatResponse(comparativoAnual));
  } catch (error) {
    res.status(500).json(formatResponse(null, error.message));
  }
});

export default router;
