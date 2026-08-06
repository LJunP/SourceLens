#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(new URL('..', import.meta.url).pathname)
const outputPath = path.join(rootDir, 'docs/PROJECT_CODE_MAP.md')
const checkMode = process.argv.includes('--check')

const EXCLUDED_DIRS = new Set([
  '.git',
  '.sourcelens-runtime',
  'bin',
  'release-evidence',
  'node_modules',
  'target',
  'target 2',
  'dist',
  'test-results',
  'playwright-report',
])

const EXCLUDED_FILES = new Set([
  'docs/PROJECT_CODE_MAP.md',
])

const TEXT_EXTENSIONS = new Set([
  '.css',
  '.dockerignore',
  '.gitignore',
  '.html',
  '.java',
  '.js',
  '.json',
  '.lock',
  '.md',
  '.mjs',
  '.properties',
  '.rs',
  '.sh',
  '.sql',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.xml',
  '.yml',
  '.yaml',
])

function toRel(absPath) {
  return path.relative(rootDir, absPath).split(path.sep).join('/')
}

function isExcluded(relPath) {
  if (EXCLUDED_FILES.has(relPath)) {
    return true
  }
  return relPath.split('/').some(part => EXCLUDED_DIRS.has(part))
}

function walk(dir) {
  const entries = []
  for (const name of readdirSync(dir).sort()) {
    const abs = path.join(dir, name)
    const rel = toRel(abs)
    if (isExcluded(rel)) {
      continue
    }
    const stat = statSync(abs)
    if (stat.isDirectory()) {
      entries.push(...walk(abs))
    } else if (stat.isFile()) {
      entries.push({ abs, rel, stat })
    }
  }
  return entries
}

function collectDirectories(files) {
  const dirs = new Set()
  for (const file of files) {
    let current = path.dirname(file.rel)
    while (current && current !== '.') {
      dirs.add(current)
      current = path.dirname(current)
    }
  }
  return [...dirs].sort((a, b) => a.localeCompare(b))
}

function readText(file) {
  const ext = path.extname(file.rel)
  const basename = path.basename(file.rel)
  if (!TEXT_EXTENSIONS.has(ext) && !TEXT_EXTENSIONS.has(basename)) {
    return ''
  }
  const raw = readFileSync(file.abs)
  if (raw.includes(0)) {
    return ''
  }
  return raw.toString('utf8')
}

function countLines(text) {
  if (!text) {
    return 0
  }
  return text.split(/\r?\n/).length
}

function escapeMd(value) {
  return String(value ?? '')
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ')
    .trim()
}

function code(value) {
  return `\`${String(value).replaceAll('`', "'")}\``
}

function topGroup(rel) {
  return rel.split('/')[0]
}

function moduleName(rel) {
  const match = rel.match(/backend-spring\/src\/main\/java\/com\/sourcelens\/module\/([^/]+)/)
  return match ? match[1] : ''
}

function moduleDescription(module) {
  return {
    agent: 'Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。',
    analysis: '分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。',
    artifact: '产物记录、预览、下载、审计凭证和保留策略。',
    audit: '审计日志、审计工作台和安全治理留痕。',
    autorepair: 'AutoRepair 候选、补丁、PR 提交流程和修复门禁。',
    ci: 'CI 诊断记录和复分析入口。',
    common: '模块级健康检查和共享后端能力。',
    dashboard: '控制台统计、最近扫描和下一步建议。',
    execution: '执行任务、attempt、step、log 和取消流程。',
    issue: 'Issue 拆解、任务列表和 Markdown 导出。',
    project: '项目 CRUD、聚合查询和项目删除。',
    repository: '仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。',
    review: 'PR review、评论和重新分析。',
    sandbox: 'Docker/local sandbox 执行器、命令模型和安全校验。',
    scanstat: '扫描统计聚合。',
    scantask: '扫描任务、取消、治理时间线和 smoke seed。',
    user: '登录、注册、用户信息、JWT 认证。',
    workspace: '本地工作区和 sandbox 清理。',
  }[module] || ''
}

