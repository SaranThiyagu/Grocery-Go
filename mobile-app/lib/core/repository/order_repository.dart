import 'package:loginapp/core/models/order_model.dart';
import 'package:loginapp/main.dart';

class OrderRepository {
  static const int pageSize = 20;

  /// Fetches orders from Supabase with pagination.
  /// Falls back to mock data if the 'orders' table doesn't exist yet.
  Future<List<OrderModel>> fetchOrders({int page = 0}) async {
    try {
      final from = page * pageSize;
      final to = from + pageSize - 1;

      final data = await supabase
          .from('orders')
          .select()
          .order('created_at', ascending: false)
          .range(from, to);

      return (data as List).map((e) => OrderModel.fromJson(e)).toList();
    } catch (_) {
      // Table may not exist yet — return mock data for first page only
      if (page > 0) return [];
      return _mockOrders();
    }
  }

  /// Insert a new order into Supabase.
  /// Falls back silently if the table doesn't exist.
  Future<void> createOrder(OrderModel order) async {
    try {
      await supabase.from('orders').insert(order.toJson());
    } catch (_) {
      // Table may not exist yet — order is kept in local state only
    }
  }

  /// Delete an order by id.
  Future<void> deleteOrder(String orderId) async {
    try {
      await supabase.from('orders').delete().eq('id', orderId);
    } catch (_) {}
  }

  /// Update order status.
  Future<void> updateStatus(String orderId, String status) async {
    try {
      await supabase.from('orders').update({
        'status': status,
        'updatedAt': DateTime.now().toIso8601String(),
      }).eq('id', orderId);
    } catch (_) {}
  }

  List<OrderModel> _mockOrders() {
    return [
      OrderModel(
        id: '1',
        orderNo: 'ORD#001',
        items: [
          OrderItem(productId: '1', name: 'Premium Laptop', quantity: 1, price: 1299.99),
          OrderItem(productId: '2', name: 'Wireless Mouse', quantity: 2, price: 29.99),
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
          OrderItem(productId: '3', name: 'Mechanical Keyboard', quantity: 1, price: 149.99),
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
          OrderItem(productId: '5', name: 'Webcam HD', quantity: 1, price: 79.99),
        ],
        totalAmount: 199.96,
        status: 'confirmed',
        createdAt: DateTime.parse('2024-01-20'),
        updatedAt: DateTime.parse('2024-01-20'),
      ),
    ];
  }
}
