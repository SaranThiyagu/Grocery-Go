import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:loginapp/core/app/controllers/local_storage_controller.dart';
import 'package:loginapp/core/utils/const.dart';

class GlobalController extends GetxController{
  RxString name = "".obs;
  RxString email = "".obs;
  RxString picture = "".obs;
  RxString mobile = "".obs;
  RxBool isLoading = false.obs;



  Future<void> loadData()async{
    name.value = await LocalStorage.getData(Const.name) ?? "";
    email.value = await LocalStorage.getData(Const.email) ?? "";
    picture.value = await LocalStorage.getData(Const.picture) ?? "";
    mobile.value = await LocalStorage.getData(Const.mobile) ?? "";
  }
}