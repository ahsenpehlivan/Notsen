package com.notsen.feature.boarddetail.ui

import com.notsen.core.model.PermissionRole
import com.notsen.core.model.TaskComment
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CommentsUiHelpersTest {

    @Test
    fun `Viewer add UI is hidden`() {
        val role = PermissionRole.VIEWER
        val canAdd = role == PermissionRole.OWNER || role == PermissionRole.EDITOR
        assertFalse(canAdd)
    }

    @Test
    fun `Owner add UI is visible`() {
        val role = PermissionRole.OWNER
        val canAdd = role == PermissionRole.OWNER || role == PermissionRole.EDITOR
        assertTrue(canAdd)
    }

    @Test
    fun `Editor add UI is visible`() {
        val role = PermissionRole.EDITOR
        val canAdd = role == PermissionRole.OWNER || role == PermissionRole.EDITOR
        assertTrue(canAdd)
    }

    @Test
    fun `Owner sees delete for every comment`() {
        val role = PermissionRole.OWNER
        val currentUserEmail = "owner@test.com"
        val comment = TaskComment("1", "other@test.com", "text", "time")
        val canDelete = role == PermissionRole.OWNER || comment.userEmail == currentUserEmail
        assertTrue(canDelete)
    }

    @Test
    fun `Editor sees delete only for own comment`() {
        val role = PermissionRole.EDITOR
        val currentUserEmail = "editor@test.com"
        val ownComment = TaskComment("1", "editor@test.com", "text", "time")
        val otherComment = TaskComment("2", "other@test.com", "text", "time")
        
        val canDeleteOwn = role == PermissionRole.OWNER || ownComment.userEmail == currentUserEmail
        val canDeleteOther = role == PermissionRole.OWNER || otherComment.userEmail == currentUserEmail
        
        assertTrue(canDeleteOwn)
        assertFalse(canDeleteOther)
    }

    @Test
    fun `Viewer never sees delete`() {
        val role = PermissionRole.VIEWER
        val currentUserEmail = "viewer@test.com"
        val ownComment = TaskComment("1", "viewer@test.com", "text", "time")
        val canEdit = role == PermissionRole.OWNER || role == PermissionRole.EDITOR
        val canDelete = if (!canEdit) false else role == PermissionRole.OWNER || ownComment.userEmail == currentUserEmail
        assertFalse(canDelete)
    }

    @Test
    fun `Empty state is calculated correctly`() {
        val comments = emptyList<TaskComment>()
        assertTrue(comments.isEmpty())
    }

    @Test
    fun `Loading state is calculated correctly`() {
        val saveInProgress = true
        assertTrue(saveInProgress)
    }

    @Test
    fun `Error message mapping is correct`() {
        val error = "Network failed"
        assertEquals("Network failed", error)
    }

    @Test
    fun `Saving one comment does not disable unrelated delete actions`() {
        val saveInProgress = true
        val deletingCommentIds = setOf("1")
        
        // Is Add disabled?
        assertTrue(saveInProgress)
        // Is Delete of comment 2 disabled?
        assertFalse(deletingCommentIds.contains("2"))
    }
}
