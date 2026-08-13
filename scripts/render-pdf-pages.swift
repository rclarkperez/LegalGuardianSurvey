import Foundation
import PDFKit
import AppKit

let arguments = Array(CommandLine.arguments.dropFirst())

guard arguments.count >= 2 else {
    fputs("Usage: render-pdf-pages.swift <output-dir> <pdf-path> [<pdf-path>...]\n", stderr)
    exit(1)
}

let outputRoot = URL(fileURLWithPath: arguments[0], isDirectory: true)
try? FileManager.default.createDirectory(at: outputRoot, withIntermediateDirectories: true)

for inputPath in arguments.dropFirst() {
    let inputURL = URL(fileURLWithPath: inputPath)
    guard let document = PDFDocument(url: inputURL) else {
        fputs("Could not open \(inputPath)\n", stderr)
        continue
    }

    let stem = inputURL.deletingPathExtension().lastPathComponent.replacingOccurrences(of: " ", with: "_")
    let outputDir = outputRoot.appendingPathComponent(stem, isDirectory: true)
    try? FileManager.default.createDirectory(at: outputDir, withIntermediateDirectories: true)

    for pageIndex in 0..<document.pageCount {
        autoreleasepool {
            guard let page = document.page(at: pageIndex) else { return }

            let box = page.bounds(for: .mediaBox)
            let scale: CGFloat = 2.0
            let size = NSSize(width: box.width * scale, height: box.height * scale)
            let image = NSImage(size: size)

            image.lockFocus()
            NSColor.white.setFill()
            NSRect(origin: .zero, size: size).fill()

            if let context = NSGraphicsContext.current?.cgContext {
                context.saveGState()
                context.scaleBy(x: scale, y: scale)
                page.draw(with: .mediaBox, to: context)
                context.restoreGState()
            }

            image.unlockFocus()

            guard
                let tiff = image.tiffRepresentation,
                let bitmap = NSBitmapImageRep(data: tiff),
                let png = bitmap.representation(using: .png, properties: [:])
            else {
                return
            }

            let outputURL = outputDir.appendingPathComponent(String(format: "page-%02d.png", pageIndex + 1))
            try? png.write(to: outputURL)
        }
    }

    print("rendered \(inputURL.lastPathComponent) -> \(outputDir.path)")
}
