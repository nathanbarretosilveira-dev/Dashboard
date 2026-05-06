# 🎯 Sistema de Comparativo Histórico - Dashboard BWT

> **Sistema completo para armazenar histórico de dados mensais e gerar comparativos entre períodos**

---

## 📋 Documentação Rápida

| Documento | Objetivo |
|-----------|----------|
| **📖 [PRIMEIRA_EXECUCAO.md](./PRIMEIRA_EXECUCAO.md)** | Instruções passo a passo para começar |
| **⚙️ [SETUP_COMPARATIVO.md](./SETUP_COMPARATIVO.md)** | Configuração completa e troubleshooting |
| **🏗️ [README_ARQUITETURA.md](./README_ARQUITETURA.md)** | Arquitetura, diagrama de fluxo e conceitos |
| **📝 [ALTERACOES_RESUMO.md](./ALTERACOES_RESUMO.md)** | Lista de arquivos criados/modificados |

---

## 🚀 Quick Start (3 passos)

```bash
# 1️⃣ Instalar dependências
npm install && pip install requests

# 2️⃣ Iniciar backend (terminal 1)
npm run server:dev

# 3️⃣ Importar dados + frontend (em outro terminal)
npm run data:build
npm run dev
```

**Pronto!** Acesse: http://localhost:5173/comparativo

---

## ✨ Principais Recursos

### 📊 Dashboard de Comparativos
- Selecione dois períodos e compare
- Visualize variações em valores e %
- Gráficos interativos com Recharts

### 💾 Banco de Dados Histórico
- Armazena todos os meses em SQLite
- Sem perda de dados entre períodos
- Histórico completo preservado

### 🔄 Importação Automática
- Python script detecta novo período
- Importa via API sem duplicatas
- Sem risco de dados corrompidos

### 📈 Escalável para o Futuro
- Estrutura pronta para comparativos anuais
- API aberta para integrações
- Fácil adicionar novos tipos de análise

---

## 📁 Estrutura do Projeto

```
Dashboard/
├─ 📁 server/                          [NOVO] Backend Node.js
│  ├─ db.js                           Banco SQLite
│  ├─ api.js                          Endpoints REST
│  ├─ index.js                        Servidor Express
│  └─ data.db                         [Auto] Banco criado
│
├─ 📁 src/
│  ├─ 📁 pages/
│  │  └─ ComparativoPage.jsx          [NOVO] Página comparativo
│  ├─ 📁 components/
│  │  └─ Layout.jsx                   [MODIFICADO] + link
│  ├─ App.jsx                         [MODIFICADO] + rota
│  └─ ...
│
├─ 📁 utils/
│  └─ build_bwt_data.py               [MODIFICADO] + API
│
├─ 📄 package.json                    [MODIFICADO] + dependências
├─ 📄 PRIMEIRA_EXECUCAO.md            [NOVO] Tutorial
├─ 📄 SETUP_COMPARATIVO.md            [NOVO] Configuração
├─ 📄 README_ARQUITETURA.md           [NOVO] Arquitetura
└─ 📄 ALTERACOES_RESUMO.md            [NOVO] Alterações
```

---

## 🏗️ Arquitetura (Simplificada)

```
Frontend (React)
     ↓
Backend (Express.js)
     ↓
SQLite (Histórico)
     ↑
Python Script ← Excel
```

### Fluxo de Dados:
1. **Python** lê planilha Excel
2. **Python** envia para **Backend** via API
3. **Backend** salva em **SQLite**
4. **Frontend** busca dados do **Backend**
5. **React** renderiza **Comparativo**

---

## 🎮 Usando a Página de Comparativo

### Acesso
- URL: http://localhost:5173/comparativo
- Disponível após primeira importação

### Recursos
- 📊 **KPIs Comparativos**: EBITDA BWT, Subcontratado, Resultado
- 📈 **Gráficos**: Evolução mensal com barras
- 🔢 **Variações**: Valores absolutos + percentuais
- 📋 **Métricas**: Frota, faturamento, eficiência

---

## 📊 Banco de Dados

### Tabelas Principais
- `monthly_data` - Resumo de cada período
- `faturamento_por_dia` - Dados diários
- `frota_veiculos` - Informações de veículos
- `faturamento_data` - Detalhes de faturas
- `rotas_realizadas` - Rotas completadas
- `rotas_catalogo` - Catálogo de rotas
- `telemetria_data` - Dados de telemetria

