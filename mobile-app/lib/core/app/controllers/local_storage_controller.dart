import 'dart:convert';

import 'package:google_sign_in/google_sign_in.dart';
import 'package:loginapp/features/auth/sigin.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../utils/const.dart';
import '../../utils/route_function.dart';
import '../bindings/app_bindings.dart';


class LocalStorage{

  static final  _googleSignIn = GoogleSignIn();

  static Future<Map<String,dynamic>> storeData(String key, dynamic data)async{
    try{
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      if (data is String) {
        await prefs.setString(key, data);
      } else if (data is bool) {
        await prefs.setBool(key, data);
      } else if (data is int) {
        await prefs.setInt(key, data);
      } else if (data is double) {
        await prefs.setDouble(key, data);
      } else if (data is List<String>) {
        await prefs.setStringList(key, data);
      } else if (data is Map || data is List) {
        String jsonString = jsonEncode(data);
        await prefs.setString(key, jsonString);
      } else {
        return {"status": "fail", "msg": "Unsupported data type", "statusCode": 400};
      }
      return {"status":"success","msg":"Data Stored","statusCode":200};
    }catch(e){
      return {"status":"fail","msg":Const.errorMsg,"statusCode":400};
    }
  }

  static Future<dynamic> getData(String key,{String? type = 'String'})async{
    try{
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      if(type == 'String'){
        final data = prefs.getString(key);
        return data;
      }else if (type == "bool"){
        final data = prefs.getBool(key);
        return data;
      } else {
        final data = prefs.getString(key);
        return jsonDecode(data!);
      }
    }catch(e){
      return null;

    }
  }

  static Future<void> clear()async{
    final SharedPreferences prefs = await SharedPreferences.getInstance();

     AppBindings().dependencies();
     AppRoute.getOffAll(()=>SigIn());
  }

  static Future<void> logout()async{
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    await _googleSignIn.signOut();
    AppRoute.getOffAll(()=>SigIn());
    AppBindings().dependencies();
    // AppBindings().dependencies();
  }
}