import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get/get.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:loginapp/core/routes/app_routes.dart';
import '../../utils/const.dart';
import '../bindings/app_bindings.dart';


class LocalStorage {

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static final _googleSignIn = GoogleSignIn();

  static Future<Map<String, dynamic>> storeData(String key, dynamic data) async {
    try {
      String valueToStore;
      if (data is String) {
        valueToStore = data;
      } else if (data is bool || data is int || data is double) {
        valueToStore = data.toString();
      } else if (data is Map || data is List) {
        valueToStore = jsonEncode(data);
      } else {
        return {"status": "fail", "msg": "Unsupported data type", "statusCode": 400};
      }
      await _storage.write(key: key, value: valueToStore);
      return {"status": "success", "msg": "Data Stored", "statusCode": 200};
    } catch (e) {
      return {"status": "fail", "msg": Const.errorMsg, "statusCode": 400};
    }
  }

  static Future<dynamic> getData(String key, {String? type = 'String'}) async {
    try {
      final data = await _storage.read(key: key);
      if (data == null) return null;

      if (type == 'String') {
        return data;
      } else if (type == 'bool') {
        return data == 'true';
      } else {
        return jsonDecode(data);
      }
    } catch (e) {
      return null;
    }
  }

  static Future<void> clear() async {
    await _storage.deleteAll();
    AppBindings().dependencies();
    Get.offAllNamed(AppRoutes.signIn);
  }

  static Future<void> logout() async {
    await _storage.deleteAll();
    await _googleSignIn.signOut();
    Get.offAllNamed(AppRoutes.signIn);
    AppBindings().dependencies();
  }
}