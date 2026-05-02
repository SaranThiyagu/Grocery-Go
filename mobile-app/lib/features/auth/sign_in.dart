import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:loginapp/core/app/controllers/auth_controller.dart';
import 'package:loginapp/core/utils/responsive_utils.dart';
import 'package:loginapp/core/widgets/custom_toast.dart';
import 'package:loginapp/core/widgets/safe_area_widget.dart';
import 'package:loginapp/core/widgets/text_widget.dart';
import 'package:loginapp/features/responsive/responsive.dart';

class SignIn extends StatelessWidget {
  const SignIn({super.key});

  @override
  Widget build(BuildContext context) {
    return const ResponsiveWidget(
        mobileScreen: SignInScreenBody(),
        tabletScreen: SignInScreenBody()
    );
  }
}

class SignInScreenBody extends StatefulWidget {
  const SignInScreenBody({super.key});

  @override
  State<SignInScreenBody> createState() => _SignInScreenBodyState();
}

class _SignInScreenBodyState extends State<SignInScreenBody> {
  final AuthController ac = Get.find<AuthController>();
  
  bool isSignUp = false;
  final TextEditingController mobileCtrl = TextEditingController();
  final TextEditingController nameCtrl = TextEditingController();
  final TextEditingController storeNameCtrl = TextEditingController();
  final TextEditingController alternateContactNoCtrl = TextEditingController();
  final TextEditingController emailCtrl = TextEditingController();
  final TextEditingController gstNoCtrl = TextEditingController();
  final TextEditingController dobCtrl = TextEditingController();
  final TextEditingController anniversaryCtrl = TextEditingController();
  final TextEditingController addressLine1Ctrl = TextEditingController();
  final TextEditingController addressLine2Ctrl = TextEditingController();
  final TextEditingController cityCtrl = TextEditingController();
  final TextEditingController stateCtrl = TextEditingController();
  final TextEditingController pincodeCtrl = TextEditingController();

  @override
  void dispose() {
    mobileCtrl.dispose();
    nameCtrl.dispose();
    storeNameCtrl.dispose();
    alternateContactNoCtrl.dispose();
    emailCtrl.dispose();
    gstNoCtrl.dispose();
    dobCtrl.dispose();
    anniversaryCtrl.dispose();
    addressLine1Ctrl.dispose();
    addressLine2Ctrl.dispose();
    cityCtrl.dispose();
    stateCtrl.dispose();
    pincodeCtrl.dispose();
    super.dispose();
  }

  void _handleSubmit() async {
    if (mobileCtrl.text.isEmpty) {
      errorToast(context, "Please enter your mobile number.");
      return;
    }
    if (isSignUp) {
      if (nameCtrl.text.isEmpty) {
         errorToast(context, "Please fill in your full name.");
         return;
      }
      await ac.signUpWithMobile(
        mobile: mobileCtrl.text.trim(),
        fullName: nameCtrl.text.trim(),
        storeName: storeNameCtrl.text.trim(),
        alternateContactNo: alternateContactNoCtrl.text.trim(),
        email: emailCtrl.text.trim(),
        gstNo: gstNoCtrl.text.trim(),
        dob: dobCtrl.text.trim(),
        anniversary: anniversaryCtrl.text.trim(),
        addressLine1: addressLine1Ctrl.text.trim(),
        addressLine2: addressLine2Ctrl.text.trim(),
        city: cityCtrl.text.trim(),
        state: stateCtrl.text.trim(),
        pincode: pincodeCtrl.text.trim(),
      );
    } else {
      await ac.signInWithMobile(mobileCtrl.text.trim());
    }
    if (ac.lastError.value.isNotEmpty) {
      errorToast(context, ac.lastError.value);
    }
  }

