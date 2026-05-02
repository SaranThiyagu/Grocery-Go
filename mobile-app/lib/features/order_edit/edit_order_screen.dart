import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:loginapp/core/app/controllers/dashboard_controller.dart';
import 'package:loginapp/core/app/controllers/order_controller.dart';
import 'package:loginapp/core/utils/colors.dart';
import 'package:loginapp/core/widgets/safe_area_widget.dart';
import 'package:loginapp/core/widgets/text_widget.dart';
import 'package:loginapp/features/order_edit/edit_order_controller.dart';
import 'package:loginapp/features/responsive/responsive.dart';

class EditOrderScreen extends StatelessWidget {
  final OrderModel order;
  const EditOrderScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    // Inject the controller scoped to this specific order
    Get.put(EditOrderController(order: order));
    
    return const ResponsiveWidget(
      mobileScreen: EditOrderScreenMobile(),
      tabletScreen: EditOrderScreenMobile(),
    );
  }
}

class EditOrderScreenMobile extends StatelessWidget {
  const EditOrderScreenMobile({super.key});

  @override
  Widget build(BuildContext context) {
    final EditOrderController controller = Get.find<EditOrderController>();

    return SafeAreaWidget(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const TextWidget(
              text: "Edit Order",
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
            TextWidget(
              text: controller.order.orderNo,
              color: Colors.white70,
              fontSize: 12,
            )
          ],
        ),
        backgroundColor: ColorStyles.accentIndigo,
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: Container(
        color: ColorStyles.surfaceColor,
        child: Obx(() {
          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                  children: [
                    ...controller.editCart.map((item) => _buildCartItem(context, item, controller)).toList(),
                    const SizedBox(height: 16),
                    _buildAddProductButton(context, controller),
                  ],
                ),
              ),
              _buildBottomAction(context, controller),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildCartItem(BuildContext context, CartItem item, EditOrderController controller) {
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
                        onPressed: () => controller.removeItemWithConfirmation(item),
                        icon: const Icon(Icons.delete_outline_rounded, color: Colors.red),
                        constraints: const BoxConstraints(),
                        padding: EdgeInsets.zero,
                        splashRadius: 24,
                      )
                    ],
                  ),
                  const SizedBox(height: 8),
                  // Size Selector
                  GestureDetector(
                    onTap: () {
                      if (item.product.sizes.length > 1) {
                        _showSizeOptions(context, item, controller);
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: ColorStyles.accentIndigo.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: item.product.sizes.length > 1 ? ColorStyles.accentIndigo.withOpacity(0.2) : Colors.transparent),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          TextWidget(
                            text: item.selectedSize?.label ?? "",
                            color: ColorStyles.accentIndigo,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                          if (item.product.sizes.length > 1) ...[
                            const SizedBox(width: 4),
                            Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: ColorStyles.accentIndigo),
                          ]
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Quantity
                  Container(
                    height: 36,
                    decoration: BoxDecoration(
                      color: ColorStyles.surfaceColor,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: const BorderRadius.horizontal(left: Radius.circular(10)),
                            onTap: () => controller.decrementItem(item),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              alignment: Alignment.center,
                              child: Icon(Icons.remove_rounded, color: ColorStyles.textSecondary, size: 18),
                            ),
                          ),
                        ),
                        Container(
                          width: 32,
                          alignment: Alignment.center,
                          color: Colors.white,
                          child: AnimatedSwitcher(
                            duration: const Duration(milliseconds: 300),
                            transitionBuilder: (Widget child, Animation<double> animation) {
                              return ScaleTransition(scale: animation, child: child);
                            },
                            child: TextWidget(
                              key: ValueKey<int>(item.quantity),
                              text: item.quantity.toString(), 
                              color: ColorStyles.textPrimary, 
                              fontWeight: FontWeight.bold, 
                              fontSize: 14
                            ),
                          ),
                        ),
                        Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: const BorderRadius.horizontal(right: Radius.circular(10)),
                            onTap: () => controller.incrementItem(item),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              alignment: Alignment.center,
                              child: Icon(Icons.add_rounded, color: ColorStyles.textSecondary, size: 18),
                            ),
                          ),
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

  void _showSizeOptions(BuildContext context, CartItem item, EditOrderController controller) {
    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextWidget(text: "Select Size", fontSize: 20, fontWeight: FontWeight.bold, color: ColorStyles.textPrimary),
                IconButton(
                  onPressed: () => Get.back(),
                  icon: const Icon(Icons.close_rounded, color: Colors.black),
                  style: IconButton.styleFrom(backgroundColor: ColorStyles.surfaceColor),
                )
              ],
            ),
            const SizedBox(height: 16),
            Flexible(
              child: item.product.sizes.isEmpty
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: TextWidget(text: "No size options available.", color: Colors.grey),
                  )
                : ListView.separated(
                    shrinkWrap: true,
                    itemCount: item.product.sizes.length,
                    separatorBuilder: (c, i) => Divider(color: Colors.grey.shade100, height: 16),
                    itemBuilder: (context, index) {
                      final size = item.product.sizes[index];
                  final isSelected = item.selectedSize?.label == size.label;
                  return InkWell(
                    onTap: () {
                      controller.changeItemSize(item, size);
                      Get.back();
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              TextWidget(
                                text: size.label, 
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500, 
                                fontSize: 16, 
                                color: isSelected ? ColorStyles.accentIndigo : ColorStyles.textPrimary
                              ),
                              if (size.qty != null)
                                TextWidget(text: size.qty!, fontSize: 12, color: ColorStyles.textSecondary),
                            ],
                          ),
                          if (isSelected)
                            Icon(Icons.check_circle_rounded, color: ColorStyles.accentIndigo),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
    );
  }

  Widget _buildAddProductButton(BuildContext context, EditOrderController controller) {
    return InkWell(
      onTap: () {
        controller.searchTerm.value = '';
        _showAddProductSheet(context, controller);
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: ColorStyles.accentIndigo.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: ColorStyles.accentIndigo.withOpacity(0.3), style: BorderStyle.solid),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_circle_outline_rounded, color: ColorStyles.accentIndigo),
            const SizedBox(width: 8),
            TextWidget(
              text: "Add New Item", 
              color: ColorStyles.accentIndigo, 
              fontWeight: FontWeight.bold, 
              fontSize: 16
            ),
          ],
        ),
      ),
    );
  }

  void _showAddProductSheet(BuildContext context, EditOrderController controller) {
    Get.bottomSheet(
      Container(
        height: context.height * 0.8,
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextWidget(text: "Add Product", fontSize: 20, fontWeight: FontWeight.bold, color: ColorStyles.textPrimary),
                IconButton(
                  onPressed: () => Get.back(),
                  icon: const Icon(Icons.close_rounded, color: Colors.black),
                  style: IconButton.styleFrom(backgroundColor: ColorStyles.surfaceColor),
                )
              ],
            ),
            const SizedBox(height: 16),
            // Search Bar
            TextField(
              onChanged: (val) => controller.searchTerm.value = val,
              decoration: InputDecoration(
                hintText: "Search products...",
                prefixIcon: Icon(Icons.search, color: ColorStyles.textSecondary),
                filled: true,
                fillColor: ColorStyles.surfaceColor,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: Obx(() {
                final products = controller.searchProducts;
                if (controller.searchTerm.value.isEmpty) {
                  return Center(
                    child: TextWidget(text: "Type to search for products", color: ColorStyles.textSecondary),
                  );
                }
                if (products.isEmpty) {
                  return Center(
                    child: TextWidget(text: "No products found", color: ColorStyles.textSecondary),
                  );
                }
                return ListView.builder(
                  itemCount: products.length,
                  itemBuilder: (context, index) {
                    final product = products[index];
                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(vertical: 8),
                      leading: Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
                        child: Image.network(product.image, errorBuilder: (_,__,___) => const Icon(Icons.image_not_supported)),
                      ),
                      title: TextWidget(text: product.name, fontWeight: FontWeight.bold, color: ColorStyles.textPrimary),
                      subtitle: TextWidget(text: product.category, color: ColorStyles.textSecondary, fontSize: 12),
                      trailing: ElevatedButton(
                        onPressed: () {
                          if (product.sizes.length > 1) {
                            Get.back(); // close search sheet
                            _showProductOptionsBeforeAdding(context, controller, product);
                          } else {
                            controller.addNewProduct(product, product.sizes.isNotEmpty ? product.sizes.first : null);
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: ColorStyles.accentIndigo,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const TextWidget(text: "Add", color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    );
                  },
                );
              }),
            ),
          ],
        ),
      ),
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
    );
  }

  void _showProductOptionsBeforeAdding(BuildContext context, EditOrderController controller, Product product) {
    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: TextWidget(text: "Select Size for ${product.name}", fontSize: 18, fontWeight: FontWeight.bold, color: ColorStyles.textPrimary, maxLines: 2)),
                IconButton(
                  onPressed: () => Get.back(),
                  icon: const Icon(Icons.close_rounded, color: Colors.black),
                  style: IconButton.styleFrom(backgroundColor: ColorStyles.surfaceColor),
                )
              ],
            ),
            const SizedBox(height: 16),
            Flexible(
              child: product.sizes.isEmpty
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: TextWidget(text: "No size options available.", color: Colors.grey),
                  )
                : ListView.separated(
                    shrinkWrap: true,
                    itemCount: product.sizes.length,
                    separatorBuilder: (c, i) => Divider(color: Colors.grey.shade100, height: 16),
                    itemBuilder: (context, index) {
                      final size = product.sizes[index];
                  return InkWell(
                    onTap: () {
                      controller.addNewProduct(product, size);
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              TextWidget(
                                text: size.label, 
                                fontWeight: FontWeight.w500, 
                                fontSize: 16, 
                                color: ColorStyles.textPrimary
                              ),
                              if (size.qty != null)
                                TextWidget(text: size.qty!, fontSize: 12, color: ColorStyles.textSecondary),
                            ],
                          ),
                          Icon(Icons.add_circle_outline_rounded, color: ColorStyles.accentIndigo),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
    );
  }

  Widget _buildBottomAction(BuildContext context, EditOrderController controller) {
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
          child: Obx(() => ElevatedButton(
            onPressed: controller.isSaving.value ? null : () => controller.saveChanges(),
            style: ElevatedButton.styleFrom(
              backgroundColor: ColorStyles.accentIndigo,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 4,
              shadowColor: ColorStyles.accentIndigo.withOpacity(0.4),
            ),
            child: controller.isSaving.value 
              ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const TextWidget(
                text: "Save Changes",
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
          )),
        ),
      ),
    );
  }
}
