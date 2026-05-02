import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:mailer/mailer.dart';
import 'package:mailer/smtp_server.dart';
import 'package:loginapp/core/app/controllers/global_controller.dart';
import 'package:loginapp/core/app/controllers/dashboard_controller.dart';
import 'package:loginapp/core/utils/const.dart';
import 'package:loginapp/main.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ProductSize {
  final String label;
  final String type; // retail or wholesale
  final double price;
  final String? qty; // e.g., '25 kg', '1 Box'
  final int discountPercentage;
  final String deliveryTime;

  ProductSize({
    required this.label, 
    required this.type, 
    this.price = 0.0, 
    this.qty,
    this.discountPercentage = 0, 
    this.deliveryTime = '15 mins'
  });
}

class Product {
  final String id;
  final String name;
  final String description;
  final double price; // Base/Default price
  final String image;
  final String category;
  final String categoryId;
  final List<ProductSize> sizes;
  final String sellingMode;
  final int discountPercentage;
  final String deliveryTime;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.image,
    required this.category,
    required this.categoryId,
    this.sizes = const [],
    this.sellingMode = 'both',
    this.discountPercentage = 0,
    this.deliveryTime = '15 mins',
  });
}

class CartItem {
  final Product product;
  int quantity;
  final ProductSize? selectedSize;

  CartItem({required this.product, required this.quantity, this.selectedSize});
}

class OrderController extends GetxController {
  final RxList<Product> products = <Product>[].obs;
  final RxList<String> categories = <String>[].obs;
  
  final RxString searchTerm = ''.obs;
  final RxString selectedCategory = ''.obs;
  
  // Mapping productId to quantity to add
  final RxMap<String, int> quantities = <String, int>{}.obs;
  
  // Mapping productId to selected size
  final RxMap<String, ProductSize?> selectedSizes = <String, ProductSize?>{}.obs;

  // Cart logic
  final RxList<CartItem> cart = <CartItem>[].obs;

  RealtimeChannel? _catalogChannel;

  @override
  void onInit() {
    super.onInit();
    fetchData();
    _setupRealtimeSubscription();
  }

  @override
  void onClose() {
    _catalogChannel?.unsubscribe();
    super.onClose();
  }

  void _setupRealtimeSubscription() {
    _catalogChannel = supabase.channel('public:catalog').onPostgresChanges(
      event: PostgresChangeEvent.all,
      schema: 'public',
      table: 'products',
      callback: (payload) => fetchData(),
    ).onPostgresChanges(
      event: PostgresChangeEvent.all,
      schema: 'public',
      table: 'categories',
      callback: (payload) => fetchData(),
    ).onPostgresChanges(
      event: PostgresChangeEvent.all,
      schema: 'public',
      table: 'product_sizes',
      callback: (payload) => fetchData(),
    ).subscribe();
  }

