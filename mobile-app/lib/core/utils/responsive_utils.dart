import 'package:flutter/material.dart';



class ResponsiveConfig {
  static late double screenWidth;
  static late double screenHeight;

  static void init(double width, double height) {
    screenWidth = width;
    screenHeight = height;
  }
}

extension ResponsiveContext on BuildContext {

  double get screenWidth => ResponsiveConfig.screenWidth;
  double get screenHeight => ResponsiveConfig.screenHeight;

  bool get isMobile => screenWidth < 500;
  bool get isTablet => screenWidth >= 600;

   /// Use for text

  double scale(double value) {
    double scaleFactor = screenWidth / 375;
    if (scaleFactor > 1.4) scaleFactor = 1.4;
    return value * scaleFactor;
  }

  /// Use this for percentage type scaling
  double widthPct(double percent) => screenWidth * (percent / 100);
  double heightPct(double percent) => screenHeight * (percent / 100);

}