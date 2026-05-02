import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:get/get.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:loginapp/core/app/controllers/global_controller.dart';
import 'package:loginapp/core/app/controllers/local_storage_controller.dart' as app_storage;
import 'package:loginapp/core/utils/const.dart';

enum AuthState { authenticated, unauthenticated, loading }

class AuthController extends GetxController {
  RxBool isLoading = false.obs;
  
  final _supabase = Supabase.instance.client;
  final Rx<AuthState> authState = AuthState.loading.obs;
  final RxString lastError = "".obs;

  @override
  void onInit() {
    super.onInit();
    // checkAuthState is called by AppEntry on startup — no need to call here
  }

  Future<void> signInWithMobile(String mobile) async {
    try {
      isLoading.value = true;
      lastError.value = "";
      
      final response = await _supabase
          .from('customers')
          .select()
          .eq('mobile_no', mobile)
          .maybeSingle();
      
      if (response != null) {
        if (response['status'] == 'blocked' || response['status'] == 'inactive') {
          lastError.value = "Your account is ${response['status']}. Please contact support.";
        } else {
          await _storeUserDetails(response);
          authState.value = AuthState.authenticated;
          // AppEntry's Obx reacts to authState — no manual navigation needed
        }
      } else {
        lastError.value = "Number not registered. Please sign up first.";
      }
    } catch (e) {
      Const.debug("Mobile Sign In Exception: $e");
      lastError.value = e.toString();
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> signUpWithMobile({
    required String mobile,
    required String fullName,
    String? storeName,
    String? alternateContactNo,
    String? email,
    String? gstNo,
    String? dob,
    String? anniversary,
    String? addressLine1,
    String? addressLine2,
    String? city,
    String? state,
    String? pincode,
  }) async {
    try {
      isLoading.value = true;
      lastError.value = "";
      
      final existingUser = await _supabase
          .from('customers')
          .select()
          .eq('mobile_no', mobile)
          .maybeSingle();

      if (existingUser != null) {
        lastError.value = "This mobile number is already registered. Try signing in.";
        return;
      }

      final insertData = {
        'mobile_no': mobile,
        'full_name': fullName,
      };

      if (storeName != null && storeName.isNotEmpty) insertData['store_name'] = storeName;
      if (alternateContactNo != null && alternateContactNo.isNotEmpty) insertData['alternate_contact_no'] = alternateContactNo;
      if (email != null && email.isNotEmpty) insertData['email'] = email;
      if (gstNo != null && gstNo.isNotEmpty) insertData['gst_no'] = gstNo;
      if (dob != null && dob.isNotEmpty) insertData['date_of_birth'] = dob;
      if (anniversary != null && anniversary.isNotEmpty) insertData['anniversary_date'] = anniversary;
      if (addressLine1 != null && addressLine1.isNotEmpty) insertData['address_line1'] = addressLine1;
      if (addressLine2 != null && addressLine2.isNotEmpty) insertData['address_line2'] = addressLine2;
      if (city != null && city.isNotEmpty) insertData['city'] = city;
      if (state != null && state.isNotEmpty) insertData['state'] = state;
      if (pincode != null && pincode.isNotEmpty) insertData['pincode'] = pincode;

      final response = await _supabase.from('customers').insert(insertData).select().single();
      
      if (response != null) {
        await _storeUserDetails(response);
        isLoading.value = false; // ensure loading hides before dialog
        await Get.defaultDialog(
          title: "Registration Successful",
          middleText: "You have signed up successfully!",
          backgroundColor: Colors.white,
          titleStyle: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold),
          middleTextStyle: const TextStyle(color: Colors.black87),
          textConfirm: "Continue",
          confirmTextColor: Colors.white,
          buttonColor: const Color(0xFF1A73E8),
          barrierDismissible: false,
          onConfirm: () {
            Get.back();
          },
        );
        authState.value = AuthState.authenticated;
        // AppEntry's Obx reacts to authState — no manual navigation needed
      }
    } catch (e) {
      Const.debug("Mobile Sign Up Exception: $e");
      lastError.value = e.toString();
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> _storeUserDetails(Map<String, dynamic> user) async {
    try {
      final prefs = await SharedPreferences.getInstance();

      final String userId = user['id']?.toString().trim() ?? 
                            user['mobile_no']?.toString().trim() ?? '';

      await prefs.setString(Const.id,           userId);
      await prefs.setString(Const.name,         user['full_name']?.toString()    ?? '');
      await prefs.setString(Const.mobile,       user['mobile_no']?.toString()    ?? '');
      await prefs.setString(Const.email,        user['email']?.toString()        ?? '');
      await prefs.setString(Const.picture,      '');
      await prefs.setString(Const.customerType, user['customer_type']?.toString() ?? 'retail');
      await prefs.setBool('isLoggedIn', true); // dedicated session flag

      await Get.find<GlobalController>().loadData();
    } catch (e) {
      Const.debug("Error storing session: $e");
    }
  }

  Future<void> checkAuthState() async {
    try {
      authState.value = AuthState.loading;

      // Read directly from SharedPreferences — no wrapper layer
      final prefs = await SharedPreferences.getInstance();
      final String? id         = prefs.getString(Const.id);
      final bool   isLoggedIn  = prefs.getBool('isLoggedIn') ?? false;

      if (isLoggedIn && id != null && id.isNotEmpty) {
        await Get.find<GlobalController>().loadData();
        authState.value = AuthState.authenticated;
      } else {
        authState.value = AuthState.unauthenticated;
      }
    } catch (e) {
      Const.debug("checkAuthState error: $e");
      authState.value = AuthState.unauthenticated;
    }
  }

  Future<void> logout() async {
    try {
      isLoading.value = true;

      // Sign out from Google silently (ignore errors if not signed in)
      try {
        final GoogleSignIn googleSignIn = GoogleSignIn(
          serverClientId: dotenv.env['SERVICECLIENTID'],
        );
        await googleSignIn.signOut();
      } catch (_) {}

      // Clear all locally stored session data
      final prefs = await SharedPreferences.getInstance();
      await prefs.clear();

      // Reset in-memory user data
      await Get.find<GlobalController>().loadData();

      // Set state → AppEntry's Obx will reactively show SignIn screen
      authState.value = AuthState.unauthenticated;
    } catch (e) {
      Const.debug({"logout error": e});
    } finally {
      isLoading.value = false;
    }
  }
}