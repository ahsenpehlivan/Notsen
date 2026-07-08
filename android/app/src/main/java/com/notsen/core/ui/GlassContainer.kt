package com.notsen.core.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.BlurredEdgeTreatment
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.notsen.core.designsystem.NotsenColors
import com.notsen.core.designsystem.NotsenTheme

@Composable
fun GlassContainer(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(12.dp),
    backgroundColor: Color = NotsenTheme.colors.glassBg,
    borderColor: Color = NotsenTheme.colors.glassBorderSubtle,
    borderWidth: Dp = 1.dp,
    blurRadius: Dp = 16.dp,
    onClick: (() -> Unit)? = null,
    content: @Composable BoxScope.() -> Unit
) {
    Box(
        modifier = modifier
            .clip(shape)
            .background(backgroundColor)
            .border(borderWidth, borderColor, shape)
            .then(
                if (onClick != null) Modifier.clickable { onClick() } else Modifier
            )
            // Note: RenderEffect blur requires Android 12+ (API 31+).
            // In Compose, blur is simply skipped on older versions, which degrades gracefully.
            .blur(radius = blurRadius, edgeTreatment = BlurredEdgeTreatment.Rectangle)
    ) {
        content()
    }
}
