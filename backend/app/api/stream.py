from fastapi import APIRouter

router = APIRouter()


@router.get("/stream/{file_id}")
async def stream_audio(file_id: str):
    return {"message": "not implemented"}
