import 'dart:developer';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
//import 'package:path/path.dart' as path;


import 'colors.dart';
class Const {

  static final double screenWidth = 427;

  static const double smallWidth = 360;
  static const double mediumWidth = 414;

  static const double smallHeight = 640;
  static const double mediumHeight = 800;


  static const String fetchErrorMsg = "Failed to fetch details. Kindly check after some times.";
  static const String errorMsg = "Something went wrong. Please try again later.";

  static const String formData = "multipart/form-data";
  static const String dot = "\u2022";



  static var allowOnlyAlphabets  = RegExp(r'^[a-zA-Z\s]+$');
  static var allowOnlyNumbers    = RegExp("[0-9]");
  static var emailValidation     = RegExp(r'^.+@[a-zA-Z]+\.{1}[a-zA-Z]+(\.{0,1}[a-zA-Z]+)$');
  static var passwordValidation  = RegExp(r'^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#\$&*~]).{8,}$');
  static var mobileValidation     = RegExp(r'^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$');

  static var unFocus = FocusManager.instance.primaryFocus?.unfocus();

  static  Map<String,dynamic> successMap(dynamic data){
    return {"status":"success","statusCode":200,"data":data,"message":"success"};
  }
  static  Map<String,dynamic> errorMap({dynamic data}){
    return {"status":"fail","statusCode":400,"message":data ?? errorMsg};
  }

  static final Shader linearGradient = LinearGradient(
    colors: <Color>[
      ColorStyles.colors01,
      ColorStyles.colors02,
      ColorStyles.colors03
    ],
  ).createShader(Rect.fromLTWH(0.0, 0.0, 500.0, 200.0));

  static final Shader greyGradient = LinearGradient(
    colors: <Color>[
      ColorStyles.fontGrayColor01,
      ColorStyles.fontGrayColor02,
      ColorStyles.fontGrayColor03
    ],
  ).createShader(Rect.fromLTWH(0.0, 0.0, 500.0, 200.0));

  // static double checkSmallDevice(double val1,val2){
  //   bool isSmall = Const.width < Const.screenWidth;
  //   return isSmall ? val1 : val2;
  // }

  static String getCurrentDateTime() {
    final now = DateTime.now().toUtc().add(const Duration(hours: 5, minutes: 30));
    String formatted =
        "${now.toIso8601String().split('.').first}.${now.millisecond.toString().padLeft(3, '0')}+00:00";
    return formatted;
  }



  static Future<void> debug(dynamic info)async{
    log("==================================================");
    log(info.toString());
    log("==================================================");

  }

  static String getFormattedDate(String stringDate) {
    try {
      final parts = stringDate.split(' ');

      final month = _monthToNumber(parts[1]);
      final day = parts[2];
      final year = parts[3];
      final time = parts[4];
      final offset = parts[5].replaceFirst('GMT', '');

      final isoString = "$year-$month-${day}T$time$offset";
      DateTime date = DateTime.parse(isoString).toLocal();

      return DateFormat('dd/MM/yyyy').format(date);
    } catch (e) {
      debug(e);
      return stringDate;
    }
  }

  static String _monthToNumber(String month) {
    const months = {
      'Jan': '01',
      'Feb': '02',
      'Mar': '03',
      'Apr': '04',
      'May': '05',
      'Jun': '06',
      'Jul': '07',
      'Aug': '08',
      'Sep': '09',
      'Oct': '10',
      'Nov': '11',
      'Dec': '12',
    };
    return months[month] ?? '01';
  }

  static Object monthToInt(String month) {
    const months = {
      'Jan': 1,
      'Feb': 2,
      'Mar': 3,
      'Apr': 4,
      'May': 5,
      'Jun': 6,
      'Jul': 7,
      'Aug': 8,
      'Sep': 9,
      'Oct': 10,
      'Nov': 11,
      'Dec': 12,
    };
    return months[month] ?? 0;
  }

  static String formatToJsDateString(DateTime date) {
    final String weekday = DateFormat('EEE').format(date);
    final String month = DateFormat('MMM').format(date);
    final String day = date.day.toString().padLeft(2, '0');
    final String year = date.year.toString();
    final String time = DateFormat('HH:mm:ss').format(date);

    final Duration offset = date.timeZoneOffset;
    final String sign = offset.isNegative ? '-' : '+';
    final int hours = offset.inHours.abs();
    final int minutes = (offset.inMinutes.abs() % 60);
    final String offsetStr = '$sign${hours.toString().padLeft(2, '0')}${minutes.toString().padLeft(2, '0')}';

    final String timeZoneName = date.timeZoneName;

    return "$weekday $month $day $year $time GMT$offsetStr ($timeZoneName)";
  }

 static String formatDate(String isoDateString) {
    DateTime dateTime = DateTime.parse(isoDateString).toLocal();
    return DateFormat('dd/MM/yyyy').format(dateTime);
  }

  static String getFormattedDateRange(String date) {
    if(date.isEmpty) {
      return "";
    }
    final String result = DateFormat('d MMM y').format(DateTime(int.parse(date.split('/')[2]), int.parse(date.split('/')[1]), int.parse(date.split('/')[0])));
    return result;
  }

  // static Future<Map<String,dynamic>?> getCompressed(File file)async{
  //   try{
  //     String fileName = file.path.split("/").last;
  //     String filePath = file.path;
  //     final dir = path.dirname(file.path);
  //     final targetPath = '$dir/compressed_${path.basename(file.path)}';
  //
  //     final compressedFile = await FlutterImageCompress.compressAndGetFile(
  //       file.path,
  //       targetPath,
  //       quality: 50,
  //
  //     );
  //     if (compressedFile == null) {
  //       errorToast(BuildContext as BuildContext,"Failed to compress image");
  //       return {};
  //     }
  //     return {
  //       "file":compressedFile.path,
  //       "fileName":fileName,
  //       "filePath":filePath,
  //     };
  //
  //   }catch(e){
  //     debug({"path":"Cont","error":e.toString(),"function":"getCompressed"});
  //     return null;
  //   }
  // }

