import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:loginapp/core/app/controllers/dashboard_controller.dart';
import 'package:loginapp/core/app/controllers/global_controller.dart';
import 'package:loginapp/core/app/controllers/local_storage_controller.dart' as app_storage;
import 'package:loginapp/core/utils/colors.dart';
import 'package:loginapp/core/utils/route_function.dart';
import 'package:loginapp/core/widgets/safe_area_widget.dart';
import 'package:loginapp/core/widgets/text_widget.dart';
import 'package:loginapp/features/order/order_screen.dart';
import 'package:loginapp/features/profile/profile_screen.dart';
import 'package:loginapp/features/responsive/responsive.dart';
import 'package:loginapp/core/utils/responsive_utils.dart';
import 'package:loginapp/core/app/controllers/auth_controller.dart';
import 'package:loginapp/features/order_edit/edit_order_screen.dart';

class Dashboard extends StatelessWidget {
  const Dashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return ResponsiveWidget(
      mobileScreen: DashboardMobile(),
      tabletScreen: DashboardMobile(), // Reusing for now
    );
  }
}

class DashboardMobile extends StatefulWidget {
  const DashboardMobile({super.key});

  @override
  State<DashboardMobile> createState() => _DashboardMobileState();
}

class _DashboardMobileState extends State<DashboardMobile> {
  final GlobalController gc = Get.find<GlobalController>();
  final DashboardController controller = Get.find<DashboardController>();

  @override
  Widget build(BuildContext context) {
    return SafeAreaWidget(
      appBar: AppBar(
        title: TextWidget(
          text: "🛒 Indian Grocery",
          color: ColorStyles.whiteColor,
          fontSize: context.scale(16),
          fontWeight: FontWeight.bold,
        ),
        backgroundColor: ColorStyles.primaryColor,
        iconTheme: IconThemeData(color: ColorStyles.whiteColor),
        actions: [
          IconButton(
            icon: Icon(Icons.person),
            onPressed: () {
              AppRoute.getTo(() => ProfileScreen());
            },
          ),
          Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: CircleAvatar(
              backgroundColor: Colors.blue.shade100,
              child: Text(gc.name.value.isNotEmpty ? gc.name.value[0] : 'U'),
            ),
          )
        ],
      ),
      drawer: Drawer(
        backgroundColor: ColorStyles.surfaceColor,
        child: Column(
          children: [
            Container(
              padding: EdgeInsets.fromLTRB(20, 60, 20, 30),
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [ColorStyles.accentIndigo, ColorStyles.accentBlue],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: Colors.white.withOpacity(0.2),
                    child: Text(
                      gc.name.value.isNotEmpty ? gc.name.value[0] : 'U',
                      style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextWidget(text: gc.name.value, fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                  TextWidget(text: gc.email.value, fontSize: 12, color: Colors.white70),
                ],
              ),
            ),
            const SizedBox(height: 20),
            _buildDrawerItem(Icons.shopping_bag_outlined, 'Shop Grocery', () {
              Navigator.pop(context);
              AppRoute.getTo(() => const OrderScreen());
            }),
            const Spacer(),
            Divider(color: Colors.grey.shade200, indent: 20, endIndent: 20),
            _buildDrawerItem(Icons.logout_rounded, 'Logout', () async {
              Get.find<AuthController>().logout();
            }, isLogout: true),
            const SizedBox(height: 20),
          ],
        ),
      ),
      body: Container(
        color: ColorStyles.surfaceColor,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(context.scale(20)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Professional Welcome Banner
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.all(context.scale(24)),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [ColorStyles.accentIndigo, ColorStyles.accentBlue],
                        ),
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: ColorStyles.accentIndigo.withOpacity(0.3),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          )
                        ],
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            right: -20,
                            bottom: -20,
                            child: Icon(
                              Icons.shopping_bag_outlined,
                              size: 100,
                              color: Colors.white.withOpacity(0.1),
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              TextWidget(
                                text: "Hello, ${gc.name.value}!",
                                fontSize: context.scale(22),
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                              const SizedBox(height: 8),
                              TextWidget(
                                text: "Ready for some fresh groceries today?",
                                fontSize: context.scale(13),
                                color: Colors.white.withOpacity(0.9),
                              ),
                              const SizedBox(height: 20),
                              ElevatedButton(
                                onPressed: () => AppRoute.getTo(() => const OrderScreen()),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: ColorStyles.accentIndigo,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                  elevation: 0,
                                ),
                                child: const TextWidget(text: "Shop Now", fontWeight: FontWeight.bold, color: Colors.indigo),
                              )
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                    
                    // Modern Stats Grid
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        TextWidget(text: "Quick Insights", fontSize: context.scale(16), fontWeight: FontWeight.bold, color: ColorStyles.textPrimary),
                        Icon(Icons.insights_rounded, color: ColorStyles.textSecondary, size: 20),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Obx(() => GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                      childAspectRatio: 1.4,
                      children: [
                        _buildStatCard("Total Orders", controller.orderCount.toString(), Icons.inventory_2_outlined, ColorStyles.accentIndigo),
                        _buildStatCard("Confirmed", controller.confirmedCount.toString(), Icons.verified_outlined, ColorStyles.accentTeal),
                        _buildStatCard("Processing", controller.processingCount.toString(), Icons.cached_rounded, Colors.orange),
                        _buildStatCard("Completed", controller.completedCount.toString(), Icons.check_circle_outline_rounded, Colors.green),
                      ],
                    )),
                    const SizedBox(height: 32),
  
