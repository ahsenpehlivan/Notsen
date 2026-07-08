package com.notsen.core.designsystem

import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

data class NotsenColors(
    val bgPrimary: Color,
    val bgSecondary: Color, // Column BG
    val bgTertiary: Color, // Task Card BG
    val bgHover: Color,

    val textPrimary: Color,
    val textSecondary: Color,
    val textMuted: Color,

    val accentPrimary: Color,
    val accentHover: Color,
    val accentSubtle: Color, // rgba(..., 0.12)
    val accentGlow: Color, // rgba(..., 0.3)
    val accentMuted: Color, // rgba(..., 0.06)

    val danger: Color,
    val dangerHover: Color,
    val dangerSubtle: Color, // rgba(..., 0.1)

    val success: Color,
    val successSubtle: Color, // rgba(..., 0.1)
    val warning: Color,

    val glassBg: Color, // rgba(..., 0.8)
    val glassBorder: Color, // rgba(..., 0.2)
    val glassBorderSubtle: Color, // rgba(..., 0.06)

    val gradientCenter: Color, // rgba(..., 0.12)
    val gradientBottom: Color // rgba(..., 0.06)
)

val LocalNotsenColors = staticCompositionLocalOf<NotsenColors> {
    error("No NotsenColors provided")
}

val CharcoalColors = NotsenColors(
    bgPrimary = Color(0xFF181414),
    bgSecondary = Color(0xFF221C1C),
    bgTertiary = Color(0xFF2D2424),
    bgHover = Color(0xFF382C2C),
    textPrimary = Color(0xFFF5F0F0),
    textSecondary = Color(0xFFB09898),
    textMuted = Color(0xFF6B5656),
    accentPrimary = Color(0xFFE63946),
    accentHover = Color(0xFFFF4D5B),
    accentSubtle = Color(0x1EE63946),
    accentGlow = Color(0x4CE63946),
    accentMuted = Color(0x0FE63946),
    danger = Color(0xFFFF6B6B),
    dangerHover = Color(0xFFFF9090),
    dangerSubtle = Color(0x19FF6B6B),
    success = Color(0xFF51CF66),
    successSubtle = Color(0x1951CF66),
    warning = Color(0xFFFCC419),
    glassBg = Color(0xCC221C1C),
    glassBorder = Color(0x33E63946),
    glassBorderSubtle = Color(0x0FF5F0F0),
    gradientCenter = Color(0x1EE63946),
    gradientBottom = Color(0x0FFF4D5B)
)

val MidnightColors = NotsenColors(
    bgPrimary = Color(0xFF0D1117),
    bgSecondary = Color(0xFF161B22),
    bgTertiary = Color(0xFF21262D),
    bgHover = Color(0xFF30363D),
    textPrimary = Color(0xFFE6EDF3),
    textSecondary = Color(0xFF8B949E),
    textMuted = Color(0xFF484F58),
    accentPrimary = Color(0xFFE63946),
    accentHover = Color(0xFFFF4D5B),
    accentSubtle = Color(0x1EE63946),
    accentGlow = Color(0x3FE63946),
    accentMuted = Color(0x0CE63946),
    danger = Color(0xFFF85149),
    dangerHover = Color(0xFFFF7B72),
    dangerSubtle = Color(0x19F85149),
    success = Color(0xFF3FB950),
    successSubtle = Color(0x193FB950),
    warning = Color(0xFFE3B341),
    glassBg = Color(0xE5161B22),
    glassBorder = Color(0x2DE63946),
    glassBorderSubtle = Color(0x11E6EDF3),
    gradientCenter = Color(0x14388BFD),
    gradientBottom = Color(0x0FE63946)
)

