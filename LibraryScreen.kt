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
import com.example.data.*
import com.example.ui.PrintViewModel
import com.example.ui.theme.SudanCardBorder
import com.example.ui.theme.SudanPrimary
import com.example.ui.theme.SudanSecondary
import com.example.ui.theme.SudanTertiary
import kotlinx.coroutines.launch

@Composable
fun LibraryScreen(
    viewModel: PrintViewModel,
    onSendMaterialToCheckout: () -> Unit
) {
    val universities = LibraryRepositoryData.universities

    var selectedUniversity by remember { mutableStateOf<University?>(null) }
    var selectedFaculty by remember { mutableStateOf<Faculty?>(null) }
    var selectedDepartment by remember { mutableStateOf<Department?>(null) }
    var selectedDegree by remember { mutableStateOf<ProgramDegree?>(null) }
    var selectedBatch by remember { mutableStateOf<BatchGroup?>(null) }

    val snackbarHostState = remember { SnackbarHostState() }
    val coroutineScope = rememberCoroutineScope()

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Top Breadcrumb & Back Navigation Bar
            Surface(
                color = Color.White,
                shadowElevation = 2.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.MenuBook,
                                contentDescription = null,
                                tint = SudanPrimary,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "المكتبة الإلكترونية والملازم",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = SudanPrimary
                            )
                        }

                        if (selectedUniversity != null) {
                            TextButton(
                                onClick = {
                                    if (selectedBatch != null) {
                                        selectedBatch = null
                                    } else if (selectedDegree != null) {
                                        selectedDegree = null
                                    } else if (selectedDepartment != null) {
                                        selectedDepartment = null
                                    } else if (selectedFaculty != null) {
                                        selectedFaculty = null
                                    } else if (selectedUniversity != null) {
                                        selectedUniversity = null
                                    }
                                }
                            ) {
                                Icon(Icons.Default.ArrowBack, contentDescription = "رجوع", modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("رجوع للخلف", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    // Breadcrumb Path Text
                    val pathText = buildString {
                        append("المكتبة")
                        if (selectedUniversity != null) {
                            append(" ⬅️ ")
                            append(selectedUniversity!!.name)
                        }
                        if (selectedFaculty != null) {
                            append(" ⬅️ ")
                            append(selectedFaculty!!.name)
                        }
                        if (selectedDepartment != null) {
                            append(" ⬅️ ")
                            append(selectedDepartment!!.name)
                        }
                        if (selectedDegree != null) {
                            append(" ⬅️ ")
                            append(selectedDegree!!.name)
                        }
                        if (selectedBatch != null) {
                            append(" ⬅️ ")
                            append(selectedBatch!!.batchNumber)
                        }
                    }

                    Text(
                        text = pathText,
                        fontSize = 11.sp,
                        color = Color.Gray,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // Dynamic Content depending on current selection step
            Box(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                when {
                    // STEP 0: Select University
                    selectedUniversity == null -> {
                        UniversitySelectionView(
                            universities = universities,
                            onSelectUniversity = { selectedUniversity = it },
                            onUnavailableUniversityClick = { uni ->
                                coroutineScope.launch {
                                    snackbarHostState.showSnackbar("${uni.name} ستكون متاحة قريباً ⏳")
                                }
                            }
                        )
                    }

                    // STEP 1: Select Faculty inside University
                    selectedFaculty == null -> {
                        FacultySelectionView(
                            university = selectedUniversity!!,
                            onSelectFaculty = { selectedFaculty = it },
                            onUnavailableFacultyClick = { faculty ->
                                coroutineScope.launch {
                                    snackbarHostState.showSnackbar("${faculty.name} ستكون متاحة قريباً ⏳")
                                }
                            }
                        )
                    }

                    // STEP 2: Select Department inside Faculty
                    selectedDepartment == null -> {
                        DepartmentSelectionView(
                            universityName = selectedUniversity!!.name,
                            faculty = selectedFaculty!!,
                            onSelectDepartment = { selectedDepartment = it }
                        )
                    }

                    // STEP 3: Select Degree & Batch
                    selectedBatch == null -> {
                        DegreeAndBatchSelectionView(
                            department = selectedDepartment!!,
                            selectedDegree = selectedDegree,
                            onSelectDegree = { selectedDegree = it },
                            onSelectBatch = { degree, batch ->
                                selectedDegree = degree
                                selectedBatch = batch
                            }
                        )
                    }

                    // STEP 4: View Academic Materials for the Selected Batch
                    else -> {
                        BatchMaterialsView(
                            universityName = selectedUniversity!!.name,
                            facultyName = selectedFaculty?.name ?: "",
                            departmentName = selectedDepartment?.name ?: "",
                            degreeName = selectedDegree?.name ?: "",
                            batch = selectedBatch!!,
                            viewModel = viewModel,
                            onOrderClicked = onSendMaterialToCheckout
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun UniversitySelectionView(
    universities: List<University>,
    onSelectUniversity: (University) -> Unit,
    onUnavailableUniversityClick: (University) -> Unit
) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SudanPrimary),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.School,
                        contentDescription = null,
                        tint = SudanTertiary,
                        modifier = Modifier.size(36.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "المكتبة الأكاديمية والملازم",
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 16.sp
                        )
                        Text(
                            text = "اختر الجامعة للوصول للكليات والملازم والامتحانات الجاهزة للطلب",
                            color = Color.White.copy(alpha = 0.85f),
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }

        item {
            Text(
                text = "اختر الجامعة:",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = SudanPrimary
            )
        }

        items(universities, key = { it.id }) { uni ->
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (uni.isAvailable) Color.White else Color(0xFFF8FAFC)
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        1.dp,
                        if (uni.isAvailable) SudanCardBorder else Color(0xFFE2E8F0),
                        RoundedCornerShape(14.dp)
                    )
                    .clickable {
                        if (uni.isAvailable) {
                            onSelectUniversity(uni)
                        } else {
                            onUnavailableUniversityClick(uni)
                        }
                    }
                    .testTag("uni_card_${uni.id}")
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(
                                    if (uni.isAvailable) SudanSecondary.copy(alpha = 0.1f)
                                    else Color.LightGray.copy(alpha = 0.2f)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.AccountBalance,
                                contentDescription = null,
                                tint = if (uni.isAvailable) SudanSecondary else Color.Gray
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = uni.name,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 15.sp,
                                color = if (uni.isAvailable) SudanPrimary else Color.Gray
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = if (uni.isAvailable) "متاحة الآن (كليات وملازم)" else "قريباً - جاري تجهيز المحتوى",
                                fontSize = 11.sp,
                                color = if (uni.isAvailable) SudanSecondary else Color.Gray
                            )
                        }
                    }

                    if (uni.isAvailable) {
                        Icon(
                            imageVector = Icons.Default.ChevronRight,
                            contentDescription = null,
                            tint = SudanPrimary
                        )
                    } else {
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = Color(0xFFFEF3C7)
                        ) {
                            Text(
                                text = "قريباً ⏳",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFD97706),
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun FacultySelectionView(
    university: University,
    onSelectFaculty: (Faculty) -> Unit,
    onUnavailableFacultyClick: (Faculty) -> Unit
) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SudanPrimary),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.School,
                        contentDescription = null,
                        tint = SudanTertiary,
                        modifier = Modifier.size(36.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = university.name,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 16.sp
                        )
                        Text(
                            text = "اختر الكلية للوصول للملازم والامتحانات",
                            color = Color.White.copy(alpha = 0.85f),
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }

        item {
            Text(
                text = "اختر الكلية:",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = SudanPrimary
            )
        }

        items(university.faculties, key = { it.id }) { faculty ->
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (faculty.isAvailable) Color.White else Color(0xFFF8FAFC)
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        1.dp,
                        if (faculty.isAvailable) SudanCardBorder else Color(0xFFE2E8F0),
                        RoundedCornerShape(14.dp)
                    )
                    .clickable {
                        if (faculty.isAvailable) {
                            onSelectFaculty(faculty)
                        } else {
                            onUnavailableFacultyClick(faculty)
                        }
                    }
                    .testTag("faculty_card_${faculty.id}")
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(
                                    if (faculty.isAvailable) SudanSecondary.copy(alpha = 0.1f)
                                    else Color.LightGray.copy(alpha = 0.2f)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.School,
                                contentDescription = null,
                                tint = if (faculty.isAvailable) SudanSecondary else Color.Gray
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = faculty.name,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 15.sp,
                                color = if (faculty.isAvailable) SudanPrimary else Color.Gray
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = if (faculty.isAvailable) "متاحة الآن - جميع الأقسام والدفعات" else "قريباً - جاري رفع الملازم والامتحانات",
                                fontSize = 11.sp,
                                color = if (faculty.isAvailable) SudanSecondary else Color.Gray
                            )
                        }
                    }

                    if (faculty.isAvailable) {
                        Icon(
                            imageVector = Icons.Default.ChevronRight,
                            contentDescription = null,
                            tint = SudanPrimary
                        )
                    } else {
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = Color(0xFFFEF3C7)
                        ) {
                            Text(
                                text = "قريباً ⏳",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFD97706),
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DepartmentSelectionView(
    universityName: String,
    faculty: Faculty,
    onSelectDepartment: (Department) -> Unit
) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SudanPrimary),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.School,
                        contentDescription = null,
                        tint = SudanTertiary,
                        modifier = Modifier.size(36.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "$universityName - ${faculty.name}",
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 16.sp
                        )
                        Text(
                            text = "اختر التخصص والقسم للوصول للملازم والامتحانات المعتمدة",
                            color = Color.White.copy(alpha = 0.85f),
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }

        item {
            Text(
                text = "الأقسام والتخصصات المتاحة حالياً:",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = SudanPrimary
            )
        }

        items(faculty.departments, key = { it.id }) { dept ->
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, SudanCardBorder, RoundedCornerShape(14.dp))
                    .clickable { onSelectDepartment(dept) }
                    .testTag("dept_card_${dept.id}")
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(SudanSecondary.copy(alpha = 0.1f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.AccountBalance,
                                contentDescription = null,
                                tint = SudanSecondary
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = dept.name,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 15.sp,
                                color = SudanPrimary
                            )
                            Text(
                                text = "متاح (بكالوريوس ودبلوم) لجميع الدفعات",
                                fontSize = 11.sp,
                                color = Color.Gray
                            )
                        }
                    }

                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = null,
                        tint = Color.Gray
                    )
                }
            }
        }
    }
}

