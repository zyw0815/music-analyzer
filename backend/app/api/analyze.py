from fastapi import APIRouter

router = APIRouter()


@router.post("/analyze")
async def analyze_file():
    return {"message": "not implemented"}


@router.post("/analyze/basic")
async def analyze_basic():
    return {"message": "not implemented"}
