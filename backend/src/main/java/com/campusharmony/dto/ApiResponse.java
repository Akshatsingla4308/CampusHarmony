package com.campusharmony.dto;

/**
 * Generic response wrapper for API responses.
 * Supports both raw ApiResponse usage and typed ApiResponse<T> usage.
 */
public class ApiResponse<T> {

    private boolean ok;
    private String message;
    private T data;

    public ApiResponse() {
    }

    public ApiResponse(boolean ok, String message) {
        this.ok = ok;
        this.message = message;
    }

    public ApiResponse(boolean ok, String message, T data) {
        this.ok = ok;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }

    public boolean isOk() {
        return ok;
    }

    public void setOk(boolean ok) {
        this.ok = ok;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}
