import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const require = createRequire(import.meta.url)
let ts
try {
  ts = require("typescript")
} catch {
  // Keep this gate dependency-free. The fallback scanner covers TSX/JSX literals
  // and class strings; when TypeScript is already available, use its AST below.
}

const args = process.argv.slice(2)
if (args.includes("--help") || args.includes("-h")) {
  console.log("Usage: node scripts/check-styles.mjs [--app <path> | --path <path> | <path>]")
  console.log("Defaults to src/. The path is relative to the project root unless absolute.")
  process.exit(0)
}

let requestedPath
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--app" || args[index] === "--path") {
    requestedPath = args[index + 1]
    if (!requestedPath) {
      console.error(`${args[index]} requires a path.`)
      process.exit(2)
    }
    index += 1
  } else if (!args[index].startsWith("-") && !requestedPath) {
    requestedPath = args[index]
  } else {
    console.error(`Unknown argument: ${args[index]}`)
    process.exit(2)
  }
}

const scanRoot = path.resolve(projectRoot, requestedPath ?? "src")
try {
  if (!statSync(scanRoot).isDirectory() && !statSync(scanRoot).isFile()) throw new Error("not a file or directory")
} catch {
  console.error(`Style gate path does not exist: ${scanRoot}`)
  process.exit(2)
}
const scanRootIsDirectory = statSync(scanRoot).isDirectory()

const allowedExtensions = new Set([".tsx", ".ts", ".jsx", ".js", ".mjs", ".vue", ".svelte"])
const stylesheetExtensions = new Set([".css", ".scss", ".sass", ".less"])
const failures = []
const seen = new Set()
const isFile = (file) => statSync(file).isFile()

function collectFiles(target) {
  if (isFile(target)) return [target]
  return readdirSync(target, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(target, entry.name)
      if (entry.isDirectory()) {
        if (["node_modules", "dist", "build", ".git"].includes(entry.name)) return []
        return collectFiles(fullPath)
      }
      return allowedExtensions.has(path.extname(entry.name)) || stylesheetExtensions.has(path.extname(entry.name))
        ? [fullPath]
        : []
    })
}

function isUiLibraryFile(file) {
  return path.relative(projectRoot, file).split(path.sep).join("/").startsWith("src/components/ui/")
}

function projectPath(file) {
  return path.relative(projectRoot, file).split(path.sep).join("/")
}

function isChartModule(file) {
  return projectPath(file) === "src/components/ui/chart.tsx"
}

function isSortableItemModule(file) {
  return projectPath(file) === "src/components/ui/sortable-item.tsx"
}

function isProgressModule(file) {
  return projectPath(file) === "src/components/ui/progress.tsx"
}

function isSharedThemeSource(file) {
  return projectPath(file) === "src/index.css"
}

function isScanRootIndexStylesheet(file) {
  return path.basename(file) === "index.css" && (
    scanRootIsDirectory
      ? path.relative(scanRoot, file) === "index.css"
      : path.resolve(scanRoot) === path.resolve(file)
  )
}

