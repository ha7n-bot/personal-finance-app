package com.ha7n.mali.v9.data

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.time.LocalDate
import java.time.YearMonth
import java.util.UUID
import kotlin.math.roundToLong

private const val BACKUP_SCHEMA = "mali-native"
private const val BACKUP_VERSION = 9
private const val LEGACY_PREFS = "mali_finance_local"
private const val LEGACY_DATA_KEY = "finance_state_v1"
private const val MIGRATION_PREFS = "mali_v9_migration"
private const val MIGRATION_DONE_KEY = "legacy_migration_completed"
private const val MAX_JSON_CHARS = 4_000_000

data class LegacyMigrationResult(
    val migrated: Boolean,
    val accounts: Int = 0,
    val transactions: Int = 0,
    val plans: Int = 0,
)

object MaliBackupCodec {
    suspend fun exportJson(dao: MaliDao): String {
        val root = JSONObject()
            .put("schema", BACKUP_SCHEMA)
            .put("version", BACKUP_VERSION)
            .put("exportedAt", System.currentTimeMillis())
            .put("accounts", JSONArray().apply {
                dao.getAccounts().forEach { account ->
                    put(JSONObject()
                        .put("id", account.id)
                        .put("name", account.name)
                        .put("type", account.type)
                        .put("openingBalance", account.openingBalance)
                        .put("createdAt", account.createdAt))
                }
            })
            .put("categories", JSONArray().apply {
                dao.getCategories().forEach { category ->
                    put(JSONObject()
                        .put("id", category.id)
                        .put("name", category.name)
                        .put("kind", category.kind)
                        .put("iconKey", category.iconKey)
                        .put("colorArgb", category.colorArgb)
                        .put("sortOrder", category.sortOrder)
                        .put("isDefault", category.isDefault))
                }
            })
            .put("transactions", JSONArray().apply {
                dao.getTransactions().forEach { transaction ->
                    put(JSONObject()
                        .put("id", transaction.id)
                        .put("title", transaction.title)
                        .put("amount", transaction.amount)
                        .put("kind", transaction.kind)
                        .put("accountId", transaction.accountId)
                        .putNullable("categoryId", transaction.categoryId)
                        .putNullable("transferAccountId", transaction.transferAccountId)
                        .put("dateEpochDay", transaction.dateEpochDay)
                        .put("note", transaction.note)
                        .put("createdAt", transaction.createdAt))
                }
            })
            .put("plans", JSONArray().apply {
                dao.getPlans().forEach { plan ->
                    put(JSONObject()
                        .put("categoryId", plan.categoryId)
                        .put("amount", plan.amount)
                        .put("isActive", plan.isActive)
                        .put("updatedAt", plan.updatedAt))
                }
            })

        return root.toString()
    }

    suspend fun importJson(dao: MaliDao, raw: String) {
        require(raw.isNotBlank() && raw.length <= MAX_JSON_CHARS) { "ملف النسخة الاحتياطية غير صالح" }
        val root = JSONObject(raw)
        require(root.optString("schema") == BACKUP_SCHEMA && root.optInt("version") == BACKUP_VERSION) {
            "هذه النسخة ليست من مالي v9"
        }

        val accounts = root.optJSONArray("accounts").toAccountEntities()
        val categories = root.optJSONArray("categories").toCategoryEntities()
        val transactions = root.optJSONArray("transactions").toTransactionEntities()
        val plans = root.optJSONArray("plans").toPlanEntities()

        require(categories.isNotEmpty()) { "ملف النسخة لا يحتوي على تصنيفات صالحة" }
        validateReferences(accounts, categories, transactions, plans)
        dao.replaceAll(accounts, categories, transactions, plans)
    }

