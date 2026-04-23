import 'package:get/get.dart';
import 'package:loginapp/core/app/controllers/local_storage_controller.dart' as app_storage;
import 'package:loginapp/core/utils/const.dart';

class GlobalController extends GetxController{
  RxString name = "".obs;
  RxString email = "".obs;
  RxString picture = "".obs;
  RxString mobile = "".obs;
  RxBool isLoading = false.obs;



  Future<void> loadData()async{
    name.value = await app_storage.LocalStorage.getData(Const.name) ?? "";
    email.value = await app_storage.LocalStorage.getData(Const.email) ?? "";
    picture.value = await app_storage.LocalStorage.getData(Const.picture) ?? "";
    mobile.value = await app_storage.LocalStorage.getData(Const.mobile) ?? "";
  }
}