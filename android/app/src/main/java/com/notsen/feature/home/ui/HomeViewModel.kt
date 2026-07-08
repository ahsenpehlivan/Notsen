package com.notsen.feature.home.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notsen.core.model.Board
import com.notsen.feature.home.data.BoardRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeUiState(
    val isLoading: Boolean = false,
    val isAddingBoard: Boolean = false,
    val boards: List<Board> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: BoardRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadBoards()
    }

    fun loadBoards() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val boards = repository.getBoards()
                _uiState.update { it.copy(isLoading = false, boards = boards) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun addBoard(title: String) {
        if (title.isBlank() || _uiState.value.isAddingBoard) return

        viewModelScope.launch {
            _uiState.update { it.copy(isAddingBoard = true, error = null) }
            try {
                val newBoard = repository.addBoard(title)
                _uiState.update { state ->
                    state.copy(
                        isAddingBoard = false,
                        boards = listOf(newBoard) + state.boards // Add to top
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isAddingBoard = false, error = e.message) }
            }
        }
    }
}
