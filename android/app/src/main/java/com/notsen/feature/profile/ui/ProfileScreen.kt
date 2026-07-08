package com.notsen.feature.profile.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.notsen.core.designsystem.AppTheme
import com.notsen.core.designsystem.getColors
import com.notsen.core.designsystem.components.NotsenBackground
import com.notsen.core.designsystem.components.NotsenButton
import com.notsen.core.designsystem.components.NotsenGlassCard
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import io.github.jan.supabase.auth.user.UserInfo
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onNavigateToAuth: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showLogoutDialog by remember { mutableStateOf(false) }

    LaunchedEffect(uiState.isLoggedOut) {
        if (uiState.isLoggedOut) {
            onNavigateToAuth()
        }
    }

    if (uiState.isLoggedOut) return

    NotsenBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            Spacer(modifier = Modifier.height(48.dp))

            Text(
                text = "Profil",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onBackground
            )

            uiState.user?.let { user ->
                ProfileCard(user = user)
            }

            StatsSection(uiState = uiState)

            QuickAccessSection()

            LinkedAccountsSection()

            ThemeSection(
                currentTheme = uiState.theme,
                onThemeSelected = { viewModel.setTheme(it) }
            )

            AccountActionsSection(
                onLogoutClick = { showLogoutDialog = true },
                onDeleteAccountClick = { /* Handle delete account dialog / logic later */ }
            )

            Spacer(modifier = Modifier.height(48.dp))
        }

        if (showLogoutDialog) {
            AlertDialog(
                onDismissRequest = { showLogoutDialog = false },
                title = { Text("Çıkış Yap") },
                text = { Text("Bu hesaptan çıkış yapmak istediğinize emin misiniz?") },
                confirmButton = {
                    TextButton(onClick = {
                        showLogoutDialog = false
                        viewModel.logout()
                    }) {
                        Text("Evet", color = MaterialTheme.colorScheme.error)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showLogoutDialog = false }) {
                        Text("Hayır")
                    }
                }
            )
        }

        if (uiState.successMessage != null || uiState.error != null) {
            val message = uiState.successMessage ?: uiState.error ?: ""
            AlertDialog(
                onDismissRequest = { viewModel.clearErrorAndSuccess() },
                title = { Text(if (uiState.successMessage != null) "Başarılı" else "Hata") },
                text = { Text(message) },
                confirmButton = {
                    TextButton(onClick = { viewModel.clearErrorAndSuccess() }) {
                        Text("Tamam")
                    }
                }
            )
        }

        if (uiState.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }
    }
}

@Composable
fun ProfileCard(user: UserInfo) {
    val email = user.email ?: ""
    val initials = email.firstOrNull()?.uppercase() ?: "?"

    val dateString = user.createdAt?.let { instant ->
        val sdf = SimpleDateFormat("d MMMM yyyy", Locale("tr", "TR"))
        sdf.format(Date(instant.toEpochMilliseconds()))
    } ?: "Bilinmiyor"

    val lastSignInString = user.lastSignInAt?.let { instant ->
        val sdf = SimpleDateFormat("d MMMM yyyy, HH:mm", Locale("tr", "TR"))
        sdf.format(Date(instant.toEpochMilliseconds()))
    } ?: "Bilinmiyor"

    val username = email.substringBefore("@")
    val provider = user.appMetadata?.get("provider")?.toString()?.replace("\"", "") ?: "E-posta"
    val providerLabel = when (provider.lowercase()) {
        "google" -> "Google"
        "github" -> "GitHub"
        else -> "E-posta"
    }

    NotsenGlassCard(
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .padding(24.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Avatar
            Surface(
                modifier = Modifier.size(64.dp),
                color = MaterialTheme.colorScheme.primaryContainer,
                shape = MaterialTheme.shapes.extraLarge
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = initials,
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }

            Column {
                Text(
                    text = username,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = email,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Kayıt: $dateString",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "Son Giriş: $lastSignInString",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "Giriş Yöntemi: $providerLabel",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun StatsSection(uiState: ProfileUiState) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = "İstatistikler",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onBackground
        )

        NotsenGlassCard {
            if (uiState.isStatsLoading) {
                Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    StatItem(title = "Panolar", count = uiState.boardsCount.toString())
                    StatItem(title = "Görevler", count = uiState.myTasksCount.toString())
                    StatItem(title = "Atanan", count = uiState.assignedTasksCount.toString())
                }
            }
        }
    }
}

@Composable
fun StatItem(title: String, count: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = count, style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
        Text(text = title, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
fun QuickAccessSection() {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = "Hızlı Erişim",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onBackground
        )

        NotsenGlassCard {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                PreferenceItem(title = "Görevlerim", subtitle = "Yakında", enabled = false)
                PreferenceItem(title = "Takvim Görünümü", subtitle = "Yakında", enabled = false)
            }
        }
    }
}

@Composable
fun LinkedAccountsSection() {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = "Hesap Bağlama",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onBackground
        )

        NotsenGlassCard {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedButton(onClick = { /* Not supported yet */ }, modifier = Modifier.fillMaxWidth(), enabled = false) {
                    Text("Google Hesabı Bağla (Yakında)")
                }
                OutlinedButton(onClick = { /* Not supported yet */ }, modifier = Modifier.fillMaxWidth(), enabled = false) {
                    Text("GitHub Hesabı Bağla (Yakında)")
                }
            }
        }
    }
}

@Composable
fun ThemeSection(
    currentTheme: AppTheme,
    onThemeSelected: (AppTheme) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = "Tema Seçimi",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onBackground
        )

        NotsenGlassCard {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(horizontal = 4.dp)
                ) {
                    items(AppTheme.values()) { theme ->
                        val colors = theme.getColors()
                        val isSelected = theme == currentTheme
                        
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .background(colors.bgPrimary, shape = CircleShape)
                                .border(
                                    width = if (isSelected) 3.dp else 1.dp,
                                    color = if (isSelected) colors.accentPrimary else colors.glassBorder,
                                    shape = CircleShape
                                )
                                .clickable { onThemeSelected(theme) },
                            contentAlignment = Alignment.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(24.dp)
                                    .background(colors.accentPrimary, shape = CircleShape)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AccountActionsSection(
    onLogoutClick: () -> Unit,
    onDeleteAccountClick: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = "Hesap",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onBackground
        )

        NotsenGlassCard {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                NotsenButton(
                    text = "Çıkış Yap",
                    onClick = onLogoutClick,
                    modifier = Modifier.fillMaxWidth()
                )

                Button(
                    onClick = onDeleteAccountClick,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Hesabı Sil")
                }
            }
        }
    }
}

@Composable
fun PreferenceItem(title: String, subtitle: String, enabled: Boolean) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = title, style = MaterialTheme.typography.bodyLarge, color = if (enabled) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant)
        Text(text = subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
