import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class SafeAreaWidget extends StatefulWidget {
  final Widget? floatingActionButton;
  final Widget body;
  final Widget? bottomNavigationBar,drawer,bottomSheet;
  final Color? backgroundColor,statusBarColor;
  final FloatingActionButtonLocation? floatingActionButtonLocation;
  final PreferredSizeWidget? appBar;
  final Key? scaffoldKey;
  final Brightness? statusBarIconBrightness;
  const SafeAreaWidget({super.key, required this.body, this.backgroundColor,
    this.floatingActionButton, this.floatingActionButtonLocation,
    this.appBar, this.bottomNavigationBar, this.drawer, this.bottomSheet, this.scaffoldKey, this.statusBarColor, this.statusBarIconBrightness});

  @override
  State<SafeAreaWidget> createState() => _SafeAreaWidgetState();
}

class _SafeAreaWidgetState extends State<SafeAreaWidget> {

  @override
  Widget build(BuildContext context) {
    final bgColor = widget.backgroundColor ?? Theme.of(context).scaffoldBackgroundColor;
    final sbColor = widget.statusBarColor ?? bgColor;
    final bool isLightBackground = sbColor.computeLuminance() > 0.5;

    final overlayStyle = SystemUiOverlayStyle(
      statusBarColor: sbColor,
      statusBarIconBrightness:  isLightBackground ? Brightness.dark : Brightness.light, // for Android
      statusBarBrightness: isLightBackground ? Brightness.light : Brightness.dark,   // for iOS
    );
    return Scaffold(
      resizeToAvoidBottomInset: false,
      appBar: widget.appBar,
      drawer: widget.drawer,
      key: widget.scaffoldKey,
      floatingActionButton: widget.floatingActionButton,
      floatingActionButtonLocation: widget.floatingActionButtonLocation,
      backgroundColor:bgColor,
      bottomNavigationBar: widget.bottomNavigationBar,
      bottomSheet: widget.bottomSheet,
      body: AnnotatedRegion<SystemUiOverlayStyle>(
        value: overlayStyle,
        child: SafeArea(
            child: widget.body
        ),
      ),
      //body: SafeArea(child: widget.body),
    );
  }
}
