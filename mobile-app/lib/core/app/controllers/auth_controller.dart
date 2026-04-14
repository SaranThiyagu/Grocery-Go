

import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:get/get.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:loginapp/core/app/controllers/local_storage_controller.dart';
import 'package:loginapp/core/utils/const.dart';

enum AuthState { authenticated, unauthenticated,loading }

class AuthController  extends GetxController{
  RxBool isLoading = false.obs;
  final _googleSignIn = GoogleSignIn();
  final _firebase =   FirebaseAuth.instance;
  final Rx<AuthState> authState = AuthState.loading.obs;

  Future<UserCredential?> signInWithGmail()async{
    try{
      isLoading.value = true;
      final account = await _googleSignIn.signIn();
      if (account == null) {
        isLoading.value = false;
        return null;
      }

      final auth = await account.authentication;
      final crd = GoogleAuthProvider.credential(idToken: auth.idToken, accessToken: auth.accessToken);
      isLoading.value = false;
      return await _firebase.signInWithCredential(crd);
    }catch(e){
      Const.debug({"error":e});
      isLoading.value = false;
      return null;
    }
  }
  Future<void> storeDetails(UserCredential user)async{
    try{
      LocalStorage.storeData(Const.id, user.user?.uid ?? "");
      LocalStorage.storeData(Const.name, user.user?.displayName ?? "");
      LocalStorage.storeData(Const.email, user.user?.email ?? "");
      LocalStorage.storeData(Const.picture, user.user?.photoURL ?? "");
      LocalStorage.storeData(Const.mobile, user.user?.phoneNumber ?? "");
      await checkAuthState();
    }catch(e){
      Const.debug({"error":e});
    }
  }

  Future<void> checkAuthState() async{
    try{
      authState.value = AuthState.loading;
      final id = await LocalStorage.getData(Const.id);
      if (id == null) {
        authState.value = AuthState.unauthenticated;
        return;
      }
      authState.value = AuthState.authenticated;
    }catch(e){
      Const.debug({"error":e});
      authState.value = AuthState.unauthenticated;
    }
  }

}