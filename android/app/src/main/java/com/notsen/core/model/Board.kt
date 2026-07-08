package com.notsen.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonArray

@Serializable
data class BoardLabel(
    val id: String = "",
    val name: String = "",
    val color: String = ""
)

@Serializable
data class Board(
    val id: String = "",
    val title: String = "",
    @SerialName("user_id")
    val userId: String? = null,
    val labels: JsonArray? = null,
    val position: Int? = 0
)

@Serializable
data class Column(
    val id: String = "",
    @SerialName("board_id")
    val boardId: String = "",
    val title: String = "",
    val position: Int? = 0
)

@Serializable
data class ChecklistItem(
    val id: String = "",
    val text: String = "",
    val done: Boolean = false
)

@Serializable
data class TaskComment(
    val id: String = "",
    @SerialName("user_email")
    val userEmail: String = "",
    val text: String = "",
    @SerialName("created_at")
    val createdAt: String = ""
)

@Serializable
data class Task(
    val id: String = "",
    @SerialName("board_id")
    val boardId: String = "",
    @SerialName("column_id")
    val columnId: String = "",
    val title: String = "",
    val description: String = "",
    @SerialName("due_date")
    val dueDate: String? = null,
    val tags: List<String>? = emptyList(),
    val assignee: String? = null,
    val checklist: List<ChecklistItem>? = emptyList(),
    val comments: List<TaskComment>? = emptyList(),
    val position: Int? = 0
)
