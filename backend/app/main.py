from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import VERSION
from app.api import analyze, stream

app = FastAPI(title="Music Analyzer API", version=VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:9211"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api")
app.include_router(stream.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "version": VERSION}