  Widget _buildTextField(String label, TextEditingController controller, {bool obscure = false, TextInputType? keyboardType}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextWidget(text: label, fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF5F6368)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: obscure,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade300)
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade300)
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF1A73E8), width: 2)
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeAreaWidget(
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: context.scale(24), vertical: context.scale(48)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Logo
              Container(
                width: context.scale(64),
                height: context.scale(64),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x14000000),
                      blurRadius: 12,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: Center(
                  child: Icon(Icons.shopping_basket, color: const Color(0xFF1A73E8), size: context.scale(32)),
                ),
              ),
              SizedBox(height: context.scale(32)),
              TextWidget(
                text: isSignUp ? "Create an Account" : "Welcome Back",
                fontSize: context.scale(32),
                fontWeight: FontWeight.bold, 
                color: const Color(0xFF191C1D), 
                letterSpacing: -1,
              ),
              SizedBox(height: context.scale(12)),
              TextWidget(
                text: "Discover curated stories from our\nglobal editorial team.",
                fontSize: context.scale(16), 
                color: const Color(0xFF5F6368),
                height: 1.5,
                textAlign: TextAlign.center,
              ),
              SizedBox(height: context.scale(48)),
              
              if (isSignUp) ...[
                _buildTextField("Mobile Number *", mobileCtrl, keyboardType: TextInputType.phone),
                SizedBox(height: context.scale(16)),
                _buildTextField("Alternate Contact No", alternateContactNoCtrl, keyboardType: TextInputType.phone),
                SizedBox(height: context.scale(16)),
                _buildTextField("Full Name *", nameCtrl),
                SizedBox(height: context.scale(16)),
                _buildTextField("Store Name", storeNameCtrl),
                SizedBox(height: context.scale(16)),
                _buildTextField("Email", emailCtrl, keyboardType: TextInputType.emailAddress),
                SizedBox(height: context.scale(16)),
                _buildTextField("GST No", gstNoCtrl),
                SizedBox(height: context.scale(16)),
                _buildTextField("Date of Birth (YYYY-MM-DD)", dobCtrl),
                SizedBox(height: context.scale(16)),
                _buildTextField("Anniversary Date (YYYY-MM-DD)", anniversaryCtrl),
                SizedBox(height: context.scale(16)),
                _buildTextField("Address Line 1", addressLine1Ctrl),
                SizedBox(height: context.scale(16)),
                _buildTextField("Address Line 2", addressLine2Ctrl),
                SizedBox(height: context.scale(16)),
                _buildTextField("City", cityCtrl),
                SizedBox(height: context.scale(16)),
                _buildTextField("Pincode", pincodeCtrl, keyboardType: TextInputType.number),
                SizedBox(height: context.scale(16)),
                _buildTextField("State", stateCtrl),
              ] else ...[
                _buildTextField("Mobile Number", mobileCtrl, keyboardType: TextInputType.phone),
              ],
              
              SizedBox(height: context.scale(32)),
              
              SizedBox(
                width: double.infinity,
                height: context.scale(56),
                child: ElevatedButton(
                  onPressed: _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1A73E8),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(context.scale(12)),
                    ),
                    elevation: 0,
                  ),
                  child: Obx((){
                    if(ac.isLoading.value) {
                      return TextWidget(text: "Loading....", fontSize: context.scale(16), fontWeight: FontWeight.w600, color: Colors.white);
                    }
                    return TextWidget(
                      text: isSignUp ? "Sign Up" : "Sign In", 
                      fontSize: context.scale(16), 
                      fontWeight: FontWeight.w600, 
                      color: Colors.white
                    );
                  }),
                ),
              ),
              
              SizedBox(height: context.scale(24)),
              
              // Toggle between sign in and sign up
              TextButton(
                onPressed: () {
                  setState(() {
                    isSignUp = !isSignUp;
                    ac.lastError.value = ""; // clear errors on toggle
                  });
                },
                child: TextWidget(
                  text: isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up",
                  color: const Color(0xFF1A73E8),
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
              
              SizedBox(height: context.scale(24)),
              SizedBox(height: context.scale(48)),

              Text.rich(
                TextSpan(
                  text: 'By continuing, you agree to our\n',
                  children: [
                    const TextSpan(
                      text: 'Terms of Service',
                      style: TextStyle(
                        color: Color(0xFF1A73E8),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const TextSpan(text: ' and '),
                    const TextSpan(
                      text: 'Privacy Policy',
                      style: TextStyle(
                        color: Color(0xFF1A73E8),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: context.scale(12),
                  color: const Color(0xFF5F6368),
                  height: 1.5,
                ),
              ),
              
              SizedBox(height: context.scale(32)),

              Padding(
                padding:  EdgeInsets.only(bottom: context.scale(24)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const FootLink(text: 'PRIVACY POLICY'),
                    SizedBox(width: context.scale(24)),
                    const FootLink(text: 'TERMS OF SERVICE'),
                  ],
                ),
              ),
              Text(
                '© 2024 THE EDITORIAL',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  letterSpacing: 1,
                  color: const Color(0xFF9AA0A6),
                ),
              ),
              SizedBox(height: context.scale(16)),
            ],
          ),
        ),
      ),
    );
  }
}

class FootLink extends StatelessWidget {
  final String text;
  const FootLink({super.key, required this.text});

  @override
  Widget build(BuildContext context) {
    return TextWidget(text: text,fontSize: 10,fontWeight: FontWeight.w600,color: const Color(0xFF9AA0A6),letterSpacing: 0.5,);
  }
}
