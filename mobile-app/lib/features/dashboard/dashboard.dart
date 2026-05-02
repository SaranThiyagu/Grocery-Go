import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:loginapp/core/app/controllers/dashboard_controller.dart';
import 'package:loginapp/core/app/controllers/global_controller.dart';
import 'package:loginapp/core/models/order_model.dart';
import 'package:loginapp/core/utils/colors.dart';
import 'package:loginapp/core/routes/app_routes.dart';
import 'package:loginapp/core/widgets/safe_area_widget.dart';
import 'package:loginapp/core/widgets/text_widget.dart';
import 'package:loginapp/features/responsive/responsive.dart';
import 'package:loginapp/core/utils/responsive_utils.dart';
import 'package:loginapp/core/app/controllers/auth_controller.dart';

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
        backgroundColor: Colors.blue.shade800,
        iconTheme: IconThemeData(color: ColorStyles.whiteColor),
        actions: [
          IconButton(
            icon: Icon(Icons.notifications_none),
            onPressed: () {
              Get.toNamed(AppRoutes.notifications);
            },
          ),
          IconButton(
            icon: Icon(Icons.person),
            onPressed: () {
              Get.toNamed(AppRoutes.profile);
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
        child: Column(
          children: [
            UserAccountsDrawerHeader(
              decoration: BoxDecoration(color: Colors.blue.shade800),
              accountName: Text(gc.name.value),
              accountEmail: Text(gc.email.value),
              currentAccountPicture: CircleAvatar(
                backgroundColor: Colors.white,
                child: Text(gc.name.value.isNotEmpty ? gc.name.value[0] : 'U', style: TextStyle(color: Colors.blue.shade800, fontSize: 24)),
              ),
            ),
            ListTile(
              leading: Icon(Icons.shopping_cart_outlined),
              title: TextWidget(text: 'Shop Grocery', fontSize: context.scale(12), fontWeight: FontWeight.w600),
              onTap: () {
                Navigator.pop(context);
                Get.toNamed(AppRoutes.order);
              },
            ),
            ListTile(
              leading: Icon(Icons.logout_outlined),
              title: TextWidget(text: 'Logout', fontSize: context.scale(12), fontWeight: FontWeight.w600),
              onTap: () async {
                Get.find<AuthController>().logout();
              },
            ),
          ],
        ),
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(context.scale(16)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Banner
                  Container(
                    padding: EdgeInsets.all(context.scale(20)),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [Colors.blue.shade600, Colors.purple.shade600]),
                      borderRadius: BorderRadius.circular(16)
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              TextWidget(text: "Welcome back, ${gc.name.value}!", fontSize: context.scale(18), fontWeight: FontWeight.bold, color: Colors.white),
                              SizedBox(height: 8),
                              TextWidget(text: "Shop fresh Indian groceries and track your orders", fontSize: context.scale(12), color: Colors.blue.shade100),
                            ],
                          ),
                        ),
                        Icon(Icons.shopping_basket, color: Colors.white.withValues(alpha: 0.5), size: 48)
                      ],
                    ),
                  ),
                  SizedBox(height: 24),
                  
                  // Stats Array
                  Obx(() => GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.5,
                    children: [
                      _buildStatCard("Total Orders", controller.orderCount.toString(), Icons.inventory_2, Colors.indigo),
                      _buildStatCard("Confirmed", controller.confirmedCount.toString(), Icons.verified, Colors.green),
                      _buildStatCard("Processing", controller.processingCount.toString(), Icons.loop, Colors.blue),
                      _buildStatCard("Completed", controller.completedCount.toString(), Icons.check_circle, Colors.teal),
                    ],
                  )),
                  const SizedBox(height: 24),

                  // Orders Header
                  Obx(() => TextWidget(
                    text: "Recent Orders (${controller.filteredAndSortedOrders.length})", 
                    fontSize: context.scale(16), 
                    fontWeight: FontWeight.bold
                  )),
                  const SizedBox(height: 12),
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
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade200),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 4, offset: const Offset(0, 2))],
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      TextWidget(text: order.orderNo, fontWeight: FontWeight.bold),
                                      const SizedBox(width: 12),
                                      _buildStatusBadge(order.status),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  TextWidget(text: "${order.items.length} items", color: Colors.grey.shade600, fontSize: context.scale(12)),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      const Icon(Icons.calendar_today, size: 12, color: Colors.grey),
                                      const SizedBox(width: 4),
                                      TextWidget(text: "${order.createdAt.day}/${order.createdAt.month}/${order.createdAt.year}", color: Colors.grey, fontSize: context.scale(10)),
                                    ],
                                  )
                                ],
                              ),
                            ),
                            
                            // Actions
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                TextButton.icon(
                                  onPressed: () => _showOrderDetails(order),
                                  icon: const Icon(Icons.remove_red_eye, size: 16),
                                  label: const Text("View"),
                                  style: TextButton.styleFrom(foregroundColor: Colors.indigo, padding: const EdgeInsets.symmetric(horizontal: 8)),
                                ),
                                if (order.status == 'confirmed')
                                  TextButton.icon(
                                    onPressed: () => _showCancelDialog(order.id),
                                    icon: const Icon(Icons.delete_outline, size: 16),
                                    label: const Text("Cancel"),
                                    style: TextButton.styleFrom(foregroundColor: Colors.red, padding: const EdgeInsets.symmetric(horizontal: 8)),
                                  ),
                                if (order.status == 'processing')
                                  TextButton.icon(
                                    onPressed: () => controller.updateOrderStatus(order.id, 'completed'),
                                    icon: const Icon(Icons.check_circle_outline, size: 16),
                                    label: const Text("Complete"),
                                    style: TextButton.styleFrom(foregroundColor: Colors.green, padding: const EdgeInsets.symmetric(horizontal: 8)),
                                  )
                              ],
                            )
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
    );
  }

  Widget _buildStatCard(String title, String count, IconData icon, Color color) {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
      ),
      child: Stack(
        children: [
          Align(
            alignment: Alignment.topRight,
            child: Icon(icon, color: color.withValues(alpha: 0.8), size: 28),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextWidget(text: title, fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w500),
              TextWidget(text: count, fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black87),
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

  void _showOrderDetails(OrderModel order) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text("Order Details - ${order.orderNo}"),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildStatusBadge(order.status),
                  Text("${order.createdAt.day}/${order.createdAt.month}/${order.createdAt.year}", style: TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ),
              SizedBox(height: 16),
              Text("Items", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              SizedBox(height: 8),
              Expanded(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: order.items.length,
                  itemBuilder: (context, index) {
                    final item = order.items[index];
                    return Container(
                      margin: EdgeInsets.only(bottom: 8),
                      padding: EdgeInsets.all(12),
                      decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(8)),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(item.name, style: TextStyle(fontWeight: FontWeight.w500)),
                          Text("Qty: ${item.quantity}", style: TextStyle(color: Colors.grey.shade600)),
                        ],
                      ),
                    );
                  },
                ),
              ),
              SizedBox(height: 16),
              Align(
                alignment: Alignment.centerRight,
                child: Text("Total: \$${order.totalAmount.toStringAsFixed(2)}", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.blue.shade800)),
              )
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text("Close"),
          )
        ],
      )
    );
  }

  void _showCancelDialog(String orderId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text("Are you sure?"),
        content: Text("This action cannot be undone. This will permanently cancel your order."),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text("Close"),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () {
              controller.cancelOrder(orderId);
              Navigator.pop(context);
              Get.snackbar("Order cancelled", "Order has been cancelled successfully.", snackPosition: SnackPosition.BOTTOM);
            },
            child: Text("Confirm Cancellation"),
          )
        ],
      )
    );
  }
}
