package com.ha7n.mali.v9.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ha7n.mali.v9.data.FinanceSnapshot
import com.ha7n.mali.v9.data.KIND_EXPENSE
import java.time.LocalDate
import java.time.YearMonth

@Composable
internal fun ReportsScreen(snapshot: FinanceSnapshot, modifier: Modifier) {
    val currentMonth = remember { YearMonth.now() }
    val months = remember(currentMonth) { (5 downTo 0).map { currentMonth.minusMonths(it.toLong()) } }
    val expenseByMonth = months.map { month ->
        snapshot.transactions.asSequence()
            .filter { it.kind == KIND_EXPENSE }
            .filter { YearMonth.from(LocalDate.ofEpochDay(it.dateEpochDay)) == month }
            .sumOf { it.amount }
    }
    val max = expenseByMonth.maxOrNull()?.coerceAtLeast(1L) ?: 1L

    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item { SectionTitle("التقارير", "أرقام واضحة تساعدك تفهم الشهر بسرعة") }
        item {
            Card(shape = RoundedCornerShape(22.dp), modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    Text(
                        "المصروف خلال 6 أشهر",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Black,
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth().height(150.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.Bottom,
                    ) {
                        months.zip(expenseByMonth).forEach { (month, amount) ->
                            val ratio = amount.toFloat() / max.toFloat()
                            Column(
                                modifier = Modifier.weight(1f),
                                horizontalAlignment = Alignment.CenterHorizontally,
                            ) {
                                Box(
                                    Modifier
                                        .width(22.dp)
                                        .height((10f + 100f * ratio).dp)
                                        .clip(RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp))
                                        .background(MaterialTheme.colorScheme.primary),
                                )
                                Spacer(Modifier.height(6.dp))
                                Text(
                                    month.monthValue.toString(),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
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