  // static void showSettingsDialog(BuildContext context) {
  //   showDialog(
  //     context: context,
  //     builder: (_) => AlertDialog(
  //       title: const Text("Permission Required"),
  //       content: const Text("Camera permission is permanently denied. Please enable it from app settings."),
  //       actions: [
  //         TextButton(
  //           onPressed: () {
  //             Navigator.pop(context);
  //           },
  //           child: const Text("Cancel"),
  //         ),
  //         TextButton(
  //           onPressed: () {
  //             final settings = OpenSettingsPlus.shared;
  //             if (settings is OpenSettingsPlusAndroid) {
  //               settings.appSettings();
  //             }
  //             else if (settings is OpenSettingsPlusIOS) {
  //               settings.photosAndCamera();
  //             }
  //             Navigator.pop(context);
  //           },
  //           child: const Text("Open Settings"),
  //         ),
  //       ],
  //     ),
  //   );
  // }
  // static  choosePaymentGateWay(BuildContext context,{dynamic data, VoidCallback? callback1, VoidCallback? callback2,}){
  //     return CustomAlert.alertForEverything(
  //     builder: (set) {
  //       return Padding(
  //         padding: EdgeInsets.symmetric(horizontal: Width.size10),
  //         child: Column(
  //           crossAxisAlignment: CrossAxisAlignment.center,
  //           mainAxisSize: MainAxisSize.min,
  //           children: [
  //             TextWidget(
  //               text: "Select payment gateway",
  //               fontSize: FontSize.size14,
  //               fontWeight: FontWeight.w700,
  //             ),
  //
  //             VerticalSpace(height: Height.size10),
  //            if (data['payment_option'] == "both") ...[
  //               ContainerWidget(
  //                 padding: EdgeInsets.symmetric(
  //                   vertical: Height.size8,
  //                   horizontal: Width.size10,
  //                 ),
  //                 borderRadius: BorderRadius.circular(BorderRadiusSize.size30),
  //                 borderColor: ColorStyles.primaryColor,
  //                 callback: callback1,
  //                 child: Center(
  //                   child: SvgPicture.asset(
  //                     Assets.cashFree,
  //                     height: Height.size35,
  //                     width: Width.size35,
  //                   ),
  //                 ),
  //               ),
  //               VerticalSpace(height: Height.size10),
  //
  //               ContainerWidget(
  //                 padding: EdgeInsets.symmetric(
  //                   vertical: Height.size8,
  //                   horizontal: Width.size10,
  //                 ),
  //                 borderRadius: BorderRadius.circular(BorderRadiusSize.size30),
  //                 borderColor: ColorStyles.primaryColor,
  //                 callback: callback2,
  //                 child: Center(
  //                   child: SvgPicture.asset(
  //                     Assets.razorpay,
  //                     height: Height.size35,
  //                     width: Width.size35,
  //                   ),
  //                 ),
  //               ),
  //               VerticalSpace(height: Height.size10),
  //             ] else if (data['payment_option'] == "cashfree_only") ...[
  //               ContainerWidget(
  //                 padding: EdgeInsets.symmetric(
  //                   vertical: Height.size8,
  //                   horizontal: Width.size10,
  //                 ),
  //                 borderRadius: BorderRadius.circular(BorderRadiusSize.size30),
  //                 borderColor: ColorStyles.primaryColor,
  //                 callback: callback1,
  //                 child: Center(
  //                   child: SvgPicture.asset(
  //                     Assets.cashFree,
  //                     height: Height.size35,
  //                     width: Width.size35,
  //                   ),
  //                 ),
  //               ),
  //               VerticalSpace(height: Height.size10),
  //             ] else if (data['payment_option'] == "razorpay_only") ...[
  //               ContainerWidget(
  //                 padding: EdgeInsets.symmetric(
  //                   vertical: Height.size8,
  //                   horizontal: Width.size10,
  //                 ),
  //                 borderRadius: BorderRadius.circular(BorderRadiusSize.size30),
  //                 borderColor: ColorStyles.primaryColor,
  //                 callback: callback2,
  //                 child: Center(
  //                   child: SvgPicture.asset(
  //                     Assets.razorpay,
  //                     height: Height.size35,
  //                     width: Width.size35,
  //                   ),
  //                 ),
  //               ),
  //               VerticalSpace(height: Height.size10),
  //             ],
  //
  //             ContainerWidget(
  //               width: double.infinity,
  //               padding: EdgeInsets.symmetric(
  //                 vertical: Height.size8,
  //                 horizontal: Width.size10,
  //               ),
  //               borderRadius: BorderRadius.circular(BorderRadiusSize.size30),
  //               child: Center(
  //                 child: TextWidget(
  //                   text: "Cancel",
  //                   fontSize: Const.buttonTextSize,
  //                 ),
  //               ),
  //               callback: () => AppRoute.pop(context),
  //             ),
  //           ],
  //         ),
  //       );
  //     },
  //     context: context,
  //   );
  // }


  static const String heroTage1 = "tag1";


  ////////////////////////// Local storage keys //////////////////////////


  static const String id = "id";
  static const String name = "name";
  static const String email = "email";
  static const String mobile = "mobile";
  static const String picture = "picture";
  static const String fcmToken = "fcmToken";

}