import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:loginapp/core/app/controllers/order_controller.dart';
import 'package:loginapp/core/utils/colors.dart';
import 'package:loginapp/core/widgets/text_widget.dart';

class ProductVariantSheet extends StatefulWidget {
  final Product product;
  const ProductVariantSheet({super.key, required this.product});

  @override
  State<ProductVariantSheet> createState() => _ProductVariantSheetState();
}

class _ProductVariantSheetState extends State<ProductVariantSheet> {
  final RxMap<String, int> selectedQuantities = <String, int>{}.obs;
  final OrderController orderController = Get.find<OrderController>();

  @override
  void initState() {
    super.initState();
    for (var size in widget.product.sizes) {
      selectedQuantities[size.label] = 0;
    }
  }

  void _resetSelections() {
    for (var size in widget.product.sizes) {
      selectedQuantities[size.label] = 0;
    }
  }

  void _handleAddToCart() {
    int totalAdded = 0;
    selectedQuantities.forEach((label, qty) {
      if (qty > 0) {
        final size = widget.product.sizes.firstWhere((s) => s.label == label);
        for (int i = 0; i < qty; i++) {
          orderController.incrementCart(widget.product, size);
        }
        totalAdded += qty;
      }
    });

    if (totalAdded > 0) {
      Get.back();
      Get.snackbar(
        'Added to Cart',
        '$totalAdded ${widget.product.name} items ready in your basket!',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: ColorStyles.accentIndigo,
        colorText: Colors.white,
        margin: const EdgeInsets.all(20),
        borderRadius: 16,
        duration: const Duration(seconds: 2),
        icon: const Icon(Icons.shopping_basket_rounded, color: Colors.white),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 20,
            offset: Offset(0, -5),
          )
        ],
      ),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 30),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Elegant Drag Handle
          Center(
            child: Container(
              width: 48,
              height: 5,
              margin: const EdgeInsets.only(bottom: 24),
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          
          // Premium Header
          Row(
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: ColorStyles.surfaceColor,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    )
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Image.network(
                    widget.product.image,
                    fit: BoxFit.cover,
                    errorBuilder: (c, e, s) => Icon(Icons.image_outlined, color: Colors.grey.shade400, size: 30),
                  ),
                ),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextWidget(
                      text: widget.product.name,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: ColorStyles.textPrimary,
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: ColorStyles.accentIndigo.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: TextWidget(
                        text: widget.product.category,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: ColorStyles.accentIndigo,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          const Divider(thickness: 1, height: 1),
          const SizedBox(height: 16),
          
          // Variants List with Smooth Interaction
          Flexible(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxHeight: context.height * 0.4),
              child: widget.product.sizes.isEmpty 
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 32),
                      child: TextWidget(
                        text: "No size options available for this product.",
                        color: ColorStyles.textSecondary,
                        textAlign: TextAlign.center,
                      ),
                    ),
                  )
                : SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    child: Column(
                      children: widget.product.sizes.map((size) {
                    return Obx(() {
                      final qty = selectedQuantities[size.label] ?? 0;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: qty > 0 ? ColorStyles.accentIndigo.withOpacity(0.03) : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: qty > 0 ? ColorStyles.accentIndigo.withOpacity(0.2) : Colors.grey.shade100,
                            width: 1.5,
                          ),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  TextWidget(
                                    text: size.label,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: ColorStyles.textPrimary,
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      if (size.qty != null) ...[
                                        Icon(Icons.inventory_2_outlined, size: 14, color: ColorStyles.textSecondary),
                                        const SizedBox(width: 4),
                                        TextWidget(
                                          text: size.qty!,
                                          fontSize: 13,
                                          color: ColorStyles.textSecondary,
                                        ),
                                        const SizedBox(width: 12),
                                      ],
                                      Icon(Icons.check_circle_outline_rounded, size: 14, color: ColorStyles.accentTeal),
                                      const SizedBox(width: 4),
                                      TextWidget(
                                        text: "In Stock",
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: ColorStyles.accentTeal,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            
                            // Animated Stepper/Add Button
                            AnimatedCrossFade(
                              duration: const Duration(milliseconds: 250),
                              crossFadeState: qty == 0 ? CrossFadeState.showFirst : CrossFadeState.showSecond,
                              firstChild: ElevatedButton(
                                onPressed: () => selectedQuantities[size.label] = 1,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: ColorStyles.accentIndigo,
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                child: const TextWidget(text: "ADD", fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                              secondChild: Container(
                                decoration: BoxDecoration(
                                  color: ColorStyles.accentIndigo,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: [
                                    BoxShadow(
                                      color: ColorStyles.accentIndigo.withOpacity(0.3),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    )
                                  ],
                                ),
                                child: Row(
                                  children: [
                                    _StepperButton(
                                      icon: Icons.remove_rounded,
                                      onTap: () {
                                        if (selectedQuantities[size.label]! > 0) {
                                          selectedQuantities[size.label] = selectedQuantities[size.label]! - 1;
                                        }
                                      },
                                    ),
                                    Container(
                                      width: 36,
                                      alignment: Alignment.center,
                                      child: TextWidget(
                                        text: qty.toString(),
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                    _StepperButton(
                                      icon: Icons.add_rounded,
                                      onTap: () => selectedQuantities[size.label] = selectedQuantities[size.label]! + 1,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    });
                  }).toList(),
                ),
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Action Buttons
          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: () {
                    _resetSelections();
                    Get.back();
                  },
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    backgroundColor: Colors.grey.shade100,
                  ),
                  child: TextWidget(
                    text: "Cancel",
                    fontWeight: FontWeight.bold,
                    color: ColorStyles.textSecondary,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: _handleAddToCart,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ColorStyles.accentIndigo,
                    foregroundColor: Colors.white,
                    elevation: 8,
                    shadowColor: ColorStyles.accentIndigo.withOpacity(0.5),
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const TextWidget(
                    text: "Add to Cart",
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StepperButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _StepperButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.all(8),
          child: Icon(icon, color: Colors.white, size: 20),
        ),
      ),
    );
  }
}
