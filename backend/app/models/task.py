from pydantic import BaseModel, Field
from typing import Optional, List, Annotated
from datetime import datetime
from enum import Enum
from bson import ObjectId
from pydantic_core import core_schema

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate),
                core_schema.is_instance_schema(ObjectId),
            ]),
        ])

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, schema, field_schema):
        field_schema.update(type="string")

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETE = "completed"
    MISSED = "missed"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    priority: TaskPriority = TaskPriority.MEDIUM
    tags: List[str] = []
    status: TaskStatus = TaskStatus.PENDING

class TaskCreate(TaskBase):
    assigned_to: Optional[str] = None

class TaskInDB(TaskBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str  # User ID
    assigned_to: Optional[str] = None  # User ID
    completed_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Task(TaskBase):
    id: str
    created_at: datetime
    updated_at: datetime
    created_by: str  # User ID
    assigned_to: Optional[str] = None  # User ID
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[TaskPriority] = None
    assigned_to: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[TaskStatus] = None 