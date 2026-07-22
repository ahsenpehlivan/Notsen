package com.notsen.feature.boarddetail.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import com.notsen.core.designsystem.NotsenTheme
import com.notsen.core.model.ChecklistItem
import com.notsen.feature.boarddetail.domain.ChecklistMutation

@Composable
fun ChecklistSection(
    checklist: List<ChecklistItem>?,
    canEdit: Boolean,
    isLoading: Boolean,
    onMutation: (ChecklistMutation) -> Unit,
    modifier: Modifier = Modifier
) {
    val items = checklist ?: emptyList()
    val (done, total) = ChecklistUiHelpers.calculateChecklistProgress(items)

    Column(
        modifier = modifier.fillMaxWidth().testTag("checklist_section"),
        verticalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.md)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Checklist",
                style = NotsenTheme.typography.titleMedium,
                color = NotsenTheme.colors.textPrimary,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = if (total == 0) "0 / 0" else "$done / $total",
                style = NotsenTheme.typography.bodyMedium,
                color = NotsenTheme.colors.textSecondary
            )
        }

        // Progress
        if (total > 0) {
            val progress = done.toFloat() / total.toFloat()
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .testTag("checklist_progress"),
                color = NotsenTheme.colors.accentPrimary,
                trackColor = NotsenTheme.colors.bgTertiary
            )
        }

        // Checklist Items
        Column(verticalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.sm)) {
            items.forEach { item ->
                ChecklistItemRow(
                    item = item,
                    canEdit = canEdit,
                    isLoading = isLoading,
                    onMutation = onMutation
                )
            }
        }

        // Add Item
        if (canEdit) {
            var draftText by remember { mutableStateOf("") }
            
            LaunchedEffect(checklist) {
                // Clear draft when checklist expands (meaning Add was successful)
                // In a perfect world, we would track exact submission text, but this is a minimum fix.
                draftText = ""
            }

            fun handleAdd() {
                val trimmed = draftText.trim()
                if (trimmed.isNotEmpty()) {
                    onMutation(ChecklistMutation.Add(trimmed))
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.sm)
            ) {
                OutlinedTextField(
                    value = draftText,
                    onValueChange = { draftText = it },
                    placeholder = { Text("Yeni madde ekle", color = NotsenTheme.colors.textMuted) },
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
                    modifier = Modifier.weight(1f).testTag("checklist_add_input"),
                    enabled = !isLoading,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = { handleAdd() }),
                    singleLine = true,
                    shape = NotsenTheme.shapes.sm
                )
                
                Button(
                    onClick = { handleAdd() },
                    enabled = !isLoading && draftText.trim().isNotEmpty(),
                    colors = ButtonDefaults.buttonColors(containerColor = NotsenTheme.colors.accentPrimary),
                    shape = NotsenTheme.shapes.sm,
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    modifier = Modifier.testTag("checklist_add_button")
                ) {
                    Text("Ekle", color = Color.White)
                }
            }
        }
    }
}

@Composable
fun ChecklistItemRow(
    item: ChecklistItem,
    canEdit: Boolean,
    isLoading: Boolean,
    onMutation: (ChecklistMutation) -> Unit
) {
    var isEditing by remember { mutableStateOf(false) }
    var editDraft by remember { mutableStateOf(item.text) }
    var showDeleteConfirm by remember { mutableStateOf(false) }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Checklist maddesi silinsin mi?") },
            text = { Text("Bu işlem geri alınamaz.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        onMutation(ChecklistMutation.Delete(item.id))
                        showDeleteConfirm = false
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error),
                    enabled = !isLoading
                ) {
                    Text("Sil")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) {
                    Text("Vazgeç")
                }
            }
        )
    }

    if (isEditing) {
        fun handleSave() {
            val trimmed = editDraft.trim()
            if (trimmed.isNotEmpty()) {
                if (trimmed != item.text) {
                    onMutation(ChecklistMutation.Rename(item.id, trimmed))
                }
                isEditing = false
            }
        }
        
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.sm)
        ) {
            OutlinedTextField(
                value = editDraft,
                onValueChange = { editDraft = it },
                textStyle = NotsenTheme.typography.bodyMedium,
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedContainerColor = NotsenTheme.colors.bgTertiary,
                    focusedContainerColor = NotsenTheme.colors.bgTertiary,
                    unfocusedBorderColor = NotsenTheme.colors.accentPrimary,
                    focusedBorderColor = NotsenTheme.colors.accentPrimary,
                    cursorColor = NotsenTheme.colors.accentPrimary,
                    focusedTextColor = NotsenTheme.colors.textPrimary,
                    unfocusedTextColor = NotsenTheme.colors.textPrimary
                ),
                modifier = Modifier.weight(1f),
                enabled = !isLoading,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = { handleSave() }),
                shape = NotsenTheme.shapes.sm
            )

            IconButton(
                onClick = { handleSave() },
                enabled = !isLoading && editDraft.trim().isNotEmpty()
            ) {
                Icon(Icons.Default.Check, contentDescription = "Kaydet", tint = NotsenTheme.colors.accentPrimary)
            }
            IconButton(
                onClick = { 
                    isEditing = false
                    editDraft = item.text
                },
                enabled = !isLoading
            ) {
                Icon(Icons.Default.Close, contentDescription = "İptal", tint = NotsenTheme.colors.textSecondary)
            }
        }
    } else {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .defaultMinSize(minHeight = 48.dp)
                .testTag("checklist_item_${item.id}"),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = item.done,
                onCheckedChange = { if (canEdit && !isLoading) onMutation(ChecklistMutation.Toggle(item.id)) },
                enabled = canEdit && !isLoading,
                colors = CheckboxDefaults.colors(
                    checkedColor = NotsenTheme.colors.accentPrimary,
                    uncheckedColor = NotsenTheme.colors.textSecondary
                ),
                modifier = Modifier.testTag("checklist_toggle_${item.id}")
            )
            Spacer(modifier = Modifier.width(NotsenTheme.spacing.xs))
            Text(
                text = item.text,
                style = NotsenTheme.typography.bodyMedium,
                color = if (item.done) NotsenTheme.colors.textMuted else NotsenTheme.colors.textPrimary,
                textDecoration = if (item.done) TextDecoration.LineThrough else null,
                modifier = Modifier
                    .weight(1f)
                    .clickable(enabled = canEdit && !isLoading) { onMutation(ChecklistMutation.Toggle(item.id)) }
                    .padding(vertical = NotsenTheme.spacing.sm)
            )

            if (canEdit) {
                IconButton(
                    onClick = { 
                        editDraft = item.text
                        isEditing = true 
                    },
                    enabled = !isLoading,
                    modifier = Modifier.testTag("checklist_edit_${item.id}")
                ) {
                    Icon(Icons.Default.Edit, contentDescription = "Düzenle", tint = NotsenTheme.colors.textSecondary)
                }
                IconButton(
                    onClick = { showDeleteConfirm = true },
                    enabled = !isLoading,
                    modifier = Modifier.testTag("checklist_delete_${item.id}")
                ) {
                    Icon(Icons.Default.Delete, contentDescription = "Sil", tint = NotsenTheme.colors.textSecondary)
                }
            }
        }
    }
}
