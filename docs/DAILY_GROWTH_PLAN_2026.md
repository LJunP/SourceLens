# SourceLens 后端与 Agent 工程每日成长计划

> AIOS v2.3 状态：`PERSONAL LEARNING PLAN / NOT PROJECT AUTHORITY`。本文可用于个人学习，不得向当前 Phase、技术栈或 Codex 任务注入要求。

```text

```

## 1. 每日固定时间块

如果你下班后学习，建议按这个时间安排：

```text
1. 算法题 40 分钟
2. 后端基础 60 分钟
3. 项目开发 100 分钟
4. Agent/大模型/架构专题 40 分钟
5. 当日复盘 20 分钟
```

每日复盘必须写 5 行：

```text
今天完成了什么：
今天卡在哪里：
明天第一件事：
今天新增了哪些知识点：
今天项目有没有提交：
```

## 2. 每周固定产出

每周最低产出：

```text
算法：8-12 题
后端：1 个专题笔记
SourceLens：至少 1 个可运行功能
Agent：至少 1 个能力点实验
文档：1 篇周报或技术博客
代码：至少 5 天有 commit
```

每周日晚上必须做：

```text
1. 整理本周 commit
2. 整理错题
3. 更新 README 或 docs
4. 写一篇复盘
5. 规划下周第一个功能
```

## 3. 第一阶段：第 1-4 周，建立可跑的项目骨架

阶段目标：

```text
SourceLens 后端项目跑起来
完成用户、项目、仓库导入、代码文件扫描基础链路
补齐 Java、Spring Boot、MySQL、Linux/Shell 基础
算法进入稳定节奏
```

### 第 1 周

#### Day 1

19:30-20:10：算法：数组与哈希，完成 Two Sum、有效字母异位词、最长连续序列。  
20:20-21:20：Java：复习 Java 基础类型、集合、List/Map/Set 使用场景。  
21:30-23:10：SourceLens：创建 Spring Boot 后端骨架，确定包结构：controller、service、repository、domain、infra、agent。  
23:20-00:00：Agent：阅读 LLM Agent 基本结构：规划、工具、记忆、执行、评估。  
00:00-00:20：复盘：写 docs/week-01-log.md。

#### Day 2

19:30-20:10：算法：双指针，完成移动零、盛最多水的容器、三数之和思路复盘。  
20:20-21:20：Spring Boot：Controller、Service、DTO、VO、统一返回体。  
21:30-23:10：SourceLens：实现统一返回对象 Result、全局异常处理、健康检查接口。  
23:20-00:00：Shell：学习 ls、find、grep、awk、sed 基础。  
00:00-00:20：提交代码，记录接口清单。

#### Day 3

19:30-20:10：算法：滑动窗口，完成无重复字符最长子串、最小覆盖子串思路。  
20:20-21:20：MySQL：表设计、主键、索引、唯一索引、普通索引。  
21:30-23:10：SourceLens：设计 users、projects、repositories 三张表，接入 MySQL。  
23:20-00:00：Agent：整理 SourceLens Agent 模块愿景。  
00:00-00:20：写数据库设计说明。

#### Day 4

19:30-20:10：算法：栈，完成有效括号、最小栈、每日温度。  
20:20-21:20：MyBatis-Plus 或 JPA 二选一，学习 CRUD、分页、条件查询。  
21:30-23:10：SourceLens：完成 Project 创建、查询、分页接口。  
23:20-00:00：Linux：目录、权限、进程、端口查看。  
00:00-00:20：用 curl 测试接口。

#### Day 5

19:30-20:10：算法：链表，完成反转链表、合并两个有序链表、环形链表。  
20:20-21:20：后端：DTO 校验、参数校验、错误码设计。  
21:30-23:10：SourceLens：给 Project 接口加参数校验、错误码、日志。  
23:20-00:00：Agent：学习 function calling / tool calling 的概念。  
00:00-00:20：写今日踩坑。

#### Day 6

19:30-20:10：算法：二分，完成二分查找、搜索旋转数组、寻找峰值。  
20:20-21:20：Git：branch、commit、merge、rebase 基础。  
21:30-23:10：SourceLens：实现 Repository 录入接口，字段包含 repoUrl、branch、localPath、language、status。  
23:20-00:00：Shell：写一个脚本扫描目录文件数量和后缀分布。  
00:00-00:20：整理第一个 Shell 脚本。

