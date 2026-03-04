# XJTLU Calendar Exporter (XJTLU 日历导出工具)

[English](README.md) | [中文](README_zh.md)

可以在[Release](https://github.com/Zerlight/XJTLU-Calendar/releases)中下载可执行文件直接运行，免去配置环境的烦恼。

一款自动化、注重隐私保护的工具，专为西交利物浦大学（XJTLU）的学生设计。从 E-Bridge 系统中提取个人课程表，并将其转换为标准的 `.ics` 日历文件。这些文件可以轻松导入到 Apple 日历、Google 日历、Outlook 等主流日历应用中。

该工具解析官方的大学校历（University Academic Calendar），精准计算每个教学周的具体日期，并完美处理节假日、阅读周（Reading Week）以及跨月的日期计算。

## 功能特性

- **自动提取：** 使用 Puppeteer 在后台通过 Google Chrome/Chromium 自动导航并获取 E-Bridge 课程表。
- **精准日期映射：** 直接解析实时的 XJTLU 校历，准确生成每周的 ISO 日期时间，避免使用硬编码计算误差。
- **学期支持：** 支持自由选择你需要导出的具体学期。
- **自定义日程信息：** 支持使用模板变量（`${name}`, `${activityType}`, `${moduleId}`, `${staff}`, `${location}`, `${week}`）自定义日程在你日历中的显示方式。
- **自定义提醒：** 为课程设置你偏好的提醒时间（例如，上课前 15 分钟）。
- **隐私优先：** 所有的登录和身份验证完全在本地浏览器实例中进行。没有任何认证凭据或日程数据会被发送到外部服务器。
- **现代 UI：** 提供了一个基于 Shadcn 风格的、简洁清爽的配置页面。

## 安装指南

### 前置要求

- [Node.js](https://nodejs.org/)（推荐使用 v16.x 或更新版本）
- [pnpm](https://pnpm.io/)（或 `npm` / `yarn`）
- 你的计算机上需要安装 Google Chrome 浏览器（该工具会自动查找系统中的标准安装路径）。

### 环境配置

1. **克隆代码库**（或直接下载源代码）：
   ```bash
   git clone <repository_url>
   cd XJTLU-Calendar
   ```

2. **安装依赖：**
   ```bash
   pnpm install
   ```
   *（如果你没有安装 pnpm，也可以使用 `npm install`）*

## 使用说明

1. **启动应用：**
   ```bash
   pnpm start
   ```
   *（或使用 `npm start`）*

2. **打开配置页面：**
   应用会启动一个本地服务器，通常地址是 `http://localhost:3000`。该工具应会自动弹出一个指向该页面的 Chrome 浏览器窗口。如果没有，请手动在浏览器中打开此地址。

3. **配置日历内容：**
   填写相关模板配置，包括标题（Titles）、地点（Locations）、描述（Descriptions）以及提醒时间（Reminders）。通过“预览”可以直接查看日程生成的最终样式。选择你需要导出的**学期（Semester）**。

4. **连接到 E-Bridge：**
   点击 **"Continue"** 阅读说明，然后点击 **"Launch & Connect E-Bridge"**。

5. **登录：**
   一个全新的浏览器标签页会打开 E-Bridge 登录界面。请像平时一样登录你的账号。**请勿关闭该浏览器标签或进行过多无关的点击操作。**

6. **等待提取完成：**
   登录成功后，请切回到配置页面（Configuration Dashboard）标签页查看进度。脚本将在后台不可见地自动浏览校历和你的个人课程表。

7. **下载日历文件：**
   提取完成后，界面会显示一个下载按钮。保存 `xjtlu-calendar.ics` 文件，并将其导入到你常用的日历应用中！

## 开源协议

本项目采用 MIT 协议开源。详情请参阅 [LICENSE](LICENSE) 文件。使用本工具的风险需自行承担。

## 贡献指南

我们非常欢迎提交 Pull Request。如果你计划进行重大更改，请先提交 Issue 讨论你想要修改的内容。
