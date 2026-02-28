import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)
    
    // Add custom notification for screen recording / screenshots if needed
    // But mostly rely on screen_protector plugin which is registered above
    
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
