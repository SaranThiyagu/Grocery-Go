import 'package:loginapp/core/models/product.dart';
import 'package:loginapp/core/app/controllers/local_storage_controller.dart';
import 'package:loginapp/main.dart';

class ProductRepository {
  static const int pageSize = 20;
  static const String _cacheKey = 'cached_products';
  static const String _categoryCacheKey = 'cached_categories';

  /// Fetches a page of products from Supabase.
  /// [page] is 0-based. Returns empty list when no more data.
  Future<List<Product>> fetchProducts({int page = 0}) async {
    final from = page * pageSize;
    final to = from + pageSize - 1;

    final data = await supabase
        .from('products')
        .select()
        .range(from, to);

    final products = (data as List).map((e) => Product.fromJson(e)).toList();

    // Cache first page for offline use
    if (page == 0 && products.isNotEmpty) {
      await _cacheProducts(products);
    }

    return products;
  }

  Future<List<String>> fetchCategories() async {
    final data = await supabase.from('categories').select();
    final categories = (data as List).map((e) => e['name'].toString()).toList();

    // Cache for offline use
    if (categories.isNotEmpty) {
      await LocalStorage.storeData(_categoryCacheKey, categories);
    }

    return categories;
  }

  /// Returns cached products when offline.
  Future<List<Product>> getCachedProducts() async {
    final cached = await LocalStorage.getData(_cacheKey, type: 'json');
    if (cached == null) return [];
    return (cached as List).map((e) => Product.fromJson(Map<String, dynamic>.from(e))).toList();
  }

  /// Returns cached categories when offline.
  Future<List<String>> getCachedCategories() async {
    final cached = await LocalStorage.getData(_categoryCacheKey, type: 'json');
    if (cached == null) return [];
    return (cached as List).map((e) => e.toString()).toList();
  }

  Future<void> _cacheProducts(List<Product> products) async {
    await LocalStorage.storeData(_cacheKey, products.map((p) => p.toJson()).toList());
  }
}
