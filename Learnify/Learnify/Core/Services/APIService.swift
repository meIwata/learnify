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
    
//    #if DEBUG
//    private let baseURL = "http://localhost:3000"
//    #else
    private let baseURL = "https://learnify-api.zeabur.app"
//    #endif

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
                    
                    // Handle 403 STUDENT_NOT_REGISTERED error specifically
                    if httpResponse.statusCode == 403 {
                        if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data),
                           errorResponse.error == "STUDENT_NOT_REGISTERED" {
                            let message = errorResponse.message ?? "Student ID not registered. Please contact your instructor."
                            throw APIError.studentNotRegistered(message)
                        }
                    }
                    
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
    
    // MARK: - Submit Review
    func submitReview(studentId: String, mobileAppName: String, reviewText: String) async throws -> ReviewResponse {
        let url = URL(string: "\(baseURL)/api/reviews")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        let reviewData = ReviewRequest(
            student_id: studentId,
            mobile_app_name: mobileAppName,
            review_text: reviewText
        )
        
        print("📤 Submitting review: \(studentId) - \(mobileAppName)")
        
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
                let jsonData = try JSONEncoder().encode(reviewData)
                request.httpBody = jsonData
                
                print("🔄 Review submission attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type for review")
                    throw APIError.invalidResponse
                }
                
                print("✅ Review HTTP Status: \(httpResponse.statusCode)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ Review server error: \(httpResponse.statusCode)")
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                let reviewResponse = try JSONDecoder().decode(ReviewResponse.self, from: data)
                print("✅ Review submitted successfully")
                return reviewResponse
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost submitting review (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ Review submission failed with error: \(error)")
                throw error
            }
        }
        throw lastError ?? APIError.networkError("Failed to submit review after multiple retries.")
    }
    
    // MARK: - Get All Reviews
    func getAllReviews(params: [String: String] = [:]) async throws -> [StudentReview] {
        var urlComponents = URLComponents(string: "\(baseURL)/api/reviews")!
        
        if !params.isEmpty {
            urlComponents.queryItems = params.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        
        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        print("📤 Fetching all reviews")
        
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
                print("🔄 Reviews request attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type for reviews")
                    throw APIError.invalidResponse
                }
                
                print("✅ Reviews HTTP Status: \(httpResponse.statusCode)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ Reviews server error: \(httpResponse.statusCode)")
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                let reviewsResponse = try JSONDecoder().decode(ReviewsResponse.self, from: data)
                print("✅ Successfully fetched \(reviewsResponse.data.reviews.count) reviews")
                return reviewsResponse.data.reviews
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost fetching reviews (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ Reviews request failed with error: \(error)")
                throw error
            }
        }
        throw lastError ?? APIError.networkError("Failed to fetch reviews after multiple retries.")
    }
    
    // MARK: - Leaderboard
    func getLeaderboard(limit: Int = 50, offset: Int = 0) async throws -> [LeaderboardEntry] {
        var urlComponents = URLComponents(string: "\(baseURL)/api/leaderboard")!
        urlComponents.queryItems = [
            URLQueryItem(name: "limit", value: String(limit)),
            URLQueryItem(name: "offset", value: String(offset))
        ]
        
        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        print("📤 Fetching leaderboard")
        
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
                print("🔄 Leaderboard request attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type for leaderboard")
                    throw APIError.invalidResponse
                }
                
                print("✅ Leaderboard HTTP Status: \(httpResponse.statusCode)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ Leaderboard server error: \(httpResponse.statusCode)")
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                let leaderboardResponse = try JSONDecoder().decode(LeaderboardResponse.self, from: data)
                print("✅ Successfully fetched \(leaderboardResponse.data.leaderboard.count) leaderboard entries")
                return leaderboardResponse.data.leaderboard
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost fetching leaderboard (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ Leaderboard request failed with error: \(error)")
                throw error
            }
        }
        throw lastError ?? APIError.networkError("Failed to fetch leaderboard after multiple retries.")
    }
    
    // MARK: - Get Student Reviews
    func getStudentReviews(studentId: String, params: [String: String] = [:]) async throws -> StudentReviewsResponse {
        var urlComponents = URLComponents(string: "\(baseURL)/api/reviews/\(studentId)")!
        
        if !params.isEmpty {
            urlComponents.queryItems = params.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        
        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        print("📤 Fetching student reviews for: \(studentId)")
        
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
                print("🔄 Student reviews request attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type for student reviews")
                    throw APIError.invalidResponse
                }
                
                print("✅ Student reviews HTTP Status: \(httpResponse.statusCode)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ Student reviews server error: \(httpResponse.statusCode)")
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                let reviewsResponse = try JSONDecoder().decode(StudentReviewsResponse.self, from: data)
                print("✅ Successfully fetched \(reviewsResponse.data.reviews.count) student reviews")
                return reviewsResponse
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost fetching student reviews (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ Student reviews request failed with error: \(error)")
                throw error
            }
        }
        throw lastError ?? APIError.networkError("Failed to fetch student reviews after multiple retries.")
    }
    
    // MARK: - Lessons
    func getCurrentLesson(includePlan: Bool = true) async throws -> LessonDetail? {
        var urlComponents = URLComponents(string: "\(baseURL)/api/lessons/current")!
        if includePlan {
            urlComponents.queryItems = [URLQueryItem(name: "include_plan", value: "true")]
        }
        
        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        print("📤 Fetching current lesson")
        
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
                print("🔄 Current lesson request attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type for current lesson")
                    throw APIError.invalidResponse
                }
                
                print("✅ Current lesson HTTP Status: \(httpResponse.statusCode)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ Current lesson server error: \(httpResponse.statusCode)")
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                let lessonResponse = try JSONDecoder().decode(CurrentLessonResponse.self, from: data)
                print("✅ Successfully fetched current lesson: \(lessonResponse.data?.name ?? "None")")
                return lessonResponse.data
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost fetching current lesson (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ Current lesson request failed with error: \(error)")
                throw error
            }
        }
        throw lastError ?? APIError.networkError("Failed to fetch current lesson after multiple retries.")
    }
    
    func getAllLessons(status: String? = nil, includePlan: Bool = true) async throws -> [LessonDetail] {
        var urlComponents = URLComponents(string: "\(baseURL)/api/lessons")!
        
        var queryItems: [URLQueryItem] = []
        if let status = status {
            queryItems.append(URLQueryItem(name: "status", value: status))
        }
        if includePlan {
            queryItems.append(URLQueryItem(name: "include_plan", value: "true"))
        }
        
        if !queryItems.isEmpty {
            urlComponents.queryItems = queryItems
        }
        
        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        print("📤 Fetching all lessons")
        
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
                print("🔄 All lessons request attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type for lessons")
                    throw APIError.invalidResponse
                }
                
                print("✅ All lessons HTTP Status: \(httpResponse.statusCode)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ All lessons server error: \(httpResponse.statusCode)")
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                let lessonsResponse = try JSONDecoder().decode(LessonsResponse.self, from: data)
                print("✅ Successfully fetched \(lessonsResponse.data.count) lessons")
                return lessonsResponse.data
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost fetching lessons (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ Lessons request failed with error: \(error)")
                throw error
            }
        }
        throw lastError ?? APIError.networkError("Failed to fetch lessons after multiple retries.")
    }
    
    func getLesson(id: String, includePlan: Bool = true) async throws -> LessonDetail? {
        var urlComponents = URLComponents(string: "\(baseURL)/api/lessons/\(id)")!
        if includePlan {
            urlComponents.queryItems = [URLQueryItem(name: "include_plan", value: "true")]
        }
        
        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        print("📤 Fetching lesson \(id)")
        
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
                print("🔄 Lesson \(id) request attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type for lesson \(id)")
                    throw APIError.invalidResponse
                }
                
                print("✅ Lesson \(id) HTTP Status: \(httpResponse.statusCode)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ Lesson \(id) server error: \(httpResponse.statusCode)")
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                let lessonResponse = try JSONDecoder().decode(LessonResponse.self, from: data)
                print("✅ Successfully fetched lesson \(id): \(lessonResponse.data?.name ?? "Not found")")
                return lessonResponse.data
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost fetching lesson \(id) (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ Lesson \(id) request failed with error: \(error)")
                throw error
            }
        }
        throw lastError ?? APIError.networkError("Failed to fetch lesson \(id) after multiple retries.")
    }
    
    // MARK: - Submissions
    func submitSubmission(studentId: String, fullName: String, submissionType: String, title: String, description: String?, githubURL: String?, imageData: Data?) async throws -> SubmissionResponse {
        let url = URL(string: "\(baseURL)/api/submissions")!
        
        // Create multipart form data
        let boundary = UUID().uuidString
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.timeoutInterval = 60 // Longer timeout for file uploads
        
        var body = Data()
        
        // Add form fields
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"student_id\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(studentId)\r\n".data(using: .utf8)!)
        
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"full_name\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(fullName)\r\n".data(using: .utf8)!)
        
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"submission_type\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(submissionType)\r\n".data(using: .utf8)!)
        
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"title\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(title)\r\n".data(using: .utf8)!)
        
        if let description = description {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"description\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(description)\r\n".data(using: .utf8)!)
        }
        
        if let githubURL = githubURL {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"github_url\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(githubURL)\r\n".data(using: .utf8)!)
        }
        
        // Add file data if present
        if let imageData = imageData {
            let fileName = "submission_\(studentId)_\(Date().timeIntervalSince1970).jpg"
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
            body.append(imageData)
            body.append("\r\n".data(using: .utf8)!)
        }
        
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        print("📤 Submitting submission: \(studentId) - \(title)")
        print("📤 Submission type: \(submissionType)")
        print("📤 File size: \(imageData?.count ?? 0) bytes")
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 60.0
        config.timeoutIntervalForResource = 120.0
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        config.httpMaximumConnectionsPerHost = 1
        let session = URLSession(configuration: config)

        let maxRetries = 3
        var lastError: Error?

        for attempt in 1...maxRetries {
            do {
                print("🔄 Submission attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type for submission")
                    throw APIError.invalidResponse
                }
                
                print("✅ Submission HTTP Status: \(httpResponse.statusCode)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ Submission server error: \(httpResponse.statusCode)")
                    if let responseString = String(data: data, encoding: .utf8) {
                        print("❌ Response body: \(responseString)")
                    }
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                let submissionResponse = try JSONDecoder().decode(SubmissionResponse.self, from: data)
                print("✅ Submission uploaded successfully")
                return submissionResponse
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost submitting (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ Submission failed with error: \(error)")
                throw error
            }
        }
        throw lastError ?? APIError.networkError("Failed to submit after multiple retries.")
    }
    
    // MARK: - Admin/Teacher Lesson Management
    
    func updateLessonStatus(id: Int, status: String, authToken: String) async throws -> LessonDetail {
        let url = URL(string: "\(baseURL)/api/lessons/\(id)/status")!
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        
        let statusUpdate = LessonStatusUpdate(status: status)
        request.httpBody = try JSONEncoder().encode(statusUpdate)
        
        print("📤 Updating lesson \(id) status to \(status)")
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30.0
        let session = URLSession(configuration: config)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        let updateResponse = try JSONDecoder().decode(LessonUpdateResponse.self, from: data)
        print("✅ Successfully updated lesson \(id) status")
        return updateResponse.data.lesson
    }
    
    func updateLessonURL(id: Int, url: String, authToken: String) async throws -> LessonDetail {
        let requestURL = URL(string: "\(baseURL)/api/lessons/\(id)/url")!
        var request = URLRequest(url: requestURL)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        
        let urlUpdate = LessonURLUpdate(further_reading_url: url)
        request.httpBody = try JSONEncoder().encode(urlUpdate)
        
        print("📤 Updating lesson \(id) URL")
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30.0
        let session = URLSession(configuration: config)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        let updateResponse = try JSONDecoder().decode(LessonUpdateResponse.self, from: data)
        print("✅ Successfully updated lesson \(id) URL")
        return updateResponse.data.lesson
    }
    
    func updateLessonProgress(lessonId: Int, planItemId: Int, completed: Bool, authToken: String) async throws -> LessonProgressUpdate {
        let url = URL(string: "\(baseURL)/api/lessons/\(lessonId)/progress")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        
        let progressUpdate = LessonProgressRequest(lesson_plan_item_id: planItemId, completed: completed)
        request.httpBody = try JSONEncoder().encode(progressUpdate)
        
        print("📤 Updating lesson \(lessonId) progress for item \(planItemId)")
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30.0
        let session = URLSession(configuration: config)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        let updateResponse = try JSONDecoder().decode(LessonProgressResponse.self, from: data)
        print("✅ Successfully updated lesson progress")
        return updateResponse.data.progress
    }
    
    // MARK: - Quiz Methods
    
    func getRandomQuizQuestions(count: Int = 5, difficulty: Int? = nil, studentId: String? = nil, questionType: String? = nil) async throws -> [QuizQuestion] {
        var urlComponents = URLComponents(string: "\(baseURL)/api/quiz/questions/random")!
        
        var queryItems: [URLQueryItem] = [URLQueryItem(name: "count", value: String(count))]
        if let difficulty = difficulty {
            queryItems.append(URLQueryItem(name: "difficulty", value: String(difficulty)))
        }
        if let studentId = studentId {
            queryItems.append(URLQueryItem(name: "student_id", value: studentId))
        }
        if let questionType = questionType {
            queryItems.append(URLQueryItem(name: "question_type", value: questionType))
        }
        urlComponents.queryItems = queryItems
        
        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        print("📤 Fetching \(count) random quiz questions")
        
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
                print("🔄 Quiz questions request attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type for quiz questions")
                    throw APIError.invalidResponse
                }
                
                print("✅ Quiz questions HTTP Status: \(httpResponse.statusCode)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ Quiz questions server error: \(httpResponse.statusCode)")
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                let questionsResponse = try JSONDecoder().decode(RandomQuestionsResponse.self, from: data)
                print("✅ Successfully fetched \(questionsResponse.data.questions.count) quiz questions")
                return questionsResponse.data.questions
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost fetching quiz questions (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ Quiz questions request failed with error: \(error)")
                throw error
            }
        }
        throw lastError ?? APIError.networkError("Failed to fetch quiz questions after multiple retries.")
    }
    
    func submitQuizAnswer(studentId: String, fullName: String, questionId: Int, selectedAnswer: String, attemptTimeSeconds: Int? = nil) async throws -> QuizSubmissionData {
        let url = URL(string: "\(baseURL)/api/quiz/submit-answer")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        let submissionData = QuizSubmissionRequest(
            student_id: studentId,
            full_name: fullName,
            question_id: questionId,
            selected_answer: selectedAnswer,
            attempt_time_seconds: attemptTimeSeconds
        )
        
        print("📤 Submitting quiz answer: \(studentId) - Question \(questionId) - Answer \(selectedAnswer)")
        
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
                let jsonData = try JSONEncoder().encode(submissionData)
                request.httpBody = jsonData
                
                print("🔄 Quiz submission attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type for quiz submission")
                    throw APIError.invalidResponse
                }
                
                print("✅ Quiz submission HTTP Status: \(httpResponse.statusCode)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ Quiz submission server error: \(httpResponse.statusCode)")
                    
                    // Handle 403 STUDENT_NOT_REGISTERED error specifically
                    if httpResponse.statusCode == 403 {
                        if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data),
                           errorResponse.error == "STUDENT_NOT_REGISTERED" {
                            let message = errorResponse.message ?? "Student ID not registered. Please contact your instructor."
                            throw APIError.studentNotRegistered(message)
                        }
                    }
                    
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                let submissionResponse = try JSONDecoder().decode(QuizSubmissionResponse.self, from: data)
                print("✅ Quiz answer submitted successfully - \(submissionResponse.data.is_correct ? "Correct" : "Incorrect")")
                return submissionResponse.data
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost submitting quiz answer (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ Quiz submission failed with error: \(error)")
                throw error
            }
        }
        throw lastError ?? APIError.networkError("Failed to submit quiz answer after multiple retries.")
    }
    
    func getStudentQuizScores(studentId: String) async throws -> StudentQuizScoresData {
        let url = URL(string: "\(baseURL)/api/quiz/student/\(studentId)/scores")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        print("📤 Fetching quiz scores for student: \(studentId)")
        
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
                print("🔄 Student quiz scores request attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type for student quiz scores")
                    throw APIError.invalidResponse
                }
                
                print("✅ Student quiz scores HTTP Status: \(httpResponse.statusCode)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ Student quiz scores server error: \(httpResponse.statusCode)")
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                let scoresResponse = try JSONDecoder().decode(StudentQuizScoresResponse.self, from: data)
                print("✅ Successfully fetched quiz scores for \(scoresResponse.data.student.full_name)")
                return scoresResponse.data
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost fetching quiz scores (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ Quiz scores request failed with error: \(error)")
                throw error
            }
        }
        throw lastError ?? APIError.networkError("Failed to fetch quiz scores after multiple retries.")
    }
    
    func getQuestionStats() async throws -> QuestionStatsData {
        let url = URL(string: "\(baseURL)/api/quiz/questions/stats")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        print("📤 Fetching question statistics")
        
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
                print("🔄 Question stats request attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type for question stats")
                    throw APIError.invalidResponse
                }
                
                print("✅ Question stats HTTP Status: \(httpResponse.statusCode)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ Question stats server error: \(httpResponse.statusCode)")
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                let statsResponse = try JSONDecoder().decode(QuestionStatsResponse.self, from: data)
                print("✅ Successfully fetched question statistics")
                return statsResponse.data
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost fetching question stats (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ Question stats request failed with error: \(error)")
                throw error
            }
        }
        throw lastError ?? APIError.networkError("Failed to fetch question stats after multiple retries.")
    }
    
    // MARK: - Student Information
    
    func getStudentInfo(studentId: String) async throws -> Student {
        let url = URL(string: "\(baseURL)/api/auto/students/\(studentId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        print("📤 Fetching student info: \(studentId)")
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30.0
        config.timeoutIntervalForResource = 60.0
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        config.httpMaximumConnectionsPerHost = 1
        let session = URLSession(configuration: config)

        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                print("❌ Invalid response type for student info")
                throw APIError.invalidResponse
            }
            
            print("✅ Student info HTTP Status: \(httpResponse.statusCode)")
            
            if httpResponse.statusCode == 403 {
                if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data),
                   errorResponse.error == "STUDENT_NOT_REGISTERED" {
                    let message = errorResponse.message ?? "Student ID not registered. Please contact your instructor."
                    throw APIError.studentNotRegistered(message)
                }
            }
            
            guard (200...299).contains(httpResponse.statusCode) else {
                throw APIError.serverError(httpResponse.statusCode)
            }
            
            let studentResponse = try JSONDecoder().decode(StudentInfoResponse.self, from: data)
            return studentResponse.data.student
            
        } catch let error as APIError {
            throw error
        } catch {
            print("❌ Student info fetch failed with error: \(error)")
            throw APIError.networkError(error.localizedDescription)
        }
    }

    // MARK: - Student Validation
    
    func checkStudentExists(studentId: String) async throws -> Bool {
        let url = URL(string: "\(baseURL)/api/auto/students/\(studentId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        print("📤 Checking if student exists: \(studentId)")
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30.0
        config.timeoutIntervalForResource = 60.0
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        config.httpMaximumConnectionsPerHost = 1
        let session = URLSession(configuration: config)

        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                print("❌ Invalid response type for student existence check")
                return false
            }
            
            print("✅ Student existence check HTTP Status: \(httpResponse.statusCode)")
            
            if httpResponse.statusCode == 404 {
                // Student not found
                return false
            } else if httpResponse.statusCode == 403 {
                // Check if it's STUDENT_NOT_REGISTERED error
                if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data),
                   errorResponse.error == "STUDENT_NOT_REGISTERED" {
                    return false
                }
                // For other 403 errors, assume student might exist but there's a different issue
                return true
            } else if (200...299).contains(httpResponse.statusCode) {
                // Success means student exists
                return true
            } else {
                // For other errors, assume student might exist but there's a different issue
                return true
            }
            
        } catch {
            print("❌ Student existence check failed with error: \(error)")
            // For network errors, assume student might exist to avoid blocking valid users
            return true
        }
    }
    
    func getAllQuestionsWithAttempts(studentId: String) async throws -> AllQuestionsData {
        let url = URL(string: "\(baseURL)/api/quiz/questions/all/\(studentId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        print("📤 Fetching all questions with attempts for student: \(studentId)")
        
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
                print("🔄 All questions with attempts request attempt \(attempt)/\(maxRetries)")
                let (data, response) = try await session.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid response type for all questions with attempts")
                    throw APIError.invalidResponse
                }
                
                print("✅ All questions with attempts HTTP Status: \(httpResponse.statusCode)")
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    print("❌ All questions with attempts server error: \(httpResponse.statusCode)")
                    throw APIError.serverError(httpResponse.statusCode)
                }
                
                let questionsResponse = try JSONDecoder().decode(AllQuestionsResponse.self, from: data)
                print("✅ Successfully fetched \(questionsResponse.data.questions.count) questions with attempts")
                return questionsResponse.data
                
            } catch let error as URLError where error.code == .networkConnectionLost && attempt < maxRetries {
                print("⚠️ Network connection lost fetching all questions with attempts (Attempt \(attempt)/\(maxRetries)). Error: \(error)")
                lastError = error
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue
            } catch {
                print("❌ All questions with attempts request failed with error: \(error)")
                throw error
            }
        }
        throw lastError ?? APIError.networkError("Failed to fetch all questions with attempts after multiple retries.")
    }
}

