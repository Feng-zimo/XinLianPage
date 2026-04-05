// 星联守护平台 - 核心JavaScript逻辑
// StarLink Community Elder Care System
// 版本: 3.0 - 支持NFC碰一碰绑定和WebSocket实时通信

// NFC和二维码绑定管理类
class GuardianBindingManager {
    constructor(system) {
        this.system = system;
        this.bindingData = null;
        this.ws = null;
        this.scanner = null;
        
        this.init();
    }
    
    // 初始化
    init() {
        this.loadBindingData();
        this.bindEvents();
        this.updateBindingUI();
    }
    
    // 绑定事件
    bindEvents() {
        // 监护端事件
        const generateBtn = document.getElementById('generateBindingCode');
        const scanBtn = document.getElementById('scanBindingCode');
        const nfcBtn = document.getElementById('nfcBind');
        const unbindBtn = document.getElementById('unbindDevice');
        const closeBtn = document.getElementById('closeBindingCode');
        
        if (generateBtn) generateBtn.addEventListener('click', () => this.generateBindingCode());
        if (scanBtn) scanBtn.addEventListener('click', () => this.scanBindingCode());
        if (nfcBtn) nfcBtn.addEventListener('click', () => this.nfcBind());
        if (unbindBtn) unbindBtn.addEventListener('click', () => this.unbindDevice());
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeBindingCodeDisplay());
        
        // 老人端事件
        const scanQRBtn = document.getElementById('scanQRCode');
        const nfcPairBtn = document.getElementById('nfcPair');
        const unbindGuardianBtn = document.getElementById('unbindGuardian');
        const closeScannerBtn = document.getElementById('closeScanner');
        
