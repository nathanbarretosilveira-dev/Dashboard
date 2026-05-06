from __future__ import annotations

import json
import math
import re
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
import requests
import time

# Caminhos FIXOS das planilhas (Windows)
XLSX_PATHS = [
    Path(r"C:\Users\NATHAN.G\OneDrive - Grupo Potencial\INDICADOR COMERCIAL\Indicador Comercial 04.2026.xlsx"),
    Path(r"C:\Users\NATHAN.G\OneDrive - Grupo Potencial\INDICADOR COMERCIAL\Indicador Comercial 05.2026.xlsx"),
]

# Mantém saída no projeto
ROOT = Path(__file__).resolve().parents[1]
OUT_PATH = ROOT / "src/lib/bwtData.js"

# API Backend
API_BASE_URL = "http://localhost:3001/api"
API_TIMEOUT = 5

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


def _normalize_label(value: str) -> str:
    value = value.strip().lower()
    value = (
        value.replace("ô", "o")
        .replace("ó", "o")
        .replace("á", "a")
        .replace("ã", "a")
        .replace("ç", "c")
        .replace("í", "i")
        .replace("é", "e")
        .replace("ú", "u")
    )
    value = re.sub(r"[^a-z0-9]+", "_", value)
    return value.strip("_")


def _safe_float(value, default=0.0):
    if value is None or value == "":
        return default
    try:
        if isinstance(value, str):
            value = value.strip().replace(".", "").replace(",", ".") if "," in value and "." in value else value
        v = float(value)
        if math.isnan(v) or math.isinf(v):
            return default
        return v
    except Exception:
        return default


def _excel_date_to_br(value):
    num = _safe_float(value, default=None)
    if num is None:
        return str(value or "")
    base = datetime(1899, 12, 30)
    dt = base + timedelta(days=num)
    return dt.strftime("%d/%m/%Y")


def _load_workbook_sheets(path: Path):
    z = zipfile.ZipFile(path)

    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        sst = ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in sst.findall("a:si", NS):
            text = "".join(t.text or "" for t in si.findall(".//a:t", NS))
            shared.append(text)

    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    relmap = {r.attrib["Id"]: r.attrib["Target"] for r in rels}

    sheets = {}
    for sheet in wb.findall("a:sheets/a:sheet", NS):
        name = sheet.attrib["name"]
        rid = sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
        target = "xl/" + relmap[rid]
        ws = ET.fromstring(z.read(target))

        rows = []
        for row in ws.findall("a:sheetData/a:row", NS):
            row_map = {}
            for c in row.findall("a:c", NS):
                ref = c.attrib.get("r", "")
                col = re.sub(r"\d", "", ref)
                t = c.attrib.get("t")
                v = c.find("a:v", NS)
                value = v.text if v is not None else ""
                if t == "s" and value != "":
                    value = shared[int(value)]
                row_map[col] = value
            rows.append(row_map)
        sheets[name] = rows
    return sheets


def _rows_with_headers(rows, header_row_index=0):
    if not rows or len(rows) <= header_row_index:
        return []
    header_row = rows[header_row_index]
    ordered_cols = sorted(header_row.keys(), key=lambda x: (len(x), x))
    headers = {col: _normalize_label(str(header_row.get(col, ""))) for col in ordered_cols if header_row.get(col)}

    out = []
    for row in rows[header_row_index + 1 :]:
        item = {}
        for col, key in headers.items():
            item[key] = row.get(col, "")
        if any((str(v).strip() for v in item.values())):
            out.append(item)
    return out


