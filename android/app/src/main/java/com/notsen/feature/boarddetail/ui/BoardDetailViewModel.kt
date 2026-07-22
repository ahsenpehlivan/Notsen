package com.notsen.feature.boarddetail.ui

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notsen.core.model.ActivityLog
import com.notsen.core.model.Board
import com.notsen.core.model.BoardMember
import com.notsen.core.model.Column
import com.notsen.core.model.PermissionRole
import com.notsen.core.model.Task
import com.notsen.feature.boarddetail.data.BoardMemberRepository
import com.notsen.feature.boarddetail.data.activity.ActivityLogRepository
import com.notsen.feature.boarddetail.data.realtime.BoardRealtimeManager
import com.notsen.feature.home.data.BoardRepository
import com.notsen.feature.myday.data.MyDayRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

data class BoardDetailUiState(
    val isLoading: Boolean = false,
    val isAddingColumn: Boolean = false,
    val isAddingTask: Boolean = false,
    val columns: List<Column> = emptyList(),
    val tasksByColumn: Map<String, List<Task>> = emptyMap(),
    val plannedTaskIds: Set<String> = emptySet(),
    val members: List<BoardMember> = emptyList(),
    val activityLogs: List<ActivityLog> = emptyList(),
    val boardLabels: List<String> = emptyList(),
    val currentUserRole: PermissionRole? = null,
    val showMembersSheet: Boolean = false,
    val showActivityLogsSheet: Boolean = false,
    val error: String? = null,
    val isMemberActionLoading: Boolean = false,
    val memberActionSuccess: String? = null
)

