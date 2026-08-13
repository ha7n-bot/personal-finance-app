package com.ha7n.mali.v9.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AccountBalance
import androidx.compose.material.icons.rounded.AccountBalanceWallet
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.ArrowDownward
import androidx.compose.material.icons.rounded.ArrowUpward
import androidx.compose.material.icons.rounded.AttachMoney
import androidx.compose.material.icons.rounded.BarChart
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Category
import androidx.compose.material.icons.rounded.ChevronLeft
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.CreditCard
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.DirectionsCar
import androidx.compose.material.icons.rounded.FamilyRestroom
import androidx.compose.material.icons.rounded.HealthAndSafety
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.LocalGasStation
import androidx.compose.material.icons.rounded.MoreHoriz
import androidx.compose.material.icons.rounded.Payments
import androidx.compose.material.icons.rounded.Receipt
import androidx.compose.material.icons.rounded.ReceiptLong
import androidx.compose.material.icons.rounded.Restaurant
import androidx.compose.material.icons.rounded.Savings
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.ShoppingBag
import androidx.compose.material.icons.rounded.ShoppingCart
import androidx.compose.material.icons.rounded.SportsEsports
import androidx.compose.material.icons.rounded.SwapHoriz
import androidx.compose.material.icons.rounded.TrackChanges
import androidx.compose.material.icons.rounded.Work
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ha7n.mali.v9.data.AccountBalance
import com.ha7n.mali.v9.data.AccountEntity
import com.ha7n.mali.v9.data.CategoryEntity
import com.ha7n.mali.v9.data.FinanceSnapshot
import com.ha7n.mali.v9.data.KIND_EXPENSE
import com.ha7n.mali.v9.data.KIND_INCOME
import com.ha7n.mali.v9.data.KIND_TRANSFER
import com.ha7n.mali.v9.data.PlanProgress
import com.ha7n.mali.v9.data.TransactionEntity
import java.text.NumberFormat
import java.time.Instant
import java.time.LocalDate
import java.time.YearMonth
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.Locale

private val IncomeColor = Color(0xFF16805F)
private val ExpenseColor = Color(0xFFD55353)
private val PlanColor = Color(0xFF496DDB)
private val WarningColor = Color(0xFFE39A24)

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
    var showAddTransaction by rememberSaveable { mutableStateOf(false) }
    var showSettings by rememberSaveable { mutableStateOf(false) }
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.message) {
        uiState.message?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessage()
        }
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
                    onClick = { showAddTransaction = true },
                    icon = { Icon(Icons.Rounded.Add, contentDescription = null) },
                    text = { Text("إضافة حركة") },
                )
            }
        },
    ) { innerPadding ->
        when (selectedTab) {
            MainTab.HOME -> HomeScreen(
                snapshot = snapshot,
                modifier = Modifier.padding(innerPadding),
                onAddAccount = { showAddAccount = true },
                onAddTransaction = { showAddTransaction = true },
                onOpenPlan = { selectedTab = MainTab.PLAN },
            )

            MainTab.TRANSACTIONS -> TransactionsScreen(
                snapshot = snapshot,
                modifier = Modifier.padding(innerPadding),
                onDelete = viewModel::deleteTransaction,
            )

            MainTab.PLAN -> PlanScreen(
                snapshot = snapshot,
                modifier = Modifier.padding(innerPadding),
                onSetPlan = viewModel::setPlan,
            )

            MainTab.REPORTS -> ReportsScreen(
                snapshot = snapshot,
                modifier = Modifier.padding(innerPadding),
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

    if (showAddTransaction) {
        AddTransactionSheet(
            snapshot = snapshot,
            onDismiss = { showAddTransaction = false },
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
                    onDone = { showAddTransaction = false },
                )
            },
        )
    }

    if (showSettings) {
        AlertDialog(
            onDismissRequest = { showSettings = false },
            title = { Text("الإعدادات") },
            text = {
                Text("هذه النسخة الجديدة تبدأ بإعدادات أقل عمدًا. النسخ الاحتياطي والترحيل من 8.x سيضافان قبل إصدار v9 النهائي.")
            },
            confirmButton = {
                TextButton(onClick = { showSettings = false }) { Text("تم") }
            },
        )
    }
}

