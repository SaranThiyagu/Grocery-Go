import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:loginapp/core/app/controllers/dashboard_controller.dart';
import 'package:loginapp/core/app/controllers/order_controller.dart';
import 'package:loginapp/main.dart';

class EditOrderController extends GetxController {
  final OrderModel order;
  final RxList<CartItem> editCart = <CartItem>[].obs;
  final RxString searchTerm = ''.obs;
  final RxBool isSaving = false.obs;

  EditOrderController({required this.order});

  @override
  void onInit() {
    super.onInit();
    if (order.status.toLowerCase() != 'ordered') {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.back();
        Get.snackbar(
          'Edit Not Allowed', 
          'Order editing is allowed only when status is Ordered.',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red.shade100,
          colorText: Colors.red.shade900,
        );
      });
    } else {
      _initializeCart();
    }
  }

  void _initializeCart() {
    final oc = Get.find<OrderController>();
    for (var item in order.items) {
      final product = oc.products.firstWhereOrNull((p) => p.id == item.productId);
      if (product != null) {
        ProductSize? selectedSize;
        if (product.sizes.isNotEmpty) {
          selectedSize = product.sizes.firstWhereOrNull(
            (s) => item.name.endsWith(" (${s.label})")
          );
          selectedSize ??= product.sizes.first;
        }

        editCart.add(CartItem(
          product: product, 
          quantity: item.quantity, 
          selectedSize: selectedSize
        ));
      }
    }
  }

  void incrementItem(CartItem item) {
    final index = editCart.indexOf(item);
    if (index >= 0) {
      editCart[index].quantity++;
      editCart.refresh();
    }
  }

  void decrementItem(CartItem item) {
    final index = editCart.indexOf(item);
    if (index >= 0) {
      if (editCart[index].quantity > 1) {
        editCart[index].quantity--;
        editCart.refresh();
      } else {
        removeItemWithConfirmation(item);
      }
    }
  }

  void removeItemWithConfirmation(CartItem item) {
    Get.defaultDialog(
      title: "Remove Item",
      middleText: "Are you sure you want to remove ${item.product.name} from your order?",
      textConfirm: "Remove",
      textCancel: "Cancel",
      confirmTextColor: Colors.white,
      buttonColor: Colors.red,
      cancelTextColor: Colors.black,
      onConfirm: () {
        editCart.remove(item);
        editCart.refresh();
        Get.back();
      },
      onCancel: () {}
    );
  }

  void changeItemSize(CartItem item, ProductSize newSize) {
    final existingIndex = editCart.indexWhere((c) => 
      c.product.id == item.product.id && 
      c.selectedSize?.label == newSize.label
    );

    if (existingIndex >= 0 && editCart[existingIndex] != item) {
      editCart[existingIndex].quantity += item.quantity;
      editCart.remove(item);
    } else {
      final index = editCart.indexOf(item);
      if (index >= 0) {
        editCart[index] = CartItem(
          product: item.product, 
          quantity: item.quantity, 
          selectedSize: newSize
        );
      }
    }
    editCart.refresh();
  }

  void addNewProduct(Product product, ProductSize? size) {
    int index = editCart.indexWhere((item) => 
      item.product.id == product.id && 
      item.selectedSize?.label == size?.label
    );

    if (index >= 0) {
      editCart[index].quantity++;
    } else {
      editCart.add(CartItem(product: product, quantity: 1, selectedSize: size));
    }
    editCart.refresh();
    
    Get.back(); // close the bottom sheet
    Get.snackbar(
      'Added', 
      '${product.name} added to order',
      snackPosition: SnackPosition.BOTTOM,
      duration: const Duration(seconds: 2),
    );
  }

  List<Product> get searchProducts {
    if (searchTerm.value.isEmpty) return [];
    final oc = Get.find<OrderController>();
    return oc.filteredProducts.where((p) => 
      p.name.toLowerCase().contains(searchTerm.value.toLowerCase()) ||
      p.description.toLowerCase().contains(searchTerm.value.toLowerCase())
    ).toList();
  }

  Future<void> saveChanges() async {
    if (editCart.isEmpty) {
      Get.snackbar('Error', 'Order cannot be empty. Cancel the order instead.', snackPosition: SnackPosition.BOTTOM);
      return;
    }

    isSaving.value = true;
    try {
      double total = editCart.fold(0, (sum, item) => sum + ((item.selectedSize?.price ?? item.product.price) * item.quantity));

      // 1. Update order total_amount
      await supabase.from('orders').update({
        'total_amount': total,
        'updated_at': DateTime.now().toIso8601String()
      }).eq('id', order.id);

      // 2. Delete old order_items
      await supabase.from('order_items').delete().eq('order_id', order.id);

      // 3. Insert new order_items
      final itemsToInsert = editCart.map((item) => {
        'order_id': order.id,
        'product_id': item.product.id,
        'name': "${item.product.name}${item.selectedSize != null ? " (${item.selectedSize!.label})" : ""}",
        'quantity': item.quantity,
        'price': item.selectedSize?.price ?? item.product.price,
      }).toList();

      await supabase.from('order_items').insert(itemsToInsert);

      // Refresh dashboard
      if (Get.isRegistered<DashboardController>()) {
        Get.find<DashboardController>().refreshOrders();
      }

      Get.back(); // close edit screen
      Get.snackbar(
        'Success', 
        'Order updated successfully',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.green.shade100,
        colorText: Colors.green.shade900,
      );
    } catch (e) {
      Get.snackbar('Error', 'Failed to update order: $e', snackPosition: SnackPosition.BOTTOM);
    } finally {
      isSaving.value = false;
    }
  }
}
