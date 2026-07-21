package com.notsen.core.network

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.exception.TokenExpiredException
import io.mockk.*
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.launch
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import io.ktor.client.statement.HttpResponse

@OptIn(ExperimentalCoroutinesApi::class)
class SessionCoordinatorTest {

    private lateinit var supabaseClient: SupabaseClient
    private lateinit var auth: Auth
    private lateinit var sessionCoordinator: SessionCoordinator

    @Before
    fun setup() {
        supabaseClient = mockk()
        auth = mockk(relaxed = true)
        
        mockkStatic("io.github.jan.supabase.auth.AuthKt")
        mockkStatic(android.util.Log::class)
        every { android.util.Log.d(any(), any()) } returns 0
        every { android.util.Log.e(any(), any()) } returns 0
        every { android.util.Log.e(any(), any(), any()) } returns 0
        every { android.util.Log.w(any(), any<String>()) } returns 0
        every { android.util.Log.i(any(), any()) } returns 0

        every { supabaseClient.auth } returns auth

        sessionCoordinator = SessionCoordinator(supabaseClient)
    }

    @Test
    fun `isTokenExpiredException correctly matches explicit exceptions and rejects unrelated ones`() = runTest {
        val trueCases = listOf(
            TokenExpiredException(),
            io.github.jan.supabase.exceptions.RestException(error = "invalid_token", description = "The token has expired", response = mockk<HttpResponse>(relaxed=true)),
            Exception("Custom TokenExpiredException message"),
            Exception("My token has expired suddenly"),
            Exception("the JWT is expired")
        )

        trueCases.forEach { ex ->
            val isExpired = sessionCoordinator.isTokenExpiredException(ex)
            assertTrue("Expected true for $ex: $ex.message", isExpired)
        }

        val falseCases = listOf(
            io.github.jan.supabase.exceptions.RestException(error = "unauthorized", description = "Some other 401", response = mockk<HttpResponse>(relaxed=true)),
            Exception("RLS violation"),
            Exception("Network timeout"),
            Exception("Cannot parse token properly") 
        )

        falseCases.forEach { ex ->
            val isExpired = sessionCoordinator.isTokenExpiredException(ex)
            assertFalse("Expected false for $ex: $ex.message", isExpired)
        }
    }

    @Test
    fun `safeRequest succeeds on first try`() = runTest {
        var callCount = 0
        val result = sessionCoordinator.safeRequest {
            callCount++
            "success"
        }
        assertEquals("success", result)
        assertEquals(1, callCount)
    }

    @Test
    fun `safeRequest retries once and succeeds if token is expired`() = runTest {
        var callCount = 0
        coEvery { auth.refreshCurrentSession() } returns Unit

        val result = sessionCoordinator.safeRequest {
            callCount++
            if (callCount == 1) {
                throw TokenExpiredException()
            }
            "success"
        }

        assertEquals("success", result)
        assertEquals(2, callCount)
        coVerify(exactly = 1) { auth.refreshCurrentSession() }
    }

    @Test
    fun `RestException error=invalid_token aynı refresh akışını tetikler`() = runTest {
        var callCount = 0
        coEvery { auth.refreshCurrentSession() } returns Unit

        val result = sessionCoordinator.safeRequest {
            callCount++
            if (callCount == 1) {
                throw io.github.jan.supabase.exceptions.RestException(
                    error = "invalid_token",
                    description = "The token has expired",
                    response = mockk(relaxed=true)
                )
            }
            "success"
        }

        assertEquals("success", result)
        assertEquals(2, callCount)
        coVerify(exactly = 1) { auth.refreshCurrentSession() }
    }

    @Test
    fun `safeRequest fails and clears session if refresh fails`() = runTest {
        coEvery { auth.refreshCurrentSession() } throws Exception("Refresh failed")

        var sessionExpiredEventCount = 0

        val collectorJob = backgroundScope.launch(
            UnconfinedTestDispatcher(testScheduler)
        ) {
            sessionCoordinator.sessionExpiredEvent.collect {
                sessionExpiredEventCount++
            }
        }

        runCurrent()

        val thrown = runCatching {
            sessionCoordinator.safeRequest<Any> {
                throw TokenExpiredException()
            }
        }.exceptionOrNull()

        advanceUntilIdle()

        assertTrue(thrown is TokenExpiredException)
        assertEquals(1, sessionExpiredEventCount)
        coVerify(exactly = 1) { auth.refreshCurrentSession() }
        coVerify(exactly = 1) { auth.clearSession() }

        collectorJob.cancel()
    }

    @Test
    fun `concurrent expired requests only trigger refresh once`() = runTest {
        coEvery { auth.refreshCurrentSession() } coAnswers {
            delay(100)
        }

        val request1 = async {
            try {
                sessionCoordinator.safeRequest { throw TokenExpiredException() }
            } catch (e: Exception) { "failed" }
        }
        val request2 = async {
            try {
                sessionCoordinator.safeRequest { throw TokenExpiredException() }
            } catch (e: Exception) { "failed" }
        }

        val results = awaitAll(request1, request2)
        
        assertEquals(listOf("failed", "failed"), results)
        
        coVerify(exactly = 1) { auth.refreshCurrentSession() }
    }
}




