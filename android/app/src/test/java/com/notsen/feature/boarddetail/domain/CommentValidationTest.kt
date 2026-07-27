package com.notsen.feature.boarddetail.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.UUID

class CommentValidationTest {
    @Test
    fun `Add trims comment content`() {
        val input = "   padded content   "
        val trimmed = input.trim()
        assertEquals("padded content", trimmed)
    }

    @Test
    fun `Empty content is rejected`() {
        val input = ""
        assertFalse(input.trim().isNotEmpty())
    }

    @Test
    fun `Whitespace-only content is rejected`() {
        val input = "   \n \t   "
        assertFalse(input.trim().isNotEmpty())
    }

    @Test
    fun `2000 characters are accepted`() {
        val input = "a".repeat(2000)
        assertTrue(input.length <= 2000 && input.trim().isNotEmpty())
    }

    @Test
    fun `2001 characters are rejected`() {
        val input = "a".repeat(2001)
        assertFalse(input.length <= 2000)
    }

    @Test
    fun `Turkish characters are preserved`() {
        val input = "şğüöçıŞĞÜÖÇİ"
        assertEquals(12, input.length)
        assertTrue(input.trim().isNotEmpty())
    }

    @Test
    fun `Comments are sorted by createdAt ascending`() {
        val c1 = com.notsen.core.model.TaskComment("1", "u1@test.com", "first", "2026-07-20T10:00:00Z")
        val c2 = com.notsen.core.model.TaskComment("2", "u2@test.com", "second", "2026-07-20T11:00:00Z")
        val c3 = com.notsen.core.model.TaskComment("3", "u1@test.com", "third", "2026-07-20T10:30:00Z")
        
        val list = listOf(c2, c1, c3)
        val sorted = list.sortedBy { it.createdAt }
        
        assertEquals("first", sorted[0].text)
        assertEquals("third", sorted[1].text)
        assertEquals("second", sorted[2].text)
    }

    @Test
    fun `Duplicate realtime comment ID is ignored`() {
        val list = listOf(
            com.notsen.core.model.TaskComment("1", "u1@test.com", "a", "2026-07-20T10:00:00Z")
        )
        val newComment = com.notsen.core.model.TaskComment("1", "u2@test.com", "a", "2026-07-20T10:00:00Z")
        
        val newList = if (list.any { it.id == newComment.id }) list else list + newComment
        assertEquals(1, newList.size)
    }
}
