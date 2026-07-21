package com.notsen.feature.boarddetail.ui

import com.notsen.core.model.Column
import com.notsen.core.model.PermissionRole
import com.notsen.core.model.Task
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class BoardActionHelperTest {

    @Test
    fun owner_canDeleteBoard() {
        assertTrue(BoardActionHelper.canDeleteBoard(PermissionRole.OWNER))
    }

    @Test
    fun editorAndViewer_cannotDeleteBoard() {
        assertFalse(BoardActionHelper.canDeleteBoard(PermissionRole.EDITOR))
        assertFalse(BoardActionHelper.canDeleteBoard(PermissionRole.VIEWER))
        assertFalse(BoardActionHelper.canDeleteBoard(null))
    }

    @Test
    fun ownerAndEditor_canEditColumn() {
        assertTrue(BoardActionHelper.canEditColumn(PermissionRole.OWNER))
        assertTrue(BoardActionHelper.canEditColumn(PermissionRole.EDITOR))
    }

    @Test
    fun viewer_cannotEditColumn() {
        assertFalse(BoardActionHelper.canEditColumn(PermissionRole.VIEWER))
    }

    @Test
    fun emptyOrWhitespaceName_rename_producesNoNetworkCall() {
        val result1 = BoardActionHelper.prepareRenameColumn("col1", "", emptyList(), PermissionRole.OWNER)
        assertFalse(result1.shouldCallNetwork)

        val result2 = BoardActionHelper.prepareRenameColumn("col1", "   ", emptyList(), PermissionRole.OWNER)
        assertFalse(result2.shouldCallNetwork)
    }

    @Test
    fun whitespaceName_rename_trimsName() {
        val cols = listOf(Column(id = "col1", boardId = "b1", title = "Old", position = 0))
        val result = BoardActionHelper.prepareRenameColumn("col1", "  New Name  ", cols, PermissionRole.OWNER)
        
        assertTrue(result.shouldCallNetwork)
        assertEquals("New Name", result.newTitle)
        assertEquals("New Name", result.optimisticColumns?.first()?.title)
    }

    @Test
    fun sameName_rename_producesNoNetworkCall() {
        val cols = listOf(Column(id = "col1", boardId = "b1", title = "OldName", position = 0))
        val result = BoardActionHelper.prepareRenameColumn("col1", "OldName", cols, PermissionRole.OWNER)
        assertFalse(result.shouldCallNetwork)
    }

    @Test
    fun viewer_rename_producesNoNetworkCall() {
        val cols = listOf(Column(id = "col1", boardId = "b1", title = "OldName", position = 0))
        val result = BoardActionHelper.prepareRenameColumn("col1", "NewName", cols, PermissionRole.VIEWER)
        assertFalse(result.shouldCallNetwork)
    }

    @Test
    fun prepareDeleteColumn_removesFromList() {
        val cols = listOf(
            Column(id = "col1", boardId = "b1", title = "OldName", position = 0),
            Column(id = "col2", boardId = "b1", title = "Other", position = 1)
        )
        val tasks = mapOf(
            "col1" to listOf(Task(id = "t1", boardId = "b1", columnId = "col1", title = "T", position = 0)),
            "col2" to emptyList()
        )
        
        val result = BoardActionHelper.prepareDeleteColumn("col1", cols, tasks, PermissionRole.OWNER)
        
        assertTrue(result != null)
        assertEquals(1, result!!.first.size)
        assertEquals("col2", result.first[0].id)
        assertFalse(result.second.containsKey("col1"))
    }

    @Test
    fun viewer_deleteColumn_returnsNull() {
        val result = BoardActionHelper.prepareDeleteColumn("col1", emptyList(), emptyMap(), PermissionRole.VIEWER)
        assertNull(result)
    }

    @Test
    fun deleteColumnDialogText_showsTaskLossWarningIfNotEmpty() {
        val tasks = mapOf(
            "col1" to listOf(Task(id = "t1", boardId = "b1", columnId = "col1", title = "T", position = 0), Task(id = "t2", boardId = "b1", columnId = "col1", title = "T2", position = 1)),
            "col2" to emptyList<Task>()
        )
        
        val text1 = BoardActionHelper.getDeleteColumnDialogText("col1", tasks)
        assertEquals("Bu sütunda 2 görev var. Sütun, içindeki görevler ve bu görevlere ait Günüm planları kalıcı olarak silinecek.", text1)
        
        val text2 = BoardActionHelper.getDeleteColumnDialogText("col2", tasks)
        assertEquals("Bu sütun kalıcı olarak silinsin mi?", text2)
        
        val text3 = BoardActionHelper.getDeleteColumnDialogText("col3", tasks)
        assertEquals("Bu sütun kalıcı olarak silinsin mi?", text3)
    }
}
