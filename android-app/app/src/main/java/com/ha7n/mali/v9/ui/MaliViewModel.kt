package com.ha7n.mali.v9.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.ha7n.mali.v9.data.FinanceSnapshot
import com.ha7n.mali.v9.data.MaliRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate

data class MaliUiState(
    val snapshot: FinanceSnapshot = emptySnapshot(),
    val busy: Boolean = false,
    val message: String? = null,
)

private fun emptySnapshot() = FinanceSnapshot(
    accounts = emptyList(),
    accountBalances = emptyList(),
    categories = emptyList(),
    transactions = emptyList(),
    plans = emptyList(),
    totalBalance = 0L,
    monthIncome = 0L,
    monthExpense = 0L,
    monthNet = 0L,
    planProgress = emptyList(),
    monthSpendingByCategory = emptyMap(),
)

class MaliViewModel(private val repository: MaliRepository) : ViewModel() {
    private val busy = MutableStateFlow(false)
    private val message = MutableStateFlow<String?>(null)

    val uiState: StateFlow<MaliUiState> = combine(
        repository.observeSnapshot(),
        busy,
        message,
    ) { snapshot, isBusy, currentMessage ->
        MaliUiState(snapshot = snapshot, busy = isBusy, message = currentMessage)
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = MaliUiState(),
    )

    init {
        viewModelScope.launch {
            busy.value = true
            runCatching { repository.initialize() }
                .onSuccess { migration ->
                    if (migration.migrated) {
                        message.value = "تم نقل ${migration.accounts} حساب و${migration.transactions} حركة من النسخة السابقة"
                    }
                }
                .onFailure {
                    message.value = "تعذر نقل بيانات النسخة السابقة تلقائيًا. بياناتك القديمة لم تُحذف ويمكن استيراد نسخة JSON يدويًا."
                }
            busy.value = false
        }
    }

    fun clearMessage() {
        message.value = null
    }

    fun addAccount(name: String, type: String, openingBalance: Long, onDone: () -> Unit = {}) {
        launchAction("تمت إضافة الحساب", onDone) {
            repository.addAccount(name, type, openingBalance)
        }
    }

    fun addTransaction(
        kind: String,
        amount: Long,
        title: String,
        accountId: String,
        categoryId: String?,
        transferAccountId: String?,
        date: LocalDate,
        note: String,
        onDone: () -> Unit = {},
    ) {
        launchAction("تم حفظ الحركة", onDone) {
            repository.saveTransaction(
                kind = kind,
                amount = amount,
                title = title,
                accountId = accountId,
                categoryId = categoryId,
                transferAccountId = transferAccountId,
                dateEpochDay = date.toEpochDay(),
                note = note,
            )
        }
    }

    fun deleteTransaction(id: String) {
        launchAction("تم حذف الحركة") {
            repository.deleteTransaction(id)
        }
    }

    fun setPlan(categoryId: String, amount: Long, onDone: () -> Unit = {}) {
        launchAction(if (amount > 0) "تم تحديث الخطة" else "تم إلغاء الخطة", onDone) {
            repository.setMonthlyPlan(categoryId, amount)
        }
    }

    fun createBackup(onReady: (String) -> Unit) {
        viewModelScope.launch {
            busy.value = true
            runCatching { repository.exportBackup() }
                .onSuccess(onReady)
                .onFailure { message.value = it.message ?: "تعذر تجهيز النسخة الاحتياطية" }
            busy.value = false
        }
    }

    fun restoreBackup(raw: String, onDone: () -> Unit = {}) {
        launchAction("تم استيراد النسخة الاحتياطية", onDone) {
            repository.importBackup(raw)
        }
    }

    fun reportMessage(value: String) {
        message.value = value
    }

    private fun launchAction(
        successMessage: String,
        onDone: () -> Unit = {},
        block: suspend () -> Unit,
    ) {
        viewModelScope.launch {
            busy.value = true
            runCatching { block() }
                .onSuccess {
                    message.value = successMessage
                    onDone()
                }
                .onFailure {
                    message.value = it.message ?: "تعذر تنفيذ العملية"
                }
            busy.value = false
        }
    }
}

class MaliViewModelFactory(private val repository: MaliRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(MaliViewModel::class.java)) {
            return MaliViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
    }
}
