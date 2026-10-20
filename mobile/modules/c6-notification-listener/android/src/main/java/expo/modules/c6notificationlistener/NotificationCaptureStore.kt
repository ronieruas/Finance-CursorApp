package expo.modules.c6notificationlistener

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

private const val PREFS_NAME = "c6_notification_listener"
private const val STORAGE_KEY = "captured_notifications"
private const val MAX_ITEMS = 100

object NotificationCaptureStore {
  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  @Synchronized
  fun getAll(context: Context): JSONArray {
    val raw = prefs(context).getString(STORAGE_KEY, "[]") ?: "[]"
    return try {
      JSONArray(raw)
    } catch (_: Throwable) {
      JSONArray()
    }
  }

  @Synchronized
  fun save(context: Context, items: JSONArray) {
    prefs(context).edit().putString(STORAGE_KEY, items.toString()).apply()
  }

  @Synchronized
  fun append(context: Context, item: JSONObject) {
    val existing = getAll(context)
    val next = JSONArray()
    next.put(item)

    val newId = item.optString("id")
    for (i in 0 until existing.length()) {
      val current = existing.optJSONObject(i) ?: continue
      if (current.optString("id") == newId) continue
      if (next.length() >= MAX_ITEMS) break
      next.put(current)
    }

    save(context, next)
  }

  @Synchronized
  fun remove(context: Context, id: String) {
    val existing = getAll(context)
    val next = JSONArray()
    for (i in 0 until existing.length()) {
      val current = existing.optJSONObject(i) ?: continue
      if (current.optString("id") == id) continue
      next.put(current)
    }
    save(context, next)
  }

  @Synchronized
  fun clear(context: Context) {
    save(context, JSONArray())
  }
}
