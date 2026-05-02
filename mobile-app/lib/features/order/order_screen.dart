import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:loginapp/core/app/controllers/order_controller.dart';
import 'package:loginapp/core/utils/colors.dart';
import 'package:loginapp/core/utils/responsive_utils.dart';
import 'package:loginapp/core/widgets/safe_area_widget.dart';
import 'package:loginapp/core/widgets/text_widget.dart';
import 'package:loginapp/features/responsive/responsive.dart';
import 'package:loginapp/features/cart/cart_screen.dart';
import 'package:loginapp/features/order/widgets/product_variant_sheet.dart';

class OrderScreen extends StatelessWidget {
  const OrderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ResponsiveWidget(
      mobileScreen: const OrderScreenMobile(),
      tabletScreen: const OrderScreenMobile()
    );
  }
}

class OrderScreenMobile extends StatefulWidget {
  const OrderScreenMobile({super.key});

  @override
  State<OrderScreenMobile> createState() => _OrderScreenMobileState();
}

class _OrderScreenMobileState extends State<OrderScreenMobile> {
  final OrderController controller = Get.put(OrderController());
  final ScrollController _scrollController = ScrollController();
  final Map<String, GlobalKey> _categoryKeys = {};

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: SafeAreaWidget(
        body: Column(
          children: [
            _buildAppBar(context),
            _buildSearchBar(context),
            _buildCategoryQuickLinks(context),
            Expanded(
              child: Obx(() {
                final groupedProducts = controller.groupedProducts;
                if (groupedProducts.isEmpty) {
                  return _buildEmptyState(context);
                }

                return CustomScrollView(
                  controller: _scrollController,
                  physics: const BouncingScrollPhysics(),
                  slivers: groupedProducts.entries.map((entry) {
                    final category = entry.key;
                    final products = entry.value;
                    _categoryKeys.putIfAbsent(category, () => GlobalKey());

                    return SliverMainAxisGroup(
                      key: _categoryKeys[category],
                      slivers: [
                        SliverToBoxAdapter(
                          child: _buildCategoryHeader(category, products.length, context),
                        ),
                        SliverPadding(
                          padding: EdgeInsets.symmetric(horizontal: context.scale(16)),
                          sliver: SliverGrid(
                            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: context.screenWidth > 600 ? 3 : 2,
                              childAspectRatio: 0.68,
                              crossAxisSpacing: context.scale(12),
                              mainAxisSpacing: context.scale(12),
                            ),
                            delegate: SliverChildBuilderDelegate(
                              (context, index) => _buildProductCard(products[index], context),
                              childCount: products.length,
                            ),
                          ),
                        ),
                        const SliverToBoxAdapter(child: SizedBox(height: 24)),
                      ],
                    );
                  }).toList(),
                );
              }),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(context.scale(20), context.scale(16), context.scale(12), context.scale(8)),
      color: ColorStyles.surfaceColor,
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextWidget(text: "Fresh Essentials", color: ColorStyles.textPrimary, fontSize: context.scale(20), fontWeight: FontWeight.bold),
                TextWidget(text: "Premium Indian Grocery", color: ColorStyles.textSecondary, fontSize: context.scale(12))
              ],
            ),
          ),
          Obx(() {
            int cartCount = controller.cart.fold(0, (sum, item) => sum + item.quantity);
            return Stack(
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [BoxShadow(color: ColorStyles.shadowColor, blurRadius: 10)]
                  ),
                  child: IconButton(
                    icon: Icon(Icons.shopping_basket_outlined, color: ColorStyles.accentIndigo),
                    onPressed: () => Get.to(() => const CartScreen()),
                  ),
                ),
                if (cartCount > 0)
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                      constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                      child: Text(
                        '$cartCount',
                        style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  )
              ],
            );
          }),
        ],
      ),
    );
  }

  Widget _buildSearchBar(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: context.scale(20), vertical: context.scale(12)),
      color: ColorStyles.surfaceColor,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: ColorStyles.shadowColor,
              blurRadius: 15,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: TextField(
          onChanged: (val) => controller.searchTerm.value = val,
          style: TextStyle(color: ColorStyles.textPrimary, fontSize: 14),
          decoration: InputDecoration(
            hintText: "Search items, brands, categories...",
            hintStyle: TextStyle(color: ColorStyles.textSecondary, fontSize: 14),
            prefixIcon: Icon(Icons.search_rounded, color: ColorStyles.accentIndigo),
            suffixIcon: Icon(Icons.tune_rounded, color: ColorStyles.textSecondary, size: 20),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(vertical: 16),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryQuickLinks(BuildContext context) {
    return Container(
      height: context.scale(44),
      margin: EdgeInsets.symmetric(vertical: context.scale(12)),
      child: Obx(() => ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.symmetric(horizontal: context.scale(20)),
        itemCount: controller.categories.length,
        itemBuilder: (context, index) {
          final category = controller.categories[index];
          final isSelected = controller.selectedCategory.value == category;
          return Padding(
            padding: const EdgeInsets.only(right: 12),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              child: ChoiceChip(
                label: TextWidget(
                  text: category, 
                  fontSize: 13, 
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? Colors.white : ColorStyles.textSecondary
                ),
                selected: isSelected,
                onSelected: (val) => controller.selectedCategory.value = val ? category : '',
                selectedColor: ColorStyles.accentIndigo,
                backgroundColor: Colors.white,
                elevation: isSelected ? 4 : 0,
                pressElevation: 0,
                shadowColor: ColorStyles.accentIndigo.withOpacity(0.4),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: isSelected ? Colors.transparent : Colors.grey.shade200)
                ),
                showCheckmark: false,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
            ),
          );
        },
      )),
    );
  }

  Widget _buildCategoryHeader(String category, int count, BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(context.scale(20), 24, 20, 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 20,
                decoration: BoxDecoration(
                  color: ColorStyles.accentIndigo,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 12),
              TextWidget(text: category, fontWeight: FontWeight.bold, fontSize: 18, color: ColorStyles.textPrimary),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: ColorStyles.accentIndigo.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: TextWidget(text: "$count items", fontSize: 11, fontWeight: FontWeight.bold, color: ColorStyles.accentIndigo),
          )
        ],
      ),
    );
  }

  Widget _buildProductCard(Product product, BuildContext context) {
    final firstSize = product.sizes.isNotEmpty ? product.sizes.first : null;
    final displayPrice = firstSize?.price ?? product.price;

    return GestureDetector(
      onTap: () => _showProductOptions(product, context),
      child: Container(
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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Section
            Expanded(
              flex: 3,
              child: Stack(
                children: [
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Hero(
                        tag: "product_${product.id}",
                        child: Image.network(
                          product.image, 
                          fit: BoxFit.contain, 
                          errorBuilder: (c, e, s) => Icon(Icons.image_not_supported_outlined, color: Colors.grey.shade300, size: 40),
                        ),
                      ),
                    ),
                  ),
                  Obx(() {
                    int totalQty = 0;
                    for (var item in controller.cart) {
                      if (item.product.id == product.id) totalQty += item.quantity;
                    }
                    if (totalQty == 0) return const SizedBox();
                    return Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: ColorStyles.accentIndigo,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(color: ColorStyles.accentIndigo.withOpacity(0.4), blurRadius: 4, offset: const Offset(0, 2))
                          ]
                        ),
                        child: TextWidget(
                          text: totalQty.toString(),
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
            // Info Section
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TextWidget(
                          text: product.name, 
                          fontWeight: FontWeight.bold, 
                          fontSize: 13, 
                          maxLines: 1, 
                          overflow: TextOverflow.ellipsis,
                          color: ColorStyles.textPrimary,
                        ),
                        const SizedBox(height: 2),
                        TextWidget(
                          text: firstSize?.label ?? "", 
                          fontSize: 10, 
                          color: ColorStyles.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ],
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Removed price display
                        const SizedBox(),
                        // Add Button
                        Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: () => _showProductOptions(product, context),
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: ColorStyles.accentIndigo.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(Icons.add_rounded, color: ColorStyles.accentIndigo, size: 18),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showProductOptions(Product product, BuildContext context) {
    Get.bottomSheet(
      ProductVariantSheet(product: product),
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      enterBottomSheetDuration: const Duration(milliseconds: 300),
      exitBottomSheetDuration: const Duration(milliseconds: 200),
    );
  }

  Widget _buildOptionItem(Product product, ProductSize size) {
    final String label = size.label;
    final double price = size.price;
    final String qtyText = size.qty != null && size.qty!.isNotEmpty ? "Qty: ${size.qty}" : "Fresh Stock Available";

    return Row(
      children: [
        // Size Icon/Label
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: ColorStyles.accentIndigo.withOpacity(0.05),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Center(
            child: Icon(Icons.inventory_2_outlined, color: ColorStyles.accentIndigo, size: 24),
          ),
        ),
        const SizedBox(width: 16),
        // Details
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextWidget(text: label, fontWeight: FontWeight.bold, fontSize: 15, color: ColorStyles.textPrimary),
              const SizedBox(height: 2),
              TextWidget(text: qtyText, fontSize: 12, color: ColorStyles.accentTeal, fontWeight: FontWeight.w600),
            ],
          ),
        ),
        // Add Button
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Obx(() {
              final controller = Get.find<OrderController>();
              final int qty = controller.getCartQuantity(product, size);
              
              if (qty == 0) {
                return ElevatedButton(
                  onPressed: () {
                    controller.incrementCart(product, size);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ColorStyles.accentIndigo,
                    foregroundColor: Colors.white,
                    elevation: 4,
                    shadowColor: ColorStyles.accentIndigo.withOpacity(0.4),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
                    minimumSize: const Size(80, 36),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const TextWidget(text: "ADD", fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                );
              }
              
              return Container(
                height: 36,
                decoration: BoxDecoration(
                  color: ColorStyles.accentIndigo,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: ColorStyles.accentIndigo.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    )
                  ]
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: const BorderRadius.horizontal(left: Radius.circular(10)),
                        onTap: () => controller.decrementCart(product, size),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          alignment: Alignment.center,
                          child: const Icon(Icons.remove_rounded, color: Colors.white, size: 18),
                        ),
                      ),
                    ),
                    Container(
                      width: 32,
                      alignment: Alignment.center,
                      color: Colors.white.withOpacity(0.1),
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 300),
                        transitionBuilder: (Widget child, Animation<double> animation) {
                          return ScaleTransition(scale: animation, child: child);
                        },
                        child: TextWidget(
                          key: ValueKey<int>(qty),
                          text: qty.toString(), 
                          color: Colors.white, 
                          fontWeight: FontWeight.bold, 
                          fontSize: 14
                        ),
                      ),
                    ),
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: const BorderRadius.horizontal(right: Radius.circular(10)),
                        onTap: () => controller.incrementCart(product, size),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          alignment: Alignment.center,
                          child: const Icon(Icons.add_rounded, color: Colors.white, size: 18),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ],
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: ColorStyles.surfaceColor,
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.search_off_rounded, size: 64, color: Colors.grey.shade300),
          ),
          const SizedBox(height: 24),
          TextWidget(text: "No Items Found", fontSize: 18, fontWeight: FontWeight.bold, color: ColorStyles.textPrimary),
          const SizedBox(height: 8),
          TextWidget(text: "We couldn't find what you're looking for.\nTry a different search term.", color: ColorStyles.textSecondary, textAlign: TextAlign.center),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () {
              controller.searchTerm.value = '';
              controller.selectedCategory.value = '';
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: ColorStyles.accentIndigo,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const TextWidget(text: "Clear Filters", fontWeight: FontWeight.bold, color: Colors.white),
          )
        ],
      ),
    );
  }

  Widget _buildQtyBtn(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(4),
        child: Icon(icon, size: 14, color: ColorStyles.primaryColor),
      ),
    );
  }
}
