package com.notsen.feature.quicknotes.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notsen.core.model.Note
import com.notsen.feature.quicknotes.data.NotesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class QuickNotesUiState(
    val isLoading: Boolean = false,
    val isAddingNote: Boolean = false,
    val notes: List<Note> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class QuickNotesViewModel @Inject constructor(
    private val repository: NotesRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(QuickNotesUiState())
    val uiState: StateFlow<QuickNotesUiState> = _uiState.asStateFlow()

    private var currentOffset = 0L
    private val limit = 50L
    private var hasReachedEnd = false

    init {
        viewModelScope.launch {
            repository.refreshTrigger.collect {
                refreshNotes()
            }
        }
    }

    fun loadNotes() {
        if (hasReachedEnd || _uiState.value.isLoading) return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val fetchedNotes = repository.getNotes(limit = limit, offset = currentOffset)
                if (fetchedNotes.size < limit) {
                    hasReachedEnd = true
                }
                currentOffset += fetchedNotes.size

                _uiState.update { state ->
                    state.copy(
                        isLoading = false,
                        notes = state.notes + fetchedNotes
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun refreshNotes() {
        viewModelScope.launch {
            currentOffset = 0L
            hasReachedEnd = false
            _uiState.update { it.copy(isLoading = true, error = null, notes = emptyList()) }
            try {
                val fetchedNotes = repository.getNotes(limit = limit, offset = currentOffset)
                if (fetchedNotes.size < limit) {
                    hasReachedEnd = true
                }
                currentOffset += fetchedNotes.size

                _uiState.update { state ->
                    state.copy(
                        isLoading = false,
                        notes = fetchedNotes
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun addNote(content: String) {
        if (content.isBlank() || _uiState.value.isAddingNote) return

        viewModelScope.launch {
            _uiState.update { it.copy(isAddingNote = true, error = null) }
            try {
                val tags = extractTags(content)
                val newNote = repository.addNote(content, tags)

                _uiState.update { state ->
                    state.copy(
                        isAddingNote = false,
                        // Add to the beginning of the list so it appears at the bottom of reverseLayout
                        notes = listOf(newNote) + state.notes
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isAddingNote = false, error = e.message) }
            }
        }
    }

    fun deleteNote(id: String) {
        viewModelScope.launch {
            try {
                repository.deleteNote(id)
                _uiState.update { state ->
                    state.copy(notes = state.notes.filter { it.id != id })
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }

    private fun extractTags(text: String): List<String> {
        val regex = Regex("#[\\wığüşöçİĞÜŞÖÇ]+")
        return regex.findAll(text).map { it.value.drop(1) }.toList()
    }
}
