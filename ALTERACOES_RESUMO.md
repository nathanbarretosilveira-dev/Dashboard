# 📋 Resumo de Alterações - Sistema de Histórico e Comparativos

## 🆕 Novos Arquivos Criados

### Backend Node.js
- **`server/db.js`** - Inicializa e configura banco SQLite com todas as tabelas
- **`server/api.js`** - Define endpoints REST para CRUD e comparativos
- **`server/index.js`** - Servidor Express principal

### Frontend React  
- **`src/pages/ComparativoPage.jsx`** - Página interativa de comparativos entre períodos

### Documentação
- **`SETUP_COMPARATIVO.md`** - Guia completo de instalação e uso

---

## 📝 Arquivos Modificados

### `package.json`
**Alterações:**
- ✅ Adicionadas dependências: `express`, `cors`, `better-sqlite3`
- ✅ Novos scripts:
  - `npm run server` - Rodar backend
  - `npm run server:dev` - Rodar backend com auto-reload
  - `npm run data:import` - Build + desenvolver (combina data:build + dev)

### `utils/build_bwt_data.py`
**Alterações:**
- ✅ Importa `requests` para comunicar com API backend
- ✅ Novas funções:
  - `_extract_mes_ano_from_filename()` - Extrai mês/ano do arquivo
  - `_import_to_api()` - Envia dados para o backend
  - `_fetch_from_api()` - Busca dados existentes do banco
- ✅ `main()` modificada para:
  - Extrair período do nome do arquivo
  - Tentar importar para o banco (ou usar dados existentes)
  - Gerar arquivo JS com dados do banco ou planilha

### `src/App.jsx`
**Alterações:**
- ✅ Importa nova página: `ComparativoPage`
- ✅ Adiciona rota: `/comparativo` → `<ComparativoPage />`

### `src/components/Layout.jsx`
**Alterações:**
- ✅ Importa ícone: `LineChart` (lucide-react)
- ✅ Adiciona link de navegação para Comparativo na sidebar

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Dashboard   │  │    Frota     │  │ Comparativo  │  ... │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/meses       → Lista períodos disponíveis      │   │
│  │  /api/mes/:mes/:ano → Busca dados de um mês        │   │
│  │  /api/importar    → Importa novos dados             │   │
│  │  /api/comparativo → Compara dois períodos          │   │
│  │  /api/comparativo-anual → Compara meses de um ano  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQL
┌─────────────────────────────────────────────────────────────┐
│              SQLite (server/data.db)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • monthly_data          → Dados resumidos            │   │
│  │ • faturamento_por_dia   → Faturamento diário        │   │
│  │ • frota_veiculos        → Dados de veículos         │   │
│  │ • faturamento_data      → Detalhes de faturas       │   │
│  │ • rotas_realizadas      → Rotas completadas         │   │
│  │ • rotas_catalogo        → Catálogo de rotas         │   │
│  │ • telemetria_data       → Dados de telemetria       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↑
           Python Script (utils/build_bwt_data.py)
                    ↓ Lê Excel
         C:\OneDrive - Grupo Potencial\INDICADOR COMERCIAL\
            Indicador Comercial {MES}.{ANO}.xlsx
```

---

## 🔄 Fluxo de Dados

### 1️⃣ Primeira Importação (Novo mês)

```
Excel (04.2026)
    ↓
Python Script
    ├─ Extrai dados
    ├─ Extrai mês = "04", ano = "2026"
    └─ Envia via POST /api/importar
        ↓
    Backend (Express)
        ├─ Valida dados
        ├─ Insere em todas as tabelas
        └─ Resposta: 201 Created
            ↓
    Python Script
        ├─ Sucesso!
        └─ Gera src/lib/bwtData.js
            ↓
Frontend React
    └─ Exibe dados normalmente
```

### 2️⃣ Mesma Planilha (Mesmo mês depois)

```
Excel (04.2026)
    ↓
Python Script
    ├─ Extrai dados
    ├─ Extrai mês = "04", ano = "2026"
    └─ Envia via POST /api/importar
        ↓
    Backend (Express)
        ├─ Verifica: Já existe! (Erro 400)
        └─ Resposta: "Dados já existem"
            ↓
    Python Script
        ├─ "Ok, vou buscar do banco"
        └─ Requisição: GET /api/mes/04/2026
            ↓
    Backend (Express)
        ├─ Busca dados do SQLite
        └─ Retorna JSON completo
            ↓
    Python Script
        ├─ Recebe dados
        └─ Gera src/lib/bwtData.js
            ↓
