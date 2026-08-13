package com.ha7n.mali.v9.data

import java.time.LocalDate

object FinanceCalculator {
    fun snapshot(
        accounts: List<AccountEntity>,
        categories: List<CategoryEntity>,
        transactions: List<TransactionEntity>,
        plans: List<MonthlyPlanEntity>,
        today: LocalDate = LocalDate.now(),
    ): FinanceSnapshot {
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
                    transaction.transferAccountId?.takeIf { it.isNotBlank() }?.let { target ->
                        balances[target] = (balances[target] ?: 0L) + transaction.amount
                    }
                }
            }
        }

        val accountBalances = accounts.map { account ->
            AccountBalance(account = account, balance = balances[account.id] ?: account.openingBalance)
        }

        val monthIncome = monthTransactions.asSequence()
            .filter { it.kind == KIND_INCOME }
            .sumOf { it.amount }
        val monthExpense = monthTransactions.asSequence()
            .filter { it.kind == KIND_EXPENSE }
            .sumOf { it.amount }
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
}
