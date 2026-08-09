package com.example

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.NoteAdd
import androidx.compose.material.icons.filled.Print
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.example.ui.PrintViewModel
import com.example.ui.components.ArabicTopHeader
import com.example.ui.screens.AdminPanelScreen
import com.example.ui.screens.LibraryScreen
import com.example.ui.screens.OrderTrackerScreen
import com.example.ui.screens.StudentOrderScreen
import com.example.ui.theme.A4SudanTheme
import com.example.ui.theme.SudanPrimary
import com.example.ui.theme.SudanSecondary
import com.example.util.NotificationHelper

class MainActivity : ComponentActivity() {
    private val viewModel: PrintViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        NotificationHelper.createNotificationChannel(this)

        val searchOrderFromIntent = intent?.getStringExtra("SEARCH_ORDER_NO") ?: ""

        setContent {
            A4SudanTheme {
                MainAppScreen(
                    viewModel = viewModel,
                    initialIntentOrderNo = searchOrderFromIntent
                )
            }
        }
    }
}

@Composable
fun MainAppScreen(
    viewModel: PrintViewModel,
    initialIntentOrderNo: String = ""
) {
    val context = LocalContext.current
    var selectedTab by remember { mutableIntStateOf(if (initialIntentOrderNo.isNotEmpty()) 1 else 0) }
    var trackerInitialQuery by remember { mutableStateOf(initialIntentOrderNo) }

    // Request notification permission on Android 13+
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { _ -> }

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            ArabicTopHeader()
        },
        bottomBar = {
            NavigationBar(
                containerColor = Color.White,
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.MenuBook, contentDescription = "المكتبة") },
                    label = { Text("المكتبة", fontWeight = FontWeight.Bold, fontSize = 12.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = SudanPrimary,
                        selectedTextColor = SudanPrimary,
                        indicatorColor = SudanSecondary.copy(alpha = 0.2f)
                    ),
                    modifier = Modifier.testTag("tab_library")
                )

                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.NoteAdd, contentDescription = "رفع ملف جديد") },
                    label = { Text("رفع ملف", fontWeight = FontWeight.Bold, fontSize = 12.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = SudanPrimary,
                        selectedTextColor = SudanPrimary,
                        indicatorColor = SudanSecondary.copy(alpha = 0.2f)
                    ),
                    modifier = Modifier.testTag("tab_student_order")
                )

                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.LocalShipping, contentDescription = "متابعة الطلب") },
                    label = { Text("متابعة الطلب", fontWeight = FontWeight.Bold, fontSize = 12.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = SudanPrimary,
                        selectedTextColor = SudanPrimary,
                        indicatorColor = SudanSecondary.copy(alpha = 0.2f)
                    ),
                    modifier = Modifier.testTag("tab_order_tracker")
                )

                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(Icons.Default.AdminPanelSettings, contentDescription = "لوحة التحكم") },
                    label = { Text("لوحة التحكم", fontWeight = FontWeight.Bold, fontSize = 12.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = SudanPrimary,
                        selectedTextColor = SudanPrimary,
                        indicatorColor = SudanSecondary.copy(alpha = 0.2f)
                    ),
                    modifier = Modifier.testTag("tab_admin_panel")
                )
            }
        }
    ) { innerPadding ->
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (selectedTab) {
                0 -> LibraryScreen(
                    viewModel = viewModel,
                    onSendMaterialToCheckout = {
                        selectedTab = 1
                    }
                )
                1 -> StudentOrderScreen(
                    viewModel = viewModel,
                    onNavigateToTracker = { orderNo ->
                        trackerInitialQuery = orderNo
                        selectedTab = 2
                    }
                )
                2 -> OrderTrackerScreen(
                    viewModel = viewModel,
                    initialSearchQuery = trackerInitialQuery
                )
                3 -> AdminPanelScreen(
                    viewModel = viewModel
                )
            }
        }
    }
}

