package com.notsen.feature.profile.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notsen.core.datastore.ThemePreferences
import com.notsen.core.designsystem.AppTheme
import com.notsen.feature.auth.data.AuthRepository
import com.notsen.feature.boarddetail.data.realtime.BoardRealtimeManager
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.auth.user.UserInfo
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.Dispatchers
import javax.inject.Inject
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Count

data class ProfileUiState(
    val isLoading: Boolean = false,
    val user: UserInfo? = null,
    val theme: AppTheme = AppTheme.CHARCOAL,
    val error: String? = null,
    val successMessage: String? = null,
    val isLoggedOut: Boolean = false,
    val boardsCount: Long = 0,
    val myTasksCount: Long = 0,
    val assignedTasksCount: Long = 0,
    val isStatsLoading: Boolean = false
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val themePreferences: ThemePreferences,
    private val realtimeManager: BoardRealtimeManager,
    private val supabaseClient: SupabaseClient
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        loadProfile()
        observeTheme()
    }

    private fun loadProfile() {
        val user = authRepository.currentUser()
        if (user == null) {
            _uiState.value = _uiState.value.copy(isLoggedOut = true)
        } else {
            _uiState.value = _uiState.value.copy(user = user)
            fetchStats(user.id)
        }
    }

    private fun fetchStats(userId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isStatsLoading = true)
            try {
                withContext(Dispatchers.IO) {
                    val boardsCountResponse = supabaseClient.postgrest["boards"]
                        .select {
                            filter { eq("user_id", userId) }
                            count(Count.EXACT)
                        }
                    val boardsCount = boardsCountResponse.countOrNull() ?: 0

                    val tasksCountResponse = supabaseClient.postgrest["tasks"]
                        .select {
                            count(Count.EXACT)
                        }
                    val tasksCount = tasksCountResponse.countOrNull() ?: 0

                    // Currently assuming assignee_id is not widely used, but querying tasks table
                    val assignedTasksCountResponse = supabaseClient.postgrest["tasks"]
                        .select {
                            filter { eq("assignee_id", userId) }
                            count(Count.EXACT)
                        }
                    val assignedTasksCount = assignedTasksCountResponse.countOrNull() ?: 0

                    _uiState.value = _uiState.value.copy(
                        boardsCount = boardsCount,
                        myTasksCount = tasksCount,
                        assignedTasksCount = assignedTasksCount,
                        isStatsLoading = false
                    )
                }
            } catch (e: Exception) {
                // Ignore failure and just stop loading
                _uiState.value = _uiState.value.copy(isStatsLoading = false)
            }
        }
    }

    private fun observeTheme() {
        viewModelScope.launch {
            themePreferences.themeFlow.collect { theme ->
                _uiState.value = _uiState.value.copy(theme = theme)
            }
        }
    }

    fun setTheme(theme: AppTheme) {
        viewModelScope.launch {
            themePreferences.setTheme(theme)
        }
    }

    fun logout() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            // 1. Realtime kanallarını kapat
            realtimeManager.unsubscribe()

            // 3. Supabase Auth signOut çağrısı
            val result = authRepository.logout()

            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(isLoading = false, isLoggedOut = true)
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Çıkış yapılamadı: ${it.localizedMessage}"
                    )
                }
            )
        }
    }

    fun clearErrorAndSuccess() {
        _uiState.value = _uiState.value.copy(error = null, successMessage = null)
    }
}
