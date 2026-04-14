
import 'package:get/get.dart';
import 'package:loginapp/core/app/controllers/global_controller.dart';

import '../controllers/auth_controller.dart';
import '../controllers/order_controller.dart';
import '../controllers/dashboard_controller.dart';
class AppBindings extends Bindings{
  @override
  void dependencies() {
    Get.put<AuthController>(AuthController(), permanent: true);
    Get.put<GlobalController>(GlobalController(), permanent: true);
    Get.put<OrderController>(OrderController(), permanent: true);
    Get.put<DashboardController>(DashboardController(), permanent: true);
  }

}