  Future<void> fetchData() async {
    try {
      final gc = Get.find<GlobalController>();
      final String userType = gc.customerType.value.toLowerCase().trim();

      // 1. Fetch Categories
      final categoryData = await supabase.from('categories').select();
      categories.value = (categoryData as List).map((e) => e['name'].toString()).toList();

      // 2. Fetch product_sizes (separate query — most reliable, no FK dependency needed)
      final sizesRaw = await supabase.from('product_sizes').select();

      // Build map: product_id → List<ProductSize> (multi-key for UUID format safety)
      final Map<String, List<ProductSize>> sizesMap = {};
      for (final row in sizesRaw as List) {
        final String? rawPid = row['product_id']?.toString();
        if (rawPid == null || rawPid.isEmpty) continue;
        final String? label = row['size_label']?.toString().trim();
        if (label == null || label.isEmpty) continue;

        final ps = ProductSize(
          label: label,
          type: row['type']?.toString() ?? 'both',
          price: double.tryParse(row['price']?.toString() ?? '0') ?? 0.0,
          qty: row['qty']?.toString() ?? label,
          discountPercentage:
              int.tryParse(row['discount_percentage']?.toString() ?? '0') ?? 0,
          deliveryTime: row['delivery_time']?.toString() ?? '15 mins',
        );

        for (final key in <String>{rawPid, rawPid.trim(), rawPid.toLowerCase(), rawPid.trim().toLowerCase()}) {
          sizesMap.putIfAbsent(key, () => []).add(ps);
        }
      }

      // 3. Fetch Products and attach matched sizes
      final productData = await supabase.from('products').select('*, categories(name)');

      final loadedProducts = (productData as List).map((e) {
        final String rawId = e['id']?.toString() ?? '';
        final String pid   = rawId.trim().toLowerCase();
        final String cid   = e['category_id']?.toString().trim() ?? '';

        final List<ProductSize> sizes =
            sizesMap[rawId] ??
            sizesMap[rawId.trim()] ??
            sizesMap[pid] ??
            sizesMap[rawId.trim().toLowerCase()] ??
            [];

        return Product(
          id: pid,
          name: e['name']?.toString() ?? '',
          description: e['description']?.toString() ?? '',
          price: double.tryParse(e['price']?.toString() ?? '0') ?? 0.0,
          image: e['image']?.toString() ?? '',
          category: e['categories']?['name']?.toString() ?? e['category']?.toString() ?? 'Uncategorized',
          categoryId: cid,
          sizes: sizes,
          sellingMode: e['selling_mode']?.toString() ?? 'both',
          discountPercentage: int.tryParse(e['discount_percentage']?.toString() ?? '0') ?? 0,
          deliveryTime: e['delivery_time']?.toString() ?? '15 mins',
        );
      }).toList();

      products.value = loadedProducts;

      // Initialize quantities and default sizes
      for (var prod in loadedProducts) {
        quantities[prod.id] = 1;
        if (prod.sizes.isNotEmpty) {
          selectedSizes[prod.id] = prod.sizes.first;
        }
      }

    } catch (e) {
      Const.debug("Fetch Data Error: $e");
      Get.snackbar('Database Error', 'Failed to load data: $e',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.redAccent,
        colorText: Colors.white,
      );
    }
  }

  List<Product> get filteredProducts {
    final gc = Get.find<GlobalController>();
    final userType = gc.customerType.value;

    return products.where((product) {
      // Enforce selling mode rules locally as an extra safety measure
      bool matchesMode = true;
      if (userType == 'retail') {
        matchesMode = (product.sellingMode == 'retail' || product.sellingMode == 'both');
      } else if (userType == 'wholesale') {
        matchesMode = (product.sellingMode == 'wholesale' || product.sellingMode == 'both');
      }

      final matchesSearch = product.name.toLowerCase().contains(searchTerm.value.toLowerCase()) || 
                            product.description.toLowerCase().contains(searchTerm.value.toLowerCase());
      final matchesCategory = selectedCategory.value.isEmpty || product.category == selectedCategory.value;
      
      return matchesMode && matchesSearch && matchesCategory;
    }).toList();
  }

  Map<String, List<Product>> get groupedProducts {
    final Map<String, List<Product>> groups = {};
    for (var product in filteredProducts) {
      groups.putIfAbsent(product.category, () => []).add(product);
    }
    return groups;
  }

  int getCartQuantity(Product product, [ProductSize? size]) {
    final itemIndex = cart.indexWhere((item) => 
      item.product.id == product.id && 
      (size == null || item.selectedSize?.label == size.label)
    );
    return itemIndex >= 0 ? cart[itemIndex].quantity : 0;
  }

  void incrementCart(Product product, [ProductSize? size]) {
    final itemIndex = cart.indexWhere((item) => 
      item.product.id == product.id && 
      (size == null || item.selectedSize?.label == size.label)
    );
    
    if (itemIndex >= 0) {
      cart[itemIndex].quantity++;
      cart.refresh();
    } else {
      cart.add(CartItem(
        product: product, 
        quantity: 1, 
        selectedSize: size ?? (product.sizes.isNotEmpty ? product.sizes.first : null)
      ));
    }
  }

