package com.ha7n.mali.v9.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.SwapHoriz
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.ha7n.mali.v9.data.FinanceSnapshot
import com.ha7n.mali.v9.data.KIND_EXPENSE
import com.ha7n.mali.v9.data.KIND_INCOME
import com.ha7n.mali.v9.data.TransactionEntity
import java.time.LocalDate

@Composable
internal fun TransactionsScreen(
    snapshot: FinanceSnapshot,
    modifier: Modifier,
    onDelete: (String) -> Unit,
) {
    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item { SectionTitle("الحركات", "الدخل والمصروف والتحويلات في سجل واحد") }
        if (snapshot.transactions.isEmpty()) {
            item {
                OutlinedCard(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp)) {
                    Text(
                        "أضف أول حركة من الزر بالأسفل",
                        modifier = Modifier.padding(20.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
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
private fun TransactionRow(
    transaction: TransactionEntity,
    snapshot: FinanceSnapshot,
    onDelete: (String) -> Unit,
) {
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
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Rounded.SwapHoriz, contentDescription = null, tint = PlanColor)
                    }
                }
            }
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    transaction.title,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    "${account?.name ?: "حساب"} • ${formatDate(LocalDate.ofEpochDay(transaction.dateEpochDay))}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text("$sign${formatRiyal(transaction.amount)}", color = tint, fontWeight = FontWeight.Black)
                IconButton(onClick = { onDelete(transaction.id) }, modifier = Modifier.size(32.dp)) {
                    Icon(
                        Icons.Rounded.DeleteOutline,
                        contentDescription = "حذف",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(18.dp),
                    )
                }
            }
        }
    }
}
