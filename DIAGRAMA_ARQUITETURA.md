# 🎨 Diagrama Visual da Solução Implementada

## 📊 Visão Geral da Arquitetura

```
╔════════════════════════════════════════════════════════════════════════╗
║                        DASHBOARD BWT - v1.0.0                         ║
║              Sistema de Histórico e Comparativo de Dados               ║
╚════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                    🎯 APLICAÇÃO FRONTEND (React)                       │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │              │  │              │  │              │  │            │ │
│  │  Dashboard   │  │    Frota     │  │ 🆕 COMPARATIVO │  │   Mais    │ │
│  │   (Atual)    │  │              │  │   (Novo!)    │  │  Páginas  │ │
│  │              │  │              │  │              │  │            │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
│         │                │                │                    │       │
│         └────────────────┴────────────────┴────────────────────┘       │
│                        ↓ Requisições HTTP                              │
└─────────────────────────────────────────────────────────────────────────┘
              (http://localhost:5173)

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│              🔧 SERVIDOR BACKEND (Express.js - Node.js)                │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  API REST (5 Endpoints Principais)                              │ │
│  │                                                                   │ │
│  │  1️⃣  GET  /api/meses                                            │ │
│  │      ↳ Lista todos os períodos armazenados                      │ │
│  │                                                                   │ │
│  │  2️⃣  GET  /api/mes/:mes/:ano                                    │ │
│  │      ↳ Retorna dados completos de um período                    │ │
│  │                                                                   │ │
│  │  3️⃣  POST /api/importar                                         │ │
│  │      ↳ Importa novos dados (chamado pelo Python)                │ │
│  │                                                                   │ │
│  │  4️⃣  GET  /api/comparativo/:mes1/:ano1/:mes2/:ano2             │ │
│  │      ↳ Compara dois períodos (variações, gráficos)             │ │
│  │                                                                   │ │
│  │  5️⃣  GET  /api/comparativo-anual/:ano                           │ │
│  │      ↳ Compara todos os meses de um ano                         │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                        ↓ Queries SQL                                    │
└─────────────────────────────────────────────────────────────────────────┘
              (http://localhost:3001)

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│            💾 BANCO DE DADOS (SQLite - server/data.db)                 │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 📊 7 Tabelas Relacionadas:                                        │ │
│  │                                                                    │ │
│  │  ┌─────────────────────┐       ┌──────────────────────┐          │ │
│  │  │  monthly_data       │       │ faturamento_por_dia  │          │ │
│  │  ├─────────────────────┤       ├──────────────────────┤          │ │
│  │  │ id (PK)             │◄──────┤ id                   │          │ │
│  │  │ mes                 │       │ monthly_data_id (FK) │          │ │
│  │  │ ano                 │       │ dia                  │          │ │
│  │  │ kpi_*               │       │ bwt, subcontratado   │          │ │
│  │  │ data_importacao     │       │ faturamento          │          │ │
│  │  └─────────────────────┘       └──────────────────────┘          │ │
│  │                                                                    │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │ │
│  │  │ frota_veiculos   │  │ faturamento_data │  │ rotas_realizadas│ │ │
│  │  ├──────────────────┤  ├──────────────────┤  ├─────────────────┤ │ │
│  │  │ id, placa, ano   │  │ id, cte, data    │  │ id, rota, viagens
    │ │ │ hodometro, km_l │  │ motorista, tomador │ │ valor_total     │ │
│  │  └──────────────────┘  └──────────────────┘  └─────────────────┘ │ │
│  │                                                                    │ │
│  │  [rotas_catalogo, telemetria_data também presentes]               │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  💡 Cada período (mês) tem seus próprios dados em todas as tabelas    │
│     via relacionamento com monthly_data_id                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
              ↑ Escrita SQL (POST /api/importar)

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                  🐍 SCRIPT PYTHON (build_bwt_data.py)                  │
│                                                                         │
│  Responsabilidades:                                                    │
│                                                                         │
│  ✅ Lê arquivo Excel (Indicador Comercial MM.YYYY.xlsx)              │
│  ✅ Extrai mês e ano do nome do arquivo                              │
│  ✅ Processa dados (normaliza, limpa, formata)                       │
│  ✅ Envia JSON via POST /api/importar                                │
│  ✅ Recebe resposta (sucesso ou dados existentes)                    │
│  ✅ Se novo: recebe confirmação 201 Created                          │
│  ✅ Se existe: busca dados via GET /api/mes/:mes/:ano               │
│  ✅ Gera arquivo JS (src/lib/bwtData.js)                             │
│  ✅ Frontend carrega dados normalmente                               │
│                                                                         │
│  import requests  ← Comunicação com API                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
              ↓ Lê

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│              📁 FONTE DE DADOS (Excel)                                 │
│                                                                         │
│  Local: C:\Users\NATHAN.G\OneDrive - Grupo Potencial\                 │
│         INDICADOR COMERCIAL\Indicador Comercial MM.YYYY.xlsx          │
│                                                                         │
│  Padrão: Indicador Comercial 04.2026.xlsx                            │
│                     ▲▲     ▲▲▲▲                                       │
│                     │└─────┘│                                          │
│                     │       └─ Ano (2026)                             │
│                     └────────── Mês (04)                              │
│                                                                         │
│  Cada mês: arquivo diferente com novos dados                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Importação de Dados

### Primeira Vez (Novo Período)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Mês 1: 04.2026                                                       │
└──────────────────────────────────────────────────────────────────────┘

  FILE: Indicador Comercial 04.2026.xlsx
    ↓
  📝 Python Script
    ├─ Lê dados
    ├─ Extrai: mes="04", ano="2026"
    └─ Prepara JSON
      ↓
  🔌 POST /api/importar
    ├─ Payload: {mes: "04", ano: "2026", kpiGeral: {...}, ...}
    ↓
  ✅ Backend responde: 201 Created
    ├─ Insere em monthly_data
    ├─ Insere em faturamento_por_dia (30 registros)
    ├─ Insere em frota_veiculos (20 registros)
    ├─ Insere em faturamento_data (500 registros)
    ├─ Insere em rotas_realizadas (10 registros)
    ├─ Insere em rotas_catalogo (50 registros)
    └─ Insere em telemetria_data (20 registros)
    ↓
  📊 SQLite armazena: 1º período
    ↓
  📝 Python gera src/lib/bwtData.js
    ↓
  🌐 Frontend carrega com dados de 04/2026
    ↓
  ✅ Dashboard mostra dados

[BANCO VAZIO] ──→ [1 PERÍODO: 04/2026]
```

