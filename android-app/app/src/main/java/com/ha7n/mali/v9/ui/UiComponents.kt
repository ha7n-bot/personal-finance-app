package com.ha7n.mali.v9.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AccountBalance
import androidx.compose.material.icons.rounded.AccountBalanceWallet
import androidx.compose.material.icons.rounded.AttachMoney
import androidx.compose.material.icons.rounded.Category
import androidx.compose.material.icons.rounded.CreditCard
import androidx.compose.material.icons.rounded.DirectionsCar
import androidx.compose.material.icons.rounded.FamilyRestroom
import androidx.compose.material.icons.rounded.HealthAndSafety
import androidx.compose.material.icons.rounded.LocalGasStation
import androidx.compose.material.icons.rounded.Payments
import androidx.compose.material.icons.rounded.Receipt
import androidx.compose.material.icons.rounded.Restaurant
import androidx.compose.material.icons.rounded.Savings
import androidx.compose.material.icons.rounded.ShoppingBag
import androidx.compose.material.icons.rounded.ShoppingCart
import androidx.compose.material.icons.rounded.SportsEsports
import androidx.compose.material.icons.rounded.Work
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ha7n.mali.v9.data.AccountBalance
import com.ha7n.mali.v9.data.CategoryEntity
import com.ha7n.mali.v9.data.FinanceSnapshot
import java.text.NumberFormat
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

internal val IncomeColor = Color(0xFF16805F)
internal val ExpenseColor = Color(0xFFD55353)
internal val PlanColor = Color(0xFF496DDB)
internal val WarningColor = Color(0xFFE39A24)

private val arabicNumberFormat = NumberFormat.getIntegerInstance(Locale("ar", "SA"))
private val arabicDateFormatter = DateTimeFormatter.ofPattern("d MMM", Locale("ar", "SA"))

internal fun formatRiyal(value: Long): String = "${arabicNumberFormat.format(value)} ر.س"
internal fun formatNumber(value: Long): String = arabicNumberFormat.format(value)
internal fun formatDate(date: LocalDate): String = date.format(arabicDateFormatter)

@Composable
internal fun SectionTitle(
    title: String,
    subtitle: String,
    action: String? = null,
    onAction: (() -> Unit)? = null,
) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(modifier = Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
            Text(
                subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        if (action != null && onAction != null) {
            TextButton(onClick = onAction) { Text(action) }
        }
    }
}

@Composable
internal fun SummaryMetric(
    label: String,
    value: Long,
    tint: Color,
    modifier: Modifier = Modifier,
) {
    Card(modifier = modifier, shape = RoundedCornerShape(18.dp)) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Text(
                label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                formatNumber(value),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Black,
                color = tint,
            )
        }
    }
}

@Composable
internal fun CategoryIcon(category: CategoryEntity, modifier: Modifier = Modifier) {
    val tint = Color(category.colorArgb)
    Surface(
        shape = RoundedCornerShape(13.dp),
        color = tint.copy(alpha = 0.12f),
        modifier = modifier,
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                categoryIcon(category.iconKey),
                contentDescription = null,
                tint = tint,
                modifier = Modifier.size(22.dp),
            )
        }
    }
}

internal fun categoryIcon(key: String): ImageVector = when (key) {
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

internal fun accountIcon(type: String): ImageVector = when (type) {
    "cash" -> Icons.Rounded.Payments
    "wallet" -> Icons.Rounded.AccountBalanceWallet
    "savings" -> Icons.Rounded.Savings
    "card" -> Icons.Rounded.CreditCard
    else -> Icons.Rounded.AccountBalance
}

internal fun accountTypeLabel(type: String): String = when (type) {
    "cash" -> "نقدي"
    "wallet" -> "محفظة"
    "savings" -> "ادخار"
    "card" -> "بطاقة"
    else -> "حساب بنكي"
}

@Composable
internal fun AccountBalanceRow(balance: AccountBalance) {
    Card(shape = RoundedCornerShape(18.dp), modifier = Modifier.fillMaxWidth()) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = MaterialTheme.colorScheme.surfaceVariant,
                modifier = Modifier.size(44.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        accountIcon(balance.account.type),
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                    )
                }
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(balance.account.name, fontWeight = FontWeight.Bold)
                Text(
                    accountTypeLabel(balance.account.type),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Text(formatRiyal(balance.balance), fontWeight = FontWeight.Black)
        }
    }
}

@Composable
internal fun SpendingBreakdown(snapshot: FinanceSnapshot) {
    val categoryById = snapshot.categories.associateBy { it.id }
    val rows = snapshot.monthSpendingByCategory.entries
        .sortedByDescending { it.value }
        .take(5)
    val total = rows.sumOf { it.value }.coerceAtLeast(1L)

    Card(shape = RoundedCornerShape(22.dp), modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            if (rows.isEmpty()) {
                Text(
                    "لا توجد مصروفات هذا الشهر حتى الآن",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            } else {
                rows.forEach { (categoryId, amount) ->
                    val category = categoryById[categoryId] ?: return@forEach
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        CategoryIcon(category, modifier = Modifier.size(36.dp))
                        Spacer(Modifier.width(10.dp))
                        Column(Modifier.weight(1f)) {
                            Row(modifier = Modifier.fillMaxWidth()) {
                                Text(
                                    category.name,
                                    modifier = Modifier.weight(1f),
                                    fontWeight = FontWeight.SemiBold,
                                )
                                Text(formatRiyal(amount), fontWeight = FontWeight.Bold)
                            }
                            Spacer(Modifier.height(5.dp))
                            LinearProgressIndicator(
                                progress = { amount.toFloat() / total.toFloat() },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(5.dp)
                                    .clip(CircleShape),
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
