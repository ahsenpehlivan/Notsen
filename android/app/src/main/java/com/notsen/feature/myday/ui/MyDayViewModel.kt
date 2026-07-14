package com.notsen.feature.myday.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notsen.feature.home.data.BoardRepository
import com.notsen.feature.myday.data.MyDayRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import javax.inject.Inject

@HiltViewModel
class MyDayViewModel @Inject constructor(
    private val myDayRepository: MyDayRepository,
    private val boardRepository: BoardRepository,
    private val supabaseClient: SupabaseClient
) : ViewModel() {

    private val _uiState = MutableStateFlow(MyDayUiState())
    val uiState: StateFlow<MyDayUiState> = _uiState.asStateFlow()

    private var currentUserId: String? = null

    init {
        checkUserAndLoad()
    }

    fun onStart() {
        checkUserAndLoad()
    }

    private fun checkUserAndLoad() {
        val userId = supabaseClient.auth.currentUserOrNull()?.id
        if (userId != currentUserId) {
            currentUserId = userId
            _uiState.value = MyDayUiState() // Reset state
        }
        if (userId != null) {
            loadMyDay()
        }
    }

    fun loadMyDay() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val dateStr = _uiState.value.selectedDate.format(DateTimeFormatter.ISO_LOCAL_DATE)
                
                // Fetch daily plans
                val plans = myDayRepository.getDailyPlans(dateStr)
                val plannedTaskIds = plans.map { it.taskId }.toSet()

                // Fetch all boards to get task details
                val boards = boardRepository.getBoards()
                
                val allTasks = mutableListOf<MyDayTaskItem>()
                
                for (board in boards) {
                    val columns = boardRepository.getColumns(board.id).associateBy { it.id }
                    val tasks = boardRepository.getTasks(board.id)
                    
                    for (task in tasks) {
                        allTasks.add(
                            MyDayTaskItem(
                                taskId = task.id,
                                title = task.title,
                                boardId = board.id,
                                boardTitle = board.title,
                                columnId = task.columnId,
                                columnTitle = columns[task.columnId]?.title ?: "Bilinmeyen Sütun",
                                tags = task.tags ?: emptyList(),
                                dueDate = task.dueDate,
                                isPlannedToday = plannedTaskIds.contains(task.id)
                            )
                        )
                    }
                }

                val plannedItems = allTasks.filter { it.isPlannedToday }

                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        plannedTasks = plannedItems,
                        availableTasks = allTasks
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.localizedMessage) }
            }
        }
    }

    fun addTaskToMyDay(taskId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(addingTaskId = taskId, error = null) }
            try {
                val dateStr = _uiState.value.selectedDate.format(DateTimeFormatter.ISO_LOCAL_DATE)
                myDayRepository.addTaskToMyDay(taskId, dateStr)
                
                // Update local state instead of full reload
                _uiState.update { state ->
                    val updatedAvailable = state.availableTasks.map {
                        if (it.taskId == taskId) it.copy(isPlannedToday = true) else it
                    }
                    val addedTask = updatedAvailable.find { it.taskId == taskId }
                    val newPlanned = if (addedTask != null && !state.plannedTasks.any { it.taskId == taskId }) {
                        state.plannedTasks + addedTask
                    } else {
                        state.plannedTasks
                    }
                    
                    state.copy(
                        addingTaskId = null,
                        availableTasks = updatedAvailable,
                        plannedTasks = newPlanned,
                        snackbarEvent = MyDaySnackbarEvent.TaskAdded(taskId, "Görev Günüm'e eklendi")
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(addingTaskId = null, error = "Görev eklenirken bir hata oluştu") }
                loadMyDay()
            }
        }
    }

    fun removeTaskFromMyDay(taskId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(removingTaskId = taskId, error = null) }
            try {
                val dateStr = _uiState.value.selectedDate.format(DateTimeFormatter.ISO_LOCAL_DATE)
                myDayRepository.removeTaskFromMyDay(taskId, dateStr)
                
                _uiState.update { state ->
                    val updatedAvailable = state.availableTasks.map {
                        if (it.taskId == taskId) it.copy(isPlannedToday = false) else it
                    }
                    val newPlanned = state.plannedTasks.filterNot { it.taskId == taskId }
                    
                    state.copy(
                        removingTaskId = null,
                        availableTasks = updatedAvailable,
                        plannedTasks = newPlanned,
                        snackbarEvent = MyDaySnackbarEvent.TaskRemoved(taskId, "Görev Günüm'den çıkarıldı")
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(removingTaskId = null, error = "Görev çıkarılırken bir hata oluştu") }
                loadMyDay()
            }
        }
    }

    fun undoAddition(taskId: String) {
        viewModelScope.launch {
            try {
                val dateStr = _uiState.value.selectedDate.format(DateTimeFormatter.ISO_LOCAL_DATE)
                myDayRepository.removeTaskFromMyDay(taskId, dateStr)
                
                _uiState.update { state ->
                    val updatedAvailable = state.availableTasks.map {
                        if (it.taskId == taskId) it.copy(isPlannedToday = false) else it
                    }
                    val newPlanned = state.plannedTasks.filterNot { it.taskId == taskId }
                    
                    state.copy(
                        availableTasks = updatedAvailable,
                        plannedTasks = newPlanned
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Geri alma başarısız oldu") }
            }
        }
    }

    fun undoRemoval(taskId: String) {
        viewModelScope.launch {
            try {
                val dateStr = _uiState.value.selectedDate.format(DateTimeFormatter.ISO_LOCAL_DATE)
                myDayRepository.addTaskToMyDay(taskId, dateStr)
                
                _uiState.update { state ->
                    val updatedAvailable = state.availableTasks.map {
                        if (it.taskId == taskId) it.copy(isPlannedToday = true) else it
                    }
                    val addedTask = updatedAvailable.find { it.taskId == taskId }
                    val newPlanned = if (addedTask != null && !state.plannedTasks.any { it.taskId == taskId }) {
                        state.plannedTasks + addedTask
                    } else {
                        state.plannedTasks
                    }
                    
                    state.copy(
                        availableTasks = updatedAvailable,
                        plannedTasks = newPlanned
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Geri alma başarısız oldu") }
            }
        }
    }

    fun updateSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun setBoardFilter(boardId: String?) {
        _uiState.update { it.copy(selectedBoardId = boardId) }
    }

    fun consumeSnackbarEvent() {
        _uiState.update { it.copy(snackbarEvent = null) }
    }
}
