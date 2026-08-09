package com.example.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.example.R

/**
 * شعار A4 سودان بدون أي تشويه.
 *
 * النقاط المهمة للحفاظ على شكل الشعار كما هو:
 * 1) ContentScale.Fit -> يحافظ على أبعاد الصورة الأصلية (Aspect Ratio)
 *    ولا يمدّها أو يضغطها لتملأ المساحة.
 * 2) عدم إجبار العرض والارتفاع بنسب غير متناسبة.
 * 3) استخدام ContentScale.Fit يضمن عدم اقتصاص أو مط الشعار.
 */
@Composable
fun A4Logo(
    modifier: Modifier = Modifier,
    sizeDp: Dp = 96.dp
) {
    Image(
        painter = painterResource(id = R.drawable.a4_sudan_logo_new_1786259895565),
        contentDescription = "شعار A4 سودان",
        modifier = modifier.size(sizeDp),
        contentScale = ContentScale.Fit // السطر الأهم لمنع تغيّر شكل الشعار
    )
}

@Composable
fun A4LogoFlexible(
    modifier: Modifier = Modifier,
    heightDp: Dp = 48.dp
) {
    Image(
        painter = painterResource(id = R.drawable.a4_sudan_logo_new_1786259895565),
        contentDescription = "شعار A4 سودان",
        modifier = modifier.height(heightDp),
        contentScale = ContentScale.Fit
    )
}
