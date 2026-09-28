import { NodeIO } from "@gltf-transform/core"
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions"
import { quantize, reorder, textureCompress } from "@gltf-transform/functions"
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer"
import { mkdirSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import sharp from "sharp"

const SRC = "models-src"
const OUT = join("public", "models")

// POSITION is left unquantized: quantizing it bakes a dequantization transform into
// node matrices (and splits mesh nodes with children), which breaks reading object
// origins by name as required by the asset contract.
const NON_POSITION = /^(NORMAL|TANGENT|TEXCOORD_\d+|COLOR_\d+|JOINTS_\d+|WEIGHTS_\d+)$/

await MeshoptEncoder.ready
await MeshoptDecoder.ready

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder })

const kb = (file) => (statSync(file).size / 1024).toFixed(1)

mkdirSync(OUT, { recursive: true })

for (const name of readdirSync(SRC).filter((f) => f.endsWith(".glb"))) {
  const input = join(SRC, name)
  const output = join(OUT, name)
  const document = await io.read(input)

  await document.transform(
    reorder({ encoder: MeshoptEncoder }),
    quantize({ pattern: NON_POSITION, patternTargets: /^NORMAL$/ }),
    // The palette texture relies on exact colors, so WebP must stay lossless.
    textureCompress({ encoder: sharp, targetFormat: "webp", lossless: true })
  )

  document
    .createExtension(EXTMeshoptCompression)
    .setRequired(true)
    .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE })

  await io.write(output, document)
  console.log(`${name}: ${kb(input)} KB -> ${kb(output)} KB`)
}
