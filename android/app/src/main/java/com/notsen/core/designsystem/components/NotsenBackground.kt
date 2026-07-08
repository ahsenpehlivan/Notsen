package com.notsen.core.designsystem.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.notsen.core.designsystem.NotsenColors
import com.notsen.core.designsystem.NotsenTheme

@Composable
fun NotsenBackground(
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit
) {
    val bgPrimary = NotsenTheme.colors.bgPrimary
    val gradientCenter = NotsenTheme.colors.gradientCenter
    val gradientBottom = NotsenTheme.colors.gradientBottom

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(bgPrimary)
            .drawBehind {
                // Background Gradient:
                // radial-gradient(ellipse 60% 40% at 60% -10%, rgba(230, 57, 70, 0.12), transparent)
                // radial-gradient(ellipse 40% 40% at 10% 100%, rgba(255, 77, 91, 0.06), transparent)

                // Top Right-ish Gradient
                val topRadius = maxOf(size.width * 0.6f, size.height * 0.4f)
                drawOval(
                    brush = Brush.radialGradient(
                        colors = listOf(gradientCenter, Color.Transparent),
                        center = Offset(size.width * 0.6f, size.height * -0.1f),
                        radius = topRadius
                    ),
                    topLeft = Offset(size.width * 0.6f - topRadius, size.height * -0.1f - topRadius * 0.6f),
                    size = Size(topRadius * 2f, topRadius * 1.2f)
                )

                // Bottom Left Gradient
                val bottomRadius = maxOf(size.width * 0.4f, size.height * 0.4f)
                drawOval(
                    brush = Brush.radialGradient(
                        colors = listOf(gradientBottom, Color.Transparent),
                        center = Offset(size.width * 0.1f, size.height),
                        radius = bottomRadius
                    ),
                    topLeft = Offset(size.width * 0.1f - bottomRadius, size.height - bottomRadius * 0.6f),
                    size = Size(bottomRadius * 2f, bottomRadius * 1.2f)
                )
            }
    ) {
        content()
    }
}
