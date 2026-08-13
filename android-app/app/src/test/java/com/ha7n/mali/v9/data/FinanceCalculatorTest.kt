package com.ha7n.mali.v9.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate

class FinanceCalculatorTest {
    private val today = LocalDate.of(2026, 8, 13)

    private val cash = AccountEntity("cash", "نقدي", "cash", 1_000L, 1L)
    private val bank = AccountEntity("bank", "البنك", "bank", 2_000L, 2L)
    private val fuel = CategoryEntity("expense-fuel", "وقود", KIND_EXPENSE, "fuel", 0xFFF59E0BL, 10)
    private val salary = CategoryEntity("income-salary", "راتب", KIND_INCOME, "salary", 0xFF1E8E6EL, 10)

    @Test
    fun incomeAndExpenseUpdateBalancesAndMonthlySummary() {
        val transactions = listOf(
            tx("salary", 500L, KIND_INCOME, "bank", "income-salary", today),
            tx("fuel", 70L, KIND_EXPENSE, "bank", "expense-fuel", today),
        )

        val snapshot = FinanceCalculator.snapshot(
            accounts = listOf(cash, bank),
            categories = listOf(fuel, salary),
            transactions = transactions,
            plans = emptyList(),
            today = today,
        )

        assertEquals(3_430L, snapshot.totalBalance)
        assertEquals(500L, snapshot.monthIncome)
        assertEquals(70L, snapshot.monthExpense)
        assertEquals(430L, snapshot.monthNet)
        assertEquals(2_430L, snapshot.accountBalances.first { it.account.id == "bank" }.balance)
    }

    @Test
    fun transferMovesMoneyWithoutChangingTotalBalanceOrMonthlyIncomeExpense() {
        val transfer = TransactionEntity(
            id = "transfer",
            title = "تحويل",
            amount = 300L,
            kind = KIND_TRANSFER,
            accountId = "bank",
            categoryId = null,
            transferAccountId = "cash",
            dateEpochDay = today.toEpochDay(),
            note = "",
            createdAt = 1L,
        )

        val snapshot = FinanceCalculator.snapshot(
            accounts = listOf(cash, bank),
            categories = listOf(fuel, salary),
            transactions = listOf(transfer),
            plans = emptyList(),
            today = today,
        )

        assertEquals(3_000L, snapshot.totalBalance)
        assertEquals(1_300L, snapshot.accountBalances.first { it.account.id == "cash" }.balance)
        assertEquals(1_700L, snapshot.accountBalances.first { it.account.id == "bank" }.balance)
        assertEquals(0L, snapshot.monthIncome)
        assertEquals(0L, snapshot.monthExpense)
    }

    @Test
    fun fuelPlanAutomaticallyUsesActualFuelTransactions() {
        val transactions = listOf(
            tx("fuel-1", 50L, KIND_EXPENSE, "bank", "expense-fuel", LocalDate.of(2026, 8, 2)),
            tx("fuel-2", 60L, KIND_EXPENSE, "bank", "expense-fuel", LocalDate.of(2026, 8, 8)),
            tx("fuel-3", 70L, KIND_EXPENSE, "bank", "expense-fuel", LocalDate.of(2026, 8, 13)),
        )
        val plan = MonthlyPlanEntity("expense-fuel", 350L, true, 1L)

        val snapshot = FinanceCalculator.snapshot(
            accounts = listOf(bank),
            categories = listOf(fuel),
            transactions = transactions,
            plans = listOf(plan),
            today = today,
        )

        val progress = snapshot.planProgress.single()
        assertEquals(180L, progress.spent)
        assertEquals(170L, progress.remaining)
        assertTrue(progress.progress > 0.51f && progress.progress < 0.52f)
    }

    @Test
    fun previousMonthExpensesDoNotConsumeCurrentMonthPlan() {
        val transactions = listOf(
            tx("july-fuel", 200L, KIND_EXPENSE, "bank", "expense-fuel", LocalDate.of(2026, 7, 31)),
            tx("aug-fuel", 50L, KIND_EXPENSE, "bank", "expense-fuel", LocalDate.of(2026, 8, 1)),
        )

        val snapshot = FinanceCalculator.snapshot(
            accounts = listOf(bank),
            categories = listOf(fuel),
            transactions = transactions,
            plans = listOf(MonthlyPlanEntity("expense-fuel", 350L, true, 1L)),
            today = today,
        )

        assertEquals(50L, snapshot.monthExpense)
        assertEquals(50L, snapshot.planProgress.single().spent)
        assertEquals(300L, snapshot.planProgress.single().remaining)
    }

    private fun tx(
        id: String,
        amount: Long,
        kind: String,
        accountId: String,
        categoryId: String,
        date: LocalDate,
    ) = TransactionEntity(
        id = id,
        title = id,
        amount = amount,
        kind = kind,
        accountId = accountId,
        categoryId = categoryId,
        transferAccountId = null,
        dateEpochDay = date.toEpochDay(),
        note = "",
        createdAt = 1L,
    )
}
