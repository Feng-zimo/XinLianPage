// 星联守护平台 - 核心JavaScript逻辑
// StarLink Community Elder Care System

class StarLinkSystem {
    constructor() {
        // 系统配置
        this.config = {
            homeLat: 31.230416,  // 家庭中心纬度（上海示例）
            homeLng: 121.473701, // 家庭中心经度
            fenceRadius: 500,    // 电子围栏半径（米）
            elderName: '张爷爷',
            contactPhone: '13800138000'
        };

        // 系统状态
        this.state = {
            isMonitoring: false,
            currentLat: this.config.homeLat,
            currentLng: this.config.homeLng,
            heartRate: 72,
            steps: 0,
            activityStatus: '静止',
            distanceFromHome: 0,
            warningCount: 0,
            alertCount: 0,
            startTime: Date.now(),
            alerts: []
        };

        // 地图实例
        this.map = null;
        this.marker = null;
        this.circle = null;

        // 初始化系统
        this.init();
    }

    // 初始化系统
    init() {
        this.log('系统初始化...', 'info');
        this.bindEvents();
        this.startSimulation();
        this.updateStats();
        this.initMap();
        this.log('系统启动成功！', 'success');
    }

    // 绑定事件
    bindEvents() {
        // 导航按钮
        document.getElementById('dashboardBtn').addEventListener('click', () => this.switchPanel('dashboard'));
        document.getElementById('mapBtn').addEventListener('click', () => this.switchPanel('mapPanel'));
        document.getElementById('alertBtn').addEventListener('click', () => this.switchPanel('alerts'));
        document.getElementById('settingsBtn').addEventListener('click', () => this.switchPanel('settings'));

        // 模拟控制按钮
        document.getElementById('simulateNormal').addEventListener('click', () => this.simulateNormal());
        document.getElementById('simulateLeave').addEventListener('click', () => this.simulateLeave());
        document.getElementById('simulateFall').addEventListener('click', () => this.simulateFall());
        document.getElementById('resetSimulation').addEventListener('click', () => this.resetSimulation());

        // 围栏设置
        document.getElementById('updateFence').addEventListener('click', () => this.updateFence());

        // 保存设置
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());

