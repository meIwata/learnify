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

    // MARK: - Get All Students
    func getAllStudents() async throws -> [Student] {
        let url = URL(string: "\(baseURL)/api/auto/students")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        print("📤 Fetching students from: \(url.absoluteString)")
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30.0
        config.timeoutIntervalForResource = 60.0
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        config.httpMaximumConnectionsPerHost = 1
        let session = URLSession(configuration: config)

        let maxRetries = 3
        var lastError: Error?

        for attempt in 1...maxRetries {
            do {
                print("🔄 Students request attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type for students")
                    throw APIError.invalidResponse
                }
                
                print("✅ Students HTTP Status: \(httpResponse.statusCode)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ Students server error: \(httpResponse.statusCode)")
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                // Parse the students response
                let studentsResponse = try JSONDecoder().decode(StudentsResponse.self, from: data)
                print("✅ Successfully fetched \(studentsResponse.data.students.count) students")
                return studentsResponse.data.students
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost fetching students (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ Students request failed with error: \(error)")
                throw error
            }
        }
        throw lastError ?? APIError.networkError("Failed to fetch students after multiple retries.")
    }
    
    // MARK: - Get Student Check-ins
    func getStudentCheckIns(studentId: String) async throws -> [StudentCheckIn] {
        let url = URL(string: "\(baseURL)/api/auto/check-ins/\(studentId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        print("📤 Fetching check-ins for student: \(studentId)")
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30.0
        config.timeoutIntervalForResource = 60.0
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        config.httpMaximumConnectionsPerHost = 1
        let session = URLSession(configuration: config)

        let maxRetries = 3
        var lastError: Error?

        for attempt in 1...maxRetries {
            do {
                print("🔄 Check-ins request attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type for check-ins")
                    throw APIError.invalidResponse
                }
                
                print("✅ Check-ins HTTP Status: \(httpResponse.statusCode)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ Check-ins server error: \(httpResponse.statusCode)")
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                // Parse the check-ins response
                let checkInsResponse = try JSONDecoder().decode(CheckInsResponse.self, from: data)
                print("✅ Successfully fetched \(checkInsResponse.data.check_ins.count) check-ins")
                return checkInsResponse.data.check_ins
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost fetching check-ins (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ Check-ins request failed with error: \(error)")
                throw error
            }
        }
        throw lastError ?? APIError.networkError("Failed to fetch check-ins after multiple retries.")
    }
    
    // MARK: - Submit Reflection
    func submitReflection(studentId: String, mobileAppName: String, reflectionText: String) async throws -> ReflectionResponse {
        let url = URL(string: "\(baseURL)/api/reflections")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        let reflectionData = ReflectionRequest(
            student_id: studentId,
            mobile_app_name: mobileAppName,
            reflection_text: reflectionText
        )
        
        print("📤 Submitting reflection: \(studentId) - \(mobileAppName)")
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30.0
        config.timeoutIntervalForResource = 60.0
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        config.httpMaximumConnectionsPerHost = 1
        let session = URLSession(configuration: config)

        let maxRetries = 3
        var lastError: Error?

        for attempt in 1...maxRetries {
            do {
                let jsonData = try JSONEncoder().encode(reflectionData)
                request.httpBody = jsonData
                
                print("🔄 Reflection submission attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type for reflection")
                    throw APIError.invalidResponse
                }
                
                print("✅ Reflection HTTP Status: \(httpResponse.statusCode)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ Reflection server error: \(httpResponse.statusCode)")
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                let reflectionResponse = try JSONDecoder().decode(ReflectionResponse.self, from: data)
                print("✅ Reflection submitted successfully")
                return reflectionResponse
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost submitting reflection (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ Reflection submission failed with error: \(error)")
                throw error
            }
        }
        throw lastError ?? APIError.networkError("Failed to submit reflection after multiple retries.")
    }
    
    // MARK: - Get All Reflections
    func getAllReflections(params: [String: String] = [:]) async throws -> [StudentReflection] {
        var urlComponents = URLComponents(string: "\(baseURL)/api/reflections")!
        
        if !params.isEmpty {
            urlComponents.queryItems = params.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        
        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        print("📤 Fetching all reflections")
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30.0
        config.timeoutIntervalForResource = 60.0
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        config.httpMaximumConnectionsPerHost = 1
        let session = URLSession(configuration: config)

        let maxRetries = 3
        var lastError: Error?

        for attempt in 1...maxRetries {
            do {
                print("🔄 Reflections request attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type for reflections")
                    throw APIError.invalidResponse
                }
                
                print("✅ Reflections HTTP Status: \(httpResponse.statusCode)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ Reflections server error: \(httpResponse.statusCode)")
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                let reflectionsResponse = try JSONDecoder().decode(ReflectionsResponse.self, from: data)
                print("✅ Successfully fetched \(reflectionsResponse.data.reflections.count) reflections")
                return reflectionsResponse.data.reflections
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost fetching reflections (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ Reflections request failed with error: \(error)")
                throw error
            }
        }
        throw lastError ?? APIError.networkError("Failed to fetch reflections after multiple retries.")
    }
}

// MARK: - Data Models

struct Student: Codable, Identifiable {
    let id: String
    let student_id: String
    let full_name: String
    let created_at: String
}

struct StudentsResponse: Codable {
    let success: Bool
    let data: StudentsData
}

struct StudentsData: Codable {
    let students: [Student]
    let total: Int
}

struct StudentCheckIn: Codable, Identifiable {
    let id: Int
    let created_at: String
}

struct CheckInsResponse: Codable {
    let success: Bool
    let data: CheckInsData
}

struct CheckInsData: Codable {
    let check_ins: [StudentCheckIn]
}

struct ReflectionRequest: Codable {
    let student_id: String
    let mobile_app_name: String
    let reflection_text: String
}

struct ReflectionResponse: Codable {
    let success: Bool
    let data: ReflectionData
    let message: String
}

struct ReflectionData: Codable {
    let reflection_id: Int
    let student_id: String
    let student_name: String
    let mobile_app_name: String
    let reflection_text: String
    let submitted_at: String
}

struct StudentReflection: Codable, Identifiable {
    let id: Int
    let student_id: String
    let mobile_app_name: String
    let reflection_text: String
    let created_at: String
    let students: StudentInfo?
}

struct StudentInfo: Codable {
    let full_name: String
}

struct ReflectionsResponse: Codable {
    let success: Bool
    let data: ReflectionsData
}

struct ReflectionsData: Codable {
    let reflections: [StudentReflection]
    let total_reflections: Int
    let showing: ShowingInfo
}

struct ShowingInfo: Codable {
    let limit: Int
    let offset: Int
    let app_name_filter: String?
}

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
    case invalidURL
    case invalidResponse
    case serverError(Int)
    case decodingError
    case networkError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "The server URL is invalid."
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