val CreamSlateColors = NotsenColors(
    bgPrimary = Color(0xFFF8F6F1),
    bgSecondary = Color(0xFFFFFFFF),
    bgTertiary = Color(0xFFEDEAE2),
    bgHover = Color(0xFFE2DDD4),
    textPrimary = Color(0xFF1E293B),
    textSecondary = Color(0xFF475569),
    textMuted = Color(0xFF94A3B8),
    accentPrimary = Color(0xFFE63946),
    accentHover = Color(0xFFC1121F),
    accentSubtle = Color(0x16E63946),
    accentGlow = Color(0x2DE63946),
    accentMuted = Color(0x0AE63946),
    danger = Color(0xFFDC2626),
    dangerHover = Color(0xFFEF4444),
    dangerSubtle = Color(0x16DC2626),
    success = Color(0xFF16A34A),
    successSubtle = Color(0x1616A34A),
    warning = Color(0xFFD97706),
    glassBg = Color(0xEAFFFFFF),
    glassBorder = Color(0x26E63946),
    glassBorderSubtle = Color(0x141E293B),
    gradientCenter = Color(0x0CE63946),
    gradientBottom = Color(0x1494A3B8)
)

val StoneIndigoColors = NotsenColors(
    bgPrimary = Color(0xFFF1F3F5),
    bgSecondary = Color(0xFFFFFFFF),
    bgTertiary = Color(0xFFE9ECEF),
    bgHover = Color(0xFFDEE2E6),
    textPrimary = Color(0xFF212529),
    textSecondary = Color(0xFF495057),
    textMuted = Color(0xFF868E96),
    accentPrimary = Color(0xFF4361EE),
    accentHover = Color(0xFF3451D1),
    accentSubtle = Color(0x194361EE),
    accentGlow = Color(0x334361EE),
    accentMuted = Color(0x0C4361EE),
    danger = Color(0xFFE03131),
    dangerHover = Color(0xFFF03E3E),
    dangerSubtle = Color(0x16E03131),
    success = Color(0xFF2F9E44),
    successSubtle = Color(0x162F9E44),
    warning = Color(0xFFE67700),
    glassBg = Color(0xEAFFFFFF),
    glassBorder = Color(0x2D4361EE),
    glassBorderSubtle = Color(0x14212529),
    gradientCenter = Color(0x114361EE),
    gradientBottom = Color(0x0A4361EE)
)

val WarmLinenColors = NotsenColors(
    bgPrimary = Color(0xFFFAF9F5),
    bgSecondary = Color(0xFFFFFFFE),
    bgTertiary = Color(0xFFF0EDE5),
    bgHover = Color(0xFFE7E2D6),
    textPrimary = Color(0xFF2C2416),
    textSecondary = Color(0xFF5C4D38),
    textMuted = Color(0xFF9C8E7A),
    accentPrimary = Color(0xFFC0392B),
    accentHover = Color(0xFFA93226),
    accentSubtle = Color(0x16C0392B),
    accentGlow = Color(0x2DC0392B),
    accentMuted = Color(0x0AC0392B),
    danger = Color(0xFFC0392B),
    dangerHover = Color(0xFFE74C3C),
    dangerSubtle = Color(0x16C0392B),
    success = Color(0xFF27AE60),
    successSubtle = Color(0x1627AE60),
    warning = Color(0xFFD35400),
    glassBg = Color(0xEAFFFFFE),
    glassBorder = Color(0x26C0392B),
    glassBorderSubtle = Color(0x142C2416),
    gradientCenter = Color(0x0CC0392B),
    gradientBottom = Color(0x119C8E7A)
)

val CyberpunkColors = NotsenColors(
    bgPrimary = Color(0xFF09090B),
    bgSecondary = Color(0xFF121217),
    bgTertiary = Color(0xFF181820),
    bgHover = Color(0xFF22222D),
    textPrimary = Color(0xFFFDF8F5),
    textSecondary = Color(0xFFA1A1AA),
    textMuted = Color(0xFF71717A),
    accentPrimary = Color(0xFFF000FF),
    accentHover = Color(0xFFFF33FF),
    accentSubtle = Color(0x26F000FF),
    accentGlow = Color(0x66F000FF),
    accentMuted = Color(0x0CF000FF),
    danger = Color(0xFFFF003C),
    dangerHover = Color(0xFFFF3366),
    dangerSubtle = Color(0x26FF003C),
    success = Color(0xFF00FF9D),
    successSubtle = Color(0x1900FF9D),
    warning = Color(0xFFFCE803),
    glassBg = Color(0xD8121217),
    glassBorder = Color(0x4C00FFFF),
    glassBorderSubtle = Color(0x0CFFFFFF),
    gradientCenter = Color(0x19F000FF),
    gradientBottom = Color(0x1400FFFF)
)

