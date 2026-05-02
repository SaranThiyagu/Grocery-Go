import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:get/get.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:loginapp/core/app/controllers/global_controller.dart';
import 'package:loginapp/core/app/controllers/local_storage_controller.dart' as app_storage;
import 'package:loginapp/core/utils/const.dart';
import 'package:loginapp/core/services/notification_service.dart';

enum AuthState { authenticated, unauthenticated, loading }

class AuthController extends GetxController {
  RxBool isLoading = false.obs;
  
  final _supabase = Supabase.instance.client;
  final Rx<AuthState> authState = AuthState.loading.obs;
  final RxString lastError = "".obs;

  @override
  void onInit() {
    super.onInit();
    _setupAuthListener();
    checkAuthState();
  }

  void _setupAuthListener() {
    _supabase.auth.onAuthStateChange.listen((data) async {
      final AuthChangeEvent event = data.event;
      final Session? session = data.session;

      Const.debug("Auth Event: $event");

      if (event == AuthChangeEvent.signedIn || event == AuthChangeEvent.tokenRefreshed) {
        if (session != null) {
          await _storeSessionDetails(session);
          authState.value = AuthState.authenticated;
        }
      } else if (event == AuthChangeEvent.signedOut) {
        authState.value = AuthState.unauthenticated;
      }
    });
  }

  Future<void> signInWithGmail() async {
    try {
      isLoading.value = true;
      lastError.value = "";
      Const.debug("Starting Native Google Sign In...");

      // Get Web Client ID from .env
      final webClientId = dotenv.env['SERVICECLIENTID'];
      
      if (webClientId == null || webClientId.isEmpty) {
        throw "SERVICECLIENTID not found in .env";
      }

      final GoogleSignIn googleSignIn = GoogleSignIn(
        serverClientId: webClientId,
      );
      
      final googleUser = await googleSignIn.signIn();
      if (googleUser == null) {
        isLoading.value = false;
        return;
      }

      final googleAuth = await googleUser.authentication;
      final accessToken = googleAuth.accessToken;
      final idToken = googleAuth.idToken;

      if (idToken == null) {
        throw 'No ID Token found.';
      }

      await _supabase.auth.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: idToken,
        accessToken: accessToken,
      );

    } catch (e) {
      Const.debug("Google Sign In Exception: $e");
      lastError.value = e.toString();
      isLoading.value = false;
    }
  }

  Future<void> _storeSessionDetails(Session session) async {
    try {
      final user = session.user;
      await app_storage.LocalStorage.storeData(Const.id, user.id);
      await app_storage.LocalStorage.storeData(Const.name, user.userMetadata?['full_name'] ?? "");
      await app_storage.LocalStorage.storeData(Const.email, user.email ?? "");
      await app_storage.LocalStorage.storeData(Const.picture, user.userMetadata?['avatar_url'] ?? "");
      await app_storage.LocalStorage.storeData(Const.mobile, user.phone ?? "");
      
      // Update FCM token
      await NotificationService.instance.updateTokenInSupabase();
      
      await Get.find<GlobalController>().loadData();
    } catch (e) {
      Const.debug("Error storing session: $e");
    }
  }

  Future<void> checkAuthState() async {
    try {
      authState.value = AuthState.loading;
      final session = _supabase.auth.currentSession;
      
      if (session != null) {
        await _storeSessionDetails(session);
        authState.value = AuthState.authenticated;
      } else {
        final id = await app_storage.LocalStorage.getData(Const.id);
        if (id == null) {
          authState.value = AuthState.unauthenticated;
        } else {
          // If we have an ID in local storage but no Supabase session, we might be unauthenticated
          // or the session expired. Supabase client manages this, so if currentSession is null,
          // we are effectively signed out from Supabase's perspective.
          authState.value = AuthState.unauthenticated;
        }
      }
    } catch (e) {
      Const.debug({"error": e});
      authState.value = AuthState.unauthenticated;
    }
  }

  Future<void> logout() async {
    try {
      isLoading.value = true;
      
      // Sign out from Supabase
      await _supabase.auth.signOut();
      
      // Sign out from Google to ensure account selection on next login
      try {
        final GoogleSignIn googleSignIn = GoogleSignIn(
          serverClientId: dotenv.env['SERVICECLIENTID'],
        );
        await googleSignIn.signOut();
      } catch (e) {
        Const.debug("Error signing out from Google: $e");
      }

      await app_storage.LocalStorage.logout(); // This clears prefs and redirects
      await Get.find<GlobalController>().loadData(); // Reset data
      authState.value = AuthState.unauthenticated;
      isLoading.value = false;
    } catch (e) {
      Const.debug({"error": e});
      isLoading.value = false;
    }
  }
}