package com.notsen.feature.designsystem.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.notsen.core.designsystem.NotsenTheme
import com.notsen.core.designsystem.components.NotsenBackground
import com.notsen.core.designsystem.components.NotsenButton
import com.notsen.core.designsystem.components.NotsenGlassCard
import com.notsen.core.designsystem.components.NotsenTagChip

@Composable
fun DesignSystemShowcaseScreen() {
    NotsenTheme {
        NotsenBackground {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(NotsenTheme.spacing.xxxl),
                verticalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.xxl)
            ) {
                // Typography
                Text(text = "Design System Showcase", style = NotsenTheme.typography.headlineMedium, color = NotsenTheme.colors.textPrimary)

                // Colors
                Row(horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.sm)) {
                    ColorBox(NotsenTheme.colors.bgPrimary, "BgPrimary")
                    ColorBox(NotsenTheme.colors.bgSecondary, "BgSecondary")
                    ColorBox(NotsenTheme.colors.bgTertiary, "BgTertiary")
                    ColorBox(NotsenTheme.colors.accentPrimary, "Accent")
                }

                // Glass Card
                NotsenGlassCard(
                    modifier = Modifier.fillMaxWidth().height(100.dp)
                ) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("Glass Card (No Backdrop Blur)", style = NotsenTheme.typography.labelLarge, color = NotsenTheme.colors.textPrimary)
                    }
                }

                // Column & Task Card Preview
                Box(
                    modifier = Modifier
                        .width(310.dp)
                        .background(NotsenTheme.colors.bgSecondary, NotsenTheme.shapes.lg)
                        .padding(NotsenTheme.spacing.lg)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.md)) {
                        Text("Column Title", style = NotsenTheme.typography.titleMedium, color = NotsenTheme.colors.textPrimary)

                        // Task Card
                        NotsenGlassCard(
                            backgroundColor = NotsenTheme.colors.bgTertiary,
                            borderColor = NotsenTheme.colors.glassBorderSubtle,
                            shape = NotsenTheme.shapes.md
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(NotsenTheme.spacing.lg),
                                verticalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.sm)
                            ) {
                                Text("Task Card Title", style = NotsenTheme.typography.labelLarge, color = NotsenTheme.colors.textPrimary)
                                Text("Description text goes here.", style = NotsenTheme.typography.bodyMedium, color = NotsenTheme.colors.textSecondary)

                                Row(horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.xs)) {
                                    NotsenTagChip("Bug", backgroundColor = NotsenTheme.colors.dangerSubtle, textColor = NotsenTheme.colors.danger)
                                    NotsenTagChip("Feature", backgroundColor = NotsenTheme.colors.accentSubtle, textColor = NotsenTheme.colors.accentPrimary)
                                }
                            }
                        }
                    }
                }

                // Button
                NotsenButton(text = "Action Button", onClick = { })
            }
        }
    }
}

@Composable
private fun ColorBox(color: Color, name: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.xs)) {
        Box(modifier = Modifier.size(40.dp).background(color, NotsenTheme.shapes.sm))
        Text(name, style = NotsenTheme.typography.labelSmall, color = NotsenTheme.colors.textSecondary)
    }
}