function isOnlySharedThemeImport(source) {
  const content = source.replace(/\/\*[\s\S]*?\*\//g, "").trim()
  return /^@import\s+(["'])@workspace\/ksap-cloud-ui\/styles\.css\1\s*;$/.test(content)
}

function isDocumentationFile(file) {
  const relative = path.relative(projectRoot, file).split(path.sep).join("/")
  return relative.startsWith("docs/") || relative.includes("/docs/") || relative.endsWith(".mdx")
}

function report(file, source, offset, rule, detail) {
  const projectPath = path.relative(projectRoot, file).split(path.sep).join("/")
  if (rule === "hard-coded-copy" && projectPath.startsWith("src/preview/")) return
  const line = source.slice(0, offset).split("\n").length
  const lines = source.split("\n")
  const allowMarker = /\/\/\s*ksap-allow:\s*(\S.*)$/
  const marker = allowMarker.exec(lines[line - 1] ?? "") ?? allowMarker.exec(lines[line - 2] ?? "")
  if (marker && isDocumentationFile(file)) return
  const key = `${file}:${line}:${rule}:${detail}`
  if (seen.has(key)) return
  seen.add(key)
  failures.push(`${path.relative(projectRoot, file)}:${line} [${rule}] ${detail}`)
}

function stringSpans(source) {
  const spans = []
  const pattern = /(["'`])(?:\\.|(?!\1)[\s\S])*?\1/g
  for (const match of source.matchAll(pattern)) {
    spans.push({ text: match[0].slice(1, -1), offset: match.index })
  }
  return spans
}

function bracketSpans(text) {
  const spans = []
  let start = -1
  let depth = 0
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "[") {
      if (depth === 0) start = index
      depth += 1
    } else if (text[index] === "]" && depth > 0) {
      depth -= 1
      if (depth === 0) {
        spans.push({
          start,
          end: index,
          value: text.slice(start + 1, index),
        })
      }
    }
  }
  return spans
}

function allowedClassBracket(text, span) {
  const { start, end, value } = span
  if (/^var\(\s*--[A-Za-z0-9_-]+\s*\)$/.test(value) || /^--[A-Za-z0-9_-]+$/.test(value)) return true

  const before = text.slice(0, start)
  const after = text.slice(end + 1)
  const hasVariantSuffix = /^(?:\/[\w-]+)?:/.test(after)
  if (!hasVariantSuffix) return false

  const hasVariantBoundary = before.length === 0 || /[\s:]$/.test(before)
  const isSelector = /^(?:&|[>+~.#:[*])/.test(value) &&
    /^[&>+~.#:[\]A-Za-z0-9_\s=^$*"'(),|/-]+$/.test(value)
  if (hasVariantBoundary && isSelector) return true

  const isAttributeSelector = /^[A-Za-z_][\w-]*(?:\s*(?:=|~=|\|=|\^=|\$=|\*=)\s*(?:[\w-]+|"[^"]*"|'[^']*'))?$/.test(value)
  const isDataVariantAttribute = /(?:^|[\s:])(?:(?:group|peer)-)?(?:has-)?(?:data|aria)-$/.test(before) &&
    isAttributeSelector
  const isSelectorFunctionVariant = /(?:^|[\s:])(?:(?:group|peer)-)?(?:has|not)-$/.test(before)
  return isDataVariantAttribute || isSelectorFunctionVariant && isSelector
}

const checks = [
  {
    rule: "arbitrary-property",
    classOnly: true,
    pattern: /\[--[A-Za-z0-9_-]+\s*:[^\]]+\]/,
    message: (match) => `arbitrary CSS property "${match[0]}" is not allowed`,
  },
  {
    rule: "arbitrary-value",
    classOnly: true,
    message: (value) => `arbitrary value "${value}" is not allowed; use a named utility or token reference`,
  },
  {
    rule: "deleted-utility",
    classOnly: true,
    pattern: /(?:^|[\s"'`!:])(?:text-(?:xs|sm|base|lg|xl|[2-9]xl)|font-(?:thin|light|medium|bold|extrabold|black|[1-9]00)|rounded-(?:none|xs|xl|2xl|3xl|[0-9]+)|shadow-(?:none|sm|md|lg|xl|2xl|inner)|(?:bg|text|border|ring|outline|decoration|fill|stroke|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{1,3}|(?:bg|text|border|ring|fill|stroke)-(?:black|white))(?:\/\d+)?(?=$|[\s"'`])/,
    message: (match) => `deleted Tailwind utility "${match[0].trim()}"`,
  },
  {
    rule: "formatting-tell",
    pattern: /\b[\p{L}\p{N}]+\s+—\s+[\p{L}\p{N}]+|[\p{L}\p{N}]\s+·\s+[\p{L}\p{N}]|→\s*$/u,
    message: (match) => `avoid generated-copy formatting tell "${match[0]}"`,
  },
]

function checkString(file, source, span, isClassString = false) {
  const localText = span.text
  for (const check of checks) {
    if (check.classOnly && !isClassString) continue
    if (check.rule === "arbitrary-value") {
      for (const bracket of bracketSpans(localText)) {
        if (!allowedClassBracket(localText, bracket)) {
          report(file, source, span.offset + bracket.start, check.rule, check.message(bracket.value))
        }
      }
      continue
    }
    for (const match of localText.matchAll(new RegExp(check.pattern.source, check.pattern.flags.includes("g") ? check.pattern.flags : `${check.pattern.flags}g`))) {
      report(file, source, span.offset + match.index, check.rule, check.message(match))
    }
  }
}

function staticString(node) {
  if (!ts || !node) return undefined
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (ts.isJsxExpression(node) && node.expression && (ts.isStringLiteral(node.expression) || ts.isNoSubstitutionTemplateLiteral(node.expression))) {
    return node.expression.text
  }
  return undefined
}

function checkClassNode(file, source, node, ast) {
  if (!node) return
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    checkString(file, source, { text: node.text, offset: node.getStart(ast) + 1 }, true)
    return
  }
  if (ts.isTemplateExpression(node)) {
    const literals = [node.head, ...node.templateSpans.map((span) => span.literal)]
    for (const literal of literals) {
      if (!literal.text) continue
      const searchFrom = literal.getStart(ast)
      const foundAt = source.indexOf(literal.text, searchFrom)
      checkString(file, source, { text: literal.text, offset: foundAt >= 0 ? foundAt : searchFrom }, true)
    }
    return
  }
  if (ts.isJsxExpression(node)) {
    checkClassNode(file, source, node.expression, ast)
    return
  }
  ts.forEachChild(node, (child) => checkClassNode(file, source, child, ast))
}

function checkFallbackClassExpression(file, source, text, offset) {
  for (const span of stringSpans(text)) {
    const classText = span.text.replace(/\$\{[^{}]*\}/g, "")
    checkString(file, source, { text: classText, offset: offset + span.offset + 1 }, true)
  }
}

function classUtilityName(expression) {
  if (ts.isIdentifier(expression)) return expression.text
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text
  return ""
}

function checkIconClasses(file, source, text, offset, isIconTag) {
  const svgSelectors = /\[[^\]]*&[^\]]*svg[^\]]*\]:size-(?:\d+|px)\b/g
  const selectors = [...text.matchAll(svgSelectors)]
  for (const match of selectors) {
    report(file, source, offset + match.index, "icon-size", `numeric size on an svg selector "${match[0]}"; use size-icon-*`)
  }
  if (!isIconTag) return
  const directSize = /\bsize-(?:\d+|px)\b/g
  for (const match of text.matchAll(directSize)) {
    if (selectors.some((selector) => match.index >= selector.index && match.index < selector.index + selector[0].length)) continue
    report(file, source, offset + match.index, "icon-size", `numeric icon size "${match[0]}"; use size-icon-*`)
  }
}

function runtimeGeometryStyle(initializer) {
  if (!ts || !initializer || !ts.isJsxExpression(initializer) || !initializer.expression) return false
  const expression = initializer.expression
  if (!ts.isObjectLiteralExpression(expression) || !expression.properties.length) return false
  const geometry = new Set(["transform", "transition", "width", "height", "top", "right", "bottom", "left", "insetInlineStart", "insetInlineEnd"])
  return expression.properties.every((property) => {
    if (ts.isShorthandPropertyAssignment(property)) return geometry.has(property.name.text)
    if (!ts.isPropertyAssignment(property)) return false
    const key = property.name.getText().replace(/^["']|["']$/g, "")
    const value = property.initializer
    const isLiteral = ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value) ||
      ts.isNumericLiteral(value) || value.kind === ts.SyntaxKind.TrueKeyword ||
      value.kind === ts.SyntaxKind.FalseKeyword || value.kind === ts.SyntaxKind.NullKeyword
    return geometry.has(key) && !isLiteral
  })
}

function approvedChartStyle(initializer) {
  if (!ts || !initializer || !ts.isJsxExpression(initializer) || !initializer.expression) return false
  let expression = initializer.expression
  while (ts.isAsExpression(expression) || ts.isParenthesizedExpression(expression)) expression = expression.expression
  if (!ts.isObjectLiteralExpression(expression)) return false
  const properties = expression.properties
  if (!properties.every((property) => ts.isPropertyAssignment(property))) return false
  const entries = properties.map((property) => [
    property.name.getText().replace(/^["']|["']$/g, ""),
    property.initializer,
  ])
  if (entries.length === 2 && entries.every(([key, value]) =>
    (key === "--color-bg" || key === "--color-border") &&
    ts.isIdentifier(value) && value.text === "indicatorColor")) {
    return new Set(entries.map(([key]) => key)).size === 2
  }
  return entries.length === 1 &&
    entries[0][0] === "backgroundColor" &&
    ts.isPropertyAccessExpression(entries[0][1]) &&
    entries[0][1].expression.getText() === "item" &&
    entries[0][1].name.text === "color"
}

function approvedProgressStyle(file, initializer) {
  if (!isProgressModule(file) || !initializer || !ts.isJsxExpression(initializer)) return false
  const expression = initializer.expression
  if (!expression || !ts.isConditionalExpression(expression)) return false

  const condition = expression.condition
  const isValueNullCheck = ts.isBinaryExpression(condition) &&
    condition.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken &&
    ts.isIdentifier(condition.left) && condition.left.text === "value" &&
    condition.right.kind === ts.SyntaxKind.NullKeyword
  const isUndefined = ts.isIdentifier(expression.whenTrue) && expression.whenTrue.text === "undefined"
  const style = expression.whenFalse
  if (!isValueNullCheck || !isUndefined || !ts.isObjectLiteralExpression(style) || style.properties.length !== 1) return false

  const transform = style.properties[0]
  if (!ts.isPropertyAssignment(transform) || transform.name.getText() !== "transform" ||
    !ts.isTemplateExpression(transform.initializer)) return false
  const template = transform.initializer
  if (template.head.text !== "translateX(-" || template.templateSpans.length !== 1 ||
    template.templateSpans[0].literal.text !== "%)") return false

  const offset = template.templateSpans[0].expression
  return ts.isBinaryExpression(offset) &&
    offset.operatorToken.kind === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(offset.left) && offset.left.text === "100" &&
    ts.isIdentifier(offset.right) && offset.right.text === "value"
}

function isChartStyleBlock(node, ast) {
  if (!isChartModule(node.getSourceFile().fileName)) return false
  const usesGeneratedCss = node.attributes.properties.some((attribute) =>
    ts.isJsxAttribute(attribute) && attribute.name.getText(ast) === "dangerouslySetInnerHTML")
  if (!usesGeneratedCss) return false
  let current = node.parent
  while (current) {
    if (ts.isArrowFunction(current) && ts.isVariableDeclaration(current.parent) &&
      current.parent.name.getText(ast) === "ChartStyle") return true
    current = current.parent
  }
  return false
}

function fallbackApprovedStyle(file, source, offset) {
  const context = source.slice(offset, offset + 320)
  if (isSortableItemModule(file)) {
    return /^style\s*=\s*\{\{\s*transform\s*:\s*CSS\.Transform\.toString\(transform\)\s*,\s*transition\s*\}\}/s.test(context)
  }
  if (isProgressModule(file)) {
    return /^style\s*=\s*\{\s*value\s*==\s*null\s*\?\s*undefined\s*:\s*\{\s*transform\s*:\s*`translateX\(-\$\{\s*100\s*-\s*value\s*\}%\)`\s*\}\s*\}/s.test(context)
  }
  if (!isChartModule(file)) return false
  return /^style\s*=\s*\{\s*\{\s*(?:"--color-bg"|'--color-bg')\s*:\s*indicatorColor\s*,\s*(?:"--color-border"|'--color-border')\s*:\s*indicatorColor\s*,\s*\}\s*as\s+React\.CSSProperties\s*\}/s.test(context) ||
    /^style\s*=\s*\{\{\s*backgroundColor\s*:\s*item\.color\s*,?\s*\}\}/s.test(context)
}

function fallbackChartStyleBlock(file, source, offset) {
  if (!isChartModule(file)) return false
  const declaration = source.lastIndexOf("const ChartStyle", offset)
  const end = source.indexOf(">", offset)
  return declaration >= 0 && source.indexOf("<style", declaration) === offset &&
    end >= 0 && /\bdangerouslySetInnerHTML\s*=/.test(source.slice(offset, end))
}

function scanWithTypeScript(file, source) {
  const ext = path.extname(file).toLowerCase()
  const scriptKind = ext === ".tsx" ? ts.ScriptKind.TSX : ext === ".jsx" ? ts.ScriptKind.JSX : ts.ScriptKind.TS
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind)
  const lucideIcons = new Set()
  for (const statement of ast.statements) {
    if (!ts.isImportDeclaration(statement) || statement.moduleSpecifier.text !== "lucide-react") continue
    const bindings = statement.importClause?.namedBindings
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) lucideIcons.add(element.name.text)
    }
  }

  function visit(node) {
    if (ts.isJsxText(node) && /[\p{L}\p{N}]/u.test(node.text)) {
      report(file, source, node.getStart(ast), "hard-coded-copy", `literal JSX text "${node.text.trim().replace(/\s+/g, " ").slice(0, 70)}"`)
      checkString(file, source, { text: node.text, offset: node.getStart(ast) })
    }
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(ast)
      const element = node.parent?.parent
      const tagName = element?.tagName?.getText(ast) ?? ""
      const isIconTag = tagName === "svg" || tagName === "Icon" || tagName.endsWith("Icon") ||
        tagName.startsWith("ICON.") || lucideIcons.has(tagName)
      const literal = staticString(node.initializer)
      if (literal !== undefined && ["aria-label", "placeholder", "title", "alt", "label"].includes(name) && /[\p{L}\p{N}]/u.test(literal)) {
        report(file, source, node.getStart(ast), "hard-coded-copy", `literal ${name}="${literal.slice(0, 70)}"`)
      }
      if ((name === "className" || name === "class") && node.initializer) {
        checkClassNode(file, source, node.initializer, ast)
        if (literal !== undefined) {
          checkIconClasses(file, source, literal, node.initializer.getStart(ast), isIconTag)
        } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          const expression = node.initializer.expression
          checkIconClasses(file, source, expression.getText(ast), expression.getStart(ast), isIconTag)
        }
      }
      if (name === "size" && node.initializer) {
        const value = staticString(node.initializer)
        const expression = ts.isJsxExpression(node.initializer) ? node.initializer.expression : undefined
        if ((value && /^\d+(?:\.\d+)?$/.test(value)) || (expression && ts.isNumericLiteral(expression))) {
          if (isIconTag) {
            report(file, source, node.getStart(ast), "icon-size", `numeric JSX size on <${tagName}>; use a named size-icon-* utility`)
          }
        }
      }
      if (name === "style" && !(
        isUiLibraryFile(file) && runtimeGeometryStyle(node.initializer) ||
        isChartModule(file) && approvedChartStyle(node.initializer) ||
        approvedProgressStyle(file, node.initializer)
      )) {
        report(file, source, node.getStart(ast), "inline-style", "style prop is forbidden outside approved primitive geometry and chart styles")
      }
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      if (node.tagName.getText(ast).toLowerCase() === "style" &&
        !(isChartModule(file) && isChartStyleBlock(node, ast))) {
        report(file, source, node.getStart(ast), "inline-style", "inline <style> blocks are not allowed")
      }
    }
    if (ts.isCallExpression(node)) {
      const expression = node.expression
      const method = ts.isPropertyAccessExpression(expression) ? expression.name.text : ""
      const callee = expression.getText(ast)
      if (["cn", "cva", "clsx", "cx"].includes(classUtilityName(expression))) {
        for (const argument of node.arguments) checkClassNode(file, source, argument, ast)
      }
      if ((callee === "toast" || callee.startsWith("toast.") || callee === "sonnerToast") && node.arguments.length) {
        const literal = staticString(node.arguments[0])
        if (literal && /[\p{L}\p{N}]/u.test(literal)) {
          report(file, source, node.arguments[0].getStart(ast), "hard-coded-copy", `literal toast copy "${literal.slice(0, 70)}"`)
        }
      }
      if (method === "toast" && node.arguments.length) {
        const literal = staticString(node.arguments[0])
        if (literal && /[\p{L}\p{N}]/u.test(literal)) {
          report(file, source, node.arguments[0].getStart(ast), "hard-coded-copy", `literal toast copy "${literal.slice(0, 70)}"`)
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
}

const files = collectFiles(scanRoot)
for (const file of files) {
  const source = readFileSync(file, "utf8")
  if (/\.module\.(css|scss|sass|less)$/.test(file)) {
    report(file, source, 0, "stylesheet", "CSS modules are not allowed; use the shared KSAP theme")
    continue
  }
  if (stylesheetExtensions.has(path.extname(file))) {
    if (isSharedThemeSource(file)) continue
    if (isScanRootIndexStylesheet(file) && isOnlySharedThemeImport(source)) continue
    report(file, source, 0, "stylesheet", "only the shared theme source or an index.css containing only its shared-theme import is allowed")
    continue
  }
  if (!ts || !/\.(?:tsx|ts|jsx|js)$/.test(file)) {
    for (const match of source.matchAll(/\bstyle\s*=/g)) {
      if (!fallbackApprovedStyle(file, source, match.index)) {
        report(file, source, match.index, "inline-style", "style prop is forbidden outside approved primitive geometry and chart styles")
      }
    }
  }
  for (const match of source.matchAll(/<style(?:\s|>)/gi)) {
    if (!fallbackChartStyleBlock(file, source, match.index)) {
      report(file, source, match.index, "inline-style", "inline <style> blocks are not allowed")
    }
  }
  if (/\bstyled-components\b|styled\.(?:div|span|button|section|main|header|footer)\s*`|styled\s*\(/.test(source)) {
    const match = /\bstyled-components\b|styled\.(?:div|span|button|section|main|header|footer)\s*`|styled\s*\(/.exec(source)
    report(file, source, match.index, "inline-style", "styled-components and ad hoc styled elements are not allowed")
  }
  for (const span of stringSpans(source)) checkString(file, source, span)

  if (ts && /\.(?:tsx|ts|jsx|js)$/.test(file)) {
    scanWithTypeScript(file, source)
  } else if (/\.(?:tsx|jsx)$/.test(file)) {
    // Dependency-free TSX fallback. It deliberately favors catching plain visible
    // copy over parsing JavaScript expressions.
    const jsxText = />([^<>{}]+)</g
    for (const match of source.matchAll(jsxText)) {
      if (/[\p{L}\p{N}]/u.test(match[1])) {
        report(file, source, match.index + 1, "hard-coded-copy", `literal JSX text "${match[1].trim().replace(/\s+/g, " ").slice(0, 70)}"`)
      }
    }
    const attrs = /\b(aria-label|placeholder|title|alt|label)\s*=\s*(["'])(.*?)\2/g
    for (const match of source.matchAll(attrs)) {
      if (/[\p{L}\p{N}]/u.test(match[3])) report(file, source, match.index, "hard-coded-copy", `literal ${match[1]}="${match[3].slice(0, 70)}"`)
    }
    const toastCalls = /\b(?:toast(?:\.(?:success|error|warning|info|message))?|sonnerToast)\s*\(\s*(["'`])([^"'`]+)\1/g
    for (const match of source.matchAll(toastCalls)) {
      report(file, source, match.index, "hard-coded-copy", `literal toast copy "${match[2].slice(0, 70)}"`)
    }
    const imports = [...source.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/g)]
      .flatMap((match) => match[1].split(","))
      .map((name) => name.trim().split(/\s+as\s+/).at(-1))
    const lucideIcons = new Set(imports)
    const elements = /<([A-Za-z][\w.]*)\b([^>]*)>/g
    for (const element of source.matchAll(elements)) {
      const tagName = element[1]
      const isIconTag = tagName === "svg" || tagName === "Icon" || tagName.endsWith("Icon") ||
        tagName.startsWith("ICON.") || lucideIcons.has(tagName)
      const classAttrs = /\b(?:className|class)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g
      for (const attr of element[2].matchAll(classAttrs)) {
        const text = attr[1] ?? attr[2] ?? attr[3] ?? ""
        const captured = attr[1] !== undefined ? attr[1] : attr[2] !== undefined ? attr[2] : attr[3]
        const offset = element.index + 1 + tagName.length + attr.index + attr[0].indexOf(captured)
        if (attr[1] !== undefined || attr[2] !== undefined) {
          checkString(file, source, { text, offset }, true)
        } else {
          checkFallbackClassExpression(file, source, text, offset)
        }
        checkIconClasses(file, source, text, offset, isIconTag)
      }
      if (isIconTag && /\bsize\s*=\s*\{\s*\d+(?:\.\d+)?\s*\}/.test(element[2])) {
        report(file, source, element.index, "icon-size", `numeric JSX size on <${tagName}>; use size-icon-*`)
      }
    }
    const classCalls = /\b(?:cn|cva|clsx|cx)\s*\(([^)]*)\)/g
    for (const call of source.matchAll(classCalls)) {
      checkFallbackClassExpression(file, source, call[1], call.index + call[0].indexOf(call[1]))
    }
  }
}

if (failures.length) {
  console.error(`Style governance gate found ${failures.length} issue${failures.length === 1 ? "" : "s"} in ${files.length} file${files.length === 1 ? "" : "s"}:`)
  for (const failure of failures) console.error(`- ${failure}`)
  if (!ts) console.error("Note: TypeScript is not installed; the gate used its dependency-free TSX/JSX fallback scanner.")
  process.exitCode = 1
} else {
  console.log(`Style governance gate: ${files.length} source file${files.length === 1 ? "" : "s"} scanned; no violations found.`)
}