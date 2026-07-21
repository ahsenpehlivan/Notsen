package com.notsen.core.network

import android.util.Log
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.exceptions.RestException
import io.github.jan.supabase.auth.exception.TokenExpiredException
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionCoordinator @Inject constructor(
    private val supabaseClient: SupabaseClient
) {
    private val _sessionExpiredEvent = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val sessionExpiredEvent = _sessionExpiredEvent.asSharedFlow()

    private val mutex = Mutex()
    private var isRefreshing = false

    suspend fun <T> safeRequest(apiCall: suspend () -> T): T {
        return try {
            apiCall()
        } catch (e: Exception) {
            if (isTokenExpiredException(e)) {
                val refreshed = attemptRefresh()
                if (refreshed) {
                    // Retry once if refresh succeeded
                    return apiCall()
                } else {
                    throw e
                }
            }
            throw e
        }
    }

    internal fun isTokenExpiredException(e: Exception): Boolean {
        val message = e.message ?: ""
        if (e is TokenExpiredException || (e is RestException && e.error == "invalid_token")) return true
        if (message.contains("TokenExpiredException", ignoreCase = true)) return true
        if (message.contains("token has expired", ignoreCase = true)) return true
        if (message.contains("JWT", ignoreCase = true) && message.contains("expired", ignoreCase = true)) return true
        return false
    }

    private suspend fun attemptRefresh(): Boolean {
        // Prevent concurrent refreshes
        mutex.withLock {
            if (isRefreshing) {
                // If another coroutine is already refreshing, wait for it to finish
                // Returning true will cause the caller to retry the request. If the token is still invalid, it will fail again.
                // But normally the SDK's token refresh will update the token globally.
                return true
            }
            isRefreshing = true
        }

        try {
            Log.w("NotsenAuth", "AUTH_TOKEN_EXPIRED")
            Log.d("NotsenAuth", "AUTH_REFRESH_STARTED")
            
            supabaseClient.auth.refreshCurrentSession()
            
            Log.d("NotsenAuth", "AUTH_REFRESH_SUCCESS")
            return true
        } catch (e: Exception) {
            Log.e("NotsenAuth", "AUTH_REFRESH_FAILED")
            Log.d("NotsenAuth", "AUTH_SESSION_CLEARED")
            
            // Clear session to ensure we don't hold invalid token
            try { supabaseClient.auth.clearSession() } catch (ignore: Exception) {}
            
            Log.d("NotsenAuth", "AUTH_NAVIGATE_LOGIN")
            _sessionExpiredEvent.tryEmit(Unit)
            
            return false
        } finally {
            mutex.withLock { isRefreshing = false }
        }
    }
}