@Composable
private fun OnboardingScreen(onAddAccount: () -> Unit) {
    Surface(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(24.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Surface(
                    shape = RoundedCornerShape(24.dp),
                    color = MaterialTheme.colorScheme.primaryContainer,
                    modifier = Modifier.size(64.dp),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Rounded.AccountBalanceWallet,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(32.dp),
                        )
                    }
                }
                Text("خلّ أموالك أوضح", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
                Text(
                    "ابدأ فقط بالمكان الذي تحتفظ فيه بأموالك. أضف حسابًا نقديًا أو بنكيًا ورصيده الحالي، والباقي نبنيه مع استخدامك للتطبيق.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                OnboardingPoint("1", "أضف حسابك ورصيدك الحالي")
                OnboardingPoint("2", "سجل المصروف أو الدخل في ثوانٍ")
                OnboardingPoint("3", "ضع خطة شهرية فقط لما يهمك")
            }
            Button(
                onClick = onAddAccount,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(18.dp),
            ) {
                Icon(Icons.Rounded.Add, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("أضف أول حساب", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun OnboardingPoint(number: String, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Surface(shape = CircleShape, color = MaterialTheme.colorScheme.secondaryContainer, modifier = Modifier.size(34.dp)) {
            Box(contentAlignment = Alignment.Center) {
                Text(number, color = MaterialTheme.colorScheme.secondary, fontWeight = FontWeight.Black)
            }
        }
        Text(text, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun HomeScreen(
    snapshot: FinanceSnapshot,
    modifier: Modifier,
    onAddAccount: () -> Unit,
    onAddTransaction: () -> Unit,
    onOpenPlan: () -> Unit,
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item { BalanceHero(snapshot.totalBalance) }
        item { MonthlySummary(snapshot) }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                QuickAction(
                    title = "مصروف",
                    icon = Icons.Rounded.ArrowDownward,
                    tint = ExpenseColor,
                    modifier = Modifier.weight(1f),
                    onClick = onAddTransaction,
                )
                QuickAction(
                    title = "دخل",
                    icon = Icons.Rounded.ArrowUpward,
                    tint = IncomeColor,
                    modifier = Modifier.weight(1f),
                    onClick = onAddTransaction,
                )
                QuickAction(
                    title = "حساب",
                    icon = Icons.Rounded.AccountBalanceWallet,
                    tint = PlanColor,
                    modifier = Modifier.weight(1f),
                    onClick = onAddAccount,
                )
            }
        }
        item {
            SectionTitle(
                title = "خطتي هذا الشهر",
                subtitle = if (snapshot.planProgress.isEmpty()) "ضع حدودًا بسيطة فقط لما تريد متابعته" else "المصروفات تخصم تلقائيًا من الخطة",
                action = "فتح الخطة",
                onAction = onOpenPlan,
            )
        }
        if (snapshot.planProgress.isEmpty()) {
            item { EmptyPlanCard(onOpenPlan) }
        } else {
            items(snapshot.planProgress.take(3), key = { it.category.id }) { progress ->
                PlanProgressCard(progress)
            }
        }
        item { SectionTitle("أين أموالي", "رصيد كل مكان بشكل مباشر") }
        items(snapshot.accountBalances, key = { it.account.id }) { balance ->
            AccountRow(balance)
        }
        item { SectionTitle("أين صرفت هذا الشهر", "أعلى التصنيفات حسب المصروف") }
        item { SpendingBreakdown(snapshot) }
        item { Spacer(Modifier.height(20.dp)) }
    }
}

@Composable
private fun BalanceHero(totalBalance: Long) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
        shape = RoundedCornerShape(28.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("إجمالي ما تملكه الآن", color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.78f))
            Text(
                formatRiyal(totalBalance),
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Black,
                color = MaterialTheme.colorScheme.onPrimary,
            )
            Text(
                "من جميع حساباتك المسجلة",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.72f),
            )
        }
    }
}