        // 报警弹窗
        document.querySelector('.close-btn').addEventListener('click', () => this.closeAlertModal());
        document.getElementById('acknowledgeAlert').addEventListener('click', () => this.acknowledgeAlert());
        document.getElementById('callEmergency').addEventListener('click', () => this.callEmergency());
    }

    // 切换面板
    switchPanel(panelId) {
        // 隐藏所有面板
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // 移除所有按钮激活状态
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 显示目标面板
        document.getElementById(panelId).classList.add('active');

        // 激活对应按钮
        const btnMap = {
            'dashboard': 'dashboardBtn',
            'mapPanel': 'mapBtn',
            'alerts': 'alertBtn',
            'settings': 'settingsBtn'
        };
        document.getElementById(btnMap[panelId]).classList.add('active');

        this.log(`切换到${panelId}面板`, 'info');
    }

    // 初始化地图
    initMap() {
        try {
            // 如果高德地图API加载成功
            if (typeof AMap !== 'undefined') {
                this.map = new AMap.Map('map', {
                    zoom: 15,
                    center: [this.config.homeLng, this.config.homeLat]
                });

                // 添加标记
                this.marker = new AMap.Marker({
                    position: [this.config.homeLng, this.config.homeLat],
                    title: this.config.elderName
                });
                this.map.add(this.marker);

                // 添加电子围栏圆圈
                this.circle = new AMap.Circle({
                    center: [this.config.homeLng, this.config.homeLat],
                    radius: this.config.fenceRadius,
                    strokeColor: '#FF33FF',
                    strokeWeight: 2,
                    strokeOpacity: 0.8,
                    fillOpacity: 0.2,
                    fillColor: '#1791fc',
                    zIndex: 50
                });
                this.map.add(this.circle);

                this.log('地图初始化成功', 'success');
            } else {
                this.log('地图API未加载，使用模拟模式', 'warning');
                this.createMockMap();
            }
        } catch (error) {
            this.log(`地图初始化失败: ${error.message}`, 'error');
            this.createMockMap();
        }
    }

    // 创建模拟地图（当API不可用时）
    createMockMap() {
        const mapDiv = document.getElementById('map');
        mapDiv.innerHTML = `
            <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        display: flex; justify-content: center; align-items: center; color: white; flex-direction: column;">
                <div style="font-size: 48px; margin-bottom: 20px;">🗺️</div>
                <h3>地图模拟视图</h3>
                <p>当前位置: ${this.state.currentLat.toFixed(6)}, ${this.state.currentLng.toFixed(6)}</p>
                <p>距离家: ${this.state.distanceFromHome.toFixed(0)} 米</p>
                <div style="margin-top: 20px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 8px;">
                    <p>提示: 请在index.html中配置高德地图API密钥以启用真实地图</p>
                </div>
            </div>
        `;
    }

    // 更新电子围栏
    updateFence() {
        const radius = parseInt(document.getElementById('fenceRadius').value);
        if (radius >= 100 && radius <= 5000) {
            this.config.fenceRadius = radius;
            
            if (this.circle) {
                this.circle.setRadius(radius);
            }
            
            this.log(`电子围栏半径更新为: ${radius}米`, 'success');
            this.checkDistance();
        } else {
            this.log('围栏半径必须在100-5000米之间', 'error');
        }
    }

    // 保存设置
    saveSettings() {
        this.config.homeLat = parseFloat(document.getElementById('homeLat').value);
        this.config.homeLng = parseFloat(document.getElementById('homeLng').value);
        this.config.elderName = document.getElementById('elderName').value;
        this.config.contactPhone = document.getElementById('contactPhone').value;

        this.log('设置已保存', 'success');
        
        // 更新地图中心点
        if (this.map) {
            this.map.setCenter([this.config.homeLng, this.config.homeLat]);
            if (this.marker) {
                this.marker.setPosition([this.config.homeLng, this.config.homeLat]);
            }
            if (this.circle) {
                this.circle.setCenter([this.config.homeLng, this.config.homeLat]);
            }
        }
    }

    // 开始模拟数据流
    startSimulation() {
        setInterval(() => {
            this.updateVitalSigns();
            this.updateStats();
            this.checkDistance();
        }, 2000);
    }

    // 更新生命体征数据
    updateVitalSigns() {
        // 模拟心率变化（60-100之间）
        this.state.heartRate = Math.floor(Math.random() * 40) + 60;
        
        // 模拟步数增加
        if (this.state.activityStatus === '行走') {
            this.state.steps += Math.floor(Math.random() * 10) + 5;
        }

        // 更新时间
        const now = new Date();
        const timeStr = now.toLocaleTimeString('zh-CN');

        // 更新DOM
        document.getElementById('heartRate').textContent = this.state.heartRate;
        document.getElementById('steps').textContent = this.state.steps;
        document.getElementById('activityStatus').textContent = this.state.activityStatus;
        document.getElementById('lastUpdate').textContent = `更新于: ${timeStr}`;
        document.getElementById('distanceInfo').textContent = `距离家: ${this.state.distanceFromHome.toFixed(0)}米`;
    }

    // 更新统计数据
    updateStats() {
        document.getElementById('onlineCount').textContent = '1';
        document.getElementById('warningCount').textContent = this.state.warningCount;
        document.getElementById('alertCount').textContent = this.state.alertCount;

        // 计算运行时长
        const uptime = Math.floor((Date.now() - this.state.startTime) / 3600000);
        document.getElementById('uptime').textContent = `${uptime}小时`;
    }

    // 计算两点之间的距离（Haversine公式）
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

    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    // 检查距离并触发警报
    checkDistance() {
        this.state.distanceFromHome = this.calculateDistance(
            this.config.homeLat, 
            this.config.homeLng,
            this.state.currentLat, 
            this.state.currentLng
        );

        const statusEl = document.getElementById('locationStatus');
        
        if (this.state.distanceFromHome > this.config.fenceRadius) {
            statusEl.textContent = '⚠️ 越界';
            statusEl.style.color = '#ff6b6b';
            
            if (!this.state.isAlerting) {
                this.triggerAlert('越界警告', `${this.config.elderName}已离开安全区域，当前距离家${this.state.distanceFromHome.toFixed(0)}米`);
            }
        } else {
            statusEl.textContent = '✅ 正常';
            statusEl.style.color = '#51cf66';
        }
    }

    // 模拟正常状态
    simulateNormal() {
        this.state.currentLat = this.config.homeLat + (Math.random() - 0.5) * 0.001;
        this.state.currentLng = this.config.homeLng + (Math.random() - 0.5) * 0.001;
        this.state.activityStatus = '正常活动';
        
        this.updateMarkerPosition();
        this.log('模拟: 正常状态', 'info');
    }

    // 模拟越界外出
    simulateLeave() {
        // 生成一个超出围栏的位置
        const angle = Math.random() * 2 * Math.PI;
        const distance = this.config.fenceRadius + 200 + Math.random() * 300;
        
        this.state.currentLat = this.config.homeLat + (distance / 111320) * Math.cos(angle);
        this.state.currentLng = this.config.homeLng + (distance / (111320 * Math.cos(this.toRad(this.config.homeLat)))) * Math.sin(angle);
        this.state.activityStatus = '外出';
        
        this.updateMarkerPosition();
        this.log('模拟: 越界外出', 'warning');
    }

    // 模拟跌倒事件
    simulateFall() {
        this.state.activityStatus = '⚠️ 疑似跌倒';
        this.triggerAlert('跌倒检测', `检测到${this.config.elderName}可能跌倒，请立即确认！`);
        this.log('模拟: 跌倒事件', 'error');
    }

    // 重置模拟
    resetSimulation() {
        this.state.currentLat = this.config.homeLat;
        this.state.currentLng = this.config.homeLng;
        this.state.activityStatus = '静止';
        this.state.steps = 0;
        this.state.warningCount = 0;
        this.state.alertCount = 0;
        this.state.alerts = [];
        
        this.updateMarkerPosition();
        this.updateAlertList();
        this.log('模拟已重置', 'info');
    }

    // 更新标记位置
    updateMarkerPosition() {
        if (this.marker) {
            this.marker.setPosition([this.state.currentLng, this.state.currentLat]);
            this.map.setCenter([this.state.currentLng, this.state.currentLat]);
        }
    }

    // 触发警报
    triggerAlert(title, message) {
        this.state.isAlerting = true;
        this.state.alertCount++;
        this.state.warningCount++;

        // 添加到警报历史
        const alert = {
            type: title,
            message: message,
            time: new Date().toLocaleString('zh-CN'),
            acknowledged: false
        };
        this.state.alerts.unshift(alert);
        this.updateAlertList();

        // 显示警报弹窗
        document.getElementById('alertTitle').textContent = title;
        document.getElementById('alertMessage').textContent = message;
        document.getElementById('alertModal').classList.remove('hidden');

        // 播放提示音（如果浏览器支持）
        this.playAlertSound();

        // 模拟发送通知
        this.sendNotification(title, message);

        this.log(`警报触发: ${title}`, 'error');

        // 3秒后重置警报状态
        setTimeout(() => {
            this.state.isAlerting = false;
        }, 3000);
    }

    // 更新警报列表
    updateAlertList() {
        const alertList = document.getElementById('alertList');
        
        if (this.state.alerts.length === 0) {
            alertList.innerHTML = '<div class="empty-state">暂无报警记录</div>';
            return;
        }

        alertList.innerHTML = this.state.alerts.map(alert => `
            <div class="alert-item">
                <div class="alert-header">
                    <span class="alert-type">${alert.type}</span>
                    <span class="alert-time">${alert.time}</span>
                </div>
                <div class="alert-details">${alert.message}</div>
            </div>
        `).join('');
    }

    // 关闭警报弹窗
    closeAlertModal() {
        document.getElementById('alertModal').classList.add('hidden');
    }

    // 确认警报
    acknowledgeAlert() {
        this.closeAlertModal();
        this.log('警报已确认', 'info');
    }

    // 拨打紧急电话
    callEmergency() {
        window.location.href = `tel:${this.config.contactPhone}`;
        this.log(`正在拨打紧急电话: ${this.config.contactPhone}`, 'warning');
    }

    // 发送通知（模拟）
    sendNotification(title, message) {
        // 这里可以集成真实的推送服务，如Server酱、钉钉机器人等
        console.log('📱 推送通知:', { title, message });
        
        // 模拟Webhook调用
        /*
        fetch('https://sc.ftqq.com/YOUR_KEY.send', {
            method: 'POST',
            body: JSON.stringify({
                text: title,
                desp: message
            })
        });
        */
    }

    // 播放提示音
    playAlertSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('音频播放失败:', error);
        }
    }

    // 日志系统
    log(message, type = 'info') {
        const logContainer = document.getElementById('logContainer');
        const time = new Date().toLocaleTimeString('zh-CN');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <span class="log-time">[${time}]</span>
            <span class="log-${type}">${message}</span>
        `;
        logContainer.insertBefore(entry, logContainer.firstChild);

        // 限制日志数量
        while (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.lastChild);
        }

        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// 页面加载完成后初始化系统
document.addEventListener('DOMContentLoaded', () => {
    window.starLinkSystem = new StarLinkSystem();
});
