package com.ha7n.mali.v9.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.ChevronLeft
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.ha7n.mali.v9.data.CategoryEntity
import com.ha7n.mali.v9.data.FinanceSnapshot
import com.ha7n.mali.v9.data.KIND_EXPENSE
import com.ha7n.mali.v9.data.KIND_INCOME
import com.ha7n.mali.v9.data.KIND_TRANSFER
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

@Composable
internal fun AddAccountDialog(
    onDismiss: () -> Unit,
    onSave: (String, String, Long) -> Unit,
) {
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
            Button(
                onClick = { onSave(name, type, balance) },
                enabled = name.isNotBlank(),
            ) { Text("حفظ") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("إلغاء") } },
    )
}

@Composable
private fun AccountTypeChip(
    value: String,
    label: String,
    selected: String,
    onSelect: (String) -> Unit,
) {
    if (value == selected) {
        Button(
            onClick = { onSelect(value) },
            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
        ) { Text(label) }
    } else {
        OutlinedButton(
            onClick = { onSelect(value) },
            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
        ) { Text(label) }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun AddTransactionSheet(
    snapshot: FinanceSnapshot,
    initialKind: String = KIND_EXPENSE,
    onDismiss: () -> Unit,
    onSave: (String, Long, String, String, String?, String?, LocalDate, String) -> Unit,
) {
    var kind by rememberSaveable { mutableStateOf(initialKind) }
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
    LaunchedEffect(kind, categories) {
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
                placeholder = {
                    Text(selectedCategory?.name ?: if (kind == KIND_TRANSFER) "تحويل بين الحسابات" else "")
                },
                singleLine = true,
            )
            SelectorField("التاريخ", formatDate(date)) { showDatePicker = true }
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
                        title.ifBlank {
                            selectedCategory?.name ?: if (kind == KIND_TRANSFER) "تحويل" else "حركة مالية"
                        },
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
private fun KindButton(
    value: String,
    label: String,
    tint: Color,
    selected: String,
    onSelect: (String) -> Unit,
) {
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
private fun SelectorField(label: String, value: String, onClick: () -> Unit) {
    OutlinedCard(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
    ) {
        Row(
            Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(value, fontWeight = FontWeight.SemiBold)
            }
            androidx.compose.material3.Icon(
                Icons.Rounded.ChevronLeft,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
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
                        colors = if (id == selectedId) {
                            androidx.compose.material3.CardDefaults.outlinedCardColors(
                                containerColor = MaterialTheme.colorScheme.primaryContainer,
                            )
                        } else {
                            androidx.compose.material3.CardDefaults.outlinedCardColors()
                        },
                    ) {
                        Text(
                            label,
                            modifier = Modifier.padding(14.dp),
                            fontWeight = if (id == selectedId) FontWeight.Bold else FontWeight.Medium,
                        )
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
private fun MaliDatePicker(
    initialDate: LocalDate,
    onDismiss: () -> Unit,
    onSelect: (LocalDate) -> Unit,
) {
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
internal fun PlanAmountDialog(
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
                Text(
                    "كم تريد أن يكون حدك الشهري لهذا التصنيف؟",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                OutlinedTextField(
                    value = amountText,
                    onValueChange = { amountText = it.filter(Char::isDigit).take(12) },
                    label = { Text("الخطة الشهرية بالريال") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                if (currentAmount > 0) {
                    TextButton(onClick = { onSave(0) }) {
                        Text("إلغاء الخطة لهذا التصنيف", color = ExpenseColor)
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = { onSave(amount) }, enabled = amount > 0) { Text("حفظ") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("رجوع") } },
    )
}
