import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:loginapp/core/utils/responsive_utils.dart';

class TextWidget extends StatelessWidget {
  final String text;
  final double? fontSize,height;
  final Color? color,underLineColor;
  final FontWeight? fontWeight;
  final double? letterSpacing;
  final TextOverflow? overflow;
  final int? maxLines;
  final TextDecoration? textDecoration;
  final TextAlign? textAlign;
  final Paint? foregroundColor;
  const TextWidget({super.key, required this.text,  this.fontSize,  this.color,this.fontWeight, this.letterSpacing, this.overflow, this.maxLines, this.textDecoration, this.textAlign, this.foregroundColor, this.underLineColor, this.height});

  @override
  Widget build(BuildContext context) {
    return Text(text,maxLines: maxLines,textAlign: textAlign,style: GoogleFonts.inter(
        textStyle: TextStyle(fontSize: context.scale(fontSize ?? 12),color: color,fontWeight: fontWeight,letterSpacing: letterSpacing,overflow: overflow,decoration: textDecoration,foreground: foregroundColor,decorationColor: underLineColor,height: height ?? 0)
    ),);
  }
}


