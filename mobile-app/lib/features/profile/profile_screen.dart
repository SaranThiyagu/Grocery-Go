import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:loginapp/core/app/controllers/dashboard_controller.dart';
import 'package:loginapp/core/app/controllers/global_controller.dart';
import 'package:loginapp/core/app/controllers/local_storage_controller.dart';
import 'package:loginapp/core/app/controllers/order_controller.dart';
import 'package:loginapp/core/utils/colors.dart';
import 'package:loginapp/core/widgets/safe_area_widget.dart';
import 'package:loginapp/core/widgets/text_widget.dart';
import 'package:loginapp/features/responsive/responsive.dart';
import 'package:loginapp/core/utils/responsive_utils.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ResponsiveWidget(
      mobileScreen: ProfileScreenMobile(),
      tabletScreen: ProfileScreenMobile(), 
    );
  }
}

class ProfileScreenMobile extends StatefulWidget {
  const ProfileScreenMobile({super.key});

  @override
  State<ProfileScreenMobile> createState() => _ProfileScreenMobileState();
}

class _ProfileScreenMobileState extends State<ProfileScreenMobile> {
  final GlobalController gc = Get.find<GlobalController>();
  final DashboardController dc = Get.find<DashboardController>();
  final OrderController oc = Get.find<OrderController>();

  bool isEditing = false;
  late TextEditingController nameCtrl;
  late TextEditingController emailCtrl;
  late TextEditingController phoneCtrl;
  late TextEditingController addressCtrl;

  @override
  void initState() {
    super.initState();
    nameCtrl = TextEditingController(text: gc.name.value);
    emailCtrl = TextEditingController(text: gc.email.value);
    phoneCtrl = TextEditingController(text: '+91 98765 43210');
    addressCtrl = TextEditingController(text: '123, Main Street, Mumbai, Maharashtra 400001');
  }

  @override
  void dispose() {
    nameCtrl.dispose();
    emailCtrl.dispose();
    phoneCtrl.dispose();
    addressCtrl.dispose();
    super.dispose();
  }

  void handleSaveProfile() {
    setState(() {
      isEditing = false;
    });
    // In real app, call API to save profile.
    gc.name.value = nameCtrl.text;
    gc.email.value = emailCtrl.text;
    Get.snackbar("Profile Updated", "Your profile details have been saved.");
  }

  void handleCancelEdit() {
    setState(() {
      nameCtrl.text = gc.name.value;
      emailCtrl.text = gc.email.value;
      phoneCtrl.text = '+91 98765 43210';
      addressCtrl.text = '123, Main Street, Mumbai, Maharashtra 400001';
      isEditing = false;
    });
  }

