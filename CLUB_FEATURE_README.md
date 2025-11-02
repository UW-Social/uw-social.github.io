# Club 功能模块说明

## 概述
已成功模仿 Event 界面创建了完整的 Club（俱乐部）功能模块。

## 新增文件

### 1. 类型定义
- **`src/types/club.ts`** - Club 数据类型定义
  - `Club` 接口：定义俱乐部的数据结构
  - `ClubCategory` 枚举：俱乐部分类
  - `formatClubCategory()` 函数：格式化分类显示

### 2. 状态管理
- **`src/stores/club.ts`** - Club Store (Pinia)
  - `clubs` - 俱乐部列表
  - `fetchClubs()` - 从 Firestore 获取俱乐部
  - `selectClub()` - 选择俱乐部
  - `clearSelectedClubs()` - 清除选择

### 3. 组件

#### ClubCard.vue
- **路径**: `src/components/ClubCard.vue`
- **功能**: 显示单个俱乐部的卡片
- **特性**:
  - 显示俱乐部图片、名称、描述
  - 显示分类、会议时间、地点、成员数
  - 组织者可删除俱乐部
  - 点击打开详情

#### ClubList.vue
- **路径**: `src/components/ClubList.vue`
- **功能**: 显示俱乐部列表
- **特性**:
  - 网格布局展示所有俱乐部
  - 支持按分类筛选
  - 支持模糊搜索（名称、描述、标签）
  - 基于用户兴趣标签的语义排序
  - 响应式设计

#### ClubForm.vue
- **路径**: `src/components/ClubForm.vue`
- **功能**: 创建和编辑俱乐部
- **字段**:
  - 俱乐部名称 *
  - 描述 *
  - 分类 *
  - 会议地点
  - 会议时间
  - 联系邮箱
  - 网站/社交媒体链接
  - 标签
  - 俱乐部图片 URL

### 4. 视图

#### Clubs.vue
- **路径**: `src/views/Clubs.vue`
- **路由**: `/clubs`
- **功能**: 俱乐部主页面
- **特性**:
  - 搜索栏
  - 俱乐部列表展示
  - 点击卡片显示详情弹窗
  - 详情包含：
    - 完整信息展示
    - 加入/退出俱乐部按钮
    - 组织者可编辑
  - 支持 ESC 键关闭详情
  - 响应式设计

## 修改的文件

### 1. 路由配置
- **文件**: `src/router/index.ts`
- **修改**: 添加 `/clubs` 路由

### 2. 导航栏
- **文件**: `src/components/Navbar.vue`
- **修改**: 
  - 移除 CLUBS 的 "under development" 提示
  - 激活 CLUBS 导航链接

### 3. 发布页面
- **文件**: `src/views/Publish.vue`
- **修改**:
  - 添加事件/俱乐部切换按钮
  - 支持创建事件或俱乐部
  - 动态显示对应的表单

## 数据库结构

### Firestore Collection: `clubs`
```typescript
{
  id: string,                    // 自动生成
  name: string,                  // 俱乐部名称
  description: string,           // 描述
  imageUrl?: string,             // 图片 URL
  category: string,              // 分类
  tags?: string[],               // 标签数组
  contactEmail?: string,         // 联系邮箱
  link?: string,                 // 网站链接
  location?: string,             // 会议地点
  meetingSchedule?: string,      // 会议时间
  organizerId: string,           // 组织者 ID
  organizerName?: string,        // 组织者名称
  memberCount?: number,          // 成员数量
  members?: string[],            // 成员 ID 数组
  createdAt: Timestamp,          // 创建时间
  updatedAt?: Timestamp          // 更新时间
}
```

## 功能特性

### 1. 浏览俱乐部
- ✅ 网格布局展示所有俱乐部
- ✅ 按分类筛选
- ✅ 搜索功能（支持名称、描述、标签）
- ✅ 基于用户兴趣的智能排序

### 2. 俱乐部详情
- ✅ 点击卡片查看完整信息
- ✅ 显示所有俱乐部信息
- ✅ 成员数量显示
- ✅ 联系方式和链接

### 3. 创建俱乐部
- ✅ 表单验证
- ✅ 多分类支持
- ✅ 标签系统
- ✅ 图片上传（URL）

### 4. 管理俱乐部
- ✅ 组织者可删除俱乐部
- ✅ 组织者可编辑俱乐部（UI 已准备）
- ⏳ 加入/退出功能（待实现）

### 5. 响应式设计
- ✅ 桌面端优化
- ✅ 平板端优化
- ✅ 移动端优化

## 待实现功能

1. **成员管理**
   - 加入俱乐部功能
   - 退出俱乐部功能
   - 成员列表展示

2. **编辑功能**
   - 俱乐部编辑界面
   - 图片上传到 Firebase Storage

3. **移动端专用视图**
   - `MobileClub.vue`
   - `MobileClubCard.vue`
   - `MobileClubDetail.vue`

4. **增强功能**
   - 俱乐部成员申请审批系统
   - 俱乐部活动发布
   - 俱乐部公告板

## 使用说明

### 访问俱乐部页面
```
点击导航栏的 "CLUBS" 链接，或访问 /#/clubs
```

### 创建俱乐部
```
1. 点击导航栏的 "PUBLISH"
2. 选择 "🏛️ Club" 选项卡
3. 填写俱乐部信息
4. 点击 "Create Club"
```

### 浏览和搜索
```
1. 在俱乐部页面顶部使用搜索框
2. 输入关键词（俱乐部名称、描述、标签）
3. 按 Enter 搜索
```

## 技术栈
- Vue 3 (Composition API)
- TypeScript
- Pinia (状态管理)
- Firebase Firestore
- Fuse.js (模糊搜索)
- ONNX Runtime (语义搜索)

## 样式说明
- 复用了 `eventcard.css` 样式
- 主题色：紫色 (#7c3aed)
- 响应式断点：768px