    private fun validateReferences(
        accounts: List<AccountEntity>,
        categories: List<CategoryEntity>,
        transactions: List<TransactionEntity>,
        plans: List<MonthlyPlanEntity>,
    ) {
        val accountIds = accounts.mapTo(hashSetOf()) { it.id }
        val categoryIds = categories.mapTo(hashSetOf()) { it.id }

        transactions.forEach { transaction ->
            require(transaction.amount > 0L) { "يوجد مبلغ غير صالح في النسخة" }
            require(transaction.accountId in accountIds) { "يوجد حساب مفقود في النسخة" }
            when (transaction.kind) {
                KIND_TRANSFER -> require(transaction.transferAccountId in accountIds && transaction.transferAccountId != transaction.accountId) {
                    "يوجد تحويل غير صالح في النسخة"
                }
                KIND_INCOME, KIND_EXPENSE -> require(transaction.categoryId in categoryIds) {
                    "يوجد تصنيف مفقود في النسخة"
                }
                else -> error("نوع حركة غير معروف في النسخة")
            }
        }
        plans.forEach { plan ->
            require(plan.amount > 0L && plan.categoryId in categoryIds) { "يوجد بند خطة غير صالح في النسخة" }
        }
    }

    private fun JSONArray?.toAccountEntities(): List<AccountEntity> = objects().mapNotNull { item ->
        val id = item.optString("id").trim()
        val name = item.optString("name").trim()
        if (id.isBlank() || name.isBlank()) return@mapNotNull null
        AccountEntity(
            id = id,
            name = name.take(60),
            type = item.optString("type", "bank").ifBlank { "bank" }.take(24),
            openingBalance = item.optLong("openingBalance").coerceAtLeast(0L),
            createdAt = item.optLong("createdAt", System.currentTimeMillis()),
        )
    }.distinctBy { it.id }

    private fun JSONArray?.toCategoryEntities(): List<CategoryEntity> = objects().mapNotNull { item ->
        val id = item.optString("id").trim()
        val name = item.optString("name").trim()
        val kind = item.optString("kind").trim()
        if (id.isBlank() || name.isBlank() || kind !in setOf(KIND_INCOME, KIND_EXPENSE)) return@mapNotNull null
        CategoryEntity(
            id = id,
            name = name.take(50),
            kind = kind,
            iconKey = item.optString("iconKey", "other").ifBlank { "other" }.take(30),
            colorArgb = item.optLong("colorArgb", 0xFF64748BL),
            sortOrder = item.optInt("sortOrder", 999).coerceIn(0, 10_000),
            isDefault = item.optBoolean("isDefault", false),
        )
    }.distinctBy { it.id }

    private fun JSONArray?.toTransactionEntities(): List<TransactionEntity> = objects().mapNotNull { item ->
        val id = item.optString("id").trim()
        val amount = item.optLong("amount")
        val kind = item.optString("kind").trim()
        val accountId = item.optString("accountId").trim()
        if (id.isBlank() || amount <= 0L || kind !in setOf(KIND_INCOME, KIND_EXPENSE, KIND_TRANSFER) || accountId.isBlank()) return@mapNotNull null
        TransactionEntity(
            id = id,
            title = item.optString("title", "حركة مالية").trim().ifBlank { "حركة مالية" }.take(80),
            amount = amount,
            kind = kind,
            accountId = accountId,
            categoryId = item.optNullableString("categoryId"),
            transferAccountId = item.optNullableString("transferAccountId"),
            dateEpochDay = item.optLong("dateEpochDay", LocalDate.now().toEpochDay()),
            note = item.optString("note").trim().take(200),
            createdAt = item.optLong("createdAt", System.currentTimeMillis()),
        )
    }.distinctBy { it.id }

    private fun JSONArray?.toPlanEntities(): List<MonthlyPlanEntity> = objects().mapNotNull { item ->
        val categoryId = item.optString("categoryId").trim()
        val amount = item.optLong("amount")
        if (categoryId.isBlank() || amount <= 0L) return@mapNotNull null
        MonthlyPlanEntity(
            categoryId = categoryId,
            amount = amount,
            isActive = item.optBoolean("isActive", true),
            updatedAt = item.optLong("updatedAt", System.currentTimeMillis()),
        )
    }.distinctBy { it.categoryId }

