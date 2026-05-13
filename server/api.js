import express from 'express';
import cors from 'cors';
import { dbRun, dbGet, dbAll } from './db.js';
import 'dotenv/config';

const router = express.Router();

router.use(cors());
router.use(express.json());

const formatResponse = (data, error = null) => {
  return { success: !error, data, error };
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizarPlaca = (placa) => {
  return String(placa || '').trim().toUpperCase();
};

const buscarMonthlyDataPorMesAno = async (mes, ano) => {
  const mesNumero = Number(mes);
  const mesTexto = String(mes || '').trim();

  const variantesMes = [
    mesTexto,
    String(mesNumero),
    String(mesNumero).padStart(2, '0'),
  ].filter(Boolean);

  const placeholders = variantesMes.map(() => '?').join(', ');

  const monthlyData = await dbGet(`
    SELECT *
    FROM monthly_data
    WHERE ano = ?
      AND (
        mes IN (${placeholders})
        OR CAST(mes AS INTEGER) = ?
      )
    LIMIT 1
  `, [
    ano,
    ...variantesMes,
    mesNumero,
  ]);

  return monthlyData;
};

const mapFrotaVeiculo = (item) => {
  return {
    id: item.id,
    monthlyDataId: item.monthly_data_id,

    modelo: item.modelo,
    ano: item.ano,
    placa: normalizarPlaca(item.placa),
    rota: item.rota,
    motorista: item.motorista,

    kmCarregado: toNumber(item.km_carregado),
    kmVazio: toNumber(item.km_vazio),
    hodometro: toNumber(item.hodometro),

    faturamento: toNumber(item.faturamento),
    ebitdaEstimado: toNumber(item.ebitda_estimado),
    ebitdaAtingido: toNumber(item.ebitda_atingido),
    resultado: toNumber(item.resultado),
    margem: toNumber(item.margem),

    kmL: toNumber(item.km_l),
    litros: toNumber(item.litros),
  };
};

const mapFaturamentoData = (item) => {
  return {
    id: item.id,
    monthlyDataId: item.monthly_data_id,

    cte: item.cte,
    data: item.data,
    motorista: item.motorista,
    placa: normalizarPlaca(item.placa),
    rota: item.rota,
    tomador: item.tomador,

    quantidade: toNumber(item.quantidade),
    peso: toNumber(item.peso),
    valorTotal: toNumber(item.valor_total),
    pedagio: toNumber(item.pedagio),
    empresa: item.empresa,
  };
};

const mapTelemetriaData = (item) => {
  return {
    id: item.id,
    monthlyDataId: item.monthly_data_id,

    motorista: item.motorista,
    placa: normalizarPlaca(item.placa),

    kmRodado: toNumber(item.km_rodado),
    litros: toNumber(item.litros),
    media: toNumber(item.media),
    motorParado: toNumber(item.motor_parado),

    faixaVerde: toNumber(item.faixa_verde),
    faixaAzul: toNumber(item.faixa_azul),
    faixaAmarela: toNumber(item.faixa_amarela),
    faixaVermelha: toNumber(item.faixa_vermelha),
  };
};

// ============================================
// ENDPOINTS PARA GERENCIAR DADOS MENSAIS
// ============================================

router.get('/meses', async (req, res) => {
  try {
    const meses = await dbAll(`
      SELECT
        md.id,
        md.mes,
        md.ano,
        md.data_importacao,
        COALESCE(SUM(fpd.faturamento), 0) AS faturamento_total
      FROM monthly_data md
      LEFT JOIN faturamento_por_dia fpd
        ON fpd.monthly_data_id = md.id
      GROUP BY
        md.id,
        md.mes,
        md.ano,
        md.data_importacao
      ORDER BY
        md.ano DESC,
        md.mes DESC
    `);

    const data = meses.map((m) => ({
      id: m.id,
      mes: Number(m.mes),
      ano: Number(m.ano),
      data_importacao: m.data_importacao,
      dataImportacao: m.data_importacao,
      faturamentoTotal: toNumber(m.faturamento_total),
    }));

    res.json(formatResponse(data));
  } catch (error) {
    res.status(500).json(formatResponse(null, error.message));
  }
});

router.get('/mes/:mes/:ano', async (req, res) => {
  try {
    const { mes, ano } = req.params;

    const monthlyData = await buscarMonthlyDataPorMesAno(mes, ano);

    if (!monthlyData) {
      return res.status(404).json(formatResponse(null, 'Mês não encontrado'));
    }

    const [
      faturamentoPorDia,
      rotasRealizadas,
      frotaVeiculosRaw,
      faturamentoDataRaw,
      rotasCatalogo,
      telemetriaDataRaw,
    ] = await Promise.all([
      dbAll(`
        SELECT
          dia,
          bwt,
          subcontratado,
          faturamento
        FROM faturamento_por_dia
        WHERE monthly_data_id = ?
        ORDER BY dia ASC
      `, [monthlyData.id]),

      dbAll(`
  SELECT
    rota,
    viagens,
    valor_total AS "valorTotal"
  FROM rotas_realizadas
  WHERE monthly_data_id = ?
  ORDER BY valor_total DESC
`, [monthlyData.id]),

      dbAll(`
        SELECT *
        FROM frota_veiculos
        WHERE monthly_data_id = ?
        ORDER BY resultado DESC
      `, [monthlyData.id]),

      dbAll(`
        SELECT *
        FROM faturamento_data
        WHERE monthly_data_id = ?
      `, [monthlyData.id]),

      dbAll(`
        SELECT *
        FROM rotas_catalogo
        WHERE monthly_data_id = ?
      `, [monthlyData.id]),

      dbAll(`
        SELECT *
        FROM telemetria_data
        WHERE monthly_data_id = ?
      `, [monthlyData.id]),
    ]);

    const frotaVeiculos = frotaVeiculosRaw.map(mapFrotaVeiculo);
    const faturamentoData = faturamentoDataRaw.map(mapFaturamentoData);
    const telemetriaData = telemetriaDataRaw.map(mapTelemetriaData);

    const data = {
      id: monthlyData.id,
      mes: Number(monthlyData.mes),
      ano: Number(monthlyData.ano),
      dataImportacao: monthlyData.data_importacao,

      kpiGeral: {
        ebitdaBWT: toNumber(monthlyData.kpi_geral_ebitda_bwt),
        ebitdaSubcontratado: toNumber(monthlyData.kpi_geral_ebitda_subcontratado),
        resultadoTotal: toNumber(monthlyData.kpi_geral_resultado_total),
      },

      faturamentoPorDia: faturamentoPorDia.map((item) => ({
        dia: item.dia,
        bwt: toNumber(item.bwt),
        subcontratado: toNumber(item.subcontratado),
        faturamento: toNumber(item.faturamento),
      })),

      rotasRealizadas: rotasRealizadas.map((item) => ({
        rota: item.rota,
        viagens: toNumber(item.viagens),
        valorTotal: toNumber(item.valorTotal ?? item.valortotal ?? item.valor_total),
      })),

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

router.post('/importar', async (req, res) => {
  try {
    const {
      mes,
      ano,
      kpiGeral,
      faturamentoPorDia = [],
      rotasRealizadas = [],
      frotaVeiculos = [],
      faturamentoData = [],
      rotasCatalogo = [],
      telemetriaData = [],
      sobrescrever,
    } = req.body;

    if (!mes || !ano) {
      return res.status(400).json(formatResponse(null, 'mes e ano são obrigatórios'));
    }

    if (!kpiGeral) {
      return res.status(400).json(formatResponse(null, 'kpiGeral é obrigatório'));
    }

    const existing = await dbGet(`
      SELECT id
      FROM monthly_data
      WHERE mes = ? AND ano = ?
    `, [mes, ano]);

    if (existing && !sobrescrever) {
      return res.status(400).json(
        formatResponse(null, `Dados do mês ${mes}/${ano} já existem no banco`)
      );
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
        SET
          kpi_geral_ebitda_bwt = ?,
          kpi_geral_ebitda_subcontratado = ?,
          kpi_geral_resultado_total = ?,
          data_completa = ?,
          data_importacao = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        toNumber(kpiGeral.ebitdaBWT),
        toNumber(kpiGeral.ebitdaSubcontratado),
        toNumber(kpiGeral.resultadoTotal),
        JSON.stringify({
          kpiGeral,
          faturamentoPorDia,
          rotasRealizadas,
          frotaVeiculos,
          faturamentoData,
          rotasCatalogo,
          telemetriaData,
        }),
        monthlyDataId,
      ]);
    }

    if (!existing) {
      const result = await dbRun(`
        INSERT INTO monthly_data (
          mes,
          ano,
          kpi_geral_ebitda_bwt,
          kpi_geral_ebitda_subcontratado,
          kpi_geral_resultado_total,
          data_completa
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        mes,
        ano,
        toNumber(kpiGeral.ebitdaBWT),
        toNumber(kpiGeral.ebitdaSubcontratado),
        toNumber(kpiGeral.resultadoTotal),
        JSON.stringify({
          kpiGeral,
          faturamentoPorDia,
          rotasRealizadas,
          frotaVeiculos,
          faturamentoData,
          rotasCatalogo,
          telemetriaData,
        }),
      ]);

      monthlyDataId = result.lastID;
    }

    for (const item of faturamentoPorDia) {
      await dbRun(`
        INSERT INTO faturamento_por_dia (
          monthly_data_id,
          dia,
          bwt,
          subcontratado,
          faturamento
        )
        VALUES (?, ?, ?, ?, ?)
      `, [
        monthlyDataId,
        item.dia,
        toNumber(item.bwt),
        toNumber(item.subcontratado),
        toNumber(item.faturamento),
      ]);
    }

    for (const item of rotasRealizadas) {
      await dbRun(`
        INSERT INTO rotas_realizadas (
          monthly_data_id,
          rota,
          viagens,
          valor_total
        )
        VALUES (?, ?, ?, ?)
      `, [
        monthlyDataId,
        item.rota,
        toNumber(item.viagens),
        toNumber(item.valorTotal),
      ]);
    }

    for (const item of frotaVeiculos) {
      await dbRun(`
        INSERT INTO frota_veiculos (
          monthly_data_id,
          modelo,
          ano,
          placa,
          rota,
          motorista,
          km_carregado,
          km_vazio,
          hodometro,
          faturamento,
          ebitda_estimado,
          ebitda_atingido,
          resultado,
          margem,
          km_l,
          litros
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        monthlyDataId,
        item.modelo,
        item.ano,
        normalizarPlaca(item.placa),
        item.rota,
        item.motorista,
        toNumber(item.kmCarregado),
        toNumber(item.kmVazio),
        toNumber(item.hodometro),
        toNumber(item.faturamento),
        toNumber(item.ebitdaEstimado),
        toNumber(item.ebitdaAtingido),
        toNumber(item.resultado),
        toNumber(item.margem),
        toNumber(item.kmL),
        toNumber(item.litros),
      ]);
    }

    for (const item of faturamentoData) {
      await dbRun(`
        INSERT INTO faturamento_data (
          monthly_data_id,
          cte,
          data,
          motorista,
          placa,
          rota,
          tomador,
          quantidade,
          peso,
          valor_total,
          pedagio,
          empresa
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        monthlyDataId,
        item.cte,
        item.data,
        item.motorista,
        normalizarPlaca(item.placa),
        item.rota,
        item.tomador,
        toNumber(item.quantidade),
        toNumber(item.peso),
        toNumber(item.valorTotal),
        toNumber(item.pedagio),
        item.empresa,
      ]);
    }

    for (const item of rotasCatalogo) {
      await dbRun(`
        INSERT INTO rotas_catalogo (
          monthly_data_id,
          origem,
          destino,
          rota,
          km,
          pedagios,
          valor_pedagios
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        monthlyDataId,
        item.origem,
        item.destino,
        item.rota,
        toNumber(item.km),
        toNumber(item.pedagios),
        toNumber(item.valorPedagios),
      ]);
    }

    for (const item of telemetriaData) {
      await dbRun(`
        INSERT INTO telemetria_data (
          monthly_data_id,
          motorista,
          placa,
          km_rodado,
          litros,
          media,
          motor_parado,
          faixa_verde,
          faixa_azul,
          faixa_amarela,
          faixa_vermelha
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        monthlyDataId,
        item.motorista,
        normalizarPlaca(item.placa),
        toNumber(item.kmRodado),
        toNumber(item.litros),
        toNumber(item.media),
        toNumber(item.motorParado),
        toNumber(item.faixaVerde),
        toNumber(item.faixaAzul),
        toNumber(item.faixaAmarela),
        toNumber(item.faixaVermelha),
      ]);
    }

    res.status(existing && sobrescrever ? 200 : 201).json(
      formatResponse({
        id: monthlyDataId,
        mes,
        ano,
        sobrescrito: !!(existing && sobrescrever),
      })
    );
  } catch (error) {
    res.status(500).json(formatResponse(null, error.message));
  }
});

// ============================================
// ENDPOINTS PARA COMPARATIVOS
// ============================================

router.get('/comparativo/:mes1/:ano1/:mes2/:ano2', async (req, res) => {
  try {
    const { mes1, ano1, mes2, ano2 } = req.params;

    const data1 = await buscarMonthlyDataPorMesAno(mes1, ano1);
    const data2 = await buscarMonthlyDataPorMesAno(mes2, ano2);

    if (!data1 || !data2) {
      return res.status(404).json(formatResponse(null, 'Um ou ambos os meses não encontrados'));
    }

    const [
      fat1,
      fat2,
      frotaMetricas1,
      frotaMetricas2,
      frotaVeiculosRaw1,
      frotaVeiculosRaw2,
    ] = await Promise.all([
      dbGet(`
        SELECT COALESCE(SUM(faturamento), 0) AS total
        FROM faturamento_por_dia
        WHERE monthly_data_id = ?
      `, [data1.id]),

      dbGet(`
        SELECT COALESCE(SUM(faturamento), 0) AS total
        FROM faturamento_por_dia
        WHERE monthly_data_id = ?
      `, [data2.id]),

      dbGet(`
        SELECT
          COUNT(*) AS count,
          COALESCE(SUM(hodometro), 0) AS km,
          COALESCE(SUM(litros), 0) AS litros,
          COALESCE(SUM(faturamento), 0) AS faturamento,
          COALESCE(SUM(resultado), 0) AS resultado,
          COALESCE(AVG(km_l), 0) AS kmLMedio
        FROM frota_veiculos
        WHERE monthly_data_id = ?
      `, [data1.id]),

      dbGet(`
        SELECT
          COUNT(*) AS count,
          COALESCE(SUM(hodometro), 0) AS km,
          COALESCE(SUM(litros), 0) AS litros,
          COALESCE(SUM(faturamento), 0) AS faturamento,
          COALESCE(SUM(resultado), 0) AS resultado,
          COALESCE(AVG(km_l), 0) AS kmLMedio
        FROM frota_veiculos
        WHERE monthly_data_id = ?
      `, [data2.id]),

      dbAll(`
        SELECT *
        FROM frota_veiculos
        WHERE monthly_data_id = ?
        ORDER BY placa ASC
      `, [data1.id]),

      dbAll(`
        SELECT *
        FROM frota_veiculos
        WHERE monthly_data_id = ?
        ORDER BY placa ASC
      `, [data2.id]),
    ]);

    const frotaVeiculos1 = frotaVeiculosRaw1.map(mapFrotaVeiculo);
    const frotaVeiculos2 = frotaVeiculosRaw2.map(mapFrotaVeiculo);

    const comparativo = {
      periodo1: `${String(mes1).padStart(2, '0')}/${ano1}`,
      periodo2: `${String(mes2).padStart(2, '0')}/${ano2}`,

      ids: {
        p1: data1.id,
        p2: data2.id,
      },

      kpiGeral: {
        ebitdaBWT: {
          p1: toNumber(data1.kpi_geral_ebitda_bwt),
          p2: toNumber(data2.kpi_geral_ebitda_bwt),
        },

        ebitdaSubcontratado: {
          p1: toNumber(data1.kpi_geral_ebitda_subcontratado),
          p2: toNumber(data2.kpi_geral_ebitda_subcontratado),
        },

        resultadoTotal: {
          p1: toNumber(data1.kpi_geral_resultado_total),
          p2: toNumber(data2.kpi_geral_resultado_total),
        },
      },

      faturamentoPorDia: {
        p1: toNumber(fat1?.total),
        p2: toNumber(fat2?.total),
      },

      frotaMetricas: {
        p1: {
          count: toNumber(frotaMetricas1?.count),
          km: toNumber(frotaMetricas1?.km),
          litros: toNumber(frotaMetricas1?.litros),
          faturamento: toNumber(frotaMetricas1?.faturamento),
          resultado: toNumber(frotaMetricas1?.resultado),
          kmLMedio: toNumber(frotaMetricas1?.kmLMedio),
        },

        p2: {
          count: toNumber(frotaMetricas2?.count),
          km: toNumber(frotaMetricas2?.km),
          litros: toNumber(frotaMetricas2?.litros),
          faturamento: toNumber(frotaMetricas2?.faturamento),
          resultado: toNumber(frotaMetricas2?.resultado),
          kmLMedio: toNumber(frotaMetricas2?.kmLMedio),
        },
      },

      frotaVeiculos: {
        p1: frotaVeiculos1,
        p2: frotaVeiculos2,
      },
    };

    res.json(formatResponse(comparativo));
  } catch (error) {
    res.status(500).json(formatResponse(null, error.message));
  }
});

router.get('/faturamento-mensal', async (req, res) => {
  try {
    const dados = await dbAll(`
      SELECT
        md.id,
        md.mes,
        md.ano,
        md.kpi_geral_ebitda_bwt,
        md.kpi_geral_ebitda_subcontratado,
        md.kpi_geral_resultado_total,
        COALESCE(SUM(fpd.faturamento), 0) AS faturamento
      FROM monthly_data md
      LEFT JOIN faturamento_por_dia fpd
        ON fpd.monthly_data_id = md.id
      GROUP BY
        md.id,
        md.mes,
        md.ano,
        md.kpi_geral_ebitda_bwt,
        md.kpi_geral_ebitda_subcontratado,
        md.kpi_geral_resultado_total
      ORDER BY
        md.ano ASC,
        md.mes ASC
    `);

    let acumulado = 0;

    const data = dados.map((item) => {
      const faturamento = toNumber(item.faturamento);
      acumulado += faturamento;

      return {
        id: item.id,
        mes: Number(item.mes),
        ano: Number(item.ano),
        periodo: `${String(item.mes).padStart(2, '0')}/${item.ano}`,

        faturamento,
        acumulado,

        ebitdaBWT: toNumber(item.kpi_geral_ebitda_bwt),
        ebitdaSubcontratado: toNumber(item.kpi_geral_ebitda_subcontratado),
        resultadoTotal: toNumber(item.kpi_geral_resultado_total),
      };
    });

    res.json(formatResponse(data));
  } catch (error) {
    res.status(500).json(formatResponse(null, error.message));
  }
});

router.get('/faturamento-mensal/:ano', async (req, res) => {
  try {
    const { ano } = req.params;

    const dados = await dbAll(`
      SELECT
        md.id,
        md.mes,
        md.ano,
        md.kpi_geral_ebitda_bwt,
        md.kpi_geral_ebitda_subcontratado,
        md.kpi_geral_resultado_total,
        COALESCE(SUM(fpd.faturamento), 0) AS faturamento
      FROM monthly_data md
      LEFT JOIN faturamento_por_dia fpd
        ON fpd.monthly_data_id = md.id
      WHERE md.ano = ?
      GROUP BY
        md.id,
        md.mes,
        md.ano,
        md.kpi_geral_ebitda_bwt,
        md.kpi_geral_ebitda_subcontratado,
        md.kpi_geral_resultado_total
      ORDER BY
        md.mes ASC
    `, [ano]);

    let acumulado = 0;

    const data = dados.map((item) => {
      const faturamento = toNumber(item.faturamento);
      acumulado += faturamento;

      return {
        id: item.id,
        mes: Number(item.mes),
        ano: Number(item.ano),
        periodo: `${String(item.mes).padStart(2, '0')}/${item.ano}`,

        faturamento,
        acumulado,

        ebitdaBWT: toNumber(item.kpi_geral_ebitda_bwt),
        ebitdaSubcontratado: toNumber(item.kpi_geral_ebitda_subcontratado),
        resultadoTotal: toNumber(item.kpi_geral_resultado_total),
      };
    });

    res.json(formatResponse(data));
  } catch (error) {
    res.status(500).json(formatResponse(null, error.message));
  }
});

router.get('/comparativo-anual/:ano', async (req, res) => {
  try {
    const { ano } = req.params;

    const meses = await dbAll(`
      SELECT
        mes,
        ano,
        kpi_geral_ebitda_bwt,
        kpi_geral_ebitda_subcontratado,
        kpi_geral_resultado_total,
        id
      FROM monthly_data
      WHERE ano = ?
      ORDER BY mes ASC
    `, [ano]);

    if (meses.length === 0) {
      return res.status(404).json(formatResponse(null, `Nenhum dado encontrado para o ano ${ano}`));
    }

    const dados = [];

    for (const m of meses) {
      const fat = await dbGet(`
        SELECT COALESCE(SUM(faturamento), 0) AS total
        FROM faturamento_por_dia
        WHERE monthly_data_id = ?
      `, [m.id]);

      dados.push({
        mes: Number(m.mes),
        ano: Number(m.ano),
        periodo: `${String(m.mes).padStart(2, '0')}/${m.ano}`,

        ebitdaBWT: toNumber(m.kpi_geral_ebitda_bwt),
        ebitdaSubcontratado: toNumber(m.kpi_geral_ebitda_subcontratado),
        resultadoTotal: toNumber(m.kpi_geral_resultado_total),
        faturamento: toNumber(fat?.total),
      });
    }

    res.json(formatResponse({ ano, dados }));
  } catch (error) {
    res.status(500).json(formatResponse(null, error.message));
  }
});

export default router;