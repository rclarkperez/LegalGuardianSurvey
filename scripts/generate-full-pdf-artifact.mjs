import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { Blob } from 'node:buffer'
import { fileURLToPath } from 'node:url'
import { guardianShipFormTemplate } from '../src/templates/guardianShipForm.template.ts'
import { buildWholePdfFixture } from '../tests/fixtures/full-pdf-fixture.ts'
import { generatePdfFromTemplate } from '../src/utils/templatePdfGenerator.ts'

globalThis.Blob ??= Blob

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const templatePath = path.join(rootDir, 'public', 'GuardianShipFormFillable2.pdf')
const outputPath = path.join(rootDir, 'artifacts', 'generated-pdfs', 'generated-full-pdf-recheck.pdf')
const templateBytes = readFileSync(templatePath)
const templateBuffer = templateBytes.buffer.slice(
  templateBytes.byteOffset,
  templateBytes.byteOffset + templateBytes.byteLength
)

const pdfBlob = await generatePdfFromTemplate(
  guardianShipFormTemplate,
  buildWholePdfFixture(),
  templateBuffer
)

mkdirSync(path.dirname(outputPath), { recursive: true })
writeFileSync(outputPath, Buffer.from(await pdfBlob.arrayBuffer()))

console.log(outputPath)
