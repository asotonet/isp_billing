import uuid
from datetime import datetime
from pydantic import BaseModel


class RouterEventBase(BaseModel):
    event_type: str
    description: str
    event_metadata: dict | None = None


class RouterEventResponse(RouterEventBase):
    id: uuid.UUID
    router_id: uuid.UUID
    router_nombre: str | None = None
    router_ip: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
