package com.notsen.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class TaskCommentDto(
    val id: String,
    @SerialName("task_id")
    val taskId: String,
    @SerialName("board_id")
    val boardId: String,
    @SerialName("author_id")
    val authorId: String,
    @SerialName("author_email")
    val authorEmail: String,
    val content: String,
    @SerialName("created_at")
    val createdAt: String,
    @SerialName("legacy_id")
    val legacyId: String? = null
) {
    fun toDomainModel(): TaskComment {
        return TaskComment(
            id = id,
            userEmail = authorEmail,
            text = content,
            createdAt = createdAt
        )
    }
}
