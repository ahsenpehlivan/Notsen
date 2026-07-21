package com.notsen

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.notsen.core.designsystem.NotsenTheme
import dagger.hilt.android.AndroidEntryPoint

import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.notsen.core.datastore.ThemePreferences
import com.notsen.core.designsystem.AppTheme
import android.content.Intent
import android.util.Log
import androidx.compose.runtime.LaunchedEffect
import javax.inject.Inject
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.handleDeeplinks
import io.github.jan.supabase.auth.status.SessionStatus
import com.notsen.core.network.SessionCoordinator

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var themePreferences: ThemePreferences

    @Inject
    lateinit var supabase: SupabaseClient

    @Inject
    lateinit var sessionCoordinator: SessionCoordinator

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleAuthDeepLinkIfPresent(intent)
    }

    private fun handleAuthDeepLinkIfPresent(intent: Intent?) {
        intent?.let {
            if (it.scheme == "notsen" && it.data?.host == "auth") {
                Log.d("SupabaseAuth", "AUTH_DEEPLINK_RECEIVED")
                try {
                    supabase.handleDeeplinks(it)
                    Log.d("SupabaseAuth", "AUTH_DEEPLINK_HANDLED_SUCCESS")
                } catch (e: Exception) {
                    Log.e("SupabaseAuth", "AUTH_DEEPLINK_HANDLED_FAILURE", e)
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.i("NotsenDebug", "NOTSEN_BUILD versionName=${BuildConfig.VERSION_NAME} versionCode=${BuildConfig.VERSION_CODE} buildType=debug")

        handleAuthDeepLinkIfPresent(intent)

        setContent {
            val appTheme by themePreferences.themeFlow.collectAsState(initial = AppTheme.CHARCOAL)
            NotsenTheme(appTheme = appTheme) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    val sessionStatus by supabase.auth.sessionStatus.collectAsState()

                    LaunchedEffect(Unit) {
                        sessionCoordinator.sessionExpiredEvent.collect {
                            val currentRoute = navController.currentDestination?.route
                            if (currentRoute != "login" && currentRoute != "register") {
                                navController.navigate("login") {
                                    popUpTo(navController.graph.id) { inclusive = true }
                                    launchSingleTop = true
                                }
                            }
                        }
                    }

                    LaunchedEffect(sessionStatus) {
                        val currentRoute = navController.currentDestination?.route
                        when (sessionStatus) {
                            is SessionStatus.Authenticated -> {
                                Log.d("SupabaseAuth", "OAUTH_SESSION_AUTHENTICATED")
                                if (currentRoute == "login" || currentRoute == "register") {
                                    Log.d("SupabaseAuth", "OAUTH_NAVIGATE_HOME")
                                    navController.navigate("home") {
                                        popUpTo(navController.graph.id) { inclusive = true }
                                        launchSingleTop = true
                                    }
                                }
                            }
                            is SessionStatus.NotAuthenticated, is SessionStatus.RefreshFailure -> {
                                if (currentRoute != "login" && currentRoute != "register") {
                                    navController.navigate("login") {
                                        popUpTo(navController.graph.id) { inclusive = true }
                                        launchSingleTop = true
                                    }
                                }
                            }
                            else -> {}
                        }
                    }

                    NavHost(navController = navController, startDestination = "login") {
                        composable("login") {
                            com.notsen.feature.auth.ui.LoginScreen(
                                onNavigateToRegister = { navController.navigate("register") }
                            )
                        }
                        composable("register") {
                            com.notsen.feature.auth.ui.RegisterScreen(
                                onNavigateToLogin = { navController.popBackStack() }
                            )
                        }
                        composable("home") {
                            com.notsen.feature.main.ui.MainScreen(
                                onNavigateToAuth = {
                                    navController.navigate("login") {
                                        popUpTo(navController.graph.id) { inclusive = true }
                                        launchSingleTop = true
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
