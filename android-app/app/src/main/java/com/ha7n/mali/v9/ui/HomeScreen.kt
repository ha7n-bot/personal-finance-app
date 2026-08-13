package com.ha7n.mali.v9.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AccountBalanceWallet
import androidx.compose.material.icons.rounded.ArrowDownward
import androidx.compose.material.icons.rounded.ArrowUpward
import androidx.compose.material.icons.rounded.ChevronLeft
import androidx.compose.material.icons.rounded.TrackChanges
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ha7n.mali.v9.data.FinanceSnapshot
import com.ha7n.mali.v9.data.PlanProgress

@Composable
internal fun HomeScreen(
    snapshot: FinanceSnapshot,
    modifier: Modifier,
    onAddAccount: () -> Unit,
    onAddExpense: () -> Unit,
    onAddIncome: () -> Unit,
    onOpenPlan: () -> Unit,
) {
    LazyColumn(
        modifier = modifier,
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
                    onClick = onAddExpense,
                )
                QuickAction(
                    title = "دخل",
                    icon = Icons.Rounded.ArrowUpward,
                    tint = IncomeColor,
                    modifier = Modifier.weight(1f),
                    onClick = onAddIncome,
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
                subtitle = if (snapshot.planProgress.isEmpty()) {
                    "ضع حدًا فقط لما تريد متابعته"
                } else {
                    "كل مصروف يخصم تلقائيًا من خطته"
                },
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

        item { SectionTitle("أين أموالي", "كل حساب ورصيده الحالي") }
        items(snapshot.accountBalances, key = { it.account.id }) { balance ->
            AccountBalanceRow(balance)
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
            Text(
                "إجمالي ما تملكه الآن",
                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.78f),
            )
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
        SummaryMetric(
            "صافي الشهر",
            snapshot.monthNet,
            if (snapshot.monthNet >= 0) IncomeColor else ExpenseColor,
            Modifier.weight(1f),
        )
    }
}

@Composable
private fun QuickAction(
    title: String,
    icon: ImageVector,
    tint: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    OutlinedCard(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
    ) {
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
private fun EmptyPlanCard(onOpenPlan: () -> Unit) {
    OutlinedCard(
        shape = RoundedCornerShape(20.dp),
        modifier = Modifier.fillMaxWidth().clickable(onClick = onOpenPlan),
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(
                shape = CircleShape,
                color = MaterialTheme.colorScheme.secondaryContainer,
                modifier = Modifier.size(44.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        Icons.Rounded.TrackChanges,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.secondary,
                    )
                }
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text("أنشئ أول خطة شهرية", fontWeight = FontWeight.Bold)
                Text(
                    "مثال: الوقود 350 ر.س، وكل تعبئة تخصم تلقائيًا",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
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
                    Text(
                        "${formatRiyal(progress.spent)} من ${formatRiyal(progress.planned)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Text(
                    if (progress.remaining >= 0) {
                        "باقي ${formatRiyal(progress.remaining)}"
                    } else {
                        "تجاوز ${formatRiyal(-progress.remaining)}"
                    },
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