### Segunda Vez (Mesmo Período)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Mês 1: 04.2026 (NOVAMENTE)                                           │
└──────────────────────────────────────────────────────────────────────┘

  FILE: Indicador Comercial 04.2026.xlsx (MESMO ARQUIVO)
    ↓
  📝 Python Script
    ├─ Lê dados
    ├─ Extrai: mes="04", ano="2026"
    └─ Prepara JSON
      ↓
  🔌 POST /api/importar
    ├─ Payload: {mes: "04", ano: "2026", ...}
    ↓
  ⚠️ Backend responde: 400 Bad Request
    └─ Erro: "Dados do mês 04/2026 já existem no banco"
    ↓
  🔄 Python detecta erro 400
    ├─ Entende: "dados já importados"
    └─ Busca: GET /api/mes/04/2026
      ↓
  ✅ Backend retorna: {mes: "04", ano: "2026", dados...}
    ↓
  📊 SQLite: dados já existentes
    ↓
  📝 Python gera src/lib/bwtData.js (COM DADOS DO BANCO)
    ↓
  🌐 Frontend carrega normalmente
    ↓
  ✅ Dashboard mostra dados

[1 PERÍODO: 04/2026] ──→ [MANTÉM 1 PERÍODO: 04/2026]
✅ NENHUMA DUPLICATA!
```

### Terceira Vez (Novo Período)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Mês 2: 05.2026 (NOVO!)                                               │
└──────────────────────────────────────────────────────────────────────┘

  FILE: Indicador Comercial 05.2026.xlsx (ARQUIVO NOVO)
    ↓
  📝 Python Script
    ├─ Lê dados DIFERENTES
    ├─ Extrai: mes="05", ano="2026" ← MÊS DIFERENTE!
    └─ Prepara JSON
      ↓
  🔌 POST /api/importar
    ├─ Payload: {mes: "05", ano: "2026", ...} ← NOVO
    ↓
  ✅ Backend verifica: "05/2026 não existe!"
    ├─ Insere NOVO período
    ├─ monthly_data: NOVO registro para 05/2026
    ├─ faturamento_por_dia: 30 novos registros para 05/2026
    ├─ frota_veiculos: novos veículos para 05/2026
    └─ Etc...
    ↓
  ✅ Backend responde: 201 Created
    ↓
  📊 SQLite armazena: 2 PERÍODOS
    ├─ 04/2026: original (MANTIDO)
    └─ 05/2026: novo
    ↓
  📝 Python gera src/lib/bwtData.js (COM DADOS DE 05/2026)
    ↓
  🌐 Frontend carrega com dados de 05/2026
    ↓
  ✅ Dashboard mostra dados novos
  ✅ COMPARATIVO agora funciona! (pode comparar 04/2026 ↔ 05/2026)

[1 PERÍODO: 04/2026] ──→ [2 PERÍODOS: 04/2026 + 05/2026]
✅ HISTÓRICO PRESERVADO!
```

