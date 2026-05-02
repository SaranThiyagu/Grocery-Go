import 'package:dio/dio.dart';
import '../utils/const.dart';

class MakeApiCall {
  static Future<T?> safeApiCall<T>(Future<Response> Function() apiCall) async {
    try {
      final response = await apiCall();
      return response.data as T;
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        if (e.response!.data is Map<String, dynamic>) {
          return e.response!.data as T;
        }
      }
      Const.debug({"Error": e.message, "Path": "RepoHelper"}.toString());
      return null;
    } catch (e) {
      Const.debug({"Error": e.toString(), "Path": "RepoHelper"}.toString());
      return null;
    }
  }
}