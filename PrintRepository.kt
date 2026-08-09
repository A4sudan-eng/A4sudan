package com.example.data

import com.example.data.db.PrintDao
import com.example.data.db.PrintConfigEntity
import com.example.data.db.PrintOrderEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull

class PrintRepository(private val printDao: PrintDao) {

    val allOrders: Flow<List<PrintOrderEntity>> = printDao.getAllOrders()
    val configFlow: Flow<PrintConfigEntity?> = printDao.getConfigFlow()

    suspend fun ensureDefaultConfig() {
        val current = printDao.getConfigDirect()
        if (current == null) {
            val defaultConfig = PrintConfigEntity()
            printDao.saveConfig(defaultConfig)
        }
    }

    suspend fun saveConfig(config: PrintConfigEntity) {
        printDao.saveConfig(config)
    }

    suspend fun submitOrder(order: PrintOrderEntity): Long {
        return printDao.insertOrder(order)
    }

    suspend fun updateOrderStatus(id: Int, status: String) {
        printDao.updateOrderStatus(id, status)
    }

    suspend fun deleteOrder(id: Int) {
        printDao.deleteOrder(id)
    }

    suspend fun findOrderByNumber(query: String): PrintOrderEntity? {
        val cleanQuery = query.trim().uppercase()
        val idVal = cleanQuery.toIntOrNull() ?: -1
        return printDao.findOrder(cleanQuery, idVal)
    }

    suspend fun populateSampleOrdersIfEmpty() {
        val existing = printDao.getAllOrders().firstOrNull()
        if (existing.isNullOrEmpty()) {
            val sample1 = PrintOrderEntity(
                orderNumber = "SD-A4-1024",
                studentName = "أحمد محمد العبيد",
                studentPhone = "0912345678",
                universityName = "جامعة الخرطوم - المجمع الرئيسي",
                deliveryLocation = "كلية الهندسة - القاعة الكبرى",
                documentFileName = "مشروع_التخرج_الهندسة_المدنية.pdf",
                documentUri = "sample_doc_1",
                pageCount = 45,
                isColor = true,
                isDoubleSided = true,
                bindingType = "SPIRAL",
                quantity = 2,
                notes = "يرجى استخدام ورق 80 جرام والطباعة بجودة عالية",
                paymentReceiptUri = "sample_receipt_1",
                totalCost = 18360.0,
                status = "PRINTING"
            )
            val sample2 = PrintOrderEntity(
                orderNumber = "SD-A4-1025",
                studentName = "سارة يوسف إبراهيم",
                studentPhone = "0987654321",
                universityName = "جامعة السودان للعلوم والتكنولوجيا",
                deliveryLocation = "مجمع القوز - كلية الصيدلة",
                documentFileName = "محاضرات_علم_الأدوية_شابتر3.docx",
                documentUri = "sample_doc_2",
                pageCount = 18,
                isColor = false,
                isDoubleSided = false,
                bindingType = "STAPLE",
                quantity = 1,
                notes = "تثبيت بدبوسين في الزاوية العلوية",
                paymentReceiptUri = "sample_receipt_2",
                totalCost = 3000.0,
                status = "RECEIVED"
            )
            val sample3 = PrintOrderEntity(
                orderNumber = "SD-A4-1022",
                studentName = "عمر خالد علي",
                studentPhone = "0123456789",
                universityName = "جامعة إفريقيا العالمية",
                deliveryLocation = "سكن الطلاب - مبنى ج",
                documentFileName = "ملخص_الكيمياء_الحيوية.pdf",
                documentUri = "sample_doc_3",
                pageCount = 30,
                isColor = false,
                isDoubleSided = true,
                bindingType = "HARDCOVER",
                quantity = 1,
                notes = "غلاف أزرق داكن مع كتابة ذهبية",
                paymentReceiptUri = "sample_receipt_3",
                totalCost = 7550.0,
                status = "COMPLETED"
            )
            printDao.insertOrder(sample1)
            printDao.insertOrder(sample2)
            printDao.insertOrder(sample3)
        }
    }
}
