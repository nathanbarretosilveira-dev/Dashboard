# Dashboard Comercial BWT

Projeto React + Vite com Tailwind para visualização dos indicadores comerciais.

## Fonte de dados
A base de dados vem da planilha local:

- `Indicador Comercial 04.2026.xlsx`

Para regenerar o arquivo consumido pelo front-end:

```bash
python utils/build_bwt_data.py
```

Isso atualiza `src/lib/bwtData.js`.

## Execução local
```bash
npm install
npm run dev
```

## Build de produção
```bash
npm run build
npm run preview
```

## Deploy
### Vercel
Este repositório já possui `vercel.json` com:
- build `npm run build`
- output `dist`
- rewrite SPA para `index.html`

### Netlify
Este repositório já possui `netlify.toml` com:
- build `npm run build`
- publish `dist`
- redirect SPA para `index.html`
