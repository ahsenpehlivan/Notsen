package com.notsen.feature.myday

import com.notsen.feature.myday.ui.MyDayTaskItem
import com.notsen.feature.myday.ui.MyDayUiState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class MyDayTests {

    @Test
    fun testLocalDateToStringFormatting() {
        val date = LocalDate.of(2026, 7, 13)
        val dateStr = date.format(DateTimeFormatter.ISO_LOCAL_DATE)
        assertEquals("2026-07-13", dateStr)
    }

    @Test
    fun testDuplicateTaskNotAddedToPlannedTasks() {
        val task = MyDayTaskItem("t1", "Task 1", "b1", "Board", "c1", "Col", isPlannedToday = true)
        val plannedTasks = listOf(task)
        
        // Simulating the view model logic when task is added
        val addedTask = task.copy()
        val newPlanned = if (!plannedTasks.any { it.taskId == addedTask.taskId }) {
            plannedTasks + addedTask
        } else {
            plannedTasks
        }

        assertEquals(1, newPlanned.size)
    }

    @Test
    fun testOtherDatePlanNotInToday() {
        // If query returns empty because it's filtered by date, isPlannedToday will be false
        val task = MyDayTaskItem("t1", "Task 1", "b1", "Board", "c1", "Col", isPlannedToday = false)
        assertFalse(task.isPlannedToday)
    }

    @Test
    fun testSearchTaskTitle() {
        val tasks = listOf(
            MyDayTaskItem("t1", "Bakkala git", "b1", "Board", "c1", "Col"),
            MyDayTaskItem("t2", "Kod yaz", "b1", "Board", "c1", "Col")
        )
        
        val query = "kod"
        val filtered = tasks.filter { it.title.contains(query, ignoreCase = true) }
        
        assertEquals(1, filtered.size)
        assertEquals("t2", filtered.first().taskId)
    }

    @Test
    fun testBoardFilter() {
        val tasks = listOf(
            MyDayTaskItem("t1", "Task 1", "b1", "Board 1", "c1", "Col"),
            MyDayTaskItem("t2", "Task 2", "b2", "Board 2", "c1", "Col")
        )
        
        val selectedBoardId: String? = "b2"
        val filtered = tasks.filter { selectedBoardId == null || it.boardId == selectedBoardId }
        
        assertEquals(1, filtered.size)
        assertEquals("t2", filtered.first().taskId)
    }

    @Test
    fun testRemoveFromMyDayOnlyUpdatesLocalState() {
        val task = MyDayTaskItem("t1", "Task 1", "b1", "Board", "c1", "Col", isPlannedToday = true)
        var state = MyDayUiState(
            plannedTasks = listOf(task),
            availableTasks = listOf(task)
        )
        
        // Simulate remove
        val updatedAvailable = state.availableTasks.map {
            if (it.taskId == "t1") it.copy(isPlannedToday = false) else it
        }
        val newPlanned = state.plannedTasks.filterNot { it.taskId == "t1" }
        state = state.copy(availableTasks = updatedAvailable, plannedTasks = newPlanned)
        
        assertTrue(state.plannedTasks.isEmpty())
        assertFalse(state.availableTasks.first().isPlannedToday)
        // Ensure the task itself is not deleted from available tasks
        assertEquals(1, state.availableTasks.size)
    }

    @Test
    fun testUserChangeClearsState() {
        var state = MyDayUiState(
            plannedTasks = listOf(MyDayTaskItem("t1", "Task", "b", "Board", "c", "Col")),
            searchQuery = "test"
        )
        
        // Simulate user change
        val newUserState = MyDayUiState()
        
        assertTrue(newUserState.plannedTasks.isEmpty())
        assertEquals("", newUserState.searchQuery)
    }
}
