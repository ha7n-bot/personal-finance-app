package com.ha7n.mali.v9

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.lifecycle.viewmodel.compose.viewModel
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

        val repository = MaliRepository(MaliDatabase.getInstance(applicationContext).maliDao())
        val factory = MaliViewModelFactory(repository)

        setContent {
            MaliTheme {
                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                    val viewModel: MaliViewModel = viewModel(factory = factory)
                    MaliApp(viewModel = viewModel)
                }
            }
        }
    }
}
