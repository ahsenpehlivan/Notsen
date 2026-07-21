package com.notsen.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class PermissionRole {
    @SerialName("owner")
    OWNER,

    @SerialName("editor")
    EDITOR,

    @SerialName("viewer")
    VIEWER;

    val canEditBoard: Boolean
        get() = this == OWNER

    val canRenameBoard: Boolean
        get() = this == OWNER

    val canDeleteBoard: Boolean
        get() = this == OWNER

    val canManageMembers: Boolean
        get() = this == OWNER

    val canEditColumnsAndTasks: Boolean
        get() = this == OWNER || this == EDITOR

    val canDragAndDrop: Boolean
        get() = this == OWNER || this == EDITOR
}
