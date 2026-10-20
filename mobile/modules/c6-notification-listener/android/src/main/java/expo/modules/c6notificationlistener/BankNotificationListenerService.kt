package expo.modules.c6notificationlistener

import android.app.Notification
import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import org.json.JSONObject
import java.util.Locale

class BankNotificationListenerService : NotificationListenerService() {
  override fun onCreate() {
    super.onCreate()
    instance = this
  }

  override fun onListenerConnected() {
    super.onListenerConnected()
    instance = this
    // Ao conectar, varre as notificações que já estão sendo exibidas
    captureActiveNotifications()
  }

  override fun onDestroy() {
    if (instance === this) instance = null
    super.onDestroy()
  }

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    processNotification(sbn)
  }

  /**
   * Varre as notificações atualmente exibidas na barra/central de notificações
   * e persiste as que passarem pelo filtro. Retorna quantas foram processadas.
   */
  fun captureActiveNotifications(): Int {
    val items = try {
      activeNotifications ?: return 0
    } catch (_: Throwable) {
      return 0
    }

    var processed = 0
    for (sbn in items) {
      if (processNotification(sbn)) processed++
    }
    return processed
  }

  private fun processNotification(sbn: StatusBarNotification?): Boolean {
    if (sbn == null) return false
    val notification = sbn.notification ?: return false
    val extras = notification.extras ?: return false

    val packageName = sbn.packageName ?: return false
    if (packageName == applicationContext.packageName) return false

    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.trim().orEmpty()
    val text = (
      extras.getCharSequence(Notification.EXTRA_BIG_TEXT)
        ?: extras.getCharSequence(Notification.EXTRA_TEXT)
      )?.toString()?.trim().orEmpty()
    val subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString()?.trim().orEmpty()
    val appLabel = getAppLabel(packageName)

    val combined = listOf(appLabel, packageName, title, text, subText)
      .joinToString(" ")
      .lowercase(Locale.ROOT)

    if (!combined.contains("r$")) return false

    val isSupportedBank =
      combined.contains("c6") ||
      combined.contains("c6 bank") ||
      combined.contains("nubank") ||
      combined.contains("nupay") ||
      combined.contains("cartao nubank") ||
      combined.contains("cartão nubank")

    if (!isSupportedBank) return false

    val item = JSONObject().apply {
      put("id", buildId(packageName, sbn.postTime, title, text))
      put("packageName", packageName)
      put("appLabel", appLabel)
      put("title", title)
      put("text", text)
      put("subText", subText)
      put("postedAt", sbn.postTime)
      put("capturedAt", System.currentTimeMillis())
    }

    NotificationCaptureStore.append(applicationContext, item)
    return true
  }

  private fun getAppLabel(packageName: String): String {
    return try {
      val appInfo = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
      packageManager.getApplicationLabel(appInfo)?.toString().orEmpty()
    } catch (_: Throwable) {
      packageName
    }
  }

  private fun buildId(packageName: String, postedAt: Long, title: String, text: String): String {
    val contentHash = "${title.trim()}|${text.trim()}".hashCode().toUInt().toString(16)
    return "${packageName}_${postedAt}_$contentHash"
  }

  companion object {
    @Volatile
    var instance: BankNotificationListenerService? = null

    /** Aciona a leitura das notificações em exibição; pede reconexão se o serviço ainda não estiver ativo. */
    fun requestActiveCapture(context: Context): Int {
      val service = instance
      if (service != null) {
        return try {
          service.captureActiveNotifications()
        } catch (_: Throwable) {
          0
        }
      }
      // Serviço não conectado: solicita reconexão. A varredura ocorrerá em onListenerConnected.
      return try {
        requestRebind(ComponentName(context, BankNotificationListenerService::class.java))
        0
      } catch (_: Throwable) {
        0
      }
    }
  }
}