function directoryDescription(rel) {
  if (rel === '.github') return 'GitHub 平台配置目录，目前承载 CI 工作流。'
  if (rel === '.github/workflows') return 'GitHub Actions 工作流目录，负责自动化构建、测试、安全检查和 release evidence。'
  if (rel === '.idea') return 'JetBrains IDE 本地配置目录，不是产品运行必需能力。'
  if (rel === '.vscode') return 'VS Code 工作区配置目录，用于本地编辑器体验。'
  if (rel === 'analyzer-rust') return 'Rust 逆向分析器工程，负责扫描外部仓库并输出结构化代码理解结果。'
  if (rel === 'analyzer-rust/src') return 'Rust analyzer 核心源码目录，包含扫描、AST、框架识别、逆向分析和数据模型。'
  if (rel === 'analyzer-rust/tests') return 'Rust analyzer 合同测试目录，保护 CLI 输出和扫描行为不退化。'
  if (rel === 'backend-spring') return 'Spring Boot 后端工程，承载认证、项目、仓库、扫描、产物、Agent、审计、修复和集成 API。'
  if (rel === 'backend-spring/src/main/java/com/sourcelens/common') return '后端公共基础设施，包含统一响应、异常、安全、配置、可观测性和 MyBatis 配置。'
  if (rel === 'backend-spring/src/main/java/com/sourcelens/module') return '后端业务模块根目录，每个子目录对应一个相对独立的产品域。'
  if (rel.startsWith('backend-spring/src/main/java/com/sourcelens/module/')) {
    const parts = rel.split('/')
    const mod = parts[7]
    const layer = parts[8]
    const base = `${moduleDescription(mod) || `${mod} 模块。`}`
    if (layer === 'controller') return `${base}Controller 层，暴露 REST 接口、校验入口参数并委托 service。`
    if (layer === 'service') return `${base}Service 层，承载业务规则、状态机、外部系统调用和安全边界。`
    if (layer === 'entity') return `${base}Entity 层，映射数据库表。`
    if (layer === 'dto') return `${base}DTO 层，定义请求/响应契约。`
    if (layer === 'mapper') return `${base}Mapper 层，封装 MyBatis-Plus 数据访问。`
    if (layer === 'tool') return `${base}Agent Tool 层，定义 Agent 可调用工具及权限/参数约束。`
    return `${base}业务模块目录。`
  }
  if (rel === 'backend-spring/src/main/resources') return '后端资源目录，包含 Spring 配置、Flyway 数据库迁移和 MyBatis mapper XML。'
  if (rel === 'backend-spring/src/main/resources/db/migration') return 'Flyway 迁移目录，按版本演进 MySQL schema。'
  if (rel === 'backend-spring/src/test/java/com/sourcelens') return '后端单元/切片测试目录，覆盖 controller、service、安全、sandbox、分析和回归行为。'
  if (rel === 'deploy') return '部署配置目录，包含 Docker Compose 和环境变量模板。'
  if (rel === 'docs') return '项目事实源文档目录，覆盖产品、架构、API、数据库、安全、运维、阶段需求、进度和交接。'
  if (rel === 'docs/llm-safety-evals') return 'LLM 安全评测用例目录，存放 prompt injection、输出质量和 provider run 模板。'
  if (rel === 'scripts') return '本地自动化脚本目录，封装启动、校验、smoke、preflight、release evidence、清理和演练。'
  if (rel === 'web-console') return 'React/Vite 前端控制台工程，承载 SourceLens 用户界面和 UI smoke。'
  if (rel === 'web-console/src') return '前端源码根目录。'
  if (rel === 'web-console/src/api') return '前端 API client 层，集中定义后端 HTTP 调用和 TypeScript 响应类型。'
  if (rel === 'web-console/src/components') return '前端共享组件目录，提供布局、产物预览、日志、Diff、任务时间线等复用能力。'
  if (rel === 'web-console/src/components/ui') return '前端 UI 原语目录，用于统一按钮、状态块、表格行和基础交互规范。'
  if (rel === 'web-console/src/contexts') return 'React Context 目录，承载认证和对话等跨页面状态。'
  if (rel === 'web-console/src/pages') return '前端页面目录，每个文件对应一个主要产品页面或页面兼容包装。'
  if (rel === 'web-console/src/styles') return '前端全局样式目录，定义产品视觉、布局、响应式和可读性规则。'
  if (rel === 'web-console/src/utils') return '前端工具函数目录，当前重点处理展示脱敏等安全展示逻辑。'
  if (rel === 'web-console/tests') return 'Playwright UI smoke 测试目录，保护关键页面、状态和交互合同。'
  return `${topLevelDescription(topGroup(rel))}子目录。`
}

