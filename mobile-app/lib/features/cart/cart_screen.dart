import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:loginapp/core/app/controllers/order_controller.dart';
import 'package:loginapp/core/utils/colors.dart';
import 'package:loginapp/core/widgets/safe_area_widget.dart';
import 'package:loginapp/core/widgets/text_widget.dart';
import 'package:loginapp/features/responsive/responsive.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ResponsiveWidget(
      mobileScreen: CartScreenMobile(),
      tabletScreen: CartScreenMobile(),
    );
  }
}

class CartScreenMobile extends StatelessWidget {
  const CartScreenMobile({super.key});

  @override
  Widget build(BuildContext context) {
    final OrderController controller = Get.find<OrderController>();

    return SafeAreaWidget(
      appBar: AppBar(
        title: const TextWidget(
          text: "Cart Details",
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
        backgroundColor: ColorStyles.accentIndigo,
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: Container(
        color: ColorStyles.surfaceColor,
        child: Obx(() {
          if (controller.cart.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: ColorStyles.shadowColor,
                          blurRadius: 15,
                          offset: const Offset(0, 5),
                        )
                      ],
                    ),
                    child: Icon(Icons.shopping_basket_outlined, size: 64, color: Colors.grey.shade300),
                  ),
                  const SizedBox(height: 24),
                  TextWidget(
                    text: "Your cart is empty",
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: ColorStyles.textPrimary,
                  ),
                  const SizedBox(height: 8),
                  TextWidget(
                    text: "Looks like you haven't added\nanything to your cart yet.",
                    color: ColorStyles.textSecondary,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: () => Get.back(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: ColorStyles.accentIndigo,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 4,
                      shadowColor: ColorStyles.accentIndigo.withOpacity(0.4),
                    ),
                    child: const TextWidget(text: "Continue Shopping", color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                  itemCount: controller.cart.length,
                  itemBuilder: (context, index) {
                    final item = controller.cart[index];
                    return _buildCartItem(context, item, controller);
                  },
                ),
              ),
              _buildBottomAction(context, controller),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildCartItem(BuildContext context, CartItem item, OrderController controller) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: ColorStyles.shadowColor,
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(16),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.network(
                  item.product.image,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => Icon(Icons.image_not_supported_outlined, color: Colors.grey.shade300),
                ),
              ),
            ),
            const SizedBox(width: 16),
            // Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: TextWidget(
                          text: item.product.name,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                          color: ColorStyles.textPrimary,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      IconButton(
                        onPressed: () => controller.removeFromCartWithConfirmation(item),
                        icon: const Icon(Icons.delete_outline_rounded, color: Colors.red),
                        constraints: const BoxConstraints(),
                        padding: EdgeInsets.zero,
                        splashRadius: 24,
                      )
                    ],
                  ),
                  const SizedBox(height: 8),
                  // Size Label (Static)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: ColorStyles.accentIndigo.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: TextWidget(
                      text: item.selectedSize != null ? "Size: ${item.selectedSize!.label}" : "",
                      color: ColorStyles.accentIndigo,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Quantity Label (Static)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: ColorStyles.surfaceColor,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        TextWidget(
                          text: "Qty: ",
                          color: ColorStyles.textSecondary,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                        TextWidget(
                          text: item.quantity.toString(),
                          color: ColorStyles.textPrimary,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }



  Widget _buildBottomAction(BuildContext context, OrderController controller) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: () => controller.confirmOrder(),
            style: ElevatedButton.styleFrom(
              backgroundColor: ColorStyles.accentIndigo,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 4,
              shadowColor: ColorStyles.accentIndigo.withOpacity(0.4),
            ),
            child: const TextWidget(
              text: "Confirm Order",
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }
}
