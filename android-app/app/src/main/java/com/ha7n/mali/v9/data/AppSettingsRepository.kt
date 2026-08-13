package com.ha7n.mali.v9.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

enum class ThemeMode {
    SYSTEM,
    LIGHT,
    DARK,
}

data class AppSettings(
    val themeMode: ThemeMode = ThemeMode.SYSTEM,
)

private val Context.maliSettingsDataStore by preferencesDataStore(name = "mali_v9_settings")

class AppSettingsRepository(private val context: Context) {
    private val themeModeKey = stringPreferencesKey("theme_mode")

    val settings: Flow<AppSettings> = context.maliSettingsDataStore.data.map { preferences ->
        AppSettings(
            themeMode = runCatching {
                ThemeMode.valueOf(preferences[themeModeKey] ?: ThemeMode.SYSTEM.name)
            }.getOrDefault(ThemeMode.SYSTEM),
        )
    }

    suspend fun setThemeMode(mode: ThemeMode) {
        context.maliSettingsDataStore.edit { preferences ->
            preferences[themeModeKey] = mode.name
        }
    }
}
