package com.notsen.feature.settings.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notsen.core.datastore.ThemePreferences
import com.notsen.core.designsystem.AppTheme
import com.notsen.core.designsystem.NotsenTheme
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val themePreferences: ThemePreferences
) : ViewModel() {
    val currentTheme = themePreferences.themeFlow

    fun updateTheme(theme: AppTheme) {
        viewModelScope.launch {
            themePreferences.setTheme(theme)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel = hiltViewModel(),
    onBack: () -> Unit
) {
    val currentTheme by viewModel.currentTheme.collectAsState(initial = AppTheme.CHARCOAL)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings", style = NotsenTheme.typography.titleMedium) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = NotsenTheme.colors.bgSecondary,
                    titleContentColor = NotsenTheme.colors.textPrimary,
                    navigationIconContentColor = NotsenTheme.colors.textPrimary
                )
            )
        },
        containerColor = NotsenTheme.colors.bgPrimary
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(NotsenTheme.spacing.xl)
        ) {
            Text(
                text = "Appearance",
                style = NotsenTheme.typography.labelLarge,
                color = NotsenTheme.colors.textSecondary
            )
            Spacer(modifier = Modifier.height(NotsenTheme.spacing.md))

            AppTheme.values().forEach { theme ->
                ThemeItem(
                    theme = theme,
                    isSelected = theme == currentTheme,
                    onClick = { viewModel.updateTheme(theme) }
                )
                Spacer(modifier = Modifier.height(NotsenTheme.spacing.xs))
            }

            Spacer(modifier = Modifier.height(NotsenTheme.spacing.xl))

            // Link to Showcase
            // We can navigate to showcase from here as a developer option
        }
    }
}

@Composable
fun ThemeItem(
    theme: AppTheme,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(NotsenTheme.colors.bgSecondary, NotsenTheme.shapes.sm)
            .clickable(onClick = onClick)
            .padding(NotsenTheme.spacing.lg),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = theme.name.lowercase().replaceFirstChar { it.uppercase() },
            style = NotsenTheme.typography.bodyMedium,
            color = NotsenTheme.colors.textPrimary,
            modifier = Modifier.weight(1f)
        )
        if (isSelected) {
            Icon(
                imageVector = Icons.Default.Check,
                contentDescription = "Selected",
                tint = NotsenTheme.colors.accentPrimary
            )
        }
    }
}
