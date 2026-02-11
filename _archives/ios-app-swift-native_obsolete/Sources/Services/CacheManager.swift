//
//  CacheManager.swift
//  LiveOwnerUnit
//
//  Gestion du cache 3 niveaux (Memory, Disk, Supabase)
//

import Foundation

actor CacheManager {
    static let shared = CacheManager()
    
    // Memory Cache (NSCache)
    private let memoryCache = NSCache<NSString, CacheEntry>()
    
    // Disk Cache Directory
    private let diskCacheURL: URL = {
        let fileManager = FileManager.default
        let cacheDir = fileManager.urls(for: .cachesDirectory, in: .userDomainMask).first!
        let appCache = cacheDir.appendingPathComponent("LiveOwnerUnit", isDirectory: true)
        
        try? fileManager.createDirectory(at: appCache, withIntermediateDirectories: true)
        
        return appCache
    }()
    
    // Cache TTL (Time To Live)
    private let defaultTTL: TimeInterval = 3600 // 1 heure
    
    private init() {
        // Configuration du NSCache
        memoryCache.countLimit = 100 // Max 100 entrées
        memoryCache.totalCostLimit = 50 * 1024 * 1024 // Max 50MB
    }
    
    // MARK: - Get
    func get<T: Codable>(
        key: String,
        type: T.Type,
        fetchIfMissing: (() async throws -> T)? = nil
    ) async throws -> T? {
        // 1. Vérifier Memory Cache
        if let cached = memoryCache.object(forKey: key as NSString) {
            if cached.isValid {
                print("💾 [Cache] HIT (Memory): \(key)")
                if let data = cached.data, let decoded = try? JSONDecoder().decode(T.self, from: data) {
                    return decoded
                }
            } else {
                memoryCache.removeObject(forKey: key as NSString)
            }
        }
        
        // 2. Vérifier Disk Cache
        let fileURL = diskCacheURL.appendingPathComponent(key.md5)
        if let entry = try? loadFromDisk(url: fileURL), entry.isValid {
            print("💾 [Cache] HIT (Disk): \(key)")
            if let data = entry.data, let decoded = try? JSONDecoder().decode(T.self, from: data) {
                // Remettre en memory cache
                memoryCache.setObject(entry, forKey: key as NSString)
                return decoded
            }
        }
        
        // 3. Fetch from network si fonction fournie
        if let fetchIfMissing = fetchIfMissing {
            print("🌐 [Cache] MISS: \(key) - Fetching...")
            let value = try await fetchIfMissing()
            try await set(value, forKey: key)
            return value
        }
        
        return nil
    }
    
    // MARK: - Set
    func set<T: Codable>(_ value: T, forKey key: String, ttl: TimeInterval? = nil) async throws {
        let data = try JSONEncoder().encode(value)
        let expiresAt = Date().addingTimeInterval(ttl ?? defaultTTL)
        let entry = CacheEntry(data: data, expiresAt: expiresAt)
        
        // Memory Cache
        memoryCache.setObject(entry, forKey: key as NSString, cost: data.count)
        
        // Disk Cache
        let fileURL = diskCacheURL.appendingPathComponent(key.md5)
        try saveToDisk(entry: entry, url: fileURL)
        
        print("💾 [Cache] SET: \(key)")
    }
    
    // MARK: - Remove
    func remove(key: String) async {
        memoryCache.removeObject(forKey: key as NSString)
        
        let fileURL = diskCacheURL.appendingPathComponent(key.md5)
        try? FileManager.default.removeItem(at: fileURL)
        
        print("💾 [Cache] REMOVE: \(key)")
    }
    
    // MARK: - Clear All
    func clearAll() async {
        memoryCache.removeAllObjects()
        
        try? FileManager.default.removeItem(at: diskCacheURL)
        try? FileManager.default.createDirectory(at: diskCacheURL, withIntermediateDirectories: true)
        
        print("💾 [Cache] CLEARED")
    }
    
    // MARK: - Disk Helpers
    private func saveToDisk(entry: CacheEntry, url: URL) throws {
        let data = try JSONEncoder().encode(entry)
        try data.write(to: url, options: .atomic)
    }
    
    private func loadFromDisk(url: URL) throws -> CacheEntry {
        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode(CacheEntry.self, from: data)
    }
}

// MARK: - Cache Entry
private class CacheEntry: NSObject, Codable {
   let data: Data
    let expiresAt: Date
    
    init(data: Data, expiresAt: Date) {
        self.data = data
        self.expiresAt = expiresAt
    }
    
    var isValid: Bool {
        expiresAt > Date()
    }
    
    enum CodingKeys: String, CodingKey {
        case data, expiresAt
    }
}

// MARK: - String Extension (MD5 for cache keys)
extension String {
    var md5: String {
        guard let data = self.data(using: .utf8) else { return self }
        let hash = data.map { String(format: "%02hhx", $0) }.joined()
        return hash
    }
}
