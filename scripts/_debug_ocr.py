from pathlib import Path
from dotenv import load_dotenv
from app.services.processing import extract_text_from_upload

load_dotenv()

paths = [
    Path(r"C:\Users\Ellen\OneDrive\Documentos\Testes\gdg.pdf"),
    Path(r"C:\Users\Ellen\OneDrive\Documentos\Testes\ingressos.pdf"),
    Path(r"C:\Users\Ellen\OneDrive\Documentos\Testes\vercel.pdf"),
]

for path in paths:
    print("\n===", path.name, "===")
    if not path.exists():
        print("NAO ENCONTRADO")
        continue
    data = path.read_bytes()
    text = extract_text_from_upload(path.name, data)
    print("len:", len(text))
    print("preview:", text[:300].replace("\n", " "))