### Arquivo
- **Localização**: `server/data.db`
- **Tipo**: SQLite3
- **Tamanho inicial**: ~100KB

---

## 🔄 Ciclo Mensal

### Cada Mês:

```
┌─ Excel Atualizado (04.2026.xlsx)
│
├─ npm run data:build
│  ├─ Python lê dados
│  ├─ Extrai mês/ano
│  └─ Envia para API
│
├─ Backend recebe
│  ├─ Verifica se novo
│  └─ Importa no SQLite
│
├─ Python gera JS
│  └─ Frontend carrega
│
└─ Histórico mantido para próximas análises
```

---

## 🚀 Scripts NPM

```bash
# Desenvolvimento
npm run dev              # Frontend (Vite)
npm run server:dev       # Backend (Express com auto-reload)

# Dados
npm run data:build       # Importa dados da Excel
npm run data:import      # data:build + frontend dev

# Produção
npm run build            # Build frontend
npm run server           # Backend produção

# Utilitários
npm run lint             # ESLint
npm run preview          # Visualizar build
```

---

## ⚠️ Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| **Erro de conexão** | Inicie backend: `npm run server:dev` |
| **Comparativo vazio** | Execute: `npm run data:build` |
| **Banco corrompido** | Delete `server/data.db` e reimporte |
| **Dados não atualizam** | Reinicie backend e frontend |
| **Porta 3001 em uso** | Mate outro processo: `netstat -ano \| findstr :3001` |

Mais detalhes: veja [SETUP_COMPARATIVO.md](./SETUP_COMPARATIVO.md)

---

## 🎯 Recursos Implementados

### ✅ Concluído
- [x] Backend Node.js com Express
- [x] SQLite com 7 tabelas
- [x] 5 endpoints API principais
- [x] Página React de Comparativo
- [x] Integração Python com API
- [x] Proteção contra duplicatas
- [x] Histórico preservado
- [x] Documentação completa

### 🚀 Possíveis Extensões
- [ ] Comparativo anual automático
- [ ] Exportar para PDF
- [ ] Dashboard de tendências
- [ ] Alertas por variação
- [ ] Interface de admin

---

## 📚 Documentação Adicional

### Arquivos de Ajuda
1. **PRIMEIRA_EXECUCAO.md** - Comece por aqui!
2. **SETUP_COMPARATIVO.md** - Configuração detalhada
3. **README_ARQUITETURA.md** - Entenda a estrutura
4. **ALTERACOES_RESUMO.md** - O que mudou

### Estrutura de Dados
- Schema completo em `server/db.js`
- Endpoints em `server/api.js`
- Componente React em `src/pages/ComparativoPage.jsx`

---

## 🔐 Backup & Segurança

### Fazer Backup
```bash
# Windows PowerShell
Copy-Item server/data.db server/data.backup.db
```

### Restaurar
```bash
Remove-Item server/data.db
Copy-Item server/data.backup.db server/data.db
```

---

## 📞 Suporte

Se encontrar problemas:

1. ✅ Consulte [SETUP_COMPARATIVO.md](./SETUP_COMPARATIVO.md) - Solução de Problemas
2. ✅ Verifique se backend está rodando: `npm run server:dev`
3. ✅ Confirme se dados foram importados: `npm run data:build`
4. ✅ Reinicie frontend: `npm run dev`

---

## 🎉 Pronto para Começar?

```bash
# 1. Instalar
npm install && pip install requests

# 2. Abrir terminal 1 - Backend
npm run server:dev

# 3. Abrir terminal 2 - Frontend + Dados
npm run data:build
npm run dev

# 4. Abrir browser
http://localhost:5173/comparativo
```

**Boa sorte! 🚀**

---

## 📝 Notas Técnicas

- **Frontend**: React 18, Recharts, Tailwind CSS
- **Backend**: Express.js, Node.js 18+
- **Banco**: SQLite3 (better-sqlite3)
- **Build**: Vite
- **Python**: 3.7+, requests

---

## 📄 Licença

Este projeto é parte do Dashboard BWT e segue a licença do projeto principal.

---

**Última atualização**: Abril 2026  
**Versão do Sistema**: 1.0.0 (Histórico & Comparativos)
