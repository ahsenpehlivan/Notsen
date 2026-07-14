package com.notsen.feature.myday.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.notsen.core.designsystem.NotsenTheme
import kotlinx.coroutines.launch
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyDayScreen(
    viewModel: MyDayViewModel = hiltViewModel(),
    onNavigateToBoard: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    var showAddSheet by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_START) {
                viewModel.onStart()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    LaunchedEffect(uiState.snackbarEvent) {
        val event = uiState.snackbarEvent ?: return@LaunchedEffect
        
        when (event) {
            is MyDaySnackbarEvent.TaskAdded -> {
                val result = snackbarHostState.showSnackbar(
                    message = event.message,
                    actionLabel = "Geri al",
                    duration = SnackbarDuration.Short
                )
                if (result == SnackbarResult.ActionPerformed) {
                    viewModel.undoAddition(event.taskId)
                }
                viewModel.consumeSnackbarEvent()
            }
            is MyDaySnackbarEvent.TaskRemoved -> {
                val result = snackbarHostState.showSnackbar(
                    message = event.message,
                    actionLabel = "Geri al",
                    duration = SnackbarDuration.Short
                )
                if (result == SnackbarResult.ActionPerformed) {
                    viewModel.undoRemoval(event.taskId)
                }
                viewModel.consumeSnackbarEvent()
            }
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
        containerColor = NotsenTheme.colors.bgPrimary,
        floatingActionButton = {
            if (uiState.plannedTasks.isNotEmpty()) {
                FloatingActionButton(
                    onClick = { showAddSheet = true },
                    containerColor = NotsenTheme.colors.accentPrimary,
                    contentColor = NotsenTheme.colors.textPrimary
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Görev Ekle")
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = NotsenTheme.spacing.lg)
        ) {
            Spacer(modifier = Modifier.height(NotsenTheme.spacing.lg))
            
            // Header
            val dayName = uiState.selectedDate.dayOfWeek.getDisplayName(TextStyle.FULL, Locale("tr", "TR"))
            val monthName = uiState.selectedDate.month.getDisplayName(TextStyle.FULL, Locale("tr", "TR"))
            val formattedDate = "${uiState.selectedDate.dayOfMonth} $monthName $dayName"
            
            Text(
                text = "Günüm",
                style = NotsenTheme.typography.displaySmall,
                color = NotsenTheme.colors.textPrimary
            )
            Text(
                text = formattedDate,
                style = NotsenTheme.typography.bodyLarge,
                color = NotsenTheme.colors.textSecondary
            )
            
            Spacer(modifier = Modifier.height(NotsenTheme.spacing.xl))

            if (uiState.isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = NotsenTheme.colors.accentPrimary)
                }
            } else if (uiState.error != null) {
                Column(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = "Bir hata oluştu", style = NotsenTheme.typography.titleLarge, color = NotsenTheme.colors.textPrimary)
                    Text(text = uiState.error ?: "", style = NotsenTheme.typography.bodyMedium, color = NotsenTheme.colors.textSecondary, textAlign = TextAlign.Center)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { viewModel.loadMyDay() }, colors = ButtonDefaults.buttonColors(containerColor = NotsenTheme.colors.accentPrimary)) {
                        Text("Tekrar Dene", color = NotsenTheme.colors.textPrimary)
                    }
                }
            } else if (uiState.plannedTasks.isEmpty()) {
                Column(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = "Bugün için görev seçmedin", style = NotsenTheme.typography.titleLarge, color = NotsenTheme.colors.textPrimary)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = "Panolarındaki görevlerden bugün odaklanacaklarını ekle.", style = NotsenTheme.typography.bodyMedium, color = NotsenTheme.colors.textSecondary, textAlign = TextAlign.Center)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { showAddSheet = true }, colors = ButtonDefaults.buttonColors(containerColor = NotsenTheme.colors.accentPrimary)) {
                        Text("Görev Ekle", color = NotsenTheme.colors.textPrimary)
                    }
                }
            } else {
                Text(
                    text = "${uiState.plannedTasks.size} Görev",
                    style = NotsenTheme.typography.labelMedium,
                    color = NotsenTheme.colors.textMuted
                )
                Spacer(modifier = Modifier.height(NotsenTheme.spacing.md))
                
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.md),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(uiState.plannedTasks, key = { it.taskId }) { task ->
                        MyDayTaskCard(
                            task = task,
                            isRemoving = uiState.removingTaskId == task.taskId,
                            onRemove = { viewModel.removeTaskFromMyDay(task.taskId) },
                            onClick = { onNavigateToBoard(task.boardId) }
                        )
                    }
                    item {
                        Spacer(modifier = Modifier.height(100.dp))
                    }
                }
            }
        }

        if (showAddSheet) {
            ModalBottomSheet(
                onDismissRequest = { showAddSheet = false },
                sheetState = sheetState,
                containerColor = NotsenTheme.colors.bgSecondary
            ) {
                TaskPickerSheet(
                    uiState = uiState,
                    onSearchQueryChange = viewModel::updateSearchQuery,
                    onBoardFilterChange = viewModel::setBoardFilter,
                    onAddTask = viewModel::addTaskToMyDay
                )
            }
        }
    }
}