#### Day 7

19:30-20:10：算法复盘：整理本周错题。  
20:20-21:20：后端复盘：整理 Spring Boot 基础笔记。  
21:30-23:10：SourceLens：补 README，写当前接口文档。  
23:20-00:00：周报：写第 1 周复盘。  
00:00-00:20：规划第 2 周。

### 第 2 周

#### Day 8

算法：树基础，二叉树前中后序、最大深度、对称二叉树。  
后端：文件系统 API，Java NIO Path、Files、walkFileTree。  
项目：实现本地仓库目录扫描，保存文件路径、大小、后缀。  
Agent：定义 RepositoryScanTool 的输入输出。

#### Day 9

算法：BFS/DFS，岛屿数量、腐烂橘子。  
后端：事务、@Transactional、事务失效场景。  
项目：扫描仓库时写入 scan_task 和 source_files，保证事务一致性。  
大数据：Shell 管道和日志过滤。

#### Day 10

算法：回溯，组合、全排列、子集。  
后端：异步任务基础，线程池 ThreadPoolTaskExecutor。  
项目：仓库扫描改为异步任务，接口返回 taskId。  
Agent：理解 Agent 任务状态：pending、running、success、failed。

#### Day 11

算法：堆，TopK 高频元素、数组中第 K 大。  
后端：日志体系，logback、traceId、错误日志。  
项目：给扫描任务加日志和失败原因记录。  
Shell：tail、grep、awk 分析应用日志。

#### Day 12

算法：贪心，买卖股票、跳跃游戏。  
后端：RESTful API 规范和接口文档。  
项目：实现获取扫描结果接口：文件树、语言占比、Top 文件类型。  
Agent：设计“项目概览生成器”的 prompt。

#### Day 13

算法：动态规划入门，爬楼梯、零钱兑换。  
后端：MySQL 索引 explain。  
项目：给 source_files 的 repository_id、extension 建索引，写 explain 记录。  
架构：整理 SourceLens 当前模块图。

#### Day 14

算法：本周错题二刷。  
项目：修 bug、补测试、整理接口文档。  
文档：写《SourceLens 第一次里程碑：仓库扫描模块》。  
复盘：检查本周 commit、接口、数据库表、技术笔记。

### 第 3 周

#### Day 15

算法：DP 继续，最长递增子序列、最长公共子序列。  
后端：Redis 基础，String、Hash、List、Set、ZSet。  
项目：接入 Redis，缓存项目概览统计结果。  
Agent：学习 RAG 的 retrieve、augment、generate。

#### Day 16

算法：单调栈，接雨水、柱状图最大矩形思路。  
后端：缓存穿透、击穿、雪崩。  
项目：给项目概览接口做缓存过期、空值缓存。  
大数据：MySQL 慢查询日志基本理解。

#### Day 17

算法：并查集，朋友圈、冗余连接。  
后端：消息队列基本概念，生产者、消费者、重试、死信。  
项目：先用数据库任务表模拟队列，设计后续 MQ 接入点。  
Agent：整理 SourceLens Agent 执行日志表结构。

#### Day 18

算法：图，课程表、拓扑排序。  
后端：代码解析基础，正则和 AST 的区别。  
项目：实现 Java 文件粗解析：package、import、className、methods。  
Agent：设计 CodeParseTool。

#### Day 19

算法：字符串，KMP 思想、回文子串。  
后端：接口幂等性。  
项目：仓库重复扫描要幂等，避免重复写 source_files。  
Shell：写脚本统计 Java 类、接口、Controller 数量。

#### Day 20

算法：综合计时，2 道 medium 限时。  
后端：单元测试 JUnit、Mockito。  
项目：给 ProjectService、RepositoryScanService 写测试。  
Agent：学习 eval 思路，准备小评测集。

#### Day 21

算法：错题整理。  
项目：整理代码解析模块文档。  
文档：写《Java 仓库扫描与粗解析设计》。  
复盘：第 3 周复盘。

### 第 4 周

#### Day 22

算法：CodeTop 高频 3 题。  
后端：Elasticsearch/OpenSearch 基础概念：index、document、mapping。  
项目：调研代码搜索方案，写 docs/search-design.md。  
Agent：理解 embedding、chunk、topK。

#### Day 23

算法：链表和树混合训练。  
后端：全文搜索与向量搜索区别。  
项目：先实现数据库版关键词搜索：按文件名、路径、内容摘要搜索。  
Agent：设计 CodeSearchTool。

