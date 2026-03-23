import os
from pathlib import Path

from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from app.services.processing import analyze_email, extract_text_from_upload, ocr_is_available

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

app = FastAPI(title="AutoMail")

templates = Jinja2Templates(directory="app/templates")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

ALLOWED_EXTENSIONS = {".txt", ".pdf"}
if os.getenv("DEBUG_OCR") == "1":
    @app.get("/debug/ocr")
    def debug_ocr():
        return {
            "ocr_available": ocr_is_available(),
            "tesseract_cmd": os.getenv("TESSERACT_CMD"),
            "tessdata_prefix": os.getenv("TESSDATA_PREFIX"),
            "ocr_lang": os.getenv("OCR_LANG", "por"),
            "ocr_config": os.getenv("OCR_CONFIG", "--psm 6"),
        }



class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1)
    source: str | None = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "result": None, "error": None},
    )


@app.post("/process", response_class=HTMLResponse)
async def process(
    request: Request,
    email_text: str = Form(""),
    file: UploadFile | None = File(None),
):
    email_text = email_text.strip()
    source = "texto"

    if file and file.filename:
        filename = file.filename.lower()
        if not any(filename.endswith(ext) for ext in ALLOWED_EXTENSIONS):
            return templates.TemplateResponse(
                "index.html",
                {
                    "request": request,
                    "result": None,
                    "error": "Formato inválido. Envie apenas arquivos .txt ou .pdf.",
                },
            )
        data = await file.read()
        if not data:
            return templates.TemplateResponse(
                "index.html",
                {
                    "request": request,
                    "result": None,
                    "error": "Arquivo vazio. Envie um .txt ou .pdf com conteúdo.",
                },
            )
        source = file.filename
        email_text = extract_text_from_upload(file.filename, data).strip()

    if not email_text:
        if file and file.filename and file.filename.lower().endswith(".pdf"):
            if ocr_is_available():
                error_message = (
                    "Não conseguimos extrair texto do PDF mesmo com OCR. "
                    "Se possível, cole o texto manualmente."
                )
            else:
                error_message = (
                    "PDF parece ser imagem. OCR não está disponível no ambiente. "
                    "Habilite OCR (ver README) ou cole o texto manualmente."
                )
        else:
            error_message = "Informe um texto ou envie um arquivo válido."
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "result": None,
                "error": error_message,
            },
        )

    result = analyze_email(source=source, raw_text=email_text)
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "result": result, "error": None},
    )


@app.post("/api/analyze")
async def api_analyze(payload: AnalyzeRequest):
    result = analyze_email(
        source=payload.source or "texto",
        raw_text=payload.text,
    )
    return {
        "classification": result.classification,
        "response": result.response,
        "word_count": result.word_count,
        "engine": result.engine,
        "source": result.source,
        "cleaned_text": result.cleaned_text,
    }


@app.post("/api/analyze-file")
async def api_analyze_file(file: UploadFile = File(...)):
    if not file.filename:
        return {"error": "Envie um arquivo válido (.txt ou .pdf)."}

    filename = file.filename.lower()
    if not any(filename.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        return {"error": "Formato inválido. Envie apenas arquivos .txt ou .pdf."}

    data = await file.read()
    if not data:
        return {"error": "Arquivo vazio. Envie um .txt ou .pdf com conteúdo."}

    extracted = extract_text_from_upload(file.filename, data).strip()
    if not extracted:
        if ocr_is_available():
            return {
                "error": (
                    "Não conseguimos extrair texto do PDF mesmo com OCR. "
                    "Se possível, cole o texto manualmente."
                )
            }
        return {
            "error": (
                "PDF parece ser imagem. OCR não está disponível no ambiente. "
                "Habilite OCR (ver README) ou cole o texto manualmente."
            )
        }

    result = analyze_email(source=file.filename, raw_text=extracted)
    return {
        "classification": result.classification,
        "response": result.response,
        "word_count": result.word_count,
        "engine": result.engine,
        "source": result.source,
        "cleaned_text": result.cleaned_text,
    }