// MARK: - Data Models

struct Student: Codable, Identifiable {
    let id: String
    let student_id: String
    let full_name: String
    let created_at: String

    private enum CodingKeys: String, CodingKey {
        case id
        case uuid
        case student_id
        case full_name
        case created_at
    }

    init(id: String, student_id: String, full_name: String, created_at: String) {
        self.id = id
        self.student_id = student_id
        self.full_name = full_name
        self.created_at = created_at
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let id = try container.decodeIfPresent(String.self, forKey: .id) ?? container.decode(String.self, forKey: .uuid)
        let student_id = try container.decode(String.self, forKey: .student_id)
        let full_name = try container.decode(String.self, forKey: .full_name)
        let created_at = try container.decode(String.self, forKey: .created_at)
        self.init(id: id, student_id: student_id, full_name: full_name, created_at: created_at)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(student_id, forKey: .student_id)
        try container.encode(full_name, forKey: .full_name)
        try container.encode(created_at, forKey: .created_at)
    }
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

struct ReviewRequest: Codable {
    let student_id: String
    let mobile_app_name: String
    let review_text: String
}

struct ReviewResponse: Codable {
    let success: Bool
    let data: ReviewData
    let message: String
}

struct ReviewData: Codable {
    let review_id: Int
    let student_id: String
    let student_name: String
    let mobile_app_name: String
    let review_text: String
    let submitted_at: String
}

struct StudentReview: Codable, Identifiable {
    let id: Int
    let student_id: String
    let mobile_app_name: String
    let review_text: String
    let created_at: String
    let students: ReviewStudentInfo?
}

struct ReviewStudentInfo: Codable {
    let full_name: String
}

struct ReviewsResponse: Codable {
    let success: Bool
    let data: ReviewsData
}

struct ReviewsData: Codable {
    let reviews: [StudentReview]
    let total_reviews: Int
    let showing: ShowingInfo
}

struct ShowingInfo: Codable {
    let limit: Int
    let offset: Int
    let app_name_filter: String?
}

struct StudentReviewsResponse: Codable {
    let success: Bool
    let data: StudentReviewsData
}

struct StudentReviewsData: Codable {
    let reviews: [StudentReview]
    let total_reviews: Int
    let showing: ShowingInfo
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

// MARK: - Error Response Models

struct ErrorResponse: Codable {
    let success: Bool
    let error: String?
    let message: String?
}

struct StudentInfoResponse: Codable {
    let success: Bool
    let data: StudentInfoData
}

struct StudentInfoData: Codable {
    let student: Student
}

// MARK: - Error Handling

enum APIError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case serverError(Int)
    case decodingError
    case networkError(String)
    case studentNotRegistered(String)
    
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
        case .studentNotRegistered(let message):
            return message
        }
    }
}

