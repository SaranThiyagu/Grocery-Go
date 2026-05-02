import 'package:get/get.dart';
import 'package:loginapp/core/app/controllers/global_controller.dart';
import 'package:loginapp/main.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class OrderItem {
  final String productId;
  final String name;
  final int quantity;
  final double price;

  OrderItem({required this.productId, required this.name, required this.quantity, required this.price});
}

class OrderModel {
  final String id;
  final String orderNo;
  final List<OrderItem> items;
  final double totalAmount;
  String status;
  final DateTime createdAt;
  DateTime updatedAt;

  OrderModel({
    required this.id,
    required this.orderNo,
    required this.items,
    required this.totalAmount,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });
}

class DashboardController extends GetxController {
  final RxList<OrderModel> orders = <OrderModel>[].obs;
  
  final searchTerm = ''.obs;
  final statusFilter = 'all'.obs;
  final sortBy = 'date-desc'.obs;

  RealtimeChannel? _orderChannel;

  @override
  void onInit() {
    super.onInit();
    
    // Listen to user ID changes to fetch orders
    final gc = Get.find<GlobalController>();
    ever(gc.id, (_) => refreshOrders());
    
    // Initial fetch
    if (gc.id.value.isNotEmpty) {
      refreshOrders();
    }
    
    _setupRealtimeSubscription();
  }

  @override
  void onClose() {
    _orderChannel?.unsubscribe();
    super.onClose();
  }

  void _setupRealtimeSubscription() {
    _orderChannel = supabase.channel('public:orders').onPostgresChanges(
      event: PostgresChangeEvent.all,
      schema: 'public',
      table: 'orders',
      callback: (payload) {
        refreshOrders(); // Re-fetch on any change
      }
    ).subscribe();
  }

  Future<void> refreshOrders() async {
    try {
      final gc = Get.find<GlobalController>();
      if (gc.id.value.isEmpty) return;

      final response = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('customer_id', gc.id.value)
          .order('created_at', ascending: false);

      final fetchedOrders = (response as List).map((o) {
        return OrderModel(
          id: o['id'].toString(),
          orderNo: o['order_no'] ?? '',
          items: (o['order_items'] as List).map((i) {
            return OrderItem(
              productId: i['product_id'].toString(),
              name: i['name'] ?? '',
              quantity: i['quantity'] ?? 1,
              price: double.tryParse(i['price'].toString()) ?? 0.0,
            );
          }).toList(),
          totalAmount: double.tryParse(o['total_amount'].toString()) ?? 0.0,
          status: o['status'] ?? 'Ordered',
          createdAt: DateTime.parse(o['created_at'].toString()),
          updatedAt: o['updated_at'] != null 
              ? DateTime.parse(o['updated_at'].toString()) 
              : DateTime.parse(o['created_at'].toString()),
        );
      }).toList();

      orders.value = fetchedOrders;
    } catch (e) {
      // Avoid showing snackbar on background refresh to keep it smooth
      print('Fetch Orders Error: $e');
    }
  }

  List<OrderModel> get filteredAndSortedOrders {
    var filtered = orders.where((order) {
      if (statusFilter.value != 'all' && order.status.toLowerCase() != statusFilter.value.toLowerCase()) {
        return false;
      }
      if (searchTerm.value.isNotEmpty) {
        bool matchesSearch = order.orderNo.toLowerCase().contains(searchTerm.value.toLowerCase()) ||
          order.items.any((item) => item.name.toLowerCase().contains(searchTerm.value.toLowerCase()));
        if (!matchesSearch) return false;
      }
      return true;
    }).toList();

    filtered.sort((a, b) {
      switch (sortBy.value) {
        case 'date-desc':
          return b.createdAt.compareTo(a.createdAt);
        case 'date-asc':
          return a.createdAt.compareTo(b.createdAt);
        case 'amount-desc':
          return b.totalAmount.compareTo(a.totalAmount);
        case 'amount-asc':
          return a.totalAmount.compareTo(b.totalAmount);
        case 'status':
          return a.status.compareTo(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }

  Future<void> cancelOrder(String orderId) async {
    try {
      await supabase.from('orders').delete().eq('id', orderId);
      // Real-time listener will handle the removal, but we can do it locally for speed
      orders.removeWhere((o) => o.id == orderId);
    } catch (e) {
      Get.snackbar('Error', 'Failed to delete order: $e');
    }
  }

  Future<void> updateOrderStatus(String orderId, String newStatus) async {
    try {
      await supabase.from('orders').update({
        'status': newStatus,
        'updated_at': DateTime.now().toIso8601String()
      }).eq('id', orderId);
      // Real-time listener will handle the update
    } catch (e) {
      Get.snackbar('Error', 'Failed to update order status: $e');
    }
  }

  int get orderCount => orders.length;
  int get confirmedCount => orders.where((o) => o.status.toLowerCase() == 'confirmed').length;
  int get processingCount => orders.where((o) => o.status.toLowerCase() == 'ordered').length;
  int get completedCount => orders.where((o) => o.status.toLowerCase() == 'completed' || o.status.toLowerCase() == 'delivered').length;
  double get totalSpent => orders.where((o) => o.status.toLowerCase() == 'completed' || o.status.toLowerCase() == 'delivered').fold(0, (sum, order) => sum + order.totalAmount);

}
