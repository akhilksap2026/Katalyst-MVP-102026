import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const tokens = JSON.parse(readFileSync(fileURLToPath(new URL("../tokens.json", import.meta.url)), "utf8"))
const source = tokens?.$extensions?.["com.ksap.cloud"]
const errors = []
const notes = []

const blueScale = {
  50: "#EFF6FF",
  100: "#DBEAFE",
  200: "#BFDBFE",
  300: "#93C5FD",
  350: "#6DAEEC",
  400: "#4C9AE8",
  500: "#1258B5",
  600: "#06459A",
  700: "#053B83",
  800: "#082F67",
  900: "#10284A",
  950: "#0A172B",
}
const steps = Object.keys(blueScale).map(Number)
const paletteHues = { blue: 258, red: 12, green: 162, yellow: 90 }
const blueRoleAnchors = {
  strong: { light: "#DBEAFE", dark: "#152A49" },
  chartMuted: { light: "#BFDBFE", dark: "#10284A" },
}
const surfaces = {
  light: ["#FFFFFF", tokens.color.light.card.$value, tokens.color.light.secondary.$value],
  dark: ["#0A172B", tokens.color.dark.card.$value, tokens.color.dark.secondary.$value],
}
const railText = (palette, mode) => palette === "yellow" && mode === "light" ? "#010D43" : mode === "light" ? "#FFFFFF" : "#FFFFFF"
const knownPaletteSafeguards = {
  "red:light:danger:fill": { a: "#A32444", b: "#B3261E", reason: "EX-07 / §3.9: red primary actions use outlined destructive controls." },
  "red:dark:danger:fill": { a: "#DD6E7F", b: "#F1706A", reason: "EX-07 / §3.9: red primary actions use outlined destructive controls." },
  "green:light:success:fill": { a: "#016E4A", b: "#12703F", reason: "EX-07 / §3.9: success status always has a dot and word; selected rows have an ink bar." },
  "green:dark:success:fill": { a: "#48AC80", b: "#4CC38A", reason: "EX-07 / §3.9: success status always has a dot and word; selected rows have an ink bar." },
  "yellow:dark:warning:fill": { a: "#D6BF7F", b: "#E5A13D", reason: "EX-07 / §3.9: at-risk status always has a dot and word; UAT strip retains icon and label." },
  "blue:light:info:ink": { a: "#1258B5", b: "#1258B5", reason: "Intentional fixed-blue identity: action fill/ink and Info are the same source anchor." },
  "blue:dark:info:ink": { a: "#6DAEEC", b: "#4C9AE8", reason: "Intentional fixed-blue identity: dark action fill and Info share the source anchor." },
  "blue:light:info:fill": { a: "#1258B5", b: "#1258B5", reason: "Intentional fixed-blue identity: action fill/ink and Info are the same source anchor." },
  "blue:dark:info:fill": { a: "#4C9AE8", b: "#4C9AE8", reason: "Intentional fixed-blue identity: dark action fill and Info share the source anchor." },
}
const knownGroupTintSafeguards = {
  "a:light:dangerSubtle": { a: "#FEDEE9", b: "#FBEAE9", reason: "§3.10: status badges inside a group cell receive a 1 px outline in their own status colour." },
  "b:light:successSubtle": { a: "#C3F5DE", b: "#E7F5EC", reason: "§3.10: status badges inside a group cell receive a 1 px outline in their own status colour." },
  "c:light:warningSubtle": { a: "#F2E9BB", b: "#FCF1DC", reason: "§3.10: status badges inside a group cell receive a 1 px outline in their own status colour." },
  "a:light:red:selected": { a: "#FEDEE9", b: "#FFF2F3", reason: "§3.10: group cells retain their tint; row selection is shown in other cells and with the start-edge ink bar." },
  "a:dark:red:selected": { a: "#371B26", b: "#282337", reason: "§3.10: group cells retain their tint; row selection is shown in other cells and with the start-edge ink bar." },
  "b:dark:green:selected": { a: "#082C1F", b: "#132C37", reason: "§3.10: group cells retain their tint; row selection is shown in other cells and with the start-edge ink bar." },
}

function report(condition, message) {
  if (!condition) errors.push(message)
}

function exactExemption(table, key, a, b) {
  const entry = table[key]
  if (!entry) return undefined
  return entry.a.toLowerCase() === a.toLowerCase() && entry.b.toLowerCase() === b.toLowerCase()
    ? entry.reason
    : undefined
}

function rgb(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex ?? "")) throw new Error(`Expected a six-digit hex colour, received ${hex}`)
  return hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255)
}

