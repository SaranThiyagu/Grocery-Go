import 'package:flutter/material.dart';
import 'package:loginapp/core/utils/responsive_utils.dart';
import 'package:loginapp/core/widgets/text_widget.dart';
import 'package:toastification/toastification.dart';




 ToastificationItem errorToast(BuildContext context,String error){
   return toastification.show(
     type: ToastificationType.error,
     style: ToastificationStyle.flat,
     title: TextWidget(text: error,fontSize:context.scale(10),),
     autoCloseDuration:  Duration(seconds: 5),
     alignment: Alignment.bottomCenter,
     dragToClose: true,
     pauseOnHover: true
   );
 }

ToastificationItem successToast(BuildContext context,String success){
  return toastification.show(
    type: ToastificationType.success,
    style: ToastificationStyle.flat,
    title: TextWidget(text: success,fontSize:context.scale(10),),
    autoCloseDuration:  Duration(seconds: 5),
    alignment: Alignment.bottomCenter,
    dragToClose: true,
    pauseOnHover: true,
  );
}

ToastificationItem infoToast(BuildContext context,String success,{int? seconds = 10}) {
  return toastification.show(
    type: ToastificationType.info,
    style: ToastificationStyle.flat,
    title: TextWidget(text: success, fontSize:context.scale(10),),
    autoCloseDuration: Duration(seconds: seconds!),
    alignment: Alignment.bottomCenter,
    dragToClose: true,
    pauseOnHover: true,
  );
}