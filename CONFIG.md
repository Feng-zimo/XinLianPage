# 🔑 API配置说明

## 高德地图API配置指南

### 1. 注册高德开放平台账号

访问: https://lbs.amap.com/

1. 点击"注册"按钮
2. 使用手机号或邮箱完成注册
3. 登录控制台

### 2. 创建应用

1. 进入"控制台" → "应用管理" → "我的应用"
2. 点击"创建新应用"
3. 填写应用名称（如：星联守护平台）
4. 选择应用类型：**Web端(JS API)**
5. 提交创建

### 3. 获取Key和安全密钥

1. 在刚创建的应用下，点击"添加Key"
2. Key名称：随意填写（如：StarLink Map Key）
3. 服务平台：选择 **Web端(JS API)**
4. 提交后会生成：
   - **Key**: 一串字母数字组合
   - **安全密钥(Security Code)**: 另一串字符

### 4. 修改项目配置

打开 `index.html` 文件，找到第10-14行：

```html
<script type="text/javascript">
    window._AMapSecurityConfig = {
        securityJsCode: 'your_security_code' // ← 替换这里
    }
</script>
<script src="https://webapi.amap.com/maps?v=2.0&key=your_amap_key"></script>
<!--                                              ↑ 替换这里 -->
```

**示例配置**（假设你的Key是 `abc123def456`，安全密钥是 `xyz789`）：

```html
<script type="text/javascript">
    window._AMapSecurityConfig = {
        securityJsCode: 'xyz789'
    }
</script>
<script src="https://webapi.amap.com/maps?v=2.0&key=abc123def456"></script>
```

### 5. 保存并测试

1. 保存 `index.html` 文件
2. 刷新浏览器页面
3. 如果看到真实地图，说明配置成功！

---

## 🚀 部署到GitHub Pages

### 方法一：通过GitHub网页界面

1. 推送代码到GitHub仓库
2. 进入仓库页面
3. 点击 **Settings** → **Pages**
4. 在 "Source" 下拉菜单选择 **main branch**
5. 点击 **Save**
6. 等待1-2分钟，页面会显示你的网站链接

### 方法二：通过Git命令

```bash
# 确保已安装Git
git add .
git commit -m "Initial commit: StarLink platform"
git push origin main
```

然后在GitHub网页上按上述步骤开启Pages。

### 访问你的网站

部署成功后，访问：
```
https://你的用户名.github.io/XinLianPage/
```

---

## ⚙️ 高级配置（可选）

### 自定义家庭位置

编辑 `app.js` 文件，修改默认坐标：

```javascript
this.config = {
    homeLat: 31.230416,  // 改为你的纬度
    homeLng: 121.473701, // 改为你的经度
    // ...
};
```

**如何获取经纬度？**
1. 打开高德地图: https://www.amap.com/
2. 搜索你家地址
3. 右键点击地图上的位置
4. 选择"这是什么地方？"
5. 复制显示的经纬度

### 集成Server酱微信推送

1. 访问 https://sct.ftqq.com/
2. 微信扫码登录
3. 获取 `SendKey`
4. 修改 `app.js` 中的 `sendNotification()` 方法：

```javascript
sendNotification(title, message) {
    fetch('https://sctapi.ftqq.com/YOUR_SENDKEY.send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: title,
            desp: message
        })
    });
}
```

### 集成钉钉机器人

1. 在钉钉群中添加自定义机器人
2. 获取 Webhook URL
3. 修改推送方法：

```javascript
sendNotification(title, message) {
    fetch('YOUR_DINGTALK_WEBHOOK', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            msgtype: 'markdown',
            markdown: {
                title: title,
                text: `## ${title}\n\n${message}`
            }
        })
    });
}
```

---

## 🐛 常见问题

### Q: 地图不显示？
A: 检查以下几点：
1. 是否正确配置了Key和安全密钥
2. Key的服务类型是否为"Web端(JS API)"
3. 浏览器控制台是否有错误信息
4. 网络连接是否正常

### Q: 报警功能没有声音？
A: 某些浏览器需要用户交互后才能播放音频。先点击页面上的任意按钮即可。

### Q: 如何修改围栏半径？
A: 在"地图视图"面板中，右侧有围栏设置控件，输入数值后点击"更新围栏"。

### Q: 可以监控多个人吗？
A: 当前版本为单人监护。如需多人，可以：
1. 复制多个marker
2. 为每个人维护独立的状态对象
3. 在地图上显示多个位置点

---

## 📞 技术支持

如遇问题，请：
1. 查看浏览器控制台（F12）的错误信息
2. 查阅高德地图官方文档: https://lbs.amap.com/api/javascript-api/summary
3. 提交GitHub Issue

---

<div align="center">

祝使用愉快！🎉

</div>
