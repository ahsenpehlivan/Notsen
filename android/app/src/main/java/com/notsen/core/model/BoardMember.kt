package com.notsen.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class BoardMember(
    @SerialName("id") val id: String = "",
    @SerialName("board_id") val boardId: String = "",
    @SerialName("user_email") val userEmail: String = "",
    @SerialName("role") val role: PermissionRole = PermissionRole.VIEWER,
    @SerialName("created_at") val createdAt: String = ""
)