def build_data(path: Path):
    sheets = _load_workbook_sheets(path)

    # Ler KPI resumidos diretamente das primeiras linhas (após header)
    bwt_sheet = sheets.get("BWT", [])
    ebitda_bwt = 0.0
    ebitda_subcontratado = 0.0
    resultado_total = 0.0
    
    # Linha 0: EBITDA BWT (coluna W, valor em X)
    if len(bwt_sheet) > 0:
        row0 = bwt_sheet[0]
        if "EBITDA BWT" in str(row0.get("W", "")):
            ebitda_bwt = _safe_float(row0.get("X", 0))
    
    # Linha 1: EBITDA SUBCONTRATADO (coluna W, valor em X)
    if len(bwt_sheet) > 1:
        row1 = bwt_sheet[1]
        if "EBITDA SUBCONTRATADO" in str(row1.get("W", "")):
            ebitda_subcontratado = _safe_float(row1.get("X", 0))
    
    # Linha 2: RESULTADO (coluna W, valor em X)
    if len(bwt_sheet) > 2:
        row2 = bwt_sheet[2]
        if "RESULTADO" in str(row2.get("W", "")):
            resultado_total = _safe_float(row2.get("X", 0))

    bwt_rows = _rows_with_headers(sheets.get("BWT", []), 0)
    fat_rows = _rows_with_headers(sheets.get("Faturamento", []), 0)
    tele_rows = _rows_with_headers(sheets.get("Telemetria Sighra", []), 0)
    rotas_rows = _rows_with_headers(sheets.get("Rotas", []), 0)

    frota_veiculos = []
    # Processar dados de frota
    for row in bwt_rows:
        placa = str(row.get("placa", "")).strip()
        if not placa:
            continue
        item = {
            "modelo": str(row.get("modelo", "")).strip(),
            "ano": int(_safe_float(row.get("ano"), 0)),
            "placa": placa,
            "rota": str(row.get("rota", "")).strip(),
            "motorista": str(row.get("motorista", "")).strip(),
            "kmCarregado": _safe_float(row.get("km_carregado")),
            "kmVazio": _safe_float(row.get("km_vazio")),
            "hodometro": _safe_float(row.get("hodometro")),
            "faturamento": _safe_float(row.get("faturamento")),
            "ebitdaEstimado": _safe_float(row.get("ebitda_estimado")),
            "ebitdaAtingido": _safe_float(row.get("ebitda_atingido")),
            "resultado": _safe_float(row.get("resultado")),
            "margem": _safe_float(row.get("margem"), default=None),
            "kmL": _safe_float(row.get("media_km_l")),
            "litros": _safe_float(row.get("litros_consumidos")),
        }
        frota_veiculos.append(item)

    faturamento_data = []
    fat_by_day = defaultdict(lambda: {"bwt": 0.0, "subcontratado": 0.0})

    for row in fat_rows:
        cte = str(row.get("cte", "")).strip()
        if not cte:
            continue
        empresa = str(row.get("empresa", "")).strip() or "BWT"
        valor = _safe_float(row.get("valor_total"))
        pedagio = _safe_float(row.get("pedagio"))
        
        # Ler placa: primeiramente tenta coluna "cavalo" (AC)
        placa = str(row.get("cavalo", "")).strip()
        
        # Se cavalo for "0" ou vazio, é subcontratado - usa a coluna "placas"
        if placa == "0" or placa == "":
            placas_raw = str(row.get("placas", "")).strip()
            placa = placas_raw.split("-")[0].strip() if placas_raw else ""

        record = {
            "cte": cte,
            "data": _excel_date_to_br(row.get("data")),
            "motorista": str(row.get("motorista", "")).strip(),
            "placa": placa,
            "rota": str(row.get("rota", "")).strip(),
            "tomador": str(row.get("tomador", "")).strip(),
            "quantidade": _safe_float(row.get("quantidade")),
            "peso": _safe_float(row.get("peso")),
            "valorTotal": valor,
            "pedagio": pedagio,
            "empresa": empresa,
        }
        faturamento_data.append(record)

        day = record["data"][:2] if record["data"] else "--"
        if empresa.upper() == "BWT":
            fat_by_day[day]["bwt"] += valor
        else:
            fat_by_day[day]["subcontratado"] += valor

    faturamento_por_dia = [
        {"dia": d, "bwt": v["bwt"], "subcontratado": v["subcontratado"], "faturamento": v["bwt"] + v["subcontratado"]}
        for d, v in sorted(fat_by_day.items(), key=lambda t: int(t[0]) if t[0].isdigit() else 99)
        if d != "--"
    ]

    rota_agg = defaultdict(lambda: {"viagens": 0, "valorTotal": 0.0})
    for row in faturamento_data:
        rota = row["rota"] or "SEM ROTA"
        rota_agg[rota]["viagens"] += 1
        rota_agg[rota]["valorTotal"] += row["valorTotal"]
    rotas_realizadas = [
        {"rota": rota, "viagens": v["viagens"], "valorTotal": v["valorTotal"]}
        for rota, v in sorted(rota_agg.items(), key=lambda t: t[1]["valorTotal"], reverse=True)
    ]

    rotas_catalogo = []
    for row in rotas_rows:
        rota = str(row.get("rota", "")).strip()
        if not rota:
            continue
        rotas_catalogo.append(
            {
                "origem": str(row.get("origem", "")).strip(),
                "destino": str(row.get("destino", "")).strip(),
                "rota": rota,
                "km": _safe_float(row.get("km")),
                "pedagios": int(_safe_float(row.get("pedagios"))),
                "valorPedagios": _safe_float(row.get("valor_pedagios")),
            }
        )

    telemetria_data = []
    for row in tele_rows:
        placa = str(row.get("placa", "")).strip()
        if not placa:
            continue
        telemetria_data.append(
            {
                "motorista": str(row.get("motorista_1") or row.get("motorista") or "").strip(),
                "placa": placa,
                "kmRodado": _safe_float(row.get("km_rodado")),
                "litros": _safe_float(row.get("consumo_em_litros")),
                "media": _safe_float(row.get("media"), default=_safe_float(row.get("consumo_medio"))),
                "motorParado": _safe_float(row.get("motor_ligado_parado")),
                "faixaVerde": _safe_float(row.get("tempo_faixa_verde")),
                "faixaAzul": _safe_float(row.get("tempo_faixa_azul")),
                "faixaAmarela": _safe_float(row.get("tempo_faixa_amarela")),
                "faixaVermelha": _safe_float(row.get("tempo_faixa_vermelha")),
            }
        )

    data = {
        "kpiGeral": {
            "ebitdaBWT": ebitda_bwt,
            "ebitdaSubcontratado": ebitda_subcontratado,
            "resultadoTotal": resultado_total,
        },
        "faturamentoPorDia": faturamento_por_dia,
        "rotasRealizadas": rotas_realizadas,
        "frotaVeiculos": frota_veiculos,
        "faturamentoData": faturamento_data,
        "rotasCatalogo": rotas_catalogo,
        "telemetriaData": telemetria_data,
    }
    return data