@HiltViewModel
class BoardDetailViewModel @Inject constructor(
    private val repository: BoardRepository,
    private val memberRepository: BoardMemberRepository,
    private val activityLogRepository: ActivityLogRepository,
    private val myDayRepository: MyDayRepository,
    private val realtimeManager: BoardRealtimeManager,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val boardId: String = checkNotNull(savedStateHandle["boardId"])
    private var currentBoard: Board? = null
    val boardTitle: String get() = currentBoard?.title ?: "Pano"

    private val _uiState = MutableStateFlow(BoardDetailUiState())
    val uiState: StateFlow<BoardDetailUiState> = _uiState.asStateFlow()

    private val _navigationEvent = Channel<NavigationAction>(Channel.BUFFERED)
    val navigationEvent = _navigationEvent.receiveAsFlow()

    private var contentDebounceJob: Job? = null
    private var boardDirtyAfterDrag = false
    private var isDragging = false

    private val coordinator = BoardOperationCoordinator(
        boardId = boardId,
        getState = { _uiState.value },
        updateState = { updateFn -> _uiState.update(updateFn) },
        emitNavigation = { action -> _navigationEvent.send(action) },
        deleteBoardApi = { id -> repository.deleteBoard(id) },
        deleteColumnApi = { id -> repository.deleteColumn(id) },
        updateColumnApi = { id, title -> repository.updateColumn(id, title) },
        updateBoardApi = { id, title -> repository.updateBoard(id, title) },
        logActivityApi = { bId, action, type, eId, eTitle, meta ->
            activityLogRepository.logActivity(bId, action, type, eId, eTitle, meta)
        },
        updateTaskChecklistApi = { bId, tId, checklist ->
            repository.updateTaskChecklist(bId, tId, checklist)
        }
    )

    init {
        // Collect Realtime flows
        realtimeManager.onSubscribed.onEach {
            // Tam refetch yap
            loadFullBoardData()
        }.launchIn(viewModelScope)

        realtimeManager.boardContentDirty.onEach {
            if (isDragging) {
                boardDirtyAfterDrag = true
            } else {
                triggerContentDebounce()
            }
        }.launchIn(viewModelScope)

        realtimeManager.membersDirty.onEach {
            loadMembersAndRole()
        }.launchIn(viewModelScope)

        realtimeManager.activityLogsDirty.onEach {
            loadActivityLogs()
        }.launchIn(viewModelScope)
    }

    fun onStart() {
        viewModelScope.launch {
            realtimeManager.subscribeToBoard(boardId, this)
        }
    }

    fun onStop() {
        viewModelScope.launch {
            contentDebounceJob?.cancel()
            realtimeManager.unsubscribe()
        }
    }

    private fun triggerContentDebounce() {
        contentDebounceJob?.cancel()
        contentDebounceJob = viewModelScope.launch {
            delay(300) // 300ms debounce
            loadContentData()
        }
    }

    private fun loadFullBoardData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                // Pano başlığını almak için
                val boards = repository.getBoards()
                currentBoard = boards.find { it.id == boardId }

                loadContentDataInternal()
                loadMembersAndRoleInternal()
                loadActivityLogsInternal()

                _uiState.update { it.copy(isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    private suspend fun loadContentDataInternal() {
        val columns = repository.getColumns(boardId)
        val allTasks = repository.getTasks(boardId)
        val tasksGrouped = allTasks.groupBy { it.columnId }
        
        val dateStr = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
        val plannedPlans = try {
            myDayRepository.getDailyPlans(dateStr)
        } catch (e: Exception) {
            emptyList()
        }
        val plannedIds = plannedPlans.map { it.taskId }.toSet()

        _uiState.update {
            it.copy(
                columns = columns,
                tasksByColumn = tasksGrouped,
                plannedTaskIds = plannedIds,
                boardLabels = currentBoard?.labels ?: emptyList()
            )
        }
    }

    private fun loadContentData() {
        viewModelScope.launch {
            try {
                loadContentDataInternal()
            } catch (e: Exception) {
                // background load error
            }
        }
    }

    private suspend fun loadMembersAndRoleInternal() {
        val membersResult = memberRepository.getMembers(boardId)
        if (membersResult.isSuccess) {
            val members = membersResult.getOrNull() ?: emptyList()

            // TODO: Mevcut kullanıcının email ve IDsini Supabase auth'tan almak idealdir.
            // Şimdilik board üzerinden role belirlemeye çalışalım.
            // Supabase auth.currentUser alınabilir
            val currentUserRole = memberRepository.resolveUserRole(
                currentBoard,
                members
            )

            // Eğer sürükleme sırasındaysa ve yetkisi editor'den viewer'a düştüyse drag'i iİptal et.
            if (isDragging && currentUserRole == PermissionRole.VIEWER && _uiState.value.currentUserRole == PermissionRole.EDITOR) {
                cancelDrag()
            }

            _uiState.update {
                it.copy(members = members, currentUserRole = currentUserRole)
            }
        }
    }

    private fun loadMembersAndRole() {
        viewModelScope.launch {
            try {
                loadMembersAndRoleInternal()
            } catch (e: Exception) {
                // background load error
            }
        }
    }

    private suspend fun loadActivityLogsInternal() {
        val logsResult = activityLogRepository.getActivityLogs(boardId, 30)
        if (logsResult.isSuccess) {
            _uiState.update { it.copy(activityLogs = logsResult.getOrNull() ?: emptyList()) }
        }
    }

    private fun loadActivityLogs() {
        viewModelScope.launch {
            try {
                loadActivityLogsInternal()
            } catch (e: Exception) {
                // background load error
            }
        }
    }

    // --- UI Actions ---
    fun toggleMembersSheet(show: Boolean) {
        _uiState.update { it.copy(showMembersSheet = show) }
    }

    fun toggleActivityLogsSheet(show: Boolean) {
        _uiState.update { it.copy(showActivityLogsSheet = show) }
    }

    // --- Mutations ---

    fun addColumn(title: String) {
        if (title.isBlank() || _uiState.value.isAddingColumn) return
        if (_uiState.value.currentUserRole?.canEditColumnsAndTasks != true) return

        viewModelScope.launch {
            _uiState.update { it.copy(isAddingColumn = true, error = null) }
            try {
                val currentColumns = _uiState.value.columns
                val position = (currentColumns.maxOfOrNull { it.position ?: 0 } ?: -1) + 1

                repository.addColumn(boardId, title, position)
                // Realtime bunu getirecektir. Optimistic yapmıyoruz.
                _uiState.update { it.copy(isAddingColumn = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isAddingColumn = false, error = e.message) }
            }
        }
    }

    fun addTask(columnId: String, title: String, description: String = "") {
        if (title.isBlank() || _uiState.value.isAddingTask) return
        if (_uiState.value.currentUserRole?.canEditColumnsAndTasks != true) return

        viewModelScope.launch {
            _uiState.update { it.copy(isAddingTask = true, error = null) }
            try {
                val currentTasks = _uiState.value.tasksByColumn[columnId] ?: emptyList()
                val position = (currentTasks.maxOfOrNull { it.position ?: 0 } ?: -1) + 1

                repository.addTask(boardId, columnId, title, description, position)
                _uiState.update { it.copy(isAddingTask = false) }
                loadContentData()
            } catch (e: Exception) {
                val errorMsg = if (e.message?.contains("Failed to") == true) e.message else "Görev eklenemedi. İnternet bağlantınızı kontrol edin."
                _uiState.update { it.copy(isAddingTask = false, error = errorMsg) }
            }
        }
    }

    fun updateTaskDetails(
        taskId: String,
        columnId: String,
        newTitle: String,
        newDescription: String,
        dueDate: String?,
        tags: List<String>?,
        assignee: String?,
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        if (newTitle.isBlank()) {
            onError("Görev başlığı boş olamaz.")
            return
        }
        if (_uiState.value.currentUserRole?.canEditColumnsAndTasks != true) {
            onError("Bu işlem için yetkiniz yok.")
            return
        }

        viewModelScope.launch {
            try {
                repository.updateTaskDetails(taskId, newTitle, newDescription, dueDate, tags, assignee)
                onSuccess()
            } catch (e: Exception) {
                onError(e.message ?: "Bilinmeyen hata")
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }

    fun deleteTask(taskId: String, columnId: String) {
        if (_uiState.value.currentUserRole?.canEditColumnsAndTasks != true) return

        viewModelScope.launch {
            try {
                repository.deleteTask(taskId)
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }

    fun deleteBoard() {
        viewModelScope.launch {
            coordinator.deleteBoard()
        }
    }

    fun deleteColumn(columnId: String) {
        viewModelScope.launch {
            coordinator.deleteColumn(columnId)
        }
    }

    fun renameColumn(columnId: String, newTitle: String) {
        viewModelScope.launch {
            coordinator.renameColumn(columnId, newTitle)
        }
    }

    fun renameBoard(newTitle: String) {
        val oldTitle = currentBoard?.title ?: return
        viewModelScope.launch {
            coordinator.renameBoard(newTitle, oldTitle)
        }
    }

    // --- DND Drag Logic ---
    fun onDragStart() {
        isDragging = true
        boardDirtyAfterDrag = false
    }

    fun cancelDrag() {
        isDragging = false
        if (boardDirtyAfterDrag) {
            boardDirtyAfterDrag = false
            triggerContentDebounce()
        }
    }

    fun moveTaskRpc(
        taskId: String,
        expectedSourceColumnId: String,
        expectedSourcePosition: Int,
        targetColumnId: String,
        targetIndex: Int
    ) {
        if (_uiState.value.currentUserRole?.canDragAndDrop != true) {
            cancelDrag()
            return
        }

        // Optimistic UI Update using Pure Reducer
        val originalSnapshot = _uiState.value.tasksByColumn

        val previewTasks = BoardDragDropReducer.calculatePreviewTasks(
            tasksByColumn = originalSnapshot,
            draggedTaskId = taskId,
            targetColumnId = targetColumnId,
            targetIndex = targetIndex
        )

        _uiState.update { it.copy(tasksByColumn = previewTasks) }

        viewModelScope.launch {
            try {
                // move_task_v1 RPC'sini çağır (Daha sonra yazıldıysa)
                // Şimdilik fallback
                if (expectedSourceColumnId != targetColumnId) {
                    repository.moveTask(taskId, targetColumnId)
                }

                // Başarılı olursa drag modundan çık
                isDragging = false
                if (boardDirtyAfterDrag) {
                    boardDirtyAfterDrag = false
                    loadContentData()
                }

            } catch (e: Exception) {
                // Rollback
                isDragging = false
                _uiState.update {
                    it.copy(
                        tasksByColumn = originalSnapshot,
                        error = "Sunucu hatası: Taşıma kaydedilemedi. (${e.message})"
                    )
                }
                loadContentData() // Sync with server again

                delay(3000)
                _uiState.update { it.copy(error = null) }
            }
        }
    }

    // --- Member Mutations ---
    fun clearMemberActionSuccess() {
        _uiState.update { it.copy(memberActionSuccess = null) }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    private fun extractErrorMessage(e: Exception, defaultMsg: String): String {
        val msg = e.message ?: ""
        return when {
            msg.contains("Kullanıcı bulunamadı") -> "Kullanıcı bulunamadı."
            msg.contains("zaten pano üyesi") -> "Bu kullanıcı zaten pano üyesi."
            msg.contains("Yalnızca pano sahibi") -> "Rol güncellenemedi. Yalnızca pano sahibi üye rollerini değiştirebilir."
            msg.contains("Pano sahibinin rolü") -> "Pano sahibinin rolü değiştirilemez."
            msg.contains("Pano sahibi çıkarılamaz") -> "Pano sahibi çıkarılamaz."
            msg.contains("Could not find the function") || msg.contains("does not exist") || msg.contains("update_board_member_role") -> "Rol güncelleme altyapısı eksik. Supabase migration çalıştırılmalı."
            msg.contains("Failed to") || msg.contains("network") -> "İnternet bağlantınızı kontrol edin."
            else -> defaultMsg
        }
    }

    fun inviteMember(email: String, role: PermissionRole) {
        if (_uiState.value.currentUserRole?.canManageMembers != true || _uiState.value.isMemberActionLoading) return

        viewModelScope.launch {
            _uiState.update { it.copy(isMemberActionLoading = true, error = null, memberActionSuccess = null) }
            try {
                memberRepository.inviteMember(boardId, email, role)
                _uiState.update { it.copy(isMemberActionLoading = false, memberActionSuccess = "Üye başarıyla davet edildi.") }
                loadMembersAndRole()
            } catch (e: Exception) {
                _uiState.update { it.copy(isMemberActionLoading = false, error = extractErrorMessage(e, "Üye davet edilemedi.")) }
            }
        }
    }

    fun updateMemberRole(memberId: String, role: PermissionRole) {
        if (_uiState.value.currentUserRole?.canManageMembers != true || _uiState.value.isMemberActionLoading) return

        viewModelScope.launch {
            _uiState.update { it.copy(isMemberActionLoading = true, error = null, memberActionSuccess = null) }
            try {
                memberRepository.updateMemberRole(memberId, role, _uiState.value.currentUserRole)
                _uiState.update { it.copy(isMemberActionLoading = false, memberActionSuccess = "Üye rolü güncellendi.") }
                loadMembersAndRole()
            } catch (e: Exception) {
                _uiState.update { it.copy(isMemberActionLoading = false, error = extractErrorMessage(e, "Üye güncellenemedi.")) }
            }
        }
    }

    fun removeMember(memberId: String) {
        if (_uiState.value.currentUserRole?.canManageMembers != true || _uiState.value.isMemberActionLoading) return

        viewModelScope.launch {
            _uiState.update { it.copy(isMemberActionLoading = true, error = null, memberActionSuccess = null) }
            try {
                memberRepository.removeMember(memberId)
                _uiState.update { it.copy(isMemberActionLoading = false, memberActionSuccess = "Üye başarıyla çıkarıldı.") }
                loadMembersAndRole()
            } catch (e: Exception) {
                _uiState.update { it.copy(isMemberActionLoading = false, error = extractErrorMessage(e, "Üye çıkarılamadı.")) }
            }
        }
    }
}
