//
//  Item.swift
//  Learnify
//
//  Created by Harry Taiwan on 2025/6/29.
//

import Foundation
import SwiftData

@Model
final class Item {
    var timestamp: Date
    
    init(timestamp: Date) {
        self.timestamp = timestamp
    }
}
