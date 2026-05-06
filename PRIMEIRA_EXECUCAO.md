# 🚀 Guia de Primeira Execução

## ✅ Checklist Pré-requisitos

- [ ] Node.js v18+ instalado
- [ ] Python 3.7+ instalado
- [ ] npm disponível no PATH

---

## 📥 Passo 1: Instalar Dependências

### Dependências Node.js
```bash
cd C:\Users\NATHAN.G\Documents\GitHub\Dashboard
npm install
```

Isso instala:
- Express (framework web)
- CORS (para requisições cross-origin)
- sqlite3 (banco de dados)
- Concurrently (para rodar múltiplos serviços)
- Todas as dependências existentes

**Tempo estimado:** 2-3 minutos

### Dependências Python
```bash
pip install requests
```

Ou se estiver em um ambiente virtual:
```bash
# Se usar venv
source venv/Scripts/activate  # Windows
pip install requests

# Se usar Poetry
poetry add requests

# Se usar Pipenv
pipenv install requests
```

---

## 🔧 Passo 2: Configurar Caminho da Planilha (Opcional)

Se o caminho da planilha estiver diferente, edite:

**Arquivo:** `utils/build_bwt_data.py`

**Linha 14:**
```python
XLSX_PATH = Path(r"C:\Users\NATHAN.G\OneDrive - Grupo Potencial\INDICADOR COMERCIAL\Indicador Comercial 04.2026.xlsx")
```

Certifique-se de que o arquivo existe e tem o padrão: `Indicador Comercial MM.YYYY.xlsx`

---

## 🎬 Passo 3: Iniciar Tudo com Um Único Comando

**Na pasta do projeto:**

```bash
npm run dev
```

**Saída esperada (em paralelo):**
```
[0] Database initialized at C:\Users\NATHAN.G\Documents\GitHub\Dashboard\server\data.db
[0] Backend rodando em http://localhost:3001
[1]   ➜  Local:   http://localhost:5173/
[1]   ➜  press h to show help
```

✅ **Deixe este terminal aberto! Backend + Frontend rodando juntos.**

---

## 📊 Passo 4: Importar Dados (Na Primeira Vez)

**Em um NOVO terminal, na pasta do projeto:**

```bash
npm run data:build
```

**Saída esperada:**
```
📊 Processando dados do mês: 04/2026
📁 Arquivo: Indicador Comercial 04.2026.xlsx

Enviando dados para o banco de dados (04/2026)...
✓ Dados importados com sucesso: 04/2026
✓ Dados gerados em: C:\...\src\lib\bwtData.js
✓ Período: 04/2026
```

✅ **Agora os dados estão no banco!**

---

## 🎉 Passo 5: Testar a Aplicação

1. **Abra o navegador:** http://localhost:5173

2. **Verifique:**
   - ✅ Dashboard (Visão Geral) carrega normalmente
   - ✅ Outras abas funcionam (Frota, Faturamento, etc.)

3. **Acesse o Comparativo:**
   - URL: http://localhost:5173/comparativo
   - Você verá: "Carregando meses disponíveis..."
   - Se vir uma lista com um período (04/2026), funciona!

---

## ⚠️ Se Aparecer Erro...

### ❌ "Erro ao conectar ao servidor em http://localhost:3001"

**Solução:**
1. Verifique se o backend está rodando: `npm run server:dev`
2. Confirme se aparece: "Backend rodando em http://localhost:3001"
3. Se não estiver, mate o processo e rode novamente

### ❌ "TypeError: Cannot read property 'length' of undefined"

**Solução:**
1. Backend deveria estar pronto antes de rodar o build
2. Verifique se `npm run server:dev` está em execução
3. Rode novamente: `npm run data:build`

### ❌ "Database not initialized"

**Solução:**
1. Verifique se o backend foi iniciado com sucesso
2. Se persistir, delete: `server/data.db`
3. Reinicie o backend: `npm run server:dev`

### ❌ "ModuleNotFoundError: No module named 'requests'"

**Solução:**
```bash
pip install requests --upgrade
```

---

## 🎯 Próximas Vezes

Depois que tudo estiver configurado:

```bash
# Um único terminal - tudo roda junto!
npm run dev
```

Para importar dados novos (quando virar o mês):

```bash
# Em outro terminal
npm run data:build
```

---

## 📁 Arquivos Criados Automaticamente

Primeira vez que rodar `npm run data:build`:

```
server/
└─ data.db  (banco SQLite ~100KB para começar)

src/lib/
└─ bwtData.js  (atualizado com dados atuais)
```

---

## 🔐 Backup do Banco

O arquivo `server/data.db` contém todos os históricos. Para não perder:

1. **Faça backup regularmente:**
   ```bash
   # Windows - em PowerShell
   Copy-Item server/data.db server/data.backup.db
   ```

2. **Restaurar se necessário:**
   ```bash
   # Remove atual e restaura backup
   Remove-Item server/data.db
   Copy-Item server/data.backup.db server/data.db
   ```

---

## 🚀 Automação (Opcional)

Já está automatizado! Basta rodar `npm run dev` uma vez. Para iniciar em dois terminais (um para dev, outro para data import):

### Opção: Script Windows (.bat)

Criar arquivo `iniciar.bat` na raiz:
```batch
@echo off
start cmd /k npm run dev
```

Depois: clique duplo em `iniciar.bat`

---

## 📞 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Porta 3001 em uso | `netstat -ano \| findstr :3001` e mate o processo |
| Porta 5173 em uso | Deixe o projeto fechar com Ctrl+C e tente novamente |
| Banco corrompido | Delete `server/data.db` e reimporte |
| Python não found | Instale Python ou adicione ao PATH |
| npm não found | Reinstale Node.js |

---

## ✅ Checklist Final

- [ ] Backend rodando em http://localhost:3001
- [ ] Frontend rodando em http://localhost:5173  
- [ ] Dados importados com `npm run data:build`
- [ ] Dashboard carrega normalmente
- [ ] Página /comparativo mostra períodos disponíveis
- [ ] Arquivo `server/data.db` existe
- [ ] Arquivo `src/lib/bwtData.js` foi atualizado

**Se tudo passou: 🎉 Sistema pronto para usar!**

---

## 🔄 Rotina Mensal

Na virada do mês:

1. Atualize sua planilha Excel com novos dados
2. Renomeie para: `Indicador Comercial 05.2026.xlsx` (próximo mês)
3. Execute: `npm run data:build`
4. Sistema detecta novo período e importa automaticamente
5. Históricos anteriores mantêm-se para comparação

**Pronto! Comparativos estarão disponíveis na página /comparativo**
