package com.notsen.core.designsystem

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.graphics.Color

enum class AppTheme {
    CHARCOAL,
    MIDNIGHT,
    CREAM_SLATE,
    STONE_INDIGO,
    WARM_LINEN,
    CYBERPUNK,
    NORDIC,
    SAKURA,
    HACKER,
    SUNSET,
    DEEP_OCEAN,
    HIGH_CONTRAST,
    AMBER_WOOD
}

object NotsenTheme {
    val colors: NotsenColors
        @Composable
        @ReadOnlyComposable
        get() = LocalNotsenColors.current

    val typography: androidx.compose.material3.Typography
        @Composable
        @ReadOnlyComposable
        get() = MaterialTheme.typography

    val spacing: NotsenSpacing
        get() = NotsenSpacing

    val shapes: NotsenShapes
        get() = NotsenShapes
}

fun AppTheme.getColors(): NotsenColors {
    return when (this) {
        AppTheme.CHARCOAL -> CharcoalColors
        AppTheme.MIDNIGHT -> MidnightColors
        AppTheme.CREAM_SLATE -> CreamSlateColors
        AppTheme.STONE_INDIGO -> StoneIndigoColors
        AppTheme.WARM_LINEN -> WarmLinenColors
        AppTheme.CYBERPUNK -> CyberpunkColors
        AppTheme.NORDIC -> NordicColors
        AppTheme.SAKURA -> SakuraColors
        AppTheme.HACKER -> HackerColors
        AppTheme.SUNSET -> SunsetColors
        AppTheme.DEEP_OCEAN -> DeepOceanColors
        AppTheme.HIGH_CONTRAST -> HighContrastColors
        AppTheme.AMBER_WOOD -> AmberWoodColors
    }
}

@Composable
fun NotsenTheme(
    appTheme: AppTheme = AppTheme.CHARCOAL,
    content: @Composable () -> Unit
) {
    val colors = appTheme.getColors()

    val NotsenDarkColorScheme = darkColorScheme(
        background = colors.bgPrimary,
        surface = colors.bgSecondary,
        surfaceVariant = colors.bgTertiary,
        onBackground = colors.textPrimary,
        onSurface = colors.textPrimary,
        onSurfaceVariant = colors.textSecondary,
        primary = colors.accentPrimary,
        onPrimary = Color(0xFFFFFFFF),
        error = colors.danger,
        onError = Color(0xFFFFFFFF)
    )

    CompositionLocalProvider(
        LocalNotsenColors provides colors
    ) {
        MaterialTheme(
            colorScheme = NotsenDarkColorScheme,
            typography = NotsenTypography,
            content = content
        )
    }
}
