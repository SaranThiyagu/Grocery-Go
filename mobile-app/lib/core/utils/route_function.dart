import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';



class AppRoute {
  AppRoute._();

  static void getTo(Widget Function() route, {dynamic arguments,  String? routeName,Bindings? bindings}) {
    Get.to<dynamic>(
      route,
      arguments: arguments,
      transition: Transition.rightToLeft,
      duration: Duration(milliseconds: 300),
      routeName: routeName,
      binding: bindings,
    );
  }

  static void getOff(Widget Function() route, {dynamic arguments ,  String? routeName,Bindings? bindings}) {
    Get.off<dynamic>(
      route,
      arguments: arguments,
      transition: Transition.rightToLeft,
      routeName: routeName,
      binding: bindings,
    );
  }
  static void getOffAll(Widget Function() route, {dynamic arguments, String? routeName,Bindings? bindings}) {
    Get.offAll<dynamic>(
      route,
      arguments: arguments,
      transition: Transition.rightToLeft,
      routeName: routeName,
      binding: bindings,
    );
  }

  static void back(){
    Get.back();
  }

  static void pop(BuildContext context) {
    Navigator.pop(context);
  }

}