  void decrementCart(Product product, [ProductSize? size]) {
    final itemIndex = cart.indexWhere((item) => 
      item.product.id == product.id && 
      (size == null || item.selectedSize?.label == size.label)
    );
    
    if (itemIndex >= 0) {
      if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity--;
      } else {
        removeFromCartWithConfirmation(cart[itemIndex]);
        return; // Wait for confirmation before refreshing
      }
      cart.refresh();
    }
  }

  void removeFromCartWithConfirmation(CartItem item) {
    Get.defaultDialog(
      title: "Remove Item",
      middleText: "Are you sure you want to remove ${item.product.name} from your cart?",
      textConfirm: "Remove",
      textCancel: "Cancel",
      confirmTextColor: Colors.white,
      buttonColor: Colors.red,
      cancelTextColor: Colors.black,
      onConfirm: () {
        cart.remove(item);
        cart.refresh();
        Get.back();
      },
      onCancel: () {
        // Do nothing
      }
    );
  }

  void changeCartItemSize(CartItem item, ProductSize newSize) {
    // Check if an item with the same product and new size already exists
    final existingIndex = cart.indexWhere((c) => 
      c.product.id == item.product.id && 
      c.selectedSize?.label == newSize.label
    );

    if (existingIndex >= 0 && cart[existingIndex] != item) {
      // Merge quantities
      cart[existingIndex].quantity += item.quantity;
      cart.remove(item);
    } else {
      // Update size in place
      final index = cart.indexOf(item);
      if (index >= 0) {
        cart[index] = CartItem(
          product: item.product, 
          quantity: item.quantity, 
          selectedSize: newSize
        );
      }
    }
    cart.refresh();
  }

  void updateQuantity(String productId, int newQuantity) {
    if (newQuantity >= 1) {
      quantities[productId] = newQuantity;
    }
  }

  void addToCart(Product product) {
    int qty = quantities[product.id] ?? 1;
    ProductSize? selectedSize = selectedSizes[product.id];
    
    // Check if item exists in cart with SAME size
    int index = cart.indexWhere((item) => 
      item.product.id == product.id && 
      item.selectedSize?.label == selectedSize?.label
    );

    if (index >= 0) {
      cart[index].quantity += qty;
      cart.refresh(); // Tells GetX to update UI
    } else {
      cart.add(CartItem(product: product, quantity: qty, selectedSize: selectedSize));
    }
    // Reset quantity back to 1
    quantities[product.id] = 1;
    Get.snackbar(
      'Cart', 
      '${product.name}${selectedSize != null ? " (${selectedSize.label})" : ""} added to cart',
      snackPosition: SnackPosition.BOTTOM
    );
  }

  Future<void> confirmOrder() async {
    if (cart.isEmpty) return;

    // Get user details
    final gc = Get.find<GlobalController>();
    final userEmail = gc.email.value;
    final userName = gc.name.value;
    
    // Calculate total using selected size price if available
    double total = cart.fold(0, (sum, item) => sum + ((item.selectedSize?.price ?? item.product.price) * item.quantity));
    
    // Prepare items string
    String itemsList = cart.map((e) => "${e.quantity}x ${e.product.name}").join(", ");

    try {
      // SMTP configuration (Commented out per user request)
      /*
      final String username = 'mageshwaran11238@gmail.com';
      final String password = 'Magesh@8754314929'; 

      final smtpServer = gmail(username, password);

      final message = Message()
        ..from = Address(username, 'Indian Grocery Store')
        ..recipients.add('mageshwaran11238@gmail.com') 
        ..subject = 'Order Confirmation - Indian Grocery Store'
        ..html = '''
          <h1>Order Confirmed!</h1>
          <p>Hi ${userName.isEmpty ? 'Customer' : userName},</p>
          <p>Your order has been confirmed successfully!</p>
          <h3>Order Summary</h3>
          <p>$itemsList</p>
          <p>$itemsList</p>
          <br>
          <p>Thank you for shopping with us!</p>
        ''';

      await send(message, smtpServer);
      */

      // 1. Save strictly to Supabase instead of local dashboard mock
      final String orderNo = 'ORD#${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
      final String generatedId = DateTime.now().millisecondsSinceEpoch.toString();
      
      // Attempt to save order
      final orderRes = await supabase.from('orders').insert({
        'id': generatedId,
        'order_no': orderNo,
        'total_amount': total,
        'status': 'Ordered',
        'customer_id': gc.id.value,
      }).select().single();

      final orderId = orderRes['id'];

      // Insert order items
      final itemsToInsert = cart.map((item) => {
        'order_id': orderId,
        'product_id': item.product.id,
        'name': "${item.product.name}${item.selectedSize != null ? " (${item.selectedSize!.label})" : ""}",
        'quantity': item.quantity,
        'price': item.selectedSize?.price ?? item.product.price,
      }).toList();

      await supabase.from('order_items').insert(itemsToInsert);

      // Manual trigger for Dashboard update to ensure it's instant
      if (Get.isRegistered<DashboardController>()) {
        Get.find<DashboardController>().refreshOrders();
      }
      
      cart.clear();
      
      Get.defaultDialog(
        title: "Order Confirmed",
        middleText: "Your order has been confirmed successfully!",
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