#### Day 24

算法：二分和滑窗混合训练。  
后端：分页深翻页问题。  
项目：代码搜索接口加分页、排序、过滤语言。  
大数据：学习 Hive/Spark 概念，只做理解，不展开。

#### Day 25

算法：DP 2 题。  
后端：安全基础，路径穿越、文件读取限制。  
项目：限制扫描目录，防止读取仓库外文件。  
Agent：整理 Agent 权限边界。

#### Day 26

算法：图 2 题。  
后端：接口鉴权 JWT。  
项目：实现简化登录、JWT、用户项目隔离。  
架构：画鉴权链路图。

#### Day 27

算法：模拟面试 40 分钟。  
后端：异常、日志、鉴权复盘。  
项目：修复前 4 周技术债，补充 README 启动说明。  
Agent：写 SourceLens Agent 第一版设计文档。

#### Day 28

算法：月度错题复盘。  
项目：发布 v0.1 本地可运行版本。  
文档：写 v0.1 里程碑报告。  
复盘：列出第 2 阶段任务。

## 4. 第二阶段：第 5-8 周，RAG 与 Agent 雏形

阶段目标：

```text
SourceLens 能对代码进行切块、索引、检索、问答
具备第一个可演示 Agent：项目概览 Agent
后端能力覆盖 Redis、异步任务、鉴权、搜索
算法累计达到 100-150 题
```

### 第 5 周

周一：学习 chunk 设计，项目实现代码切块表 code_chunks。  
周二：实现按文件切块，保存 chunk 内容、行号、hash。  
周三：学习 embedding，先接一个模型 API，写 EmbeddingClient 接口。  
周四：实现 chunk 向量化任务，失败可重试。  
周五：实现 RAG 检索流程：query -> retrieve -> prompt -> answer。  
周六：做项目问答 demo：“这个项目有哪些模块？”  
周日：写 RAG 设计文档和第 5 周复盘。

每天 5 小时分配不变：

```text
算法 40 分钟
后端/中间件 60 分钟
项目 100 分钟
Agent/RAG 40 分钟
复盘 20 分钟
```

### 第 6 周

周一：学习 prompt 工程，整理项目概览 prompt。  
周二：实现 ProjectOverviewAgent。  
周三：给 Agent 增加 tool 调用日志。  
周四：实现 AgentRun、AgentStep、AgentToolCall 三张表。  
周五：实现 Agent 运行详情接口。  
周六：做一次完整演示：导入仓库 -> 扫描 -> 检索 -> Agent 概览。  
周日：写《SourceLens Agent 运行链路》文档。

### 第 7 周

周一：学习线程池参数，优化扫描任务线程池。  
周二：给扫描和 embedding 任务加限流。  
周三：学习重试策略，实现指数退避重试。  
周四：学习幂等设计，修复重复 embedding 问题。  
周五：写接口压测脚本。  
周六：完成第一次压测报告。  
周日：复盘性能瓶颈。

### 第 8 周

周一：学习 Controller-Service-Repository 架构边界。  
周二：重构 SourceLens 包结构，清理混乱代码。  
周三：补单元测试。  
周四：补集成测试。  
周五：完善 Docker Compose：MySQL、Redis、后端。  
周六：完成 v0.2 发布。  
周日：写 v0.2 里程碑报告。

## 5. 第三阶段：第 9-12 周，工程化与面试基础强化

阶段目标：

```text
SourceLens 从 demo 变成工程项目
支持任务队列、缓存、搜索、鉴权、日志、测试、部署
算法累计 180-250 题
开始写简历项目材料
```

### 第 9 周：任务系统

周一：学习 MQ 基础，理解 Kafka/RocketMQ。  
周二：先用数据库任务表完成 TaskExecutor。  
周三：实现任务取消、失败、重试。  
周四：实现任务进度百分比。  
周五：实现任务事件日志。  
周六：压测任务系统。  
周日：写任务系统设计文档。

### 第 10 周：搜索系统

周一：学习倒排索引。  
周二：接入 Elasticsearch/OpenSearch 或先保留数据库搜索。  
周三：实现代码文件全文索引。  
周四：实现接口级搜索。  
周五：实现搜索结果高亮。  
周六：做搜索性能对比。  
周日：写搜索模块复盘。

### 第 11 周：后端面试专题

