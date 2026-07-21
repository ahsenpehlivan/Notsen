package com.notsen.core.model

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PermissionRoleTest {

    @Test
    fun owner_hasAllPermissions() {
        val role = PermissionRole.OWNER
        assertTrue("Owner should be able to edit board", role.canEditBoard)
        assertTrue("Owner should be able to delete board", role.canDeleteBoard)
        assertTrue("Owner should be able to manage members", role.canManageMembers)
        assertTrue("Owner should be able to edit columns and tasks", role.canEditColumnsAndTasks)
        assertTrue("Owner should be able to drag and drop", role.canDragAndDrop)
    }

    @Test
    fun editor_hasOnlyColumnAndTaskPermissions() {
        val role = PermissionRole.EDITOR
        assertFalse("Editor should not be able to edit board", role.canEditBoard)
        assertFalse("Editor should not be able to delete board", role.canDeleteBoard)
        assertFalse("Editor should not be able to manage members", role.canManageMembers)
        assertTrue("Editor should be able to edit columns and tasks", role.canEditColumnsAndTasks)
        assertTrue("Editor should be able to drag and drop", role.canDragAndDrop)
    }

    @Test
    fun viewer_hasNoPermissions() {
        val role = PermissionRole.VIEWER
        assertFalse("Viewer should not be able to edit board", role.canEditBoard)
        assertFalse("Viewer should not be able to delete board", role.canDeleteBoard)
        assertFalse("Viewer should not be able to manage members", role.canManageMembers)
        assertFalse("Viewer should not be able to edit columns and tasks", role.canEditColumnsAndTasks)
        assertFalse("Viewer should not be able to drag and drop", role.canDragAndDrop)
    }
}