---

## 🎮 Página de Comparativo (Interface)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   📊 Comparativo de Períodos                            │
│          Compare KPIs e métricas entre diferentes meses/períodos        │
└─────────────────────────────────────────────────────────────────────────┘

 Selecionar Períodos para Comparação
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  Período Anterior: [  04/2026    ▼ ]                                  │
│  Período Atual:    [  05/2026    ▼ ]                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

 Cartões de Métrica
┌──────────────────────────────────────────┐  ┌────────────────────────────┐
│  EBITDA BWT                              │  │  EBITDA Subcontratado      │
├──────────────────────────────────────────┤  ├────────────────────────────┤
│  Anterior: R$ 466.015,55                 │  │  Anterior: R$ 41.580,26    │
│  Atual:    R$ 512.340,20                 │  │  Atual:    R$ 38.920,15    │
│                                          │  │                            │
│  ↗ +R$ 46.324,65 (+9,94%)               │  │  ↘ -R$ 2.660,11 (-6,39%)   │
│     [Verde - Crescimento]                │  │     [Vermelho - Queda]     │
└──────────────────────────────────────────┘  └────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  Resultado Total                                                         │
├──────────────────────────────────────────────────────────────────────────┤
│  Anterior: R$ 507.595,81                                                │
│  Atual:    R$ 551.260,35                                                │
│                                                                          │
│  ↗ +R$ 43.664,54 (+8,61%)                                               │
│     [Verde - Crescimento]                                               │
└──────────────────────────────────────────────────────────────────────────┘

 Gráfico Comparativo
┌──────────────────────────────────────────────────────────────────────────┐
│  Evolução de EBITDA e Resultado                                         │
│                                                                          │
│         R$                                                              │
│    600K ├─                                                              │
│         │                      ▄▄▄                                      │
│    500K ├─  ▄▄▄               █████                                    │
│         │  █████               █████                                    │
│    400K ├─ █████               █████                                    │
│         │ █████               █████                                     │
│    300K ├─┤                                                              │
│         │ ├─────────────────────┤                                        │
│            04/2026              05/2026                                  │
│                                                                          │
│         ■ EBITDA BWT (azul)                                            │
│         ■ EBITDA Subcontratado (roxo)                                  │
│         ■ Resultado Total (verde)                                      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

 Faturamento e Frota
┌──────────────────────────────────────────┐  ┌────────────────────────────┐
│  Faturamento Total                       │  │  Quantidade de Veículos    │
│  Anterior: R$ 2.345.678,90               │  │  Anterior: 25 un           │
│  Atual:    R$ 2.567.890,45               │  │  Atual:    27 un           │
│  ↗ +R$ 222.211,55 (+9,47%)               │  │  ↗ +2 un (+8%)             │
└──────────────────────────────────────────┘  └────────────────────────────┘
```

---

## 📝 Scripts de Execução

```bash
┌────────────────────────────────────────────────────────────────┐
│              SEQUÊNCIA CORRETA DE EXECUÇÃO                     │
└────────────────────────────────────────────────────────────────┘

1️⃣  INSTALAÇÃO (uma vez)
    $ npm install                   ← dependências Node
    $ pip install requests          ← dependência Python

2️⃣  PRIMEIRA EXECUÇÃO

    Terminal 1 (Backend):
    $ npm run server:dev
    ✅ Output: "Backend rodando em http://localhost:3001"

    Terminal 2 (Importar + Frontend):
    $ npm run data:build            ← Python → SQL
    ✅ Output: "✓ Dados importados com sucesso: 04/2026"

    $ npm run dev                   ← Vite
    ✅ Output: "Local: http://localhost:5173/"