    private fun JSONArray?.objects(): Sequence<JSONObject> = sequence {
        if (this@objects == null) return@sequence
        for (index in 0 until length()) {
            optJSONObject(index)?.let { yield(it) }
        }
    }
}

class LegacyV8Migrator(
    private val context: Context,
    private val dao: MaliDao,
) {
    suspend fun migrateIfNeeded(): LegacyMigrationResult {
        val migrationPrefs = context.getSharedPreferences(MIGRATION_PREFS, Context.MODE_PRIVATE)
        if (migrationPrefs.getBoolean(MIGRATION_DONE_KEY, false)) return LegacyMigrationResult(false)

        // Never merge legacy data into an already-used native database. The manual JSON import remains available.
        if (dao.accountCount() > 0 || dao.transactionCount() > 0) {
            migrationPrefs.edit().putBoolean(MIGRATION_DONE_KEY, true).apply()
            return LegacyMigrationResult(false)
        }

        val raw = context.getSharedPreferences(LEGACY_PREFS, Context.MODE_PRIVATE)
            .getString(LEGACY_DATA_KEY, null)
            ?.takeIf { it.isNotBlank() }
            ?: return LegacyMigrationResult(false)

        require(raw.length <= MAX_JSON_CHARS) { "بيانات الإصدار السابق أكبر من الحد الآمن للترحيل" }
        archiveLegacyState(raw)

        val root = JSONObject(raw)
        val oldAccounts = root.optJSONArray("accounts")
        val oldTransactions = root.optJSONArray("transactions")
        val oldCategories = root.optJSONArray("categories")
        val oldBudgets = root.optJSONArray("budgets")

        val accounts = mutableListOf<AccountEntity>()
        if (oldAccounts != null) {
            for (index in 0 until oldAccounts.length()) {
                val item = oldAccounts.optJSONObject(index) ?: continue
                val id = item.optString("id").trim()
                val name = item.optString("name").trim()
                if (id.isBlank() || name.isBlank()) continue
                accounts += AccountEntity(
                    id = id,
                    name = name.take(60),
                    type = legacyAccountType(item.optString("kind")),
                    openingBalance = item.optDouble("openingBalance", 0.0).roundToLong().coerceAtLeast(0L),
                    createdAt = System.currentTimeMillis() + index,
                )
            }
        }
        val distinctAccounts = accounts.distinctBy { it.id }
        val accountIds = distinctAccounts.mapTo(hashSetOf()) { it.id }

        val existingCategories = dao.getCategories().associateBy { it.id }.toMutableMap()
        val extraCategories = mutableListOf<CategoryEntity>()
        if (oldCategories != null) {
            for (index in 0 until oldCategories.length()) {
                val item = oldCategories.optJSONObject(index) ?: continue
                val id = item.optString("id").trim()
                val name = item.optString("name").trim()
                val kind = item.optString("kind").trim()
                if (id.isBlank() || name.isBlank() || kind !in setOf(KIND_INCOME, KIND_EXPENSE) || id in existingCategories) continue
                val category = CategoryEntity(
                    id = id,
                    name = name.take(50),
                    kind = kind,
                    iconKey = legacyIconKey(id),
                    colorArgb = if (kind == KIND_INCOME) 0xFF1E8E6EL else 0xFF64748BL,
                    sortOrder = 500 + index,
                    isDefault = false,
                )
                extraCategories += category
                existingCategories[id] = category
            }
        }
        dao.insertCategories(extraCategories)
        val categoryIds = existingCategories.keys

        val transactions = mutableListOf<TransactionEntity>()
        if (oldTransactions != null) {
            for (index in 0 until oldTransactions.length()) {
                val item = oldTransactions.optJSONObject(index) ?: continue
                val id = item.optString("id").trim().ifBlank { UUID.randomUUID().toString() }
                val accountId = item.optString("accountId").trim()
                val kind = item.optString("kind").trim()
                val amount = item.optDouble("amount", 0.0).roundToLong()
                var categoryId = item.optString("categoryId").trim()
                if (accountId !in accountIds || kind !in setOf(KIND_INCOME, KIND_EXPENSE) || amount <= 0L) continue
                if (categoryId !in categoryIds) {
                    categoryId = if (kind == KIND_INCOME) "income-other" else "expense-other"
                }
                val date = runCatching { LocalDate.parse(item.optString("date")) }.getOrElse { LocalDate.now() }
                transactions += TransactionEntity(
                    id = id,
                    title = item.optString("title", existingCategories[categoryId]?.name ?: "حركة مالية").trim().ifBlank { "حركة مالية" }.take(80),
                    amount = amount,
                    kind = kind,
                    accountId = accountId,
                    categoryId = categoryId,
                    transferAccountId = null,
                    dateEpochDay = date.toEpochDay(),
                    note = item.optString("note").trim().take(200),
                    createdAt = System.currentTimeMillis() + index,
                )
            }
        }

        // Only migrate the current month's explicit category budgets. Legacy recurring/installment workflows
        // are intentionally not recreated because v9 uses a simpler category-plan model.
        val plans = mutableListOf<MonthlyPlanEntity>()
        val currentMonth = YearMonth.now().toString()
        if (oldBudgets != null) {
            for (index in 0 until oldBudgets.length()) {
                val item = oldBudgets.optJSONObject(index) ?: continue
                val categoryId = item.optString("categoryId").trim()
                val amount = item.optDouble("amount", 0.0).roundToLong()
                if (item.optString("month") != currentMonth || categoryId !in categoryIds || amount <= 0L) continue
                plans += MonthlyPlanEntity(
                    categoryId = categoryId,
                    amount = amount,
                    isActive = true,
                    updatedAt = System.currentTimeMillis() + index,
                )
            }
        }

        dao.upsertAccounts(distinctAccounts)
        dao.upsertTransactions(transactions.distinctBy { it.id })
        dao.upsertPlans(plans.distinctBy { it.categoryId })
        migrationPrefs.edit().putBoolean(MIGRATION_DONE_KEY, true).apply()

        return LegacyMigrationResult(
            migrated = distinctAccounts.isNotEmpty() || transactions.isNotEmpty() || plans.isNotEmpty(),
            accounts = distinctAccounts.size,
            transactions = transactions.size,
            plans = plans.distinctBy { it.categoryId }.size,
        )
    }

    private fun archiveLegacyState(raw: String) {
        val directory = File(context.filesDir, "legacy").apply { mkdirs() }
        val target = File(directory, "mali-v8-state.json")
        if (!target.exists()) target.writeText(raw, Charsets.UTF_8)
    }

    private fun legacyAccountType(value: String): String = when (value.lowercase()) {
        "cash" -> "cash"
        "wallet" -> "wallet"
        "savings" -> "savings"
        "card" -> "card"
        else -> "bank"
    }

    private fun legacyIconKey(id: String): String = when {
        "fuel" in id -> "fuel"
        "grocery" in id -> "grocery"
        "restaurant" in id -> "restaurant"
        "health" in id -> "health"
        "housing" in id -> "family"
        "salary" in id -> "salary"
        "business" in id || "freelance" in id -> "work"
        "utility" in id || "telecom" in id -> "bills"
        else -> "other"
    }
}

private fun JSONObject.putNullable(name: String, value: String?): JSONObject =
    put(name, value ?: JSONObject.NULL)

private fun JSONObject.optNullableString(name: String): String? {
    if (isNull(name)) return null
    return optString(name).trim().takeIf { it.isNotBlank() }
}
