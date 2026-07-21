package com.notsen.feature.boarddetail.ui

import com.notsen.core.model.Column
import com.notsen.core.model.PermissionRole
import com.notsen.core.model.Task
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.JsonObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class BoardOperationCoordinatorTest {

    @Test
    fun owner_deleteBoard_success_emitsNavigation() = runBlocking {
        var navigationEmitted = false
        var state = BoardDetailUiState(currentUserRole = PermissionRole.OWNER)
        
        val coordinator = BoardOperationCoordinator(
            boardId = "b1",
            getState = { state },
            updateState = { state = it(state) },
            emitNavigation = { navigationEmitted = true },
            updateBoardApi = { _, _ -> },
            deleteBoardApi = { /* success */ },
            deleteColumnApi = { },
            updateColumnApi = { _, _ -> },
            logActivityApi = { _, _, _, _, _, _ -> }
        )

        coordinator.deleteBoard()

        assertTrue(navigationEmitted)
        assertNull(state.error)
    }

    @Test
    fun owner_deleteBoard_failure_updatesError_noNavigation() = runBlocking {
        var navigationEmitted = false
        var state = BoardDetailUiState(currentUserRole = PermissionRole.OWNER)
        
        val coordinator = BoardOperationCoordinator(
            boardId = "b1",
            getState = { state },
            updateState = { state = it(state) },
            emitNavigation = { navigationEmitted = true },
            updateBoardApi = { _, _ -> },
            deleteBoardApi = { throw Exception("API Error") },
            deleteColumnApi = { },
            updateColumnApi = { _, _ -> },
            logActivityApi = { _, _, _, _, _, _ -> }
        )

        coordinator.deleteBoard()

        assertEquals(false, navigationEmitted)
        assertEquals("API Error", state.error)
    }

    @Test
    fun editor_deleteBoard_ignored() = runBlocking {
        var apiCalled = false
        var state = BoardDetailUiState(currentUserRole = PermissionRole.EDITOR)
        
        val coordinator = BoardOperationCoordinator(
            boardId = "b1",
            getState = { state },
            updateState = { state = it(state) },
            emitNavigation = { },
            updateBoardApi = { _, _ -> },
            deleteBoardApi = { apiCalled = true },
            deleteColumnApi = { },
            updateColumnApi = { _, _ -> },
            logActivityApi = { _, _, _, _, _, _ -> }
        )

        coordinator.deleteBoard()

        assertEquals(false, apiCalled)
    }

    @Test
    fun owner_deleteColumn_success_updatesStateAndLogs() = runBlocking {
        var logCalled = false
        val initialCols = listOf(Column(id = "c1", boardId = "b1", title = "Col1", position = 0))
        var state = BoardDetailUiState(
            currentUserRole = PermissionRole.OWNER,
            columns = initialCols,
            tasksByColumn = mapOf("c1" to emptyList())
        )
        
        val coordinator = BoardOperationCoordinator(
            boardId = "b1",
            getState = { state },
            updateState = { state = it(state) },
            emitNavigation = { },
            updateBoardApi = { _, _ -> },
            deleteBoardApi = { },
            deleteColumnApi = { /* success */ },
            updateColumnApi = { _, _ -> },
            logActivityApi = { bId, action, _, eId, _, _ -> 
                if (action == "column_deleted" && eId == "c1") logCalled = true
            }
        )

        coordinator.deleteColumn("c1")

        assertTrue(state.columns.isEmpty())
        assertTrue(logCalled)
    }

    @Test
    fun owner_deleteColumn_failure_preservesState() = runBlocking {
        var logCalled = false
        val initialCols = listOf(Column(id = "c1", boardId = "b1", title = "Col1", position = 0))
        var state = BoardDetailUiState(
            currentUserRole = PermissionRole.OWNER,
            columns = initialCols,
            tasksByColumn = mapOf("c1" to emptyList())
        )
        
        val coordinator = BoardOperationCoordinator(
            boardId = "b1",
            getState = { state },
            updateState = { state = it(state) },
            emitNavigation = { },
            updateBoardApi = { _, _ -> },
            deleteBoardApi = { },
            deleteColumnApi = { throw Exception("API Error") },
            updateColumnApi = { _, _ -> },
            logActivityApi = { _, _, _, _, _, _ -> logCalled = true }
        )

        coordinator.deleteColumn("c1")

        assertEquals(1, state.columns.size)
        assertEquals(false, logCalled)
        assertEquals("API Error", state.error)
    }

    @Test
    fun owner_renameColumn_success_updatesStateAndLogs() = runBlocking {
        var logCalled = false
        val initialCols = listOf(Column(id = "c1", boardId = "b1", title = "Old", position = 0))
        var state = BoardDetailUiState(
            currentUserRole = PermissionRole.OWNER,
            columns = initialCols
        )
        
        val coordinator = BoardOperationCoordinator(
            boardId = "b1",
            getState = { state },
            updateState = { state = it(state) },
            emitNavigation = { },
            updateBoardApi = { _, _ -> },
            deleteBoardApi = { },
            deleteColumnApi = { },
            updateColumnApi = { _, _ -> /* success */ },
            logActivityApi = { _, action, _, _, _, _ -> 
                if (action == "column_renamed") logCalled = true
            }
        )

        coordinator.renameColumn("c1", "New")

        assertEquals("New", state.columns.first().title)
        assertTrue(logCalled)
    }

    @Test
    fun owner_renameColumn_failure_preservesOldName() = runBlocking {
        val initialCols = listOf(Column(id = "c1", boardId = "b1", title = "Old", position = 0))
        var state = BoardDetailUiState(
            currentUserRole = PermissionRole.OWNER,
            columns = initialCols
        )
        
        val coordinator = BoardOperationCoordinator(
            boardId = "b1",
            getState = { state },
            updateState = { state = it(state) },
            emitNavigation = { },
            updateBoardApi = { _, _ -> },
            deleteBoardApi = { },
            deleteColumnApi = { },
            updateColumnApi = { _, _ -> throw Exception("API Error") },
            logActivityApi = { _, _, _, _, _, _ -> }
        )

        coordinator.renameColumn("c1", "New")

        assertEquals("Old", state.columns.first().title)
        assertEquals("API Error", state.error)
    }
}
