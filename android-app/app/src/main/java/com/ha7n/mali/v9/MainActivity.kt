package com.ha7n.mali.v9

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ha7n.mali.v9.data.AppSettingsRepository
import com.ha7n.mali.v9.data.MaliDatabase
import com.ha7n.mali.v9.data.MaliRepository
import com.ha7n.mali.v9.ui.MaliApp
import com.ha7n.mali.v9.ui.MaliViewModel
import com.ha7n.mali.v9.ui.MaliViewModelFactory
import com.ha7n.mali.v9.ui.theme.MaliTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val database = MaliDatabase.getInstance(applicationContext)
        val repository = MaliRepository(applicationContext, database.maliDao())
        val settingsRepository = AppSettingsRepository(applicationContext)
        val factory = MaliViewModelFactory(repository, settingsRepository)

        setContent {
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                val viewModel: MaliViewModel = viewModel(factory = factory)
                val uiState by viewModel.uiState.collectAsStateWithLifecycle()
                MaliTheme(themeMode = uiState.settings.themeMode) {
                    MaliApp(viewModel = viewModel)
                }
            }
        }
    }
}
