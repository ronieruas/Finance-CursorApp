package expo.modules.c6notificationlistener

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

private const val PREFS_NAME = "c6_notification_listener"
private const val STORAGE_KEY = "captured_notifications"
private const val DISMISSED_KEY = "dismissed_notification_ids"
private const val MAX_ITEMS = 100
private const val MAX_DISMISSED = 300

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

  /**
   * Ids já descartados/limpos pelo usuário. Como o id de uma notificação é estável,
   * guardá-lo evita que a releitura das notificações ainda exibidas as traga de volta.
   */
  @Synchronized
  private fun getDismissed(context: Context): JSONArray {
    val raw = prefs(context).getString(DISMISSED_KEY, "[]") ?: "[]"
    return try {
      JSONArray(raw)
    } catch (_: Throwable) {
      JSONArray()
    }
  }

  @Synchronized
  private fun addDismissed(context: Context, ids: List<String>) {
    if (ids.isEmpty()) return
    val current = getDismissed(context)
    val next = JSONArray()
    val seen = mutableSetOf<String>()
    for (id in ids) {
      if (id.isNotEmpty() && seen.add(id)) next.put(id)
    }
    for (i in 0 until current.length()) {
      val id = current.optString(i)
      if (id.isNotEmpty() && seen.add(id)) next.put(id)
    }
    // Mantém apenas os mais recentes para o conjunto não crescer indefinidamente
    if (next.length() > MAX_DISMISSED) {
      val trimmed = JSONArray()
      for (i in next.length() - MAX_DISMISSED until next.length()) trimmed.put(next.optString(i))
      prefs(context).edit().putString(DISMISSED_KEY, trimmed.toString()).apply()
      return
    }
    prefs(context).edit().putString(DISMISSED_KEY, next.toString()).apply()
  }

  @Synchronized
  private fun isDismissed(context: Context, id: String): Boolean {
    if (id.isEmpty()) return false
    val current = getDismissed(context)
    for (i in 0 until current.length()) {
      if (current.optString(i) == id) return true
    }
    return false
  }

  @Synchronized
  fun append(context: Context, item: JSONObject) {
    val newId = item.optString("id")
    if (isDismissed(context, newId)) return

    val existing = getAll(context)
    val next = JSONArray()
    next.put(item)

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
    addDismissed(context, listOf(id))
  }

  @Synchronized
  fun clear(context: Context) {
    val existing = getAll(context)
    val ids = mutableListOf<String>()
    for (i in 0 until existing.length()) {
      val current = existing.optJSONObject(i) ?: continue
      ids.add(current.optString("id"))
    }
    save(context, JSONArray())
    addDismissed(context, ids)
  }
}
