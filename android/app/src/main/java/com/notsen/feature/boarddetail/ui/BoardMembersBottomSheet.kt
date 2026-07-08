package com.notsen.feature.boarddetail.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.notsen.core.designsystem.NotsenTheme
import com.notsen.core.model.BoardMember
import com.notsen.core.model.PermissionRole
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BoardMembersBottomSheet(
    members: List<BoardMember>,
    currentUserRole: PermissionRole?,
    isLoading: Boolean = false,
    error: String? = null,
    successMessage: String? = null,
    onDismissRequest: () -> Unit,
    onInvite: (String, PermissionRole) -> Unit,
    onRoleChange: (String, PermissionRole) -> Unit,
    onRemove: (String) -> Unit,
    onClearError: () -> Unit = {},
    onClearSuccess: () -> Unit = {}
) {
    val coroutineScope = rememberCoroutineScope()

    // Auto-clear messages
    LaunchedEffect(error, successMessage) {
        if (error != null) {
            delay(4000)
            onClearError()
        }
        if (successMessage != null) {
            delay(3000)
            onClearSuccess()
        }
    }

    var memberToRemove by remember { mutableStateOf<BoardMember?>(null) }

    if (memberToRemove != null) {
        AlertDialog(
            onDismissRequest = { memberToRemove = null },
            title = { Text("Üyeyi Çıkar") },
            text = { Text("${memberToRemove?.userEmail} adlı üyeyi panodan çıkarmak istediğinize emin misiniz?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        onRemove(memberToRemove!!.id)
                        memberToRemove = null
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Evet, Çıkar")
                }
            },
            dismissButton = {
                TextButton(onClick = { memberToRemove = null }) {
                    Text("İİptal")
                }
            }
        )
    }

    ModalBottomSheet(
        onDismissRequest = onDismissRequest
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = "Pano Üyeleri",
                style = NotsenTheme.typography.headlineMedium,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            if (error != null) {
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    style = NotsenTheme.typography.bodyMedium,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }
            if (successMessage != null) {
                Text(
                    text = successMessage,
                    color = NotsenTheme.colors.success,
                    style = NotsenTheme.typography.bodyMedium,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }

            if (currentUserRole?.canManageMembers == true) {
                var email by remember { mutableStateOf("") }
                var inviteRole by remember { mutableStateOf(PermissionRole.EDITOR) }
                var inviteRoleDropdownExpanded by remember { mutableStateOf(false) }

                Column(modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)) {
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Davet edilecek E-posta") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !isLoading,
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Box {
                            TextButton(
                                onClick = { inviteRoleDropdownExpanded = true },
                                enabled = !isLoading
                            ) {
                                Text(inviteRole.name)
                                Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                            }
                            DropdownMenu(
                                expanded = inviteRoleDropdownExpanded,
                                onDismissRequest = { inviteRoleDropdownExpanded = false }
                            ) {
                                DropdownMenuItem(
                                    text = { Text(PermissionRole.EDITOR.name) },
                                    onClick = {
                                        inviteRole = PermissionRole.EDITOR
                                        inviteRoleDropdownExpanded = false
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text(PermissionRole.VIEWER.name) },
                                    onClick = {
                                        inviteRole = PermissionRole.VIEWER
                                        inviteRoleDropdownExpanded = false
                                    }
                                )
                            }
                        }

                        Button(
                            onClick = {
                                val trimmedEmail = email.trim().lowercase()
                                if (trimmedEmail.isNotBlank()) {
                                    onInvite(trimmedEmail, inviteRole)
                                    email = ""
                                }
                            },
                            enabled = !isLoading && email.trim().isNotEmpty()
                        ) {
                            if (isLoading) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                            } else {
                                Text("Davet Et")
                            }
                        }
                    }
                }
            }

            LazyColumn {
                items(members, key = { it.id }) { member ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = member.userEmail, style = NotsenTheme.typography.labelLarge)
                            if (member.role == PermissionRole.OWNER) {
                                Text(
                                    text = "Kurucu (Owner)",
                                    style = NotsenTheme.typography.bodyMedium,
                                    color = NotsenTheme.colors.accentPrimary
                                )
                            } else {
                                Text(text = member.role.name, style = NotsenTheme.typography.bodySmall)
                            }
                        }

                        if (currentUserRole?.canManageMembers == true && member.role != PermissionRole.OWNER) {
                            var roleDropdownExpanded by remember { mutableStateOf(false) }

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box {
                                    TextButton(
                                        onClick = { roleDropdownExpanded = true },
                                        enabled = !isLoading
                                    ) {
                                        Text(member.role.name)
                                        Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                                    }
                                    DropdownMenu(
                                        expanded = roleDropdownExpanded,
                                        onDismissRequest = { roleDropdownExpanded = false }
                                    ) {
                                        DropdownMenuItem(
                                            text = { Text("EDITOR") },
                                            onClick = {
                                                if (member.role != PermissionRole.EDITOR) {
                                                    onRoleChange(member.id, PermissionRole.EDITOR)
                                                }
                                                roleDropdownExpanded = false
                                            }
                                        )
                                        DropdownMenuItem(
                                            text = { Text("VIEWER") },
                                            onClick = {
                                                if (member.role != PermissionRole.VIEWER) {
                                                    onRoleChange(member.id, PermissionRole.VIEWER)
                                                }
                                                roleDropdownExpanded = false
                                            }
                                        )
                                    }
                                }

                                TextButton(
                                    onClick = { memberToRemove = member },
                                    enabled = !isLoading
                                ) {
                                    Text("Çıkar", color = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}
