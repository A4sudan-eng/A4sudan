package com.example.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "print_config")
data class PrintConfigEntity(
    @PrimaryKey val id: Int = 1,
    val pricePerBwPage: Double = 100.0,         // SDG per B&W page
    val pricePerColorPage: Double = 400.0,      // SDG per Color page
    val doubleSidedMultiplier: Double = 0.85,    // 15% discount for double-sided
    val bindingStaplePrice: Double = 200.0,     // SDG
    val bindingSpiralPrice: Double = 1500.0,    // SDG
    val bindingHardcoverPrice: Double = 4000.0, // SDG
    val deliveryFeeDefault: Double = 1000.0,    // SDG
    val bankakAccountName: String = "محمد عثمان حاج شرفي عثمان",
    val bankakAccountNumber: String = "1926413",
    val ocashAccountNumber: String = "798340",
    val fawryAccountNumber: String = "51404329",
    val updatedAt: Long = System.currentTimeMillis()
)