@Composable
fun MyDayTaskCard(
    task: MyDayTaskItem,
    isRemoving: Boolean,
    onRemove: () -> Unit,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = NotsenTheme.colors.bgSecondary
        ),
        shape = NotsenTheme.shapes.md
    ) {
        Column(modifier = Modifier.padding(NotsenTheme.spacing.lg)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = task.title,
                        style = NotsenTheme.typography.titleMedium,
                        color = NotsenTheme.colors.textPrimary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${task.boardTitle} • ${task.columnTitle}",
                        style = NotsenTheme.typography.bodySmall,
                        color = NotsenTheme.colors.textSecondary
                    )
                }
                IconButton(onClick = onRemove, enabled = !isRemoving) {
                    if (isRemoving) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = NotsenTheme.colors.accentPrimary,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(
                            Icons.Default.Close,
                            contentDescription = "Bugünden çıkar",
                            tint = NotsenTheme.colors.textMuted
                        )
                    }
                }
            }
            if (task.tags.isNotEmpty()) {
                Spacer(modifier = Modifier.height(NotsenTheme.spacing.sm))
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    task.tags.forEach { tag ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(NotsenTheme.colors.bgTertiary)
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "#$tag",
                                style = NotsenTheme.typography.labelSmall,
                                color = NotsenTheme.colors.accentPrimary
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskPickerSheet(
    uiState: MyDayUiState,
    onSearchQueryChange: (String) -> Unit,
    onBoardFilterChange: (String?) -> Unit,
    onAddTask: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(NotsenTheme.spacing.lg)
            .padding(bottom = NotsenTheme.spacing.xxl)
    ) {
        Text(
            text = "Görev Ekle",
            style = NotsenTheme.typography.titleLarge,
            color = NotsenTheme.colors.textPrimary
        )
        Spacer(modifier = Modifier.height(NotsenTheme.spacing.md))
        
        OutlinedTextField(
            value = uiState.searchQuery,
            onValueChange = onSearchQueryChange,
            placeholder = { Text("Görev ara...", color = NotsenTheme.colors.textSecondary) },
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = NotsenTheme.colors.textPrimary,
                unfocusedTextColor = NotsenTheme.colors.textPrimary,
                focusedBorderColor = NotsenTheme.colors.accentPrimary,
                unfocusedBorderColor = NotsenTheme.colors.glassBorderSubtle
            )
        )
        Spacer(modifier = Modifier.height(NotsenTheme.spacing.md))

        val filteredTasks = uiState.availableTasks.filter {
            (uiState.selectedBoardId == null || it.boardId == uiState.selectedBoardId) &&
            (uiState.searchQuery.isEmpty() || it.title.contains(uiState.searchQuery, ignoreCase = true))
        }

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.sm),
            modifier = Modifier.weight(1f, fill = false).heightIn(max = 400.dp)
        ) {
            items(filteredTasks, key = { it.taskId }) { task ->
                val isAdding = uiState.addingTaskId == task.taskId
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(NotsenTheme.shapes.sm)
                        .background(if (task.isPlannedToday) NotsenTheme.colors.bgTertiary else Color.Transparent)
                        .clickable(enabled = !task.isPlannedToday && !isAdding) {
                            onAddTask(task.taskId)
                        }
                        .padding(NotsenTheme.spacing.md),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = task.title,
                            style = NotsenTheme.typography.bodyMedium,
                            color = if (task.isPlannedToday) NotsenTheme.colors.textMuted else NotsenTheme.colors.textPrimary
                        )
                        Text(
                            text = "${task.boardTitle} • ${task.columnTitle}",
                            style = NotsenTheme.typography.labelSmall,
                            color = NotsenTheme.colors.textSecondary
                        )
                    }
                    if (isAdding) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = NotsenTheme.colors.accentPrimary,
                            strokeWidth = 2.dp
                        )
                    } else if (task.isPlannedToday) {
                        Text(
                            text = "Eklendi",
                            style = NotsenTheme.typography.labelSmall,
                            color = NotsenTheme.colors.textMuted
                        )
                    } else {
                        Icon(
                            Icons.Default.Add,
                            contentDescription = "Ekle",
                            tint = NotsenTheme.colors.accentPrimary
                        )
                    }
                }
            }
        }
    }
}
