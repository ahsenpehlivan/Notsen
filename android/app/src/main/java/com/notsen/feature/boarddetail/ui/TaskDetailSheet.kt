package com.notsen.feature.boarddetail.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.notsen.core.designsystem.NotsenTheme
import com.notsen.core.model.BoardMember
import com.notsen.core.model.Task
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskDetailSheet(
    task: Task,
    boardLabels: List<String>,
    members: List<BoardMember>,
    canEdit: Boolean,
    onDismissRequest: () -> Unit,
    onSave: (title: String, desc: String, dueDate: String?, tags: List<String>, assignee: String?, onError: () -> Unit) -> Unit,
    onDelete: () -> Unit
) {
    var editTitle by remember { mutableStateOf(task.title) }
    var editDesc by remember { mutableStateOf(task.description) }
    var selectedDueDate by remember { mutableStateOf(task.dueDate) }
    var selectedTags by remember { mutableStateOf(task.tags ?: emptyList()) }
    var selectedAssignee by remember { mutableStateOf(task.assignee) }

    var showDatePicker by remember { mutableStateOf(false) }
    var showLabelPicker by remember { mutableStateOf(false) }
    var showAssigneePicker by remember { mutableStateOf(false) }
    
    var isLoading by remember { mutableStateOf(false) }

    val datePickerState = rememberDatePickerState(
        initialSelectedDateMillis = System.currentTimeMillis()
    )

    ModalBottomSheet(
        onDismissRequest = onDismissRequest,
        containerColor = NotsenTheme.colors.bgSecondary,
        dragHandle = { BottomSheetDefaults.DragHandle(color = NotsenTheme.colors.textMuted) }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(NotsenTheme.spacing.lg)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.lg)
        ) {
            OutlinedTextField(
                value = editTitle,
                onValueChange = { editTitle = it },
                textStyle = NotsenTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedContainerColor = Color.Transparent,
                    focusedContainerColor = Color.Transparent,
                    unfocusedBorderColor = Color.Transparent,
                    focusedBorderColor = NotsenTheme.colors.accentPrimary,
                    cursorColor = NotsenTheme.colors.accentPrimary,
                    focusedTextColor = NotsenTheme.colors.textPrimary,
                    unfocusedTextColor = NotsenTheme.colors.textPrimary
                ),
                placeholder = { Text("Görev Başlığı", color = NotsenTheme.colors.textMuted) },
                enabled = canEdit && !isLoading,
                modifier = Modifier.fillMaxWidth()
            )

            // Properties Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.md)
            ) {
                // Due Date Button
                Surface(
                    color = NotsenTheme.colors.bgHover,
                    shape = NotsenTheme.shapes.sm,
                    modifier = Modifier.clickable(enabled = canEdit) { showDatePicker = true }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.DateRange, contentDescription = null, tint = NotsenTheme.colors.textSecondary, modifier = Modifier.size(16.dp))
                        Text(
                            text = selectedDueDate?.take(10) ?: "Tarih Ekle",
                            style = NotsenTheme.typography.labelMedium,
                            color = NotsenTheme.colors.textSecondary
                        )
                    }
                }

                // Assignee Button
                Surface(
                    color = NotsenTheme.colors.bgHover,
                    shape = NotsenTheme.shapes.sm,
                    modifier = Modifier.clickable(enabled = canEdit) { showAssigneePicker = true }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Person, contentDescription = null, tint = NotsenTheme.colors.textSecondary, modifier = Modifier.size(16.dp))
                        Text(
                            text = members.find { it.userEmail == selectedAssignee }?.userEmail?.substringBefore("@") ?: "Kişi Ata",
                            style = NotsenTheme.typography.labelMedium,
                            color = NotsenTheme.colors.textSecondary
                        )
                    }
                }
                
                // Labels Button
                Surface(
                    color = NotsenTheme.colors.bgHover,
                    shape = NotsenTheme.shapes.sm,
                    modifier = Modifier.clickable(enabled = canEdit) { showLabelPicker = true }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Star, contentDescription = null, tint = NotsenTheme.colors.textSecondary, modifier = Modifier.size(16.dp))
                        Text(
                            text = if (selectedTags.isEmpty()) "Etiket Ekle" else "${selectedTags.size} Etiket",
                            style = NotsenTheme.typography.labelMedium,
                            color = NotsenTheme.colors.textSecondary
                        )
                    }
                }
            }

            // Tags display
            if (selectedTags.isNotEmpty()) {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(selectedTags) { tag ->
                        Surface(
                            color = NotsenTheme.colors.accentSubtle,
                            shape = NotsenTheme.shapes.sm
                        ) {
                            Text(
                                text = tag,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                style = NotsenTheme.typography.labelMedium,
                                color = NotsenTheme.colors.accentPrimary
                            )
                        }
                    }
                }
            }

            OutlinedTextField(
                value = editDesc,
                onValueChange = { editDesc = it },
                textStyle = NotsenTheme.typography.bodyMedium,
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedContainerColor = NotsenTheme.colors.bgTertiary,
                    focusedContainerColor = NotsenTheme.colors.bgTertiary,
                    unfocusedBorderColor = Color.Transparent,
                    focusedBorderColor = NotsenTheme.colors.accentPrimary,
                    cursorColor = NotsenTheme.colors.accentPrimary,
                    focusedTextColor = NotsenTheme.colors.textPrimary,
                    unfocusedTextColor = NotsenTheme.colors.textPrimary
                ),
                placeholder = { Text("Açıklama ekleyin...", color = NotsenTheme.colors.textMuted) },
                enabled = canEdit && !isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 120.dp),
                shape = NotsenTheme.shapes.md
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                if (canEdit) {
                    TextButton(
                        onClick = onDelete,
                        colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                    ) {
                        Text("Görevi Sil")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            isLoading = true
                            onSave(editTitle, editDesc, selectedDueDate, selectedTags, selectedAssignee) {
                                isLoading = false
                            }
                        },
                        enabled = !isLoading,
                        colors = ButtonDefaults.buttonColors(containerColor = NotsenTheme.colors.accentPrimary)
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.width(8.dp))
                        }
                        Text("Kaydet", color = Color.White)
                    }
                } else {
                    Button(
                        onClick = onDismissRequest,
                        colors = ButtonDefaults.buttonColors(containerColor = NotsenTheme.colors.accentPrimary)
                    ) {
                        Text("Kapat", color = Color.White)
                    }
                }
            }
            Spacer(modifier = Modifier.height(32.dp))
        }

        // Dialogs for pickers
        if (showDatePicker) {
            DatePickerDialog(
                onDismissRequest = { showDatePicker = false },
                confirmButton = {
                    TextButton(onClick = {
                        val millis = datePickerState.selectedDateMillis
                        if (millis != null) {
                            val dateStr = java.time.Instant.ofEpochMilli(millis)
                                .atZone(java.time.ZoneId.of("UTC"))
                                .toLocalDate()
                                .format(DateTimeFormatter.ISO_LOCAL_DATE)
                            selectedDueDate = dateStr
                        }
                        showDatePicker = false
                    }) { Text("Seç") }
                },
                dismissButton = {
                    TextButton(onClick = { 
                        selectedDueDate = null
                        showDatePicker = false 
                    }) { Text("Tarihi Temizle") }
                }
            ) {
                DatePicker(state = datePickerState)
            }
        }

        if (showAssigneePicker) {
            AlertDialog(
                onDismissRequest = { showAssigneePicker = false },
                title = { Text("Kişi Ata") },
                text = {
                    Column {
                        members.forEach { member ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        selectedAssignee = member.userEmail
                                        showAssigneePicker = false
                                    }
                                    .padding(vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .clip(CircleShape)
                                        .background(NotsenTheme.colors.accentSubtle),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        member.userEmail.first().uppercase(),
                                        color = NotsenTheme.colors.accentPrimary,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(member.userEmail, color = NotsenTheme.colors.textPrimary)
                            }
                        }
                        TextButton(
                            onClick = {
                                selectedAssignee = null
                                showAssigneePicker = false
                            },
                            modifier = Modifier.align(Alignment.End)
                        ) {
                            Text("Atamayı Kaldır", color = MaterialTheme.colorScheme.error)
                        }
                    }
                },
                confirmButton = {}
            )
        }

        if (showLabelPicker) {
            AlertDialog(
                onDismissRequest = { showLabelPicker = false },
                title = { Text("Etiketler") },
                text = {
                    Column {
                        if (boardLabels.isEmpty()) {
                            Text("Panoda tanımlı etiket yok.", color = NotsenTheme.colors.textSecondary)
                        } else {
                            boardLabels.forEach { label ->
                                val isSelected = selectedTags.contains(label)
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            selectedTags = if (isSelected) {
                                                selectedTags - label
                                            } else {
                                                selectedTags + label
                                            }
                                        }
                                        .padding(vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Surface(
                                        color = NotsenTheme.colors.accentSubtle,
                                        shape = NotsenTheme.shapes.sm
                                    ) {
                                        Text(
                                            text = label,
                                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                            color = NotsenTheme.colors.accentPrimary
                                        )
                                    }
                                    Checkbox(
                                        checked = isSelected,
                                        onCheckedChange = null,
                                        colors = CheckboxDefaults.colors(
                                            checkedColor = NotsenTheme.colors.accentPrimary
                                        )
                                    )
                                }
                            }
                        }
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showLabelPicker = false }) { Text("Tamam") }
                }
            )
        }
    }
}
