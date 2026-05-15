from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi import Depends
from pathlib import Path
import uuid

from app.utils.security import require_admin

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("", status_code=201)
async def upload_file(file: UploadFile = File(...), _=Depends(require_admin)):
    try:
        ext = Path(file.filename).suffix or ""
        fname = f"{uuid.uuid4().hex}{ext}"
        dest = UPLOAD_DIR / fname
        with dest.open("wb") as f:
            content = await file.read()
            f.write(content)
        return {"url": f"/static/uploads/{fname}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
