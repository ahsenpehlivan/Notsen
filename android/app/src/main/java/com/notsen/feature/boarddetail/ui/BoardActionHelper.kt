package com.notsen.feature.boarddetail.ui

import com.notsen.core.model.Column
import com.notsen.core.model.PermissionRole
import com.notsen.core.model.Task

object BoardActionHelper {

    fun canDeleteBoard(role: PermissionRole?): Boolean {
        return role?.canDeleteBoard == true
    }

    fun canRenameBoard(role: PermissionRole?): Boolean {
        return role?.canRenameBoard == true
    }

    fun canEditColumn(role: PermissionRole?): Boolean {
        return role?.canEditColumnsAndTasks == true
    }

    fun getDeleteColumnDialogText(columnId: String, tasksByColumn: Map<String, List<Task>>): String {
        val taskCount = tasksByColumn[columnId]?.size ?: 0
        return if (taskCount > 0) {
            "Bu sütunda $taskCount görev var. Sütun, içindeki görevler ve bu görevlere ait Günüm planları kalıcı olarak silinecek."
        } else {
            "Bu sütun kalıcı olarak silinsin mi?"
        }
    }

    data class RenameResult(
        val shouldCallNetwork: Boolean,
        val newTitle: String,
        val optimisticColumns: List<Column>? = null
    )

    fun prepareRenameColumn(
        columnId: String,
        newTitle: String,
        columns: List<Column>,
        role: PermissionRole?
    ): RenameResult {
        if (role?.canEditColumnsAndTasks != true) {
            return RenameResult(shouldCallNetwork = false, newTitle = "")
        }

        val trimmed = newTitle.trim()
        if (trimmed.isBlank()) {
            return RenameResult(shouldCallNetwork = false, newTitle = "")
        }

        val oldColumn = columns.find { it.id == columnId }
        if (oldColumn == null || oldColumn.title == trimmed) {
            return RenameResult(shouldCallNetwork = false, newTitle = "")
        }

        val optimisticColumns = columns.map { if (it.id == columnId) it.copy(title = trimmed) else it }
        return RenameResult(shouldCallNetwork = true, newTitle = trimmed, optimisticColumns = optimisticColumns)
    }

    fun prepareDeleteColumn(
        columnId: String,
        columns: List<Column>,
        tasksByColumn: Map<String, List<Task>>,
        role: PermissionRole?
    ): Pair<List<Column>, Map<String, List<Task>>>? {
        if (role?.canEditColumnsAndTasks != true) return null

        val newColumns = columns.filter { it.id != columnId }
        val newTasks = tasksByColumn.filterKeys { it != columnId }
        return Pair(newColumns, newTasks)
    }
}
