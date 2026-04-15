class ApiResponse {
  constructor(success, message, data = null, pagination = null) {
    this.success = success;
    this.message = message;
    this.data = data;
    if (pagination) {
      this.pagination = pagination;
    }
  }

  static success(message, data = null, pagination = null) {
    return new ApiResponse(true, message, data, pagination);
  }

  static error(message, statusCode = 500) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }
}

module.exports = ApiResponse;
