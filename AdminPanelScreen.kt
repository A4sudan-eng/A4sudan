package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.db.PrintOrderEntity
import com.example.ui.PrintViewModel
import com.example.ui.theme.SudanCardBorder
import com.example.ui.theme.SudanPrimary
import com.example.ui.theme.SudanSecondary
import com.example.ui.theme.SudanTertiary

@Composable
fun AdminPanelScreen(viewModel: PrintViewModel) {

    val adminMsg by viewModel.adminMessage.collectAsState()
    val allOrders by viewModel.allOrders.collectAsState()
    val filterStatus by viewModel.adminFilterStatus.collectAsState()
    val selectedDetail by viewModel.selectedOrderForDetail.collectAsState()

    val editBw by viewModel.editBwPrice.collectAsState()
    val editColor by viewModel.editColorPrice.collectAsState()
    val editDoubleSided by viewModel.editDoubleSidedMultiplier.collectAsState()
    val editStaple by viewModel.editStaplePrice.collectAsState()
    val editSpiral by viewModel.editSpiralPrice.collectAsState()
    val editHardcover by viewModel.editHardcoverPrice.collectAsState()
    val editDelivery by viewModel.editDeliveryFee.collectAsState()
    val editBankakName by viewModel.editBankakName.collectAsState()
    val editBankakNumber by viewModel.editBankakNumber.collectAsState()

    var activeTab by remember { mutableStateOf(0) } // 0: Orders Dashboard, 1: Price Configuration

    if (adminMsg != null) {
        AlertDialog(
            onDismissRequest = { viewModel.clearAdminMessage() },
            title = { Text("إشعار لوحة التحكم", fontWeight = FontWeight.Bold) },
            text = { Text(adminMsg!!) },
            confirmButton = {
                Button(onClick = { viewModel.clearAdminMessage() }) {
                    Text("تم")
                }
            }
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Admin Header & Summary Metrics
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SudanPrimary),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.AdminPanelSettings,
                                contentDescription = null,
                                tint = SudanTertiary,
                                modifier = Modifier.size(28.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "لوحة إدراة الطلبات والأسعار (Admin)",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = SudanSecondary
                        ) {
                            Text(
                                text = "نشط",
                                color = Color.White,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Metrics row
                    val receivedCount = allOrders.count { it.status == "RECEIVED" }
                    val printingCount = allOrders.count { it.status == "PRINTING" }
                    val completedCount = allOrders.count { it.status == "COMPLETED" }
                    val totalRevenue = allOrders.filter { it.status != "CANCELLED" }.sumOf { it.totalCost }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        MetricBox(title = "جديدة", value = "$receivedCount", color = Color(0xFF0284C7), modifier = Modifier.weight(1f))
                        MetricBox(title = "قيد الطباعة", value = "$printingCount", color = Color(0xFFD97706), modifier = Modifier.weight(1f))
                        MetricBox(title = "مكتملة", value = "$completedCount", color = Color(0xFF16A34A), modifier = Modifier.weight(1f))
                        MetricBox(title = "الإيراد (ج.س)", value = "${totalRevenue.toInt()}", color = SudanTertiary, modifier = Modifier.weight(1.2f))
                    }
                }
            }
        }

        // Tab Selector Row
        item {
            TabRow(
                selectedTabIndex = activeTab,
                containerColor = Color.White,
                contentColor = SudanPrimary,
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .border(1.dp, SudanCardBorder, RoundedCornerShape(12.dp))
            ) {
                Tab(
                    selected = activeTab == 0,
                    onClick = { activeTab = 0 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.ListAlt, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("جدول الطلبات", fontWeight = FontWeight.Bold)
                        }
                    }
                )
                Tab(
                    selected = activeTab == 1,
                    onClick = { activeTab = 1 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.PriceChange, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("إعداد الأسعار", fontWeight = FontWeight.Bold)
                        }
                    }
                )
            }
        }

        // Tab 0 Content: Orders Table & Management
        if (activeTab == 0) {
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "تصفية حسب حالة الطلب:",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = SudanPrimary
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // Status filter chips
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            FilterChip(
                                selected = filterStatus == "ALL",
                                onClick = { viewModel.adminFilterStatus.value = "ALL" },
                                label = { Text("الكل", fontSize = 11.sp) }
                            )
                            FilterChip(
                                selected = filterStatus == "RECEIVED",
                                onClick = { viewModel.adminFilterStatus.value = "RECEIVED" },
                                label = { Text("تم الاستلام", fontSize = 11.sp) }
                            )
                            FilterChip(
                                selected = filterStatus == "PRINTING",
                                onClick = { viewModel.adminFilterStatus.value = "PRINTING" },
                                label = { Text("جاري الطباعة", fontSize = 11.sp) }
                            )
                            FilterChip(
                                selected = filterStatus == "DELIVERY",
                                onClick = { viewModel.adminFilterStatus.value = "DELIVERY" },
                                label = { Text("في الطريق", fontSize = 11.sp) }
                            )
                        }
                    }
                }
            }

            val filteredOrders = if (filterStatus == "ALL") allOrders else allOrders.filter { it.status == filterStatus }

            if (filteredOrders.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("لا توجد طلبات متطابقة مع التصفية", color = Color.Gray)
                    }
                }
            } else {
                items(filteredOrders, key = { it.id }) { order ->
                    AdminOrderRowCard(
                        order = order,
                        onUpdateStatus = { newStatus -> viewModel.updateOrderStatus(order.id, newStatus) },
                        onViewDetail = { viewModel.selectedOrderForDetail.value = order },
                        onDelete = { viewModel.deleteOrder(order.id) }
                    )
                }
            }
        }

        // Tab 1 Content: Price Configuration
        if (activeTab == 1) {
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
                                imageVector = Icons.Default.SettingsSuggest,
                                contentDescription = null,
                                tint = SudanPrimary,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "تعديل تسعيرة الطباعة والتغليف والتوصيل",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = SudanPrimary
                                )
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Per page costs
                        Text("أسعار الورق والطباعة (بالجنيه السوداني - ج.س)", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedTextField(
                                value = editBw,
                                onValueChange = { viewModel.editBwPrice.value = it },
                                label = { Text("سعر الورقة أسود/أبيض") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("edit_bw_price_input"),
                                shape = RoundedCornerShape(10.dp)
                            )
                            OutlinedTextField(
                                value = editColor,
                                onValueChange = { viewModel.editColorPrice.value = it },
                                label = { Text("سعر الورقة ملون") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("edit_color_price_input"),
                                shape = RoundedCornerShape(10.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = editDoubleSided,
                            onValueChange = { viewModel.editDoubleSidedMultiplier.value = it },
                            label = { Text("معامل خصم الوجهين (مثال: 0.85 لكورونا خصم 15%)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        )

                        Divider(modifier = Modifier.padding(vertical = 14.dp), color = SudanCardBorder)

                        // Binding Options
                        Text("أسعار خيارات التغليف (ج.س)", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedTextField(
                                value = editStaple,
                                onValueChange = { viewModel.editStaplePrice.value = it },
                                label = { Text("دبوس جانبي") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp)
                            )
                            OutlinedTextField(
                                value = editSpiral,
                                onValueChange = { viewModel.editSpiralPrice.value = it },
                                label = { Text("تغليف حلزوني") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedTextField(
                            value = editHardcover,
                            onValueChange = { viewModel.editHardcoverPrice.value = it },
                            label = { Text("غلاف مقوى فاخر (Hardcover)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        )

                        Divider(modifier = Modifier.padding(vertical = 14.dp), color = SudanCardBorder)

                        // Delivery Fee & Bankak Details
                        Text("رسوم التوصيل وبيانات تحويل بنكك", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedTextField(
                            value = editDelivery,
                            onValueChange = { viewModel.editDeliveryFee.value = it },
                            label = { Text("رسوم التوصيل للجامعة (ج.س)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedTextField(
                                value = editBankakName,
                                onValueChange = { viewModel.editBankakName.value = it },
                                label = { Text("اسم حساب بنكك") },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp)
                            )
                            OutlinedTextField(
                                value = editBankakNumber,
                                onValueChange = { viewModel.editBankakNumber.value = it },
                                label = { Text("رقم حساب بنكك") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        // Save Configuration Button
                        Button(
                            onClick = { viewModel.saveAdminConfig() },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = SudanSecondary),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .testTag("save_config_button")
                        ) {
                            Icon(Icons.Default.Save, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("حفظ وتحديث أسعار الحاسبة في تطبيق الطالب", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                    }
                }
            }
        }
    }

    // Detail & Receipt View Dialog
    if (selectedDetail != null) {
        val detail = selectedDetail!!
        AlertDialog(
            onDismissRequest = { viewModel.selectedOrderForDetail.value = null },
            title = {
                Text(
                    text = "تفاصيل الطلب: ${detail.orderNumber}",
                    fontWeight = FontWeight.Bold,
                    color = SudanPrimary
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("اسم الطالب: ${detail.studentName}", fontWeight = FontWeight.Bold)
                    Text("رقم التواصل: ${detail.studentPhone}")
                    Text("الجامعة والموقع: ${detail.universityName} - ${detail.deliveryLocation}")
                    Text("اسم المستند: ${detail.documentFileName}")
                    Text("تفاصيل الطباعة: ${detail.pageCount} صفحة | ${if (detail.isColor) "ملون" else "أسود وأبيض"} | ${if (detail.isDoubleSided) "وجهين" else "وجه واحد"} | ${getBindingLabel(detail.bindingType)}")
                    Text("الملاحظات: ${detail.notes.ifBlank { "لا توجد ملاحظات" }}")
                    Text("إجمالي المبلغ: ${detail.totalCost.toInt()} ج.س", fontWeight = FontWeight.Bold, color = SudanSecondary)

                    Spacer(modifier = Modifier.height(8.dp))

                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Color(0xFFF1F5F9),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text("إشعار التحويل المرفق (Bankak):", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.ReceiptLong, contentDescription = null, tint = SudanPrimary)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("تم التحقق من إشعار بنكك برقم الحساب", fontSize = 11.sp, color = Color.DarkGray)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(onClick = { viewModel.selectedOrderForDetail.value = null }) {
                    Text("تم الإطلاع")
                }
            }
        )
    }
}

@Composable
fun AdminOrderRowCard(
    order: PrintOrderEntity,
    onUpdateStatus: (String) -> Unit,
    onViewDetail: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, SudanCardBorder, RoundedCornerShape(12.dp))
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = order.orderNumber, fontWeight = FontWeight.ExtraBold, color = SudanPrimary, fontSize = 14.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = order.studentName, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }

                StatusBadge(status = order.status)
            }

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "${order.universityName} | ${order.documentFileName} (${order.pageCount} صفحة)",
                fontSize = 11.sp,
                color = Color.DarkGray
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Action Buttons to change status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedButton(
                    onClick = onViewDetail,
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("التفاصيل والملف", fontSize = 10.sp)
                }

                if (order.status == "RECEIVED") {
                    Button(
                        onClick = { onUpdateStatus("PRINTING") },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD97706)),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("بدء الطباعة 🖨️", fontSize = 10.sp)
                    }
                } else if (order.status == "PRINTING") {
                    Button(
                        onClick = { onUpdateStatus("DELIVERY") },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4338CA)),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("تسليم للمندوب 🚚", fontSize = 10.sp)
                    }
                } else if (order.status == "DELIVERY") {
                    Button(
                        onClick = { onUpdateStatus("COMPLETED") },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF15803D)),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("تأكيد التسليم ✔️", fontSize = 10.sp)
                    }
                }

                Spacer(modifier = Modifier.weight(1f))

                IconButton(
                    onClick = onDelete,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color.LightGray)
                }
            }
        }
    }
}

@Composable
fun MetricBox(title: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = Color.White.copy(alpha = 0.15f),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = title, fontSize = 10.sp, color = Color.White.copy(alpha = 0.8f))
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = value, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = color)
        }
    }
}
