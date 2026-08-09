package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.db.PrintOrderEntity
import com.example.ui.PrintViewModel
import com.example.ui.theme.SudanCardBorder
import com.example.ui.theme.SudanPrimary
import com.example.ui.theme.SudanSecondary
import com.example.ui.theme.SudanTertiary
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun OrderTrackerScreen(
    viewModel: PrintViewModel,
    initialSearchQuery: String = ""
) {
    val searchQuery by viewModel.searchOrderQuery.collectAsState()
    val trackedOrder by viewModel.trackedOrder.collectAsState()
    val statusMsg by viewModel.searchStatusMessage.collectAsState()
    val allOrders by viewModel.allOrders.collectAsState()

    LaunchedEffect(initialSearchQuery) {
        if (initialSearchQuery.isNotEmpty()) {
            viewModel.searchOrder(initialSearchQuery)
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Search Header Card
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, SudanCardBorder, RoundedCornerShape(16.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.TrackChanges,
                            contentDescription = null,
                            tint = SudanPrimary,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "متابعة حالة طلب الطباعة مباشر",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = SudanPrimary
                            )
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { viewModel.searchOrder(it) },
                            placeholder = { Text("أدخل رقم الطلب (مثال: SD-A4-1024)") },
                            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                            modifier = Modifier
                                .weight(1f)
                                .testTag("search_order_input"),
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true
                        )

                        if (searchQuery.isNotEmpty()) {
                            IconButton(
                                onClick = { viewModel.searchOrder("") },
                                modifier = Modifier
                                    .size(48.dp)
                                    .background(Color.LightGray.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                            ) {
                                Icon(Icons.Default.Close, contentDescription = "Clear")
                            }
                        }
                    }

                    if (statusMsg != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = statusMsg!!,
                            color = MaterialTheme.colorScheme.error,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }

        // Display Tracked Order (if search query matches)
        if (trackedOrder != null) {
            item {
                Text(
                    text = "نتيجة البحث للطلب المحدد:",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = SudanPrimary
                )
            }

            item {
                TrackedOrderDetailCard(order = trackedOrder!!)
            }
        }

        // Active Orders List Section
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "جميع الطلبات النشطة (${allOrders.size})",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = SudanPrimary
                )
                Text(
                    text = "تحديث حي تلقائي",
                    fontSize = 11.sp,
                    color = SudanSecondary,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        if (allOrders.isEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .padding(32.dp)
                            .fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.Inbox,
                            contentDescription = null,
                            tint = Color.Gray,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "لا توجد طلبات طباعة حالياً",
                            color = Color.Gray,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        } else {
            items(allOrders, key = { it.id }) { order ->
                TrackedOrderDetailCard(
                    order = order,
                    onSelect = { viewModel.searchOrder(order.orderNumber) }
                )
            }
        }
    }
}

@Composable
fun TrackedOrderDetailCard(
    order: PrintOrderEntity,
    onSelect: (() -> Unit)? = null
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, SudanCardBorder, RoundedCornerShape(16.dp))
            .clickable(enabled = onSelect != null) { onSelect?.invoke() }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header Row: Order Number and Status Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = SudanPrimary
                    ) {
                        Text(
                            text = order.orderNumber,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = formatDate(order.createdAt),
                        fontSize = 11.sp,
                        color = Color.Gray
                    )
                }

                StatusBadge(status = order.status)
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Student & University info
            Text(
                text = order.studentName,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = SudanPrimary
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.School,
                    contentDescription = null,
                    tint = Color.Gray,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "${order.universityName} - ${order.deliveryLocation}",
                    fontSize = 12.sp,
                    color = Color.DarkGray
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // File & options summary
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = Color(0xFFF1F5F9),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Description,
                            contentDescription = null,
                            tint = SudanPrimary,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Column {
                            Text(
                                text = order.documentFileName,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                            Text(
                                text = "${order.pageCount} صفحة | ${if (order.isColor) "ملون" else "أسود وأبيض"} | ${getBindingLabel(order.bindingType)} | ${order.quantity} نسخة",
                                fontSize = 11.sp,
                                color = Color.Gray
                            )
                        }
                    }

                    Text(
                        text = "${order.totalCost.toInt()} ج.س",
                        fontWeight = FontWeight.ExtraBold,
                        color = SudanSecondary,
                        fontSize = 14.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Live Order Status Tracker Progress Bar
            Text(
                text = "مراحل تنفيذ و إنجاز الطلب:",
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                color = SudanPrimary
            )

            Spacer(modifier = Modifier.height(8.dp))

            OrderStatusProgressBar(currentStatus = order.status)
        }
    }
}

@Composable
fun OrderStatusProgressBar(currentStatus: String) {
    val steps = listOf(
        "RECEIVED" to "تم الاستلام",
        "PRINTING" to "جاري الطباعة",
        "DELIVERY" to "في الطريق",
        "COMPLETED" to "تم التسليم"
    )

    val currentStepIndex = when (currentStatus) {
        "RECEIVED" -> 0
        "PRINTING" -> 1
        "DELIVERY" -> 2
        "COMPLETED" -> 3
        else -> 0
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        steps.forEachIndexed { index, pair ->
            val isPassed = index <= currentStepIndex
            val isCurrent = index == currentStepIndex

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.weight(1f)
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(
                            when {
                                isCurrent -> SudanSecondary
                                isPassed -> SudanPrimary
                                else -> Color.LightGray.copy(alpha = 0.5f)
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    if (isPassed && !isCurrent) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                    } else {
                        Text(
                            text = "${index + 1}",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = pair.second,
                    fontSize = 10.sp,
                    fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal,
                    color = if (isPassed) SudanPrimary else Color.Gray
                )
            }

            if (index < steps.size - 1) {
                Divider(
                    modifier = Modifier
                        .weight(0.5f)
                        .padding(bottom = 16.dp),
                    color = if (index < currentStepIndex) SudanPrimary else Color.LightGray.copy(alpha = 0.5f),
                    thickness = 2.dp
                )
            }
        }
    }
}

@Composable
fun StatusBadge(status: String) {
    val (bgColor, textColor, label) = when (status) {
        "RECEIVED" -> Triple(Color(0xFFE0F2FE), Color(0xFF0369A1), "تم الاستلام")
        "PRINTING" -> Triple(Color(0xFFFEF3C7), Color(0xFFD97706), "جاري الطباعة 🖨️")
        "DELIVERY" -> Triple(Color(0xFFE0E7FF), Color(0xFF4338CA), "في الطريق 🚚")
        "COMPLETED" -> Triple(Color(0xFFDCFCE7), Color(0xFF15803D), "مكتمل وتم التسليم ✔️")
        "CANCELLED" -> Triple(Color(0xFFFEE2E2), Color(0xFFB91C1C), "ملغي")
        else -> Triple(Color.LightGray, Color.DarkGray, status)
    }

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = bgColor
    ) {
        Text(
            text = label,
            color = textColor,
            fontWeight = FontWeight.Bold,
            fontSize = 11.sp,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

fun getBindingLabel(type: String): String {
    return when (type) {
        "STAPLE" -> "دبوس"
        "SPIRAL" -> "حلزوني"
        "HARDCOVER" -> "غلاف مقوى"
        else -> "بدون تغليف"
    }
}

fun formatDate(timestamp: Long): String {
    return try {
        val sdf = SimpleDateFormat("dd/MM/yyyy - hh:mm a", Locale.getDefault())
        sdf.format(Date(timestamp))
    } catch (e: Exception) {
        "اليوم"
    }
}
