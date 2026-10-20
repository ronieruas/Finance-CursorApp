import ExpoModulesCore

public class C6NotificationListenerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("C6NotificationListener")

    AsyncFunction("getCapturedNotifications") {
      return [[String: Any]]()
    }

    AsyncFunction("clearCapturedNotifications") {
      return
    }

    AsyncFunction("removeCapturedNotification") { (_: String) in
      return
    }

    Function("isNotificationAccessGranted") {
      return false
    }

    AsyncFunction("openNotificationAccessSettings") {
      return
    }
  }
}