def _extract_mes_ano_from_filename(path: Path):
    """Extrai mês e ano do nome do arquivo. Ex: 'Indicador Comercial 04.2026.xlsx' -> ('04', '2026')"""
    name = path.stem  # Remove .xlsx
    # Procura por padrão MM.YYYY ou MM.YY no nome
    match = re.search(r'(\d{2})\.(\d{4})', name)
    if match:
        mes, ano = match.groups()
        return mes, ano
    return None, None


def _import_to_api(data: dict, mes: str, ano: str):
    """Importa dados para o banco via API. Se falhar, retorna None."""
    try:
        print(f"Enviando dados para o banco de dados ({mes}/{ano})...")
        payload = {
            "mes": mes,
            "ano": ano,
            "kpiGeral": data["kpiGeral"],
            "faturamentoPorDia": data["faturamentoPorDia"],
            "rotasRealizadas": data["rotasRealizadas"],
            "frotaVeiculos": data["frotaVeiculos"],
            "faturamentoData": data["faturamentoData"],
            "rotasCatalogo": data["rotasCatalogo"],
            "telemetriaData": data["telemetriaData"],
            "sobrescrever": True,
        }
        
        response = requests.post(f"{API_BASE_URL}/importar", json=payload, timeout=API_TIMEOUT)
        
        if response.status_code == 201:
            print(f"✓ Dados importados com sucesso: {mes}/{ano}")
            return True
        elif response.status_code == 400:
            resp_json = response.json()
            print(f"⚠ {resp_json['error']}")
            print(f"→ Usando dados existentes do banco de dados")
            return False
        else:
            print(f"✗ Erro ao importar: {response.status_code}")
            return None
    except requests.exceptions.ConnectionError:
        print(f"✗ Erro: Não foi possível conectar ao servidor em {API_BASE_URL}")
        print(f"  Verifique se o servidor está rodando com: npm run server:dev")
        return None
    except Exception as e:
        print(f"✗ Erro ao importar dados: {e}")
        return None