Frontend React
    └─ Exibe dados normalmente
```

### 3️⃣ Novo Mês (Próximo período)

```
Excel (05.2026) ← Arquivo atualizado
    ↓
Python Script
    ├─ Extrai dados
    ├─ Extrai mês = "05", ano = "2026"
    └─ Envia via POST /api/importar
        ↓
    Backend (Express)
        ├─ Verifica: Novo período!
        ├─ Insere todos os dados
        └─ Resposta: 201 Created
            ↓
Frontend React
    ├─ Dashboard mostra dados novos
    └─ Comparativo agora pode:
        • Listar 04/2026 e 05/2026
        • Comparar os dois períodos
        • Gerar gráficos de evolução
```

---

## 💾 Estrutura do Banco de Dados

```sql
monthly_data
├─ id: INTEGER (PK)
├─ mes: TEXT (ex: "04")
├─ ano: INTEGER (ex: 2026)
├─ data_importacao: DATETIME
├─ kpi_geral_ebitda_bwt: REAL
├─ kpi_geral_ebitda_subcontratado: REAL
├─ kpi_geral_resultado_total: REAL
└─ data_completa: TEXT (JSON backup)

faturamento_por_dia (FK: monthly_data_id)
├─ id: INTEGER (PK)
├─ monthly_data_id: INTEGER (FK)
├─ dia: TEXT (ex: "01")
├─ bwt: REAL
├─ subcontratado: REAL
└─ faturamento: REAL

frota_veiculos (FK: monthly_data_id)
├─ id: INTEGER (PK)
├─ monthly_data_id: INTEGER (FK)
├─ modelo: TEXT
├─ ano: INTEGER
├─ placa: TEXT
├─ rota: TEXT
├─ motorista: TEXT
├─ km_carregado: REAL
├─ km_vazio: REAL
├─ hodometro: REAL
├─ faturamento: REAL
├─ ebitda_estimado: REAL
├─ ebitda_atingido: REAL
├─ resultado: REAL
├─ margem: REAL
├─ km_l: REAL
└─ litros: REAL

[Demais tabelas com estrutura similar...]
```

---

## 🎯 Endpoints da API (Resumo)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/meses` | Lista todos os períodos |
| GET | `/api/mes/:mes/:ano` | Busca dados específicos |
| POST | `/api/importar` | Importa novos dados |
| GET | `/api/comparativo/:mes1/:ano1/:mes2/:ano2` | Compara dois períodos |
| GET | `/api/comparativo-anual/:ano` | Compara meses de um ano |

---

## ✅ Próximos Passos para Você

1. **Executar instalação:**
   ```bash
   npm install
   pip install requests
   ```

2. **Testar o backend:**
   ```bash
   npm run server:dev
   # Em outro terminal
   npm run dev
   ```

3. **Importar dados:**
   ```bash
   npm run data:build
   ```

4. **Acessar página de Comparativo:**
   - URL: `http://localhost:5173/comparativo`
   - Deveria ver lista de períodos

5. **Futuros meses:**
   - Atualize arquivo Excel com novos dados
   - Execute `npm run data:build` novamente
   - Sistema reconhece novo período e importa automaticamente

---

## 📚 Estrutura de Pastas (Resumo)

```
Dashboard/
├─ server/
│  ├─ db.js           [Novo] Banco de dados
│  ├─ api.js          [Novo] Endpoints API
│  ├─ index.js        [Novo] Servidor principal
│  └─ data.db         [Auto] Arquivo do SQLite
├─ src/
│  ├─ pages/
│  │  └─ ComparativoPage.jsx  [Novo] Página de comparativos
│  ├─ components/
│  │  ├─ Layout.jsx   [Modificado] Adicionado link
│  │  └─ ...
│  ├─ App.jsx         [Modificado] Adicionada rota
│  └─ ...
├─ utils/
│  └─ build_bwt_data.py  [Modificado] Integração com banco
├─ package.json       [Modificado] Novas dependências e scripts
├─ SETUP_COMPARATIVO.md  [Novo] Este documento
└─ ...
```

---

**🎉 Tudo pronto! Sistema de histórico e comparativos implementado com sucesso!**
