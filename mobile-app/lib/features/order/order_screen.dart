import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:loginapp/core/app/controllers/order_controller.dart';
import 'package:loginapp/core/utils/colors.dart';
import 'package:loginapp/core/utils/responsive_utils.dart';
import 'package:loginapp/core/widgets/safe_area_widget.dart';
import 'package:loginapp/core/widgets/text_widget.dart';
import 'package:loginapp/features/responsive/responsive.dart';
import 'package:loginapp/core/routes/app_routes.dart';
import 'package:cached_network_image/cached_network_image.dart';

class OrderScreen extends StatelessWidget {
  const OrderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ResponsiveWidget(
      mobileScreen: OrderScreenMobile(),
      tabletScreen: OrderScreenMobile() // Reusing mobile for tablet for now
    );
  }
}

class OrderScreenMobile extends StatefulWidget {
  const OrderScreenMobile({super.key});

  @override
  State<OrderScreenMobile> createState() => _OrderScreenMobileState();
}

class _OrderScreenMobileState extends State<OrderScreenMobile> {
  final OrderController controller = Get.find<OrderController>();
  bool showFilters = false;

  @override
  Widget build(BuildContext context) {
    return SafeAreaWidget(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextWidget(
              text: "🛒 Indian Grocery Store",
              color: ColorStyles.whiteColor,
              fontSize: context.scale(16),
              fontWeight: FontWeight.bold,
            ),
            TextWidget(
              text: "Fresh vegetables, fruits, dairy, and more",
              color: Colors.white70,
              fontSize: context.scale(10),
            )
          ],
        ),
        backgroundColor: ColorStyles.primaryColor,
        iconTheme: IconThemeData(color: ColorStyles.whiteColor),
        actions: [
          Obx(() {
            int cartCount = controller.cart.fold(0, (sum, item) => sum + item.quantity);
            return Stack(
              alignment: Alignment.center,
              children: [
                IconButton(
                  icon: Icon(Icons.shopping_cart),
                  onPressed: () {
                    Get.toNamed(AppRoutes.cart);
                  },
                ),
                if (cartCount > 0)
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      constraints: BoxConstraints(
                        minWidth: 16,
                        minHeight: 16,
                      ),
                      child: Text(
                        '$cartCount',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            );
          }),
        ],
      ),
      body: Column(
        children: [
          // Search and Filter Bar
          Container(
            padding: EdgeInsets.all(context.scale(12)),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    onChanged: (val) => controller.searchTerm.value = val,
                    decoration: InputDecoration(
                      hintText: "Search for products...",
                      prefixIcon: Icon(Icons.search, color: Colors.grey),
                      contentPadding: EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.green),
                      ),
                    ),
                  ),
                ),
                SizedBox(width: context.scale(10)),
                InkWell(
                  onTap: () {
                    setState(() {
                      showFilters = !showFilters;
                    });
                  },
                  child: Container(
                    padding: EdgeInsets.all(context.scale(12)),
                    decoration: BoxDecoration(
                      color: Colors.green.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.filter_list, color: Colors.green.shade700),
                  ),
                )
              ],
            ),
          ),
          
          // Filters
          if (showFilters)
            Container(
              padding: EdgeInsets.symmetric(horizontal: context.scale(12), vertical: context.scale(8)),
              color: Colors.grey.shade50,
              width: double.infinity,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextWidget(text: "Filter by category", fontWeight: FontWeight.bold, color: Colors.grey.shade700),
                  SizedBox(height: context.scale(8)),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Obx(() => Row(
                      children: controller.categories.map((category) {
                        bool isSelected = controller.selectedCategory.value == category;
                        return Padding(
                          padding: EdgeInsets.only(right: context.scale(8)),
                          child: InkWell(
                            onTap: () {
                              if (isSelected) {
                                controller.selectedCategory.value = '';
                              } else {
                                controller.selectedCategory.value = category;
                              }
                            },
                            child: Container(
                              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: isSelected ? Colors.blue.shade600 : Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: isSelected ? Colors.blue.shade600 : Colors.grey.shade300)
                              ),
                              child: TextWidget(
                                text: category,
                                color: isSelected ? Colors.white : Colors.grey.shade700,
                                fontSize: context.scale(12),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    )),
                  )
                ],
              ),
            ),
          
          // Product Grid
          Expanded(
            child: NotificationListener<ScrollNotification>(
              onNotification: (scrollInfo) {
                if (scrollInfo.metrics.pixels >= scrollInfo.metrics.maxScrollExtent - 200) {
                  controller.loadMore();
                }
                return false;
              },
              child: Obx(() {
                final products = controller.filteredProducts;
                if (products.isEmpty) {
                  return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text("🔍", style: TextStyle(fontSize: 48)),
                      SizedBox(height: 16),
                      Text("No products found", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey.shade700)),
                      Text("Try adjusting your search or filters", style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                );
              }

              return GridView.builder(
                padding: EdgeInsets.all(context.scale(12)),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: context.scale(context.screenWidth) > 600 ? 3 : 2,
                  childAspectRatio: 0.65,
                  crossAxisSpacing: context.scale(12),
                  mainAxisSpacing: context.scale(12),
                ),
                itemCount: products.length + (controller.hasMore.value ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == products.length) {
                    return Center(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: Obx(() => controller.isLoadingMore.value
                          ? const CircularProgressIndicator()
                          : const SizedBox.shrink()),
                      ),
                    );
                  }
                  final product = products[index];
                  return Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))
                      ]
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Image
                        Expanded(
                          child: Stack(
                            children: [
                              Container(
                                width: double.infinity,
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade200,
                                  borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                                  image: DecorationImage(
                                    image: CachedNetworkImageProvider(product.image),
                                    fit: BoxFit.cover,
                                    onError: (obj, trace) => const SizedBox(), // handle broken image
                                  )
                                ),
                              ),
                              Positioned(
                                top: 8,
                                right: 8,
                                child: Container(
                                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.blue.shade600,
                                    borderRadius: BorderRadius.circular(10)
                                  ),
                                  child: TextWidget(text: product.category, color: Colors.white, fontSize: context.scale(10)),
                                ),
                              )
                            ],
                          ),
                        ),
                        // Details
                        Padding(
                          padding: EdgeInsets.all(context.scale(8)),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              TextWidget(text: product.name, fontWeight: FontWeight.bold, fontSize: context.scale(14), maxLines: 1),
                              SizedBox(height: 4),
                              TextWidget(text: product.description, color: Colors.grey.shade600, fontSize: context.scale(10), maxLines: 2),
                              // Price hidden per user request
                              SizedBox(height: 8),
                              SizedBox(height: 8),
                              
                              // Quantity Controls
                              Obx(() {
                                int qty = controller.quantities[product.id] ?? 1;
                                return Row(
                                  children: [
                                    InkWell(
                                      onTap: () => controller.updateQuantity(product.id, qty - 1),
                                      child: Container(
                                        padding: EdgeInsets.all(4),
                                        decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(4)),
                                        child: Icon(Icons.remove, size: 16),
                                      ),
                                    ),
                                    Expanded(child: Center(child: TextWidget(text: "$qty", fontWeight: FontWeight.bold))),
                                    InkWell(
                                      onTap: () => controller.updateQuantity(product.id, qty + 1),
                                      child: Container(
                                        padding: EdgeInsets.all(4),
                                        decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(4)),
                                        child: Icon(Icons.add, size: 16),
                                      ),
                                    ),
                                  ],
                                );
                              }),
                              
                              SizedBox(height: 8),
                              
                              // Add to cart
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: () => controller.addToCart(product),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.blue.shade600,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    padding: EdgeInsets.symmetric(vertical: 8)
                                  ),
                                  child: TextWidget(text: "Add to Cart", color: Colors.white, fontWeight: FontWeight.w600, fontSize: context.scale(12)),
                                ),
                              )
                            ],
                          ),
                        )
                      ],
                    ),
                  );
                },
              );
            }),
            ),
          )
        ],
      ),
    );
  }
}