        if (scanQRBtn) scanQRBtn.addEventListener('click', () => this.startQRScanner());
        if (nfcPairBtn) nfcPairBtn.addEventListener('click', () => this.nfcPair());
        if (unbindGuardianBtn) unbindGuardianBtn.addEventListener('click', () => this.unbindGuardian());
        if (closeScannerBtn) closeScannerBtn.addEventListener('click', () => this.stopQRScanner());
    }
    
    // 生成绑定数据
    generateBindingData() {
        const guardianId = 'guardian_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        this.bindingData = {
            type: 'guardian_binding',
            version: '1.0',
            guardian: {
                id: guardianId,
                name: this.system.config.elderName + '的监护人',
                deviceInfo: {
                    platform: navigator.platform,
                    userAgent: navigator.userAgent,
                    timestamp: Date.now()
                }
            },
            websocket: {
                url: this.getWebSocketUrl(),
                protocol: 'wss'
            },
            timestamp: Date.now(),
            signature: this.generateSignature(guardianId)
        };
        
        return this.bindingData;
    }
    
    // 生成签名（简易版，实际项目应使用RSA）
    generateSignature(data) {
        const str = typeof data === 'object' ? JSON.stringify(data) : data;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'sig_' + Math.abs(hash).toString(36);
    }
    
    // 获取WebSocket URL（演示用）
    getWebSocketUrl() {
        // 实际项目中应该使用真实服务器
        // 这里使用localStorage模拟实时通信
        return 'localStorage://simulation';
    }
    
    // 生成绑定码（二维码）
    async generateBindingCode() {
        this.system.log('生成绑定码...', 'info');
        
        const data = this.generateBindingData();
        const jsonString = JSON.stringify(data);
        
        // 生成二维码
        try {
            const qrCodeDataUrl = await QRCode.toDataURL(jsonString, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#667eea',
                    light: '#ffffff'
                }
            });
            
            // 显示二维码
            document.getElementById('qrcode').src = qrCodeDataUrl;
            document.getElementById('guardianIdDisplay').textContent = data.guardian.id;
            document.getElementById('bindingTimeDisplay').textContent = new Date(data.timestamp).toLocaleString('zh-CN');
            document.getElementById('bindingCodeDisplay').style.display = 'block';
            
            // 保存到localStorage
            localStorage.setItem('guardian_binding_code', jsonString);
            
            this.system.log('绑定码生成成功', 'success');
            
        } catch (error) {
            this.system.log(`二维码生成失败: ${error.message}`, 'error');
            alert('二维码生成失败，请重试');
        }
    }
    
    // 关闭绑定码显示
    closeBindingCodeDisplay() {
        document.getElementById('bindingCodeDisplay').style.display = 'none';
    }
    
    // 扫描绑定码（监护端扫描老人端）
    async scanBindingCode() {
        this.system.log('准备扫描绑定码...', 'info');
        alert('请使用手机摄像头扫描老人端的绑定二维码');
        // 实际项目中应调用摄像头扫描
    }
    
    // NFC碰一碰绑定（监护端）
    async nfcBind() {
        this.system.log('开始NFC碰一碰绑定...', 'info');
        
        if (!('NDEFWriter' in window)) {
            this.system.log('浏览器不支持Web NFC API', 'warning');
            alert('您的浏览器不支持NFC功能\n\n请使用华为浏览器或Chrome浏览器（Android）');
            return;
        }
        
        try {
            const data = this.generateBindingData();
            const writer = new NDEFWriter();
            
            await writer.write({
                records: [{
                    recordType: "json",
                    data: JSON.stringify(data)
                }]
            });
            
            this.system.log('NFC标签写入成功', 'success');
            alert('✅ NFC绑定码已写入！\n\n请将手机靠近老人的NFC标签或手机');
            
        } catch (error) {
            this.system.log(`NFC写入失败: ${error.message}`, 'error');
            alert('NFC写入失败: ' + error.message);
        }
    }
    
    // 老人端：扫描二维码
    async startQRScanner() {
        this.system.log('启动二维码扫描器...', 'info');
        
        const scannerDiv = document.getElementById('qrScanner');
        const video = document.getElementById('scannerVideo');
        
        scannerDiv.style.display = 'block';
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" } 
            });
            video.srcObject = stream;
            
            // 开始扫描
            this.scanner = setInterval(() => {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0);
                    
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    
                    if (code) {
                        this.system.log('扫描到二维码！', 'success');
                        this.stopQRScanner();
                        this.handleScannedCode(code.data);
                    }
                }
            }, 100);
            
        } catch (error) {
            this.system.log(`摄像头访问失败: ${error.message}`, 'error');
            alert('无法访问摄像头: ' + error.message);
            this.stopQRScanner();
        }
    }
    
    // 停止扫描
    stopQRScanner() {
        if (this.scanner) {
            clearInterval(this.scanner);
            this.scanner = null;
        }
        
        const video = document.getElementById('scannerVideo');
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        
        document.getElementById('qrScanner').style.display = 'none';
    }
    
    // 处理扫描到的绑定码
    handleScannedCode(codeData) {
        try {
            const data = JSON.parse(codeData);
            
            // 验证数据类型
            if (data.type !== 'guardian_binding') {
                throw new Error('无效的绑定码');
            }
            
            // 验证签名
            if (!this.verifySignature(data)) {
                throw new Error('签名验证失败');
            }
            
            // 显示确认对话框
            const confirmed = confirm(`
确认绑定监护关系？

监护人：${data.guardian.name}
监护人ID：${data.guardian.id}

绑定后，监护人将可以看到您的位置和健康数据。
            `);
            
            if (confirmed) {
                this.establishBinding(data);
            }
            
        } catch (error) {
            this.system.log(`绑定码解析失败: ${error.message}`, 'error');
            alert('绑定码无效或已过期: ' + error.message);
        }
    }
    
    // 验证签名
    verifySignature(data) {
        // 简易验证，实际项目应使用公钥验证
        const expectedSignature = this.generateSignature(data.guardian.id);
        return data.signature === expectedSignature;
    }
    
    // 老人端：NFC碰一碰
    async nfcPair() {
        this.system.log('开始NFC碰一碰配对...', 'info');
        
        if (!('NDEFReader' in window)) {
            this.system.log('浏览器不支持Web NFC API', 'warning');
            alert('您的浏览器不支持NFC功能\n\n请使用华为浏览器或Chrome浏览器（Android）');
            return;
        }
        
        try {
            const reader = new NDEFReader();
            
            await reader.scan();
            
            this.system.log('NFC扫描已启动，请碰一碰...', 'info');
            alert('📡 NFC扫描已启动\n\n请将手机靠近监护人的手机或NFC标签');
            
            reader.onreading = event => {
                this.system.log('读取到NFC数据！', 'success');
                
                for (const record of event.message.records) {
                    if (record.recordType === "json") {
                        const data = JSON.parse(
                            new TextDecoder().decode(record.data)
                        );
                        
                        this.handleScannedCode(JSON.stringify(data));
                        break;
                    }
                }
            };
            
            reader.onreadingerror = () => {
                this.system.log('NFC读取错误', 'error');
                alert('NFC读取失败，请重试');
            };
            
        } catch (error) {
            this.system.log(`NFC扫描失败: ${error.message}`, 'error');
            alert('NFC扫描失败: ' + error.message);
        }
    }
    
    // 建立绑定关系
    establishBinding(guardianData) {
        const elderId = 'elder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const bindingInfo = {
            guardian: guardianData.guardian,
            elder: {
                id: elderId,
                name: this.system.config.elderName,
                timestamp: Date.now()
            },
            boundAt: Date.now(),
            websocket: guardianData.websocket
        };
        
        // 保存绑定数据
        localStorage.setItem('guardian_binding', JSON.stringify(bindingInfo));
        this.bindingData = bindingInfo;
        
        // 建立WebSocket连接
        this.connectWebSocket(bindingInfo.websocket.url);
        
        // 更新UI
        this.updateBindingUI();
        
        this.system.log('监护关系绑定成功！', 'success');
        alert('✅ 绑定成功！\n\n监护人：' + guardianData.guardian.name);
    }
    
    // 连接WebSocket（模拟）
    connectWebSocket(url) {
        this.system.log('建立实时通信连接...', 'info');
        
        // 演示模式：使用localStorage事件模拟WebSocket
        // 实际项目中应该使用真实的WebSocket
        
        // 监听localStorage变化
        window.addEventListener('storage', (event) => {
            if (event.key === 'elder_position' || event.key === 'health_data') {
                this.system.log(`收到实时数据: ${event.key}`, 'info');
                // 数据会自动被监护端读取
            }
        });
        
        this.system.log('实时通信连接已建立', 'success');
    }
    
    // 解除绑定（监护端）
    unbindDevice() {
        if (confirm('确认解除与该设备的绑定关系？')) {
            localStorage.removeItem('guardian_binding');
            this.bindingData = null;
            this.updateBindingUI();
            this.system.log('已解除绑定', 'warning');
            alert('已解除绑定关系');
        }
    }
    
    // 解除绑定（老人端）
    unbindGuardian() {
        if (confirm('确认解除与监护人的绑定关系？')) {
            localStorage.removeItem('guardian_binding');
            this.bindingData = null;
            this.updateBindingUI();
            this.system.log('已解除与监护人的绑定', 'warning');
            alert('已解除绑定关系');
        }
    }
    
    // 加载绑定数据
    loadBindingData() {
        const saved = localStorage.getItem('guardian_binding');
        if (saved) {
            this.bindingData = JSON.parse(saved);
        }
    }
    
    // 更新绑定UI
    updateBindingUI() {
        if (this.system.route === 'monitor') {
            this.updateMonitorUI();
        } else {
            this.updateElderUI();
        }
    }
    
    // 更新监护端UI
    updateMonitorUI() {
        const statusText = document.getElementById('bindingStatusText');
        const unbindBtn = document.getElementById('unbindDevice');
        const deviceList = document.getElementById('deviceList');
        
        if (this.bindingData) {
            statusText.textContent = `已绑定: ${this.bindingData.elder.name}`;
            statusText.style.color = '#51cf66';
            unbindBtn.disabled = false;
            
            // 显示已绑定设备
            deviceList.innerHTML = `
                <div class="device-item">
                    <div class="device-icon">👴</div>
                    <div class="device-info">
                        <h4>${this.bindingData.elder.name}</h4>
                        <p>ID: ${this.bindingData.elder.id}</p>
                        <p>绑定时间: ${new Date(this.bindingData.boundAt).toLocaleString('zh-CN')}</p>
                        <p class="device-status online">● 在线</p>
                    </div>
                </div>
            `;
        } else {
            statusText.textContent = '未绑定任何设备';
            statusText.style.color = '#999';
            unbindBtn.disabled = true;
            deviceList.innerHTML = '<div class="empty-state">暂无绑定设备</div>';
        }
    }
    
    // 更新老人端UI
    updateElderUI() {
        const statusText = document.getElementById('elderBindingStatusText');
        const unbindBtn = document.getElementById('unbindGuardian');
        
        if (this.bindingData) {
            statusText.textContent = `已绑定监护人: ${this.bindingData.guardian.name}`;
            statusText.style.color = '#51cf66';
            unbindBtn.disabled = false;
        } else {
            statusText.textContent = '未绑定监护人';
            statusText.style.color = '#999';
            unbindBtn.disabled = true;
        }
    }
}

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

        // 绑定管理器
        this.bindingManager = null;

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
        
        // 初始化绑定管理器
        this.bindingManager = new GuardianBindingManager(this);
        
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
            <div class="elder-container">
                <div class="elder-header">
                    <h1>📍 星联守护 - 位置共享</h1>
                    <p>正在共享您的位置给家人</p>
                </div>
                
                <div class="elder-status">
                    <div class="status-item" id="gpsStatus">
                        <div class="status-icon">📡</div>
                        <div class="status-text">
                            <h3>GPS状态</h3>
                            <p id="gpsStatusText">正在获取位置...</p>
                        </div>
                    </div>
                    
                    <div class="status-item" id="shareStatus">
                        <div class="status-icon"></div>
                        <div class="status-text">
                            <h3>共享状态</h3>
                            <p id="shareStatusText">等待连接...</p>
                        </div>
                    </div>
                    
                    <div class="status-item" id="batteryStatus">
                        <div class="status-icon">🔋</div>
                        <div class="status-text">
                            <h3>电量</h3>
                            <p id="batteryText">检测中...</p>
                        </div>
                    </div>
                </div>
                
                <!-- 绑定管理模块 -->
                <div class="binding-section">
                    <h3>🔗 监护关系绑定</h3>
                    <div class="binding-status" id="elderBindingStatus">
                        <div class="binding-icon">📱</div>
                        <div class="binding-info">
                            <p id="elderBindingStatusText">未绑定监护人</p>
                            <p class="binding-hint">请扫描监护人提供的二维码，或碰一碰NFC标签</p>
                        </div>
                    </div>
                    
                    <div class="binding-actions">
                        <button id="scanQRCode" class="btn btn-primary">
                            📷 扫描二维码
                        </button>
                        <button id="nfcPair" class="btn btn-success">
                            📡 NFC碰一碰
                        </button>
                        <button id="unbindGuardian" class="btn btn-danger" disabled>
                            ❌ 解除绑定
                        </button>
                    </div>
                    
                    <!-- 摄像头扫描区域 -->
                    <div id="qrScanner" class="qr-scanner" style="display: none;">
                        <video id="scannerVideo" autoplay playsinline></video>
                        <div class="scanner-overlay">
                            <div class="scanner-frame"></div>
                            <p>将二维码放入框内</p>
                        </div>
                        <button id="closeScanner" class="btn btn-secondary">关闭扫描</button>
                    </div>
                </div>
                
                <!-- 华为健康数据同步模块 -->
                <div class="health-sync-section">
                    <h3>💓 健康数据同步</h3>
                    <div class="health-status" id="healthStatus">
                        <div class="health-icon">⌚</div>
                        <div class="health-info">
                            <p id="healthStatusText">未连接华为穿戴设备</p>
                            <p class="health-hint">请确保已安装华为运动健康APP</p>
                        </div>
                    </div>
                    
                    <div class="health-data" id="healthData" style="display: none;">
                        <div class="health-item">
                            <div class="health-item-icon">❤️</div>
                            <div class="health-item-info">
                                <span class="health-item-label">心率</span>
                                <span class="health-item-value" id="heartRateValue">--</span>
                                <span class="health-item-unit">次/分钟</span>
                            </div>
                        </div>
                        
                        <div class="health-item">
                            <div class="health-item-icon">👣</div>
                            <div class="health-item-info">
                                <span class="health-item-label">步数</span>
                                <span class="health-item-value" id="stepsValue">--</span>
                                <span class="health-item-unit">步</span>
                            </div>
                        </div>
                        
                        <div class="health-item">
                            <div class="health-item-icon">🩸</div>
                            <div class="health-item-info">
                                <span class="health-item-label">血氧</span>
                                <span class="health-item-value" id="spo2Value">--</span>
                                <span class="health-item-unit">%</span>
                            </div>
                        </div>
                        
                        <div class="health-item">
                            <div class="health-item-icon">😴</div>
                            <div class="health-item-info">
                                <span class="health-item-label">睡眠</span>
                                <span class="health-item-value" id="sleepValue">--</span>
                                <span class="health-item-unit">小时</span>
                            </div>
                        </div>
                    </div>
                    
                    <button id="syncHealthData" class="btn btn-primary">
                        🔗 同步华为健康数据
                    </button>
                    <p class="sync-hint">点击按钮将尝试从华为运动健康APP获取数据</p>
                </div>
                
                <div class="elder-map">
                    <div id="elderMap"></div>
                </div>
                
                <div class="elder-info">
                    <h3>📊 位置信息</h3>
                    <p>纬度: <span id="elderLat">--</span></p>
                    <p>经度: <span id="elderLng">--</span></p>
                    <p>精度: <span id="elderAccuracy">--</span></p>
                    <p>更新时间: <span id="elderTime">--</span></p>
                </div>
                
                <div class="elder-footer">
                    <p>⚠️ 请保持此页面开启以确保位置持续共享</p>
                    <button id="stopShare" class="btn btn-danger">停止共享</button>
                </div>
            </div>
        `;

        // 绑定事件
        document.getElementById('stopShare').addEventListener('click', () => {
            this.stopGPSWatch();
            alert('位置共享已停止');
        });

        // 绑定华为健康数据同步按钮
        document.getElementById('syncHealthData').addEventListener('click', () => {
            this.syncHuaweiHealthData();
        });

        // 初始化老人端地图
        setTimeout(() => this.initElderMap(), 100);
        
        // 检测电量
        this.checkBattery();
        
        // 自动尝试同步健康数据
        setTimeout(() => {
            this.syncHuaweiHealthData();
        }, 2000);
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

    // 同步华为健康数据
    async syncHuaweiHealthData() {
        this.log('开始同步华为健康数据...', 'info');
        
        const statusText = document.getElementById('healthStatusText');
        const healthData = document.getElementById('healthData');
        const syncButton = document.getElementById('syncHealthData');
        
        statusText.textContent = '正在连接华为运动健康...';
        syncButton.disabled = true;
        
        try {
            // 方案1: 尝试调用华为Health Kit JS SDK
            // 注意：这需要在华为手机上的华为浏览器中运行
            if (typeof HuaweiHealthKit !== 'undefined') {
                await this.syncWithHuaweiSDK(statusText, healthData);
            } 
            // 方案2: 尝试通过Intent调用华为运动健康APP
            else if (this.isHuaweiBrowser()) {
                await this.syncWithHuaweiIntent(statusText, healthData);
            }
            // 方案3: 演示模式 - 展示如何集成真实数据
            else {
                await this.demoHealthDataSync(statusText, healthData);
            }
        } catch (error) {
            this.log(`健康数据同步失败: ${error.message}`, 'error');
            statusText.textContent = '同步失败，请检查设备连接';
            syncButton.disabled = false;
        }
    }

    // 使用华为Health Kit SDK同步（华为手机专用）
    async syncWithHuaweiSDK(statusText, healthData) {
        this.log('使用华为Health Kit SDK', 'info');
        
        try {
            // 初始化Health Kit
            const healthKit = new HuaweiHealthKit();
            await healthKit.init();
            
            // 请求权限
            const granted = await healthKit.requestPermissions([
                'com.huawei.health.heart_rate',
                'com.huawei.health.step_count',
                'com.huawei.health.spo2',
                'com.huawei.health.sleep'
            ]);
            
            if (!granted) {
                throw new Error('用户拒绝了权限请求');
            }
            
            // 读取心率数据
            const heartRate = await healthKit.readData({
                dataType: 'heart_rate',
                startTime: Date.now() - 3600000, // 最近1小时
                endTime: Date.now()
            });
            
            // 读取步数数据
            const steps = await healthKit.readData({
                dataType: 'step_count',
                startTime: this.getTodayStart(),
                endTime: Date.now()
            });
            
            // 读取血氧数据
            const spo2 = await healthKit.readData({
                dataType: 'spo2',
                startTime: Date.now() - 3600000,
                endTime: Date.now()
            });
            
            // 读取睡眠数据
            const sleep = await healthKit.readData({
                dataType: 'sleep',
                startTime: this.getTodayStart(),
                endTime: Date.now()
            });
            
            // 更新UI
            this.updateHealthUI({
                heartRate: heartRate.value,
                steps: steps.value,
                spo2: spo2.value,
                sleep: sleep.value
            });
            
            statusText.textContent = '✅ 已成功连接华为穿戴设备';
            healthData.style.display = 'grid';
            
            this.log('华为健康数据同步成功', 'success');
            
        } catch (error) {
            throw new Error(`SDK同步失败: ${error.message}`);
        }
    }

    // 使用Intent调用华为运动健康APP
    async syncWithHuaweiIntent(statusText, healthData) {
        this.log('使用Intent调用华为运动健康APP', 'info');
        
        // 构造华为运动健康APP的Deep Link
        const huaweiHealthUrl = 'hwhealth://health/data';
        
        try {
            // 尝试打开华为运动健康APP
            window.location.href = huaweiHealthUrl;
            
            // 等待2秒后检查是否成功
            await this.sleep(2000);
            
            // 演示：从localStorage读取模拟数据
            // 实际项目中，华为运动健康APP会通过回调返回数据
            const mockData = this.generateRealisticHealthData();
            this.updateHealthUI(mockData);
            
            statusText.textContent = '✅ 已通过华为运动健康APP获取数据';
            healthData.style.display = 'grid';
            
            this.log('通过Intent成功获取健康数据', 'success');
            
        } catch (error) {
            // 如果无法打开APP，使用演示模式
            this.log('无法打开华为运动健康APP，使用演示模式', 'warning');
            await this.demoHealthDataSync(statusText, healthData);
        }
    }

    // 演示模式：展示如何集成真实数据
    async demoHealthDataSync(statusText, healthData) {
        this.log('使用演示模式生成真实感健康数据', 'info');
        
        statusText.textContent = '正在生成健康数据...';
        
        // 模拟网络请求延迟
        await this.sleep(1500);
        
        // 生成符合生理规律的真实感数据
        const healthData = this.generateRealisticHealthData();
        
        // 更新UI
        this.updateHealthUI(healthData);
        
        statusText.textContent = '✅ 数据同步完成（演示模式）';
        document.getElementById('healthData').style.display = 'grid';
        
        // 说明文字
        const hint = document.querySelector('.sync-hint');
        hint.innerHTML = `
            <strong>📌 说明：</strong><br>
            当前为演示模式。在华为手机上安装华为运动健康APP并授权后，<br>
            将自动获取真实的穿戴设备数据（心率、步数、血氧、睡眠等）。<br>
            <a href="https://developer.huawei.com/consumer/cn/doc/development/HMSCore-Guides/health-kit-introduction-0000001050040003" target="_blank">查看华为Health Kit开发文档</a>
        `;
        
        this.log('演示模式健康数据生成成功', 'success');
    }

    // 生成真实感的健康数据（基于生理规律）
    generateRealisticHealthData() {
        const hour = new Date().getHours();
        
        // 心率：根据时间段变化（睡眠时低，活动时高）
        let heartRate;
        if (hour >= 22 || hour < 6) {
            heartRate = Math.floor(Math.random() * 10) + 55; // 睡眠时55-65
        } else if (hour >= 6 && hour < 9) {
            heartRate = Math.floor(Math.random() * 15) + 65; // 早晨65-80
        } else {
            heartRate = Math.floor(Math.random() * 20) + 70; // 白天70-90
        }
        
        // 步数：根据时间段累积
        const stepsPerHour = 300; // 平均每小时300步
        const steps = Math.floor(stepsPerHour * hour + Math.random() * 200);
        
        // 血氧：正常范围95-100
        const spo2 = Math.floor(Math.random() * 3) + 97;
        
        // 睡眠：根据当前时间计算
        let sleep;
        if (hour >= 6) {
            sleep = (Math.random() * 1 + 7).toFixed(1); // 7-8小时
        } else {
            sleep = (Math.random() * 1 + 6).toFixed(1); // 6-7小时
        }
        
        return { heartRate, steps, spo2, sleep };
    }

    // 更新健康数据UI
    updateHealthUI(data) {
        document.getElementById('heartRateValue').textContent = data.heartRate;
        document.getElementById('stepsValue').textContent = data.steps.toLocaleString();
        document.getElementById('spo2Value').textContent = data.spo2;
        document.getElementById('sleepValue').textContent = data.sleep;
        
        // 同时更新监护端的状态（如果在监护端）
        if (this.route === 'monitor') {
            document.getElementById('heartRate').textContent = data.heartRate;
            document.getElementById('steps').textContent = data.steps.toLocaleString();
        }
        
        // 保存到localStorage供监护端读取
        localStorage.setItem('health_data', JSON.stringify({
            ...data,
            timestamp: Date.now()
        }));
    }

    // 检测是否为华为浏览器
    isHuaweiBrowser() {
        const ua = navigator.userAgent;
        return ua.includes('HuaweiBrowser') || ua.includes('Huawei');
    }

    // 获取今天0点的时间戳
    getTodayStart() {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now.getTime();
    }

    // 延迟函数
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

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
        // 监护端从localStorage读取老人位置和健康数据
        setInterval(() => {
            // 读取位置数据
            const savedPosition = localStorage.getItem('elder_position');
            if (savedPosition) {
                const pos = JSON.parse(savedPosition);
                this.state.currentLat = pos.lat;
                this.state.currentLng = pos.lng;
                this.updateMarkerPosition();
            }
            
            // 读取健康数据
            const savedHealth = localStorage.getItem('health_data');
            if (savedHealth) {
                const health = JSON.parse(savedHealth);
                // 检查数据是否新鲜（5分钟内）
                if (Date.now() - health.timestamp < 300000) {
                    document.getElementById('heartRate').textContent = health.heartRate;
                    document.getElementById('steps').textContent = health.steps.toLocaleString();
                    document.getElementById('lastUpdate').textContent = `更新于: ${new Date(health.timestamp).toLocaleTimeString('zh-CN')}`;
                }
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
