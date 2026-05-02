import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:get/get.dart';
import 'package:loginapp/core/routes/app_routes.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:loginapp/core/utils/const.dart';

class NotificationService {
  static final NotificationService instance = NotificationService._();
  NotificationService._();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  final _supabase = Supabase.instance.client;

  Future<void> initialize() async {
    // Request permissions
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      Const.debug('User granted permission');
    } else {
      Const.debug('User declined or has not accepted permission');
    }

    // Initialize local notifications
    const AndroidInitializationSettings androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings();
    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse details) {
        _handleNotificationClick(details.payload);
      },
    );

    // Create Android notification channel
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel',
      'High Importance Notifications',
      description: 'This channel is used for important notifications.',
      importance: Importance.high,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    // Foreground listener
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      if (notification != null && android != null) {
        _localNotifications.show(
          notification.hashCode,
          notification.title,
          notification.body,
          NotificationDetails(
            android: AndroidNotificationDetails(
              channel.id,
              channel.name,
              channelDescription: channel.description,
              icon: android.smallIcon,
            ),
          ),
          payload: jsonEncode(message.data),
        );
      }
    });

    // Background/Terminated listener (when clicked)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _handleNotificationClick(jsonEncode(message.data));
    });

    // Check if app was opened from a terminated state
    RemoteMessage? initialMessage = await _fcm.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationClick(jsonEncode(initialMessage.data));
    }
  }

  void _handleNotificationClick(String? payload) {
    if (payload != null) {
      // Navigate to notification screen
      Get.toNamed(AppRoutes.notifications);
    }
  }

  Future<String?> getToken() async {
    try {
      return await _fcm.getToken();
    } catch (e) {
      Const.debug("Error getting FCM token: $e");
      return null;
    }
  }

  Future<void> updateTokenInSupabase() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;

    final token = await getToken();
    if (token == null) return;

    try {
      // We try to update the 'User' table if it exists, or just log the error if not.
      // Based on the schema, there is a 'User' table with an 'id' primary key.
      await _supabase.from('User').update({
        'fcm_token': token,
      }).eq('id', user.id);
      
      Const.debug("FCM Token updated in Supabase");
    } catch (e) {
      Const.debug("Error updating FCM token in Supabase: $e");
      // If the column doesn't exist, we might need to handle it or just fail silently in dev
    }
  }
}
