package com.ha7n.mali.v9.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ha7n.mali.v9.data.CategoryEntity
import com.ha7n.mali.v9.data.FinanceSnapshot
import com.ha7n.mali.v9.data.KIND_EXPENSE

@Composable
internal fun PlanScreen(
    snapshot: FinanceSnapshot,
    modifier: Modifier,
    onSetPlan: (String, Long, () -> Unit) -> Unit,
) {
    val expenseCategories = snapshot.categories.filter { it.kind == KIND_EXPENSE }
    var editingCategory by remember { mutableStateOf<CategoryEntity?>(null) }

    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            SectionTitle(
                "الخطة الشهرية",
                "اختر فقط ما تريد مراقبته. كل مصروف يحدّث الخطة تلقائيًا.",
            )
        }
        item {
            val planned = snapshot.planProgress.sumOf { it.planned }
            val spent = snapshot.planProgress.sumOf { it.spent }
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                shape = RoundedCornerShape(22.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        "إجمالي الخطة",
                        color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f),
                    )
                    Text(
                        formatRiyal(planned),
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                    )
                    Text(
                        "صرفت ${formatRiyal(spent)} • باقي ${formatRiyal((planned - spent).coerceAtLeast(0L))}",
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                    )
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
                            Text(
                                "بدون خطة شهرية",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        } else {
                            val remaining = plan.amount - spent
                            Text(
                                if (remaining >= 0) {
                                    "صرفت ${formatRiyal(spent)} • باقي ${formatRiyal(remaining)}"
                                } else {
                                    "تجاوزت الخطة بـ ${formatRiyal(-remaining)}"
                                },
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                    Text(
                        if (plan == null) "إضافة" else "تعديل",
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold,
                    )
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
