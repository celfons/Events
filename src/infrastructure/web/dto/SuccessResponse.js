/**
 * SuccessResponse DTO
 * Standardized success response structure
 */
class SuccessResponse {
  /**
   * @param {*} data - Response data
   * @param {string} [message] - Optional success message
   * @param {Object} [meta] - Optional metadata (pagination, etc.)
   */
  constructor(data, message = null, meta = null) {
    this.data = data;
    if (message) {
      this.message = message;
    }
    if (meta) {
      this.meta = meta;
    }
  }

  /**
   * Convert to plain object for JSON response
   */
  toJSON() {
    const response = {
      data: this.data
    };

    if (this.message) {
      response.message = this.message;
    }

    if (this.meta) {
      response.meta = this.meta;
    }

    return response;
  }

  // Static factory methods for common success responses

  static ok(data, message = null) {
    return new SuccessResponse(data, message);
  }

  static created(data, message = 'Resource created successfully') {
    return new SuccessResponse(data, message);
  }

  static deleted(message = 'Resource deleted successfully') {
    return new SuccessResponse(null, message);
  }

  static updated(data, message = 'Resource updated successfully') {
    return new SuccessResponse(data, message);
  }

  static list(data, meta = null) {
    return new SuccessResponse(data, null, meta);
  }
}

module.exports = SuccessResponse;
