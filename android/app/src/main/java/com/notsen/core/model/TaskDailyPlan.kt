package com.notsen.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class TaskDailyPlan(
    val id: String = "",
    @SerialName("user_id")
    val userId: String = "",
    @SerialName("task_id")
    val taskId: String = "",
    @SerialName("planned_date")
    val plannedDate: String = "",
    @SerialName("created_at")
    val createdAt: String = ""
)
