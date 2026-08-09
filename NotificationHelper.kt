package com.example.util

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.example.MainActivity

object NotificationHelper {
    const val CHANNEL_ID = "order_status_channel"
    const val CHANNEL_NAME = "حالة طلبات الطباعة"

    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val descriptionText = "إشعارات فورية لتحديثات حالة طلبات الطباعة والتوصيل"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, importance).apply {
                description = descriptionText
                enableVibration(true)
            }
            val notificationManager: NotificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    fun showOrderStatusNotification(
        context: Context,
        orderNumber: String,
        studentName: String,
        newStatus: String
    ) {
        createNotificationChannel(context)

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("SEARCH_ORDER_NO", orderNumber)
        }

        val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val pendingIntent: PendingIntent = PendingIntent.getActivity(
            context,
            orderNumber.hashCode(),
            intent,
            pendingIntentFlags
        )

        val (title, body) = when (newStatus) {
            "PRINTING" -> Pair(
                "🖨️ بدأت طباعة طلبك ($orderNumber)",
                "مرحباً $studentName، بدأ المركز الآن بطباعة مستندك الإلكتروني بنجاح."
            )
            "DELIVERY" -> Pair(
                "🚚 طلبك في الطريق ($orderNumber)",
                "يا $studentName، تم تسليم المطبوعات للمندوب وهو في الطريق إلى كليتك/جامعتك."
            )
            "COMPLETED" -> Pair(
                "🎉 تم تسليم الطلب بنجاح ($orderNumber)",
                "تم تسليم مستنداتك المطبوعة بنجاح. شكراً لاستخدامك تطبيق A4 سودان!"
            )
            "RECEIVED" -> Pair(
                "📥 تم تأكيد استلام الطلب ($orderNumber)",
                "مرحباً $studentName، تم استلام طلبك ومراجعته وهو بانتظار بدء الطباعة."
            )
            else -> Pair(
                "🔔 تحديث حالة الطلب ($orderNumber)",
                "تغيرت حالة طلبك إلى: $newStatus"
            )
        }

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)

        try {
            val notificationManager = NotificationManagerCompat.from(context)
            notificationManager.notify(orderNumber.hashCode(), builder.build())
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }
}
