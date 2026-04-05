// 星联守护平台 - 核心JavaScript逻辑
// StarLink Community Elder Care System
// 版本: 2.0 - 支持URL路由和真实GPS定位

class StarLinkSystem {
    constructor() {
        // 解析URL参数
        this.route = this.parseURL();
        
        // 系统配置
        this.config = {
            homeLat: 28.6564,    // 台州纬度（默认）
            homeLng: 121.4206,   // 台州经度
            fenceRadius: 500,
            elderName: '被监护人',
            contactPhone: '13800138000',
            updateInterval: 5000  // GPS更新间隔（5秒）
        };

        // 系统状态
        this.state = {
            isMonitoring: false,
            currentLat: null,
            currentLng: null,
            accuracy: 0,
            speed: 0,
            timestamp: null,
            distanceFromHome: 0,
            warningCount: 0,
            alertCount: 0,
            startTime: Date.now(),
            alerts: [],
            watchId: null  // GPS监听ID
        };

        // 地图实例
        this.map = null;
        this.marker = null;
        this.circle = null;

        // 初始化系统
        this.init();
    }

    // 解析URL参数
    parseURL() {
        const params = new URLSearchParams(window.location.search);
        const app = params.get('app');
        
        // 根据URL参数返回不同角色
        if (app === '监护' || app === 'monitor') {
            return 'monitor';  // 监护端
        } else if (app === '看管' || app === 'elder') {
            return 'elder';    // 老人端（位置共享）
        }
        return 'monitor';  // 默认监护端
    }

    // 初始化系统
    init() {
        this.log(`系统初始化... 角色: ${this.route === 'monitor' ? '监护端' : '老人端'}`, 'info');
        
        if (this.route === 'elder') {
            this.initElderMode();  // 老人端模式
        } else {
            this.initMonitorMode(); // 监护端模式
        }
    }

    // 老人端模式（位置共享）
    initElderMode() {
        this.log('启动老人端模式', 'info');
        this.setupElderUI();
        this.startGPSWatch();
    }

    // 监护端模式（完整功能）
    initMonitorMode() {
        this.log('启动监护端模式', 'info');
        this.bindEvents();
        this.startSimulation();
        this.updateStats();
        this.initMap();
        this.log('监护端启动成功！', 'success');
    }

    // 设置老人端UI
    setupElderUI() {
        // 简化界面，只显示位置和状态
        document.body.innerHTML = `
            <div class="elder-container" style="padding: 20px; font-family: sans-serif;">
                <div class="elder-header" style="text-align: center; margin-bottom: 20px;">
                    <h1>📍 星联守护 - 位置共享</h1>
                    <p>正在共享您的位置给家人</p>
                </div>
                
                <div class="elder-status" style="display: flex; justify-content: space-around; margin-bottom: 20px;">
                    <div class="status-item" id="gpsStatus" style="text-align: center;">
                        <div class="status-icon">📡</div>
                        <div class="status-text">
                            <h3>GPS状态</h3>
                            <p id="gpsStatusText">正在获取位置...</p>
                        </div>
                    </div>
                    
                    <div class="status-item" id="shareStatus" style="text-align: center;">
                        <div class="status-icon"></div>
                        <div class="status-text">
                            <h3>共享状态</h3>
                            <p id="shareStatusText">等待连接...</p>
                        </div>
                    </div>
                    
                    <div class="status-item" id="batteryStatus" style="text-align: center;">
                        <div class="status-icon">🔋</div>
                        <div class="status-text">
                            <h3>电量</h3>
                            <p id="batteryText">检测中...</p>
                        </div>
                    </div>
                </div>
                
                <div class="elder-map" style="height: 300px; background: #eee; border-radius: 8px; margin-bottom: 20px;">
                    <div id="elderMap" style="width: 100%; height: 100%;"></div>
                </div>
                
                <div class="elder-info" style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <h3>📊 位置信息</h3>
                    <p>纬度: <span id="elderLat">--</span></p>
                    <p>经度: <span id="elderLng">--</span></p>
                    <p>精度: <span id="elderAccuracy">--</span></p>
                    <p>更新时间: <span id="elderTime">--</span></p>
                </div>
                
                <div class="elder-footer" style="margin-top: 20px; text-align: center;">
                    <p>⚠️ 请保持此页面开启以确保位置持续共享</p>
                    <button id="stopShare" class="btn btn-danger" style="padding: 10px 20px; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer;">停止共享</button>
                </div>
            </div>
        `;

        // 绑定事件
        document.getElementById('stopShare').addEventListener('click', () => {
            this.stopGPSWatch();
            alert('位置共享已停止');
        });

        // 初始化老人端地图
        setTimeout(() => this.initElderMap(), 100);
        
        // 检测电量
        this.checkBattery();
    }

