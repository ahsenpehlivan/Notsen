package com.notsen.core.designsystem

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

import androidx.compose.ui.text.font.Font
import com.notsen.R

val PlusJakartaSans = FontFamily(
    Font(R.font.plus_jakarta_sans_variable, weight = FontWeight.Normal),
    Font(R.font.plus_jakarta_sans_variable, weight = FontWeight.Medium),
    Font(R.font.plus_jakarta_sans_variable, weight = FontWeight.SemiBold),
    Font(R.font.plus_jakarta_sans_variable, weight = FontWeight.Bold)
)

val Inter = FontFamily(
    Font(R.font.inter_variable, weight = FontWeight.Normal),
    Font(R.font.inter_variable, weight = FontWeight.Medium),
    Font(R.font.inter_variable, weight = FontWeight.SemiBold),
    Font(R.font.inter_variable, weight = FontWeight.Bold)
)

val NotsenTypography = Typography(
    headlineMedium = TextStyle(
        fontFamily = PlusJakartaSans,
        fontWeight = FontWeight.Bold, // 700
        fontSize = 20.sp, // 1.25rem
        lineHeight = 24.sp, // 1.2 * 20
        letterSpacing = (-0.025).em
    ),
    titleMedium = TextStyle(
        fontFamily = PlusJakartaSans,
        fontWeight = FontWeight.Bold, // 700
        fontSize = 14.4.sp, // 0.9rem
        lineHeight = 20.16.sp, // 1.4 * 14.4
        letterSpacing = 0.em
    ),
    labelLarge = TextStyle(
        fontFamily = Inter,
        fontWeight = FontWeight.SemiBold, // 600
        fontSize = 14.sp, // 0.875rem
        lineHeight = 19.6.sp, // 1.4 * 14
        letterSpacing = 0.em
    ),
    bodyMedium = TextStyle(
        fontFamily = Inter,
        fontWeight = FontWeight.Medium, // 500
        fontSize = 13.6.sp, // 0.85rem
        lineHeight = 21.76.sp, // 1.6 * 13.6
        letterSpacing = 0.em
    ),
    labelSmall = TextStyle(
        fontFamily = Inter,
        fontWeight = FontWeight.Normal, // 400
        fontSize = 11.5.sp, // 0.72rem
        lineHeight = 16.67.sp, // 1.45 * 11.5
        letterSpacing = 0.em
    ),
    labelMedium = TextStyle( // Button Text
        fontFamily = Inter,
        fontWeight = FontWeight.SemiBold, // 600
        fontSize = 12.8.sp, // 0.8rem
        lineHeight = 12.8.sp, // 1.0 * 12.8
        letterSpacing = 0.em
    ),
    // Sidebar Header (needs uppercase at call site)
    titleSmall = TextStyle(
        fontFamily = PlusJakartaSans,
        fontWeight = FontWeight.Bold, // 700
        fontSize = 12.sp, // 0.75rem
        lineHeight = 14.4.sp, // 1.2 * 12
        letterSpacing = 0.05.em
    )
)
