package com.ha7n.mali.v9.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.BarChart
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.ReceiptLong
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.TrackChanges
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ha7n.mali.v9.data.KIND_EXPENSE

private enum class MainTab(val label: String, val icon: ImageVector) {
    HOME("الرئيسية", Icons.Rounded.Home),
    TRANSACTIONS("الحركات", Icons.Rounded.ReceiptLong),
    PLAN("الخطة", Icons.Rounded.TrackChanges),
    REPORTS("التقارير", Icons.Rounded.BarChart),
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MaliApp(viewModel: MaliViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snapshot = uiState.snapshot
    var selectedTab by rememberSaveable { mutableStateOf(MainTab.HOME) }
    var showAddAccount by rememberSaveable { mutableStateOf(false) }
    var transactionKind by rememberSaveable { mutableStateOf<String?>(null) }
    var showSettings by rememberSaveable { mutableStateOf(false) }
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.message) {
        uiState.message?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessage()
        }
    }

    if (!uiState.initialized) {
        LoadingScreen()
        return
    }

    if (snapshot.accounts.isEmpty()) {
        OnboardingScreen(onAddAccount = { showAddAccount = true })
        if (showAddAccount) {
            AddAccountDialog(
                onDismiss = { showAddAccount = false },
                onSave = { name, type, balance ->
                    viewModel.addAccount(name, type, balance) { showAddAccount = false }
                },
            )
        }
        return
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            Column {
                TopAppBar(
                    modifier = Modifier.statusBarsPadding(),
                    title = {
                        Column {
                            Text("مالي", fontWeight = FontWeight.Black)
                            Text(
                                "صورة واضحة لأموالك",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    },
                    actions = {
                        IconButton(onClick = { showSettings = true }) {
                            Icon(Icons.Rounded.Settings, contentDescription = "الإعدادات")
                        }
                    },
                )
                if (uiState.busy) {
                    LinearProgressIndicator(modifier = Modifier.matchParentSize())
                }
            }
        },
        bottomBar = {
            NavigationBar(modifier = Modifier.navigationBarsPadding()) {
                MainTab.entries.forEach { tab ->
                    NavigationBarItem(
                        selected = selectedTab == tab,
                        onClick = { selectedTab = tab },
                        icon = { Icon(tab.icon, contentDescription = tab.label) },
                        label = { Text(tab.label) },
                    )
                }
            }
        },
        floatingActionButton = {
            if (selectedTab == MainTab.HOME || selectedTab == MainTab.TRANSACTIONS) {
                ExtendedFloatingActionButton(
                    onClick = { transactionKind = KIND_EXPENSE },
                    icon = { Icon(Icons.Rounded.Add, contentDescription = null) },
                    text = { Text("إضافة حركة") },
                )
            }
        },
    ) { innerPadding ->
        val contentModifier = Modifier
            .fillMaxSize()
            .padding(innerPadding)

        when (selectedTab) {
            MainTab.HOME -> HomeScreen(
                snapshot = snapshot,
                modifier = contentModifier,
                onAddAccount = { showAddAccount = true },
                onAddTransaction = { transactionKind = KIND_EXPENSE },
                onOpenPlan = { selectedTab = MainTab.PLAN },
            )

            MainTab.TRANSACTIONS -> TransactionsScreen(
                snapshot = snapshot,
                modifier = contentModifier,
                onDelete = viewModel::deleteTransaction,
            )

            MainTab.PLAN -> PlanScreen(
                snapshot = snapshot,
                modifier = contentModifier,
                onSetPlan = viewModel::setPlan,
            )

            MainTab.REPORTS -> ReportsScreen(
                snapshot = snapshot,
                modifier = contentModifier,
            )
        }
    }

    if (showAddAccount) {
        AddAccountDialog(
            onDismiss = { showAddAccount = false },
            onSave = { name, type, balance ->
                viewModel.addAccount(name, type, balance) { showAddAccount = false }
            },
        )
    }

    transactionKind?.let { initialKind ->
        AddTransactionSheet(
            snapshot = snapshot,
            initialKind = initialKind,
            onDismiss = { transactionKind = null },
            onSave = { kind, amount, title, accountId, categoryId, transferAccountId, date, note ->
                viewModel.addTransaction(
                    kind = kind,
                    amount = amount,
                    title = title,
                    accountId = accountId,
                    categoryId = categoryId,
                    transferAccountId = transferAccountId,
                    date = date,
                    note = note,
                    onDone = { transactionKind = null },
                )
            },
        )
    }

    if (showSettings) {
        SettingsSheet(
            settings = uiState.settings,
            viewModel = viewModel,
            onDismiss = { showSettings = false },
        )
    }
}

@Composable
private fun LoadingScreen() {
    Surface(modifier = Modifier.fillMaxSize()) {
        Box(contentAlignment = Alignment.Center) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                CircularProgressIndicator(modifier = Modifier.size(36.dp))
                Text("جاري تجهيز مالي…", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}
