package com.notsen.feature.quicknotes.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Archive
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Sort
import androidx.compose.material.icons.outlined.PushPin
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.notsen.core.designsystem.NotsenTheme
import com.notsen.core.designsystem.components.NotsenBackground
import com.notsen.core.designsystem.components.NotsenGlassCard
import com.notsen.core.designsystem.components.NotsenTagChip
import com.notsen.core.model.Note
import com.notsen.core.model.NoteDateFilter
import com.notsen.core.model.NoteSortOption
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.material.icons.filled.Unarchive
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Check
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuickNotesScreen(
    viewModel: QuickNotesViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var inputContent by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }
    val focusManager = LocalFocusManager.current

    var showSortMenu by remember { mutableStateOf(false) }
    var showDeleteConfirmDialog by remember { mutableStateOf(false) }
    var showUnsavedChangesDialog by remember { mutableStateOf(false) }

    LaunchedEffect(uiState.snackbarMessage) {
        uiState.snackbarMessage?.let { msg ->
            val result = snackbarHostState.showSnackbar(
                message = msg,
                actionLabel = "Geri al",
                duration = SnackbarDuration.Short
            )
            if (result == SnackbarResult.ActionPerformed) {
                if (uiState.recentlyDeletedNote != null) {
                    viewModel.undoDelete()
                } else if (uiState.recentlyArchivedNote != null) {
                    viewModel.undoArchive()
                }
            }
            viewModel.clearSnackbar()
        }
    }

    NotsenBackground {
        Scaffold(
            containerColor = Color.Transparent,
            snackbarHost = { SnackbarHost(snackbarHostState) },
            topBar = {
                TopAppBar(
                    title = { Text("Hızlı Notlar", style = NotsenTheme.typography.headlineMedium) },
                    navigationIcon = {
                        IconButton(onClick = onNavigateBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Geri")
                        }
                    },
                    actions = {
                        Box {
                            IconButton(onClick = { showSortMenu = true }) {
                                Icon(Icons.Default.Sort, contentDescription = "Sırala", tint = NotsenTheme.colors.textPrimary)
                            }
                            DropdownMenu(
                                expanded = showSortMenu,
                                onDismissRequest = { showSortMenu = false },
                                modifier = Modifier.background(NotsenTheme.colors.bgSecondary)
                            ) {
                                DropdownMenuItem(
                                    text = { Text("Son güncellenen", color = NotsenTheme.colors.textPrimary) },
                                    onClick = { viewModel.updateSortOption(NoteSortOption.UPDATED_DESC); showSortMenu = false }
                                )
                                DropdownMenuItem(
                                    text = { Text("Yeni oluşturulan", color = NotsenTheme.colors.textPrimary) },
                                    onClick = { viewModel.updateSortOption(NoteSortOption.CREATED_DESC); showSortMenu = false }
                                )
                                DropdownMenuItem(
                                    text = { Text("Eskiden yeniye", color = NotsenTheme.colors.textPrimary) },
                                    onClick = { viewModel.updateSortOption(NoteSortOption.CREATED_ASC); showSortMenu = false }
                                )
                                DropdownMenuItem(
                                    text = { Text("Başlığa göre A-Z", color = NotsenTheme.colors.textPrimary) },
                                    onClick = { viewModel.updateSortOption(NoteSortOption.TITLE_ASC); showSortMenu = false }
                                )
                                DropdownMenuItem(
                                    text = { Text("Sabitlenenler üstte", color = NotsenTheme.colors.textPrimary) },
                                    onClick = { viewModel.updateSortOption(NoteSortOption.PINNED_FIRST); showSortMenu = false }
                                )
                            }
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color.Transparent,
                        titleContentColor = NotsenTheme.colors.textPrimary,
                        navigationIconContentColor = NotsenTheme.colors.textPrimary
                    )
                )
            }
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                // Search Bar
                OutlinedTextField(
                    value = uiState.searchQuery,
                    onValueChange = { viewModel.updateSearchQuery(it) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = NotsenTheme.spacing.lg, vertical = NotsenTheme.spacing.sm),
                    placeholder = { Text("Notlarda ara...", color = NotsenTheme.colors.textSecondary) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Ara", tint = NotsenTheme.colors.textSecondary) },
                    trailingIcon = {
                        if (uiState.searchQuery.isNotEmpty()) {
                            IconButton(onClick = { viewModel.updateSearchQuery("") }) {
                                Icon(Icons.Default.Clear, contentDescription = "Temizle", tint = NotsenTheme.colors.textSecondary)
                            }
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = NotsenTheme.colors.accentPrimary,
                        unfocusedBorderColor = NotsenTheme.colors.glassBorderSubtle,
                        focusedTextColor = NotsenTheme.colors.textPrimary,
                        unfocusedTextColor = NotsenTheme.colors.textPrimary,
                        focusedContainerColor = NotsenTheme.colors.bgHover,
                        unfocusedContainerColor = NotsenTheme.colors.bgHover
                    ),
                    shape = RoundedCornerShape(24.dp),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                    keyboardActions = KeyboardActions(onSearch = { focusManager.clearFocus() })
                )

                // Filters Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = NotsenTheme.spacing.lg, vertical = NotsenTheme.spacing.xs),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val allActive = !uiState.showPinnedOnly && !uiState.showArchived && uiState.dateFilter == NoteDateFilter.ALL && uiState.selectedTags.isEmpty()
                    if (!allActive || uiState.searchQuery.isNotEmpty()) {
                        FilterChipUi(text = "Filtreleri Temizle", selected = false, onClick = { 
                            viewModel.clearFilters()
                            viewModel.updateSearchQuery("")
                            focusManager.clearFocus()
                        })
                    }
                    FilterChipUi(text = "Tümü", selected = allActive, onClick = { viewModel.clearFilters() })
                    FilterChipUi(text = "Sabitlenenler", selected = uiState.showPinnedOnly, onClick = { viewModel.togglePinnedOnly() })
                    FilterChipUi(text = "Arşivlenenler", selected = uiState.showArchived, onClick = { viewModel.toggleShowArchived() })
                    FilterChipUi(text = "Bugün", selected = uiState.dateFilter == NoteDateFilter.TODAY, onClick = { viewModel.updateDateFilter(if (uiState.dateFilter == NoteDateFilter.TODAY) NoteDateFilter.ALL else NoteDateFilter.TODAY) })
                    FilterChipUi(text = "Son 7 gün", selected = uiState.dateFilter == NoteDateFilter.LAST_7_DAYS, onClick = { viewModel.updateDateFilter(if (uiState.dateFilter == NoteDateFilter.LAST_7_DAYS) NoteDateFilter.ALL else NoteDateFilter.LAST_7_DAYS) })
                    FilterChipUi(text = "Son 30 gün", selected = uiState.dateFilter == NoteDateFilter.LAST_30_DAYS, onClick = { viewModel.updateDateFilter(if (uiState.dateFilter == NoteDateFilter.LAST_30_DAYS) NoteDateFilter.ALL else NoteDateFilter.LAST_30_DAYS) })
                    
                    uiState.availableTags.forEach { tag ->
                        FilterChipUi(text = "#$tag", selected = uiState.selectedTags.contains(tag), onClick = { viewModel.toggleTagFilter(tag) })
                    }
                }

                if (uiState.error != null) {
                    Text(
                        text = uiState.error ?: "",
                        color = NotsenTheme.colors.danger,
                        style = NotsenTheme.typography.bodyMedium,
                        modifier = Modifier.padding(16.dp)
                    )
                }

                Text(
                    text = "${uiState.visibleNotes.size} not bulundu",
                    color = NotsenTheme.colors.textSecondary,
                    style = NotsenTheme.typography.labelMedium,
                    modifier = Modifier.padding(horizontal = NotsenTheme.spacing.lg, vertical = 4.dp)
                )

                // Note List
                if (uiState.visibleNotes.isEmpty() && !uiState.isLoading) {
                    val titleText = when {
                        uiState.showArchived -> "Arşiv boş"
                        uiState.searchQuery.isNotEmpty() || !(!uiState.showPinnedOnly && !uiState.showArchived && uiState.dateFilter == NoteDateFilter.ALL && uiState.selectedTags.isEmpty()) -> "Sonuç bulunamadı"
                        else -> "Henüz hızlı not yok"
                    }
                    val subtitleText = when {
                        uiState.showArchived -> "Arşivlediğin notlar burada görünür."
                        uiState.searchQuery.isNotEmpty() || !(!uiState.showPinnedOnly && !uiState.showArchived && uiState.dateFilter == NoteDateFilter.ALL && uiState.selectedTags.isEmpty()) -> "Arama veya filtreleri temizlemeyi deneyin."
                        else -> "Aklına geleni hemen yakala."
                    }
                    Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                        Text(
                            text = "$titleText\n$subtitleText",
                            color = NotsenTheme.colors.textSecondary,
                            style = NotsenTheme.typography.bodyMedium,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                } else {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth(),
                        contentPadding = PaddingValues(NotsenTheme.spacing.lg)
                    ) {
                        items(uiState.visibleNotes, key = { it.id }) { note ->
                            NoteItem(
                                note = note,
                                onClick = { viewModel.openNoteDetail(note) },
                                onDelete = { 
                                    viewModel.openNoteDetail(note)
                                    showDeleteConfirmDialog = true
                                },
                                onTogglePin = { viewModel.togglePinStatus(note.id, note.isPinned) },
                                onToggleArchive = { viewModel.toggleArchiveStatus(note.id, note.isArchived) },
                                showUnarchiveIcon = uiState.showArchived
                            )
                            Spacer(modifier = Modifier.height(NotsenTheme.spacing.md))
                        }

                        if (uiState.isLoading) {
                            item {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(NotsenTheme.spacing.lg),
                                    contentAlignment = Alignment.Center
                                ) {
                                    CircularProgressIndicator(color = NotsenTheme.colors.accentPrimary)
                                }
                            }
                        }
                    }
                }

                // Input Area
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = NotsenTheme.spacing.lg, vertical = NotsenTheme.spacing.md)
                        .clip(RoundedCornerShape(24.dp))
                        .background(NotsenTheme.colors.bgHover)
                        .border(1.dp, NotsenTheme.colors.glassBorderSubtle, RoundedCornerShape(24.dp))
                        .padding(horizontal = NotsenTheme.spacing.md, vertical = 8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = inputContent,
                            onValueChange = { inputContent = it },
                            modifier = Modifier.weight(1f),
                            placeholder = { Text("Aklındakini yaz... (#etiket)", color = NotsenTheme.colors.textSecondary) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color.Transparent,
                                unfocusedBorderColor = Color.Transparent,
                                focusedTextColor = NotsenTheme.colors.textPrimary,
                                unfocusedTextColor = NotsenTheme.colors.textPrimary
                            ),
                            maxLines = 4,
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                            keyboardActions = KeyboardActions(onSend = {
                                if (inputContent.isNotBlank() && !uiState.isAddingNote) {
                                    viewModel.addNote(inputContent)
                                    inputContent = ""
                                    focusManager.clearFocus()
                                    coroutineScope.launch {
                                        listState.animateScrollToItem(0)
                                    }
                                }
                            })
                        )

                        IconButton(
                            onClick = {
                                if (inputContent.isNotBlank()) {
                                    viewModel.addNote(inputContent)
                                    inputContent = ""
                                    focusManager.clearFocus()
                                    coroutineScope.launch {
                                        listState.animateScrollToItem(0)
                                    }
                                }
                            },
                            enabled = !uiState.isAddingNote && inputContent.isNotBlank()
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Send,
                                contentDescription = "Gönder",
                                tint = if (inputContent.isNotBlank()) NotsenTheme.colors.accentPrimary else NotsenTheme.colors.textSecondary
                            )
                        }
                    }
                }
            }
            }
        }

        if (uiState.isDetailOpen && uiState.selectedNote != null) {
            val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false)
            ModalBottomSheet(
                onDismissRequest = {
                    if (uiState.isEditing && uiState.editingContent != uiState.selectedNote?.content) {
                        showUnsavedChangesDialog = true
                    } else {
                        viewModel.closeNoteDetail()
                    }
                },
                sheetState = sheetState,
                containerColor = NotsenTheme.colors.bgPrimary
            ) {
                NoteDetailSheetContent(
                    uiState = uiState,
                    viewModel = viewModel,
                    onDeleteClicked = { showDeleteConfirmDialog = true }
                )
            }
        }

        if (showDeleteConfirmDialog) {
            AlertDialog(
                onDismissRequest = { showDeleteConfirmDialog = false },
                title = { Text("Notu Sil", color = NotsenTheme.colors.textPrimary) },
                text = { Text("Bu not silinsin mi?", color = NotsenTheme.colors.textSecondary) },
                confirmButton = {
                    TextButton(onClick = {
                        uiState.selectedNote?.let { viewModel.deleteNote(it.id) }
                        showDeleteConfirmDialog = false
                        viewModel.closeNoteDetail()
                    }) {
                        Text("Sil", color = NotsenTheme.colors.danger)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteConfirmDialog = false }) {
                        Text("İptal", color = NotsenTheme.colors.textSecondary)
                    }
                },
                containerColor = NotsenTheme.colors.bgSecondary
            )
        }

        if (showUnsavedChangesDialog) {
            AlertDialog(
                onDismissRequest = { showUnsavedChangesDialog = false },
                title = { Text("Kaydedilmemiş Değişiklikler", color = NotsenTheme.colors.textPrimary) },
                text = { Text("Değişiklikler kaydedilmedi. Çıkmak istiyor musun?", color = NotsenTheme.colors.textSecondary) },
                confirmButton = {
                    TextButton(onClick = {
                        showUnsavedChangesDialog = false
                        viewModel.closeNoteDetail()
                    }) {
                        Text("Çık", color = NotsenTheme.colors.danger)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showUnsavedChangesDialog = false }) {
                        Text("İptal", color = NotsenTheme.colors.textSecondary)
                    }
                },
                containerColor = NotsenTheme.colors.bgSecondary
            )
        }
    }

