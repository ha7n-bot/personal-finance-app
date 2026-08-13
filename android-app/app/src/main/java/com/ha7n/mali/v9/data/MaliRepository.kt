package com.ha7n.mali.v9.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import java.time.LocalDate
import java.util.UUID

const val KIND_INCOME = "income"
const val KIND_EXPENSE = "expense"
const val KIND_TRANSFER = "transfer"

data class AccountBalance(
    val account: AccountEntity,
    val balance: Long,
)

data class PlanProgress(
    val category: CategoryEntity,
    val planned: Long,
    val spent: Long,
) {
    val remaining: Long get() = planned - spent
    val progress: Float get() = if (planned <= 0L) 0f else (spent.toFloat() / planned.toFloat()).coerceAtLeast(0f)
}

data class FinanceSnapshot(
    val accounts: List<AccountEntity>,
    val accountBalances: List<AccountBalance>,
    val categories: List<CategoryEntity>,
    val transactions: List<TransactionEntity>,
    val plans: List<MonthlyPlanEntity>,
    val totalBalance: Long,
    val monthIncome: Long,
    val monthExpense: Long,
    val monthNet: Long,
    val planProgress: List<PlanProgress>,
    val monthSpendingByCategory: Map<String, Long>,
)

class MaliRepository(private val dao: MaliDao) {
    val accounts: Flow<List<AccountEntity>> = dao.observeAccounts()
    val categories: Flow<List<CategoryEntity>> = dao.observeCategories()
    val transactions: Flow<List<TransactionEntity>> = dao.observeTransactions()
    val plans: Flow<List<MonthlyPlanEntity>> = dao.observePlans()

    fun observeSnapshot(): Flow<FinanceSnapshot> = combine(
        accounts,
        categories,
        transactions,
        plans,
    ) { accounts, categories, transactions, plans ->
        buildSnapshot(accounts, categories, transactions, plans)
    }

    suspend fun ensureDefaultCategories() {
        if (dao.categoryCount() == 0) {
            dao.insertCategories(defaultCategories)
        }
    }

    suspend fun addAccount(name: String, type: String, openingBalance: Long) {
        require(name.isNotBlank())
        require(openingBalance >= 0L)
        dao.upsertAccount(
            AccountEntity(
                id = UUID.randomUUID().toString(),
                name = name.trim(),
                type = type,
                openingBalance = openingBalance,
                createdAt = System.currentTimeMillis(),
            )
        )
    }

    suspend fun saveTransaction(
        kind: String,
        amount: Long,
        title: String,
        accountId: String,
        categoryId: String?,
        transferAccountId: String?,
        dateEpochDay: Long,
        note: String,
    ) {
        require(kind in setOf(KIND_INCOME, KIND_EXPENSE, KIND_TRANSFER))
        require(amount > 0L)
        require(accountId.isNotBlank())
        if (kind == KIND_TRANSFER) {
            require(!transferAccountId.isNullOrBlank())
            require(transferAccountId != accountId)
        } else {
            require(!categoryId.isNullOrBlank())
        }

        dao.upsertTransaction(
            TransactionEntity(
                id = UUID.randomUUID().toString(),
                title = title.trim().ifBlank { "حركة مالية" },
                amount = amount,
                kind = kind,
                accountId = accountId,
                categoryId = if (kind == KIND_TRANSFER) null else categoryId,
                transferAccountId = if (kind == KIND_TRANSFER) transferAccountId else null,
                dateEpochDay = dateEpochDay,
                note = note.trim(),
                createdAt = System.currentTimeMillis(),
            )
        )
    }

    suspend fun deleteTransaction(id: String) = dao.deleteTransaction(id)

    suspend fun setMonthlyPlan(categoryId: String, amount: Long) {
        if (amount <= 0L) {
            dao.deletePlan(categoryId)
            return
        }
        dao.upsertPlan(
            MonthlyPlanEntity(
                categoryId = categoryId,
                amount = amount,
                isActive = true,
                updatedAt = System.currentTimeMillis(),
            )
        )
    }

