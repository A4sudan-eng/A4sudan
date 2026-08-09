package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection

private val DarkColorScheme =
  darkColorScheme(
    primary = SudanSecondary,
    secondary = SudanTertiary,
    tertiary = SudanPrimary,
    background = SudanDarkBackground,
    surface = SudanDarkSurface
  )

private val LightColorScheme =
  lightColorScheme(
    primary = SudanPrimary,
    secondary = SudanSecondary,
    tertiary = SudanTertiary,
    background = SudanBackground,
    surface = SudanSurface,
    onPrimary = SudanOnPrimary,
    onSecondary = SudanOnSecondary
  )

@Composable
fun A4SudanTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  content: @Composable () -> Unit,
) {
  val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

  CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
    MaterialTheme(
      colorScheme = colorScheme,
      typography = Typography,
      content = content
    )
  }
}