@Composable
fun FilterChipUi(text: String, selected: Boolean, onClick: () -> Unit) {
    val bgColor = if (selected) NotsenTheme.colors.accentPrimary else NotsenTheme.colors.bgTertiary
    val textColor = if (selected) NotsenTheme.colors.bgPrimary else NotsenTheme.colors.textPrimary

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(16.dp))
            .background(bgColor)
            .clickable(onClick = onClick)
            .border(
                width = 1.dp,
                color = if (selected) Color.Transparent else NotsenTheme.colors.glassBorderSubtle,
                shape = RoundedCornerShape(16.dp)
            )
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Text(
            text = text,
            color = textColor,
            style = NotsenTheme.typography.labelMedium
        )
    }
}

@Composable
fun NoteItem(
    note: Note,
    onClick: () -> Unit,
    onDelete: () -> Unit,
    onTogglePin: () -> Unit,
    onToggleArchive: () -> Unit,
    showUnarchiveIcon: Boolean = false
) {
    val borderColor = if (note.isPinned) NotsenTheme.colors.accentPrimary else NotsenTheme.colors.glassBorderSubtle
    val bgColor = if (note.isPinned) NotsenTheme.colors.accentSubtle else NotsenTheme.colors.bgTertiary

    val lines = note.content.lines()
    val displayTitle = if (note.title.isNotEmpty()) {
        note.title
    } else {
        lines.firstOrNull()?.take(60) ?: ""
    }
    val displayContent = if (note.title.isEmpty() && lines.isNotEmpty()) {
        lines.drop(1).joinToString("\n").trim()
    } else {
        note.content
    }

    NotsenGlassCard(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        shape = NotsenTheme.shapes.md,
        backgroundColor = bgColor,
        borderColor = borderColor
    ) {
        Column(
            modifier = Modifier.padding(NotsenTheme.spacing.lg)
        ) {
            if (displayTitle.isNotEmpty()) {
                Text(
                    text = displayTitle,
                    style = NotsenTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = NotsenTheme.colors.textPrimary,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
            }
            
            if (displayContent.isNotEmpty()) {
                Text(
                    text = displayContent,
                    style = NotsenTheme.typography.bodyMedium,
                    color = NotsenTheme.colors.textPrimary
                )
            }

            if (note.tags.isNotEmpty()) {
                Spacer(modifier = Modifier.height(NotsenTheme.spacing.md))
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.xs)
                ) {
                    note.tags.forEach { tag ->
                        NotsenTagChip(
                            text = "#$tag",
                            backgroundColor = NotsenTheme.colors.accentSubtle,
                            textColor = NotsenTheme.colors.accentPrimary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(NotsenTheme.spacing.sm))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = note.updatedAt.take(10),
                    style = NotsenTheme.typography.labelSmall,
                    color = NotsenTheme.colors.textSecondary
                )

                Row {
                    IconButton(onClick = onTogglePin, modifier = Modifier.size(32.dp)) {
                        Icon(
                            imageVector = if (note.isPinned) Icons.Filled.PushPin else Icons.Outlined.PushPin,
                            contentDescription = "Sabitle",
                            tint = if (note.isPinned) NotsenTheme.colors.accentPrimary else NotsenTheme.colors.textSecondary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    IconButton(onClick = onToggleArchive, modifier = Modifier.size(32.dp)) {
                        Icon(
                            imageVector = if (showUnarchiveIcon) Icons.Default.Unarchive else Icons.Default.Archive,
                            contentDescription = if (showUnarchiveIcon) "Arşivden Çıkar" else "Arşivle",
                            tint = if (note.isArchived) NotsenTheme.colors.accentPrimary else NotsenTheme.colors.textSecondary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = "Sil",
                            tint = NotsenTheme.colors.danger,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NoteDetailSheetContent(
    uiState: QuickNotesUiState,
    viewModel: QuickNotesViewModel,
    onDeleteClicked: () -> Unit
) {
    val note = uiState.selectedNote ?: return
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(NotsenTheme.spacing.lg)
            .padding(bottom = 32.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = if (uiState.isEditing) "Notu Düzenle" else "Not Detayı",
                style = NotsenTheme.typography.titleLarge,
                color = NotsenTheme.colors.textPrimary
            )
            Row {
                if (uiState.isEditing) {
                    IconButton(onClick = { viewModel.cancelEditing() }) {
                        Icon(Icons.Default.Close, contentDescription = "İptal", tint = NotsenTheme.colors.textSecondary)
                    }
                    IconButton(onClick = { viewModel.saveEditedNote() }, enabled = uiState.editingContent.isNotBlank() && uiState.updatingNoteId != note.id) {
                        if (uiState.updatingNoteId == note.id) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp), color = NotsenTheme.colors.accentPrimary, strokeWidth = 2.dp)
                        } else {
                            Icon(Icons.Default.Check, contentDescription = "Kaydet", tint = NotsenTheme.colors.accentPrimary)
                        }
                    }
                } else {
                    IconButton(onClick = { viewModel.startEditing() }) {
                        Icon(Icons.Default.Edit, contentDescription = "Düzenle", tint = NotsenTheme.colors.textSecondary)
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(NotsenTheme.spacing.md))

        if (uiState.isEditing) {
            OutlinedTextField(
                value = uiState.editingContent,
                onValueChange = { viewModel.updateEditingContent(it) },
                modifier = Modifier.fillMaxWidth().heightIn(min = 200.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = NotsenTheme.colors.accentPrimary,
                    unfocusedBorderColor = NotsenTheme.colors.glassBorderSubtle,
                    focusedTextColor = NotsenTheme.colors.textPrimary,
                    unfocusedTextColor = NotsenTheme.colors.textPrimary,
                    focusedContainerColor = Color.Transparent,
                    unfocusedContainerColor = Color.Transparent
                ),
                textStyle = NotsenTheme.typography.bodyLarge
            )
            
            if (uiState.editingTags.isNotEmpty()) {
                Spacer(modifier = Modifier.height(NotsenTheme.spacing.sm))
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.xs)
                ) {
                    uiState.editingTags.forEach { tag ->
                        NotsenTagChip(
                            text = "#$tag",
                            backgroundColor = NotsenTheme.colors.accentSubtle,
                            textColor = NotsenTheme.colors.accentPrimary
                        )
                    }
                }
            }
        } else {
            Column(modifier = Modifier.heightIn(max = 400.dp).verticalScroll(rememberScrollState())) {
                Text(
                    text = note.content,
                    style = NotsenTheme.typography.bodyLarge,
                    color = NotsenTheme.colors.textPrimary
                )
            }
            
            if (note.tags.isNotEmpty()) {
                Spacer(modifier = Modifier.height(NotsenTheme.spacing.md))
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.xs)
                ) {
                    note.tags.forEach { tag ->
                        NotsenTagChip(
                            text = "#$tag",
                            backgroundColor = NotsenTheme.colors.accentSubtle,
                            textColor = NotsenTheme.colors.accentPrimary
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(NotsenTheme.spacing.lg))
            Text("Oluşturulma: ${note.createdAt.take(16).replace("T", " ")}", style = NotsenTheme.typography.labelSmall, color = NotsenTheme.colors.textSecondary)
            Text("Güncellenme: ${note.updatedAt.take(16).replace("T", " ")}", style = NotsenTheme.typography.labelSmall, color = NotsenTheme.colors.textSecondary)

            Spacer(modifier = Modifier.height(NotsenTheme.spacing.lg))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                TextButton(onClick = { viewModel.togglePinStatus(note.id, note.isPinned) }) {
                    Icon(if (note.isPinned) Icons.Filled.PushPin else Icons.Outlined.PushPin, contentDescription = null, tint = NotsenTheme.colors.accentPrimary)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(if (note.isPinned) "Sabiti Kaldır" else "Sabitle", color = NotsenTheme.colors.accentPrimary)
                }
                
                TextButton(onClick = { 
                    viewModel.toggleArchiveStatus(note.id, note.isArchived)
                    viewModel.closeNoteDetail()
                }) {
                    Icon(if (note.isArchived) Icons.Default.Unarchive else Icons.Default.Archive, contentDescription = null, tint = NotsenTheme.colors.accentPrimary)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(if (note.isArchived) "Arşivden Çıkar" else "Arşivle", color = NotsenTheme.colors.accentPrimary)
                }
                
                TextButton(onClick = onDeleteClicked) {
                    Icon(Icons.Default.Delete, contentDescription = null, tint = NotsenTheme.colors.danger)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Sil", color = NotsenTheme.colors.danger)
                }
            }
        }
    }
}