@Composable
private fun MonthlySummary(snapshot: FinanceSnapshot) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        SummaryMetric("دخل الشهر", snapshot.monthIncome, IncomeColor, Modifier.weight(1f))
        SummaryMetric("صرف الشهر", snapshot.monthExpense, ExpenseColor, Modifier.weight(1f))
        SummaryMetric("صافي الشهر", snapshot.monthNet, if (snapshot.monthNet >= 0) IncomeColor else ExpenseColor, Modifier.weight(1f))
    }
}

@Composable
private fun SummaryMetric(label: String, value: Long, tint: Color, modifier: Modifier = Modifier) {
    Card(modifier = modifier, shape = RoundedCornerShape(18.dp)) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(formatCompactRiyal(value), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black, color = tint)
        }
    }
}

@Composable
private fun QuickAction(title: String, icon: ImageVector, tint: Color, modifier: Modifier = Modifier, onClick: () -> Unit) {
    OutlinedCard(modifier = modifier.clickable(onClick = onClick), shape = RoundedCornerShape(18.dp)) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(vertical = 14.dp, horizontal = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Surface(shape = CircleShape, color = tint.copy(alpha = 0.12f), modifier = Modifier.size(38.dp)) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(21.dp))
                }
            }
            Text(title, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun SectionTitle(title: String, subtitle: String, action: String? = null, onAction: (() -> Unit)? = null) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(modifier = Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        if (action != null && onAction != null) {
            TextButton(onClick = onAction) { Text(action) }
        }
    }
}

@Composable
private fun EmptyPlanCard(onOpenPlan: () -> Unit) {
    OutlinedCard(shape = RoundedCornerShape(20.dp), modifier = Modifier.fillMaxWidth().clickable(onClick = onOpenPlan)) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(shape = CircleShape, color = MaterialTheme.colorScheme.secondaryContainer, modifier = Modifier.size(44.dp)) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(Icons.Rounded.TrackChanges, contentDescription = null, tint = MaterialTheme.colorScheme.secondary)
                }
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text("أنشئ أول خطة شهرية", fontWeight = FontWeight.Bold)
                Text("مثال: الوقود 350 ر.س، وكل تعبئة تخصم تلقائيًا", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Icon(Icons.Rounded.ChevronLeft, contentDescription = null)
        }
    }
}

@Composable
private fun PlanProgressCard(progress: PlanProgress) {
    val ratio = progress.progress.coerceIn(0f, 1f)
    val tint = when {
        progress.progress >= 1f -> ExpenseColor
        progress.progress >= 0.8f -> WarningColor
        else -> PlanColor
    }
    Card(shape = RoundedCornerShape(20.dp), modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                CategoryIcon(progress.category, modifier = Modifier.size(40.dp))
                Spacer(Modifier.width(10.dp))
                Column(Modifier.weight(1f)) {
                    Text(progress.category.name, fontWeight = FontWeight.Bold)
                    Text("${formatRiyal(progress.spent)} من ${formatRiyal(progress.planned)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Text(
                    if (progress.remaining >= 0) "باقي ${formatRiyal(progress.remaining)}" else "تجاوز ${formatRiyal(-progress.remaining)}",
                    style = MaterialTheme.typography.labelMedium,
                    color = tint,
                    fontWeight = FontWeight.Bold,
                )
            }
            LinearProgressIndicator(
                progress = { ratio },
                modifier = Modifier.fillMaxWidth().height(8.dp).clip(CircleShape),
                color = tint,
                trackColor = tint.copy(alpha = 0.12f),
            )
        }
    }
}

