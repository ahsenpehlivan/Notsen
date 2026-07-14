package com.notsen.feature.myday.ui

import java.time.LocalDate

data class MyDayTaskItem(
    val taskId: String,
    val title: String,
    val boardId: String,
    val boardTitle: String,
    val columnId: String,
    val columnTitle: String,
    val tags: List<String> = emptyList(),
    val dueDate: String? = null,
    val isPlannedToday: Boolean = false
)

sealed class MyDaySnackbarEvent {
    data class TaskAdded(val taskId: String, val message: String) : MyDaySnackbarEvent()
    data class TaskRemoved(val taskId: String, val message: String) : MyDaySnackbarEvent()
}

data class MyDayUiState(
    val selectedDate: LocalDate = LocalDate.now(),
    val plannedTasks: List<MyDayTaskItem> = emptyList(),
    val availableTasks: List<MyDayTaskItem> = emptyList(),
    val searchQuery: String = "",
    val selectedBoardId: String? = null,
    val isLoading: Boolean = false,
    val isPickerLoading: Boolean = false,
    val addingTaskId: String? = null,
    val removingTaskId: String? = null,
    val error: String? = null,
    val snackbarEvent: MyDaySnackbarEvent? = null
)