                    // Recent Orders Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Obx(() => TextWidget(
                          text: "Recent Orders (${controller.filteredAndSortedOrders.length})", 
                          fontSize: context.scale(16), 
                          fontWeight: FontWeight.bold,
                          color: ColorStyles.textPrimary,
                        )),
                        TextButton(
                          onPressed: () {}, 
                          child: TextWidget(text: "View All", color: ColorStyles.accentBlue, fontWeight: FontWeight.w600)
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          
          // Orders List
          Obx(() {
            final orders = controller.filteredAndSortedOrders;
            if (orders.isEmpty) {
              return SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey.shade300),
                      const SizedBox(height: 16),
                      TextWidget(text: "No orders found", fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey.shade600),
                      const TextWidget(text: "Try adjusting your search criteria", color: Colors.grey),
                    ],
                  ),
                ),
              );
            }

            return SliverPadding(
              padding: EdgeInsets.symmetric(horizontal: context.scale(16), vertical: 0),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final order = orders[index];
                    return GestureDetector(
                      onTap: () => _showOrderDetails(order),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: ColorStyles.cardColor,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: ColorStyles.shadowColor,
                              blurRadius: 15,
                              offset: const Offset(0, 5),
                            )
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: ColorStyles.accentIndigo.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(Icons.receipt_long_rounded, color: ColorStyles.accentIndigo, size: 24),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      TextWidget(text: order.orderNo, fontWeight: FontWeight.bold, fontSize: context.scale(14), color: ColorStyles.textPrimary),
                                      _buildStatusBadge(order.status),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  TextWidget(text: "${order.items.length} items", color: ColorStyles.textSecondary, fontSize: context.scale(12)),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      Icon(Icons.calendar_today_rounded, size: 12, color: ColorStyles.textSecondary),
                                      const SizedBox(width: 4),
                                      TextWidget(text: "${order.createdAt.day}/${order.createdAt.month}/${order.createdAt.year}", color: ColorStyles.textSecondary, fontSize: context.scale(11)),
                                    ],
                                  )
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                  childCount: orders.length,
                ),
              ),
            );
          }),
          
          SliverToBoxAdapter(child: SizedBox(height: 32)),
        ],
      ),
    ),
    );
  }

  Widget _buildStatCard(String title, String count, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: ColorStyles.cardColor,
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
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextWidget(text: count, fontSize: 22, fontWeight: FontWeight.bold, color: ColorStyles.textPrimary),
              TextWidget(text: title, fontSize: 11, color: ColorStyles.textSecondary, fontWeight: FontWeight.w500),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg;
    Color fg;
    IconData icon;
    
    switch(status) {
      case 'completed': bg = Colors.teal.shade100; fg = Colors.teal.shade800; icon = Icons.check_circle; break;
      case 'processing': bg = Colors.blue.shade100; fg = Colors.blue.shade800; icon = Icons.loop; break;
      case 'confirmed': bg = Colors.green.shade100; fg = Colors.green.shade800; icon = Icons.verified; break;
      default: bg = Colors.grey.shade100; fg = Colors.grey.shade800; icon = Icons.info; break;
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: fg),
          SizedBox(width: 4),
          TextWidget(text: status.capitalizeFirst ?? status, color: fg, fontSize: 10, fontWeight: FontWeight.bold),
        ],
      ),
    );
  }

  Widget _buildDrawerItem(IconData icon, String title, VoidCallback onTap, {bool isLogout = false}) {
    return ListTile(
      leading: Icon(icon, color: isLogout ? Colors.red.shade400 : ColorStyles.accentIndigo, size: 22),
      title: TextWidget(
        text: title, 
        fontSize: 14, 
        fontWeight: FontWeight.w600,
        color: isLogout ? Colors.red.shade400 : ColorStyles.textPrimary,
      ),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 24),
    );
  }

  void _showOrderDetails(OrderModel order) {
    Get.dialog(
      Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextWidget(text: "Order Details", fontSize: 18, fontWeight: FontWeight.bold, color: ColorStyles.textPrimary),
                  IconButton(
                    onPressed: () => Get.back(),
                    icon: const Icon(Icons.close_rounded),
                    style: IconButton.styleFrom(backgroundColor: ColorStyles.surfaceColor),
                  )
                ],
              ),
              const SizedBox(height: 8),
              TextWidget(text: "Order ID: ${order.orderNo}", fontSize: 12, color: ColorStyles.textSecondary),
              const SizedBox(height: 20),
              _buildStatusBadge(order.status),
              const SizedBox(height: 24),
              TextWidget(text: "Items", fontSize: 14, fontWeight: FontWeight.bold, color: ColorStyles.textPrimary),
              const SizedBox(height: 12),
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: order.items.length,
                  itemBuilder: (context, index) {
                    final item = order.items[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: ColorStyles.surfaceColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          TextWidget(text: item.name, fontWeight: FontWeight.w600, color: ColorStyles.textPrimary),
                          TextWidget(text: "Qty: ${item.quantity}", color: ColorStyles.textSecondary),
                        ],
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 16),
              const SizedBox(height: 24),
              if (order.status.toLowerCase() == 'ordered') ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Get.back(); // close dialog
                      AppRoute.getTo(() => EditOrderScreen(order: order));
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: ColorStyles.accentIndigo,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: ColorStyles.accentIndigo),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.edit_rounded, color: ColorStyles.accentIndigo, size: 18),
                        const SizedBox(width: 8),
                        const TextWidget(text: "Edit Order", fontWeight: FontWeight.bold),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Get.back(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ColorStyles.accentIndigo,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const TextWidget(text: "Close", fontWeight: FontWeight.bold, color: Colors.white),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  void _showCancelDialog(String orderId) {
    Get.dialog(
      AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const TextWidget(text: "Cancel Order", fontSize: 18, fontWeight: FontWeight.bold),
        content: const TextWidget(text: "Are you sure you want to cancel this order? This action cannot be undone.", color: ColorStyles.fontColor),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: const TextWidget(text: "Keep Order", fontWeight: FontWeight.bold, color: ColorStyles.fontColor),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              controller.cancelOrder(orderId);
              Get.back();
              Get.snackbar("Order cancelled", "Order has been cancelled successfully.", snackPosition: SnackPosition.BOTTOM, backgroundColor: Colors.white, colorText: Colors.black);
            },
            child: const TextWidget(text: "Yes, Cancel", fontWeight: FontWeight.bold, color: Colors.white),
          )
        ],
      )
    );
  }
}
