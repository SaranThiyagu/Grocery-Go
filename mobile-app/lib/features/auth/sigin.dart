import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get/get_core/src/get_main.dart';
import 'package:get/get_instance/src/extension_instance.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:loginapp/core/app/controllers/auth_controller.dart';
import 'package:loginapp/core/utils/responsive_utils.dart';
import 'package:loginapp/core/widgets/custom_toast.dart';
import 'package:loginapp/core/widgets/safe_area_widget.dart';
import 'package:loginapp/core/widgets/text_widget.dart';
import 'package:loginapp/features/responsive/responsive.dart';

class SigIn extends StatelessWidget {
  const SigIn({super.key});

  @override
  Widget build(BuildContext context) {
    return ResponsiveWidget(
        mobileScreen: SigInMobile(),
        tabletScreen: SigInTablet()
    );
  }
}

class SigInMobile extends StatefulWidget {
  const SigInMobile({super.key});

  @override
  State<SigInMobile> createState() => _SigInMobileState();
}

class _SigInMobileState extends State<SigInMobile> {
  final AuthController ac = Get.find<AuthController>();
  @override
  Widget build(BuildContext context) {
    return SafeAreaWidget(
        body: Padding(
          padding:  EdgeInsets.symmetric(horizontal: context.scale(24)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
               Spacer(flex: 1),
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
                  child: Image.network(
                    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_\"G\"_logo.svg/1200px-Google_\"G\"_logo.svg.png',
                    width: context.scale(32),
                  ),
                ),
              ),
              SizedBox(height: context.scale(32)),
              TextWidget(text: "Welcome Back",fontSize: context.scale(32),fontWeight: FontWeight.bold, color: const Color(0xFF191C1D), letterSpacing: -1,),
              SizedBox(height: context.scale(12)),
              TextWidget(text: "Discover curated stories from our\nglobal editorial team.",fontSize: context.scale(16), color: const Color(0xFF5F6368),height: 1.5 ,textAlign: TextAlign.center,),
              SizedBox(height: context.scale(48)),
              SizedBox(
                width: double.infinity,
                height: context.scale(56),
                child: OutlinedButton(
                  onPressed: () async{
                    final result = await ac.signInWithGmail();
                    if(result != null){
                      await ac.storeDetails(result);
                    }else{
                      errorToast(context, "Something went wrong please try again later");
                    }
                  },
                  style: OutlinedButton.styleFrom(
                    backgroundColor: Colors.white,
                    side: BorderSide.none,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(context.scale(12)),
                    ),
                    elevation: 2,
                    shadowColor: const Color(0x14000000),
                  ),
                  child: Obx((){
                    if(ac.isLoading.value) {
                      return TextWidget(text: "Loading....",fontSize: context.scale(16),fontWeight: FontWeight.w600, color: const Color(0xFF191C1D),);
                    }
                    return Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Image.network(
                          'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_\"G\"_logo.svg/1200px-Google_\"G\"_logo.svg.png',
                          width: context.scale(20),
                        ),
                        SizedBox(width: context.scale(12)),
                        TextWidget(text: "Sign in with Google",fontSize: context.scale(16),fontWeight: FontWeight.w600, color: const Color(0xFF191C1D),),

                      ],
                    );
                  }),
                ),
              ),
               SizedBox(height: context.scale(32)),


              Text.rich(
                TextSpan(
                  text: 'By signing in, you agree to our\n',
                  children: [
                    TextSpan(
                      text: 'Terms of Service',
                      style: TextStyle(
                        color: const Color(0xFF1A73E8),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const TextSpan(text: ' and '),
                    TextSpan(
                      text: 'Privacy Policy',
                      style: TextStyle(
                        color: const Color(0xFF1A73E8),
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
              const Spacer(flex: 3),

              Padding(
                padding:  EdgeInsets.only(bottom: context.scale(24)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    FootLink(text: 'PRIVACY POLICY'),
                    SizedBox(width: context.scale(24)),
                    FootLink(text: 'TERMS OF SERVICE'),
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
        )
    );
  }
}

class SigInTablet extends StatefulWidget {
  const SigInTablet({super.key});

  @override
  State<SigInTablet> createState() => _SigInTabletState();
}

class _SigInTabletState extends State<SigInTablet> {
  final AuthController ac = Get.find<AuthController>();

  @override
  Widget build(BuildContext context) {
    return SafeAreaWidget(
        body: Padding(
          padding:  EdgeInsets.symmetric(horizontal: context.scale(24)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Spacer(flex: 1),
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
                  child: Image.network(
                    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_\"G\"_logo.svg/1200px-Google_\"G\"_logo.svg.png',
                    width: context.scale(32),
                  ),
                ),
              ),
              SizedBox(height: context.scale(32)),
              TextWidget(text: "Welcome Back",fontSize: context.scale(32),fontWeight: FontWeight.bold, color: const Color(0xFF191C1D), letterSpacing: -1,),
              SizedBox(height: context.scale(12)),
              TextWidget(text: "Discover curated stories from our\nglobal editorial team.",fontSize: context.scale(16), color: const Color(0xFF5F6368),height: 1.5 ,textAlign: TextAlign.center,),
              SizedBox(height: context.scale(48)),
              SizedBox(
                width: double.infinity,
                height: context.scale(56),
                child: OutlinedButton(
                  onPressed: () async{
                    final result = await ac.signInWithGmail();
                    if(result != null){
                      await ac.storeDetails(result);
                    }else{
                      errorToast(context, "Something went wrong please try again later");
                    }
                  },
                  style: OutlinedButton.styleFrom(
                    backgroundColor: Colors.white,
                    side: BorderSide.none,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(context.scale(12)),
                    ),
                    elevation: 2,
                    shadowColor: const Color(0x14000000),
                  ),
                  child: Obx((){
                    if(ac.isLoading.value) {
                      return TextWidget(text: "Loading....",fontSize: context.scale(16),fontWeight: FontWeight.w600, color: const Color(0xFF191C1D),);
                    }
                    return Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Image.network(
                          'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_\"G\"_logo.svg/1200px-Google_\"G\"_logo.svg.png',
                          width: context.scale(20),
                        ),
                        SizedBox(width: context.scale(12)),
                        TextWidget(text: "Sign in with Google",fontSize: context.scale(16),fontWeight: FontWeight.w600, color: const Color(0xFF191C1D),),

                      ],
                    );
                  }),
                ),
              ),
              SizedBox(height: context.scale(32)),


              Text.rich(
                TextSpan(
                  text: 'By signing in, you agree to our\n',
                  children: [
                    TextSpan(
                      text: 'Terms of Service',
                      style: TextStyle(
                        color: const Color(0xFF1A73E8),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const TextSpan(text: ' and '),
                    TextSpan(
                      text: 'Privacy Policy',
                      style: TextStyle(
                        color: const Color(0xFF1A73E8),
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
              const Spacer(flex: 3),

              Padding(
                padding:  EdgeInsets.only(bottom: context.scale(24)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    FootLink(text: 'PRIVACY POLICY'),
                    SizedBox(width: context.scale(24)),
                    FootLink(text: 'TERMS OF SERVICE'),
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
        )
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


