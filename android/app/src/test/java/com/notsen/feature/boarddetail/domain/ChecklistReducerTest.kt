package com.notsen.feature.boarddetail.domain

import com.notsen.core.model.ChecklistItem
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ChecklistReducerTest {

    @Test
    fun `Add trims text`() {
        val mutation = ChecklistMutation.Add("  hello  ")
        val result = ChecklistReducer.reduce(emptyList(), mutation)
        assertTrue(result is ChecklistMutationResult.Success)
        val success = result as ChecklistMutationResult.Success
        assertEquals(1, success.items.size)
        assertEquals("hello", success.items[0].text)
        assertEquals(false, success.items[0].done)
    }

    @Test
    fun `Add rejects empty text`() {
        val mutation = ChecklistMutation.Add("   ")
        val result = ChecklistReducer.reduce(emptyList(), mutation)
        assertTrue(result is ChecklistMutationResult.Rejected)
        val rejected = result as ChecklistMutationResult.Rejected
        assertEquals(ChecklistValidationError.EmptyText, rejected.reason)
    }

    @Test
    fun `Add generates unique id`() {
        val mutation = ChecklistMutation.Add("Task 1")
        val result = ChecklistReducer.reduce(emptyList(), mutation) as ChecklistMutationResult.Success
        
        val mutation2 = ChecklistMutation.Add("Task 2")
        val result2 = ChecklistReducer.reduce(result.items, mutation2) as ChecklistMutationResult.Success
        
        assertNotEquals(result2.items[0].id, result2.items[1].id)
    }

    @Test
    fun `Toggle modifies only target item`() {
        val items = listOf(
            ChecklistItem("1", "A", false),
            ChecklistItem("2", "B", false)
        )
        val mutation = ChecklistMutation.Toggle("1")
        val result = ChecklistReducer.reduce(items, mutation) as ChecklistMutationResult.Success
        
        assertEquals(true, result.items[0].done)
        assertEquals(false, result.items[1].done)
    }

    @Test
    fun `Toggle rejects missing id`() {
        val items = listOf(ChecklistItem("1", "A", false))
        val mutation = ChecklistMutation.Toggle("2")
        val result = ChecklistReducer.reduce(items, mutation)
        
        assertTrue(result is ChecklistMutationResult.Rejected)
        assertEquals(ChecklistValidationError.ItemNotFound, (result as ChecklistMutationResult.Rejected).reason)
    }

    @Test
    fun `Rename modifies text and keeps id and done status`() {
        val items = listOf(ChecklistItem("1", "A", true))
        val mutation = ChecklistMutation.Rename("1", "B")
        val result = ChecklistReducer.reduce(items, mutation) as ChecklistMutationResult.Success
        
        assertEquals("B", result.items[0].text)
        assertEquals("1", result.items[0].id)
        assertEquals(true, result.items[0].done)
    }

    @Test
    fun `Rename rejects empty text`() {
        val items = listOf(ChecklistItem("1", "A", false))
        val mutation = ChecklistMutation.Rename("1", "   ")
        val result = ChecklistReducer.reduce(items, mutation)
        
        assertTrue(result is ChecklistMutationResult.Rejected)
        assertEquals(ChecklistValidationError.EmptyText, (result as ChecklistMutationResult.Rejected).reason)
    }

    @Test
    fun `Rename returns NoChange for same text`() {
        val items = listOf(ChecklistItem("1", "A", false))
        val mutation = ChecklistMutation.Rename("1", "A")
        val result = ChecklistReducer.reduce(items, mutation)
        
        assertTrue(result is ChecklistMutationResult.Rejected)
        assertEquals(ChecklistValidationError.NoChange, (result as ChecklistMutationResult.Rejected).reason)
    }

    @Test
    fun `Delete removes target item`() {
        val items = listOf(
            ChecklistItem("1", "A", false),
            ChecklistItem("2", "B", false)
        )
        val mutation = ChecklistMutation.Delete("1")
        val result = ChecklistReducer.reduce(items, mutation) as ChecklistMutationResult.Success
        
        assertEquals(1, result.items.size)
        assertEquals("2", result.items[0].id)
    }

    @Test
    fun `Delete rejects missing id`() {
        val items = listOf(ChecklistItem("1", "A", false))
        val mutation = ChecklistMutation.Delete("2")
        val result = ChecklistReducer.reduce(items, mutation)
        
        assertTrue(result is ChecklistMutationResult.Rejected)
        assertEquals(ChecklistValidationError.ItemNotFound, (result as ChecklistMutationResult.Rejected).reason)
    }

    @Test
    fun `Reducer does not mutate original list`() {
        val items = listOf(ChecklistItem("1", "A", false))
        val mutation = ChecklistMutation.Add("B")
        val result = ChecklistReducer.reduce(items, mutation) as ChecklistMutationResult.Success
        
        assertEquals(1, items.size)
        assertEquals(2, result.items.size)
    }

    @Test
    fun `Input with duplicate ids is safely rejected`() {
        val items = listOf(
            ChecklistItem("1", "A", false),
            ChecklistItem("1", "B", false)
        )
        val mutation = ChecklistMutation.Add("C")
        val result = ChecklistReducer.reduce(items, mutation)
        
        assertTrue(result is ChecklistMutationResult.Rejected)
        assertEquals(ChecklistValidationError.DuplicateId, (result as ChecklistMutationResult.Rejected).reason)
    }
}
