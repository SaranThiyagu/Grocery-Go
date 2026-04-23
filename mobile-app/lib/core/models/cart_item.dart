class CartItem {
  final String productId;
  final String productName;
  final String productImage;
  final double productPrice;
  int quantity;

  CartItem({
    required this.productId,
    required this.productName,
    required this.productImage,
    required this.productPrice,
    required this.quantity,
  });

  double get total => productPrice * quantity;

  Map<String, dynamic> toJson() {
    return {
      'productId': productId,
      'productName': productName,
      'productImage': productImage,
      'productPrice': productPrice,
      'quantity': quantity,
    };
  }

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      productId: json['productId']?.toString() ?? '',
      productName: json['productName']?.toString() ?? '',
      productImage: json['productImage']?.toString() ?? '',
      productPrice: double.tryParse(json['productPrice'].toString()) ?? 0.0,
      quantity: int.tryParse(json['quantity'].toString()) ?? 1,
    );
  }
}
