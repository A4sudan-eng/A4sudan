package com.example.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface PrintDao {
    @Query("SELECT * FROM print_orders ORDER BY createdAt DESC")
    fun getAllOrders(): Flow<List<PrintOrderEntity>>

    @Query("SELECT * FROM print_orders WHERE orderNumber = :query OR id = :idQuery LIMIT 1")
    suspend fun findOrder(query: String, idQuery: Int): PrintOrderEntity?

    @Query("SELECT * FROM print_orders WHERE studentPhone = :phone ORDER BY createdAt DESC")
    fun getOrdersByPhone(phone: String): Flow<List<PrintOrderEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrder(order: PrintOrderEntity): Long

    @Query("UPDATE print_orders SET status = :status WHERE id = :id")
    suspend fun updateOrderStatus(id: Int, status: String)

    @Query("DELETE FROM print_orders WHERE id = :id")
    suspend fun deleteOrder(id: Int)

    // Config Queries
    @Query("SELECT * FROM print_config WHERE id = 1 LIMIT 1")
    fun getConfigFlow(): Flow<PrintConfigEntity?>

    @Query("SELECT * FROM print_config WHERE id = 1 LIMIT 1")
    suspend fun getConfigDirect(): PrintConfigEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveConfig(config: PrintConfigEntity)
}