周一：Java 集合源码。  
周二：JVM 内存模型和 GC。  
周三：并发：线程池、锁、volatile、CAS。  
周四：MySQL：索引、事务、锁、MVCC。  
周五：Redis：缓存问题、分布式锁。  
周六：MQ：可靠性、顺序、重复消费。  
周日：整理后端八股第一版。

### 第 12 周：项目包装

周一：整理 SourceLens 架构图。  
周二：整理数据库 ER 图。  
周三：整理接口文档。  
周四：录制 3 分钟演示视频脚本。  
周五：写简历项目描述第一版。  
周六：模拟面试讲项目 3 次。  
周日：v0.3 发布和复盘。

## 6. 第四阶段：第 13-18 周，核心差异化能力

阶段目标：

```text
做出真正能打的大厂项目亮点
Agent 具备多工具、多步骤、可观测、可评测能力
算法累计 300+ 题
开始投递中厂和 AI 应用岗位
```

第 13 周：Issue 拆解 Agent。  
第 14 周：CI 日志诊断 Agent。  
第 15 周：PR Review Agent。  
第 16 周：Agent 权限、安全、审计。  
第 17 周：多模型路由：DeepSeek、Qwen、Kimi、OpenAI 抽象接口。  
第 18 周：Agent 评测集：准备 30 个项目分析问题，记录命中率和失败案例。

每周日必须输出：

```text
1. 一个可演示 Agent 能力
2. 一篇技术文章
3. 一份评测或压测数据
4. 一段项目讲解稿
```

## 7. 第五阶段：第 19-24 周，冲刺大厂候选人状态

阶段目标：

```text
项目达到可投简历水平
算法达到 400-500 题
后端八股能讲
Agent 项目能讲深
开始密集模拟面试和投递
```

第 19 周：高并发压测与优化，目标写出 QPS、P95、P99。  
第 20 周：可观测性，接入日志、指标、trace。  
第 21 周：部署，Docker Compose 一键启动，准备云服务器部署。  
第 22 周：简历打磨，项目描述、技术难点、指标收益。  
第 23 周：模拟面试，后端 5 场、算法 5 场、项目 5 场。  
第 24 周：正式投递，目标中厂、AI 应用公司、大厂外包转正、字节/腾讯/阿里边缘团队。

## 8. 每天学习内容的优先级

如果当天只有 3 小时，保留：

```text
算法 40 分钟
SourceLens 100 分钟
复盘 20 分钟
后端专题 20 分钟
```

如果当天只有 1 小时，保留：

```text
1 道算法题
1 个项目小提交
5 行复盘
```

不要断。断一天容易，断一周就散。

## 9. 到年底必须拿出的量化成果

```text
LeetCode 400+，CodeTop 高频题两遍
SourceLens GitHub 仓库持续迭代
至少 6 个核心模块：扫描、解析、搜索、RAG、Agent、任务系统
至少 3 个 Agent：项目概览、Issue 拆解、CI 诊断或 PR Review
至少 10 篇技术文章
至少 3 份报告：架构报告、压测报告、Agent 评测报告
Docker Compose 一键启动
线上 demo 或本地演示视频
简历项目描述 3 个版本
模拟面试 20 场以上
```

## 10. 投递策略

第 1-2 个月不急着投顶级大厂，先把项目跑起来。

第 3 个月开始投：

```text
本地中小厂后端
AI 应用创业公司
大数据 Java 后端岗位
Agent 应用工程岗位
实习/见习/外包转正机会
```

第 5-6 个月开始冲：

```text
字节后端/AI 应用/火山引擎
腾讯云/CodeBuddy/混元相关应用岗
阿里云/通义应用/淘天技术
MiniMax、智谱、月之暗面、DeepSeek 生态公司
```

你不是靠学历硬冲。你靠作品、表达、算法和工程细节硬冲。

## 11. 每晚复盘模板

复制到每天日志里：

```text
日期：
今日学习时长：

算法：
- 题目：
- 是否独立 AC：
- 错误原因：

后端：
- 学了什么：
- 能不能讲给面试官：

SourceLens：
- 今日 commit：
- 完成接口/模块：
- 遇到的问题：

Agent/大模型：
- 今日概念：
- 项目里如何使用：

明天第一件事：
```

## 12. 你每天最重要的一句话

```text
今天必须让 SourceLens 比昨天更像一个真实产品。
```
