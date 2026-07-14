package com.notsen.feature.main.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.automirrored.filled.Notes
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.NavType
import androidx.navigation.navArgument
import com.notsen.core.designsystem.*
import com.notsen.core.designsystem.components.NotsenBackground
import com.notsen.core.designsystem.components.NotsenButton
import com.notsen.feature.boarddetail.ui.BoardDetailScreen
import com.notsen.feature.home.ui.HomeScreen
import com.notsen.feature.profile.ui.ProfileScreen
import com.notsen.feature.quicknotes.ui.QuickNotesScreen
import com.notsen.feature.quicknotes.ui.QuickNotesViewModel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onNavigateToBoard: (String) -> Unit = {},
    onNavigateToSettings: () -> Unit = {},
    onNavigateToAuth: () -> Unit = {}
) {
    val navController = rememberNavController()
    var showQuickCapture by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val coroutineScope = rememberCoroutineScope()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    NotsenBackground {
        Scaffold(
            containerColor = Color.Transparent,
            bottomBar = {
                NavigationBar(
                    containerColor = NotsenTheme.colors.bgSecondary,
                    contentColor = NotsenTheme.colors.textSecondary,
                    tonalElevation = 0.dp
                ) {
                    val navItemColors = NavigationBarItemDefaults.colors(
                        selectedIconColor = NotsenTheme.colors.accentPrimary,
                        selectedTextColor = NotsenTheme.colors.accentPrimary,
                        indicatorColor = NotsenTheme.colors.bgHover,
                        unselectedIconColor = NotsenTheme.colors.textSecondary,
                        unselectedTextColor = NotsenTheme.colors.textSecondary
                    )

                    val topLevelRoutes = listOf("notes", "boards", "my_day", "profile")
                    val navigateToTopLevel: (String) -> Unit = { route ->
                        val currentRoute = currentDestination?.route
                        if (currentRoute != null && currentRoute !in topLevelRoutes) {
                            navController.popBackStack()
                        }
                        navController.navigate(route) {
                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }

                    NavigationBarItem(
                        icon = { Icon(Icons.AutoMirrored.Filled.Notes, contentDescription = "Hızlı Notlar") },
                        label = { Text("Hızlı Notlar", style = NotsenTheme.typography.labelSmall) },
                        selected = currentDestination?.hierarchy?.any { it.route == "notes" } == true,
                        colors = navItemColors,
                        onClick = { navigateToTopLevel("notes") }
                    )
                    NavigationBarItem(
                        icon = { Icon(Icons.Default.Dashboard, contentDescription = "Panolar") },
                        label = { Text("Panolar", style = NotsenTheme.typography.labelSmall) },
                        selected = currentDestination?.hierarchy?.any { it.route == "boards" } == true,
                        colors = navItemColors,
                        onClick = { navigateToTopLevel("boards") }
                    )
                    NavigationBarItem(
                        icon = { Icon(Icons.Default.DateRange, contentDescription = "Günüm") },
                        label = { Text("Günüm", style = NotsenTheme.typography.labelSmall) },
                        selected = currentDestination?.hierarchy?.any { it.route == "my_day" } == true,
                        colors = navItemColors,
                        onClick = { navigateToTopLevel("my_day") }
                    )
                    NavigationBarItem(
                        icon = { Icon(Icons.Default.Person, contentDescription = "Profil") },
                        label = { Text("Profil", style = NotsenTheme.typography.labelSmall) },
                        selected = currentDestination?.hierarchy?.any { it.route == "profile" } == true,
                        colors = navItemColors,
                        onClick = { navigateToTopLevel("profile") }
                    )
                }
            },
            floatingActionButton = {
                if (currentDestination?.hierarchy?.any { it.route == "notes" } != true && currentDestination?.hierarchy?.any { it.route == "my_day" } != true) {
                    FloatingActionButton(
                        onClick = { showQuickCapture = true },
                        containerColor = NotsenTheme.colors.accentPrimary,
                        contentColor = NotsenTheme.colors.textPrimary,
                        shape = NotsenTheme.shapes.lg
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Hızlı Not Ekle")
                    }
                }
            }
        ) { innerPadding ->
            NavHost(
                navController = navController,
                startDestination = "notes",
                modifier = Modifier.padding(innerPadding)
            ) {
                composable("my_day") {
                    com.notsen.feature.myday.ui.MyDayScreen(
                        onNavigateToBoard = { boardId ->
                            navController.navigate("board_detail/$boardId")
                        }
                    )
                }
                composable("boards") {
                    HomeScreen(onBoardClick = { boardId ->
                        navController.navigate("board_detail/$boardId")
                    })
                }
                composable("notes") {
                    QuickNotesScreen(onNavigateBack = { navController.popBackStack() })
                }
                composable("profile") {
                    ProfileScreen(onNavigateToAuth = onNavigateToAuth)
                }
                composable(
                    route = "board_detail/{boardId}",
                    arguments = listOf(navArgument("boardId") { type = NavType.StringType })
                ) { backStackEntry ->
                    val boardId = backStackEntry.arguments?.getString("boardId") ?: return@composable
                    BoardDetailScreen(
                        onNavigateBack = { navController.popBackStack() }
                    )
                }
            }
        }

        if (showQuickCapture) {
            ModalBottomSheet(
                onDismissRequest = { showQuickCapture = false },
                sheetState = sheetState,
                containerColor = NotsenTheme.colors.bgSecondary,
                contentColor = NotsenTheme.colors.textPrimary
            ) {
                QuickCaptureSheetContent(
                    onNoteAdded = {
                        coroutineScope.launch { sheetState.hide() }.invokeOnCompletion {
                            if (!sheetState.isVisible) {
                                showQuickCapture = false
                            }
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun QuickCaptureSheetContent(
    viewModel: QuickNotesViewModel = hiltViewModel(),
    onNoteAdded: () -> Unit
) {
    var text by remember { mutableStateOf("") }

    Column(modifier = Modifier.padding(NotsenTheme.spacing.xl).padding(bottom = NotsenTheme.spacing.xxl)) {
        Text("Hızlı Not Ekle", style = NotsenTheme.typography.headlineMedium, color = NotsenTheme.colors.textPrimary)
        Spacer(modifier = Modifier.height(NotsenTheme.spacing.lg))
        OutlinedTextField(
            value = text,
            onValueChange = { text = it },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Aklındakini yaz... (#etiket)", color = NotsenTheme.colors.textSecondary) },
            minLines = 3,
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = NotsenTheme.colors.textPrimary,
                unfocusedTextColor = NotsenTheme.colors.textPrimary,
                focusedBorderColor = NotsenTheme.colors.accentPrimary,
                unfocusedBorderColor = NotsenTheme.colors.glassBorderSubtle,
                focusedContainerColor = NotsenTheme.colors.bgTertiary,
                unfocusedContainerColor = NotsenTheme.colors.bgTertiary
            ),
            shape = NotsenTheme.shapes.md
        )
        Spacer(modifier = Modifier.height(NotsenTheme.spacing.lg))
        NotsenButton(
            text = "Kaydet",
            onClick = {
                if (text.isNotBlank()) {
                    viewModel.addNote(text)
                    onNoteAdded()
                }
            },
            modifier = Modifier.fillMaxWidth()
        )
    }
}
