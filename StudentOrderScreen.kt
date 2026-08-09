package com.example.ui.screens

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.Image
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import com.example.R
import com.example.ui.PrintViewModel
import com.example.ui.SUDAN_UNIVERSITIES
import com.example.ui.theme.SudanCardBorder
import com.example.ui.theme.SudanPrimary
import com.example.ui.theme.SudanSecondary
import com.example.ui.theme.SudanTertiary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentOrderScreen(
    viewModel: PrintViewModel,
    onNavigateToTracker: (String) -> Unit
) {
    val context = LocalContext.current

    val config by viewModel.configState.collectAsState()
    val fileName by viewModel.selectedFileName.collectAsState()
    val fileUri by viewModel.selectedFileUri.collectAsState()
    val fileSize by viewModel.selectedFileSize.collectAsState()
    val pageCount by viewModel.pageCount.collectAsState()
    val isColor by viewModel.isColor.collectAsState()
    val isDoubleSided by viewModel.isDoubleSided.collectAsState()
    val bindingType by viewModel.bindingType.collectAsState()
    val quantity by viewModel.quantity.collectAsState()

    val selectedUniv by viewModel.selectedUniversity.collectAsState()
    val deliveryLocation by viewModel.deliveryLocation.collectAsState()
    val studentName by viewModel.studentName.collectAsState()
    val studentPhone by viewModel.studentPhone.collectAsState()
    val paymentReceiptUri by viewModel.paymentReceiptUri.collectAsState()
    val notes by viewModel.notes.collectAsState()

    val submissionSuccess by viewModel.orderSubmissionSuccess.collectAsState()
    val lastOrderNo by viewModel.lastSubmittedOrderNumber.collectAsState()

    var universityDropdownExpanded by remember { mutableStateOf(false) }
    var showSampleFilePickerModal by remember { mutableStateOf(false) }

    // Android File Picker for PDF/DOCX
    val docPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            val name = getFileNameFromUri(context, it) ?: "مستند_محدد.pdf"
            viewModel.onFileSelected(
                fileName = name,
                uri = it.toString(),
                sizeStr = "1.8 MB",
                estimatedPages = 15
            )
        }
    }

    // Android Image Picker for Payment Receipt
    val receiptPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            viewModel.paymentReceiptUri.value = it.toString()
        }
    }

    val price = viewModel.calculatePrice()

    if (submissionSuccess && lastOrderNo != null) {
        AlertDialog(
            onDismissRequest = { viewModel.resetSubmissionStatus() },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = SudanSecondary,
                        modifier = Modifier.size(28.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("تم إرسال الطلب بنجاح!", fontWeight = FontWeight.Bold)
                }
            },
            text = {
                Column {
                    Text("شكراً لك $studentName، تم استلام طلب الطباعة برقم:")
                    Spacer(modifier = Modifier.height(8.dp))
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = SudanPrimary.copy(alpha = 0.1f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = lastOrderNo!!,
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.ExtraBold,
                                color = SudanPrimary
                            ),
                            modifier = Modifier.padding(12.dp),
                            fontSize = 18.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("سيتم البدء في الطباعة والتوصيل فور التأكد من إشعار التحويل.")
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val orderNum = lastOrderNo!!
                        viewModel.resetSubmissionStatus()
                        onNavigateToTracker(orderNum)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SudanPrimary)
                ) {
                    Text("متابعة حالة الطلب الآن")
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.resetSubmissionStatus() }) {
                    Text("إغلاق")
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
        // Hero Service Banner
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SudanPrimary),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "اطبع أوراقك ومحاضراتك بسهولة",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "نوصل أوراقك مجلدة وجاهزة إلى باب كليتك بجميع جامعات السودان",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = Color.White.copy(alpha = 0.85f),
                                    fontSize = 12.sp
                                )
                            )
                        }
                        Icon(
                            imageVector = Icons.Default.Print,
                            contentDescription = null,
                            tint = SudanTertiary,
                            modifier = Modifier.size(44.dp)
                        )
                    }
                }
            }
        }

        // Section 1: File Upload Box
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
                            imageVector = Icons.Default.UploadFile,
                            contentDescription = null,
                            tint = SudanPrimary,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "١. رفع المستند (PDF / DOCX)",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = SudanPrimary
                            )
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // File upload dropzone card
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(SudanPrimary.copy(alpha = 0.04f))
                            .border(
                                width = 1.5.dp,
                                color = SudanPrimary.copy(alpha = 0.3f),
                                shape = RoundedCornerShape(12.dp)
                            )
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.PictureAsPdf,
                                contentDescription = null,
                                tint = SudanPrimary,
                                modifier = Modifier.size(40.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = fileName,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "حجم الملف: $fileSize | الصفحات المقدرة: $pageCount صفحة",
                                fontSize = 12.sp,
                                color = Color.Gray
                            )

                            Spacer(modifier = Modifier.height(12.dp))

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = { docPickerLauncher.launch("*/*") },
                                    shape = RoundedCornerShape(8.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = SudanPrimary),
                                    modifier = Modifier.testTag("upload_file_button")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.FolderOpen,
                                        contentDescription = null,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("اختيار ملف من الجهاز", fontSize = 12.sp)
                                }

                                OutlinedButton(
                                    onClick = { showSampleFilePickerModal = true },
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.testTag("sample_files_button")
                                ) {
                                    Text("ملفات تجريبية", fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Section 2: Print Configuration Options
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
                            imageVector = Icons.Default.Tune,
                            contentDescription = null,
                            tint = SudanPrimary,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "٢. خيارات الطباعة",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = SudanPrimary
                            )
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Page Count Counter
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("عدد الصفحات", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("أدخل عدد صفحات المستند للطباعة", fontSize = 11.sp, color = Color.Gray)
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(
                                onClick = { if (pageCount > 1) viewModel.pageCount.value = pageCount - 1 },
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(Color.LightGray.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                            ) {
                                Icon(Icons.Default.Remove, contentDescription = "Decrease")
                            }

                            Text(
                                text = "$pageCount",
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 16.sp,
                                modifier = Modifier.padding(horizontal = 12.dp)
                            )

                            IconButton(
                                onClick = { viewModel.pageCount.value = pageCount + 1 },
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(Color.LightGray.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "Increase")
                            }
                        }
                    }

                    Divider(modifier = Modifier.padding(vertical = 12.dp), color = SudanCardBorder)

                    // Color Choice (B&W vs Color)
                    Text("نوع الطباعة (الألوان)", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        SelectableCard(
                            title = "أسود وأبيض",
                            subtitle = "${config.pricePerBwPage.toInt()} ج.س / صفحة",
                            isSelected = !isColor,
                            onClick = { viewModel.isColor.value = false },
                            modifier = Modifier.weight(1f)
                        )
                        SelectableCard(
                            title = "ملون (Full Color)",
                            subtitle = "${config.pricePerColorPage.toInt()} ج.س / صفحة",
                            isSelected = isColor,
                            onClick = { viewModel.isColor.value = true },
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Divider(modifier = Modifier.padding(vertical = 12.dp), color = SudanCardBorder)

                    // Single vs Double-sided
                    Text("الطباعة على الوجهين", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        SelectableCard(
                            title = "وجه واحد (Single)",
                            subtitle = "سعر أساسي",
                            isSelected = !isDoubleSided,
                            onClick = { viewModel.isDoubleSided.value = false },
                            modifier = Modifier.weight(1f)
                        )
                        SelectableCard(
                            title = "وجهين (Double-Sided)",
                            subtitle = "خصم 15% على الورق",
                            isSelected = isDoubleSided,
                            onClick = { viewModel.isDoubleSided.value = true },
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Divider(modifier = Modifier.padding(vertical = 12.dp), color = SudanCardBorder)

                    // Binding Options
                    Text("نوع التغليف والتجميع", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(8.dp))

                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            SelectableCard(
                                title = "بدون تغليف",
                                subtitle = "مجاناً",
                                isSelected = bindingType == "NONE",
                                onClick = { viewModel.bindingType.value = "NONE" },
                                modifier = Modifier.weight(1f)
                            )
                            SelectableCard(
                                title = "دبوس جانبي",
                                subtitle = "+${config.bindingStaplePrice.toInt()} ج.س",
                                isSelected = bindingType == "STAPLE",
                                onClick = { viewModel.bindingType.value = "STAPLE" },
                                modifier = Modifier.weight(1f)
                            )
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            SelectableCard(
                                title = "تغليف حلزوني (سلك)",
                                subtitle = "+${config.bindingSpiralPrice.toInt()} ج.س",
                                isSelected = bindingType == "SPIRAL",
                                onClick = { viewModel.bindingType.value = "SPIRAL" },
                                modifier = Modifier.weight(1f)
                            )
                            SelectableCard(
                                title = "غلاف مقوى (فاخر)",
                                subtitle = "+${config.bindingHardcoverPrice.toInt()} ج.س",
                                isSelected = bindingType == "HARDCOVER",
                                onClick = { viewModel.bindingType.value = "HARDCOVER" },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    Divider(modifier = Modifier.padding(vertical = 12.dp), color = SudanCardBorder)

                    // Quantity Counter
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("عدد النسخ المطلوبة", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("طباعة عدة نسخ متطابقة", fontSize = 11.sp, color = Color.Gray)
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(
                                onClick = { if (quantity > 1) viewModel.quantity.value = quantity - 1 },
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(Color.LightGray.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                            ) {
                                Icon(Icons.Default.Remove, contentDescription = "Decrease")
                            }

                            Text(
                                text = "$quantity",
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 16.sp,
                                modifier = Modifier.padding(horizontal = 12.dp)
                            )

                            IconButton(
                                onClick = { viewModel.quantity.value = quantity + 1 },
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(Color.LightGray.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "Increase")
                            }
                        }
                    }
                }
            }
        }

        // Section 3: Dynamic Price Calculator Summary Card
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F5F9)),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.5.dp, SudanSecondary.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Calculate,
                                contentDescription = null,
                                tint = SudanSecondary,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "حاسبة التكلفة التلقائية",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = SudanPrimary
                                )
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = SudanSecondary
                        ) {
                            Text(
                                text = "حساب فوري",
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    CostDetailRow(
                        label = "سعر الورقة (${if (isColor) "ملون" else "أسود وأبيض"}${if (isDoubleSided) " - وجهين" else ""})",
                        value = "${price.effectivePricePerPage.toInt()} ج.س / صفحة"
                    )
                    CostDetailRow(
                        label = "تكلفة طباعة الملف ($pageCount صفحة)",
                        value = "${price.totalPageCost.toInt()} ج.س"
                    )
                    CostDetailRow(
                        label = "تكلفة التغليف المختارة",
                        value = "${price.bindingCost.toInt()} ج.س"
                    )
                    if (quantity > 1) {
                        CostDetailRow(
                            label = "إجمالي النسخة الواحدة",
                            value = "${price.costPerCopy.toInt()} ج.س"
                        )
                        CostDetailRow(
                            label = "عدد النسخ ($quantity نسخ)",
                            value = "× $quantity"
                        )
                    }
                    CostDetailRow(
                        label = "رسوم التوصيل الموحدة للجامعة",
                        value = "${price.deliveryFee.toInt()} ج.س"
                    )

                    Divider(modifier = Modifier.padding(vertical = 10.dp), color = Color.LightGray)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "المبلغ الإجمالي المالي:",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 16.sp,
                            color = SudanPrimary
                        )
                        Text(
                            text = "${price.grandTotal.toInt()} جنيه سوداني",
                            fontWeight = FontWeight.Black,
                            fontSize = 20.sp,
                            color = SudanSecondary
                        )
                    }
                }
            }
        }

        // Section 4: Checkout Form
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
                            imageVector = Icons.Default.Assignment,
                            contentDescription = null,
                            tint = SudanPrimary,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "٣. بيانات الطالب والتسليم والدفع",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = SudanPrimary
                            )
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Student Name
                    OutlinedTextField(
                        value = studentName,
                        onValueChange = { viewModel.studentName.value = it },
                        label = { Text("اسم الطالب ثلاثي") },
                        leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("student_name_input"),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Phone Number
                    OutlinedTextField(
                        value = studentPhone,
                        onValueChange = { viewModel.studentPhone.value = it },
                        label = { Text("رقم الهاتف / الواتساب للتواصل") },
                        leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("student_phone_input"),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // University Dropdown
                    ExposedDropdownMenuBox(
                        expanded = universityDropdownExpanded,
                        onExpandedChange = { universityDropdownExpanded = !universityDropdownExpanded }
                    ) {
                        OutlinedTextField(
                            value = selectedUniv,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("اختر الجامعة / المجمع") },
                            leadingIcon = { Icon(Icons.Default.School, contentDescription = null) },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = universityDropdownExpanded) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor(),
                            shape = RoundedCornerShape(12.dp)
                        )

                        ExposedDropdownMenu(
                            expanded = universityDropdownExpanded,
                            onDismissRequest = { universityDropdownExpanded = false }
                        ) {
                            SUDAN_UNIVERSITIES.forEach { univ ->
                                DropdownMenuItem(
                                    text = { Text(univ) },
                                    onClick = {
                                        viewModel.selectedUniversity.value = univ
                                        universityDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Delivery location
                    OutlinedTextField(
                        value = deliveryLocation,
                        onValueChange = { viewModel.deliveryLocation.value = it },
                        label = { Text("موقع التسليم بالتفصيل (الكلية / القاعة / المبنى)") },
                        leadingIcon = { Icon(Icons.Default.Place, contentDescription = null) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("delivery_location_input"),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Notes
                    OutlinedTextField(
                        value = notes,
                        onValueChange = { viewModel.notes.value = it },
                        label = { Text("ملاحظات خاصة بالطباعة (اختياري)") },
                        leadingIcon = { Icon(Icons.Default.Notes, contentDescription = null) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Payment Transfer Details Section
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF0FDF4)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, Color(0xFF86EFAC), RoundedCornerShape(16.dp))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            // Section Main Header
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Payments,
                                    contentDescription = null,
                                    tint = SudanPrimary,
                                    modifier = Modifier.size(24.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "تفاصيل الدفع والتحويل المالي",
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 15.sp,
                                    color = SudanPrimary
                                )
                            }
                            Text(
                                text = "مكتبة A4 السودان للطباعة",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.Gray
                            )

                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "يرجى تحويل مبلغ الطلب (${price.grandTotal.toInt()} ج.س) عبر أحد خيارات الدفع الإلكتروني التالية باسم الحساب: محمد عثمان حاج شرفي عثمان",
                                fontSize = 12.sp,
                                color = Color.DarkGray,
                                lineHeight = 18.sp
                            )

                            Spacer(modifier = Modifier.height(14.dp))

                            // 1. Bankak Card
                            Card(
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(12.dp))
                            ) {
                                Row(
                                    modifier = Modifier
                                        .padding(12.dp)
                                        .fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Image(
                                        painter = painterResource(id = R.drawable.bankak_logo),
                                        contentDescription = "بنكك - بنك الخرطوم",
                                        contentScale = ContentScale.Fit,
                                        modifier = Modifier
                                            .size(56.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "1️⃣ بنك تطبيقك (Bankak) - بنك الخرطوم",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
                                            color = Color(0xFF991B1B)
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = "🔢 رقم الحساب: ${config.bankakAccountNumber}",
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 13.sp,
                                            color = SudanPrimary
                                        )
                                        Text("👤 اسم الحساب: ${config.bankakAccountName}", fontSize = 11.sp, color = Color.DarkGray)
                                        Text("🏦 البنك: بنك الخرطوم", fontSize = 11.sp, color = Color.Gray)
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            // 2. O-CASH Card
                            Card(
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(12.dp))
                            ) {
                                Row(
                                    modifier = Modifier
                                        .padding(12.dp)
                                        .fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Image(
                                        painter = painterResource(id = R.drawable.ocash_logo),
                                        contentDescription = "أوكاش - بنك أم درمان الوطني",
                                        contentScale = ContentScale.Fit,
                                        modifier = Modifier
                                            .size(56.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "2️⃣ تطبيق أوكاش (O-CASH) - بنك أم درمان الوطني",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
                                            color = Color(0xFF065F46)
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = "🔢 رقم حساب أوكاش: ${config.ocashAccountNumber}",
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 13.sp,
                                            color = SudanPrimary
                                        )
                                        Text("👤 اسم الحساب: ${config.bankakAccountName}", fontSize = 11.sp, color = Color.DarkGray)
                                        Text("🏦 البنك: بنك أم درمان الوطني", fontSize = 11.sp, color = Color.Gray)
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            // 3. Fawry Card
                            Card(
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(12.dp))
                            ) {
                                Row(
                                    modifier = Modifier
                                        .padding(12.dp)
                                        .fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Image(
                                        painter = painterResource(id = R.drawable.fawry_logo),
                                        contentDescription = "فوري - بنك فيصل الإسلامي",
                                        contentScale = ContentScale.Fit,
                                        modifier = Modifier
                                            .size(56.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "3️⃣ تطبيق فوري (فوري) - بنك فيصل الإسلامي",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
                                            color = Color(0xFF5B21B6)
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = "🔢 رقم حساب فوري: ${config.fawryAccountNumber}",
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 13.sp,
                                            color = SudanPrimary
                                        )
                                        Text("👤 اسم الحساب: ${config.bankakAccountName}", fontSize = 11.sp, color = Color.DarkGray)
                                        Text("🏦 البنك: بنك فيصل الإسلامي", fontSize = 11.sp, color = Color.Gray)
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            // Payment Confirmation Box
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = Color(0xFFFEF3C7),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Text(
                                        text = "📸 تأكيد وإثبات الدفع:",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        color = Color(0xFF92400E)
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "قم بإدخال رقم العملية / الإشعار المرجعي أو رفع صورة إشعار التحويل (الريسيفت) مباشرة عند تقديم الطلب عبر التطبيق لتأكيد البدء في الطباعة فوراً.",
                                        fontSize = 11.sp,
                                        color = Color(0xFF78350F),
                                        lineHeight = 16.sp
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Payment Receipt Upload Button
                    OutlinedButton(
                        onClick = { receiptPickerLauncher.launch("image/*") },
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("upload_receipt_button")
                    ) {
                        Icon(
                            imageVector = if (paymentReceiptUri != null) Icons.Default.Check else Icons.Default.Receipt,
                            contentDescription = null,
                            tint = if (paymentReceiptUri != null) SudanSecondary else SudanPrimary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (paymentReceiptUri != null) "تم إرفاق إشعار الدفع (الريسيفت) بنجاح" else "رفع صورة إشعار التحويل (الريسيفت)",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Submit Order Button
                    Button(
                        onClick = { viewModel.submitOrder() },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = SudanPrimary),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp)
                            .testTag("submit_order_button")
                    ) {
                        Icon(imageVector = Icons.Default.Send, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "تأكيد وإرسال طلب الطباعة (${price.grandTotal.toInt()} ج.س)",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }

    // Sample File Picker Modal
    if (showSampleFilePickerModal) {
        AlertDialog(
            onDismissRequest = { showSampleFilePickerModal = false },
            title = { Text("اختر مستند تجريبي للطباعة", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    SampleFileOptionItem(
                        title = "محاضرات_علم_الأدوية_شابتر1.pdf",
                        details = "28 صفحة | PDF | 3.2 MB",
                        onClick = {
                            viewModel.onFileSelected("محاضرات_علم_الأدوية_شابتر1.pdf", "uri_pharm_1", "3.2 MB", 28)
                            showSampleFilePickerModal = false
                        }
                    )
                    SampleFileOptionItem(
                        title = "مشروع_تخرج_هندسة_البرمجيات.docx",
                        details = "54 صفحة | DOCX | 5.8 MB",
                        onClick = {
                            viewModel.onFileSelected("مشروع_تخرج_هندسة_البرمجيات.docx", "uri_grad_doc", "5.8 MB", 54)
                            showSampleFilePickerModal = false
                        }
                    )
                    SampleFileOptionItem(
                        title = "ملخص_امتحانات_الفيزياء_الجامعية.pdf",
                        details = "12 صفحة | PDF | 1.1 MB",
                        onClick = {
                            viewModel.onFileSelected("ملخص_امتحانات_الفيزياء_الجامعية.pdf", "uri_physics", "1.1 MB", 12)
                            showSampleFilePickerModal = false
                        }
                    )
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { showSampleFilePickerModal = false }) {
                    Text("إلغاء")
                }
            }
        )
    }
}

@Composable
fun SelectableCard(
    title: String,
    subtitle: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) SudanPrimary.copy(alpha = 0.08f) else Color.White
        ),
        modifier = modifier
            .border(
                width = if (isSelected) 2.dp else 1.dp,
                color = if (isSelected) SudanPrimary else SudanCardBorder,
                shape = RoundedCornerShape(12.dp)
            )
            .clickable { onClick() }
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = title,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                fontSize = 13.sp,
                color = if (isSelected) SudanPrimary else MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = subtitle,
                fontSize = 11.sp,
                color = if (isSelected) SudanSecondary else Color.Gray,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
            )
        }
    }
}

@Composable
fun CostDetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, fontSize = 12.sp, color = Color.DarkGray)
        Text(text = value, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SudanPrimary)
    }
}

@Composable
fun SampleFileOptionItem(title: String, details: String, onClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = Color(0xFFF8FAFC),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .border(1.dp, SudanCardBorder, RoundedCornerShape(10.dp))
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.InsertDriveFile, contentDescription = null, tint = SudanPrimary)
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(text = title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Text(text = details, fontSize = 11.sp, color = Color.Gray)
            }
        }
    }
}

fun getFileNameFromUri(context: Context, uri: Uri): String? {
    var result: String? = null
    if (uri.scheme == "content") {
        val cursor = context.contentResolver.query(uri, null, null, null, null)
        cursor?.use {
            if (it.moveToFirst()) {
                val index = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (index != -1) {
                    result = it.getString(index)
                }
            }
        }
    }
    if (result == null) {
        result = uri.path
        val cut = result?.lastIndexOf('/') ?: -1
        if (cut != -1) {
            result = result?.substring(cut + 1)
        }
    }
    return result
}