@Composable
private fun AccountRow(balance: AccountBalance) {
    Card(shape = RoundedCornerShape(18.dp), modifier = Modifier.fillMaxWidth()) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.surfaceVariant, modifier = Modifier.size(44.dp)) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(accountIcon(balance.account.type), contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                }
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(balance.account.name, fontWeight = FontWeight.Bold)
                Text(accountTypeLabel(balance.account.type), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text(formatRiyal(balance.balance), fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun SpendingBreakdown(snapshot: FinanceSnapshot) {
    val categoryById = snapshot.categories.associateBy { it.id }
    val rows = snapshot.monthSpendingByCategory.entries
        .sortedByDescending { it.value }
        .take(5)
    val total = rows.sumOf { it.value }.coerceAtLeast(1L)

    Card(shape = RoundedCornerShape(22.dp), modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            if (rows.isEmpty()) {
                Text("لا توجد مصروفات هذا الشهر حتى الآن", color = MaterialTheme.colorScheme.onSurfaceVariant)
            } else {
                rows.forEach { (categoryId, amount) ->
                    val category = categoryById[categoryId] ?: return@forEach
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        CategoryIcon(category, modifier = Modifier.size(36.dp))
                        Spacer(Modifier.width(10.dp))
                        Column(Modifier.weight(1f)) {
                            Row(modifier = Modifier.fillMaxWidth()) {
                                Text(category.name, modifier = Modifier.weight(1f), fontWeight = FontWeight.SemiBold)
                                Text(formatRiyal(amount), fontWeight = FontWeight.Bold)
                            }
                            Spacer(Modifier.height(5.dp))
                            LinearProgressIndicator(
                                progress = { amount.toFloat() / total.toFloat() },
                                modifier = Modifier.fillMaxWidth().height(5.dp).clip(CircleShape),
                                color = Color(category.colorArgb),
                                trackColor = Color(category.colorArgb).copy(alpha = 0.1f),
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TransactionsScreen(snapshot: FinanceSnapshot, modifier: Modifier, onDelete: (String) -> Unit) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item { SectionTitle("الحركات", "كل الدخل والمصروف والتحويلات في مكان واحد") }
        if (snapshot.transactions.isEmpty()) {
            item {
                OutlinedCard(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp)) {
                    Text("أضف أول حركة من الزر بالأسفل", modifier = Modifier.padding(20.dp), color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        } else {
            items(snapshot.transactions, key = { it.id }) { transaction ->
                TransactionRow(transaction, snapshot, onDelete)
            }
        }
    }
}

@Composable
private fun TransactionRow(transaction: TransactionEntity, snapshot: FinanceSnapshot, onDelete: (String) -> Unit) {
    val category = snapshot.categories.firstOrNull { it.id == transaction.categoryId }
    val account = snapshot.accounts.firstOrNull { it.id == transaction.accountId }
    val tint = when (transaction.kind) {
        KIND_INCOME -> IncomeColor
        KIND_EXPENSE -> ExpenseColor
        else -> PlanColor
    }
    val sign = when (transaction.kind) {
        KIND_INCOME -> "+"
        KIND_EXPENSE -> "−"
        else -> ""
    }

    Card(shape = RoundedCornerShape(18.dp), modifier = Modifier.fillMaxWidth()) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            if (category != null) {
                CategoryIcon(category, modifier = Modifier.size(42.dp))
            } else {
                Surface(shape = CircleShape, color = PlanColor.copy(alpha = 0.12f), modifier = Modifier.size(42.dp)) {
                    Box(contentAlignment = Alignment.Center) { Icon(Icons.Rounded.SwapHoriz, null, tint = PlanColor) }
                }
            }
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(transaction.title, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    "${account?.name ?: "حساب"} • ${formatDate(LocalDate.ofEpochDay(transaction.dateEpochDay))}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text("$sign${formatRiyal(transaction.amount)}", color = tint, fontWeight = FontWeight.Black)
                IconButton(onClick = { onDelete(transaction.id) }, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Rounded.DeleteOutline, contentDescription = "حذف", tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(18.dp))
                }
            }
        }
    }
}

@Composable
private fun PlanScreen(
    snapshot: FinanceSnapshot,
    modifier: Modifier,
    onSetPlan: (String, Long, () -> Unit) -> Unit,
) {
    val expenseCategories = snapshot.categories.filter { it.kind == KIND_EXPENSE }
    var editingCategory by remember { mutableStateOf<CategoryEntity?>(null) }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            SectionTitle(
                "الخطة الشهرية",
                "حدد فقط ما تريد مراقبته. المصروفات المسجلة تخصم تلقائيًا.",
            )
        }
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                shape = RoundedCornerShape(22.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    val planned = snapshot.planProgress.sumOf { it.planned }
                    val spent = snapshot.planProgress.sumOf { it.spent }
                    Text("إجمالي الخطة", color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f))
                    Text(formatRiyal(planned), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.onSecondaryContainer)
                    Text("صرفت ${formatRiyal(spent)} • باقي ${formatRiyal((planned - spent).coerceAtLeast(0L))}", color = MaterialTheme.colorScheme.onSecondaryContainer)
                }
            }
        }
        items(expenseCategories, key = { it.id }) { category ->
            val plan = snapshot.plans.firstOrNull { it.categoryId == category.id }
            val spent = snapshot.monthSpendingByCategory[category.id] ?: 0L
            OutlinedCard(
                modifier = Modifier.fillMaxWidth().clickable { editingCategory = category },
                shape = RoundedCornerShape(18.dp),
            ) {
                Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                    CategoryIcon(category, modifier = Modifier.size(42.dp))
                    Spacer(Modifier.width(10.dp))
                    Column(Modifier.weight(1f)) {
                        Text(category.name, fontWeight = FontWeight.Bold)
                        if (plan == null) {
                            Text("بدون خطة شهرية", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        } else {
                            Text("صرفت ${formatRiyal(spent)} من ${formatRiyal(plan.amount)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                    Text(if (plan == null) "إضافة" else "تعديل", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    editingCategory?.let { category ->
        val current = snapshot.plans.firstOrNull { it.categoryId == category.id }?.amount ?: 0L
        PlanAmountDialog(
            category = category,
            currentAmount = current,
            onDismiss = { editingCategory = null },
            onSave = { amount ->
                onSetPlan(category.id, amount) { editingCategory = null }
            },
        )
    }
}

@Composable
private fun ReportsScreen(snapshot: FinanceSnapshot, modifier: Modifier) {
    val todayMonth = remember { YearMonth.now() }
    val months = remember(todayMonth) { (5 downTo 0).map { todayMonth.minusMonths(it.toLong()) } }
    val expenseByMonth = months.map { month ->
        snapshot.transactions.asSequence()
            .filter { it.kind == KIND_EXPENSE }
            .filter { YearMonth.from(LocalDate.ofEpochDay(it.dateEpochDay)) == month }
            .sumOf { it.amount }
    }
    val max = expenseByMonth.maxOrNull()?.coerceAtLeast(1L) ?: 1L

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item { SectionTitle("التقارير", "أهم الأرقام فقط بدون ازدحام") }
        item {
            Card(shape = RoundedCornerShape(22.dp), modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text("المصروف خلال 6 أشهر", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                    Row(
                        modifier = Modifier.fillMaxWidth().height(150.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.Bottom,
                    ) {
                        months.zip(expenseByMonth).forEach { (month, amount) ->
                            val ratio = amount.toFloat() / max.toFloat()
                            Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                                Box(
                                    Modifier
                                        .width(22.dp)
                                        .height((10f + 100f * ratio).dp)
                                        .clip(RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp))
                                        .background(MaterialTheme.colorScheme.primary)
                                )
                                Spacer(Modifier.height(6.dp))
                                Text(month.monthValue.toString(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                SummaryMetric("دخل الشهر", snapshot.monthIncome, IncomeColor, Modifier.weight(1f))
                SummaryMetric("صرف الشهر", snapshot.monthExpense, ExpenseColor, Modifier.weight(1f))
            }
        }
        item { SectionTitle("أعلى المصروفات", "التصنيفات الأكثر استهلاكًا هذا الشهر") }
        item { SpendingBreakdown(snapshot) }
    }
}

@Composable
private fun AddAccountDialog(onDismiss: () -> Unit, onSave: (String, String, Long) -> Unit) {
    var name by rememberSaveable { mutableStateOf("") }
    var balanceText by rememberSaveable { mutableStateOf("") }
    var type by rememberSaveable { mutableStateOf("bank") }
    val balance = balanceText.toLongOrNull() ?: 0L

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("إضافة حساب", fontWeight = FontWeight.Black) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("أين توجد هذه الأموال؟", color = MaterialTheme.colorScheme.onSurfaceVariant)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AccountTypeChip("bank", "بنك", type) { type = it }
                    AccountTypeChip("cash", "نقدي", type) { type = it }
                    AccountTypeChip("wallet", "محفظة", type) { type = it }
                }
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it.take(40) },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("اسم الحساب") },
                    placeholder = { Text(if (type == "cash") "مثال: النقدي" else "مثال: الراجحي") },
                    singleLine = true,
                )
                OutlinedTextField(
                    value = balanceText,
                    onValueChange = { balanceText = it.filter(Char::isDigit).take(12) },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("الرصيد الحالي بالريال") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                )
            }
        },
        confirmButton = {
            Button(onClick = { onSave(name, type, balance) }, enabled = name.isNotBlank()) { Text("حفظ") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("إلغاء") } },
    )
}

@Composable
private fun AccountTypeChip(value: String, label: String, selected: String, onSelect: (String) -> Unit) {
    if (value == selected) {
        Button(onClick = { onSelect(value) }, contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)) { Text(label) }
    } else {
        OutlinedButton(onClick = { onSelect(value) }, contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)) { Text(label) }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddTransactionSheet(
    snapshot: FinanceSnapshot,
    onDismiss: () -> Unit,
    onSave: (String, Long, String, String, String?, String?, LocalDate, String) -> Unit,
) {
    var kind by rememberSaveable { mutableStateOf(KIND_EXPENSE) }
    var amountText by rememberSaveable { mutableStateOf("") }
    var title by rememberSaveable { mutableStateOf("") }
    var note by rememberSaveable { mutableStateOf("") }
    var accountId by rememberSaveable { mutableStateOf(snapshot.accounts.firstOrNull()?.id.orEmpty()) }
    var categoryId by rememberSaveable { mutableStateOf<String?>(null) }
    var transferAccountId by rememberSaveable { mutableStateOf<String?>(null) }
    var date by rememberSaveable { mutableStateOf(LocalDate.now()) }
    var selector by remember { mutableStateOf<String?>(null) }
    var showDatePicker by remember { mutableStateOf(false) }

    val categories = snapshot.categories.filter { it.kind == kind }
    LaunchedEffect(kind) {
        if (kind != KIND_TRANSFER && categories.none { it.id == categoryId }) {
            categoryId = categories.firstOrNull()?.id
        }
        if (kind == KIND_TRANSFER) categoryId = null
    }

    val amount = amountText.toLongOrNull() ?: 0L
    val selectedAccount = snapshot.accounts.firstOrNull { it.id == accountId }
    val selectedCategory = snapshot.categories.firstOrNull { it.id == categoryId }
    val selectedTarget = snapshot.accounts.firstOrNull { it.id == transferAccountId }
    val canSave = amount > 0 && accountId.isNotBlank() && when (kind) {
        KIND_TRANSFER -> !transferAccountId.isNullOrBlank() && transferAccountId != accountId
        else -> !categoryId.isNullOrBlank()
    }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(start = 18.dp, end = 18.dp, bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("إضافة حركة", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                KindButton(KIND_EXPENSE, "مصروف", ExpenseColor, kind) { kind = it }
                KindButton(KIND_INCOME, "دخل", IncomeColor, kind) { kind = it }
                KindButton(KIND_TRANSFER, "تحويل", PlanColor, kind) { kind = it }
            }
            OutlinedTextField(
                value = amountText,
                onValueChange = { amountText = it.filter(Char::isDigit).take(12) },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("المبلغ بالريال") },
                textStyle = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Black),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
            )
            SelectorField("الحساب", selectedAccount?.name ?: "اختر الحساب") { selector = "account" }
            if (kind == KIND_TRANSFER) {
                SelectorField("إلى حساب", selectedTarget?.name ?: "اختر الحساب المستلم") { selector = "target" }
            } else {
                SelectorField("التصنيف", selectedCategory?.name ?: "اختر التصنيف") { selector = "category" }
            }
            OutlinedTextField(
                value = title,
                onValueChange = { title = it.take(60) },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("الاسم (اختياري)") },
                placeholder = { Text(selectedCategory?.name ?: if (kind == KIND_TRANSFER) "تحويل بين الحسابات" else "") },
                singleLine = true,
            )
            SelectorField("التاريخ", formatDate(date), Icons.Rounded.CalendarMonth) { showDatePicker = true }
            OutlinedTextField(
                value = note,
                onValueChange = { note = it.take(120) },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("ملاحظة (اختياري)") },
                maxLines = 2,
            )
            Button(
                onClick = {
                    onSave(
                        kind,
                        amount,
                        title.ifBlank { selectedCategory?.name ?: if (kind == KIND_TRANSFER) "تحويل" else "حركة مالية" },
                        accountId,
                        categoryId,
                        transferAccountId,
                        date,
                        note,
                    )
                },
                enabled = canSave,
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(16.dp),
            ) {
                Text("حفظ الحركة", fontWeight = FontWeight.Bold)
            }
        }
    }

    when (selector) {
        "account" -> SelectionDialog(
            title = "اختر الحساب",
            items = snapshot.accounts.map { it.id to it.name },
            selectedId = accountId,
            onDismiss = { selector = null },
            onSelect = { accountId = it; selector = null },
        )
        "target" -> SelectionDialog(
            title = "الحساب المستلم",
            items = snapshot.accounts.filter { it.id != accountId }.map { it.id to it.name },
            selectedId = transferAccountId,
            onDismiss = { selector = null },
            onSelect = { transferAccountId = it; selector = null },
        )
        "category" -> SelectionDialog(
            title = "اختر التصنيف",
            items = categories.map { it.id to it.name },
            selectedId = categoryId,
            onDismiss = { selector = null },
            onSelect = { categoryId = it; selector = null },
        )
    }

    if (showDatePicker) {
        MaliDatePicker(
            initialDate = date,
            onDismiss = { showDatePicker = false },
            onSelect = { date = it; showDatePicker = false },
        )
    }
}