function linearChannel(value) {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function luminance(hex) {
  const [r, g, b] = rgb(hex).map(linearChannel)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

function oklch(hex) {
  const [r, g, b] = rgb(hex).map(linearChannel)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const blue = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return [L, Math.hypot(a, blue), Math.atan2(blue, a) * 180 / Math.PI]
}

// The design's ΔE checks use Euclidean OKLab distance, scaled to a 0–100 range.
function deltaE(a, b) {
  const [L1, A1, h1] = oklch(a)
  const [L2, A2, h2] = oklch(b)
  const angle1 = h1 * Math.PI / 180
  const angle2 = h2 * Math.PI / 180
  return 100 * Math.hypot(
    L1 - L2,
    A1 * Math.cos(angle1) - A2 * Math.cos(angle2),
    A1 * Math.sin(angle1) - A2 * Math.sin(angle2),
  )
}

function gamutHex(L, C, hue) {
  const toLinear = (chroma) => {
    const a = chroma * Math.cos(hue * Math.PI / 180)
    const b = chroma * Math.sin(hue * Math.PI / 180)
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ]
  }
  let low = 0
  let high = C
  for (let i = 0; i < 24; i += 1) {
    const middle = (low + high) / 2
    if (toLinear(middle).every((channel) => channel >= 0 && channel <= 1)) low = middle
    else high = middle
  }
  return `#${toLinear(low).map((value) => {
    const encoded = value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055
    return Math.round(255 * encoded).toString(16).padStart(2, "0")
  }).join("")}`
}

function deriveShade(anchor, baseStep, step, hue) {
  const anchorValue = oklch(anchor)
  const base = oklch(blueScale[baseStep])
  const target = oklch(blueScale[step])
  return gamutHex(
    Math.min(0.99, Math.max(0.05, target[0] + anchorValue[0] - base[0])),
    anchorValue[1] * target[1] / base[1],
    hue,
  )
}

function mix(first, second, ratio) {
  return `#${rgb(first).map((channel, index) => Math.round(
    255 * (channel * ratio + rgb(second)[index] * (1 - ratio)),
  ).toString(16).padStart(2, "0")).join("")}`
}

function paletteRoles(name, mode) {
  const anchor = source.palettes[name][mode]
  const dark = mode === "dark"
  const canvas = dark ? "#0A172B" : "#FFFFFF"
  const baseStep = dark ? 400 : 500
  const derivedScale = Object.fromEntries(steps.map((step) => [
    step,
    step === baseStep ? anchor.fill : deriveShade(anchor.fill, baseStep, step, paletteHues[name]),
  ]))
  const interactions = {
    hover: anchor.hover ?? deriveShade(anchor.fill, dark ? 400 : 500, dark ? 350 : 600, paletteHues[name]),
    pressed: anchor.pressed ?? deriveShade(anchor.fill, dark ? 400 : 500, dark ? 300 : 700, paletteHues[name]),
    selected: anchor.selected ?? (dark
      ? mix(anchor.fill, canvas, 0.14)
      : deriveShade(anchor.fill, 500, 50, paletteHues[name])),
    selectedFg: anchor.selectedFg ?? anchor.ink,
  }
  const strong = name === "blue"
    ? blueRoleAnchors.strong[mode]
    : deriveShade(anchor.fill, baseStep, dark ? 800 : 100, paletteHues[name])
  const chartMuted = name === "blue"
    ? blueRoleAnchors.chartMuted[mode]
    : deriveShade(anchor.fill, baseStep, dark ? 900 : 200, paletteHues[name])
  return {
    ...anchor,
    ...interactions,
    strong,
    chartMuted,
    railText: railText(name, mode),
    derivedScale,
    derivedStops: Object.fromEntries(
      Object.entries(interactions)
        .filter(([key]) => key !== "selectedFg" && !Object.hasOwn(anchor, key))
        .concat(name === "blue" ? [] : [["strong", strong], ["chartMuted", chartMuted]]),
    ),
  }
}

report(Boolean(source), "tokens.json is missing $extensions.com.ksap.cloud.")
if (source) {
  const paletteNames = Object.keys(source.palettes ?? {})
  report(JSON.stringify([...paletteNames].sort()) === JSON.stringify(["blue", "green", "red", "yellow"]), "Source palettes must be Blue, Red, Green, and Yellow.")
  for (const name of paletteNames) {
    report(paletteHues[name] !== undefined, `Missing documented hue for palette ${name}.`)
    for (const mode of ["light", "dark"]) {
      const roles = source.palettes[name][mode]
      for (const role of ["fill", "ink", "rail", "onFill"]) {
        report(typeof roles?.[role] === "string", `${name}/${mode} is missing required source anchor "${role}".`)
      }
      if (!roles) continue
      for (const [role, value] of Object.entries(roles)) {
        try {
          rgb(value)
        } catch (error) {
          errors.push(`${name}/${mode} source anchor ${role}: ${error.message}`)
        }
      }
    }
  }

  for (const name of paletteNames) {
    for (const mode of ["light", "dark"]) {
      const p = paletteRoles(name, mode)
      const label = `${name}/${mode}`
      for (const [role, value] of Object.entries(p.derivedStops)) {
        notes.push(`${label}: ${role} derived from the fill anchor → ${value}; source anchors remain unchanged.`)
      }
      if (name === "blue") {
        notes.push(`${label}: strong explicit Blue role anchor ${p.strong}; chart-muted explicit Blue role anchor ${p.chartMuted}.`)
      }
      for (const [role, value] of [["strong", p.strong], ["chart-muted", p.chartMuted]]) {
        try {
          rgb(value)
        } catch (error) {
          errors.push(`${label} ${role} role: ${error.message}`)
        }
      }
      const strongTextRatio = contrast(tokens.color[mode].foreground.$value, p.strong)
      report(strongTextRatio >= 4.5, `${label}: body text misses 4.5:1 on strong fill (${strongTextRatio.toFixed(2)}:1).`)
      for (const [role, fill] of [["fill", p.fill], ["hover", p.hover], ["pressed", p.pressed]]) {
        report(contrast(p.onFill, fill) >= 4.5, `${label}: on-fill text misses 4.5:1 on ${role} (${contrast(p.onFill, fill).toFixed(2)}:1).`)
      }
      for (const [index, surface] of surfaces[mode].entries()) {
        const ratio = contrast(p.ink, surface)
        report(ratio >= 4.5, `${label}: action ink misses 4.5:1 on surface ${index + 1} (${ratio.toFixed(2)}:1).`)
        report(ratio >= 3, `${label}: focus/indicator ink misses 3:1 on surface ${index + 1} (${ratio.toFixed(2)}:1).`)
      }
      const selectedRatio = contrast(p.selectedFg, p.selected)
      report(selectedRatio >= 4.5, `${label}: selected text misses 4.5:1 (${selectedRatio.toFixed(2)}:1).`)
      const railRatio = contrast(p.railText, p.rail)
      report(railRatio >= 4.5, `${label}: sidebar labels miss 4.5:1 (${railRatio.toFixed(2)}:1).`)
      report(railRatio >= 3, `${label}: sidebar indicator misses 3:1 (${railRatio.toFixed(2)}:1).`)

      const status = source.status[mode]
      for (const [statusName, statusHex] of Object.entries(status)) {
        if (statusName.endsWith("Subtle")) continue
        const distance = deltaE(p.ink, statusHex)
        if (distance < 10) {
          const exemption = exactExemption(knownPaletteSafeguards, `${name}:${mode}:${statusName}:ink`, p.ink, statusHex)
          if (exemption) notes.push(`DOCUMENTED IDENTITY/EXEMPTION: ${label} ink vs ${statusName}, ΔE ${distance.toFixed(1)}. ${exemption}`)
          else errors.push(`${label}: action ink is only ΔE ${distance.toFixed(1)} from ${statusName}; §3.9 requires ΔE 10.`)
        }
      }
      for (const [statusName, statusHex] of Object.entries(status).filter(([key]) => !key.endsWith("Subtle"))) {
        const distance = deltaE(p.fill, statusHex)
        if (distance < 10) {
          const exemption = exactExemption(knownPaletteSafeguards, `${name}:${mode}:${statusName}:fill`, p.fill, statusHex)
          if (exemption) notes.push(`DECLARED FILL SAFEGUARD: ${label} fill vs ${statusName}, ΔE ${distance.toFixed(1)}. ${exemption}`)
          else errors.push(`${label}: fill is only ΔE ${distance.toFixed(1)} from ${statusName} without a declared safeguard.`)
        }
      }
    }
  }

  const groupNames = Object.keys(source.groups ?? {})
  report(JSON.stringify([...groupNames].sort()) === JSON.stringify(["a", "b", "c"]), "Column group source must contain groups A, B, and C.")
  const statusText = (mode) => Object.entries(source.status[mode])
    .filter(([key]) => !key.endsWith("Subtle"))
  for (const mode of ["light", "dark"]) {
    const background = mode === "light" ? "#FFFFFF" : "#0A172B"
    const surface = tokens.color[mode].secondary.$value
    const body = tokens.color[mode].foreground.$value
    const secondary = mode === "light" ? "#43576C" : "#A7ABB3"
    const status = statusText(mode)
    for (const groupName of groupNames) {
      const group = source.groups[groupName][mode]
      report(contrast(group.ink, group.fill) >= 4.5, `Group ${groupName.toUpperCase()}/${mode}: group text misses 4.5:1 on fill (${contrast(group.ink, group.fill).toFixed(2)}:1).`)
      report(contrast(group.ink, group.header) >= 4.5, `Group ${groupName.toUpperCase()}/${mode}: group text misses 4.5:1 on header (${contrast(group.ink, group.header).toFixed(2)}:1).`)
      report(contrast(body, group.fill) >= 4.5, `Group ${groupName.toUpperCase()}/${mode}: body text misses 4.5:1 on fill (${contrast(body, group.fill).toFixed(2)}:1).`)
      report(contrast(secondary, group.fill) >= 4.5, `Group ${groupName.toUpperCase()}/${mode}: secondary text misses 4.5:1 on fill (${contrast(secondary, group.fill).toFixed(2)}:1).`)
      report(contrast(secondary, group.header) >= 4.5, `Group ${groupName.toUpperCase()}/${mode}: secondary text misses 4.5:1 on header (${contrast(secondary, group.header).toFixed(2)}:1).`)
      const edgeRatio = contrast(group.edge, background)
      report(edgeRatio >= 3, `Group ${groupName.toUpperCase()}/${mode}: edge misses 3:1 on canvas (${edgeRatio.toFixed(2)}:1).`)
      for (const [statusName, statusHex] of status) {
        const ratio = contrast(statusHex, group.fill)
        report(ratio >= 4.5, `Group ${groupName.toUpperCase()}/${mode}: ${statusName} text misses 4.5:1 on fill (${ratio.toFixed(2)}:1).`)
      }
      for (const paletteName of paletteNames) {
        const ink = paletteRoles(paletteName, mode).ink
        const ratio = contrast(ink, group.fill)
        report(ratio >= 4.5, `Group ${groupName.toUpperCase()}/${mode}: ${paletteName} link ink misses 4.5:1 on fill (${ratio.toFixed(2)}:1).`)
      }
      const canvasDistance = deltaE(group.fill, background)
      const surfaceDistance = deltaE(group.fill, surface)
      report(canvasDistance >= 4, `Group ${groupName.toUpperCase()}/${mode}: fill is only ΔE ${canvasDistance.toFixed(1)} from canvas (minimum 4).`)
      report(surfaceDistance >= 4, `Group ${groupName.toUpperCase()}/${mode}: fill is only ΔE ${surfaceDistance.toFixed(1)} from surface (minimum 4).`)
      const headerDistance = deltaE(group.header, group.fill)
      report(headerDistance >= 3, `Group ${groupName.toUpperCase()}/${mode}: header is only ΔE ${headerDistance.toFixed(1)} from fill (minimum 3).`)

      for (const [statusName, tint] of Object.entries(source.status[mode]).filter(([key]) => key.endsWith("Subtle"))) {
        const distance = deltaE(group.fill, tint)
        if (distance < 5) {
          const exemption = exactExemption(knownGroupTintSafeguards, `${groupName}:${mode}:${statusName}`, group.fill, tint)
          if (exemption) notes.push(`DOCUMENTED GROUP SAFEGUARD: group ${groupName.toUpperCase()}/${mode} fill vs ${statusName}, ΔE ${distance.toFixed(1)}. ${exemption}`)
          else errors.push(`Group ${groupName.toUpperCase()}/${mode}: fill is only ΔE ${distance.toFixed(1)} from status tint ${statusName} (${tint}; minimum 5).`)
        }
      }
      for (const [paletteName, tint] of Object.entries(Object.fromEntries(
        Object.keys(source.palettes).map((name) => [name, paletteRoles(name, mode).selected]),
      ))) {
        const distance = deltaE(group.fill, tint)
        if (distance < 5) {
          const exemption = exactExemption(knownGroupTintSafeguards, `${groupName}:${mode}:${paletteName}:selected`, group.fill, tint)
          if (exemption) notes.push(`DOCUMENTED GROUP SAFEGUARD: group ${groupName.toUpperCase()}/${mode} fill vs ${paletteName} selected tint, ΔE ${distance.toFixed(1)}. ${exemption}`)
          else errors.push(`Group ${groupName.toUpperCase()}/${mode}: fill is only ΔE ${distance.toFixed(1)} from ${paletteName} selection tint ${tint} (minimum 5).`)
        }
      }
    }

    for (let left = 0; left < groupNames.length; left += 1) {
      for (let right = left + 1; right < groupNames.length; right += 1) {
        const a = source.groups[groupNames[left]][mode].fill
        const b = source.groups[groupNames[right]][mode].fill
        const distance = deltaE(a, b)
        report(distance >= 5, `Group fills ${groupNames[left].toUpperCase()} and ${groupNames[right].toUpperCase()}/${mode} are only ΔE ${distance.toFixed(1)} apart (minimum 5).`)
      }
    }
  }
}

if (notes.length) {
  console.log("Palette source notes:")
  for (const note of notes) console.log(`- ${note}`)
}
if (errors.length) {
  console.error(`Palette governance gate failed (${errors.length} source issue${errors.length === 1 ? "" : "s"}):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  console.log("Palette governance gate: source anchors and derived interactions satisfy the encoded palette and column-group checks.")
}