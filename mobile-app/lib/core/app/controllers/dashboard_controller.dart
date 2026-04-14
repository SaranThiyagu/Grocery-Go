import 'package:get/get.dart';

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

  @override
  void onInit() {
    super.onInit();
    _fetchOrders();
  }

  void _fetchOrders() {
    // Mock data based on React
    final mockOrders = [
      OrderModel(
        id: '1',
        orderNo: 'ORD#001',
        items: [
          OrderItem(productId: '1', name: 'Premium Laptop', quantity: 1, price: 1299.99),
          OrderItem(productId: '2', name: 'Wireless Mouse', quantity: 2, price: 29.99)
        ],
        totalAmount: 1359.97,
        status: 'completed',
        createdAt: DateTime.parse('2024-01-15'),
        updatedAt: DateTime.parse('2024-01-16'),
      ),
      OrderModel(
        id: '2',
        orderNo: 'ORD#002',
        items: [
          OrderItem(productId: '3', name: 'Mechanical Keyboard', quantity: 1, price: 149.99)
        ],
        totalAmount: 149.99,
        status: 'processing',
        createdAt: DateTime.parse('2024-01-18'),
        updatedAt: DateTime.parse('2024-01-18'),
      ),
      OrderModel(
        id: '3',
        orderNo: 'ORD#003',
        items: [
          OrderItem(productId: '4', name: 'USB-C Hub', quantity: 3, price: 39.99),
          OrderItem(productId: '5', name: 'Webcam HD', quantity: 1, price: 79.99)
        ],
        totalAmount: 199.96,
        status: 'pending',
        createdAt: DateTime.parse('2024-01-20'),
        updatedAt: DateTime.parse('2024-01-20'),
      )
    ];

    Future.delayed(Duration(seconds: 1), () {
      orders.value = mockOrders;
    });
  }

  List<OrderModel> get filteredAndSortedOrders {
    var filtered = orders.where((order) {
      if (statusFilter.value != 'all' && order.status != statusFilter.value) {
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

  void cancelOrder(String orderId) {
    orders.removeWhere((o) => o.id == orderId);
  }

  void updateOrderStatus(String orderId, String newStatus) {
    final index = orders.indexWhere((o) => o.id == orderId);
    if (index != -1) {
      final order = orders[index];
      order.status = newStatus;
      order.updatedAt = DateTime.now();
      orders[index] = order; // trigger reactive update
    }
  }

  int get orderCount => orders.length;
  int get pendingCount => orders.where((o) => o.status == 'pending').length;
  int get processingCount => orders.where((o) => o.status == 'processing').length;
  int get completedCount => orders.where((o) => o.status == 'completed').length;
  int get cancelledCount => orders.where((o) => o.status == 'cancelled').length;
  double get totalSpent => orders.where((o) => o.status == 'completed').fold(0, (sum, order) => sum + order.totalAmount);

}