function describeFile(rel, text) {
  const ext = path.extname(rel)
  const base = path.basename(rel)
  const mod = moduleName(rel)

  if (rel === 'README.md') return '项目入口说明，介绍 SourceLens 当前定位、技术栈、本地启动、验证命令、结构和清理策略。'
  if (rel === 'Makefile') return '统一开发命令入口，封装本地启动、验证、smoke、release evidence、清理和专项门禁。'
  if (rel === '.gitignore') return '定义 Git 忽略规则，排除本地依赖、构建产物、runtime、release evidence 和密钥文件。'
  if (rel === '.dockerignore') return '定义 Docker build context 忽略规则，避免把本地依赖、证据包、runtime 和密钥打进镜像。'
  if (rel.startsWith('.github/workflows/')) return 'GitHub Actions CI 工作流，负责 PR/push 的安全、后端、前端、Rust、Docker 和 release evidence CI profile 验证。'
  if (rel.startsWith('.idea/') || rel.startsWith('.vscode/')) return '本地 IDE 配置文件，不属于产品能力；用于编辑器项目识别、代码风格或本机工作区状态。'

  if (rel.startsWith('analyzer-rust/')) {
    if (base === 'Cargo.toml') return 'Rust analyzer crate 配置，声明 analyzer CLI 的包信息、依赖和构建参数。'
    if (base === 'Cargo.lock') return 'Rust 依赖锁定文件，保证 analyzer 构建依赖版本可复现。'
    if (base === 'main.rs') return 'Rust analyzer CLI 入口，读取扫描参数、调用扫描/逆向分析模块并输出 JSON 结果。'
    if (base === 'scanner.rs') return '仓库文件扫描核心，负责遍历文件、统计语言/行数、过滤无关目录并生成扫描摘要。'
    if (base === 'framework.rs') return '框架识别与质量信号模块，根据项目文件和依赖判断后端/前端/构建技术特征。'
    if (base === 'reverse.rs') return '逆向分析模块，抽取符号、关系和架构线索，为报告和代码图谱提供输入。'
    if (base === 'ast_extractor.rs') return 'AST 抽取模块，围绕 Tree-sitter/语法结构提取函数、类、调用等细粒度信息。'
    if (base === 'models.rs') return 'Rust analyzer 输入输出数据模型，定义扫描结果、符号、关系、风险等 JSON schema。'
    if (rel.includes('/tests/')) return 'Rust analyzer 合同测试，验证扫描输出结构、关键字段和兼容性。'
    return 'Rust analyzer 工程文件。'
  }

  if (rel.startsWith('backend-spring/')) {
    if (base === 'pom.xml') return 'Spring Boot 后端 Maven 配置，声明 Java 17、Spring/MyBatis/Flyway/JGit/OpenAPI/Test 等依赖和构建插件。'
    if (base === 'Dockerfile') return '后端容器镜像定义，用于构建可部署的 Spring Boot backend runtime。'
    if (rel.includes('/db/migration/')) return describeMigration(rel, text)
    if (rel.endsWith('application.yml') || rel.endsWith('application-dev.yml') || rel.endsWith('application-prod.yml')) return 'Spring Boot 配置文件，定义端口、数据源、Redis、Flyway、JWT、workspace、sandbox、GitHub、LLM、清理任务和安全默认值。'
    if (rel.includes('/src/test/')) return describeTest(rel, text)
    if (base === 'SourceLensApplication.java') return 'Spring Boot 主启动类，启动 SourceLens 后端应用并装配所有业务模块。'
    if (rel.includes('/common/security/')) return '后端安全基础设施，覆盖 JWT、认证过滤、denylist、敏感数据脱敏、token 加密和用户参数解析。'
    if (rel.includes('/common/config/')) return '后端公共配置，包含异步执行、CORS、安全启动校验、加密器和 MyBatis Plus 配置。'
    if (rel.includes('/common/exception/')) return '后端异常模型和全局异常处理，统一业务错误、请求 ID 和错误响应。'
    if (rel.includes('/common/observability/')) return '后端可观测性指标封装，记录任务、扫描、审计或其他业务度量。'
    if (mod) {
      if (rel.includes('/controller/')) return `${moduleDescription(mod)}该 Controller 暴露 REST 接口并把请求转给 service 层。`
      if (rel.includes('/service/')) return `${moduleDescription(mod)}该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。`
      if (rel.includes('/entity/')) return `${moduleDescription(mod)}该 Entity 映射数据库表结构。`
      if (rel.includes('/dto/')) return `${moduleDescription(mod)}该 DTO 定义请求/响应数据契约。`
      if (rel.includes('/mapper/')) return `${moduleDescription(mod)}该 Mapper 负责 MyBatis-Plus 数据访问。`
      if (rel.includes('/tool/')) return `${moduleDescription(mod)}该 Agent Tool 定义 Agent 可调用的工具能力、参数校验或执行结果。`
      return `${moduleDescription(mod)}该文件属于 ${mod} 模块的后端实现。`
    }
    return 'Spring Boot 后端源码文件。'
  }

  if (rel.startsWith('web-console/')) {
    if (base === 'package.json') return '前端工程依赖和 npm 脚本定义，包含 Vite、React、Ant Design、Playwright smoke 命令。'
    if (base === 'package-lock.json') return '前端依赖锁定文件，保证 npm 安装版本可复现。'
    if (base.startsWith('vite.config')) return 'Vite 构建配置，包含 dev server、proxy、manual chunks 和构建边界。'
    if (base.startsWith('playwright.') && base.endsWith('.ts')) return 'Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。'
    if (rel.endsWith('/App.tsx')) return 'React 路由入口，定义登录、注册、Dashboard、ProjectDetail、ScanTaskDetail、Agent、Audit、AutoRepair 等页面路由。'
    if (rel.endsWith('/main.tsx')) return '前端应用入口，挂载 React 根节点、全局 provider 和样式。'
    if (rel.includes('/src/api/')) return '前端 API client，封装对应后端接口调用、请求参数和响应类型。'
    if (rel.includes('/src/pages/')) return '前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。'
    if (rel.includes('/src/components/ui/')) return '项目共享 UI 原语，用于统一状态块、操作栏、详情面板等大厂级 UI 基础。'
    if (rel.includes('/src/components/')) return '前端共享组件，被多个页面复用以展示布局、产物、日志、diff、任务时间线或权限保护。'
    if (rel.includes('/src/contexts/')) return 'React context，全局管理认证、会话或跨页面状态。'
    if (rel.includes('/src/styles/')) return '全局产品样式表，定义布局、卡片、表格、移动端响应式和 SourceLens 视觉系统。'
    if (rel.includes('/src/utils/')) return '前端工具函数，当前重点用于显示层脱敏和安全展示。'
    if (rel.includes('/tests/')) return 'Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。'
    return '前端工程文件。'
  }

  if (rel.startsWith('scripts/')) {
    if (base.startsWith('run-backend')) return '本地后端启动脚本，处理 env、端口占用、健康复用和稳定 jar runtime。'
    if (base.includes('release-evidence')) return 'release evidence 生成或复核脚本，记录发布验收命令、manifest、status、checksum 和防伪校验。'
    if (base.includes('security-regression')) return '安全回归矩阵脚本，覆盖静态安全、LLM、release verifier、marker 防伪和集成演练。'
    if (base.includes('public-repo')) return '公开仓库主链路 smoke，验证 clone、scan、report、code_chunks、QA 和 live marker。'
    if (base.includes('validate')) return '静态或语义校验脚本，用于锁定 API/UI/产物/LLM 输出等工程合同。'
    if (base.includes('clean-local-generated')) return '本地生成物清理脚本，保留最新 runtime jar，并保护正在运行的 dev backend target/classes。'
    return '工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。'
  }

  if (rel.startsWith('deploy/')) {
    if (base === 'docker-compose.yml') return '本地/部署基础设施编排，定义 MySQL、Redis 和后端等服务。'
    if (base.includes('.env')) return '环境变量模板或本地 env 文件，提供数据库、Redis、JWT、GitHub、sandbox 等配置入口。'
    return '部署和运行环境配置。'
  }

  if (rel.startsWith('docs/')) {
    return describeDoc(rel, text)
  }

  if (ext === '.md') return 'Markdown 文档。'
  if (ext === '.json') return 'JSON 配置或数据文件。'
  if (ext === '.yml' || ext === '.yaml') return 'YAML 配置文件。'
  if (ext === '.sh') return 'Shell 自动化脚本。'
  if (ext === '.mjs' || ext === '.js') return 'Node.js 自动化脚本或配置文件。'
  if (ext === '.ts' || ext === '.tsx') return 'TypeScript/React 源码文件。'
  if (ext === '.java') return 'Java 后端源码文件。'
  if (ext === '.rs') return 'Rust 源码文件。'
  if (ext === '.sql') return 'SQL 脚本或数据库迁移文件。'
  return '项目文件。'
}

