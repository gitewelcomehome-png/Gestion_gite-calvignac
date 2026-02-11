// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "LiveOwnerUnit",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "LiveOwnerUnit",
            targets: ["LiveOwnerUnit"]),
    ],
    dependencies: [
        // Supabase Swift SDK
        .package(url: "https://github.com/supabase-community/supabase-swift", from: "1.0.0"),
        // Keychain Access pour sécurité
        .package(url: "https://github.com/kishikawakatsumi/KeychainAccess", from: "4.2.2"),
    ],
    targets: [
        .target(
            name: "LiveOwnerUnit",
            dependencies: [
                .product(name: "Supabase", package: "supabase-swift"),
                .product(name: "KeychainAccess", package: "KeychainAccess"),
            ]
        ),
        .testTarget(
            name: "LiveOwnerUnitTests",
            dependencies: ["LiveOwnerUnit"]
        ),
    ]
)