// MARK: - Leaderboard Data Models

struct LeaderboardEntry: Codable, Identifiable {
    let student_id: String
    let full_name: String
    let total_marks: Int
    let total_check_ins: Int
    let latest_check_in: String?
    let rank: Int
    
    var id: String { student_id }
}

struct LeaderboardResponse: Codable {
    let success: Bool
    let data: LeaderboardData
}

struct LeaderboardData: Codable {
    let leaderboard: [LeaderboardEntry]
    let total_students: Int
    let showing: LeaderboardPagination
}

struct LeaderboardPagination: Codable {
    let limit: Int
    let offset: Int
    let total_pages: Int?
    let current_page: Int?
}

// MARK: - Lesson Data Models

struct LessonDetail: Codable, Identifiable {
    let id: String
    let lesson_number: Int
    let name: String
    let description: String?
    let scheduled_date: String
    let status: String
    let topic_name: String?
    let icon: String?
    let color: String?
    let button_color: String?
    let further_reading_url: String?
    let lesson_content: [String]?
    let created_at: String
    let updated_at: String
    let plan: [LessonPlanItem]?
    let completion_percentage: Double?
    
    // Computed properties for compatibility with existing code
    var lesson_plan_items: [LessonPlanItem]? {
        return plan
    }
    
    var lesson_content_string: String? {
        return lesson_content?.joined(separator: "\n")
    }
}