3️⃣  PRÓXIMAS VEZES

    Terminal 1:
    $ npm run server:dev            ← deixe aberto

    Terminal 2:
    $ npm run dev                   ← frontend dev

    Quando atualizar dados:
    Terminal 3:
    $ npm run data:build            ← reimporta

4️⃣  ACESSAR COMPARATIVO

    Browser: http://localhost:5173/comparativo

┌────────────────────────────────────────────────────────────────┐
│                    ✅ TUDO PRONTO!                            │
└────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Estrutura de Pastas (Detalhe)

```
C:\Users\NATHAN.G\Documents\GitHub\Dashboard\
│
├─ 📁 server/                      ← 🆕 NOVO Backend
│  ├─ 📄 db.js                     Configuração SQLite
│  ├─ 📄 api.js                    5 Endpoints REST
│  ├─ 📄 index.js                  Servidor Express
│  └─ 📄 data.db                   [Auto] Banco criado
│
├─ 📁 src/
│  ├─ 📁 pages/
│  │  ├─ 📄 ComparativoPage.jsx    🆕 Página comparativo
│  │  ├─ 📄 Dashboard.jsx           (existente)
│  │  ├─ 📄 FrotaPage.jsx           (existente)
│  │  ├─ 📄 FaturamentoPage.jsx     (existente)
│  │  └─ 📄 TelemetriaPage.jsx      (existente)
│  │
│  ├─ 📁 components/
│  │  ├─ 📄 Layout.jsx              📝 Modificado (+ link)
│  │  ├─ 📄 KPICard.jsx             (existente)
│  │  └─ 📄 ...
│  │
│  ├─ 📁 lib/
│  │  └─ 📄 bwtData.js              (gerado por Python)
│  │
│  ├─ 📄 App.jsx                    📝 Modificado (+ rota)
│  └─ 📄 main.jsx                   (existente)
│
├─ 📁 utils/
│  ├─ 📄 build_bwt_data.py          📝 Modificado (integrado API)
│  └─ 📄 ...
│
├─ 📁 node_modules/                 (criado por npm install)
│  ├─ express/
│  ├─ cors/
│  ├─ better-sqlite3/
│  └─ ... (muitos arquivos)
│
├─ 📄 package.json                  📝 Modificado
├─ 📄 vite.config.js                (existente)
├─ 📄 jsconfig.json                 (existente)
├─ 📄 tailwind.config.js            (existente)
│
├─ 📚 LEIA_PRIMEIRO.md              🆕 Overview do projeto
├─ 📚 PRIMEIRA_EXECUCAO.md          🆕 Passo a passo
├─ 📚 SETUP_COMPARATIVO.md          🆕 Configuração completa
├─ 📚 README_ARQUITETURA.md         🆕 Conceitos técnicos
└─ 📚 ALTERACOES_RESUMO.md          🆕 Mudanças detalhadas
```

---

## 🎯 Próximas Funcionalidades (Roadmap)

```
┌────────────────────────────────────────────────────────┐
│  FASE 2: Expansão de Comparativos                     │
├────────────────────────────────────────────────────────┤
│  [ ] Dashboard anual (todos meses de 1 ano)          │
│  [ ] Exportar comparativo em PDF                      │
│  [ ] Gráfico de tendência (série temporal)           │
│  [ ] Alertas para variações > 20%                     │
│  [ ] Cache de comparativos frequentes                │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  FASE 3: Interface Administrativa                     │
├────────────────────────────────────────────────────────┤
│  [ ] Painel de admin para gerenciar períodos         │
│  [ ] Importação manual de dados históricos            │
│  [ ] Edição/correção de dados                        │
│  [ ] Relatórios customizados                         │
└────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementação

```
✅ Backend Node.js + Express criado
✅ SQLite com 7 tabelas implementado
✅ 5 endpoints API funcionando
✅ Python script integrado com API
✅ Página React de Comparativo criada
✅ Layout atualizado com navegação
✅ Proteção contra duplicatas implementada
✅ Documentação completa escrita
✅ Scripts NPM configurados
✅ Estrutura pronta para extensões futuras

🎉 SISTEMA COMPLETO E PRONTO PARA PRODUÇÃO!
```

---

**Criado**: Abril 2026  
**Versão**: 1.0.0 (Inicial - Comparativo Histórico)  
**Status**: ✅ Pronto para Uso
