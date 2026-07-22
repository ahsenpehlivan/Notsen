package com.notsen.feature.boarddetail.ui

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGesturesAfterLongPress
import androidx.compose.foundation.gestures.scrollBy
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.notsen.core.designsystem.*
import com.notsen.core.designsystem.components.*
import com.notsen.core.model.Column as BoardColumn
import com.notsen.core.model.Task
import kotlinx.coroutines.isActive

internal val LocalBoardDragDropState = compositionLocalOf { BoardDragDropState() }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BoardDetailScreen(
    viewModel: BoardDetailViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val dragDropState = rememberBoardDragDropState()

    LaunchedEffect(Unit) {
        viewModel.navigationEvent.collect { action ->
            when (action) {
                is NavigationAction.NavigateBack -> onNavigateBack()
            }
        }
    }

    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_START) {
                viewModel.onStart()
            }
            if (event == Lifecycle.Event.ON_STOP) {
                viewModel.onStop()
                dragDropState.onDragCancel()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    var showAddColumnDialog by remember { mutableStateOf(false) }
    var columnTitleInput by remember { mutableStateOf("") }

    var columnIdForNewTask by remember { mutableStateOf<String?>(null) }
    var taskTitleInput by remember { mutableStateOf("") }

    // Task Options Dialog State
    var selectedTask by remember { mutableStateOf<Task?>(null) }

    var showBoardMenu by remember { mutableStateOf(false) }
    var showDeleteBoardConfirm by remember { mutableStateOf(false) }

    var columnIdToRename by remember { mutableStateOf<String?>(null) }
    var renameColumnTitle by remember { mutableStateOf("") }
    var columnIdToDelete by remember { mutableStateOf<String?>(null) }

    var showRenameBoardDialog by remember { mutableStateOf(false) }
    var renameBoardTitle by remember { mutableStateOf("") }

    // Drop Indicator ve UI stabilitesi iÃ§in preview hesaplamasÄ±nÄ± kaldÄ±rdÄ±k.
    // Drag sÃ„Â±rasÃ„Â±nda elemanlarÃ„Â±n fiziksel olarak yer deÃ„Å¸iÃ…Å¸tirmesi sonsuz dÃƒÂ¶ngÃƒÂ¼ye (oscillation) ve
    // emÃƒÂ¼latÃƒÂ¶rde aÃ…Å¸Ã„Â±rÃ„Â± yavaÃ…Å¸lamaya sebep oluyordu. ArtÃ„Â±k sadece hedef ÃƒÂ§izgisi (Drop Indicator) gÃƒÂ¶stereceÃ„Å¸iz.

    // Modal Dialogs
    if (showAddColumnDialog) {
        AlertDialog(
            onDismissRequest = { showAddColumnDialog = false },
            title = { Text("Yeni SÃƒÂ¼tun Ekle") },
            text = {
                OutlinedTextField(
                    value = columnTitleInput,
                    onValueChange = { columnTitleInput = it },
                    label = { Text("SÃƒÂ¼tun BaÃ…Å¸lÃ„Â±Ã„Å¸Ã„Â±") },
                    singleLine = true
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    if (columnTitleInput.isNotBlank()) {
                        viewModel.addColumn(columnTitleInput)
                        showAddColumnDialog = false
                        columnTitleInput = ""
                    }
                }) { Text("Ekle") }
            },
            dismissButton = {
                TextButton(onClick = { showAddColumnDialog = false }) { Text("Ã„Â°Ä°ptal") }
            }
        )
    }

    if (columnIdForNewTask != null) {
        AlertDialog(
            onDismissRequest = { columnIdForNewTask = null },
            title = { Text("Yeni GÃƒÂ¶rev Ekle") },
            text = {
                OutlinedTextField(
                    value = taskTitleInput,
                    onValueChange = { taskTitleInput = it },
                    label = { Text("GÃƒÂ¶rev BaÃ…Å¸lÃ„Â±Ã„Å¸Ã„Â±") },
                    singleLine = true
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    if (taskTitleInput.isNotBlank()) {
                        viewModel.addTask(columnIdForNewTask!!, taskTitleInput)
                        columnIdForNewTask = null
                        taskTitleInput = ""
                    }
                }) { Text("Ekle") }
            },
            dismissButton = {
                TextButton(onClick = { columnIdForNewTask = null }) { Text("Ã„Â°Ä°ptal") }
            }
        )
    }

    if (selectedTask != null) {
        val task = uiState.tasksByColumn.values.flatten().find { it.id == selectedTask!!.id } ?: selectedTask!!
        TaskDetailSheet(
            task = task,
            error = uiState.error,
            boardLabels = uiState.boardLabels,
            members = uiState.members,
            canEdit = uiState.currentUserRole?.canEditColumnsAndTasks == true,
            onDismissRequest = { selectedTask = null },
            onSave = { title, desc, dueDate, tags, assignee, onSaveError ->
                viewModel.updateTaskDetails(
                    taskId = task.id,
                    columnId = task.columnId,
                    newTitle = title,
                    newDescription = desc,
                    dueDate = dueDate,
                    tags = tags,
                    assignee = assignee,
                    onSuccess = { selectedTask = null },
                    onError = { onSaveError() }
                )
            },
            onDelete = {
                viewModel.deleteTask(task.id, task.columnId)
                selectedTask = null
            },
            onChecklistMutation = { mutation ->
                viewModel.updateTaskChecklist(task.id, mutation)
            }
        )
    }

    if (showDeleteBoardConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteBoardConfirm = false },
            title = { Text("Panoyu Sil") },
            text = { Text("Bu pano; sÃ¼tunlarÄ±, gÃ¶revleri, Ã¼yelikleri, etkinlik kayÄ±tlarÄ± ve gÃ¶revlere baÄŸlÄ± GÃ¼nÃ¼m planlarÄ±yla birlikte kalÄ±cÄ± olarak silinecek.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.deleteBoard()
                        showDeleteBoardConfirm = false
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) { Text("Sil") }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteBoardConfirm = false }) { Text("Ä°ptal") }
            }
        )
    }

    if (showRenameBoardDialog) {
        AlertDialog(
            onDismissRequest = { showRenameBoardDialog = false },
            title = { Text("Pano AdÄ±nÄ± DeÄŸiÅŸtir") },
            text = {
                OutlinedTextField(
                    value = renameBoardTitle,
                    onValueChange = { renameBoardTitle = it },
                    label = { Text("Yeni BaÅŸlÄ±k") },
                    singleLine = true
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    if (renameBoardTitle.isNotBlank()) {
                        viewModel.renameBoard(renameBoardTitle)
                        showRenameBoardDialog = false
                        renameBoardTitle = ""
                    }
                }) { Text("Kaydet") }
            },
            dismissButton = {
                TextButton(onClick = { showRenameBoardDialog = false }) { Text("Ä°ptal") }
            }
        )
    }

    if (columnIdToRename != null) {
        AlertDialog(
            onDismissRequest = { columnIdToRename = null },
            title = { Text("SÃ¼tun AdÄ±nÄ± DÃ¼zenle") },
            text = {
                OutlinedTextField(
                    value = renameColumnTitle,
                    onValueChange = { renameColumnTitle = it },
                    label = { Text("Yeni BaÅŸlÄ±k") },
                    singleLine = true
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    if (renameColumnTitle.isNotBlank()) {
                        viewModel.renameColumn(columnIdToRename!!, renameColumnTitle)
                        columnIdToRename = null
                        renameColumnTitle = ""
                    }
                }) { Text("Kaydet") }
            },
            dismissButton = {
                TextButton(onClick = { columnIdToRename = null }) { Text("Ä°ptal") }
            }
        )
    }

    if (columnIdToDelete != null) {
        val taskCount = uiState.tasksByColumn[columnIdToDelete]?.size ?: 0
        AlertDialog(
            onDismissRequest = { columnIdToDelete = null },
            title = { Text("SÃ¼tunu Sil") },
            text = {
                if (taskCount > 0) {
                    Text("Bu sÃ¼tunda $taskCount gÃ¶rev var. SÃ¼tun, iÃ§indeki gÃ¶revler ve bu gÃ¶revlere ait GÃ¼nÃ¼m planlarÄ± kalÄ±cÄ± olarak silinecek.")
                } else {
                    Text("Bu sÃ¼tun kalÄ±cÄ± olarak silinsin mi?")
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.deleteColumn(columnIdToDelete!!)
                        columnIdToDelete = null
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) { Text("Sil") }
            },
            dismissButton = {
                TextButton(onClick = { columnIdToDelete = null }) { Text("Ä°ptal") }
            }
        )
    }
    if (uiState.showMembersSheet) {
        BoardMembersBottomSheet(
            members = uiState.members,
            currentUserRole = uiState.currentUserRole,
            isLoading = uiState.isMemberActionLoading,
            error = uiState.error,
            successMessage = uiState.memberActionSuccess,
            onDismissRequest = { viewModel.toggleMembersSheet(false) },
            onInvite = { email, role -> viewModel.inviteMember(email, role) },
            onRoleChange = { id, role -> viewModel.updateMemberRole(id, role) },
            onRemove = { id -> viewModel.removeMember(id) },
            onClearError = { viewModel.clearError() },
            onClearSuccess = { viewModel.clearMemberActionSuccess() }
        )
    }

    if (uiState.showActivityLogsSheet) {
        ActivityLogBottomSheet(
            logs = uiState.activityLogs,
            onDismissRequest = { viewModel.toggleActivityLogsSheet(false) }
        )
    }

    val horizontalScrollState = rememberLazyListState()

    // Horizontal Auto-Scroll Loop
    LaunchedEffect(dragDropState.isDragging, dragDropState.horizontalScrollVelocity) {
        if (dragDropState.isDragging) {
            while (isActive) {
                val hVel = dragDropState.horizontalScrollVelocity
                if (hVel != 0f) {
                    horizontalScrollState.scrollBy(hVel)
                }
                kotlinx.coroutines.delay(16L) // ~60fps
            }
        }
    }

    NotsenBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = { Text(viewModel.boardTitle, style = NotsenTheme.typography.headlineMedium) },
                    navigationIcon = {
                        IconButton(onClick = onNavigateBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Geri", tint = NotsenTheme.colors.textPrimary)
                        }
                    },
                    actions = {
                        IconButton(onClick = { viewModel.toggleMembersSheet(true) }) {
                            Icon(Icons.Default.Person, contentDescription = "Ãœyeler", tint = NotsenTheme.colors.textPrimary)
                        }
                        IconButton(onClick = { viewModel.toggleActivityLogsSheet(true) }) {
                            Icon(Icons.AutoMirrored.Filled.List, contentDescription = "Aktivite", tint = NotsenTheme.colors.textPrimary)
                        }
                        if (uiState.currentUserRole?.canRenameBoard == true || uiState.currentUserRole?.canDeleteBoard == true) {
                            Box {
                                IconButton(onClick = { showBoardMenu = true }) {
                                    Icon(Icons.Default.MoreVert, contentDescription = "Pano SeÃ§enekleri", tint = NotsenTheme.colors.textPrimary)
                                }
                                DropdownMenu(
                                    expanded = showBoardMenu,
                                    onDismissRequest = { showBoardMenu = false },
                                    modifier = Modifier.background(NotsenTheme.colors.bgSecondary)
                                ) {
                                    if (uiState.currentUserRole?.canRenameBoard == true) {
                                        DropdownMenuItem(
                                            text = { Text("Pano AdÄ±nÄ± DeÄŸiÅŸtir", color = NotsenTheme.colors.textPrimary) },
                                            onClick = {
                                                showBoardMenu = false
                                                renameBoardTitle = viewModel.boardTitle
                                                showRenameBoardDialog = true
                                            },
                                            leadingIcon = {
                                                Icon(Icons.Default.Edit, contentDescription = null, tint = NotsenTheme.colors.textPrimary)
                                            }
                                        )
                                    }
                                    if (uiState.currentUserRole?.canDeleteBoard == true) {
                                        DropdownMenuItem(
                                            text = { Text("Panoyu Sil", color = MaterialTheme.colorScheme.error) },
                                            onClick = {
                                                showBoardMenu = false
                                                showDeleteBoardConfirm = true
                                            },
                                            leadingIcon = {
                                                Icon(Icons.Default.Delete, contentDescription = null, tint = MaterialTheme.colorScheme.error)
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color.Transparent,
                        titleContentColor = NotsenTheme.colors.textPrimary
                    )
                )
            }
        ) { paddingValues ->
            CompositionLocalProvider(LocalBoardDragDropState provides dragDropState) {
                // ROOT BOX (No padding) - For Overlay
                Box(modifier = Modifier.fillMaxSize()) {

                    // CONTENT BOX (With padding)
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                    ) {
                    if (uiState.isLoading) {
                        CircularProgressIndicator(modifier = Modifier.align(Alignment.Center), color = NotsenTheme.colors.accentPrimary)
                    } else if (uiState.error != null) {
                        Text(
                            text = uiState.error ?: "Bilinmeyen hata",
                            color = NotsenTheme.colors.danger,
                            style = NotsenTheme.typography.bodyMedium,
                            modifier = Modifier.align(Alignment.Center).padding(NotsenTheme.spacing.lg)
                        )
                    } else {
                        LazyRow(
                            state = horizontalScrollState,
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(horizontal = NotsenTheme.spacing.xxl, vertical = NotsenTheme.spacing.lg),
                            horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.xl)
                        ) {
                            items(items = uiState.columns, key = { it.id }) { column ->
                                ColumnContainer(
                                    column = column,
                                    tasks = uiState.tasksByColumn[column.id] ?: emptyList(),
                                    plannedTaskIds = uiState.plannedTaskIds,
                                    currentUserRole = uiState.currentUserRole,
                                    onAddTaskClick = { columnIdForNewTask = column.id },
                                    onTaskClick = { task ->
                                        selectedTask = task
                                    },
                                    onRenameColumnClick = {
                                        renameColumnTitle = column.title
                                        columnIdToRename = column.id
                                    },
                                    onDeleteColumnClick = { columnIdToDelete = column.id }
                                )
                            }
                            if (uiState.currentUserRole?.canEditColumnsAndTasks == true) {
                                item {
                                    Box(
                                        modifier = Modifier
                                            .width(310.dp)
                                            .clip(NotsenTheme.shapes.lg)
                                            .background(NotsenTheme.colors.bgHover)
                                            .border(2.dp, NotsenTheme.colors.glassBorderSubtle, NotsenTheme.shapes.lg)
                                            .clickable { showAddColumnDialog = true }
                                            .padding(NotsenTheme.spacing.lg),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.sm)) {
                                            Icon(Icons.Default.Add, contentDescription = null, tint = NotsenTheme.colors.accentPrimary)
                                            Text("SÃƒÂ¼tun Ekle", style = NotsenTheme.typography.labelLarge, color = NotsenTheme.colors.textPrimary)
                                        }
                                    }
                                }
                            }
                        }
                    }
                } // End of CONTENT BOX

                // OVERLAY (Root seviyesinde, padding'den etkilenmez)
                if (dragDropState.isDragging && dragDropState.draggedTaskId != null) {
                    val draggedTask = uiState.tasksByColumn.values.flatten().find { it.id == dragDropState.draggedTaskId }
                    if (draggedTask != null) {
                        Box(
                            modifier = Modifier
                                .graphicsLayer {
                                    translationX = dragDropState.pointerPosition.x - 130.dp.toPx()
                                    translationY = dragDropState.pointerPosition.y - 40.dp.toPx()
                                    scaleX = 1.05f
                                    scaleY = 1.05f
                                    shadowElevation = 16.dp.toPx()
                                }
                                .width(260.dp)
                                .zIndex(100f)
                        ) {
                            TaskCard(task = draggedTask, isGhost = false, isOverlay = true, isPlanned = uiState.plannedTaskIds.contains(draggedTask.id), onClick = {})
                        }
                    }
                }
            } // End of ROOT BOX
        }
    }
}
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ColumnContainer(
    column: BoardColumn,
    tasks: List<Task>,
    plannedTaskIds: Set<String>,
    currentUserRole: com.notsen.core.model.PermissionRole?,
    onAddTaskClick: () -> Unit,
    onTaskClick: (Task) -> Unit,
    onRenameColumnClick: () -> Unit,
    onDeleteColumnClick: () -> Unit
) {
    val dragDropState = LocalBoardDragDropState.current
    val verticalScrollState = rememberLazyListState()
    var showColumnMenu by remember { mutableStateOf(false) }

    // Vertical Auto-Scroll Loop for this column
    LaunchedEffect(dragDropState.isDragging, dragDropState.verticalScrollVelocity, dragDropState.currentTargetColumnId) {
        if (dragDropState.isDragging && dragDropState.currentTargetColumnId == column.id) {
            while (isActive) {
                val vVel = dragDropState.verticalScrollVelocity
                if (vVel != 0f) {
                    verticalScrollState.scrollBy(vVel)
                }
                kotlinx.coroutines.delay(16L)
            }
        }
    }

    NotsenGlassCard(
        modifier = Modifier
            .width(310.dp)
            .fillMaxHeight(),
        backgroundColor = NotsenTheme.colors.bgSecondary,
        borderColor = NotsenTheme.colors.glassBorderSubtle,
        shape = NotsenTheme.shapes.lg
    ) {
        Column(
            modifier = Modifier
                .padding(NotsenTheme.spacing.lg)
                .onGloballyPositioned { coordinates ->
                    dragDropState.columnBounds[column.id] = coordinates.boundsInRoot()
                }
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = column.title,
                    style = NotsenTheme.typography.titleMedium,
                    color = NotsenTheme.colors.textPrimary,
                    modifier = Modifier.padding(bottom = NotsenTheme.spacing.lg, start = NotsenTheme.spacing.xs, top = NotsenTheme.spacing.xs).weight(1f)
                )
                if (currentUserRole?.canEditColumnsAndTasks == true) {
                    Box {
                        IconButton(
                            onClick = { showColumnMenu = true },
                            enabled = !dragDropState.isDragging
                        ) {
                            Icon(Icons.Default.MoreVert, contentDescription = "SÃ¼tun SeÃ§enekleri", tint = if (dragDropState.isDragging) NotsenTheme.colors.textSecondary.copy(alpha = 0.5f) else NotsenTheme.colors.textSecondary)
                        }
                        DropdownMenu(
                            expanded = showColumnMenu,
                            onDismissRequest = { showColumnMenu = false },
                            modifier = Modifier.background(NotsenTheme.colors.bgSecondary)
                        ) {
                            DropdownMenuItem(
                                text = { Text("Yeniden AdlandÄ±r", color = NotsenTheme.colors.textPrimary) },
                                onClick = {
                                    showColumnMenu = false
                                    onRenameColumnClick()
                                },
                                leadingIcon = {
                                    Icon(Icons.Default.Edit, contentDescription = null, tint = NotsenTheme.colors.textPrimary)
                                }
                            )
                            DropdownMenuItem(
                                text = { Text("SÃ¼tunu Sil", color = MaterialTheme.colorScheme.error) },
                                onClick = {
                                    showColumnMenu = false
                                    onDeleteColumnClick()
                                },
                                leadingIcon = {
                                    Icon(Icons.Default.Delete, contentDescription = null, tint = MaterialTheme.colorScheme.error)
                                }
                            )
                        }
                    }
                }
            }

            LazyColumn(
                state = verticalScrollState,
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.md)
            ) {
                items(items = tasks, key = { it.id }) { task ->
                    val isPlaceholder = dragDropState.isDragging && task.id == dragDropState.draggedTaskId
                    val isTargetHere = dragDropState.isDragging && dragDropState.currentTargetColumnId == column.id && dragDropState.currentTargetIndex == tasks.indexOf(task)

                    Column {
                        // Drop Indicator (BÃ„Â±rakÃ„Â±lacak hedef ÃƒÂ§izgisi)
                        if (isTargetHere && !isPlaceholder) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(4.dp)
                                    .clip(NotsenTheme.shapes.sm)
                                    .background(NotsenTheme.colors.accentPrimary)
                            )
                            Spacer(modifier = Modifier.height(NotsenTheme.spacing.sm))
                        }

                        Box(
                            modifier = Modifier
                                .onGloballyPositioned { coords ->
                                    dragDropState.taskBounds[task.id] = coords.boundsInRoot()
                                }
                        ) {
                            TaskCard(task = task, isGhost = isPlaceholder, isOverlay = false, isPlanned = plannedTaskIds.contains(task.id), onClick = { onTaskClick(task) })
                        }
                    }
                }
                item {
                    val isTargetEnd = dragDropState.isDragging && dragDropState.currentTargetColumnId == column.id && dragDropState.currentTargetIndex == tasks.size
                    Column {
                        if (isTargetEnd) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(4.dp)
                                    .clip(NotsenTheme.shapes.sm)
                                    .background(NotsenTheme.colors.accentPrimary)
                            )
                            Spacer(modifier = Modifier.height(NotsenTheme.spacing.sm))
                        }
                        if (currentUserRole?.canEditColumnsAndTasks == true) {
                            TextButton(
                                onClick = onAddTaskClick,
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.textButtonColors(contentColor = NotsenTheme.colors.textSecondary)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("GÃƒÂ¶rev Ekle", style = NotsenTheme.typography.labelMedium)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TaskCard(task: Task, isGhost: Boolean = false, isOverlay: Boolean = false, isPlanned: Boolean = false, onClick: () -> Unit) {
    val dragDropState = LocalBoardDragDropState.current
    val viewModel: BoardDetailViewModel = hiltViewModel()

    var cardPositionInRoot by remember { mutableStateOf(Offset.Zero) }

    val baseModifier = if (isOverlay) {
        Modifier.fillMaxWidth().border(2.dp, NotsenTheme.colors.accentPrimary, NotsenTheme.shapes.md)
    } else if (isPlanned) {
        Modifier
            .fillMaxWidth()
            .border(1.5.dp, NotsenTheme.colors.accentPrimary, NotsenTheme.shapes.md)
            .onGloballyPositioned { coords ->
                cardPositionInRoot = coords.positionInRoot()
            }
    } else {
        Modifier
            .fillMaxWidth()
            .onGloballyPositioned { coords ->
                cardPositionInRoot = coords.positionInRoot()
            }
    }

    val alphaModifier = if (isGhost) Modifier.graphicsLayer { alpha = 0.01f } else Modifier

    NotsenGlassCard(
        modifier = baseModifier.then(alphaModifier),
        backgroundColor = if (isGhost) NotsenTheme.colors.bgHover else NotsenTheme.colors.bgTertiary,
        borderColor = NotsenTheme.colors.glassBorderSubtle,
        shape = NotsenTheme.shapes.md,
        onClick = onClick
    ) {
        Column(
            modifier = Modifier.padding(NotsenTheme.spacing.lg)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Text(
                    text = task.title,
                    style = NotsenTheme.typography.labelLarge,
                    color = NotsenTheme.colors.textPrimary,
                    modifier = Modifier.weight(1f)
                )
                if (isPlanned) {
                    Icon(
                        imageVector = Icons.Default.DateRange,
                        contentDescription = "GÃ¼nÃ¼m'de",
                        tint = NotsenTheme.colors.accentPrimary,
                        modifier = Modifier.size(16.dp).padding(start = 4.dp)
                    )
                }
            }
            if (task.description.isNotBlank()) {
                Spacer(modifier = Modifier.height(NotsenTheme.spacing.xs))
                Text(
                    text = task.description,
                    style = NotsenTheme.typography.bodyMedium,
                    color = NotsenTheme.colors.textSecondary,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            if (task.tags?.isNotEmpty() == true || task.dueDate != null || !task.checklist.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(NotsenTheme.spacing.md))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.sm),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (!task.checklist.isNullOrEmpty()) {
                            val (done, total) = ChecklistUiHelpers.calculateChecklistProgress(task.checklist)
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = "Checklist",
                                    tint = NotsenTheme.colors.textSecondary,
                                    modifier = Modifier.size(14.dp)
                                )
                                Text(
                                    text = "$done/$total",
                                    style = NotsenTheme.typography.labelSmall,
                                    color = NotsenTheme.colors.textSecondary
                                )
                            }
                        }

                        if (task.tags?.isNotEmpty() == true) {
                            Row(horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.xs)) {
                                task.tags.take(3).forEach { tag ->
                                    NotsenTagChip(
                                        text = tag,
                                        backgroundColor = NotsenTheme.colors.accentSubtle,
                                        textColor = NotsenTheme.colors.accentPrimary
                                    )
                                }
                            }
                        }
                    }

                    if (task.dueDate != null) {
                        Text(
                            text = task.dueDate.take(10),
                            style = NotsenTheme.typography.labelSmall,
                            color = NotsenTheme.colors.danger
                        )
                    }
                }
            }
        }

        if (!isOverlay) {
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .pointerInput(task.id) {
                        detectDragGesturesAfterLongPress(
                            onDragStart = { offset ->
                                if (viewModel.uiState.value.currentUserRole?.canDragAndDrop == true) {
                                    dragDropState.onDragStart(
                                        taskId = task.id,
                                        columnId = task.columnId,
                                        initialIndex = task.position ?: 0,
                                        initialPointer = cardPositionInRoot + offset
                                    )
                                    viewModel.onDragStart()
                                }
                            },
                            onDrag = { change, dragAmount ->
                                change.consume()
                                val newPointer = dragDropState.pointerPosition + dragAmount

                                val hVel = when {
                                    newPointer.x < 100f -> -15f
                                    newPointer.x > 900f -> 15f
                                    else -> 0f
                                }

                                var newTargetColId = dragDropState.currentTargetColumnId
                                var newTargetIdx = dragDropState.currentTargetIndex

                                for ((colId, rect) in dragDropState.columnBounds) {
                                    if (rect.contains(newPointer)) {
                                        newTargetColId = colId
                                        break
                                    }
                                }

                                if (newTargetColId != null) {
                                    val colTasks = viewModel.uiState.value.tasksByColumn[newTargetColId] ?: emptyList()
                                    var foundIdx = colTasks.size
                                    for ((i, t) in colTasks.withIndex()) {
                                        if (t.id == task.id) continue
                                        val taskRect = dragDropState.taskBounds[t.id]
                                        if (taskRect != null && newPointer.y < taskRect.center.y) {
                                            foundIdx = i
                                            break
                                        }
                                    }
                                    newTargetIdx = foundIdx
                                }

                                dragDropState.onDrag(
                                    dragAmount = dragAmount,
                                    pointerPos = newPointer,
                                    targetColId = newTargetColId,
                                    targetIdx = newTargetIdx,
                                    hVelocity = hVel,
                                    vVelocity = 0f
                                )
                            },
                            onDragEnd = {
                                val draggedId = dragDropState.draggedTaskId
                                val targetColId = dragDropState.currentTargetColumnId
                                val targetIdx = dragDropState.currentTargetIndex
                                val sourceColId = dragDropState.sourceColumnId
                                val sourceIdx = dragDropState.sourceIndex

                                if (draggedId != null && targetColId != null && sourceColId != null) {
                                    viewModel.moveTaskRpc(
                                        taskId = draggedId,
                                        expectedSourceColumnId = sourceColId,
                                        expectedSourcePosition = sourceIdx,
                                        targetColumnId = targetColId,
                                        targetIndex = targetIdx
                                    )
                                } else {
                                    viewModel.cancelDrag()
                                }
                                dragDropState.onDragEnd()
                            },
                            onDragCancel = {
                                viewModel.cancelDrag()
                                dragDropState.onDragCancel()
                            }
                        )
                    }
            )
        }
    }
}