val NordicColors = NotsenColors(
    bgPrimary = Color(0xFF2E3440),
    bgSecondary = Color(0xFF3B4252),
    bgTertiary = Color(0xFF434C5E),
    bgHover = Color(0xFF4C566A),
    textPrimary = Color(0xFFECEFF4),
    textSecondary = Color(0xFFE5E9F0),
    textMuted = Color(0xFFD8DEE9),
    accentPrimary = Color(0xFF88C0D0),
    accentHover = Color(0xFF8FBCBB),
    accentSubtle = Color(0x2688C0D0),
    accentGlow = Color(0x4C88C0D0),
    accentMuted = Color(0x0C88C0D0),
    danger = Color(0xFFBF616A),
    dangerHover = Color(0xFFD08770),
    dangerSubtle = Color(0x26BF616A),
    success = Color(0xFFA3BE8C),
    successSubtle = Color(0x19A3BE8C),
    warning = Color(0xFFEBCB8B),
    glassBg = Color(0xD83B4252),
    glassBorder = Color(0x3388C0D0),
    glassBorderSubtle = Color(0x14D8DEE9),
    gradientCenter = Color(0x1488C0D0),
    gradientBottom = Color(0x0C81A1C1)
)

val SakuraColors = NotsenColors(
    bgPrimary = Color(0xFFFFF0F5),
    bgSecondary = Color(0xFFFFF5F8),
    bgTertiary = Color(0xFFFFE6EE),
    bgHover = Color(0xFFFFD6E3),
    textPrimary = Color(0xFF4A3B3D),
    textSecondary = Color(0xFF7A6265),
    textMuted = Color(0xFFA58D90),
    accentPrimary = Color(0xFFFF6699),
    accentHover = Color(0xFFFF3377),
    accentSubtle = Color(0x26FF6699),
    accentGlow = Color(0x59FF6699),
    accentMuted = Color(0x0CFF6699),
    danger = Color(0xFFE05D6F),
    dangerHover = Color(0xFFC94A5B),
    dangerSubtle = Color(0x19E05D6F),
    success = Color(0xFF85B899),
    successSubtle = Color(0x1985B899),
    warning = Color(0xFFD9A05B),
    glassBg = Color(0xD8FFF5F8),
    glassBorder = Color(0x3FFF6699),
    glassBorderSubtle = Color(0x66FF99BB),
    gradientCenter = Color(0x26FF6699),
    gradientBottom = Color(0x19FF6699)
)

val HackerColors = NotsenColors(
    bgPrimary = Color(0xFF000000),
    bgSecondary = Color(0xFF0A0A0A),
    bgTertiary = Color(0xFF111111),
    bgHover = Color(0xFF1A1A1A),
    textPrimary = Color(0xFF00FF00),
    textSecondary = Color(0xFF00CC00),
    textMuted = Color(0xFF008800),
    accentPrimary = Color(0xFF00FF00),
    accentHover = Color(0xFF00FF33),
    accentSubtle = Color(0x2600FF00),
    accentGlow = Color(0x7F00FF00),
    accentMuted = Color(0x0C00FF00),
    danger = Color(0xFFFF0000),
    dangerHover = Color(0xFFFF3333),
    dangerSubtle = Color(0x26FF0000),
    success = Color(0xFF00FF00),
    successSubtle = Color(0x1900FF00),
    warning = Color(0xFFFFFF00),
    glassBg = Color(0xE50A0A0A),
    glassBorder = Color(0x6600FF00),
    glassBorderSubtle = Color(0x2600FF00),
    gradientCenter = Color(0x0C00FF00),
    gradientBottom = Color(0x00000000)
)

val SunsetColors = NotsenColors(
    bgPrimary = Color(0xFF1A0B2E),
    bgSecondary = Color(0xFF24113D),
    bgTertiary = Color(0xFF30164D),
    bgHover = Color(0xFF3F1D64),
    textPrimary = Color(0xFFFFE5E5),
    textSecondary = Color(0xFFFFB3B3),
    textMuted = Color(0xFFCC8080),
    accentPrimary = Color(0xFFFF6B6B),
    accentHover = Color(0xFFFF8E53),
    accentSubtle = Color(0x26FF6B6B),
    accentGlow = Color(0x66FF8E53),
    accentMuted = Color(0x0CFF6B6B),
    danger = Color(0xFFE63946),
    dangerHover = Color(0xFFFF4D5B),
    dangerSubtle = Color(0x26E63946),
    success = Color(0xFF4ECDC4),
    successSubtle = Color(0x194ECDC4),
    warning = Color(0xFFFFE66D),
    glassBg = Color(0xD824113D),
    glassBorder = Color(0x4CFF6B6B),
    glassBorderSubtle = Color(0x19FFB3B3),
    gradientCenter = Color(0x26FF6B6B),
    gradientBottom = Color(0x19FF8E53)
)

