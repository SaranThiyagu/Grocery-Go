import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:loginapp/core/app/controllers/dashboard_controller.dart';
import 'package:loginapp/core/models/product.dart';
import 'package:loginapp/core/models/cart_item.dart';
import 'package:loginapp/core/models/order_model.dart';
import 'package:loginapp/core/repository/product_repository.dart';
import 'package:loginapp/core/repository/order_repository.dart';

class OrderController extends GetxController {
  final ProductRepository _productRepo = ProductRepository();
  final OrderRepository _orderRepo = OrderRepository();

  final RxList<Product> products = <Product>[].obs;
  final RxList<String> categories = <String>[].obs;
  
  final RxString searchTerm = ''.obs;
  final RxString selectedCategory = ''.obs;
  final RxBool isLoadingMore = false.obs;
  final RxBool hasMore = true.obs;
  int _currentPage = 0;
  
  // Mapping productId to quantity to add
  final RxMap<String, int> quantities = <String, int>{}.obs;

  // Cart logic
  final RxList<CartItem> cart = <CartItem>[].obs;

  @override
  void onInit() {
    super.onInit();
    fetchData();
  }

  Future<void> fetchData() async {
    try {
      _currentPage = 0;
      hasMore.value = true;

      final loadedProducts = await _productRepo.fetchProducts(page: 0);
      products.value = loadedProducts;
      hasMore.value = loadedProducts.length >= ProductRepository.pageSize;

      for (var prod in loadedProducts) {
        quantities[prod.id] = 1;
      }

      final loadedCategories = await _productRepo.fetchCategories();
      categories.value = loadedCategories;
    } catch (e) {
      // Offline fallback — load from cache
      final cachedProducts = await _productRepo.getCachedProducts();
      final cachedCategories = await _productRepo.getCachedCategories();

      if (cachedProducts.isNotEmpty) {
        products.value = cachedProducts;
        categories.value = cachedCategories;
        for (var prod in cachedProducts) {
          quantities[prod.id] = 1;
        }
        Get.snackbar('Offline Mode', 'Showing cached products',
          snackPosition: SnackPosition.BOTTOM,
        );
      } else {
        Get.snackbar('Database Error', 'Failed to load data: $e', 
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.redAccent,
          colorText: Colors.white,
        );
      }
    }
  }

  /// Load next page of products (called on scroll).
  Future<void> loadMore() async {
    if (isLoadingMore.value || !hasMore.value) return;

    isLoadingMore.value = true;
    try {
      _currentPage++;
      final nextPage = await _productRepo.fetchProducts(page: _currentPage);
      if (nextPage.isEmpty) {
        hasMore.value = false;
      } else {
        products.addAll(nextPage);
        for (var prod in nextPage) {
          quantities[prod.id] = 1;
        }
        hasMore.value = nextPage.length >= ProductRepository.pageSize;
      }
    } catch (_) {
      _currentPage--;
    } finally {
      isLoadingMore.value = false;
    }
  }

  List<Product> get filteredProducts {
    return products.where((product) {
      final matchesSearch = product.name.toLowerCase().contains(searchTerm.value.toLowerCase()) || 
                            product.description.toLowerCase().contains(searchTerm.value.toLowerCase());
      final matchesCategory = selectedCategory.value.isEmpty || product.category == selectedCategory.value;
      return matchesSearch && matchesCategory;
    }).toList();
  }

  void updateQuantity(String productId, int newQuantity) {
    if (newQuantity >= 1) {
      quantities[productId] = newQuantity;
    }
  }

  void addToCart(Product product) {
    int qty = quantities[product.id] ?? 1;
    
    int index = cart.indexWhere((item) => item.productId == product.id);
    if (index >= 0) {
      cart[index].quantity += qty;
      cart.refresh();
    } else {
      cart.add(CartItem(
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        productPrice: product.price,
        quantity: qty,
      ));
    }
    quantities[product.id] = 1;
    Get.snackbar(
      'Cart', 
      '${product.name} added to cart',
      snackPosition: SnackPosition.BOTTOM,
    );
  }

  Future<void> confirmOrder() async {
    if (cart.isEmpty) return;

    double total = cart.fold(0.0, (sum, item) => sum + item.total);

    try {
      final dc = Get.find<DashboardController>();
      final newOrder = OrderModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        orderNo: 'ORD#${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
        items: cart.map((item) => OrderItem(
          productId: item.productId,
          name: item.productName,
          quantity: item.quantity,
          price: item.productPrice,
        )).toList(),
        totalAmount: total,
        status: 'confirmed',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      
      dc.orders.insert(0, newOrder);
      _orderRepo.createOrder(newOrder);
      cart.clear();
      
      Get.defaultDialog(
        title: "Order Confirmed",
        middleText: "Your order has been confirmed!",
        textConfirm: "OK",
        confirmTextColor: Colors.white,
        buttonColor: Colors.green,
        onConfirm: () {
          Get.back(); // close dialog
          Get.back(); // return to previous screen
        },
      );
    } catch (e) {
      Get.snackbar(
        'Error', 
        'Failed to confirm order. Error: $e',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red.shade100,
        colorText: Colors.red.shade900,
        duration: const Duration(seconds: 8),
      );
    }
  }
}
