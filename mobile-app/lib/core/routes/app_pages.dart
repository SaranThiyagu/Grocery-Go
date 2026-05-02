import 'package:get/get.dart';
import 'package:loginapp/features/auth/sign_in.dart';
import 'package:loginapp/features/cart/cart_screen.dart';
import 'package:loginapp/features/dashboard/dashboard.dart';
import 'package:loginapp/features/order/order_screen.dart';
import 'package:loginapp/features/profile/profile_screen.dart';
import 'package:loginapp/features/notification/notification_screen.dart';

import 'app_routes.dart';

class AppPages {
  static final pages = [
    GetPage(
      name: AppRoutes.signIn,
      page: () => const SignIn(),
      transition: Transition.rightToLeft,
      transitionDuration: const Duration(milliseconds: 300),
    ),
    GetPage(
      name: AppRoutes.dashboard,
      page: () => const Dashboard(),
      transition: Transition.rightToLeft,
      transitionDuration: const Duration(milliseconds: 300),
    ),
    GetPage(
      name: AppRoutes.order,
      page: () => const OrderScreen(),
      transition: Transition.rightToLeft,
      transitionDuration: const Duration(milliseconds: 300),
    ),
    GetPage(
      name: AppRoutes.cart,
      page: () => const CartScreen(),
      transition: Transition.rightToLeft,
      transitionDuration: const Duration(milliseconds: 300),
    ),
    GetPage(
      name: AppRoutes.profile,
      page: () => const ProfileScreen(),
      transition: Transition.rightToLeft,
      transitionDuration: const Duration(milliseconds: 300),
    ),
    GetPage(
      name: AppRoutes.notifications,
      page: () => const NotificationScreen(),
      transition: Transition.rightToLeft,
      transitionDuration: const Duration(milliseconds: 300),
    ),
  ];
}
