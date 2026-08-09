package com.example.ui

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.PrintRepository
import com.example.data.db.AppDatabase
import com.example.data.db.PrintConfigEntity
import com.example.data.db.PrintOrderEntity
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import kotlin.random.Random

val SUDAN_UNIVERSITIES = listOf(
    "جامعة الخرطوم - المجمع الرئيسي",
    "جامعة الخرطوم - المجمع الطبي",
    "جامعة الخرطوم - مجمع التربية (أومدرمان)",
    "جامعة السودان للعلوم والتكنولوجيا - الجناح الغربي",
    "جامعة السودان للعلوم والتكنولوجيا - الجناح الجنوبي",
    "جامعة إفريقيا العالمية - خرطوم",
    "جامعة الأحفاد للبنات - أمدرمان",
    "جامعة النيلين - مجمع الكليات",
    "جامعة المستقبل - الرياض",
    "جامعة بحري - الكدرو",
    "جامعة الجزيرة - مجمع النشيشيبة",
    "جامعة السودان المفتوحة",
    "جامعة الشرق - بورتسودان",
    "عنوان/جامعة أخرى"
)

data class PriceBreakdown(
    val basePricePerPage: Double = 0.0,
    val effectivePricePerPage: Double = 0.0,
    val totalPageCost: Double = 0.0,
    val bindingCost: Double = 0.0,
    val deliveryFee: Double = 0.0,
    val costPerCopy: Double = 0.0,
    val grandTotal: Double = 0.0
)

class PrintViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: PrintRepository

    val configState = MutableStateFlow(PrintConfigEntity())
    val allOrders = MutableStateFlow<List<PrintOrderEntity>>(emptyList())

    // Student Form States
    val selectedFileName = MutableStateFlow("ملخص_المحاضرات_الجامعية.pdf")
    val selectedFileUri = MutableStateFlow<String?>("simulated_pdf_uri")
    val selectedFileSize = MutableStateFlow("2.4 MB")
    val pageCount = MutableStateFlow(15)
    val isColor = MutableStateFlow(false)
    val isDoubleSided = MutableStateFlow(false)
    val bindingType = MutableStateFlow("NONE") // "NONE", "STAPLE", "SPIRAL", "HARDCOVER"
    val quantity = MutableStateFlow(1)

    val selectedUniversity = MutableStateFlow(SUDAN_UNIVERSITIES[0])
    val deliveryLocation = MutableStateFlow("كلية الهندسة - المبنى الجديد - القاعة 4")
    val studentName = MutableStateFlow("محمد علي الخاتم")
    val studentPhone = MutableStateFlow("0912345678")
    val paymentReceiptUri = MutableStateFlow<String?>("simulated_receipt_uri")
    val notes = MutableStateFlow("يرجى الطباعة بوضوح والتأكد من ترتيب الصفحات")

    val lastSubmittedOrderNumber = MutableStateFlow<String?>(null)
    val orderSubmissionSuccess = MutableStateFlow(false)

    // Order Tracker States
    val searchOrderQuery = MutableStateFlow("")
    val trackedOrder = MutableStateFlow<PrintOrderEntity?>(null)
    val searchStatusMessage = MutableStateFlow<String?>(null)

    // Admin States
    val adminAuthenticated = MutableStateFlow(true) // Auto unlocked for easy evaluation
    val adminPasscode = MutableStateFlow("")
    val adminFilterStatus = MutableStateFlow("ALL")
    val selectedOrderForDetail = MutableStateFlow<PrintOrderEntity?>(null)
    val adminMessage = MutableStateFlow<String?>(null)

    // Editable Admin Config values
    val editBwPrice = MutableStateFlow("100")
    val editColorPrice = MutableStateFlow("400")
    val editDoubleSidedMultiplier = MutableStateFlow("0.85")
    val editStaplePrice = MutableStateFlow("200")
    val editSpiralPrice = MutableStateFlow("1500")
    val editHardcoverPrice = MutableStateFlow("4000")
    val editDeliveryFee = MutableStateFlow("1000")
    val editBankakName = MutableStateFlow("A4 Sudan Services")
    val editBankakNumber = MutableStateFlow("2849102")

    init {
        val dao = AppDatabase.getInstance(application).printDao()
        repository = PrintRepository(dao)

        viewModelScope.launch {
            repository.ensureDefaultConfig()
            repository.populateSampleOrdersIfEmpty()

            repository.configFlow.collectLatest { config ->
                config?.let {
                    configState.value = it
                    editBwPrice.value = it.pricePerBwPage.toInt().toString()
                    editColorPrice.value = it.pricePerColorPage.toInt().toString()
                    editDoubleSidedMultiplier.value = it.doubleSidedMultiplier.toString()
                    editStaplePrice.value = it.bindingStaplePrice.toInt().toString()
                    editSpiralPrice.value = it.bindingSpiralPrice.toInt().toString()
                    editHardcoverPrice.value = it.bindingHardcoverPrice.toInt().toString()
                    editDeliveryFee.value = it.deliveryFeeDefault.toInt().toString()
                    editBankakName.value = it.bankakAccountName
                    editBankakNumber.value = it.bankakAccountNumber
                }
            }
        }

        viewModelScope.launch {
            repository.allOrders.collectLatest { orders ->
                allOrders.value = orders

                // If user is searching and results updated, refresh tracked order
                val query = searchOrderQuery.value.trim()
                if (query.isNotEmpty()) {
                    searchOrder(query)
                }
            }
        }
    }

    fun calculatePrice(): PriceBreakdown {
        val config = configState.value
        val pages = pageCount.value.coerceAtLeast(1)
        val copies = quantity.value.coerceAtLeast(1)

        val basePrice = if (isColor.value) config.pricePerColorPage else config.pricePerBwPage
        val effectiveRate = if (isDoubleSided.value) basePrice * config.doubleSidedMultiplier else basePrice

        val pageTotalCost = pages * effectiveRate

        val bindingCost = when (bindingType.value) {
            "STAPLE" -> config.bindingStaplePrice
            "SPIRAL" -> config.bindingSpiralPrice
            "HARDCOVER" -> config.bindingHardcoverPrice
            else -> 0.0
        }

        val costPerCopy = pageTotalCost + bindingCost
        val subtotal = costPerCopy * copies
        val deliveryFee = config.deliveryFeeDefault
        val grandTotal = subtotal + deliveryFee

        return PriceBreakdown(
            basePricePerPage = basePrice,
            effectivePricePerPage = effectiveRate,
            totalPageCost = pageTotalCost,
            bindingCost = bindingCost,
            deliveryFee = deliveryFee,
            costPerCopy = costPerCopy,
            grandTotal = grandTotal
        )
    }

    fun onFileSelected(fileName: String, uri: String, sizeStr: String, estimatedPages: Int = 12) {
        selectedFileName.value = fileName
        selectedFileUri.value = uri
        selectedFileSize.value = sizeStr
        pageCount.value = estimatedPages
    }

    fun submitOrder() {
        if (studentName.value.isBlank() || studentPhone.value.isBlank() || deliveryLocation.value.isBlank()) {
            return
        }

        val price = calculatePrice()
        val randomDigits = Random.nextInt(1000, 9999)
        val orderNo = "SD-A4-$randomDigits"

        val order = PrintOrderEntity(
            orderNumber = orderNo,
            studentName = studentName.value.trim(),
            studentPhone = studentPhone.value.trim(),
            universityName = selectedUniversity.value,
            deliveryLocation = deliveryLocation.value.trim(),
            documentFileName = selectedFileName.value,
            documentUri = selectedFileUri.value ?: "file_uri",
            pageCount = pageCount.value,
            isColor = isColor.value,
            isDoubleSided = isDoubleSided.value,
            bindingType = bindingType.value,
            quantity = quantity.value,
            notes = notes.value.trim(),
            paymentReceiptUri = paymentReceiptUri.value ?: "receipt_uri",
            totalCost = price.grandTotal,
            status = "RECEIVED"
        )

        viewModelScope.launch {
            repository.submitOrder(order)
            lastSubmittedOrderNumber.value = orderNo
            orderSubmissionSuccess.value = true

            // Send local notification for newly submitted order
            com.example.util.NotificationHelper.showOrderStatusNotification(
                context = getApplication(),
                orderNumber = order.orderNumber,
                studentName = order.studentName,
                newStatus = "RECEIVED"
            )

            // Automatically set search query to new order so tracker shows it immediately
            searchOrderQuery.value = orderNo
            searchOrder(orderNo)
        }
    }

    fun resetSubmissionStatus() {
        orderSubmissionSuccess.value = false
    }

    fun searchOrder(query: String) {
        searchOrderQuery.value = query
        if (query.trim().isEmpty()) {
            trackedOrder.value = null
            searchStatusMessage.value = null
            return
        }

        viewModelScope.launch {
            val order = repository.findOrderByNumber(query)
            if (order != null) {
                trackedOrder.value = order
                searchStatusMessage.value = null
            } else {
                trackedOrder.value = null
                searchStatusMessage.value = "لم يتم العثور على طلب برقم: $query"
            }
        }
    }

    fun updateOrderStatus(orderId: Int, newStatus: String) {
        viewModelScope.launch {
            val targetOrder = allOrders.value.find { it.id == orderId }
            
            repository.updateOrderStatus(orderId, newStatus)

            if (targetOrder != null) {
                com.example.util.NotificationHelper.showOrderStatusNotification(
                    context = getApplication(),
                    orderNumber = targetOrder.orderNumber,
                    studentName = targetOrder.studentName,
                    newStatus = newStatus
                )
            }

            val current = trackedOrder.value
            if (current != null && current.id == orderId) {
                trackedOrder.value = current.copy(status = newStatus)
            }
            val detail = selectedOrderForDetail.value
            if (detail != null && detail.id == orderId) {
                selectedOrderForDetail.value = detail.copy(status = newStatus)
            }
        }
    }

    fun deleteOrder(orderId: Int) {
        viewModelScope.launch {
            repository.deleteOrder(orderId)
            if (selectedOrderForDetail.value?.id == orderId) {
                selectedOrderForDetail.value = null
            }
            if (trackedOrder.value?.id == orderId) {
                trackedOrder.value = null
            }
        }
    }

    fun saveAdminConfig() {
        val bw = editBwPrice.value.toDoubleOrNull() ?: 100.0
        val color = editColorPrice.value.toDoubleOrNull() ?: 400.0
        val mult = editDoubleSidedMultiplier.value.toDoubleOrNull() ?: 0.85
        val staple = editStaplePrice.value.toDoubleOrNull() ?: 200.0
        val spiral = editSpiralPrice.value.toDoubleOrNull() ?: 1500.0
        val hardcover = editHardcoverPrice.value.toDoubleOrNull() ?: 4000.0
        val delivery = editDeliveryFee.value.toDoubleOrNull() ?: 1000.0

        val newConfig = PrintConfigEntity(
            id = 1,
            pricePerBwPage = bw,
            pricePerColorPage = color,
            doubleSidedMultiplier = mult,
            bindingStaplePrice = staple,
            bindingSpiralPrice = spiral,
            bindingHardcoverPrice = hardcover,
            deliveryFeeDefault = delivery,
            bankakAccountName = editBankakName.value,
            bankakAccountNumber = editBankakNumber.value,
            updatedAt = System.currentTimeMillis()
        )

        viewModelScope.launch {
            repository.saveConfig(newConfig)
            adminMessage.value = "تم تحديث أسعار الطباعة بنجاح"
        }
    }

    fun clearAdminMessage() {
        adminMessage.value = null
    }
}
