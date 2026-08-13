package com.ha7n.mali.v9.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Color(0xFF0B6B5A),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD7F4EA),
    onPrimaryContainer = Color(0xFF073D34),
    secondary = Color(0xFF496DDB),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE1E8FF),
    onSecondaryContainer = Color(0xFF17306F),
    tertiary = Color(0xFFB36A16),
    background = Color(0xFFF7F8FA),
    onBackground = Color(0xFF17201E),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF17201E),
    surfaceVariant = Color(0xFFEDF1EF),
    onSurfaceVariant = Color(0xFF5F6B67),
    error = Color(0xFFB3261E),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF74D9BC),
    onPrimary = Color(0xFF00382D),
    primaryContainer = Color(0xFF0B5446),
    onPrimaryContainer = Color(0xFFC8F5E7),
    secondary = Color(0xFFB7C5FF),
    onSecondary = Color(0xFF183272),
    secondaryContainer = Color(0xFF2E478E),
    onSecondaryContainer = Color(0xFFDDE4FF),
    tertiary = Color(0xFFFFB95C),
    background = Color(0xFF0E1513),
    onBackground = Color(0xFFE5ECE9),
    surface = Color(0xFF131C19),
    onSurface = Color(0xFFE5ECE9),
    surfaceVariant = Color(0xFF1C2925),
    onSurfaceVariant = Color(0xFFB9C8C2),
    error = Color(0xFFFFB4AB),
)

@Composable
fun MaliTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = MaterialTheme.typography,
        content = content,
    )
}
