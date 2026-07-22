package com.notsen.feature.boarddetail.ui

import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class BoardOperationCoordinator(
    private val boardId: String,
    private val getState: () -> BoardDetailUiState,
    private val updateState: ((BoardDetailUiState) -> BoardDetailUiState) -> Unit,
    private val emitNavigation: suspend (NavigationAction) -> Unit,
    private val deleteBoardApi: suspend (String) -> Unit,
    private val deleteColumnApi: suspend (String) -> Unit,
    private val updateColumnApi: suspend (String, String) -> Unit,
    private val updateBoardApi: suspend (String, String) -> Unit,
    private val logActivityApi: suspend (String, String, String, String?, String?, JsonObject?) -> Unit,
    private val updateTaskChecklistApi: suspend (String, String, List<com.notsen.core.model.ChecklistItem>) -> com.notsen.core.model.Task
) {
    suspend fun deleteBoard() {
        if (!BoardActionHelper.canDeleteBoard(getState().currentUserRole)) return

        try {
            deleteBoardApi(boardId)
            emitNavigation(NavigationAction.NavigateBack)
        } catch (e: Exception) {
            updateState { it.copy(error = e.message) }
        }
    }

    suspend fun deleteColumn(columnId: String) {
        val state = getState()
        val helperResult = BoardActionHelper.prepareDeleteColumn(
            columnId = columnId,
            columns = state.columns,
            tasksByColumn = state.tasksByColumn,
            role = state.currentUserRole
        ) ?: return

        val columnTitle = state.columns.find { it.id == columnId }?.title ?: "Sütun"

        try {
            deleteColumnApi(columnId)
            
            // Optimistic UI update
            updateState { s ->
                s.copy(
                    columns = helperResult.first,
                    tasksByColumn = helperResult.second
                )
            }

            // Log activity manually
            try {
                logActivityApi(
                    boardId,
                    "column_deleted",
                    "column",
                    columnId,
                    columnTitle,
                    null
                )
            } catch (e: Exception) {
                // Non-blocking log error
            }
        } catch (e: Exception) {
            updateState { it.copy(error = e.message) }
        }
    }

    suspend fun renameColumn(columnId: String, newTitle: String) {
        val state = getState()
        val helperResult = BoardActionHelper.prepareRenameColumn(
            columnId = columnId,
            newTitle = newTitle,
            columns = state.columns,
            role = state.currentUserRole
        )

        if (!helperResult.shouldCallNetwork) return

        val trimmedTitle = helperResult.newTitle
        val oldColumn = state.columns.find { it.id == columnId } ?: return

        try {
            updateColumnApi(columnId, trimmedTitle)
            
            // Optimistic UI update
            updateState { s ->
                s.copy(columns = helperResult.optimisticColumns ?: s.columns)
            }

            // Log activity manually
            try {
                val metadata = buildJsonObject {
                    put("old_title", oldColumn.title)
                    put("new_title", trimmedTitle)
                }
                logActivityApi(
                    boardId,
                    "column_renamed",
                    "column",
                    columnId,
                    trimmedTitle,
                    metadata
                )
            } catch (e: Exception) {
                // Non-blocking log error
            }
        } catch (e: Exception) {
            updateState { it.copy(error = e.message) }
        }
    }

    suspend fun renameBoard(newTitle: String, oldTitle: String) {
        if (!BoardActionHelper.canRenameBoard(getState().currentUserRole)) return // Owner only
        
        val trimmedTitle = newTitle.trim()
        if (trimmedTitle.isEmpty() || trimmedTitle == oldTitle) return

        try {
            updateBoardApi(boardId, trimmedTitle)
            
            // Log activity manually
            try {
                val metadata = buildJsonObject {
                    put("old_title", oldTitle)
                    put("new_title", trimmedTitle)
                }
                logActivityApi(
                    boardId,
                    "board_renamed",
                    "board",
                    boardId,
                    trimmedTitle,
                    metadata
                )
            } catch (e: Exception) {
                // Non-blocking log error
            }
        } catch (e: Exception) {
            updateState { it.copy(error = e.message) }
        }
    }

    private val checklistSaveLocks = mutableSetOf<String>()

    suspend fun updateTaskChecklist(taskId: String, mutation: com.notsen.feature.boarddetail.domain.ChecklistMutation) {
        val state = getState()
        if (!BoardActionHelper.canEditTask(state.currentUserRole)) return

        if (checklistSaveLocks.contains(taskId)) return

        val task = state.tasksByColumn.values.flatten().find { it.id == taskId } ?: return
        val currentChecklist = task.checklist ?: emptyList()

        val result = com.notsen.feature.boarddetail.domain.ChecklistReducer.reduce(currentChecklist, mutation)
        if (result is com.notsen.feature.boarddetail.domain.ChecklistMutationResult.Rejected) return

        val newChecklist = (result as com.notsen.feature.boarddetail.domain.ChecklistMutationResult.Success).items

        try {
            checklistSaveLocks.add(taskId)
            val updatedTask = updateTaskChecklistApi(boardId, taskId, newChecklist)

            // Update UI state with new task
            updateState { s ->
                val newTasksByColumn = s.tasksByColumn.mapValues { (_, tasks) ->
                    tasks.map { if (it.id == taskId) updatedTask else it }
                }
                s.copy(tasksByColumn = newTasksByColumn)
            }
        } catch (e: Exception) {
            updateState { it.copy(error = e.message) }
        } finally {
            checklistSaveLocks.remove(taskId)
        }
    }
}
