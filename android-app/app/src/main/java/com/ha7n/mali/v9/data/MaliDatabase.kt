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

    @Query("SELECT COUNT(*) FROM categories")
    suspend fun categoryCount(): Int

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
    suspend fun upsertTransaction(transaction: TransactionEntity)

    @Query("DELETE FROM transactions WHERE id = :id")
    suspend fun deleteTransaction(id: String)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertPlan(plan: MonthlyPlanEntity)

    @Query("DELETE FROM monthly_plans WHERE categoryId = :categoryId")
    suspend fun deletePlan(categoryId: String)
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
