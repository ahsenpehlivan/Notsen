package com.notsen.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class ActivityLog(
    @SerialName("id") val id: String,
    @SerialName("board_id") val boardId: String,
    @SerialName("user_email") val userEmail: String? = null,
    @SerialName("action") val action: String,
    @SerialName("entity_type") val entityType: String,
    @SerialName("entity_id") val entityId: String? = null,
    @SerialName("entity_title") val entityTitle: String? = null,
    @SerialName("metadata") val metadata: JsonObject? = null,
    @SerialName("created_at") val createdAt: String
)