struct LessonPlanItem: Codable, Identifiable {
    let id: String?
    let title: String?
    let required: Bool?
    let completed: Bool?
    
    // Computed properties for compatibility with existing code
    var is_required: Bool {
        return required ?? false
    }
    var lesson_id: Int { return 0 } // Not provided by backend
    var sort_order: Int { return 0 } // Not provided by backend
    var created_at: String { return "" } // Not provided by backend
    var completed_at: String? { return nil } // Not provided by backend
    
    // Generate a fallback ID for Identifiable conformance
    var identifiableId: String {
        return id ?? UUID().uuidString
    }
}

struct CurrentLessonResponse: Codable {
    let success: Bool
    let data: LessonDetail?
}

struct LessonsResponse: Codable {
    let success: Bool
    let data: [LessonDetail]
}

struct LessonResponse: Codable {
    let success: Bool
    let data: LessonDetail?
}

// MARK: - Admin/Teacher Request Models

struct LessonStatusUpdate: Codable {
    let status: String
}

struct LessonURLUpdate: Codable {
    let further_reading_url: String
}

struct LessonProgressRequest: Codable {
    let lesson_plan_item_id: Int
    let completed: Bool
}

// MARK: - Admin/Teacher Response Models

struct LessonUpdateResponse: Codable {
    let success: Bool
    let data: LessonUpdateData
    let message: String
}

