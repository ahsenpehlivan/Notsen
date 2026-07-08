package com.notsen.feature.home.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Settings
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
import com.notsen.core.model.Board

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel = hiltViewModel(),
    onBoardClick: (String) -> Unit,
    onSettingsClick: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()

    var showAddBoardDialog by remember { mutableStateOf(false) }
    var boardTitleInput by remember { mutableStateOf("") }

    if (showAddBoardDialog) {
        AlertDialog(
            onDismissRequest = { showAddBoardDialog = false },
            title = { Text("Yeni Pano Ekle", style = NotsenTheme.typography.titleMedium, color = NotsenTheme.colors.textPrimary) },
            text = {
                OutlinedTextField(
                    value = boardTitleInput,
                    onValueChange = { boardTitleInput = it },
                    label = { Text("Pano Başlığı") },
                    singleLine = true
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (boardTitleInput.isNotBlank()) {
                            viewModel.addBoard(boardTitleInput)
                            showAddBoardDialog = false
                            boardTitleInput = ""
                        }
                    }
                ) { Text("Oluştur", color = NotsenTheme.colors.accentPrimary) }
            },
            dismissButton = {
                TextButton(onClick = { showAddBoardDialog = false }) { Text("İİptal", color = NotsenTheme.colors.textSecondary) }
            },
            containerColor = NotsenTheme.colors.bgSecondary
        )
    }

    NotsenBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = { Text("Panolarım", style = NotsenTheme.typography.headlineMedium) },
                    actions = {
                        IconButton(onClick = onSettingsClick) {
                            Icon(Icons.Default.Settings, contentDescription = "Ayarlar")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color.Transparent,
                        titleContentColor = NotsenTheme.colors.textPrimary,
                        actionIconContentColor = NotsenTheme.colors.textPrimary
                    )
                )
            }
        ) { paddingValues ->
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
                        style = NotsenTheme.typography.bodyMedium,
                        color = NotsenTheme.colors.danger,
                        modifier = Modifier.align(Alignment.Center).padding(NotsenTheme.spacing.lg)
                    )
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        contentPadding = PaddingValues(NotsenTheme.spacing.xxl), // 1.5rem
                        horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.lg),
                        verticalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.lg)
                    ) {
                        item {
                            AddBoardCard(onClick = { showAddBoardDialog = true })
                        }
                        items(uiState.boards, key = { it.id }) { board ->
                            BoardCard(board = board, onClick = { onBoardClick(board.id) })
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun BoardCard(
    board: Board,
    onClick: () -> Unit
) {
    NotsenGlassCard(
        modifier = Modifier
            .fillMaxWidth()
            .height(120.dp), // Sabit yükseklik
        shape = NotsenTheme.shapes.md,
        backgroundColor = NotsenTheme.colors.bgTertiary,
        borderColor = NotsenTheme.colors.glassBorderSubtle,
        onClick = onClick
    ) {
        Column(
            modifier = Modifier.padding(NotsenTheme.spacing.lg) // 14dp
        ) {
            Text(
                text = board.title,
                style = NotsenTheme.typography.labelLarge,
                color = NotsenTheme.colors.textPrimary,
                maxLines = 2
            )

            Spacer(modifier = Modifier.weight(1f))

            // Renkli etiket simgeleri
            if (board.labels?.isNotEmpty() == true) {
                Row(horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.xs)) {
                    // Sadece renkleri gösteren minik dot'lar
                    board.labels.take(3).forEach { labelStr ->
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .clip(NotsenTheme.shapes.xs)
                                .background(NotsenTheme.colors.accentPrimary)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun AddBoardCard(onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(120.dp)
            .clip(NotsenTheme.shapes.md)
            .background(NotsenTheme.colors.bgHover)
            .border(2.dp, NotsenTheme.colors.glassBorderSubtle, NotsenTheme.shapes.md)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.sm)
        ) {
            Icon(
                imageVector = Icons.Default.Add,
                contentDescription = null,
                tint = NotsenTheme.colors.accentPrimary
            )
            Text(
                text = "Yeni Pano",
                style = NotsenTheme.typography.labelLarge,
                color = NotsenTheme.colors.textPrimary
            )
        }
    }
}
