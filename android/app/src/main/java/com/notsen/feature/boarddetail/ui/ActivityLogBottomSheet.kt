package com.notsen.feature.boarddetail.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.notsen.core.designsystem.NotsenTheme
import com.notsen.core.model.ActivityLog

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActivityLogBottomSheet(
    logs: List<ActivityLog>,
    onDismissRequest: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismissRequest
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = "Aktivite Geçmişi",
                style = NotsenTheme.typography.headlineMedium,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            LazyColumn {
                items(logs, key = { it.id }) { log ->
                    Column(modifier = Modifier.padding(vertical = 8.dp)) {
                        Text(
                            text = "${log.userEmail ?: "Bilinmeyen Kullanıcı"} -> ${log.action} (${log.entityTitle ?: ""})",
                            style = NotsenTheme.typography.labelLarge
                        )
                        Text(
                            text = log.createdAt,
                            style = NotsenTheme.typography.labelSmall,
                            color = NotsenTheme.colors.textSecondary
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}
