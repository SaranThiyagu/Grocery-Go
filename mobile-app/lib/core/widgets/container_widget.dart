import 'package:flutter/material.dart';
import 'package:loginapp/core/utils/responsive_utils.dart';
import 'package:loginapp/core/widgets/shimmer_widget.dart';

class ContainerWidget extends StatelessWidget {
  final double? height, width, borderWidth;
  final Widget child;
  final BorderRadiusGeometry? borderRadius;
  final Color? backgroundColor, borderColor;
  final EdgeInsetsGeometry? padding, margin;
  final List<BoxShadow>? boxShadow;
  final BoxShape? shape;
  final Gradient? gradient;
  final VoidCallback? callback;
  final AlignmentGeometry? alignment;
  final bool? isLoading ;
  final DecorationImage? image;
  const ContainerWidget(
      {super.key,
      this.height,
      this.width,
      required this.child,
      this.borderWidth = 0.7,
      this.backgroundColor,
      this.borderColor = Colors.transparent,
      this.padding,
      this.boxShadow,
      this.borderRadius,
      this.shape = BoxShape.rectangle,
      this.gradient,
      this.margin,
      this.callback, this.alignment,this.isLoading = false, this.image
      });

  @override
  Widget build(BuildContext context) {

    return GestureDetector(
      onTap: callback,
      child: ShimmerWrapper(
        isLoading: isLoading!,
        child: Container(
        width: width,
        height: height,
        padding: padding,
        margin: margin,
        alignment: alignment,
        decoration: BoxDecoration(
          borderRadius: borderRadius,
          color: backgroundColor,
          border: Border.all(width: context.scale(borderWidth ?? 0), color: borderColor!),
          boxShadow: boxShadow,
          shape: shape!,
          gradient: gradient,
          image: image
        ),
        child: child,
      ),
      ),
    );
  }
}

//Box shadow syntax

// boxShadow: [
//   BoxShadow(
//     color: Colors.grey.withOpacity(0.5),
//     spreadRadius: 0.5,
//     blurRadius: 10,
//     offset: const Offset(0, 1),
//   ),
// ],


// LinearGradient(
// begin: Alignment.topLeft,
// end: Alignment.bottomRight,
// colors: [
// ColorStyles.colors01,
// ColorStyles.colors02,
// ColorStyles.colors03,
// ],
// )