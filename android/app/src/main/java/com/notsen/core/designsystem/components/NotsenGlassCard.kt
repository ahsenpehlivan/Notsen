package com.notsen.core.designsystem.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.notsen.core.designsystem.NotsenTheme

@Composable
fun NotsenGlassCard(
    modifier: Modifier = Modifier,
    shape: RoundedCornerShape = NotsenTheme.shapes.md,
    backgroundColor: Color = NotsenTheme.colors.glassBg,
    borderColor: Color = NotsenTheme.colors.glassBorderSubtle,
    elevation: Dp = 8.dp,
    onClick: (() -> Unit)? = null,
    content: @Composable BoxScope.() -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val gradientBrush = Brush.radialGradient(
        colors = listOf(
            NotsenTheme.colors.gradientCenter,
            NotsenTheme.colors.gradientBottom,
            Color.Transparent
        ),
        radius = 800f
    )

    var mod = modifier
        .shadow(
            elevation = if (isPressed) elevation / 2 else elevation,
            shape = shape,
            ambientColor = Color.Black.copy(alpha = 0.5f),
            spotColor = Color.Black.copy(alpha = 0.5f)
        )
        .clip(shape)
        .background(backgroundColor)
        .background(gradientBrush) // subtle radial gradient
        .border(width = 1.dp, color = borderColor, shape = shape)

    if (onClick != null) {
        mod = mod.clickable(
            interactionSource = interactionSource,
            indication = androidx.compose.material3.ripple(color = NotsenTheme.colors.accentPrimary),
            onClick = onClick
        )
    }

    Box(
        modifier = mod,
        content = content
    )
}
