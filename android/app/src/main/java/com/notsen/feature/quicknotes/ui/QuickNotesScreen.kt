package com.notsen.feature.quicknotes.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.notsen.core.designsystem.NotsenTheme
import com.notsen.core.designsystem.components.NotsenBackground
import com.notsen.core.designsystem.components.NotsenGlassCard
import com.notsen.core.designsystem.components.NotsenTagChip
import com.notsen.core.model.Note
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuickNotesScreen(
    viewModel: QuickNotesViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var inputText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    NotsenBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = { Text("Hızlı Notlar", style = NotsenTheme.typography.headlineMedium) },
                    navigationIcon = {
                        IconButton(onClick = onNavigateBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Geri")
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
                if (uiState.error != null) {
                    Text(
                        text = uiState.error ?: "",
                        color = NotsenTheme.colors.danger,
                        style = NotsenTheme.typography.bodyMedium,
                        modifier = Modifier.padding(16.dp)
                    )
                }

                // Note List
                LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    reverseLayout = true, // WhatsApp style: latest at bottom
                    contentPadding = PaddingValues(NotsenTheme.spacing.lg)
                ) {
                    items(uiState.notes, key = { it.id }) { note ->
                        NoteItem(
                            note = note,
                            onDelete = { viewModel.deleteNote(note.id) }
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

                // Input Area
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = NotsenTheme.spacing.lg, vertical = NotsenTheme.spacing.md)
                        .clip(RoundedCornerShape(24.dp))
                        .background(NotsenTheme.colors.bgHover)
                        .border(1.dp, NotsenTheme.colors.glassBorderSubtle, RoundedCornerShape(24.dp))
                        .padding(horizontal = NotsenTheme.spacing.md, vertical = 4.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = inputText,
                            onValueChange = { inputText = it },
                            modifier = Modifier.weight(1f),
                            placeholder = { Text("Aklındakini yaz... (#etiket)", color = NotsenTheme.colors.textSecondary) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color.Transparent,
                                unfocusedBorderColor = Color.Transparent,
                                focusedTextColor = NotsenTheme.colors.textPrimary,
                                unfocusedTextColor = NotsenTheme.colors.textPrimary
                            ),
                            maxLines = 4
                        )

                        IconButton(
                            onClick = {
                                if (inputText.isNotBlank()) {
                                    viewModel.addNote(inputText)
                                    inputText = ""
                                    coroutineScope.launch {
                                        listState.animateScrollToItem(0)
                                    }
                                }
                            },
                            enabled = !uiState.isAddingNote && inputText.isNotBlank()
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Send,
                                contentDescription = "Gönder",
                                tint = if (inputText.isNotBlank()) NotsenTheme.colors.accentPrimary else NotsenTheme.colors.textSecondary
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun NoteItem(
    note: Note,
    onDelete: () -> Unit
) {
    NotsenGlassCard(
        modifier = Modifier.fillMaxWidth(),
        shape = NotsenTheme.shapes.md,
        backgroundColor = NotsenTheme.colors.bgTertiary,
        borderColor = NotsenTheme.colors.glassBorderSubtle
    ) {
        Column(
            modifier = Modifier.padding(NotsenTheme.spacing.lg)
        ) {
            Text(
                text = note.content,
                style = NotsenTheme.typography.bodyMedium,
                color = NotsenTheme.colors.textPrimary
            )

            if (note.tags.isNotEmpty()) {
                Spacer(modifier = Modifier.height(NotsenTheme.spacing.md))
                Row(horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.xs)) {
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
                    text = note.createdAt.take(10), // Simplistic date parsing for MVP
                    style = NotsenTheme.typography.labelSmall,
                    color = NotsenTheme.colors.textSecondary
                )

                IconButton(onClick = onDelete, modifier = Modifier.size(24.dp)) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Sil",
                        tint = NotsenTheme.colors.danger,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}