struct LessonUpdateData: Codable {
    let lesson: LessonDetail
}

struct LessonProgressResponse: Codable {
    let success: Bool
    let data: LessonProgressData
    let message: String
}

struct LessonProgressData: Codable {
    let progress: LessonProgressUpdate
}

struct LessonProgressUpdate: Codable {
    let lesson_plan_item_id: Int
    let completed: Bool
    let completed_at: String?
    let completed_by_teacher_id: String?
}

// MARK: - Submission Data Models

struct SubmissionResponse: Codable {
    let success: Bool
    let data: SubmissionData
    let message: String
}

struct SubmissionData: Codable {
    let submission: Submission
}

struct Submission: Codable, Identifiable {
    let id: Int
    let student_id: String
    let submission_type: String
    let title: String
    let description: String?
    let file_path: String?
    let file_name: String?
    let file_size: Int?
    let mime_type: String?
    let github_url: String?
    let lesson_id: String?
    let file_url: String?
    let student_name: String?
    let created_at: String
    let updated_at: String
}

// MARK: - Quiz Data Models

struct QuizQuestion: Codable, Identifiable {
    let id: Int
    let question_text: String
    let question_category: String
    let difficulty_level: Int
    let option_a: String
    let option_b: String
    let option_c: String
    let option_d: String
    
