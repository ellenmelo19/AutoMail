from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv

from app.services.processing import analyze_email, extract_text_from_upload

load_dotenv()

app = FastAPI(title="AutoMail")

templates = Jinja2Templates(directory="app/templates")
app.mount("/static", StaticFiles(directory="app/static"), name="static")


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
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "result": None,
                "error": "Informe um texto ou envie um arquivo válido.",
            },
        )

    result = analyze_email(source=source, raw_text=email_text)
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "result": result, "error": None},
    )
