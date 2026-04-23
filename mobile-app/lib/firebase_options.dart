// Firebase options — loaded from .env at runtime.
// This file is only needed if/when you add firebase_core to the project.
// Once firebase_core is added, uncomment the FirebaseOptions usage below.
// ignore_for_file: type=lint
import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Firebase configuration holder.
///
/// Credentials are loaded from .env at runtime.
/// Required .env keys:
///   FIREBASE_ANDROID_API_KEY, FIREBASE_ANDROID_APP_ID,
///   FIREBASE_IOS_API_KEY, FIREBASE_IOS_APP_ID,
///   FIREBASE_MESSAGING_SENDER_ID, FIREBASE_PROJECT_ID,
///   FIREBASE_STORAGE_BUCKET, FIREBASE_IOS_BUNDLE_ID
class DefaultFirebaseOptions {
  static Map<String, String> get android => {
    'apiKey': dotenv.env['FIREBASE_ANDROID_API_KEY'] ?? '',
    'appId': dotenv.env['FIREBASE_ANDROID_APP_ID'] ?? '',
    'messagingSenderId': dotenv.env['FIREBASE_MESSAGING_SENDER_ID'] ?? '',
    'projectId': dotenv.env['FIREBASE_PROJECT_ID'] ?? '',
    'storageBucket': dotenv.env['FIREBASE_STORAGE_BUCKET'] ?? '',
  };

  static Map<String, String> get ios => {
    'apiKey': dotenv.env['FIREBASE_IOS_API_KEY'] ?? '',
    'appId': dotenv.env['FIREBASE_IOS_APP_ID'] ?? '',
    'messagingSenderId': dotenv.env['FIREBASE_MESSAGING_SENDER_ID'] ?? '',
    'projectId': dotenv.env['FIREBASE_PROJECT_ID'] ?? '',
    'storageBucket': dotenv.env['FIREBASE_STORAGE_BUCKET'] ?? '',
    'iosBundleId': dotenv.env['FIREBASE_IOS_BUNDLE_ID'] ?? '',
  };
}
