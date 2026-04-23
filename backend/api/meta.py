from fastapi import APIRouter, HTTPException


router = APIRouter()


@router.get("/roles")
def get_roles():
    raise HTTPException(status_code=501, detail="not_implemented")


@router.get("/filters")
def get_filters():
    raise HTTPException(status_code=501, detail="not_implemented")


@router.get("/periods")
def get_periods():
    raise HTTPException(status_code=501, detail="not_implemented")


@router.get("/system")
def get_system_meta():
    raise HTTPException(status_code=501, detail="not_implemented")