def _fetch_from_api(mes: str, ano: str):
    """Busca dados do banco via API."""
    try:
        response = requests.get(f"{API_BASE_URL}/mes/{mes}/{ano}", timeout=API_TIMEOUT)
        if response.status_code == 200:
            return response.json()["data"]
        else:
            print(f"✗ Erro ao buscar dados: {response.status_code}")
            return None
    except Exception as e:
        print(f"✗ Erro ao buscar dados: {e}")
        return None


def main():
    if not XLSX_PATHS:
        print("✗ Erro: Nenhum caminho de planilha configurado em XLSX_PATHS")
        return

    latest_data = None
    latest_mes = None
    latest_ano = None
    latest_path = None

    for xlsx_path in XLSX_PATHS:
        # 1. Extrair dados da planilha
        data = build_data(xlsx_path)

        # 2. Extrair mês e ano do nome do arquivo
        mes, ano = _extract_mes_ano_from_filename(xlsx_path)
        if not mes or not ano:
            print(f"✗ Erro: Não foi possível extrair mês/ano do nome do arquivo: {xlsx_path.name}")
            print("  Formato esperado: 'Indicador Comercial MM.YYYY.xlsx'")
            return

        print(f"\n📊 Processando dados do mês: {mes}/{ano}")
        print(f"📁 Arquivo: {xlsx_path.name}\n")

        # 3. Tentar importar para o banco
        import_result = _import_to_api(data, mes, ano)

        # 4. Se não importou (dados já existem), buscar do banco
        if import_result is False:
            print("Buscando dados existentes do banco...")
            data = _fetch_from_api(mes, ano)
            if data is None:
                print("✗ Erro: Não foi possível obter dados do banco")
                return
        elif import_result is None:
            print("⚠ Aviso: Prosseguindo com dados da planilha (banco não disponível)")

        latest_data = data
        latest_mes = mes
        latest_ano = ano
        latest_path = xlsx_path

    # 5. Gerar arquivo JS com os dados do último mês processado
    filename = latest_path.name.replace(".xlsx", "")
    contents = (
        f"// Arquivo gerado automaticamente a partir da planilha '{filename}.xlsx'\n"
        f"// Período: {latest_mes}/{latest_ano}\n"
        f"// Última atualização: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n"
        "// Execute: python utils/build_bwt_data.py\n\n"
        f"export const kpiGeral = {json.dumps(latest_data['kpiGeral'] if isinstance(latest_data, dict) else latest_data.get('kpiGeral', {}), ensure_ascii=False, indent=2)};\n\n"
        f"export const faturamentoPorDia = {json.dumps(latest_data['faturamentoPorDia'] if isinstance(latest_data, dict) else latest_data.get('faturamentoPorDia', []), ensure_ascii=False, indent=2)};\n\n"
        f"export const rotasRealizadas = {json.dumps(latest_data['rotasRealizadas'] if isinstance(latest_data, dict) else latest_data.get('rotasRealizadas', []), ensure_ascii=False, indent=2)};\n\n"
        f"export const frotaVeiculos = {json.dumps(latest_data['frotaVeiculos'] if isinstance(latest_data, dict) else latest_data.get('frotaVeiculos', []), ensure_ascii=False, indent=2)};\n\n"
        f"export const faturamentoData = {json.dumps(latest_data['faturamentoData'] if isinstance(latest_data, dict) else latest_data.get('faturamentoData', []), ensure_ascii=False, indent=2)};\n\n"
        f"export const rotasCatalogo = {json.dumps(latest_data['rotasCatalogo'] if isinstance(latest_data, dict) else latest_data.get('rotasCatalogo', []), ensure_ascii=False, indent=2)};\n\n"
        f"export const telemetriaData = {json.dumps(latest_data['telemetriaData'] if isinstance(latest_data, dict) else latest_data.get('telemetriaData', []), ensure_ascii=False, indent=2)};\n"
    )
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(contents, encoding="utf-8")
    print(f"\n✓ Dados gerados em: {OUT_PATH}")
    print(f"✓ Período: {latest_mes}/{latest_ano}")


if __name__ == "__main__":
    main()