    // 启动GPS实时监控
    startGPSWatch() {
        if ('geolocation' in navigator) {
            this.log('开始GPS位置监控', 'info');
            
            this.state.watchId = navigator.geolocation.watchPosition(
                (position) => this.onGPSSuccess(position),
                (error) => this.onGPSError(error),
                {
                    enableHighAccuracy: true,  // 高精度
                    timeout: 10000,            // 10秒超时
                    maximumAge: 0              // 不使用缓存
                }
            );

            document.getElementById('gpsStatusText').textContent = 'GPS已开启';
            document.getElementById('shareStatusText').textContent = '正在共享位置...';
        } else {
            this.log('浏览器不支持GPS定位', 'error');
            document.getElementById('gpsStatusText').textContent = 'GPS不可用';
        }
    }

    // GPS成功回调
    onGPSSuccess(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const speed = position.coords.speed || 0;

        this.state.currentLat = lat;
        this.state.currentLng = lng;
        this.state.accuracy = accuracy;
        this.state.speed = speed;
        this.state.timestamp = new Date();

        // 更新UI
        document.getElementById('elderLat').textContent = lat.toFixed(6);
        document.getElementById('elderLng').textContent = lng.toFixed(6);
        document.getElementById('elderAccuracy').textContent = `±${accuracy.toFixed(0)}米`;
        document.getElementById('elderTime').textContent = this.state.timestamp.toLocaleTimeString('zh-CN');

        // 计算与家的距离
        this.state.distanceFromHome = this.calculateDistance(
            this.config.homeLat, 
            this.config.homeLng,
            lat, 
            lng
        );

        // 更新地图标记
        this.updateElderMarker(lat, lng);

        // 检查是否越界
        this.checkDistance();

        // 模拟上传到服务器（实际项目中这里应该调用API）
        this.uploadPosition(lat, lng);

        this.log(`位置更新: ${lat.toFixed(6)}, ${lng.toFixed(6)}, 精度: ±${accuracy.toFixed(0)}米`, 'info');
    }

    // GPS错误处理
    onGPSError(error) {
        let message = 'GPS错误';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = '用户拒绝了位置请求';
                break;
            case error.POSITION_UNAVAILABLE:
                message = '位置信息不可用';
                break;
            case error.TIMEOUT:
                message = '请求超时';
                break;
        }
        
