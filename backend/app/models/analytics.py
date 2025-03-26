from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Annotated
from datetime import datetime, date
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

class TaskCompletion(BaseModel):
    date: date
    completed: int
    total: int

class UserPerformance(BaseModel):
    user_id: str
    user_name: str
    tasks_completed: int
    tasks_overdue: int
    tasks_total: int
    on_time_percentage: float
    average_completion_time: Optional[float] = None  # In hours

class TeamPerformance(BaseModel):
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int
    completion_rate: float
    tasks_by_priority: Dict[str, int]
    tasks_by_status: Dict[str, int]
    
class UserTaskHeatmap(BaseModel):
    user_id: str
    user_name: str
    missed_tasks_by_day: Dict[str, int]  # Format: "YYYY-MM-DD": count

class AnalyticsDashboard(BaseModel):
    task_completion_trend: List[TaskCompletion]
    user_performances: List[UserPerformance]
    team_performance: TeamPerformance
    user_heatmaps: List[UserTaskHeatmap] 