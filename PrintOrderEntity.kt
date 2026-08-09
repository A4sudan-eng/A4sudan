package com.example.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "print_orders")
data class PrintOrderEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val orderNumber: String,
    val studentName: String,
    val studentPhone: String,
    val universityName: String,
    val deliveryLocation: String,
    val documentFileName: String,
    val documentUri: String,
    val pageCount: Int,
    val isColor: Boolean,
    val isDoubleSided: Boolean,
    val bindingType: String, // "NONE", "STAPLE", "SPIRAL", "HARDCOVER"
    val quantity: Int,
    val notes: String,
    val paymentReceiptUri: String,
    val totalCost: Double,
    val status: String, // "RECEIVED", "PRINTING", "DELIVERY", "COMPLETED", "CANCELLED"
    val createdAt: Long = System.currentTimeMillis()
)
