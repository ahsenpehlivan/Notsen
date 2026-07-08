package com.notsen.feature.auth.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notsen.feature.auth.data.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.auth.status.SessionStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    val sessionStatus: StateFlow<SessionStatus> = authRepository.sessionStatus

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun loginWithGoogle() {
        viewModelScope.launch {
            _uiState.value = AuthUiState.OAuthLoading(OAuthProvider.GOOGLE)
            val result = authRepository.loginWithGoogle()
            if (result.isFailure) {
                _uiState.value = AuthUiState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
            }
        }
    }

    fun loginWithGithub() {
        viewModelScope.launch {
            _uiState.value = AuthUiState.OAuthLoading(OAuthProvider.GITHUB)
            val result = authRepository.loginWithGithub()
            if (result.isFailure) {
                _uiState.value = AuthUiState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
            }
        }
    }

    fun resetUiState() {
        _uiState.value = AuthUiState.Idle
    }
}

sealed class AuthUiState {
    object Idle : AuthUiState()
    data class OAuthLoading(val provider: OAuthProvider) : AuthUiState()
    object Success : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}
