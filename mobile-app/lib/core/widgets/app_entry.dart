import 'package:flutter/material.dart';
import 'package:get/get_core/src/get_main.dart';
import 'package:get/get_instance/src/extension_instance.dart';
import 'package:get/get_state_manager/src/rx_flutter/rx_obx_widget.dart';
import 'package:loginapp/features/auth/sigin.dart';
import 'package:loginapp/features/test_screen/test_screen.dart';

import '../../features/dashboard/dashboard.dart';
import '../../features/responsive/responsive.dart';
import '../app/controllers/auth_controller.dart';
import '../utils/colors.dart';

class AppEntry extends StatefulWidget {
  const AppEntry({super.key});

  @override
  State<AppEntry> createState() => _AppEntryState();
}

class _AppEntryState extends State<AppEntry> {
  final authController = Get.find<AuthController>();

  @override
  void initState() {
    super.initState();
    authController.checkAuthState();
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() {

      switch (authController.authState.value) {
        case AuthState.loading:
          return Scaffold(body:  Center(child: CircularProgressIndicator(color: ColorStyles.primaryColor)));

        case AuthState.authenticated:
          return Dashboard();

        case AuthState.unauthenticated:
          return SigIn();
      }
    });
  }
}