        this.log(message, 'error');
        document.getElementById('gpsStatusText').textContent = message;
    }

    // 停止GPS监控
    stopGPSWatch() {
        if (this.state.watchId !== null) {
            navigator.geolocation.clearWatch(this.state.watchId);
            this.state.watchId = null;
            this.log('GPS监控已停止', 'warning');
        }
    }

    // 更新老人端地图标记
    updateElderMarker(lat, lng) {
        if (this.marker) {
            this.marker.setPosition([lng, lat]);
            this.map.setCenter([lng, lat]);
        }
    }

    // 初始化老人端地图
    initElderMap() {
        try {
            if (typeof AMap !== 'undefined') {
                this.map = new AMap.Map('elderMap', {
                    zoom: 16,
                    center: [this.config.homeLng, this.config.homeLat]
                });

                this.marker = new AMap.Marker({
                    position: [this.config.homeLng, this.config.homeLat],
                    title: '我的位置'
                });
                this.map.add(this.marker);

                this.log('老人端地图初始化成功', 'success');
            } else {
                this.createMockElderMap();
            }
        } catch (error) {
            this.log(`地图初始化失败: ${error.message}`, 'error');
            this.createMockElderMap();
        }
    }

    // 创建模拟老人端地图
    createMockElderMap() {
        const mapDiv = document.getElementById('elderMap');
        if (mapDiv) {
            mapDiv.innerHTML = `
                <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            display: flex; justify-content: center; align-items: center; color: white; flex-direction: column;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🗺️</div>
                    <h3>地图加载中...</h3>
                </div>
            `;
        }
    }

    // 检测电量
    async checkBattery() {
        try {
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery();
                const level = Math.round(battery.level * 100);
                const charging = battery.charging ? '充电中' : '未充电';
                document.getElementById('batteryText').textContent = `${level}% (${charging})`;
                
                battery.addEventListener('levelchange', () => {
                    const newLevel = Math.round(battery.level * 100);
                    document.getElementById('batteryText').textContent = `${newLevel}% (${charging})`;
                });
            }
        } catch (error) {
            document.getElementById('batteryText').textContent = '无法检测';
        }
    }

    // 模拟上传位置到服务器
    uploadPosition(lat, lng) {
        // 实际项目中应该调用真实的API
        // fetch('/api/upload-position', {
        //     method: 'POST',
        //     body: JSON.stringify({ lat, lng, timestamp: Date.now() })
        // });
        
        // 使用localStorage模拟数据存储
        const positionData = {
            lat,
            lng,
            timestamp: Date.now()
        };
        localStorage.setItem('elder_position', JSON.stringify(positionData));
    }

    // 检查距离并触发警报
    checkDistance() {
        const statusEl = document.getElementById('shareStatusText');
        
        if (this.state.distanceFromHome > this.config.fenceRadius) {
            if (statusEl) {
                statusEl.textContent = `⚠️ 已越界 ${this.state.distanceFromHome.toFixed(0)}米`;
                statusEl.style.color = '#ff6b6b';
            }
            
            if (!this.state.isAlerting) {
                this.triggerAlert('越界警告', `已离开安全区域，当前距离家${this.state.distanceFromHome.toFixed(0)}米`);
            }
        } else {
            if (statusEl) {
                statusEl.textContent = '✅ 在安全区域内';
                statusEl.style.color = '#51cf66';
            }
        }
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

    // 触发警报
    triggerAlert(title, message) {
        this.state.isAlerting = true;
        this.state.alertCount++;
        this.state.warningCount++;

        const alert = {
            type: title,
            message: message,
            time: new Date().toLocaleString('zh-CN'),
            acknowledged: false
        };
        this.state.alerts.unshift(alert);

        this.log(`警报触发: ${title}`, 'error');

        // 3秒后重置警报状态
        setTimeout(() => {
            this.state.isAlerting = false;
        }, 3000);
    }

    // 日志系统
    log(message, type = 'info') {
        const time = new Date().toLocaleTimeString('zh-CN');
        console.log(`[${type.toUpperCase()}] [${time}] ${message}`);
        
        // 监护端才显示日志
        if (this.route === 'monitor') {
            const logContainer = document.getElementById('logContainer');
            if (logContainer) {
                const entry = document.createElement('div');
                entry.className = 'log-entry';
                entry.innerHTML = `
                    <span class="log-time">[${time}]</span>
                    <span class="log-${type}">${message}</span>
                `;
                logContainer.insertBefore(entry, logContainer.firstChild);
            }
        }
    }

    // ... (保留原有的监护端方法)
    bindEvents() {
        document.getElementById('dashboardBtn').addEventListener('click', () => this.switchPanel('dashboard'));
        document.getElementById('mapBtn').addEventListener('click', () => this.switchPanel('mapPanel'));
        document.getElementById('alertBtn').addEventListener('click', () => this.switchPanel('alerts'));
        document.getElementById('settingsBtn').addEventListener('click', () => this.switchPanel('settings'));

        document.getElementById('simulateNormal').addEventListener('click', () => this.simulateNormal());
        document.getElementById('simulateLeave').addEventListener('click', () => this.simulateLeave());
        document.getElementById('simulateFall').addEventListener('click', () => this.simulateFall());
        document.getElementById('resetSimulation').addEventListener('click', () => this.resetSimulation());

        document.getElementById('updateFence').addEventListener('click', () => this.updateFence());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());

        document.querySelector('.close-btn').addEventListener('click', () => this.closeAlertModal());
        document.getElementById('acknowledgeAlert').addEventListener('click', () => this.acknowledgeAlert());
        document.getElementById('callEmergency').addEventListener('click', () => this.callEmergency());
    }

    switchPanel(panelId) {
        document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(panelId).classList.add('active');
        
        const btnMap = {
            'dashboard': 'dashboardBtn',
            'mapPanel': 'mapBtn',
            'alerts': 'alertBtn',
            'settings': 'settingsBtn'
        };
        document.getElementById(btnMap[panelId]).classList.add('active');
    }

    initMap() {
        try {
            if (typeof AMap !== 'undefined') {
                this.map = new AMap.Map('map', {
                    zoom: 15,
                    center: [this.config.homeLng, this.config.homeLat]
                });

                this.marker = new AMap.Marker({
                    position: [this.config.homeLng, this.config.homeLat],
                    title: this.config.elderName
                });
                this.map.add(this.marker);

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

    createMockMap() {
        const mapDiv = document.getElementById('map');
        if (mapDiv) {
            mapDiv.innerHTML = `
                <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            display: flex; justify-content: center; align-items: center; color: white; flex-direction: column;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🗺️</div>
                    <h3>地图模拟视图</h3>
                    <p>当前位置: ${this.state.currentLat ? this.state.currentLat.toFixed(6) : '--'}, ${this.state.currentLng ? this.state.currentLng.toFixed(6) : '--'}</p>
                    <p>距离家: ${this.state.distanceFromHome.toFixed(0)} 米</p>
                </div>
            `;
        }
    }

    updateFence() {
        const radius = parseInt(document.getElementById('fenceRadius').value);
        if (radius >= 100 && radius <= 5000) {
            this.config.fenceRadius = radius;
            if (this.circle) {
                this.circle.setRadius(radius);
            }
            this.log(`电子围栏半径更新为: ${radius}米`, 'success');
        } else {
            this.log('围栏半径必须在100-5000米之间', 'error');
        }
    }

    saveSettings() {
        this.config.homeLat = parseFloat(document.getElementById('homeLat').value);
        this.config.homeLng = parseFloat(document.getElementById('homeLng').value);
        this.config.elderName = document.getElementById('elderName').value;
        this.config.contactPhone = document.getElementById('contactPhone').value;

        this.log('设置已保存', 'success');
        
        if (this.map) {
            this.map.setCenter([this.config.homeLng, this.config.homeLat]);
            if (this.marker) this.marker.setPosition([this.config.homeLng, this.config.homeLat]);
            if (this.circle) this.circle.setCenter([this.config.homeLng, this.config.homeLat]);
        }
    }

    startSimulation() {
        // 监护端从localStorage读取老人位置
        setInterval(() => {
            const savedPosition = localStorage.getItem('elder_position');
            if (savedPosition) {
                const pos = JSON.parse(savedPosition);
                this.state.currentLat = pos.lat;
                this.state.currentLng = pos.lng;
                this.updateMarkerPosition();
            }
            
            this.updateStats();
        }, 3000);
    }

    updateStats() {
        document.getElementById('onlineCount').textContent = '1';
        document.getElementById('warningCount').textContent = this.state.warningCount;
        document.getElementById('alertCount').textContent = this.state.alertCount;

        const uptime = Math.floor((Date.now() - this.state.startTime) / 3600000);
        document.getElementById('uptime').textContent = `${uptime}小时`;
    }

    updateMarkerPosition() {
        if (this.marker && this.state.currentLat && this.state.currentLng) {
            this.marker.setPosition([this.state.currentLng, this.state.currentLat]);
            this.map.setCenter([this.state.currentLng, this.state.currentLat]);
            
            // 更新距离显示
            if (this.config.homeLat && this.config.homeLng) {
                this.state.distanceFromHome = this.calculateDistance(
                    this.config.homeLat, 
                    this.config.homeLng,
                    this.state.currentLat, 
                    this.state.currentLng
                );
                document.getElementById('distanceInfo').textContent = `距离家: ${this.state.distanceFromHome.toFixed(0)}米`;
            }
        }
    }

    simulateNormal() {
        this.state.currentLat = this.config.homeLat + (Math.random() - 0.5) * 0.001;
        this.state.currentLng = this.config.homeLng + (Math.random() - 0.5) * 0.001;
        this.updateMarkerPosition();
        this.log('模拟: 正常状态', 'info');
    }

    simulateLeave() {
        const angle = Math.random() * 2 * Math.PI;
        const distance = this.config.fenceRadius + 200 + Math.random() * 300;
        
        this.state.currentLat = this.config.homeLat + (distance / 111320) * Math.cos(angle);
        this.state.currentLng = this.config.homeLng + (distance / (111320 * Math.cos(this.toRad(this.config.homeLat)))) * Math.sin(angle);
        this.updateMarkerPosition();
        this.log('模拟: 越界外出', 'warning');
    }

    simulateFall() {
        this.triggerAlert('跌倒检测', `检测到${this.config.elderName}可能跌倒，请立即确认！`);
        this.log('模拟: 跌倒事件', 'error');
    }

    resetSimulation() {
        this.state.currentLat = this.config.homeLat;
        this.state.currentLng = this.config.homeLng;
        this.state.warningCount = 0;
        this.state.alertCount = 0;
        this.state.alerts = [];
        
        this.updateMarkerPosition();
        this.updateAlertList();
        this.log('模拟已重置', 'info');
    }

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

    closeAlertModal() {
        document.getElementById('alertModal').classList.add('hidden');
    }

    acknowledgeAlert() {
        this.closeAlertModal();
        this.log('警报已确认', 'info');
    }

    callEmergency() {
        window.location.href = `tel:${this.config.contactPhone}`;
        this.log(`正在拨打紧急电话: ${this.config.contactPhone}`, 'warning');
    }
}

// 页面加载完成后初始化系统
document.addEventListener('DOMContentLoaded', () => {
    window.starLinkSystem = new StarLinkSystem();
});