    var options: [String] {
        [option_a, option_b, option_c, option_d]
    }
}

struct QuizSubmissionRequest: Codable {
    let student_id: String
    let full_name: String?
    let question_id: Int
    let selected_answer: String
    let attempt_time_seconds: Int?
}

struct QuizSubmissionResponse: Codable {
    let success: Bool
    let data: QuizSubmissionData
    let message: String
}

struct QuizSubmissionData: Codable {
    let attempt: QuizAttempt
    let is_correct: Bool
    let points_earned: Int
    let correct_answer: String
    let explanation: String?
}

struct QuizAttempt: Codable {
    let id: Int
    let student_id: String
    let student_uuid: String
    let question_id: Int
    let selected_answer: String
    let is_correct: Bool
    let points_earned: Int
    let attempt_time_seconds: Int?
    let created_at: String
}

struct RandomQuestionsResponse: Codable {
    let success: Bool
    let data: RandomQuestionsData
}

struct RandomQuestionsData: Codable {
    let questions: [QuizQuestion]
    let total_available: Int
}

struct StudentQuizScoresResponse: Codable {
    let success: Bool
    let data: StudentQuizScoresData
}

struct StudentQuizScoresData: Codable {
    let student: StudentInfo
    let quiz_scores: QuizScore?
    let recent_attempts: [QuizAttempt]
    let total_attempts: Int
}

