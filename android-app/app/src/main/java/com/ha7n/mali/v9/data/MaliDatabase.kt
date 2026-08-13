package com.ha7n.mali.v9.data

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Index
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Transaction
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "accounts")
data class AccountEntity(
    @PrimaryKey val id: String,
    val name: String,
    val type: String,
    val openingBalance: Long,
    val createdAt: Long,
)

@Entity(tableName = "categories")
data class CategoryEntity(
    @PrimaryKey val id: String,
    val name: String,
    val kind: String,
    val iconKey: String,
    val colorArgb: Long,
    val sortOrder: Int,
    val isDefault: Boolean = true,
)

@Entity(
    tableName = "transactions",
    indices = [
        Index("accountId"),
        Index("categoryId"),
        Index("transferAccountId"),
        Index("dateEpochDay"),
    ],
)
data class TransactionEntity(
    @PrimaryKey val id: String,
    val title: String,
    val amount: Long,
    val kind: String,
    val accountId: String,
    val categoryId: String?,
    val transferAccountId: String?,
    val dateEpochDay: Long,
    val note: String,
    val createdAt: Long,
)

@Entity(tableName = "monthly_plans")
data class MonthlyPlanEntity(
    @PrimaryKey val categoryId: String,
    val amount: Long,
    val isActive: Boolean = true,
    val updatedAt: Long,
)

@Dao
interface MaliDao {
    @Query("SELECT * FROM accounts ORDER BY createdAt ASC")
    fun observeAccounts(): Flow<List<AccountEntity>>

    @Query("SELECT * FROM categories ORDER BY kind DESC, sortOrder ASC")
    fun observeCategories(): Flow<List<CategoryEntity>>

    @Query("SELECT * FROM transactions ORDER BY dateEpochDay DESC, createdAt DESC")
    fun observeTransactions(): Flow<List<TransactionEntity>>

    @Query("SELECT * FROM monthly_plans WHERE isActive = 1")
    fun observePlans(): Flow<List<MonthlyPlanEntity>>

    @Query("SELECT * FROM accounts ORDER BY createdAt ASC")
    suspend fun getAccounts(): List<AccountEntity>

    @Query("SELECT * FROM accounts WHERE id = :id LIMIT 1")
    suspend fun getAccount(id: String): AccountEntity?

    @Query("SELECT * FROM categories ORDER BY kind DESC, sortOrder ASC")
    suspend fun getCategories(): List<CategoryEntity>

    @Query("SELECT * FROM transactions ORDER BY dateEpochDay DESC, createdAt DESC")
    suspend fun getTransactions(): List<TransactionEntity>

    @Query("SELECT * FROM monthly_plans WHERE isActive = 1")
    suspend fun getPlans(): List<MonthlyPlanEntity>

    @Query("SELECT COUNT(*) FROM categories")
    suspend fun categoryCount(): Int

    @Query("SELECT COUNT(*) FROM accounts")
    suspend fun accountCount(): Int

    @Query("SELECT COUNT(*) FROM transactions")
    suspend fun transactionCount(): Int

    @Query("SELECT COUNT(*) FROM transactions WHERE accountId = :accountId OR transferAccountId = :accountId")
    suspend fun transactionCountForAccount(accountId: String): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAccount(account: AccountEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAccounts(accounts: List<AccountEntity>)

    @Update
    suspend fun updateAccount(account: AccountEntity)

    @Query("DELETE FROM accounts WHERE id = :id")
    suspend fun deleteAccount(id: String)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertCategory(category: CategoryEntity)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertCategories(categories: List<CategoryEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertCategories(categories: List<CategoryEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertTransaction(transaction: TransactionEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertTransactions(transactions: List<TransactionEntity>)

    @Query("DELETE FROM transactions WHERE id = :id")
    suspend fun deleteTransaction(id: String)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertPlan(plan: MonthlyPlanEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertPlans(plans: List<MonthlyPlanEntity>)

    @Query("DELETE FROM monthly_plans WHERE categoryId = :categoryId")
    suspend fun deletePlan(categoryId: String)

    @Query("DELETE FROM transactions")
    suspend fun clearTransactions()

    @Query("DELETE FROM monthly_plans")
    suspend fun clearPlans()

    @Query("DELETE FROM categories")
    suspend fun clearCategories()

    @Query("DELETE FROM accounts")
    suspend fun clearAccounts()

    @Transaction
    suspend fun replaceAll(
        accounts: List<AccountEntity>,
        categories: List<CategoryEntity>,
        transactions: List<TransactionEntity>,
        plans: List<MonthlyPlanEntity>,
    ) {
        clearTransactions()
        clearPlans()
        clearCategories()
        clearAccounts()
        upsertAccounts(accounts)
        upsertCategories(categories)
        upsertTransactions(transactions)
        upsertPlans(plans)
    }
}

@Database(
    entities = [
        AccountEntity::class,
        CategoryEntity::class,
        TransactionEntity::class,
        MonthlyPlanEntity::class,
    ],
    version = 1,
    exportSchema = true,
)
abstract class MaliDatabase : RoomDatabase() {
    abstract fun maliDao(): MaliDao

    companion object {
        @Volatile private var instance: MaliDatabase? = null

        fun getInstance(context: Context): MaliDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    MaliDatabase::class.java,
                    "mali-v9.db",
                ).build().also { instance = it }
            }
    }
}
