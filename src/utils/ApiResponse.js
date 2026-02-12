// Standard API Response class for all successful API responses
// Provides consistent response format across the application
class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        // Set HTTP status code
        this.statusCode = statusCode;
        
        // Set response data
        this.data = data;
        
        // Set response message
        this.message = message;
        
        // Automatically set success flag based on status code
        // Status codes < 400 are considered successful
        this.success = statusCode < 400;
    }
}

export { ApiResponse };