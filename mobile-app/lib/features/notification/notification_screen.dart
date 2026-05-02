import 'package:flutter/material.dart';
import 'package:loginapp/core/utils/colors.dart';
import 'package:loginapp/core/widgets/safe_area_widget.dart';
import 'package:loginapp/core/widgets/text_widget.dart';
import 'package:loginapp/core/utils/responsive_utils.dart';

class NotificationScreen extends StatelessWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeAreaWidget(
      appBar: AppBar(
        title: TextWidget(
          text: "Notifications",
          color: ColorStyles.whiteColor,
          fontSize: context.scale(16),
          fontWeight: FontWeight.bold,
        ),
        backgroundColor: Colors.blue.shade800,
        iconTheme: IconThemeData(color: ColorStyles.whiteColor),
      ),
      body: ListView(
        padding: EdgeInsets.all(context.scale(16)),
        children: [
          _buildNotificationCard(
            context,
            title: "Order Confirmed",
            message: "Your order is confirmed",
            time: "Just now",
            isNew: true,
          ),
          // Placeholder for more notifications
          SizedBox(height: 20),
          Center(
            child: TextWidget(
              text: "No more notifications",
              color: Colors.grey,
              fontSize: context.scale(12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationCard(BuildContext context, {
    required String title,
    required String message,
    required String time,
    bool isNew = false,
  }) {
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isNew ? Colors.blue.shade50 : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isNew ? Colors.blue.shade200 : Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: Offset(0, 2),
          )
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.blue.shade100,
              shape: BoxShape.rectangle,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(Icons.shopping_bag, color: Colors.blue.shade800, size: 24),
          ),
          SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextWidget(
                      text: title,
                      fontWeight: FontWeight.bold,
                      fontSize: context.scale(14),
                    ),
                    TextWidget(
                      text: time,
                      color: Colors.grey,
                      fontSize: context.scale(10),
                    ),
                  ],
                ),
                SizedBox(height: 4),
                TextWidget(
                  text: message,
                  color: Colors.grey.shade700,
                  fontSize: context.scale(12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

