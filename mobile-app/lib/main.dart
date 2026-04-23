import 'package:flutter/material.dart';
import 'package:get/get_navigation/src/root/get_material_app.dart';
import 'package:loginapp/core/app/bindings/app_bindings.dart';
import 'package:loginapp/core/routes/app_pages.dart';
import 'package:toastification/toastification.dart';

import 'core/widgets/app_entry.dart';
import 'core/utils/responsive_utils.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final supabase = Supabase.instance.client;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(fileName: ".env");
  
  await Supabase.initialize(
    url: dotenv.env['SUPABASE_URL'] ?? '',
    anonKey: dotenv.env['SUPABASE_ANON_KEY'] ?? '',
  );

  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});


  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        ResponsiveConfig.init(
          constraints.maxWidth,
          constraints.maxHeight,
        );
        return ToastificationWrapper(
          child: GetMaterialApp(
            debugShowCheckedModeBanner: false,
            initialBinding: AppBindings(),
            getPages: AppPages.pages,
            home: AppEntry(),
          ),
        );
      },
    );
  }
}
