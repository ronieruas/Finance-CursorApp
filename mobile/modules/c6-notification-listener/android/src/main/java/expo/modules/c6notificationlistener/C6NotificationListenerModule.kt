package expo.modules.c6notificationlistener

import android.content.ComponentName
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray

class C6NotificationListenerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("C6NotificationListener")

    AsyncFunction("getCapturedNotifications") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      jsonArrayToList(NotificationCaptureStore.getAll(context))
    }

    // Lê as notificações que ainda estão sendo exibidas no aparelho
    AsyncFunction("syncActiveNotifications") { promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.reject(Exceptions.ReactContextLost())
        return@AsyncFunction
      }
      Handler(Looper.getMainLooper()).post {
        try {
          promise.resolve(BankNotificationListenerService.requestActiveCapture(context))
        } catch (error: Throwable) {
          promise.reject("E_ACTIVE_CAPTURE", error.message ?: "Falha ao ler notificações exibidas", error)
        }
      }
    }

    AsyncFunction("clearCapturedNotifications") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      NotificationCaptureStore.clear(context)
    }

    AsyncFunction("removeCapturedNotification") { id: String ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      NotificationCaptureStore.remove(context, id)
    }

    Function("isNotificationAccessGranted") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val enabled = Settings.Secure.getString(
        context.contentResolver,
        "enabled_notification_listeners"
      ).orEmpty()
      enabled.contains(ComponentName(context, BankNotificationListenerService::class.java).flattenToString())
    }

    AsyncFunction("openNotificationAccessSettings") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }
  }

  private fun jsonArrayToList(array: JSONArray): List<Map<String, Any?>> {
    val items = mutableListOf<Map<String, Any?>>()
    for (i in 0 until array.length()) {
      val obj = array.optJSONObject(i) ?: continue
      items.add(
        mapOf(
          "id" to obj.optString("id"),
          "packageName" to obj.optString("packageName"),
          "appLabel" to obj.optString("appLabel"),
          "title" to obj.optString("title"),
          "text" to obj.optString("text"),
          "subText" to obj.optString("subText"),
          "postedAt" to obj.optLong("postedAt"),
          "capturedAt" to obj.optLong("capturedAt")
        )
      )
    }
    return items
  }
}