@Composable
fun DegreeAndBatchSelectionView(
    department: Department,
    selectedDegree: ProgramDegree?,
    onSelectDegree: (ProgramDegree) -> Unit,
    onSelectBatch: (ProgramDegree, BatchGroup) -> Unit
) {
    val activeDegree = selectedDegree ?: department.degrees.first()

    LazyColumn(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            Text(
                text = "قسم ${department.name} - اختر الدرجة العلمية:",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = SudanPrimary
            )
        }

        // Degree buttons (Bachelor / Diploma)
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                department.degrees.forEach { degree ->
                    val isSelected = degree.id == activeDegree.id
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isSelected) SudanPrimary else Color.White
                        ),
                        modifier = Modifier
                            .weight(1f)
                            .border(
                                width = if (isSelected) 2.dp else 1.dp,
                                color = if (isSelected) SudanPrimary else SudanCardBorder,
                                shape = RoundedCornerShape(12.dp)
                            )
                            .clickable { onSelectDegree(degree) }
                            .testTag("degree_tab_${degree.id}")
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.WorkspacePremium,
                                contentDescription = null,
                                tint = if (isSelected) SudanTertiary else SudanPrimary
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = degree.name,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "اختر الدفعة الدراسية لمشاهدة المقررات والملازم:",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = SudanPrimary
            )
        }

        items(activeDegree.batches, key = { it.id }) { batch ->
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (batch.isMerged) Color(0xFFFFFBEB) else Color.White
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        width = if (batch.isMerged) 1.5.dp else 1.dp,
                        color = if (batch.isMerged) Color(0xFFF59E0B) else SudanCardBorder,
                        shape = RoundedCornerShape(14.dp)
                    )
                    .clickable { onSelectBatch(activeDegree, batch) }
                    .testTag("batch_card_${batch.id}")
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = if (batch.isMerged) Color(0xFFD97706) else SudanPrimary
                            ) {
                                Text(
                                    text = batch.batchNumber,
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = batch.yearLabel,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = Color.DarkGray
                            )
                        }

                        Icon(Icons.Default.ArrowForwardIos, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(16.dp))
                    }

                    if (batch.isMerged && batch.mergedNotice != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = null,
                                tint = Color(0xFFD97706),
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = batch.mergedNotice,
                                fontSize = 11.sp,
                                color = Color(0xFF92400E),
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun BatchMaterialsView(
    universityName: String,
    facultyName: String,
    departmentName: String,
    degreeName: String,
    batch: BatchGroup,
    viewModel: PrintViewModel,
    onOrderClicked: () -> Unit
) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(14.dp)) {
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
                        Text(
                            text = "${batch.batchNumber} - ${batch.yearLabel}",
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White,
                            fontSize = 16.sp
                        )

                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = SudanTertiary
                        ) {
                            Text(
                                text = degreeName,
                                color = Color.Black,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "$universityName | $facultyName | $departmentName",
                        color = Color.White.copy(alpha = 0.85f),
                        fontSize = 11.sp
                    )

                    if (batch.isMerged && batch.mergedNotice != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = Color.White.copy(alpha = 0.15f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = batch.mergedNotice,
                                color = Color.White,
                                fontSize = 11.sp,
                                modifier = Modifier.padding(8.dp)
                            )
                        }
                    }
                }
            }
        }

        item {
            Text(
                text = "الملازم والامتحانات الجاهزة للطلب والطباعة:",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = SudanPrimary
            )
        }

        items(batch.materials, key = { it.id }) { material ->
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, SudanCardBorder, RoundedCornerShape(14.dp))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = if (material.materialType == "امتحانات سابقة") Color(0xFFFEF3C7) else Color(0xFFE0F2FE)
                        ) {
                            Text(
                                text = material.materialType,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (material.materialType == "امتحانات سابقة") Color(0xFFD97706) else Color(0xFF0369A1),
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }

                        if (material.isRecommended) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(2.dp))
                                Text("موصى بها", fontSize = 10.sp, color = Color(0xFFF59E0B), fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = material.title,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = SudanPrimary
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Person, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = material.doctorName, fontSize = 11.sp, color = Color.Gray)
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Description, contentDescription = null, tint = SudanSecondary, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = "${material.pageCount} صفحة", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SudanSecondary)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            viewModel.onFileSelected(
                                fileName = "${material.title}.pdf",
                                uri = "library_material_${material.id}",
                                sizeStr = "${(material.pageCount * 0.12).toString().take(3)} MB",
                                estimatedPages = material.pageCount
                            )
                            viewModel.notes.value = "طلب من المكتبة الإلكترونية: ${universityName} - ${facultyName} - ${departmentName} (${batch.batchNumber})"
                            onOrderClicked()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = SudanPrimary),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("order_material_btn_${material.id}")
                    ) {
                        Icon(Icons.Default.Print, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("اطلب طباعة الملازم مباشرة (${material.pageCount} صفحة)", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