val DeepOceanColors = NotsenColors(
    bgPrimary = Color(0xFF0A1128),
    bgSecondary = Color(0xFF0F1A3B),
    bgTertiary = Color(0xFF142451),
    bgHover = Color(0xFF1B306B),
    textPrimary = Color(0xFFE0F2FE),
    textSecondary = Color(0xFFBAE6FD),
    textMuted = Color(0xFF7DD3FC),
    accentPrimary = Color(0xFF0EA5E9),
    accentHover = Color(0xFF38BDF8),
    accentSubtle = Color(0x260EA5E9),
    accentGlow = Color(0x660EA5E9),
    accentMuted = Color(0x0C0EA5E9),
    danger = Color(0xFFF43F5E),
    dangerHover = Color(0xFFFB7185),
    dangerSubtle = Color(0x26F43F5E),
    success = Color(0xFF10B981),
    successSubtle = Color(0x1910B981),
    warning = Color(0xFFF59E0B),
    glassBg = Color(0xD80F1A3B),
    glassBorder = Color(0x4C0EA5E9),
    glassBorderSubtle = Color(0x19BAE6FD),
    gradientCenter = Color(0x260EA5E9),
    gradientBottom = Color(0x1938BDF8)
)

val HighContrastColors = NotsenColors(
    bgPrimary = Color(0xFF000000),
    bgSecondary = Color(0xFF000000),
    bgTertiary = Color(0xFF1A1A1A),
    bgHover = Color(0xFF333333),
    textPrimary = Color(0xFFFFFFFF),
    textSecondary = Color(0xFFFFFF00),
    textMuted = Color(0xFFCCCCCC),
    accentPrimary = Color(0xFFFFFF00),
    accentHover = Color(0xFFFFCC00),
    accentSubtle = Color(0x33FFFF00),
    accentGlow = Color(0x99FFFF00),
    accentMuted = Color(0x19FFFF00),
    danger = Color(0xFFFF0000),
    dangerHover = Color(0xFFFF3333),
    dangerSubtle = Color(0x33FF0000),
    success = Color(0xFF00FF00),
    successSubtle = Color(0x3300FF00),
    warning = Color(0xFFFF9900),
    glassBg = Color(0xF2000000),
    glassBorder = Color(0xFFFFFF00),
    glassBorderSubtle = Color(0xFF666666),
    gradientCenter = Color(0x00000000),
    gradientBottom = Color(0x00000000)
)

val AmberWoodColors = NotsenColors(
    bgPrimary = Color(0xFFF9F3ED),
    bgSecondary = Color(0xFFFFFFFF),
    bgTertiary = Color(0xFFEFE4D8),
    bgHover = Color(0xFFE6D5C3),
    textPrimary = Color(0xFF4A3728),
    textSecondary = Color(0xFF7A5C43),
    textMuted = Color(0xFFA68A73),
    accentPrimary = Color(0xFFE67E22),
    accentHover = Color(0xFFD35400),
    accentSubtle = Color(0x1EE67E22),
    accentGlow = Color(0x3FE67E22),
    accentMuted = Color(0x0CE67E22),
    danger = Color(0xFFE74C3C),
    dangerHover = Color(0xFFC0392B),
    dangerSubtle = Color(0x19E74C3C),
    success = Color(0xFF27AE60),
    successSubtle = Color(0x1927AE60),
    warning = Color(0xFFF39C12),
    glassBg = Color(0xD8FFFFFF),
    glassBorder = Color(0x3FE67E22),
    glassBorderSubtle = Color(0x197A5C43),
    gradientCenter = Color(0x19E67E22),
    gradientBottom = Color(0x0CD35400)
)