    private fun buildSnapshot(
        accounts: List<AccountEntity>,
        categories: List<CategoryEntity>,
        transactions: List<TransactionEntity>,
        plans: List<MonthlyPlanEntity>,
    ): FinanceSnapshot {
        val today = LocalDate.now()
        val monthStart = today.withDayOfMonth(1).toEpochDay()
        val nextMonthStart = today.plusMonths(1).withDayOfMonth(1).toEpochDay()
        val monthTransactions = transactions.filter { it.dateEpochDay in monthStart until nextMonthStart }

        val balances = accounts.associate { it.id to it.openingBalance }.toMutableMap()
        transactions.forEach { transaction ->
            when (transaction.kind) {
                KIND_INCOME -> balances[transaction.accountId] = (balances[transaction.accountId] ?: 0L) + transaction.amount
                KIND_EXPENSE -> balances[transaction.accountId] = (balances[transaction.accountId] ?: 0L) - transaction.amount
                KIND_TRANSFER -> {
                    balances[transaction.accountId] = (balances[transaction.accountId] ?: 0L) - transaction.amount
                    val target = transaction.transferAccountId
                    if (!target.isNullOrBlank()) {
                        balances[target] = (balances[target] ?: 0L) + transaction.amount
                    }
                }
            }
        }

        val accountBalances = accounts.map { account ->
            AccountBalance(account = account, balance = balances[account.id] ?: account.openingBalance)
        }

        val monthIncome = monthTransactions.filter { it.kind == KIND_INCOME }.sumOf { it.amount }
        val monthExpense = monthTransactions.filter { it.kind == KIND_EXPENSE }.sumOf { it.amount }
        val spendingByCategory = monthTransactions
            .asSequence()
            .filter { it.kind == KIND_EXPENSE && !it.categoryId.isNullOrBlank() }
            .groupBy { it.categoryId!! }
            .mapValues { (_, items) -> items.sumOf { it.amount } }

        val categoryById = categories.associateBy { it.id }
        val planProgress = plans.mapNotNull { plan ->
            val category = categoryById[plan.categoryId] ?: return@mapNotNull null
            PlanProgress(
                category = category,
                planned = plan.amount,
                spent = spendingByCategory[plan.categoryId] ?: 0L,
            )
        }.sortedWith(compareByDescending<PlanProgress> { it.progress }.thenBy { it.category.sortOrder })

        return FinanceSnapshot(
            accounts = accounts,
            accountBalances = accountBalances,
            categories = categories,
            transactions = transactions,
            plans = plans,
            totalBalance = accountBalances.sumOf { it.balance },
            monthIncome = monthIncome,
            monthExpense = monthExpense,
            monthNet = monthIncome - monthExpense,
            planProgress = planProgress,
            monthSpendingByCategory = spendingByCategory,
        )
    }

    companion object {
        private val defaultCategories = listOf(
            CategoryEntity("income-salary", "راتب", KIND_INCOME, "salary", 0xFF1E8E6EL, 10),
            CategoryEntity("income-work", "عمل إضافي", KIND_INCOME, "work", 0xFF3B82F6L, 20),
            CategoryEntity("income-other", "دخل آخر", KIND_INCOME, "income", 0xFF64748BL, 30),

            CategoryEntity("expense-grocery", "مقاضي", KIND_EXPENSE, "grocery", 0xFF0F766EL, 10),
            CategoryEntity("expense-fuel", "وقود", KIND_EXPENSE, "fuel", 0xFFF59E0BL, 20),
            CategoryEntity("expense-bills", "فواتير", KIND_EXPENSE, "bills", 0xFF3B82F6L, 30),
            CategoryEntity("expense-restaurants", "مطاعم وقهوة", KIND_EXPENSE, "restaurant", 0xFFEF4444L, 40),
            CategoryEntity("expense-transport", "مواصلات", KIND_EXPENSE, "transport", 0xFF8B5CF6L, 50),
            CategoryEntity("expense-shopping", "تسوق", KIND_EXPENSE, "shopping", 0xFFEC4899L, 60),
            CategoryEntity("expense-health", "صحة", KIND_EXPENSE, "health", 0xFF14B8A6L, 70),
            CategoryEntity("expense-family", "أسرة", KIND_EXPENSE, "family", 0xFF6366F1L, 80),
            CategoryEntity("expense-entertainment", "ترفيه", KIND_EXPENSE, "entertainment", 0xFF9333EAL, 90),
            CategoryEntity("expense-other", "مصروف آخر", KIND_EXPENSE, "other", 0xFF64748BL, 100),
        )
    }
}