@Composable
private fun KindButton(value: String, label: String, tint: Color, selected: String, onSelect: (String) -> Unit) {
    val selectedNow = value == selected
    Button(
        onClick = { onSelect(value) },
        colors = ButtonDefaults.buttonColors(
            containerColor = if (selectedNow) tint else MaterialTheme.colorScheme.surfaceVariant,
            contentColor = if (selectedNow) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
        ),
        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 9.dp),
    ) { Text(label) }
}

@Composable
private fun SelectorField(label: String, value: String, icon: ImageVector? = null, onClick: () -> Unit) {
    OutlinedCard(modifier = Modifier.fillMaxWidth().clickable(onClick = onClick), shape = RoundedCornerShape(14.dp)) {
        Row(Modifier.padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            if (icon != null) {
                Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.width(10.dp))
            }
            Column(Modifier.weight(1f)) {
                Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(value, fontWeight = FontWeight.SemiBold)
            }
            Icon(Icons.Rounded.ChevronLeft, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun SelectionDialog(
    title: String,
    items: List<Pair<String, String>>,
    selectedId: String?,
    onDismiss: () -> Unit,
    onSelect: (String) -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, fontWeight = FontWeight.Black) },
        text = {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                items(items, key = { it.first }) { (id, label) ->
                    OutlinedCard(
                        modifier = Modifier.fillMaxWidth().clickable { onSelect(id) },
                        colors = if (id == selectedId) CardDefaults.outlinedCardColors(containerColor = MaterialTheme.colorScheme.primaryContainer) else CardDefaults.outlinedCardColors(),
                    ) {
                        Text(label, modifier = Modifier.padding(14.dp), fontWeight = if (id == selectedId) FontWeight.Bold else FontWeight.Medium)
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = { TextButton(onClick = onDismiss) { Text("إغلاق") } },
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MaliDatePicker(initialDate: LocalDate, onDismiss: () -> Unit, onSelect: (LocalDate) -> Unit) {
    val initialMillis = initialDate.atStartOfDay().toInstant(ZoneOffset.UTC).toEpochMilli()
    val state = rememberDatePickerState(initialSelectedDateMillis = initialMillis)
    DatePickerDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = {
                val millis = state.selectedDateMillis ?: initialMillis
                onSelect(Instant.ofEpochMilli(millis).atZone(ZoneOffset.UTC).toLocalDate())
            }) { Text("اختيار") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("إلغاء") } },
    ) {
        DatePicker(state = state)
    }
}

@Composable
private fun PlanAmountDialog(
    category: CategoryEntity,
    currentAmount: Long,
    onDismiss: () -> Unit,
    onSave: (Long) -> Unit,
) {
    var amountText by rememberSaveable(category.id, currentAmount) {
        mutableStateOf(if (currentAmount > 0) currentAmount.toString() else "")
    }
    val amount = amountText.toLongOrNull() ?: 0L
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = { CategoryIcon(category, modifier = Modifier.size(44.dp)) },
        title = { Text(category.name, fontWeight = FontWeight.Black) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("كم تريد أن يكون حدك الشهري لهذا التصنيف؟", color = MaterialTheme.colorScheme.onSurfaceVariant)
                OutlinedTextField(
                    value = amountText,
                    onValueChange = { amountText = it.filter(Char::isDigit).take(12) },
                    label = { Text("الخطة الشهرية بالريال") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                if (currentAmount > 0) {
                    TextButton(onClick = { onSave(0) }) { Text("إلغاء الخطة لهذا التصنيف", color = ExpenseColor) }
                }
            }
        },
        confirmButton = { Button(onClick = { onSave(amount) }, enabled = amount > 0) { Text("حفظ") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("رجوع") } },
    )
}

@Composable
private fun CategoryIcon(category: CategoryEntity, modifier: Modifier = Modifier) {
    val tint = Color(category.colorArgb)
    Surface(shape = RoundedCornerShape(13.dp), color = tint.copy(alpha = 0.12f), modifier = modifier) {
        Box(contentAlignment = Alignment.Center) {
            Icon(categoryIcon(category.iconKey), contentDescription = null, tint = tint, modifier = Modifier.size(22.dp))
        }
    }
}

private fun categoryIcon(key: String): ImageVector = when (key) {
    "salary" -> Icons.Rounded.Payments
    "work" -> Icons.Rounded.Work
    "income" -> Icons.Rounded.AttachMoney
    "grocery" -> Icons.Rounded.ShoppingCart
    "fuel" -> Icons.Rounded.LocalGasStation
    "bills" -> Icons.Rounded.Receipt
    "restaurant" -> Icons.Rounded.Restaurant
    "transport" -> Icons.Rounded.DirectionsCar
    "shopping" -> Icons.Rounded.ShoppingBag
    "health" -> Icons.Rounded.HealthAndSafety
    "family" -> Icons.Rounded.FamilyRestroom
    "entertainment" -> Icons.Rounded.SportsEsports
    else -> Icons.Rounded.Category
}

private fun accountIcon(type: String): ImageVector = when (type) {
    "cash" -> Icons.Rounded.Payments
    "wallet" -> Icons.Rounded.AccountBalanceWallet
    "savings" -> Icons.Rounded.Savings
    "card" -> Icons.Rounded.CreditCard
    else -> Icons.Rounded.AccountBalance
}

private fun accountTypeLabel(type: String): String = when (type) {
    "cash" -> "نقدي"
    "wallet" -> "محفظة"
    "savings" -> "ادخار"
    "card" -> "بطاقة"
    else -> "حساب بنكي"
}

private val arabicNumberFormat: NumberFormat = NumberFormat.getIntegerInstance(Locale("ar", "SA"))
private val arabicDateFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("d MMM", Locale("ar", "SA"))

private fun formatRiyal(value: Long): String = "${arabicNumberFormat.format(value)} ر.س"
private fun formatCompactRiyal(value: Long): String = arabicNumberFormat.format(value)
private fun formatDate(date: LocalDate): String = date.format(arabicDateFormatter)