  Widget _buildStatCard(String title, String count, IconData icon, Color color) {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 28),
          SizedBox(height: 8),
          TextWidget(text: count, fontSize: 20, fontWeight: FontWeight.bold, color: color),
          SizedBox(height: 4),
          TextWidget(text: title, fontSize: 12, color: Colors.grey.shade600),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeAreaWidget(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextWidget(
              text: "My Profile",
              color: ColorStyles.whiteColor,
              fontSize: context.scale(18),
              fontWeight: FontWeight.bold,
            ),
            TextWidget(
              text: "Manage your account and preferences",
              color: Colors.white70,
              fontSize: context.scale(10),
            )
          ],
        ),
        backgroundColor: Colors.blue.shade800,
        iconTheme: IconThemeData(color: ColorStyles.whiteColor),
        actions: [
          IconButton(
            icon: Icon(Icons.logout, color: Colors.red.shade300),
            onPressed: () async {
              await LocalStorage.logout();
            },
          )
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User Card
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8)],
                ),
                child: Column(
                  children: [
                    Stack(
                      children: [
                        CircleAvatar(
                          radius: 40,
                          backgroundColor: Colors.blue.shade600,
                          child: Text(gc.name.value.isNotEmpty ? gc.name.value[0] : 'U', style: TextStyle(color: Colors.white, fontSize: 32)),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: InkWell(
                            onTap: () => setState(() => isEditing = !isEditing),
                            child: CircleAvatar(
                              radius: 14,
                              backgroundColor: Colors.blue.shade100,
                              child: Icon(Icons.edit, size: 14, color: Colors.blue.shade800),
                            ),
                          ),
                        )
                      ],
                    ),
                    SizedBox(height: 12),
                    TextWidget(text: gc.name.value, fontSize: 20, fontWeight: FontWeight.bold),
                    TextWidget(text: "Premium Customer", color: Colors.grey),
                    SizedBox(height: 8),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(12)),
                      child: Text("Active", style: TextStyle(color: Colors.blue.shade800, fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                    SizedBox(height: 24),
                    
                    if (isEditing) ...[
                      _buildTextField("Name", nameCtrl),
                      SizedBox(height: 12),
                      _buildTextField("Email", emailCtrl),
                      SizedBox(height: 12),
                      _buildTextField("Phone", phoneCtrl),
                      SizedBox(height: 12),
                      _buildTextField("Address", addressCtrl, maxLines: 3),
                      SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.blue.shade600, foregroundColor: Colors.white),
                              onPressed: handleSaveProfile,
                              child: Text("Save"),
                            ),
                          ),
                          SizedBox(width: 8),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: handleCancelEdit,
                              child: Text("Cancel"),
                            ),
                          )
                        ],
                      )
                    ] else ...[
                      _buildInfoRow(Icons.person, gc.name.value),
                      _buildInfoRow(Icons.email, gc.email.value),
                      _buildInfoRow(Icons.phone, phoneCtrl.text),
                      _buildInfoRow(Icons.location_on, addressCtrl.text),
                      _buildInfoRow(Icons.calendar_today, "Member since Jan 2024"),
                    ]
                  ],
                ),
              ),

              SizedBox(height: 24),
              // Stats
              Obx(() => GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.5,
                children: [
                  _buildStatCard("Total Orders", dc.orderCount.toString(), Icons.shopping_bag, Colors.blue.shade600),
                  _buildStatCard("Cart Items", oc.cart.fold(0, (sum, item) => sum + item.quantity).toString(), Icons.shopping_cart, Colors.indigo.shade600),
                  _buildStatCard("Completed", dc.completedCount.toString(), Icons.check_circle, Colors.green.shade600),
                  _buildStatCard("Total Spent", "₹${dc.totalSpent.toStringAsFixed(0)}", Icons.currency_rupee, Colors.purple.shade600),
                ],
              )),

              SizedBox(height: 24),
              // Recent Orders
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8)],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextWidget(text: "Recent Orders", fontSize: 18, fontWeight: FontWeight.bold),
                    SizedBox(height: 16),
                    Obx(() {
                      if (dc.orders.isEmpty) {
                        return Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 24.0),
                            child: Column(
                              children: [
                                Icon(Icons.shopping_bag_outlined, size: 48, color: Colors.grey.shade300),
                                SizedBox(height: 12),
                                Text("No orders yet", style: TextStyle(color: Colors.grey.shade500)),
                              ],
                            ),
                          ),
                        );
                      }
                      
                      final recent = dc.orders.take(5).toList();
                      return Column(
                        children: [
                          ...recent.map((order) => Container(
                            margin: EdgeInsets.only(bottom: 12),
                            padding: EdgeInsets.all(12),
                            decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(8)),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    TextWidget(text: order.orderNo, fontWeight: FontWeight.bold),
                                    Text("${order.createdAt.day}/${order.createdAt.month}/${order.createdAt.year}", style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    TextWidget(text: "₹${order.totalAmount.toStringAsFixed(2)}", fontWeight: FontWeight.bold),
                                    SizedBox(height: 4),
                                    _buildSmallStatus(order.status),
                                  ],
                                )
                              ],
                            ),
                          )),
                          if (dc.orders.length > 5)
                            OutlinedButton(
                              onPressed: () => Navigator.pop(context),
                              child: Text("View All Orders"),
                              style: OutlinedButton.styleFrom(minimumSize: Size(double.infinity, 40)),
                            )
                        ],
                      );
                    }),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextWidget(text: label, fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey.shade700),
        SizedBox(height: 4),
        TextField(
          controller: controller,
          maxLines: maxLines,
          decoration: InputDecoration(
            isDense: true,
            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          ),
        )
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey.shade400),
          SizedBox(width: 12),
          Expanded(child: TextWidget(text: text, fontSize: 14)),
        ],
      ),
    );
  }

  Widget _buildSmallStatus(String status) {
    Color bg;
    Color fg;
    switch(status) {
      case 'completed': bg = Colors.green.shade100; fg = Colors.green.shade800; break;
      case 'processing': bg = Colors.blue.shade100; fg = Colors.blue.shade800; break;
      case 'pending': bg = Colors.amber.shade100; fg = Colors.amber.shade800; break;
      default: bg = Colors.grey.shade100; fg = Colors.grey.shade800; break;
    }
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(4)),
      child: Text(status.toUpperCase(), style: TextStyle(color: fg, fontSize: 8, fontWeight: FontWeight.bold)),
    );
  }
}
