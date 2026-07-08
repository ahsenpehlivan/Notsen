package com.notsen.feature.showcase.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.notsen.core.designsystem.NotsenTheme
import com.notsen.core.designsystem.components.NotsenButton
import com.notsen.core.designsystem.components.NotsenGlassCard
import com.notsen.core.designsystem.components.NotsenTagChip

@Composable
fun DesignSystemShowcase() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(NotsenTheme.colors.bgPrimary)
            .verticalScroll(rememberScrollState())
            .padding(NotsenTheme.spacing.xl)
    ) {
        Text(
            text = "Typography",
            style = NotsenTheme.typography.headlineMedium,
            color = NotsenTheme.colors.textPrimary
        )
        Spacer(modifier = Modifier.height(NotsenTheme.spacing.md))

        Text(text = "Headline Medium (Plus Jakarta Sans 700)", style = NotsenTheme.typography.headlineMedium, color = NotsenTheme.colors.textPrimary)
        Text(text = "Title Medium (Plus Jakarta Sans 700)", style = NotsenTheme.typography.titleMedium, color = NotsenTheme.colors.textPrimary)
        Text(text = "Label Large (Inter 600)", style = NotsenTheme.typography.labelLarge, color = NotsenTheme.colors.textPrimary)
        Text(text = "Body Medium (Inter 500)", style = NotsenTheme.typography.bodyMedium, color = NotsenTheme.colors.textSecondary)
        Text(text = "Label Small (Inter 400)", style = NotsenTheme.typography.labelSmall, color = NotsenTheme.colors.textMuted)

        Spacer(modifier = Modifier.height(NotsenTheme.spacing.xxl))

        Text(
            text = "Colors & Accents",
            style = NotsenTheme.typography.headlineMedium,
            color = NotsenTheme.colors.textPrimary
        )
        Spacer(modifier = Modifier.height(NotsenTheme.spacing.md))
        Row(horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.md)) {
            ColorBox("Primary", NotsenTheme.colors.accentPrimary)
            ColorBox("Success", NotsenTheme.colors.success)
            ColorBox("Warning", NotsenTheme.colors.warning)
            ColorBox("Danger", NotsenTheme.colors.danger)
        }

        Spacer(modifier = Modifier.height(NotsenTheme.spacing.xxl))

        Text(
            text = "Glassmorphism & Cards",
            style = NotsenTheme.typography.headlineMedium,
            color = NotsenTheme.colors.textPrimary
        )
        Spacer(modifier = Modifier.height(NotsenTheme.spacing.md))
        NotsenGlassCard(
            modifier = Modifier.fillMaxWidth().height(120.dp),
            onClick = {}
        ) {
            Column(modifier = Modifier.padding(NotsenTheme.spacing.lg)) {
                Text("Interactive Glass Card", style = NotsenTheme.typography.titleMedium, color = NotsenTheme.colors.textPrimary)
                Spacer(modifier = Modifier.height(NotsenTheme.spacing.xs))
                Text("Tap to see glow and ripple effects, shadow changes on press.", style = NotsenTheme.typography.bodyMedium, color = NotsenTheme.colors.textSecondary)
            }
        }

        Spacer(modifier = Modifier.height(NotsenTheme.spacing.xxl))

        Text(
            text = "Components",
            style = NotsenTheme.typography.headlineMedium,
            color = NotsenTheme.colors.textPrimary
        )
        Spacer(modifier = Modifier.height(NotsenTheme.spacing.md))
        Row(horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.md)) {
            NotsenButton(text = "Primary Button", onClick = {})
            NotsenButton(text = "Secondary", isSecondary = true, onClick = {})
        }
        Spacer(modifier = Modifier.height(NotsenTheme.spacing.md))
        Row(horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.md)) {
            NotsenTagChip(text = "Design", textColor = NotsenTheme.colors.accentPrimary, backgroundColor = NotsenTheme.colors.accentSubtle)
            NotsenTagChip(text = "Backend", textColor = NotsenTheme.colors.success, backgroundColor = NotsenTheme.colors.successSubtle)
            NotsenTagChip(text = "Bug", textColor = NotsenTheme.colors.danger, backgroundColor = NotsenTheme.colors.dangerSubtle)
        }

        Spacer(modifier = Modifier.height(NotsenTheme.spacing.xxl))
    }
}

@Composable
fun ColorBox(name: String, color: androidx.compose.ui.graphics.Color) {
    Column {
        Box(modifier = Modifier.size(60.dp).background(color, NotsenTheme.shapes.sm))
        Spacer(modifier = Modifier.height(NotsenTheme.spacing.xs))
        Text(name, style = NotsenTheme.typography.labelSmall, color = NotsenTheme.colors.textSecondary)
    }
}
