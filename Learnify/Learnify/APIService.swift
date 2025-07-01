//
//  APIService.swift
//  Learnify
//
//  Created by Claude on 2025/7/1.
//

import Foundation

final class APIService: NSObject, URLSessionTaskDelegate {
    static let shared = APIService()
    private override init() {}
    
    #if DEBUG
    private let baseURL = "http://localhost:3000"
    #else
    private let baseURL = "https://learnify-api.zeabur.app"
    #endif

    // MARK: - Check-In
    func checkIn(studentId: String, fullName: String) async throws -> CheckInResponse {
        let url = URL(string: "\(baseURL)/api/auto/check-in")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.timeoutInterval = 30
        request.httpBody = try JSONEncoder().encode(CheckInRequest(student_id: studentId, full_name: fullName))
        
        // Debug: Print platform and request info
        #if targetEnvironment(simulator)
        print("🔍 Running on iOS Simulator")
        #else
        print("🔍 Running on physical device")
        #endif
        
        print("📤 Request URL: \(url.absoluteString)")
        print("📤 Request headers: \(request.allHTTPHeaderFields ?? [:])")
        
        // Use different URLSession configuration for iOS simulator
        let config: URLSessionConfiguration
        #if targetEnvironment(simulator)
        // iOS Simulator-specific configuration
        config = URLSessionConfiguration.default
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        config.urlCache = nil
        config.httpMaximumConnectionsPerHost = 1
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        print("🔧 Using iOS Simulator-optimized configuration")
        #else
        // Physical device configuration
        config = URLSessionConfiguration.default
        print("🔧 Using default configuration for physical device")
        #endif
        
        let session = URLSession(configuration: config, delegate: self, delegateQueue: nil)
        let maxRetries = 3
        var lastError: Error?
        
        for attempt in 1...maxRetries {
            do {
                print("🔄 Attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type")
                    throw APIError.invalidResponse
                }
                
                print("✅ HTTP Status: \(httpResponse.statusCode)")
                print("📥 Response headers: \(httpResponse.allHeaderFields)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ Server error: \(httpResponse.statusCode)")
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                print("✅ Successful response received")
                return try JSONDecoder().decode(CheckInResponse.self, from: data)
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                print("⚠️ URLError details: code=\(error.code.rawValue), description=\(error.localizedDescription)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ Request failed with error: \(error)")
                if let urlError = error as? URLError {
                    print("❌ URLError details: code=\(urlError.code.rawValue), description=\(urlError.localizedDescription)")
                }
                throw error
            }
        }
        throw lastError ?? APIError.networkError("The operation failed after multiple retries.")
    }
    
    // MARK: - HTTP/2 Protocol Logging (Optional)
    func urlSession(_ session: URLSession, task: URLSessionTask, didFinishCollecting metrics: URLSessionTaskMetrics) {
        for transaction in metrics.transactionMetrics {
            print("Protocol used: \(transaction.networkProtocolName ?? "unknown")")
        }
    }
}

// MARK: - Data Models

struct CheckInRequest: Codable {
    let student_id: String
    let full_name: String
}

struct CheckInResponse: Codable {
    let success: Bool
    let message: String
    let data: CheckInData?
}

struct CheckInData: Codable {
    let check_in_id: Int
    let student_id: String
    let student_name: String
    let checked_in_at: String
    let is_new_student: Bool
}

// MARK: - Error Handling

enum APIError: Error, LocalizedError {
    case invalidResponse
    case serverError(Int)
    case decodingError
    case networkError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "The server returned an invalid or unexpected response."
        case .serverError(let code):
            return "The server returned an error with status code: \(code)."
        case .decodingError:
            return "Failed to decode the server's response. The data format may be incorrect."
        case .networkError(let message):
            return "A network error occurred: \(message)"
        }
    }
}
