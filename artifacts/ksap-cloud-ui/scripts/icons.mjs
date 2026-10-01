import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const iconsPath = fileURLToPath(new URL("../src/lib/icons.tsx", import.meta.url))
const source = readFileSync(iconsPath, "utf8")
const failures = []
const expectedLabels = {
  document: "Document",
  invoice: "Invoice",
  billOfLading: "Bill of lading",
  manifest: "Manifest",
  proofOfDelivery: "Proof of delivery",
  customsEntry: "Customs entry",
  rate: "Rate",
  spotQuote: "Spot quote",
  contractRate: "Contract rate",
  payment: "Payment",
  shipment: "Shipment",
  carrier: "Carrier",
  container: "Container",
  lane: "Lane",
  stop: "Stop",
  dockOrFacility: "Dock or facility",
  exception: "Exception",
  import: "Import",
  export: "Export",
  scan: "Scan",
  filter: "Filter",
}
const expectedFamilies = {
  paperwork: ["document", "invoice", "billOfLading", "manifest", "proofOfDelivery", "customsEntry"],
  pricesAndMoney: ["invoice", "rate", "spotQuote", "contractRate", "payment"],
  freightAndPlaces: ["shipment", "carrier", "container", "lane", "stop", "dockOrFacility"],
  work: ["exception", "import", "export", "scan", "filter"],
}

function parseObject(name) {
  const declaration = new RegExp(`export const ${name}\\b[^=]*=\\s*\\{`).exec(source)
  if (!declaration) {
    failures.push(`Missing export: ${name}`)
    return []
  }
  const start = declaration.index
  const bodyStart = source.indexOf("{", start) + 1
  const bodyEnd = source.indexOf("\n}", bodyStart)
  if (bodyEnd < 0) {
    failures.push(`Could not parse ${name}`)
    return []
  }
  return source
    .slice(bodyStart, bodyEnd)
    .split("\n")
    .map((line) => line.trim().replace(/,$/, ""))
    .filter((line) => line && !line.startsWith("//"))
}

const concepts = parseObject("ICON")
const labels = parseObject("ICON_LABELS")
const iconEntries = concepts.map((line) => line.match(/^([A-Za-z]\w*):\s*([A-Za-z]\w*)$/))
const labelEntries = labels.map((line) => line.match(/^([A-Za-z]\w*):\s*"([^"]+)"$/))

if (iconEntries.some((entry) => !entry)) failures.push("ICON contains an unreadable concept mapping")
if (labelEntries.some((entry) => !entry)) failures.push("ICON_LABELS contains an unreadable label")

const conceptNames = iconEntries.filter(Boolean).map((entry) => entry[1])
const lucideNames = iconEntries.filter(Boolean).map((entry) => entry[2])
const labelNames = labelEntries.filter(Boolean).map((entry) => entry[1])
const labelsText = labelEntries.filter(Boolean).map((entry) => entry[2])

for (const [name, values] of [
  ["ICON concept", conceptNames],
  ["Lucide icon", lucideNames],
  ["ICON_LABELS concept", labelNames],
  ["ICON label", labelsText],
]) {
  const duplicateValues = values.filter((value, index) => values.indexOf(value) !== index)
  if (duplicateValues.length) failures.push(`${name} values must be unique: ${[...new Set(duplicateValues)].join(", ")}`)
}

const sortedConcepts = [...conceptNames].sort()
const sortedLabels = [...labelNames].sort()
if (JSON.stringify(sortedConcepts) !== JSON.stringify(sortedLabels)) {
  failures.push("ICON and ICON_LABELS must have exactly the same concept keys")
}
if (JSON.stringify(sortedConcepts) !== JSON.stringify(Object.keys(expectedLabels).sort())) {
  failures.push("ICON must contain the exact concept vocabulary from DESIGN.md §3.11")
}
for (const [concept, label] of Object.entries(expectedLabels)) {
  const actual = labelEntries.find((entry) => entry?.[1] === concept)?.[2]
  if (actual !== label) failures.push(`ICON_LABELS.${concept} must be "${label}"`)
}

const lucideImports = new Set(
  source
    .slice(0, source.indexOf("} from \"lucide-react\""))
    .match(/\b[A-Z][A-Za-z0-9]*\b/g)
    ?.filter((name) => !["Import", "LucideIcon"].includes(name)) ?? [],
)
for (const name of lucideNames) {
  if (!lucideImports.has(name)) failures.push(`ICON.${conceptNames[lucideNames.indexOf(name)]} references unimported ${name}`)
}

const familyStart = source.indexOf("export const ICON_FAMILIES = {")
const familyBodyStart = source.indexOf("{", familyStart) + 1
const familyBodyEnd = source.indexOf("\n}", familyBodyStart)
if (familyStart < 0 || familyBodyEnd < 0) {
  failures.push("Missing or unreadable ICON_FAMILIES")
} else {
  const familyBody = source.slice(familyBodyStart, familyBodyEnd)
  const familyEntries = [...familyBody.matchAll(/^\s*([A-Za-z]\w*):\s*\[([^\]]*)\]/gm)]
  if (!familyEntries.length) failures.push("ICON_FAMILIES must contain at least one family")
  const actualFamilies = new Map()
  for (const [, family, members] of familyEntries) {
    const memberNames = [...members.matchAll(/"([A-Za-z]\w*)"/g)].map((match) => match[1])
    actualFamilies.set(family, memberNames)
    if (!memberNames.length) failures.push(`ICON_FAMILIES.${family} must not be empty`)
    for (const name of memberNames) {
      if (!conceptNames.includes(name)) failures.push(`ICON_FAMILIES.${family} names unknown concept ${name}`)
    }
  }
  if (JSON.stringify([...actualFamilies.keys()].sort()) !== JSON.stringify(Object.keys(expectedFamilies).sort())) {
    failures.push("ICON_FAMILIES must contain the exact families from DESIGN.md §3.11")
  }
  for (const [family, expected] of Object.entries(expectedFamilies)) {
    if (JSON.stringify(actualFamilies.get(family) ?? []) !== JSON.stringify(expected)) {
      failures.push(`ICON_FAMILIES.${family} must name the exact DESIGN.md concepts in its family`)
    }
  }
}

if (failures.length) {
  console.error(`Icon vocabulary gate failed (${failures.length} issue${failures.length === 1 ? "" : "s"}):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exitCode = 1
} else {
  console.log(`Icon vocabulary gate: ${conceptNames.length} unique concepts; all labels and family references are valid.`)
}