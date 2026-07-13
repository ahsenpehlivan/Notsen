package com.notsen.feature.quicknotes.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notsen.core.datastore.NotesPreferences
import com.notsen.core.model.Note
import com.notsen.core.model.NoteDateFilter
import com.notsen.core.model.NoteSortOption
import com.notsen.feature.quicknotes.data.NotesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class QuickNotesUiState(
    val isLoading: Boolean = false,
    val isAddingNote: Boolean = false,
    val isSaving: Boolean = false,
    val pinningNoteIds: Set<String> = emptySet(),
    val archivingNoteIds: Set<String> = emptySet(),
    val allNotes: List<Note> = emptyList(),
    val visibleNotes: List<Note> = emptyList(),
    val searchQuery: String = "",
    val selectedTags: Set<String> = emptySet(),
    val dateFilter: NoteDateFilter = NoteDateFilter.ALL,
    val showPinnedOnly: Boolean = false,
    val showArchived: Boolean = false,
    val sortOption: NoteSortOption = NoteSortOption.UPDATED_DESC,
    val availableTags: List<String> = emptyList(),
    val error: String? = null,
    val snackbarMessage: String? = null,
    val recentlyArchivedNote: Note? = null
)

@OptIn(FlowPreview::class)
@HiltViewModel
class QuickNotesViewModel @Inject constructor(
    private val repository: NotesRepository,
    private val notesPreferences: NotesPreferences
) : ViewModel() {

    private val _uiState = MutableStateFlow(QuickNotesUiState())
    val uiState: StateFlow<QuickNotesUiState> = _uiState.asStateFlow()

    private val _searchQueryFlow = MutableStateFlow("")

    private var currentOffset = 0L
    private val limit = 1000L
    private var hasReachedEnd = false

    init {
        viewModelScope.launch {
            notesPreferences.sortOptionFlow.collectLatest { sortOption ->
                _uiState.update { it.copy(sortOption = sortOption) }
                applyFilters()
            }
        }

        viewModelScope.launch {
            _searchQueryFlow.debounce(300).collectLatest { query ->
                _uiState.update { it.copy(searchQuery = query) }
                applyFilters()
            }
        }

        viewModelScope.launch {
            repository.refreshTrigger.collect {
                refreshNotes()
            }
        }
    }

    private fun applyFilters() {
        val state = _uiState.value
        android.util.Log.d("NotsenDebug", "NOTES_REDUCE_START all=${state.allNotes.size} query=${state.searchQuery} date=${state.dateFilter} pinned=${state.showPinnedOnly} archived=${state.showArchived} sort=${state.sortOption}")
        
        val filtered = filterAndSortNotes(
            notes = state.allNotes,
            query = state.searchQuery,
            selectedTags = state.selectedTags,
            dateFilter = state.dateFilter,
            showPinnedOnly = state.showPinnedOnly,
            showArchived = state.showArchived,
            sortOption = state.sortOption
        )

        val tags = state.allNotes.flatMap { it.tags }.distinct().sorted()

        android.util.Log.d("NotsenDebug", "NOTES_REDUCE_RESULT visible=${filtered.size}")
        android.util.Log.d("NotsenDebug", "NOTES_UI_RENDER visible=${filtered.size} all=${state.allNotes.size} date=${state.dateFilter}")

        _uiState.update { it.copy(visibleNotes = filtered, availableTags = tags) }
    }

    fun updateSearchQuery(query: String) {
        _searchQueryFlow.value = query
        // Immediate UI update for the text field, actual filtering is debounced
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun toggleTagFilter(tag: String) {
        val currentTags = _uiState.value.selectedTags.toMutableSet()
        if (currentTags.contains(tag)) {
            currentTags.remove(tag)
        } else {
            currentTags.add(tag)
        }
        _uiState.update { it.copy(selectedTags = currentTags) }
        applyFilters()
    }

    fun clearFilters() {
        _uiState.update {
            it.copy(
                selectedTags = emptySet(),
                dateFilter = NoteDateFilter.ALL,
                showPinnedOnly = false,
                showArchived = false
            )
        }
        applyFilters()
    }

    fun updateDateFilter(filter: NoteDateFilter) {
        android.util.Log.d("NotsenDebug", "NOTES_FILTER_CLICK dateFilter=$filter")
        android.util.Log.d("NotsenDebug", "NOTES_STATE_DATE_FILTER_CHANGED old=${_uiState.value.dateFilter} new=$filter")
        _uiState.update { it.copy(dateFilter = filter) }
        applyFilters()
    }

    fun togglePinnedOnly() {
        _uiState.update { it.copy(showPinnedOnly = !it.showPinnedOnly) }
        applyFilters()
    }

    fun toggleShowArchived() {
        _uiState.update { it.copy(showArchived = !it.showArchived) }
        applyFilters()
    }

    fun updateSortOption(option: NoteSortOption) {
        viewModelScope.launch {
            notesPreferences.setSortOption(option)
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
                        allNotes = state.allNotes + fetchedNotes
                    )
                }
                applyFilters()
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun refreshNotes() {
        viewModelScope.launch {
            currentOffset = 0L
            hasReachedEnd = false
            _uiState.update { it.copy(isLoading = true, error = null, allNotes = emptyList()) }
            try {
                val fetchedNotes = repository.getNotes(limit = limit, offset = currentOffset)
                if (fetchedNotes.size < limit) {
                    hasReachedEnd = true
                }
                currentOffset += fetchedNotes.size

                _uiState.update { state ->
                    state.copy(
                        isLoading = false,
                        allNotes = fetchedNotes
                    )
                }
                applyFilters()
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
                val newNote = repository.addNote("", content, tags)

                _uiState.update { state ->
                    state.copy(
                        isAddingNote = false,
                        allNotes = listOf(newNote) + state.allNotes
                    )
                }
                applyFilters()
            } catch (e: Exception) {
                _uiState.update { it.copy(isAddingNote = false, error = e.message) }
            }
        }
    }

    fun togglePinStatus(id: String, currentStatus: Boolean) {
        viewModelScope.launch {
            _uiState.update { it.copy(pinningNoteIds = it.pinningNoteIds + id) }
            try {
                // Optimistic UI updates early
                val updatedNotes = _uiState.value.allNotes.map {
                    if (it.id == id) it.copy(isPinned = !currentStatus) else it
                }
                _uiState.update { it.copy(allNotes = updatedNotes) }
                applyFilters()

                repository.togglePinStatus(id, !currentStatus)
            } catch (e: Exception) {
                // Revert Optimistic update
                refreshNotes()
                _uiState.update { it.copy(error = "Pin güncellenemedi: ${e.message}") }
            } finally {
                _uiState.update { it.copy(pinningNoteIds = it.pinningNoteIds - id) }
            }
        }
    }

    fun toggleArchiveStatus(id: String, currentStatus: Boolean) {
        viewModelScope.launch {
            _uiState.update { it.copy(archivingNoteIds = it.archivingNoteIds + id) }
            try {
                // Optimistic update
                val updatedNotes = _uiState.value.allNotes.map {
                    if (it.id == id) it.copy(isArchived = !currentStatus) else it
                }
                
                val targetNote = _uiState.value.allNotes.find { it.id == id }
                val message = if (!currentStatus) "Not arşivlendi" else "Not arşivden çıkarıldı"

                _uiState.update { 
                    it.copy(
                        allNotes = updatedNotes,
                        snackbarMessage = message,
                        recentlyArchivedNote = if (!currentStatus) targetNote else null
                    ) 
                }
                applyFilters()

                repository.toggleArchiveStatus(id, !currentStatus)
            } catch (e: Exception) {
                // Revert
                refreshNotes()
                _uiState.update { it.copy(error = "Arşiv güncellenemedi: ${e.message}") }
            } finally {
                _uiState.update { it.copy(archivingNoteIds = it.archivingNoteIds - id) }
            }
        }
    }

    fun undoArchive() {
        val note = _uiState.value.recentlyArchivedNote ?: return
        toggleArchiveStatus(note.id, currentStatus = true)
        clearSnackbar()
    }

    fun clearSnackbar() {
        _uiState.update { it.copy(snackbarMessage = null) }
    }

    fun deleteNote(id: String) {
        viewModelScope.launch {
            try {
                repository.deleteNote(id)
                _uiState.update { state ->
                    state.copy(allNotes = state.allNotes.filter { it.id != id })
                }
                applyFilters()
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