function describeDoc(rel, text) {
  const title = text.match(/^#\s+(.+)$/m)?.[1] || path.basename(rel)
  const lower = rel.toLowerCase()
  if (lower.includes('api_design')) return `API 设计文档，记录后端接口、请求响应、权限和当前 route inventory。标题：${title}。`
  if (lower.includes('database')) return `数据库设计文档，记录核心表、Flyway 迁移和数据边界。标题：${title}。`
  if (lower.includes('security')) return `安全边界文档，定义凭据、沙箱、LLM、GitHub、审计和危险能力红线。标题：${title}。`
  if (lower.includes('operations')) return `运维运行手册，记录部署、preflight、release evidence、备份、回滚和本地清理 SOP。标题：${title}。`
  if (lower.includes('phase')) return `阶段需求或基线文档，定义 P 阶段目标、验收标准和非范围。标题：${title}。`
  if (lower.includes('progress')) return `产品进度日志，记录每轮实际开发、验证、风险和下一步。标题：${title}。`
  if (lower.includes('handoff')) return `上下文交接文档，用于新 Codex 会话接续当前 SourceLens 状态。标题：${title}。`
  if (lower.includes('governance')) return `产品/工程治理文档，定义开发流程、事实源、验证和记录制度。标题：${title}。`
  if (lower.includes('team')) return `多 agent 团队运行模型，定义固定岗位、专家池、触发条件和协作规则。标题：${title}。`
  if (lower.includes('structure')) return `项目结构审计文档，记录目录职责、生成物边界和清理策略。标题：${title}。`
  return `项目文档。标题：${title}。`
}

function describeMigration(rel, text) {
  const operations = []
  if (/create\s+table/i.test(text)) operations.push('创建表')
  if (/alter\s+table/i.test(text)) operations.push('修改表结构')
  if (/create\s+index|add\s+index|unique\s+key/i.test(text)) operations.push('新增索引/唯一约束')
  if (/collate|character\s+set/i.test(text)) operations.push('字符集/排序规则调整')
  const suffix = operations.length ? `主要操作：${operations.join('、')}。` : '数据库迁移脚本。'
  return `${path.basename(rel)} Flyway 迁移，${suffix}`
}

function describeTest(rel, text) {
  const className = text.match(/\bclass\s+([A-Za-z0-9_]+)/)?.[1] || path.basename(rel)
  const tests = extractJavaMethods(text).filter(m => /Test|should|when|reject|allow|pass|fail/i.test(m.name))
  const count = tests.length
  return `后端测试文件 ${className}，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 ${count} 个测试/断言方法。`
}

function extractJavaMethods(text) {
  const lines = text.split(/\r?\n/)
  const methods = []
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const match = line.match(/\b(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?[\w<>\[\], ?]+\s+([a-zA-Z_][\w]*)\s*\([^;]*\)\s*(?:throws\s+[^{]+)?\{/)
    if (match && !['if', 'for', 'while', 'switch', 'catch'].includes(match[1])) {
      methods.push({ name: match[1], line: i + 1 })
    }
  }
  return methods
}

function extractJavaImports(text) {
  return [...text.matchAll(/^\s*import\s+([^;]+);/gm)]
    .map(match => match[1])
    .filter(value => value.startsWith('com.sourcelens.'))
    .map(value => value.replace(/^com\.sourcelens\./, ''))
    .slice(0, 12)
}

function extractTsImports(text) {
  return [...text.matchAll(/^\s*import\s+(?:type\s+)?(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/gm)]
    .map(match => match[1])
    .filter(value => value.startsWith('.') || value.startsWith('@/'))
    .slice(0, 12)
}

function extractRustImports(text) {
  return [...text.matchAll(/^\s*use\s+([^;]+);/gm)]
    .map(match => match[1])
    .slice(0, 12)
}

function extractDependencyHints(rel, text) {
  if (!text) return []
  const ext = path.extname(rel)
  if (ext === '.java') return extractJavaImports(text)
  if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.mjs') return extractTsImports(text)
  if (ext === '.rs') return extractRustImports(text)
  return []
}

function extractJavaSymbols(text) {
  const symbols = []
  const pkg = text.match(/^\s*package\s+([^;]+);/m)?.[1]
  if (pkg) symbols.push(`package ${pkg}`)
  for (const match of text.matchAll(/\b(class|interface|enum|record)\s+([A-Za-z0-9_]+)/g)) {
    symbols.push(`${match[1]} ${match[2]}`)
  }
  for (const method of extractJavaMethods(text)) {
    symbols.push(`L${method.line} method ${method.name}(...)`)
  }
  for (const match of text.matchAll(/@Value\("([^"]+)"\)/g)) {
    symbols.push(`配置注入 ${match[1]}`)
  }
  return symbols
}

function extractTsSymbols(text) {
  const symbols = []
  for (const match of text.matchAll(/\bexport\s+(?:default\s+)?function\s+([A-Za-z0-9_]+)/g)) symbols.push(`export function ${match[1]}`)
  for (const match of text.matchAll(/\bfunction\s+([A-Za-z0-9_]+)\s*\(/g)) symbols.push(`function ${match[1]}(...)`)
  for (const match of text.matchAll(/\bconst\s+([A-Z][A-Za-z0-9_]+)\s*[:=]/g)) symbols.push(`component/const ${match[1]}`)
  for (const match of text.matchAll(/\bexport\s+(?:interface|type)\s+([A-Za-z0-9_]+)/g)) symbols.push(`export type ${match[1]}`)
  for (const match of text.matchAll(/\binterface\s+([A-Za-z0-9_]+)/g)) symbols.push(`interface ${match[1]}`)
  return [...new Set(symbols)]
}

function extractRustSymbols(text) {
  const symbols = []
  for (const match of text.matchAll(/\b(?:pub\s+)?(?:async\s+)?fn\s+([A-Za-z0-9_]+)/g)) symbols.push(`fn ${match[1]}(...)`)
  for (const match of text.matchAll(/\b(?:pub\s+)?struct\s+([A-Za-z0-9_]+)/g)) symbols.push(`struct ${match[1]}`)
  for (const match of text.matchAll(/\b(?:pub\s+)?enum\s+([A-Za-z0-9_]+)/g)) symbols.push(`enum ${match[1]}`)
  for (const match of text.matchAll(/\bmod\s+([A-Za-z0-9_]+)/g)) symbols.push(`mod ${match[1]}`)
  return symbols
}

function extractShellSymbols(text) {
  const symbols = []
  for (const match of text.matchAll(/^([A-Za-z_][A-Za-z0-9_]*)\s*\(\)\s*\{/gm)) symbols.push(`function ${match[1]}()`)
  return symbols
}

function extractDocHeadings(text) {
  return [...text.matchAll(/^(#{1,3})\s+(.+)$/gm)].map(m => `${m[1]} ${m[2]}`)
}

function extractSqlObjects(text) {
  const symbols = []
  for (const match of text.matchAll(/\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([A-Za-z0-9_]+)`?/gi)) symbols.push(`create table ${match[1]}`)
  for (const match of text.matchAll(/\bALTER\s+TABLE\s+`?([A-Za-z0-9_]+)`?/gi)) symbols.push(`alter table ${match[1]}`)
  for (const match of text.matchAll(/\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+`?([A-Za-z0-9_]+)`?/gi)) symbols.push(`create index ${match[1]}`)
  return symbols
}

function extractJsonKeys(text) {
  try {
    const json = JSON.parse(text)
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      return Object.keys(json).slice(0, 30).map(key => `key ${key}`)
    }
  } catch {
    return []
  }
  return []
}

function extractSymbols(rel, text) {
  const ext = path.extname(rel)
  if (!text) return []
  if (ext === '.java') return extractJavaSymbols(text)
  if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.mjs') return extractTsSymbols(text)
  if (ext === '.rs') return extractRustSymbols(text)
  if (ext === '.sh') return extractShellSymbols(text)
  if (ext === '.md') return extractDocHeadings(text)
  if (ext === '.sql') return extractSqlObjects(text)
  if (ext === '.json') return extractJsonKeys(text)
  if (ext === '.yml' || ext === '.yaml' || ext === '.toml' || ext === '.xml') return extractConfigHints(text)
  return []
}

function extractConfigHints(text) {
  const hints = []
  for (const match of text.matchAll(/^\s*([A-Za-z0-9_.-]+):/gm)) {
    hints.push(`config ${match[1]}`)
    if (hints.length >= 30) break
  }
  return hints
}

function extractAnnotationArgs(annotation) {
  const strings = [...annotation.matchAll(/"([^"]*)"/g)].map(m => m[1])
  if (strings.length) return strings
  return ['']
}

function extractOperationSummary(annotations) {
  const joined = annotations.join('\n')
  return joined.match(/@Operation\s*\([^)]*summary\s*=\s*"([^"]+)"/)?.[1] || ''
}

function parseJavaMethodSignature(line) {
  const compact = line.trim().replace(/\s+/g, ' ')
  const match = compact.match(/\b(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?([\w<>\[\], ?]+?)\s+([a-zA-Z_][\w]*)\s*\((.*)\)\s*(?:throws\s+[^{]+)?\{/)
  if (!match) {
    return null
  }
  const paramsRaw = match[3].trim()
  const params = paramsRaw
    ? paramsRaw.split(/,(?![^<]*>)/).map(part => part.trim().replace(/\s+/g, ' '))
    : []
  return {
    returnType: match[1].trim(),
    name: match[2],
    params,
    signature: `${match[1].trim()} ${match[2]}(${params.join(', ')})`,
  }
}

function collectJavaMethodSignature(lines, startIndex) {
  const first = lines[startIndex].trim()
  if (!/\b(?:public|private|protected)\b/.test(first) || !first.includes('(')) {
    return ''
  }
  const collected = []
  for (let i = startIndex; i < Math.min(startIndex + 12, lines.length); i += 1) {
    const current = lines[i].trim()
    collected.push(current)
    if (current.includes('{')) {
      break
    }
  }
  const combined = collected.join(' ')
  return combined.includes('{') ? combined : ''
}

function joinPath(base, sub) {
  const parts = [base, sub].filter(Boolean).join('/')
  return `/${parts.split('/').filter(Boolean).join('/')}`.replaceAll('//', '/')
}

function extractJavaRoutes(file, text) {
  if (!file.rel.startsWith('backend-spring/src/main/java/') || !file.rel.endsWith('Controller.java')) return []
  if (!/@RestController/.test(text)) return []
  const lines = text.split(/\r?\n/)
  const classTextBeforeClass = text.slice(0, text.search(/\bclass\s+\w+|\brecord\s+\w+/))
  const classMapping = classTextBeforeClass.match(/@RequestMapping\s*\(([\s\S]*?)\)/)
  const basePaths = classMapping ? extractAnnotationArgs(classMapping[1]) : ['']
  const routes = []
  let pendingAnnotations = []
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim()
    if (trimmed.startsWith('@')) {
      pendingAnnotations.push(trimmed)
      continue
    }
    const signatureText = collectJavaMethodSignature(lines, i)
    const signature = signatureText ? parseJavaMethodSignature(signatureText) : null
    if (!signature) {
      if (trimmed && !trimmed.startsWith('@')) pendingAnnotations = []
      continue
    }
    const annotation = pendingAnnotations.find(a => /@(Get|Post|Put|Delete|Patch|Request)Mapping/.test(a))
    if (annotation) {
      const kind = annotation.match(/@(Get|Post|Put|Delete|Patch|Request)Mapping/)?.[1] || 'Request'
      const httpMethod = {
        Get: 'GET',
        Post: 'POST',
        Put: 'PUT',
        Delete: 'DELETE',
        Patch: 'PATCH',
        Request: annotation.match(/RequestMethod\.([A-Z]+)/)?.[1] || 'ANY',
      }[kind]
      const methodPaths = extractAnnotationArgs(annotation)
      for (const basePath of basePaths) {
        for (const methodPath of methodPaths) {
          routes.push({
            method: httpMethod,
            path: joinPath(basePath, methodPath),
            handler: signature.name,
            summary: extractOperationSummary(pendingAnnotations),
            returnType: signature.returnType,
            params: signature.params,
            signature: signature.signature,
            file: file.rel,
            line: i + 1,
          })
        }
      }
    }
    pendingAnnotations = []
  }
  return routes
}

function extractFrontendRoutes(text) {
  const routes = []
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (!line.includes('<Route') || !line.includes('element={<')) {
      continue
    }
    const component = line.match(/element=\{<([^ />]+)/)?.[1]
    if (component) {
      const routePath = line.match(/\bpath="([^"]+)"/)?.[1]
      routes.push({
        path: routePath || (/\bindex\b/.test(line) ? '(index)' : '(layout)'),
        component,
        line: i + 1,
      })
    }
  }
  return routes
}

function extractApiClientCalls(file, text) {
  const calls = []
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const fetchMatch = line.match(/\bfetch\s*\(\s*([`'"])(\/[^`'"]*)\1/)
    if (fetchMatch) {
      const lookahead = lines.slice(i, Math.min(i + 10, lines.length)).join('\n')
      const explicitMethod = lookahead.match(/\bmethod\s*:\s*['"]([A-Za-z]+)['"]/)
      calls.push({
        method: (explicitMethod?.[1] || 'GET').toUpperCase(),
        path: fetchMatch[2],
        file: file.rel,
        line: i + 1,
      })
      continue
    }
    const methodMatch = line.match(/\b(?:api|client|http|axios)\.(get|post|put|patch|delete)\b/)
    if (!methodMatch) {
      continue
    }
    const pathMatch = line.match(/([`'"])(\/[^`'"]*)\1/)
    if (pathMatch) {
      calls.push({ method: methodMatch[1].toUpperCase(), path: pathMatch[2], file: file.rel, line: i + 1 })
    }
  }
  return calls
}

function groupBy(items, keyFn) {
  const map = new Map()
  for (const item of items) {
    const key = keyFn(item)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  }
  return map
}

function formatSymbols(symbols) {
  if (!symbols.length) return '未检测到可命名符号；该文件主要通过配置、样式、Markdown 文本或声明式内容发挥作用。'
  return symbols.map(s => code(s)).join('、')
}

function topLevelDescription(group) {
  return {
    '.github': 'CI/CD 工作流。',
    '.idea': 'JetBrains 本地 IDE 配置。',
    '.vscode': 'VS Code 本地配置。',
    'analyzer-rust': 'Rust 代码逆向分析器。',
    'backend-spring': 'Spring Boot 后端服务。',
    deploy: 'Docker Compose 和环境模板。',
    docs: '产品、架构、运维、安全、阶段、团队与交接文档。',
    scripts: '本地启动、验证、release evidence、安全回归和 smoke 自动化。',
    'web-console': 'React/Vite 前端控制台和 Playwright UI smoke。',
  }[group] || '项目根文件或辅助目录。'
}

function renderMarkdown(files, fileInfos, routes, frontendRoutes, apiClientCalls) {
  const lines = []
  const byGroup = groupBy(fileInfos, info => topGroup(info.rel))
  const directories = collectDirectories(files)
  const totalLines = fileInfos.reduce((sum, info) => sum + info.lines, 0)
  const sourceCount = fileInfos.filter(info => /\.(java|ts|tsx|rs|sh|mjs|js|sql|css)$/.test(info.rel)).length

  lines.push('# SourceLens 简洁代码地图')
  lines.push('')
  lines.push('状态：由 `scripts/generate-project-code-map.mjs` 根据当前工作区生成。本文是简洁索引，用于快速判断目录、文件和接口入口“是做什么的”；详细接口语义见 `docs/API_DESIGN.md`，详细阶段记录见 `docs/PRODUCT_PROGRESS_LOG.md`。')
  lines.push('')
  lines.push('## 1. 生成范围')
  lines.push('')
  lines.push(`- 纳入逐文件用途索引的文件数：${files.length}。`)
  lines.push(`- 其中源码/脚本/配置/SQL/CSS 类文件数：${sourceCount}。`)
  lines.push(`- 纳入统计的文本总行数：${totalLines}。`)
  lines.push('- 排除逐文件展开的本地生成/证据目录：`.git/`、`bin/`、`web-console/node_modules/`、`backend-spring/target/`、`analyzer-rust/target/`、`.sourcelens-runtime/`、`release-evidence/`、前端构建和测试产物。')
  lines.push('- `release-evidence/`、`.sourcelens-runtime/` 等目录的治理边界见 `docs/PROJECT_STRUCTURE_AUDIT.md` 与 `docs/OPERATIONS_RUNBOOK.md`。')
  lines.push('')

  lines.push('## 2. 顶层目录总览')
  lines.push('')
  lines.push('| 路径 | 文件数 | 说明 |')
  lines.push('| --- | ---: | --- |')
  for (const [group, entries] of [...byGroup.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`| ${code(group)} | ${entries.length} | ${escapeMd(topLevelDescription(group))} |`)
  }
  lines.push('')

  lines.push('## 3. 目录层级职责地图')
  lines.push('')
  lines.push('该章节按当前工作区真实目录生成，用于判断每一层目录负责什么。生成物、依赖和证据目录不会展开。')
  lines.push('')
  lines.push('| 目录 | 文件数 | 说明 |')
  lines.push('| --- | ---: | --- |')
  for (const dir of directories) {
    const fileCount = fileInfos.filter(info => info.rel.startsWith(`${dir}/`)).length
    lines.push(`| ${code(dir)} | ${fileCount} | ${escapeMd(directoryDescription(dir))} |`)
  }
  lines.push('')

  lines.push('## 4. 后端 REST 接口索引')
  lines.push('')
  lines.push(`当前从 Spring Controller 静态检测到 ${routes.length} 条路由。本文只保留定位信息；请求/响应字段、权限和安全边界以 \`docs/API_DESIGN.md\` 为准。`)
  lines.push('')
  lines.push('| Method | Path | 摘要 | Controller | 位置 |')
  lines.push('| --- | --- | --- | --- | --- |')
  for (const route of routes.sort((a, b) => `${a.path} ${a.method}`.localeCompare(`${b.path} ${b.method}`))) {
    lines.push(`| ${route.method} | ${code(route.path)} | ${escapeMd(route.summary || '-')} | ${code(path.basename(route.file))} | ${code(`${route.file}:${route.line}`)} |`)
  }
  lines.push('')

  lines.push('## 5. 前端路由与页面入口')
  lines.push('')
  lines.push('| Route | Component | 位置 |')
  lines.push('| --- | --- | --- |')
  for (const route of frontendRoutes) {
    lines.push(`| ${code(route.path)} | ${code(route.component)} | ${code(`web-console/src/App.tsx:${route.line}`)} |`)
  }
  lines.push('')

  lines.push('## 6. 前端 API Client 调用索引')
  lines.push('')
  lines.push(`当前从 \`web-console/src/api\` 静态检测到 ${apiClientCalls.length} 个直接 HTTP 调用。模板字符串会保留原始形式，便于和后端 route 对齐。`)
  lines.push('')
  lines.push('| Method | Path/Template | 文件 |')
  lines.push('| --- | --- | --- |')
  for (const call of apiClientCalls.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)) {
    lines.push(`| ${call.method} | ${code(call.path)} | ${code(call.file)} |`)
  }
  lines.push('')

  lines.push('## 7. 逐文件作用索引')
  lines.push('')
  lines.push('该章节只说明每个文件的用途，不展开符号、依赖、行数和实现细节，避免把代码地图变成高维护成本的审计报告。')
  lines.push('')
  for (const [group, entries] of [...byGroup.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`### ${group}`)
    lines.push('')
    lines.push('| 文件 | 作用 |')
    lines.push('| --- | --- |')
    for (const info of entries.sort((a, b) => a.rel.localeCompare(b.rel))) {
      lines.push(`| ${code(info.rel)} | ${escapeMd(info.description)} |`)
    }
    lines.push('')
  }

  lines.push('## 8. 更新规则')
  lines.push('')
  lines.push('- 本文不要求每个微小改动后立即刷新；按 `docs/PRODUCT_GOVERNANCE.md` 的文档维护分级执行。')
  lines.push('- 涉及新增/删除/重命名文件、目录结构变化、Controller 路由变化、前端路由/API client 变化时，运行 `make code-map`。')
  lines.push('- 阶段验收、release evidence、交接前运行 `make code-map-check`；该检查已接入 `make verify`。')
  lines.push('- 如果某个文件说明不够准确，优先增强 `scripts/generate-project-code-map.mjs` 的分类规则，再重新生成本文；不要只手改本文。')
  lines.push('- `docs/API_DESIGN.md` 仍是 API 设计细节事实源；本文只提供定位和用途说明。')
  lines.push('')

  return `${lines.join('\n')}\n`
}

function fileKind(rel) {
  if (rel.endsWith('.java')) return 'Java 后端源码'
  if (rel.endsWith('.ts') || rel.endsWith('.tsx')) return 'TypeScript/React 源码'
  if (rel.endsWith('.rs')) return 'Rust analyzer 源码'
  if (rel.endsWith('.sh')) return 'Shell 脚本'
  if (rel.endsWith('.mjs') || rel.endsWith('.js')) return 'Node/Vite 脚本或配置'
  if (rel.endsWith('.sql')) return 'Flyway SQL 迁移'
  if (rel.endsWith('.md')) return 'Markdown 文档'
  if (rel.endsWith('.yml') || rel.endsWith('.yaml')) return 'YAML 配置'
  if (rel.endsWith('.json')) return 'JSON 配置/数据'
  if (rel.endsWith('.css')) return 'CSS 样式'
  if (rel.endsWith('.xml')) return 'XML 配置'
  if (rel.endsWith('.toml')) return 'TOML 配置'
  return '项目文件'
}

const files = walk(rootDir)
const fileInfos = []
let routes = []
let frontendRoutes = []
let apiClientCalls = []

for (const file of files) {
  const text = readText(file)
  const symbols = extractSymbols(file.rel, text)
  const fileRoutes = extractJavaRoutes(file, text)
  const fileApiCalls = file.rel.startsWith('web-console/src/api/') ? extractApiClientCalls(file, text) : []
  const dependencies = extractDependencyHints(file.rel, text)
  routes = routes.concat(fileRoutes)
  apiClientCalls = apiClientCalls.concat(fileApiCalls)
  if (file.rel === 'web-console/src/App.tsx') {
    frontendRoutes = extractFrontendRoutes(text)
  }
  fileInfos.push({
    rel: file.rel,
    size: file.stat.size,
    lines: countLines(text),
    kind: fileKind(file.rel),
    description: describeFile(file.rel, text),
    symbols,
    dependencies,
    routes: fileRoutes,
    apiCalls: fileApiCalls,
  })
}

const generated = renderMarkdown(files, fileInfos, routes, frontendRoutes, apiClientCalls)

if (checkMode) {
  const current = existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : ''
  if (current !== generated) {
    console.error('docs/PROJECT_CODE_MAP.md is stale. Run: make code-map')
    process.exit(1)
  }
  console.log(`PROJECT_CODE_MAP_OK files=${files.length} routes=${routes.length} frontendApiCalls=${apiClientCalls.length}`)
} else {
  mkdirSync(path.dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, generated)
  console.log(`PROJECT_CODE_MAP_WRITTEN ${path.relative(rootDir, outputPath)} files=${files.length} routes=${routes.length} frontendApiCalls=${apiClientCalls.length}`)
}
