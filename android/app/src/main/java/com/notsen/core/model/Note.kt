package com.notsen.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Note(
    val id: String = "",
    @SerialName("user_id")
    val userId: String = "",
    val content: String = "",
    val tags: List<String> = emptyList(),
    @SerialName("created_at")
    val createdAt: String = "",
    @SerialName("updated_at")
    val updatedAt: String = "",
    val archived: Boolean = false,
    @SerialName("converted_task_id")
    val convertedTaskId: String? = null
)
