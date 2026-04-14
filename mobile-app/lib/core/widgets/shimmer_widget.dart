import 'package:flutter/material.dart';
import 'package:redacted/redacted.dart';

class ShimmerWrapper extends StatelessWidget {
  final bool isLoading;
  final Widget child;

  const ShimmerWrapper({
    super.key,
    required this.isLoading,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return child.redacted(
      context: context,
      redact: isLoading,
      configuration:  RedactedConfiguration(
        autoFillTexts: true,
        autoFillText: "******",
      ),
    );
  }
}
