# 🌟 星联守护平台 (StarLink)

> **用代码织网，守护万家灯火**  
> 社区独居老人智慧守护系统 - Web版

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue)](https://yourusername.github.io/XinLianPage/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📖 项目简介

**星联守护平台**是一个基于Web技术的社区独居老人智慧监护系统，通过电子围栏、实时定位监测和智能预警算法，为独居老人提供24小时安全守护。

### ✨ 核心功能

- 🗺️ **实时地图可视化**: 集成高德地图API，直观显示被监护人位置
- 🚧 **电子围栏系统**: 自定义安全区域，越界自动报警
- 📊 **生命体征监测**: 模拟心率、步数等健康数据实时展示
- 🚨 **智能预警机制**: 越界检测、跌倒识别等多重安全防护
- 📱 **多渠道通知**: 支持微信、短信等多种报警方式（可扩展）
- 🎮 **功能测试控制台**: 完整的模拟测试环境

---

## 🚀 在线演示

访问 GitHub Pages: [https://yourusername.github.io/XinLianPage/](https://yourusername.github.io/XinLianPage/)

> ⚠️ **注意**: 首次使用需要配置高德地图API密钥（见下方"配置说明"）

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| HTML5 | 页面结构 |
| CSS3 | 样式设计（渐变背景、动画效果） |
| JavaScript (ES6+) | 核心业务逻辑 |
| 高德地图API | 地图服务与定位 |
| GitHub Pages | 免费部署托管 |

---

## 📦 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/XinLianPage.git
cd XinLianPage
```

### 2. 配置高德地图API（可选但推荐）

#### 获取API密钥
1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册账号并创建应用
3. 获取 `Key` 和 `安全密钥(Security Code)`

#### 修改配置文件
编辑 `index.html` 文件，找到以下代码：

```html
<script type="text/javascript">
    window._AMapSecurityConfig = {
        securityJsCode: 'your_security_code' // 替换为你的安全密钥
    }
</script>
<script src="https://webapi.amap.com/maps?v=2.0&key=your_amap_key"></script>
```

将 `your_security_code` 和 `your_amap_key` 替换为你申请的实际值。

### 3. 本地运行

直接双击打开 `index.html` 即可在浏览器中查看（无地图功能）。

或使用本地服务器：

```bash
# Python 3
python -m http.server 8080

# Node.js (需要先安装 http-server)
npx http-server -p 8080
```

然后访问 `http://localhost:8080`

---

## 💡 使用说明

### 监控面板
- 查看实时统计数据（在线人数、预警次数等）
- 监测生命体征（心率、步数、位置状态）
- 使用测试控制台模拟各种场景

### 地图视图
- 查看被监护人实时位置
- 调整电子围栏半径（100-5000米）
- 可视化安全区域范围

### 报警记录
- 查看所有历史报警事件
- 包含时间、类型、详细信息

### 系统设置
- 配置家庭中心坐标（经纬度）
- 设置被监护人信息
- 保存紧急联系电话

---

## 🧪 测试功能

系统提供了完整的模拟测试环境：

1. **模拟正常状态**: 生成家附近的随机位置
2. **模拟越界外出**: 触发电子围栏越界报警
3. **模拟跌倒事件**: 触发紧急警报弹窗
4. **重置模拟**: 清空所有测试数据

所有操作都会在"系统日志"中实时记录。

---

## 📸 项目截图

### 监控面板
![Dashboard](screenshots/dashboard.png)

### 地图视图
![Map View](screenshots/map.png)

### 报警弹窗
![Alert Modal](screenshots/alert.png)

> 📝 提示: 请将实际截图放入 `screenshots/` 文件夹

---

## 🔧 扩展开发

### 集成真实推送服务

#### Server酱（微信推送）
修改 `app.js` 中的 `sendNotification()` 方法：

```javascript
sendNotification(title, message) {
    fetch('https://sc.ftqq.com/YOUR_SCKEY.send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: title,
            desp: message
        })
    });
}
```

#### 钉钉机器人
```javascript
sendNotification(title, message) {
    fetch('YOUR_DINGTALK_WEBHOOK_URL', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            msgtype: 'text',
            text: {
                content: `${title}\n${message}`
            }
        })
    });
}
```

### 接入真实硬件数据

可以通过以下方式接入真实传感器数据：
- 智能手表/手环的蓝牙API
- ESP32 + GPS模块通过WebSocket传输
- 手机浏览器Geolocation API

---

## 📝 算法说明

### 距离计算（Haversine公式）

系统使用球面三角学中的Haversine公式计算两点间的大圆距离：

```javascript
calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // 地球半径（米）
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
```

**优势**: 
- 精度高，适合短距离计算
- 考虑地球曲率
- 计算效率高

---

## 🎯 应用场景

1. **社区养老**: 网格员集中监控多位独居老人
2. **家庭看护**: 子女远程关注父母安全
3. **特殊人群**: 阿尔茨海默症患者防走失
4. **儿童安全**: 幼儿园/学校周边安全监护

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 👨‍💻 作者

**你的名字**
- GitHub: [@yourusername](https://github.com/yourusername)
- 学校: XXXX中学

---

## 🙏 致谢

- 感谢 [高德地图](https://lbs.amap.com/) 提供免费地图API
- 感谢 [GitHub Pages](https://pages.github.com/) 提供托管服务
- 感谢所有开源项目的贡献者

---

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件至: your.email@example.com

---

<div align="center">

**用科技守护每一份温暖 ❤️**

Made with 💜 by StarLink Team

</div>
