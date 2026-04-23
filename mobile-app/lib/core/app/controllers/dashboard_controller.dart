import 'package:get/get.dart';
import 'package:loginapp/core/models/order_model.dart';
import 'package:loginapp/core/repository/order_repository.dart';

class DashboardController extends GetxController {
  final OrderRepository _orderRepo = OrderRepository();

  final RxList<OrderModel> orders = <OrderModel>[].obs;
  final RxBool isLoadingMore = false.obs;
  final RxBool hasMore = true.obs;
  int _currentPage = 0;
  
  final searchTerm = ''.obs;
  final statusFilter = 'all'.obs;
  final sortBy = 'date-desc'.obs;

  @override
  void onInit() {
    super.onInit();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    _currentPage = 0;
    hasMore.value = true;
    final result = await _orderRepo.fetchOrders(page: 0);
    orders.value = result;
    hasMore.value = result.length >= OrderRepository.pageSize;
  }

  /// Load next page of orders.
  Future<void> loadMore() async {
    if (isLoadingMore.value || !hasMore.value) return;

    isLoadingMore.value = true;
    try {
      _currentPage++;
      final nextPage = await _orderRepo.fetchOrders(page: _currentPage);
      if (nextPage.isEmpty) {
        hasMore.value = false;
      } else {
        orders.addAll(nextPage);
        hasMore.value = nextPage.length >= OrderRepository.pageSize;
      }
    } catch (_) {
      _currentPage--;
    } finally {
      isLoadingMore.value = false;
    }
  }

  /// Refresh orders from first page.
  @override
  Future<void> refresh() async {
    await _fetchOrders();
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
    _orderRepo.deleteOrder(orderId);
  }

  void updateOrderStatus(String orderId, String newStatus) {
    final index = orders.indexWhere((o) => o.id == orderId);
    if (index != -1) {
      final order = orders[index];
      order.status = newStatus;
      order.updatedAt = DateTime.now();
      orders[index] = order; // trigger reactive update
      _orderRepo.updateStatus(orderId, newStatus);
    }
  }

  int get orderCount => orders.length;
  int get confirmedCount => orders.where((o) => o.status == 'confirmed').length;
  int get processingCount => orders.where((o) => o.status == 'processing').length;
  int get completedCount => orders.where((o) => o.status == 'completed').length;
  double get totalSpent => orders.where((o) => o.status == 'completed').fold(0, (sum, order) => sum + order.totalAmount);

}