struct QuizScore: Codable {
    let id: Int
    let student_id: String
    let student_uuid: String
    let total_questions_attempted: Int
    let total_correct_answers: Int
    let total_points: Int
    let accuracy_percentage: Double
    let last_quiz_date: String?
    let created_at: String
    let updated_at: String
}

struct StudentInfo: Codable {
    let student_id: String
    let full_name: String
    let uuid: String
}

struct QuestionStatItem: Codable {
    let difficulty_level: Int
    let difficulty_name: String
    let question_count: Int
}

struct QuestionStatsResponse: Codable {
    let success: Bool
    let data: QuestionStatsData
}

struct QuestionStatsData: Codable {
    let total_questions: Int
    let difficulty_breakdown: [QuestionStatItem]
    let last_updated: String
}

// MARK: - All Questions with Attempts Data Models

struct QuestionWithAttempts: Codable, Identifiable {
    let id: Int
    let question_text: String
    let question_category: String
    let difficulty_level: Int
    let option_a: String
    let option_b: String
    let option_c: String
    let option_d: String
    let correct_answer: String
    let explanation: String?
    let attempt_summary: AttemptSummary
    
    var options: [String] {
        [option_a, option_b, option_c, option_d]
    }
}

struct AttemptSummary: Codable {
    let total_attempts: Int
    let correct_attempts: Int
    let accuracy_percentage: Int
    let total_points: Int
    let latest_attempt: LatestAttempt?
    let status: String
}

struct LatestAttempt: Codable {
    let selected_answer: String
    let is_correct: Bool
    let points_earned: Int
    let created_at: String
}

struct QuestionsSummary: Codable {
    let total_questions: Int
    let attempted_questions: Int
    let mastered_questions: Int
    let never_attempted: Int
    let overall_accuracy: Int
}

struct AllQuestionsResponse: Codable {
    let success: Bool
    let data: AllQuestionsData
}

struct AllQuestionsData: Codable {
    let student: StudentInfo
    let questions: [QuestionWithAttempts]
    let summary: QuestionsSummary
}
