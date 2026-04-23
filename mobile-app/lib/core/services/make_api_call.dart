import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart' hide Response;
import 'dart:io';
import '../utils/const.dart';

class MakeApiCall {
  static Dio? _dio;
  static const int _maxRetries = 2;

  static Dio get dio {
    _dio ??= _createDio();
    return _dio!;
  }

  static Dio _createDio() {
    final dio = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
    ));

    // Logging & error interceptor with retry
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        Const.debug("API Request: ${options.method} ${options.uri}");
        handler.next(options);
      },
      onResponse: (response, handler) {
        handler.next(response);
      },
      onError: (error, handler) async {
        Const.debug("API Error: ${error.message} [${error.response?.statusCode}]");

        // Retry on timeout or 5xx server errors
        final retryCount = error.requestOptions.extra['retryCount'] ?? 0;
        if (retryCount < _maxRetries && _shouldRetry(error)) {
          Const.debug("Retrying request (${retryCount + 1}/$_maxRetries)...");
          error.requestOptions.extra['retryCount'] = retryCount + 1;
          try {
            final response = await dio.fetch(error.requestOptions);
            return handler.resolve(response);
          } catch (_) {}
        }

        handler.next(error);
      },
    ));

    // SSL certificate validation — reject bad certificates
    (dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
      final client = HttpClient();
      client.badCertificateCallback = (cert, host, port) => false;
      return client;
    };

    return dio;
  }

  static bool _shouldRetry(DioException error) {
    return error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        (error.response?.statusCode != null && error.response!.statusCode! >= 500);
  }

  /// Translates a DioException into a user-friendly message and shows a snackbar.
  static String handleError(DioException error) {
    String message;
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        message = 'Connection timed out. Please check your internet.';
        break;
      case DioExceptionType.connectionError:
        message = 'No internet connection.';
        break;
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode ?? 0;
        if (statusCode == 401) {
          message = 'Session expired. Please sign in again.';
        } else if (statusCode == 403) {
          message = 'You don\'t have permission to perform this action.';
        } else if (statusCode == 404) {
          message = 'Requested resource not found.';
        } else if (statusCode >= 500) {
          message = 'Server error. Please try again later.';
        } else {
          message = 'Request failed (HTTP $statusCode).';
        }
        break;
      default:
        message = Const.errorMsg;
    }

    Get.snackbar(
      'Error',
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.red.shade100,
      colorText: Colors.red.shade900,
      duration: const Duration(seconds: 4),
    );

    return message;
  }

  static Future<T?> safeApiCall<T>(Future<Response> Function(Dio dio) apiCall) async {
    try {
      final response = await apiCall(dio);
      return response.data as T;
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        Const.debug("Timeout: ${e.requestOptions.uri}");
      }
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