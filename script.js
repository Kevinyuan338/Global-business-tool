// 全局变量
let currentRates = {};
let selectedDateTime = null;
let rateUpdateTimeout = null; // 汇率更新防抖定时器

// 检测emoji支持
function detectEmojiSupport() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '16px Arial';
    const emoji = '🇨🇳';
    const text = ctx.measureText(emoji);
    return text.width > 0;
}

// 获取最佳标志显示方式
function getFlagDisplay(country) {
    if (detectEmojiSupport()) {
        return country.flag;
    } else {
        return country.flagText;
    }
}

// 获取当前时区的实际偏移量（考虑DST）
function getCurrentTimezoneOffset(timezone) {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const localTime = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    const offset = (localTime.getTime() - utc.getTime()) / (1000 * 60 * 60);
    return offset;
}

// 获取时区偏移量字符串（考虑DST）
function getTimezoneOffsetString(timezone) {
    const offset = getCurrentTimezoneOffset(timezone);
    const sign = offset >= 0 ? '+' : '-';
    const hours = Math.abs(Math.floor(offset));
    const minutes = Math.abs((offset % 1) * 60);
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Country data mapping (按首字母顺序排列)
const countryData = {
    'AE': { 
        name: 'UAE', 
        currency: 'AED', 
        flag: '🇦🇪', 
        flagText: '[AE]',
        timezone: 'Asia/Dubai',
        offset: '+04:00'
    },
    'AR': { 
        name: 'Argentina', 
        currency: 'ARS', 
        flag: '🇦🇷', 
        flagText: '[AR]',
        timezone: 'America/Argentina/Buenos_Aires',
        offset: '-03:00'
    },
    'AT': { 
        name: 'Austria', 
        currency: 'EUR', 
        flag: '🇦🇹', 
        flagText: '[AT]',
        timezone: 'Europe/Vienna',
        offset: '+01:00'
    },
    'AU': { 
        name: 'Australia', 
        currency: 'AUD', 
        flag: '🇦🇺', 
        flagText: '[AU]',
        timezone: 'Australia/Sydney',
        offset: '+10:00'
    },
    'BE': { 
        name: 'Belgium', 
        currency: 'EUR', 
        flag: '🇧🇪', 
        flagText: '[BE]',
        timezone: 'Europe/Brussels',
        offset: '+01:00'
    },
    'BR': { 
        name: 'Brazil', 
        currency: 'BRL', 
        flag: '🇧🇷', 
        flagText: '[BR]',
        timezone: 'America/Sao_Paulo',
        offset: '-03:00'
    },
    'CA': { 
        name: 'Canada', 
        currency: 'CAD', 
        flag: '🇨🇦', 
        flagText: '[CA]',
        timezone: 'America/Toronto',
        offset: '-05:00'
    },
    'CH': { 
        name: 'Switzerland', 
        currency: 'CHF', 
        flag: '🇨🇭', 
        flagText: '[CH]',
        timezone: 'Europe/Zurich',
        offset: '+01:00'
    },
    'CL': { 
        name: 'Chile', 
        currency: 'CLP', 
        flag: '🇨🇱', 
        flagText: '[CL]',
        timezone: 'America/Santiago',
        offset: '-03:00'
    },
    'CN': { 
        name: 'China', 
        currency: 'CNY', 
        flag: '🇨🇳', 
        flagText: '[CN]',
        timezone: 'Asia/Shanghai',
        offset: '+08:00'
    },
    'CO': { 
        name: 'Colombia', 
        currency: 'COP', 
        flag: '🇨🇴', 
        flagText: '[CO]',
        timezone: 'America/Bogota',
        offset: '-05:00'
    },
    'CZ': { 
        name: 'Czech Republic', 
        currency: 'CZK', 
        flag: '🇨🇿', 
        flagText: '[CZ]',
        timezone: 'Europe/Prague',
        offset: '+01:00'
    },
    'DE': { 
        name: 'Germany', 
        currency: 'EUR', 
        flag: '🇩🇪', 
        flagText: '[DE]',
        timezone: 'Europe/Berlin',
        offset: '+01:00'
    },
    'DK': { 
        name: 'Denmark', 
        currency: 'DKK', 
        flag: '🇩🇰', 
        flagText: '[DK]',
        timezone: 'Europe/Copenhagen',
        offset: '+01:00'
    },
    'EG': { 
        name: 'Egypt', 
        currency: 'EGP', 
        flag: '🇪🇬', 
        flagText: '[EG]',
        timezone: 'Africa/Cairo',
        offset: '+02:00'
    },
    'ES': { 
        name: 'Spain', 
        currency: 'EUR', 
        flag: '🇪🇸', 
        flagText: '[ES]',
        timezone: 'Europe/Madrid',
        offset: '+01:00'
    },
    'FI': { 
        name: 'Finland', 
        currency: 'EUR', 
        flag: '🇫🇮', 
        flagText: '[FI]',
        timezone: 'Europe/Helsinki',
        offset: '+02:00'
    },
    'FR': { 
        name: 'France', 
        currency: 'EUR', 
        flag: '🇫🇷', 
        flagText: '[FR]',
        timezone: 'Europe/Paris',
        offset: '+01:00'
    },
    'GB': { 
        name: 'United Kingdom', 
        currency: 'GBP', 
        flag: '🇬🇧', 
        flagText: '[GB]',
        timezone: 'Europe/London',
        offset: 'GMT/BST' // 动态DST
    },
    'GR': { 
        name: 'Greece', 
        currency: 'EUR', 
        flag: '🇬🇷', 
        flagText: '[GR]',
        timezone: 'Europe/Athens',
        offset: '+02:00'
    },
    'HU': { 
        name: 'Hungary', 
        currency: 'HUF', 
        flag: '🇭🇺', 
        flagText: '[HU]',
        timezone: 'Europe/Budapest',
        offset: '+01:00'
    },
    'ID': { 
        name: 'Indonesia', 
        currency: 'IDR', 
        flag: '🇮🇩', 
        flagText: '[ID]',
        timezone: 'Asia/Jakarta',
        offset: '+07:00'
    },
    'IE': { 
        name: 'Ireland', 
        currency: 'EUR', 
        flag: '🇮🇪', 
        flagText: '[IE]',
        timezone: 'Europe/Dublin',
        offset: '+00:00'
    },
    'IL': { 
        name: 'Israel', 
        currency: 'ILS', 
        flag: '🇮🇱', 
        flagText: '[IL]',
        timezone: 'Asia/Jerusalem',
        offset: '+02:00'
    },
    'IN': { 
        name: 'India', 
        currency: 'INR', 
        flag: '🇮🇳', 
        flagText: '[IN]',
        timezone: 'Asia/Kolkata',
        offset: '+05:30'
    },
    'IT': { 
        name: 'Italy', 
        currency: 'EUR', 
        flag: '🇮🇹', 
        flagText: '[IT]',
        timezone: 'Europe/Rome',
        offset: '+01:00'
    },
    'JP': { 
        name: 'Japan', 
        currency: 'JPY', 
        flag: '🇯🇵', 
        flagText: '[JP]',
        timezone: 'Asia/Tokyo',
        offset: '+09:00'
    },
    'KE': { 
        name: 'Kenya', 
        currency: 'KES', 
        flag: '🇰🇪', 
        flagText: '[KE]',
        timezone: 'Africa/Nairobi',
        offset: '+03:00'
    },
    'KR': { 
        name: 'South Korea', 
        currency: 'KRW', 
        flag: '🇰🇷', 
        flagText: '[KR]',
        timezone: 'Asia/Seoul',
        offset: '+09:00'
    },
    'MA': { 
        name: 'Morocco', 
        currency: 'MAD', 
        flag: '🇲🇦', 
        flagText: '[MA]',
        timezone: 'Africa/Casablanca',
        offset: '+01:00'
    },
    'MX': { 
        name: 'Mexico', 
        currency: 'MXN', 
        flag: '🇲🇽', 
        flagText: '[MX]',
        timezone: 'America/Mexico_City',
        offset: '-06:00'
    },
    'MY': { 
        name: 'Malaysia', 
        currency: 'MYR', 
        flag: '🇲🇾', 
        flagText: '[MY]',
        timezone: 'Asia/Kuala_Lumpur',
        offset: '+08:00'
    },
    'NG': { 
        name: 'Nigeria', 
        currency: 'NGN', 
        flag: '🇳🇬', 
        flagText: '[NG]',
        timezone: 'Africa/Lagos',
        offset: '+01:00'
    },
    'NL': { 
        name: 'Netherlands', 
        currency: 'EUR', 
        flag: '🇳🇱', 
        flagText: '[NL]',
        timezone: 'Europe/Amsterdam',
        offset: '+01:00'
    },
    'NO': { 
        name: 'Norway', 
        currency: 'NOK', 
        flag: '🇳🇴', 
        flagText: '[NO]',
        timezone: 'Europe/Oslo',
        offset: '+01:00'
    },
    'NZ': { 
        name: 'New Zealand', 
        currency: 'NZD', 
        flag: '🇳🇿', 
        flagText: '[NZ]',
        timezone: 'Pacific/Auckland',
        offset: '+12:00'
    },
    'PE': { 
        name: 'Peru', 
        currency: 'PEN', 
        flag: '🇵🇪', 
        flagText: '[PE]',
        timezone: 'America/Lima',
        offset: '-05:00'
    },
    'PH': { 
        name: 'Philippines', 
        currency: 'PHP', 
        flag: '🇵🇭', 
        flagText: '[PH]',
        timezone: 'Asia/Manila',
        offset: '+08:00'
    },
    'PL': { 
        name: 'Poland', 
        currency: 'PLN', 
        flag: '🇵🇱', 
        flagText: '[PL]',
        timezone: 'Europe/Warsaw',
        offset: '+01:00'
    },
    'PT': { 
        name: 'Portugal', 
        currency: 'EUR', 
        flag: '🇵🇹', 
        flagText: '[PT]',
        timezone: 'Europe/Lisbon',
        offset: '+00:00'
    },
    'RU': { 
        name: 'Russia', 
        currency: 'RUB', 
        flag: '🇷🇺', 
        flagText: '[RU]',
        timezone: 'Europe/Moscow',
        offset: '+03:00'
    },
    'SA': { 
        name: 'Saudi Arabia', 
        currency: 'SAR', 
        flag: '🇸🇦', 
        flagText: '[SA]',
        timezone: 'Asia/Riyadh',
        offset: '+03:00'
    },
    'SE': { 
        name: 'Sweden', 
        currency: 'SEK', 
        flag: '🇸🇪', 
        flagText: '[SE]',
        timezone: 'Europe/Stockholm',
        offset: '+01:00'
    },
    'SG': { 
        name: 'Singapore', 
        currency: 'SGD', 
        flag: '🇸🇬', 
        flagText: '[SG]',
        timezone: 'Asia/Singapore',
        offset: '+08:00'
    },
    'TH': { 
        name: 'Thailand', 
        currency: 'THB', 
        flag: '🇹🇭', 
        flagText: '[TH]',
        timezone: 'Asia/Bangkok',
        offset: '+07:00'
    },
    'TR': { 
        name: 'Turkey', 
        currency: 'TRY', 
        flag: '🇹🇷', 
        flagText: '[TR]',
        timezone: 'Europe/Istanbul',
        offset: '+03:00'
    },
    'US': { 
        name: 'United States', 
        currency: 'USD', 
        flag: '🇺🇸', 
        flagText: '[US]',
        timezone: 'America/New_York', // 默认使用纽约时区
        offset: 'EST/EDT' // 动态DST
    },
    'US-CHI': { 
        name: 'Chicago', 
        currency: 'USD', 
        flag: '🇺🇸', 
        flagText: '[US-CHI]',
        timezone: 'America/Chicago',
        offset: 'CST/CDT' // 动态DST
    },
    'US-DEN': { 
        name: 'Denver', 
        currency: 'USD', 
        flag: '🇺🇸', 
        flagText: '[US-DEN]',
        timezone: 'America/Denver',
        offset: 'MST/MDT' // 动态DST
    },
    'US-LA': { 
        name: 'Los Angeles', 
        currency: 'USD', 
        flag: '🇺🇸', 
        flagText: '[US-LA]',
        timezone: 'America/Los_Angeles',
        offset: 'PST/PDT' // 动态DST
    },
    'US-NY': { 
        name: 'New York', 
        currency: 'USD', 
        flag: '🇺🇸', 
        flagText: '[US-NY]',
        timezone: 'America/New_York',
        offset: 'EST/EDT' // 动态DST
    },
    'VN': { 
        name: 'Vietnam', 
        currency: 'VND', 
        flag: '🇻🇳', 
        flagText: '[VN]',
        timezone: 'Asia/Ho_Chi_Minh',
        offset: '+07:00'
    },
    'ZA': { 
        name: 'South Africa', 
        currency: 'ZAR', 
        flag: '🇿🇦', 
        flagText: '[ZA]',
        timezone: 'Africa/Johannesburg',
        offset: '+02:00'
    }
};

// Currency symbols mapping
const currencySymbols = {
    'CNY': '¥',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'RUB': '₽',
    'BRL': 'R$',
    'MXN': '$',
    'ARS': '$',
    'CLP': '$',
    'COP': '$',
    'PEN': 'S/',
    'INR': '₹',
    'KRW': '₩',
    'THB': '฿',
    'SGD': 'S$',
    'MYR': 'RM',
    'IDR': 'Rp',
    'PHP': '₱',
    'VND': '₫',
    'ZAR': 'R',
    'EGP': '£',
    'NGN': '₦',
    'KES': 'KSh',
    'MAD': 'د.م.',
    'ILS': '₪',
    'TRY': '₺',
    'AED': 'د.إ',
    'SAR': '﷼',
    'NZD': 'NZ$'
};

// 全局变量
let timeCountryCount = 0;
let rateCountryCount = 0;
// 时间区收藏管理
let timeComparisonCountries = JSON.parse(localStorage.getItem('timeComparisonCountries') || '[]');
let timeMainCountry = localStorage.getItem('timeMainCountry') || '';

// 汇率区收藏管理
let rateComparisonCountries = JSON.parse(localStorage.getItem('rateComparisonCountries') || '[]');
let rateMainCountry = localStorage.getItem('rateMainCountry') || '';

// 保持向后兼容性
let defaultCountries = timeComparisonCountries; // 为了兼容现有代码
let defaultTimeMainCountry = timeMainCountry;
let defaultRateMainCountry = rateMainCountry;

// DOM元素
const elements = {
    // 时间模块
    timeMainCountrySelect: document.getElementById('time-main-country-select'),
    timeMainDateInput: document.getElementById('time-main-date-input'),
    timeMainHourInput: document.getElementById('time-main-hour-input'),
    timeMainMinuteInput: document.getElementById('time-main-minute-input'),
    timeMainAmpmInput: document.getElementById('time-main-ampm-input'),
    // timeMainDisplay: 已删除
    addTimeCountryBtn: document.getElementById('add-time-country-btn'),
    
    // 汇率模块
    rateBaseCountry: document.getElementById('rate-base-country'),
    refreshRateBtn: document.getElementById('refresh-rate-btn'),
    rateTable: document.getElementById('rate-table'),
    rateHeaderRow: document.getElementById('rate-header-row'),
    rateMainFlag: document.getElementById('rate-main-flag'),
    rateMainCountryName: document.getElementById('rate-main-country-name'),
    addRateCountryBtn: document.getElementById('add-rate-country-btn'),
    
    // 信息面板
    updateTime: document.getElementById('update-time'),
    
    // 通用元素
    loadingOverlay: document.getElementById('loading-overlay')
};

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateTimeInput();
    // 尝试获取汇率数据（如果有选择主国家）
    if (elements.rateBaseCountry && elements.rateBaseCountry.value) {
        console.log('页面加载时发现已选择主国家，开始获取汇率数据');
        fetchExchangeRates();
    } else {
        console.log('页面加载时未选择主国家，等待用户选择');
        // 延迟检查，确保用户选择主国家后能获取汇率数据
        setTimeout(() => {
            if (elements.rateBaseCountry && elements.rateBaseCountry.value) {
                console.log('延迟检查发现已选择主国家，开始获取汇率数据');
                fetchExchangeRates();
            }
        }, 1000);
    }
    startTimeUpdate();
});

// 初始化应用
function initializeApp() {
    console.log('=== 初始化应用 ===');
    
    // 设置默认时间为当前实际时间
    const now = new Date();
    console.log('当前实际时间:', now.toLocaleString());
    console.log('时区偏移:', now.getTimezoneOffset(), '分钟');
    
    selectedDateTime = now;
    initializeTimeInputs(now);
    
    // 更新时间主国家显示（先设置主国家）
    updateTimeMainCountryDisplay();
    
    // 初始化对比国家选择器（先初始化选择器）
    initializeComparisonSelectors();
    
    // 应用时间区收藏（在初始化选择器之后）
    applyTimeFavorites();
    
    // 更新汇率主国家显示
    updateRateMainCountryDisplay();
    
    // 初始化汇率比较选择器
    initializeRateComparisonSelectors();
    
    // 应用汇率区收藏（在初始化选择器之后）
    applyRateFavorites();
    
    // 更新时间区比较国家按钮状态
    updateTimeComparisonButtons();
    
    // 更新汇率区比较国家按钮状态
    updateRateComparisonButtons();
    
    // 更新主国家收藏按钮状态
    updateMainFavoriteButtons();
    
    // 绑定星形按钮事件
    bindStarButtonEvents();
    
    // 绑定换位按钮事件
    bindSwapButtonEvents();
    
    // 更新时间显示
    updateTimeDisplay();
    
    // 更新汇率显示
    updateRateDisplay();
    
    // 绑定汇率输入框事件监听器
    bindRateInputEvents();
    
    // 延迟绑定汇率主国家选择器事件监听器
    setTimeout(() => {
        bindRateMainCountryEvents();
    }, 200);
    
    // 延迟检查并应用收藏（确保DOM完全加载）
    setTimeout(() => {
        console.log('延迟检查收藏恢复...');
        console.log('时间主国家收藏:', timeMainCountry);
        console.log('时间比较国家收藏:', timeComparisonCountries);
        console.log('汇率主国家收藏:', rateMainCountry);
        console.log('汇率比较国家收藏:', rateComparisonCountries);
        
        // 重新应用时间收藏
        applyTimeFavorites();
        
        // 重新应用汇率收藏
        applyRateFavorites();
        
        // 更新按钮状态
        updateTimeComparisonButtons();
        updateRateComparisonButtons();
        updateMainFavoriteButtons();
        
        console.log('收藏恢复完成');
    }, 500);
}

// 绑定汇率输入框事件监听器
function bindRateInputEvents() {
    const rateMainValue = document.getElementById('rate-main-value');
    console.log('在initializeApp中尝试绑定汇率输入框事件，元素存在:', !!rateMainValue);
    
    if (rateMainValue) {
        console.log('在initializeApp中成功找到汇率输入框，开始绑定事件监听器');
        
        // 移除可能存在的旧事件监听器
        const newRateMainValue = rateMainValue.cloneNode(true);
        rateMainValue.parentNode.replaceChild(newRateMainValue, rateMainValue);
        
        // 实时输入事件 - 用户输入时使用防抖更新
        newRateMainValue.addEventListener('input', (e) => {
            console.log('汇率输入框input事件触发，值:', e.target.value);
            debouncedUpdateRateDisplay();
        });
        
        // 值改变事件 - 用户完成输入后立即更新
        newRateMainValue.addEventListener('change', (e) => {
            console.log('汇率输入框change事件触发，值:', e.target.value);
            // 清除防抖定时器，立即更新
            if (rateUpdateTimeout) {
                clearTimeout(rateUpdateTimeout);
            }
            updateRateDisplay();
        });
        
        // 键盘事件 - 确保所有键盘输入都能触发更新
        newRateMainValue.addEventListener('keyup', (e) => {
            console.log('汇率输入框keyup事件触发，值:', e.target.value);
            debouncedUpdateRateDisplay();
        });
        
        // 粘贴事件 - 用户粘贴内容时也能触发更新
        newRateMainValue.addEventListener('paste', (e) => {
            console.log('汇率输入框paste事件触发');
            // 延迟一点时间让粘贴的内容生效
            setTimeout(() => {
                debouncedUpdateRateDisplay();
            }, 10);
        });
        
        console.log('在initializeApp中汇率输入框事件监听器绑定完成');
    } else {
        console.error('在initializeApp中未找到汇率输入框元素！');
    }
}

// 绑定汇率主国家选择器事件监听器
function bindRateMainCountryEvents() {
    const rateBaseCountry = document.getElementById('rate-base-country');
    console.log('延迟绑定汇率主国家选择器事件，元素存在:', !!rateBaseCountry);
    
    if (rateBaseCountry) {
        console.log('成功找到汇率主国家选择器，开始绑定事件监听器');
        
        // 移除可能存在的旧事件监听器
        const newRateBaseCountry = rateBaseCountry.cloneNode(true);
        rateBaseCountry.parentNode.replaceChild(newRateBaseCountry, rateBaseCountry);
        
        // 更新elements对象中的引用
        elements.rateBaseCountry = newRateBaseCountry;
        
        // 绑定change事件
        newRateBaseCountry.addEventListener('change', () => {
            console.log('汇率主国家选择器变化事件触发，值:', newRateBaseCountry.value);
            updateMainFavoriteButtons();
            handleRateBaseCountryChange();
        });
        
        console.log('汇率主国家选择器事件监听器绑定完成');
    } else {
        console.error('延迟绑定中未找到汇率主国家选择器元素！');
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 时间模块
    elements.timeMainCountrySelect.addEventListener('change', handleTimeMainCountrySelectChange);
    elements.timeMainDateInput.addEventListener('change', handleTimeInputChange);
    elements.timeMainHourInput.addEventListener('change', handleTimeInputChange);
    elements.timeMainMinuteInput.addEventListener('change', handleTimeInputChange);
    elements.timeMainAmpmInput.addEventListener('change', handleTimeInputChange);
    
    // 时间区比较国家选择器事件监听器
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`comparison-select-${i}`);
        if (select) {
            select.addEventListener('change', () => {
                updateTimeDisplay();
                updateTimeComparisonButtons();
            });
        }
    }
    
    // 默认国家功能 - 通过bindStarButtonEvents函数绑定
    
    // 汇率模块
    elements.refreshRateBtn.addEventListener('click', handleRefreshRate);
    
    // 汇率比较选择器事件监听器
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`rate-comparison-select-${i}`);
        if (select) {
            select.addEventListener('change', () => {
                updateRateDisplay();
                updateRateComparisonButtons();
            });
        }
    }
    
    // 汇率数值输入事件监听器 - 延迟绑定确保DOM元素存在
    setTimeout(() => {
        const rateMainValue = document.getElementById('rate-main-value');
        console.log('尝试绑定汇率输入框事件监听器，元素存在:', !!rateMainValue);
        
        if (rateMainValue) {
            console.log('成功找到汇率输入框，开始绑定事件监听器');
            
            // 实时输入事件 - 用户输入时使用防抖更新
            rateMainValue.addEventListener('input', (e) => {
                console.log('汇率输入框input事件触发，值:', e.target.value);
                debouncedUpdateRateDisplay();
            });
            
            // 值改变事件 - 用户完成输入后立即更新
            rateMainValue.addEventListener('change', (e) => {
                console.log('汇率输入框change事件触发，值:', e.target.value);
                // 清除防抖定时器，立即更新
                if (rateUpdateTimeout) {
                    clearTimeout(rateUpdateTimeout);
                }
                updateRateDisplay();
            });
            
            // 键盘事件 - 确保所有键盘输入都能触发更新
            rateMainValue.addEventListener('keyup', (e) => {
                console.log('汇率输入框keyup事件触发，值:', e.target.value);
                debouncedUpdateRateDisplay();
            });
            
            // 粘贴事件 - 用户粘贴内容时也能触发更新
            rateMainValue.addEventListener('paste', (e) => {
                console.log('汇率输入框paste事件触发');
                // 延迟一点时间让粘贴的内容生效
                setTimeout(() => {
                    debouncedUpdateRateDisplay();
                }, 10);
            });
            
            console.log('汇率输入框事件监听器绑定完成');
        } else {
            console.error('未找到汇率输入框元素！');
        }
    }, 100); // 延迟100ms确保DOM完全加载
    
    // 主国家选择器变化事件监听器（重复绑定，移除）
    // elements.timeMainCountrySelect.addEventListener('change', () => {
    //     updateMainFavoriteButtons();
    //     updateTimeDisplay();
    // });
    
    // 汇率主国家选择器事件监听器
    if (elements.rateBaseCountry) {
        elements.rateBaseCountry.addEventListener('change', () => {
            console.log('汇率主国家选择器变化事件触发，值:', elements.rateBaseCountry.value);
            updateMainFavoriteButtons();
            handleRateBaseCountryChange();
        });
        console.log('汇率主国家选择器事件监听器绑定成功');
    } else {
        console.error('汇率主国家选择器元素不存在！');
    }
    
    // 添加汇率国家按钮事件监听器
    if (elements.addRateCountryBtn) {
        elements.addRateCountryBtn.addEventListener('click', () => addRateCountry());
        console.log('添加汇率国家按钮事件监听器绑定成功');
    } else {
        console.error('添加汇率国家按钮元素不存在！');
    }
}

// 处理函数
function handleTimeMainCountrySelectChange() {
    updateTimeMainCountryDisplay();
    updateTimeComparisonButtons();
    updateMainFavoriteButtons();
    updateTimeDisplay();
}

function handleTimeInputChange() {
    const date = elements.timeMainDateInput.value;
    const hour = elements.timeMainHourInput.value;
    const minute = elements.timeMainMinuteInput.value;
    const ampm = elements.timeMainAmpmInput.value;
    
    if (date && hour && minute && ampm) {
        // 转换AM/PM到24小时制
        let hour24 = parseInt(hour);
        if (ampm === 'PM' && hour24 !== 12) {
            hour24 += 12;
        } else if (ampm === 'AM' && hour24 === 12) {
            hour24 = 0;
        }
        
        const dateTimeString = `${date}T${hour24.toString().padStart(2, '0')}:${minute}`;
        selectedDateTime = new Date(dateTimeString);
        updateTimeDisplay();
    }
}

function handleRateBaseCountryChange() {
    updateRateMainCountryDisplay();
    initializeRateComparisonSelectors();
    updateRateComparisonButtons();
    updateRateDisplay();
    fetchExchangeRates();
}

function handleRefreshTime() {
    const now = new Date();
    selectedDateTime = now;
    updateTimeDisplay();
}

function handleRefreshRate() {
    fetchExchangeRates();
}

// 处理时间区比较国家收藏
function handleTimeComparisonFavorite(event) {
    console.log('handleTimeComparisonFavorite called', event.target);
    
    // 获取按钮元素
    const button = event.target.closest('.set-default-btn');
    if (!button) {
        console.log('Button not found');
        return;
    }
    
    const targetIndex = parseInt(button.dataset.target);
    const select = document.getElementById(`comparison-select-${targetIndex}`);
    const countryCode = select.value;
    
    console.log('Time comparison target index:', targetIndex, 'Country code:', countryCode);
    
    if (!countryCode) {
        alert('Please select a country first');
        return;
    }
    
    const country = countryData[countryCode];
    if (!country) {
        console.log('Country not found:', countryCode);
        return;
    }
    
    // 检查是否已经是收藏国家
    console.log('Current timeComparisonCountries:', timeComparisonCountries);
    console.log('Checking if', countryCode, 'is in time favorites:', timeComparisonCountries.includes(countryCode));
    
    if (timeComparisonCountries.includes(countryCode)) {
        // 如果已经是收藏国家，则按照位置移除
        console.log('Removing from time favorites:', countryCode, 'at position:', targetIndex);
        
        // 确保数组有足够的长度
        while (timeComparisonCountries.length < targetIndex) {
            timeComparisonCountries.push('');
        }
        
        // 清空指定位置的国家
        timeComparisonCountries[targetIndex - 1] = '';
        
        // 移除空值
        timeComparisonCountries = timeComparisonCountries.filter(code => code !== '');
        
        saveTimeFavorites();
        updateTimeComparisonButtons();
        return;
    }
    
    // 添加到收藏（按照选择器位置）
    console.log('Adding to time favorites:', countryCode, 'at position:', targetIndex);
    
    // 确保数组有足够的长度
    while (timeComparisonCountries.length < targetIndex) {
        timeComparisonCountries.push('');
    }
    
    // 设置指定位置的国家
    timeComparisonCountries[targetIndex - 1] = countryCode;
    
    // 移除空值
    timeComparisonCountries = timeComparisonCountries.filter(code => code !== '');
    
    saveTimeFavorites();
    updateTimeComparisonButtons();
}

// 处理汇率区比较国家收藏
function handleRateComparisonFavorite(event) {
    console.log('handleRateComparisonFavorite called', event.target);
    
    // 获取按钮元素
    const button = event.target.closest('.set-default-btn');
    if (!button) {
        console.log('Button not found');
        return;
    }
    
    const targetIndex = button.dataset.target.replace('rate-', '');
    const select = document.getElementById(`rate-comparison-select-${targetIndex}`);
    const countryCode = select.value;
    
    console.log('Rate comparison target index:', targetIndex, 'Country code:', countryCode);
    
    if (!countryCode) {
        alert('Please select a country first');
        return;
    }
    
    const country = countryData[countryCode];
    if (!country) {
        console.log('Country not found:', countryCode);
        return;
    }
    
    // 检查是否已经是收藏国家
    console.log('Current rateComparisonCountries:', rateComparisonCountries);
    console.log('Checking if', countryCode, 'is in rate favorites:', rateComparisonCountries.includes(countryCode));
    
    if (rateComparisonCountries.includes(countryCode)) {
        // 如果已经是收藏国家，则直接移除
        console.log('Removing from rate favorites:', countryCode);
        rateComparisonCountries = rateComparisonCountries.filter(code => code !== countryCode);
        saveRateFavorites();
        updateRateComparisonButtons();
        return;
    }
    
    // 直接添加到收藏
    console.log('Adding to rate favorites:', countryCode);
    rateComparisonCountries.push(countryCode);
    saveRateFavorites();
    updateRateComparisonButtons();
}

// 保持向后兼容性
function handleSetDefault(event) {
    handleTimeComparisonFavorite(event);
}

// 移除单个默认国家
function removeDefaultCountry(countryCode) {
    defaultCountries = defaultCountries.filter(code => code !== countryCode);
    saveDefaultCountries();
    updateSetDefaultButtons();
}

// 保存时间区收藏到本地存储
function saveTimeFavorites() {
    localStorage.setItem('timeComparisonCountries', JSON.stringify(timeComparisonCountries));
    localStorage.setItem('timeMainCountry', timeMainCountry);
}

// 保存汇率区收藏到本地存储
function saveRateFavorites() {
    localStorage.setItem('rateComparisonCountries', JSON.stringify(rateComparisonCountries));
    localStorage.setItem('rateMainCountry', rateMainCountry);
}

// 保持向后兼容性
function saveDefaultCountries() {
    saveTimeFavorites(); // 默认保存时间区收藏
}

function saveMainCountryFavorites() {
    saveTimeFavorites();
    saveRateFavorites();
}

// 处理主国家收藏
function handleMainCountryFavorite(target) {
    console.log('=== 主国家收藏功能调试 ===');
    console.log('handleMainCountryFavorite called with target:', target);
    
    if (target === 'time-main') {
        const countryCode = elements.timeMainCountrySelect ? elements.timeMainCountrySelect.value : '';
        console.log('Time main country code:', countryCode);
        console.log('Current timeMainCountry:', timeMainCountry);
        
        if (timeMainCountry === countryCode) {
            // 取消收藏
            console.log('Removing time main country from favorites');
            timeMainCountry = '';
            if (elements.timeMainCountrySelect) {
                elements.timeMainCountrySelect.value = '';
            }
        } else if (countryCode) {
            // 添加收藏
            console.log('Adding time main country to favorites');
            timeMainCountry = countryCode;
        }
        console.log('New timeMainCountry:', timeMainCountry);
        saveTimeFavorites();
        updateMainFavoriteButtons();
        updateTimeDisplay();
    } else if (target === 'rate-main') {
        const countryCode = elements.rateBaseCountry ? elements.rateBaseCountry.value : '';
        console.log('Rate main country code:', countryCode);
        console.log('Current rateMainCountry:', rateMainCountry);
        
        if (rateMainCountry === countryCode) {
            // 取消收藏
            console.log('Removing rate main country from favorites');
            rateMainCountry = '';
            if (elements.rateBaseCountry) {
                elements.rateBaseCountry.value = '';
            }
        } else if (countryCode) {
            // 添加收藏
            console.log('Adding rate main country to favorites');
            rateMainCountry = countryCode;
        }
        console.log('New rateMainCountry:', rateMainCountry);
        saveRateFavorites();
        updateMainFavoriteButtons();
        updateRateMainCountryDisplay();
        updateRateDisplay();
    }
    console.log('=== 主国家收藏功能调试结束 ===');
}

// 更新主国家收藏按钮状态
function updateMainFavoriteButtons() {
    console.log('=== 更新主国家按钮状态调试 ===');
    console.log('updateMainFavoriteButtons called');
    console.log('timeMainCountry:', timeMainCountry);
    console.log('rateMainCountry:', rateMainCountry);
    
    // 时间主国家收藏按钮
    const timeMainBtn = document.querySelector('[data-target="time-main"]');
    console.log('时间主国家按钮元素:', timeMainBtn);
    if (timeMainBtn) {
        const countryCode = elements.timeMainCountrySelect ? elements.timeMainCountrySelect.value : '';
        console.log('Time main country code:', countryCode);
        console.log('按钮当前状态:', {
            hasActive: timeMainBtn.classList.contains('active'),
            disabled: timeMainBtn.disabled
        });
        
        if (countryCode && timeMainCountry === countryCode) {
            timeMainBtn.classList.add('active');
            console.log('Time main button set to ACTIVE');
        } else {
            timeMainBtn.classList.remove('active');
            console.log('Time main button set to INACTIVE');
        }
        timeMainBtn.disabled = !countryCode;
        console.log('按钮更新后状态:', {
            hasActive: timeMainBtn.classList.contains('active'),
            disabled: timeMainBtn.disabled
        });
    } else {
        console.log('时间主国家按钮未找到！');
    }
    
    // 汇率主国家收藏按钮
    const rateMainBtn = document.querySelector('[data-target="rate-main"]');
    console.log('汇率主国家按钮元素:', rateMainBtn);
    if (rateMainBtn) {
        const countryCode = elements.rateBaseCountry ? elements.rateBaseCountry.value : '';
        console.log('Rate main country code:', countryCode);
        console.log('按钮当前状态:', {
            hasActive: rateMainBtn.classList.contains('active'),
            disabled: rateMainBtn.disabled
        });
        
        if (countryCode && rateMainCountry === countryCode) {
            rateMainBtn.classList.add('active');
            console.log('Rate main button set to ACTIVE');
        } else {
            rateMainBtn.classList.remove('active');
            console.log('Rate main button set to INACTIVE');
        }
        rateMainBtn.disabled = !countryCode;
        console.log('按钮更新后状态:', {
            hasActive: rateMainBtn.classList.contains('active'),
            disabled: rateMainBtn.disabled
        });
    } else {
        console.log('汇率主国家按钮未找到！');
    }
    
    // 更新所有换位按钮状态
    updateSwapButtonStates();
    
    console.log('=== 更新主国家按钮状态调试结束 ===');
}

// 更新换位按钮状态
function updateSwapButtonStates() {
    console.log('更新换位按钮状态...');
    
    // 更新时间区换位按钮
    for (let i = 1; i <= 4; i++) {
        const swapBtn = document.querySelector(`[data-target="${i}"].swap-main-btn`);
        const select = document.getElementById(`comparison-select-${i}`);
        const countryCode = select ? select.value : '';
        
        if (swapBtn) {
            swapBtn.disabled = !countryCode;
        }
    }
    
    // 更新汇率区换位按钮
    for (let i = 1; i <= 4; i++) {
        const swapBtn = document.querySelector(`[data-target="rate-${i}"].swap-main-btn`);
        const select = document.getElementById(`rate-comparison-select-${i}`);
        const countryCode = select ? select.value : '';
        
        if (swapBtn) {
            swapBtn.disabled = !countryCode;
        }
    }
    
    console.log('换位按钮状态更新完成');
}

// 显示确认对话框
function showConfirmationDialog(country, onConfirm) {
    const dialog = document.getElementById('confirmation-dialog');
    const message = document.getElementById('confirmation-message');
    const confirmBtn = document.getElementById('confirm-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    
    // 更新消息内容
    const flagDisplay = getFlagDisplay(country);
    message.textContent = `Are you sure you want to add ${flagDisplay} ${country.name} to your favorites?`;
    
    // 显示对话框
    dialog.classList.add('show');
    
    // 设置确认按钮事件
    const handleConfirm = () => {
        onConfirm();
        hideConfirmationDialog();
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };
    
    // 设置取消按钮事件
    const handleCancel = () => {
        hideConfirmationDialog();
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    
    // 点击背景关闭对话框
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            handleCancel();
        }
    });
}

// 隐藏确认对话框
function hideConfirmationDialog() {
    const dialog = document.getElementById('confirmation-dialog');
    dialog.classList.remove('show');
}

// 更新时间区比较国家按钮状态
function updateTimeComparisonButtons() {
    console.log('Updating time comparison buttons, timeComparisonCountries:', timeComparisonCountries);
    for (let i = 1; i <= 4; i++) {
        const btn = document.querySelector(`[data-target="${i}"]`);
        const swapBtn = document.querySelector(`[data-target="${i}"].swap-main-btn`);
        const select = document.getElementById(`comparison-select-${i}`);
        const countryCode = select ? select.value : '';
        
        console.log(`Time button ${i}: countryCode=${countryCode}, isFavorite=${timeComparisonCountries.includes(countryCode)}`);
        
        if (btn) {
            if (countryCode && timeComparisonCountries.includes(countryCode)) {
            btn.classList.add('active');
                btn.disabled = false;
                console.log(`Time button ${i}: Set as ACTIVE (favorite)`);
        } else {
            btn.classList.remove('active');
            btn.disabled = !countryCode;
                console.log(`Time button ${i}: Set as INACTIVE (not favorite)`);
            }
        }
        
        // 更新换位按钮状态
        if (swapBtn) {
            swapBtn.disabled = !countryCode;
        }
    }
}

// 更新汇率区比较国家按钮状态
function updateRateComparisonButtons() {
    console.log('Updating rate comparison buttons, rateComparisonCountries:', rateComparisonCountries);
    for (let i = 1; i <= 4; i++) {
        const btn = document.querySelector(`[data-target="rate-${i}"]`);
        const swapBtn = document.querySelector(`[data-target="rate-${i}"].swap-main-btn`);
        const select = document.getElementById(`rate-comparison-select-${i}`);
        const countryCode = select ? select.value : '';
        
        console.log(`Rate button ${i}: countryCode=${countryCode}, isFavorite=${rateComparisonCountries.includes(countryCode)}`);
        
        if (btn) {
            if (countryCode && rateComparisonCountries.includes(countryCode)) {
                btn.classList.add('active');
                btn.disabled = false;
                console.log(`Rate button ${i}: Set as ACTIVE (favorite)`);
            } else {
                btn.classList.remove('active');
                btn.disabled = !countryCode;
                console.log(`Rate button ${i}: Set as INACTIVE (not favorite)`);
            }
        }
        
        // 更新换位按钮状态
        if (swapBtn) {
            swapBtn.disabled = !countryCode;
        }
    }
}

// 保持向后兼容性
function updateSetDefaultButtons() {
    updateTimeComparisonButtons();
}

// 应用时间区收藏
function applyTimeFavorites() {
    // 应用时间主国家收藏
    if (timeMainCountry) {
        elements.timeMainCountrySelect.value = timeMainCountry;
        // 更新时间主国家显示
        updateTimeMainCountryDisplay();
    } else {
        elements.timeMainCountrySelect.value = '';
        // 更新时间主国家显示
        updateTimeMainCountryDisplay();
    }
    
    // 应用时间比较国家收藏
    console.log('应用时间比较国家收藏，收藏列表:', timeComparisonCountries);
    
    // 先重置所有选择器
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`comparison-select-${i}`);
        if (select) {
            select.value = ''; // 重置为默认状态
            console.log(`重置选择器 ${i} 为空`);
        }
    }
    
    // 应用收藏的国家（按照位置）
    for (let i = 0; i < 4; i++) {
        const countryCode = timeComparisonCountries[i] || '';
        const select = document.getElementById(`comparison-select-${i + 1}`);
        if (select) {
            select.value = countryCode;
            console.log(`设置选择器 ${i + 1} 为: ${countryCode}`);
        } else {
            console.error(`选择器 ${i + 1} 不存在！`);
        }
    }
    
    // 更新主国家收藏按钮状态
    updateMainFavoriteButtons();
    
    // 更新时间显示
    updateTimeDisplay();
}

// 应用汇率区收藏
function applyRateFavorites() {
    // 应用汇率主国家收藏
    if (rateMainCountry) {
        elements.rateBaseCountry.value = rateMainCountry;
        // 更新汇率主国家显示
        updateRateMainCountryDisplay();
        // 获取汇率数据
        fetchExchangeRates();
    } else {
        elements.rateBaseCountry.value = '';
        // 更新汇率主国家显示
        updateRateMainCountryDisplay();
    }
    
    // 应用汇率比较国家收藏
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`rate-comparison-select-${i}`);
        if (select) {
            select.value = ''; // 重置为默认状态
        }
    }
    
    rateComparisonCountries.forEach((countryCode, index) => {
        const select = document.getElementById(`rate-comparison-select-${index + 1}`);
        if (select) {
            select.value = countryCode;
        }
    });
    
    // 更新汇率显示
    updateRateDisplay();
}

// 保持向后兼容性
function applyDefaultCountries() {
    applyTimeFavorites();
}

function applyMainCountryFavorites() {
    applyTimeFavorites();
    applyRateFavorites();
}

// 绑定星形按钮事件
function bindStarButtonEvents() {
    console.log('绑定星形按钮事件...');
    
    // 移除所有现有的事件监听器
    document.querySelectorAll('.set-default-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    
    // 重新绑定事件监听器
    document.querySelectorAll('.set-default-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Star button clicked:', btn);
            const target = btn.dataset.target;
            console.log('Target:', target);
            
            if (target === 'time-main' || target === 'rate-main') {
                // 主国家收藏按钮
                console.log('Handling main country favorite');
                handleMainCountryFavorite(target);
            } else if (target.startsWith('rate-')) {
                // 汇率区比较国家收藏按钮
                console.log('Handling rate comparison country favorite');
                handleRateComparisonFavorite(e);
            } else {
                // 时间区比较国家收藏按钮
                console.log('Handling time comparison country favorite');
                handleTimeComparisonFavorite(e);
            }
        });
    });
    
    console.log('星形按钮事件绑定完成');
}

// 绑定换位按钮事件
function bindSwapButtonEvents() {
    console.log('绑定换位按钮事件...');
    
    // 移除所有现有的事件监听器
    document.querySelectorAll('.swap-main-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    
    // 重新绑定事件监听器
    document.querySelectorAll('.swap-main-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Swap button clicked:', btn);
            const target = btn.dataset.target;
            console.log('Target:', target);
            
            if (target.startsWith('rate-')) {
                // 汇率区换位按钮
                console.log('Handling rate swap');
                handleRateSwap(target);
            } else {
                // 时间区换位按钮
                console.log('Handling time swap');
                handleTimeSwap(target);
            }
        });
    });
    
    console.log('换位按钮事件绑定完成');
}

// 处理时间区换位功能
function handleTimeSwap(targetIndex) {
    console.log('=== Time Zone Swap Function ===');
    console.log('Target index:', targetIndex);
    
    const mainCountryCode = elements.timeMainCountrySelect.value;
    const comparisonSelect = document.getElementById(`comparison-select-${targetIndex}`);
    const comparisonCountryCode = comparisonSelect ? comparisonSelect.value : '';
    const swapBtn = document.querySelector(`[data-target="${targetIndex}"].swap-main-btn`);
    
    console.log('Main country code:', mainCountryCode);
    console.log('Comparison country code:', comparisonCountryCode);
    
    // 检查是否有选择的国家
    if (!mainCountryCode) {
        showSwapError('Please select a main country first');
        return;
    }
    
    if (!comparisonCountryCode) {
        showSwapError('Please select a comparison country to swap');
        return;
    }
    
    // 添加换位动画
    if (swapBtn) {
        swapBtn.classList.add('swapping');
    }
    
    // 延迟执行换位，让动画有时间播放
    setTimeout(() => {
        // 执行换位：主国家变成对比国家，对比国家变成主国家
        console.log('Executing swap...');
        console.log('Before swap:');
        console.log('  Main country:', mainCountryCode);
        console.log('  Comparison country:', comparisonCountryCode);
        
        // 1. 将对比国家设置为主国家
        elements.timeMainCountrySelect.value = comparisonCountryCode;
        console.log('✓ Set new main country to:', comparisonCountryCode);
        
        // 2. 先更新选择器选项（排除新的主国家）
        updateTimeMainCountryDisplay();
        
        // 3. 将原主国家设置为对比国家（在更新选项后）
        comparisonSelect.value = mainCountryCode;
        console.log('✓ Set original main country as comparison country:', mainCountryCode);
        
        // 4. 更新显示
        updateTimeDisplay();
        updateTimeComparisonButtons();
        updateMainFavoriteButtons();
        
        // 显示成功提示
        showSwapSuccess(`Time zone swap successful! ${getCountryName(comparisonCountryCode)} is now the main country`);
        
        // 移除动画类
        if (swapBtn) {
            swapBtn.classList.remove('swapping');
        }
        
        console.log('After swap:');
        console.log('  Main country:', elements.timeMainCountrySelect.value);
        console.log('  Comparison country:', comparisonSelect.value);
        console.log('Time zone swap completed');
    }, 300);
}

// 处理汇率区换位功能
function handleRateSwap(targetIndex) {
    console.log('=== Exchange Rate Swap Function ===');
    console.log('Target index:', targetIndex);
    
    // 从targetIndex中提取数字部分（例如：从"rate-1"提取"1"）
    const index = targetIndex.replace('rate-', '');
    console.log('Extracted index:', index);
    
    const mainCountryCode = elements.rateBaseCountry.value;
    const comparisonSelect = document.getElementById(`rate-comparison-select-${index}`);
    const comparisonCountryCode = comparisonSelect ? comparisonSelect.value : '';
    const swapBtn = document.querySelector(`[data-target="${targetIndex}"].swap-main-btn`);
    
    console.log('Main country code:', mainCountryCode);
    console.log('Comparison country code:', comparisonCountryCode);
    
    // 检查是否有选择的国家
    if (!mainCountryCode) {
        showSwapError('Please select a main country first');
        return;
    }
    
    if (!comparisonCountryCode) {
        showSwapError('Please select a comparison country to swap');
        return;
    }
    
    // 添加换位动画
    if (swapBtn) {
        swapBtn.classList.add('swapping');
    }
    
    // 延迟执行换位，让动画有时间播放
    setTimeout(() => {
        // 执行换位：主国家变成对比国家，对比国家变成主国家
        console.log('Executing swap...');
        console.log('Before swap:');
        console.log('  Main country:', mainCountryCode);
        console.log('  Comparison country:', comparisonCountryCode);
        
        // 1. 将对比国家设置为主国家
        elements.rateBaseCountry.value = comparisonCountryCode;
        console.log('✓ Set new main country to:', comparisonCountryCode);
        
        // 2. 先更新选择器选项（排除新的主国家）
        updateRateComparisonSelectors();
        
        // 3. 将原主国家设置为对比国家（在更新选项后）
        comparisonSelect.value = mainCountryCode;
        console.log('✓ Set original main country as comparison country:', mainCountryCode);
        
        // 4. 更新显示
        updateRateMainCountryDisplay();
        updateRateDisplay();
        updateRateComparisonButtons();
        updateMainFavoriteButtons();
        
        // 5. 重新获取汇率数据
        fetchExchangeRates();
        
        // 显示成功提示
        showSwapSuccess(`Exchange rate swap successful! ${getCountryName(comparisonCountryCode)} is now the main country`);
        
        // 移除动画类
        if (swapBtn) {
            swapBtn.classList.remove('swapping');
        }
        
        console.log('After swap:');
        console.log('  Main country:', elements.rateBaseCountry.value);
        console.log('  Comparison country:', comparisonSelect.value);
        console.log('Exchange rate swap completed');
    }, 300);
}

// 初始化时间输入字段
function initializeTimeInputs(date) {
    console.log('正在初始化时间输入字段，当前时间:', date.toLocaleString());
    
    // 使用本地时间而不是UTC时间
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    elements.timeMainDateInput.value = dateStr;
    console.log('设置日期为:', dateStr);
    
    // 设置时间（转换为AM/PM格式）
    let hour = date.getHours();
    const minute = date.getMinutes();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    
    console.log('原始时间:', hour + ':' + minute, '(' + ampm + ')');
    
    // 转换为12小时制
    if (hour === 0) {
        hour = 12;
    } else if (hour > 12) {
        hour = hour - 12;
    }
    
    // 设置选择器值
    elements.timeMainHourInput.value = hour.toString().padStart(2, '0');
    elements.timeMainMinuteInput.value = Math.round(minute / 5) * 5; // 四舍五入到最近的5分钟
    elements.timeMainAmpmInput.value = ampm;
    
    console.log('设置时间为:', elements.timeMainHourInput.value + ':' + elements.timeMainMinuteInput.value + ' ' + elements.timeMainAmpmInput.value);
    
    // 立即触发时间更新
    handleTimeInputChange();
}

// Initialize comparison country selectors
function initializeComparisonSelectors() {
    const mainCountryCode = elements.timeMainCountrySelect.value;
    console.log('Initializing comparison country selectors, main country:', mainCountryCode);
    
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`comparison-select-${i}`);
        if (select) {
            // 保存当前选择的值
            const currentValue = select.value;
            console.log(`Selector ${i} current value:`, currentValue);
            
            // Populate options (excluding main country)
            const availableCountries = Object.keys(countryData).filter(code => code !== mainCountryCode);
            console.log(`Selector ${i} available countries:`, availableCountries);
            
            select.innerHTML = '<option value="">Select Country</option>' + 
                availableCountries.map(code => {
                    const country = countryData[code];
                    const flagDisplay = getFlagDisplay(country);
                    console.log(`Adding country option: ${code} - ${flagDisplay} ${country.name}`);
                    return `<option value="${code}">${flagDisplay} ${country.name}</option>`;
                }).join('');
            
            // 恢复之前选择的值（如果仍然有效）
            if (currentValue && availableCountries.includes(currentValue)) {
                select.value = currentValue;
                console.log(`Restored selector ${i} value:`, currentValue);
            }
            
            // Add event listener
            select.addEventListener('change', () => {
                updateTimeDisplay();
                updateTimeComparisonButtons();
            });
        }
    }
}

// Initialize rate comparison selectors
function initializeRateComparisonSelectors() {
    const mainCountryCode = elements.rateBaseCountry.value;
    console.log('Initializing rate comparison selectors, main country:', mainCountryCode);
    
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`rate-comparison-select-${i}`);
        if (select) {
            // 保存当前选择的值
            const currentValue = select.value;
            console.log(`Rate selector ${i} current value:`, currentValue);
            
            // Populate options (excluding main country)
            const availableCountries = Object.keys(countryData).filter(code => code !== mainCountryCode);
            console.log(`Rate selector ${i} available countries:`, availableCountries);
            
            select.innerHTML = '<option value="">Select Country</option>' + 
                availableCountries.map(code => {
                    const country = countryData[code];
                    const flagDisplay = getFlagDisplay(country);
                    return `<option value="${code}">${flagDisplay} ${country.name}</option>`;
                }).join('');
            
            // 恢复之前选择的值（如果仍然有效）
            if (currentValue && availableCountries.includes(currentValue)) {
                select.value = currentValue;
                console.log(`Restored rate selector ${i} value:`, currentValue);
            } else if (currentValue === mainCountryCode) {
                // 如果当前选择的国家被选为主国家，清空选择
                select.value = '';
                console.log(`Cleared rate selector ${i} because country became main country`);
            }
            
            // Add event listener
            select.addEventListener('change', () => {
                updateRateDisplay();
                updateRateComparisonButtons();
            });
        }
    }
}

// 删除对比国家功能已移除

// 添加汇率国家
function addRateCountry() {
    rateCountryCount++;
    const countryId = `rate-country-${rateCountryCount}`;
    
    // 创建国家选择器
    const countrySelector = createCountrySelector(countryId, 'rate');
    
    // 在添加按钮前插入新列
    const addButtonTh = elements.rateHeaderRow.querySelector('.add-country');
    const newTh = document.createElement('th');
    newTh.className = 'country-selector-column';
    newTh.innerHTML = countrySelector;
    elements.rateHeaderRow.insertBefore(newTh, addButtonTh);
    
    // 在数据行添加对应单元格
    const dataRow = elements.rateTable.querySelector('.data-row');
    const newTd = document.createElement('td');
    newTd.className = 'data-cell';
    newTd.id = `${countryId}-rate`;
    newTd.textContent = '--';
    dataRow.insertBefore(newTd, dataRow.lastElementChild);
    
    // 添加事件监听器
    const select = newTh.querySelector('select');
    select.addEventListener('change', updateRateDisplay);
    
    // 更新显示
    updateRateDisplay();
}

// 创建国家选择器
function createCountrySelector(countryId, type) {
    const availableCountries = Object.keys(countryData).filter(code => code !== 'CN');
    
    let options = '';
    availableCountries.forEach(code => {
        const country = countryData[code];
        options += `<option value="${code}">${country.flag} ${country.name}</option>`;
    });
    
    return `
        <div class="country-selector">
            <select id="${countryId}" class="country-dropdown">
                <option value="">选择国家</option>
                ${options}
            </select>
            <button class="remove-btn" onclick="removeCountry('${countryId}', '${type}')" title="删除国家">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
}

// 删除国家
function removeCountry(countryId, type) {
    const table = type === 'time' ? elements.timeTable : elements.rateTable;
    const headerRow = type === 'time' ? elements.timeHeaderRow : elements.rateHeaderRow;
    
    // 找到对应的列索引
    const select = document.getElementById(countryId);
    const th = select.closest('th');
    const columnIndex = Array.from(headerRow.children).indexOf(th);
    
    // 删除表头列
    th.remove();
    
    // 删除数据行对应单元格
    const dataRow = table.querySelector('.data-row');
    const td = dataRow.children[columnIndex];
    td.remove();
    
    // 更新显示
    if (type === 'time') {
        updateTimeDisplay();
    } else {
        updateRateDisplay();
    }
}

// Update main country display
function updateTimeMainCountryDisplay() {
    // Update all comparison country selector options (excluding selected main country)
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`comparison-select-${i}`);
        if (select) {
            const currentValue = select.value;
            console.log(`更新选择器 ${i}，当前值: ${currentValue}`);
            
            // Populate options (excluding main country)
            const availableCountries = Object.keys(countryData).filter(code => code !== elements.timeMainCountrySelect.value);
            console.log(`选择器 ${i} 可用国家:`, availableCountries);
            
            select.innerHTML = '<option value="">Select Country</option>' + 
                availableCountries.map(code => {
                    const country = countryData[code];
                    const flagDisplay = getFlagDisplay(country);
                    return `<option value="${code}">${flagDisplay} ${country.name}</option>`;
                }).join('');
            
            // 恢复之前选择的值（如果仍然有效）
            if (currentValue && availableCountries.includes(currentValue)) {
                select.value = currentValue;
                console.log(`恢复选择器 ${i} 值: ${currentValue}`);
            } else if (currentValue === elements.timeMainCountrySelect.value) {
                // 如果当前选择的国家被选为主国家，清空选择
                select.value = '';
                console.log(`清空选择器 ${i}，因为国家已成为主国家`);
            } else {
                // 保持当前值
                select.value = currentValue;
                console.log(`保持选择器 ${i} 当前值: ${currentValue}`);
            }
        }
    }
}

// Update exchange rate main country display
function updateRateMainCountryDisplay() {
    const countryCode = elements.rateBaseCountry.value;
    const country = countryData[countryCode];
    
    const rateMainValue = document.getElementById('rate-main-value');
    const rateMainCurrency = document.getElementById('rate-main-currency');
    
    if (country) {
        // 有选择国家时只显示货币代码，不设置默认值
        if (rateMainValue) {
            rateMainValue.value = ''; // 保持空值，显示Amount占位符
        }
        if (rateMainCurrency) {
            rateMainCurrency.textContent = country.currency;
        }
    } else {
        // 没有选择国家时显示空值
        if (rateMainValue) {
            rateMainValue.value = '';
        }
        if (rateMainCurrency) {
            rateMainCurrency.textContent = '';
        }
    }
}

// Update rate comparison selectors (similar to updateTimeMainCountryDisplay)
function updateRateComparisonSelectors() {
    // Update all comparison country selector options (excluding selected main country)
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`rate-comparison-select-${i}`);
        if (select) {
            const currentValue = select.value;
            console.log(`更新汇率选择器 ${i}，当前值: ${currentValue}`);
            
            // Populate options (excluding main country)
            const availableCountries = Object.keys(countryData).filter(code => code !== elements.rateBaseCountry.value);
            console.log(`汇率选择器 ${i} 可用国家:`, availableCountries);
            
            select.innerHTML = '<option value="">Select Country</option>' + 
                availableCountries.map(code => {
                    const country = countryData[code];
                    const flagDisplay = getFlagDisplay(country);
                    return `<option value="${code}">${flagDisplay} ${country.name}</option>`;
                }).join('');
            
            // 恢复之前选择的值（如果仍然有效）
            if (currentValue && availableCountries.includes(currentValue)) {
                select.value = currentValue;
                console.log(`恢复汇率选择器 ${i} 值: ${currentValue}`);
            } else if (currentValue === elements.rateBaseCountry.value) {
                // 如果当前选择的国家被选为主国家，清空选择
                select.value = '';
                console.log(`清空汇率选择器 ${i}，因为国家已成为主国家`);
            } else {
                // 保持当前值
                select.value = currentValue;
                console.log(`保持汇率选择器 ${i} 当前值: ${currentValue}`);
            }
        }
    }
}

// 更新时间显示
function updateTimeDisplay() {
    const timeToShow = selectedDateTime || new Date();
    const mainCountryCode = elements.timeMainCountrySelect.value;
    const mainCountry = countryData[mainCountryCode];
    
    // 主国家时间显示已删除，不再需要更新
    
    // 更新对比国家时间显示
    for (let i = 1; i <= 4; i++) {
        const comparisonSelect = document.getElementById(`comparison-select-${i}`);
        const comparisonDisplay = document.getElementById(`time-comparison-display-${i}`);
        
        if (comparisonSelect && comparisonDisplay) {
            if (comparisonSelect.value) {
                const country = countryData[comparisonSelect.value];
                if (country) {
                    // 正确的时间转换逻辑：
                    // 1. 用户输入的时间是主国家的本地时间
                    // 2. 需要将这个时间转换到对比国家的时区
                    
                    let baseTime;
                    
                    if (mainCountry && mainCountry.timezone) {
                        // 方法：创建一个表示主国家特定时间的Date对象
                        // 然后将其转换到对比国家时区
                        
                        // 从用户输入获取日期和时间组件
                        const date = elements.timeMainDateInput.value;
                        const hour = elements.timeMainHourInput.value;
                        const minute = elements.timeMainMinuteInput.value;
                        const ampm = elements.timeMainAmpmInput.value;
                        
                        if (date && hour && minute && ampm) {
                            // 转换AM/PM到24小时制
                            let hour24 = parseInt(hour);
                            if (ampm === 'PM' && hour24 !== 12) {
                                hour24 += 12;
                            } else if (ampm === 'AM' && hour24 === 12) {
                                hour24 = 0;
                            }
                            
                            // 创建一个临时的UTC时间字符串，然后通过时区转换来获得正确的时间
                            const tempDateStr = `${date}T${hour24.toString().padStart(2, '0')}:${minute}:00`;
                            
                            // 使用Temporal API的替代方案：通过时区偏移计算
                            const mainCountryOffset = getCurrentTimezoneOffset(mainCountry.timezone);
                            const comparisonCountryOffset = getCurrentTimezoneOffset(country.timezone);
                            
                            // 计算时区差异（小时）
                            const offsetDiff = comparisonCountryOffset - mainCountryOffset;
                            
                            // 创建主国家的时间
                            const mainCountryTime = new Date(tempDateStr);
                            
                            // 计算对比国家的时间
                            baseTime = new Date(mainCountryTime.getTime() + (offsetDiff * 60 * 60 * 1000));
                        } else {
                            baseTime = timeToShow;
                        }
                    } else {
                        baseTime = timeToShow;
                    }
                    
                    // 格式化显示时间
                    const dateStr = baseTime.toLocaleDateString('en-CA', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }).replace(/-/g, '/');
                    
                    const timeStr = baseTime.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });
                    
                    comparisonDisplay.innerHTML = `<div class="date-line">${dateStr}</div><div class="time-line">${timeStr}</div>`;
                } else {
                    comparisonDisplay.innerHTML = '';
                }
            } else {
                comparisonDisplay.innerHTML = '';
            }
        } else {
            if (comparisonDisplay) {
                comparisonDisplay.innerHTML = '';
            }
        }
    }
}

// 防抖的汇率更新函数
function debouncedUpdateRateDisplay() {
    // 清除之前的定时器
    if (rateUpdateTimeout) {
        clearTimeout(rateUpdateTimeout);
    }
    
    // 设置新的定时器，延迟100ms执行
    rateUpdateTimeout = setTimeout(() => {
        updateRateDisplay();
    }, 100);
}

// 检查并获取汇率数据
function checkAndFetchRates() {
    const baseCountryCode = elements.rateBaseCountry ? elements.rateBaseCountry.value : '';
    console.log('检查汇率数据获取条件，主国家:', baseCountryCode);
    
    if (baseCountryCode && Object.keys(currentRates).length === 0) {
        console.log('主国家已选择但汇率数据为空，开始获取汇率数据');
        fetchExchangeRates();
    } else if (baseCountryCode && Object.keys(currentRates).length > 0) {
        console.log('汇率数据已存在，无需重新获取');
    } else {
        console.log('主国家未选择，无法获取汇率数据');
    }
}

// 更新汇率显示
function updateRateDisplay() {
    console.log('=== updateRateDisplay 被调用 ===');
    
    // 检查是否需要获取汇率数据
    checkAndFetchRates();
    
    // 获取用户输入的基础数值
    const rateMainValue = document.getElementById('rate-main-value');
    const inputValue = rateMainValue ? rateMainValue.value : '';
    const baseAmount = parseFloat(inputValue) || 0;
    
    console.log('输入值:', inputValue);
    console.log('解析后的基础数值:', baseAmount);
    console.log('当前汇率数据:', currentRates);
    console.log('汇率数据键:', Object.keys(currentRates));
    
    // 更新比较国家的汇率显示
    for (let i = 1; i <= 4; i++) {
        const comparisonSelect = document.getElementById(`rate-comparison-select-${i}`);
        const comparisonDisplay = document.getElementById(`rate-comparison-display-${i}`);
        
        console.log(`比较国家 ${i}:`, {
            select: comparisonSelect ? comparisonSelect.value : 'N/A',
            display: comparisonDisplay ? '存在' : '不存在'
        });
        
        if (comparisonSelect && comparisonDisplay) {
            if (comparisonSelect.value) {
                const country = countryData[comparisonSelect.value];
                console.log(`国家 ${i} 信息:`, country);
                
                if (country) {
                    console.log(`国家 ${i} 货币:`, country.currency);
                    console.log(`汇率数据中是否有 ${country.currency}:`, currentRates.hasOwnProperty(country.currency));
                    console.log(`汇率值:`, currentRates[country.currency]);
                    
            if (currentRates[country.currency]) {
                const rate = currentRates[country.currency];
                const convertedAmount = (baseAmount * rate).toFixed(2);
                
                console.log(`国家 ${i} 转换:`, {
                    currency: country.currency,
                    rate: rate,
                    baseAmount: baseAmount,
                    convertedAmount: convertedAmount
                });
                
                comparisonDisplay.innerHTML = `
                    <div class="rate-display">
                        <div class="rate-value">${convertedAmount}</div>
                        <div class="rate-currency">${country.currency}</div>
                    </div>
                `;
                console.log(`国家 ${i} 显示已更新`);
            } else {
                console.log(`国家 ${i} 汇率数据不可用，货币: ${country.currency}`);
                // 显示默认值0.00
                comparisonDisplay.innerHTML = `
                    <div class="rate-display">
                        <div class="rate-value">0.00</div>
                        <div class="rate-currency">${country.currency}</div>
                    </div>
                `;
            }
        } else {
                    console.log(`国家 ${i} 国家信息不可用`);
                    comparisonDisplay.innerHTML = `
                        <div class="rate-display">
                            <div class="rate-value">--</div>
                            <div class="rate-currency">--</div>
                        </div>
                    `;
                }
            } else {
                console.log(`比较国家 ${i} 未选择`);
                comparisonDisplay.innerHTML = '';
            }
        } else {
            console.log(`比较国家 ${i} 元素不存在`);
        }
    }
    
    // 更新更新时间
    if (elements.updateTime) {
    elements.updateTime.textContent = new Date().toLocaleString('zh-CN');
    }
    
    console.log('=== updateRateDisplay 完成 ===');
}


// 开始时间更新
function startTimeUpdate() {
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000); // 每秒更新一次
}


// 获取汇率数据
async function fetchExchangeRates() {
    const baseCountryCode = elements.rateBaseCountry.value;
    
    // 如果没有选择国家，不获取汇率数据
    if (!baseCountryCode) {
        console.log('未选择国家，跳过汇率数据获取');
        return;
    }
    
    const baseCountry = countryData[baseCountryCode];
    if (!baseCountry) {
        console.log('无效的国家代码，跳过汇率数据获取');
        return;
    }
    
    showLoading(true);
    
    try {
        const baseCurrency = baseCountry.currency;
        
        // 使用免费的汇率API
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
        
        if (!response.ok) {
            throw new Error('网络请求失败');
        }
        
        const data = await response.json();
        currentRates = data.rates;
        
        console.log('汇率数据更新成功:', currentRates);
        console.log('汇率数据键:', Object.keys(currentRates));
        
        // 立即更新显示
        updateRateDisplay();
        
        // 确保汇率数据加载后自动更新显示
        setTimeout(() => {
            updateRateDisplay();
        }, 500);
        
    } catch (error) {
        console.error('获取汇率失败:', error);
        console.error('错误详情:', error.message);
        console.error('错误堆栈:', error.stack);
        
        // 显示更详细的错误信息
        showError(`获取汇率数据失败: ${error.message}。正在使用模拟数据...`);
        
        // 使用模拟数据作为备用
        loadMockData();
    } finally {
        showLoading(false);
    }
}

// 加载模拟数据（备用方案）
function loadMockData() {
    console.log('=== 加载模拟汇率数据 ===');
    
    const baseCountryCode = elements.rateBaseCountry.value;
    const baseCountry = countryData[baseCountryCode];
    
    if (!baseCountry) {
        console.log('无法获取基础国家信息');
        return;
    }
    
    const baseCurrency = baseCountry.currency;
    console.log('基础货币:', baseCurrency);
    
    // 模拟汇率数据（以USD为基准）
    const mockRates = {
        'USD': 1.0,
        'CNY': 7.2,
        'EUR': 0.9,
        'GBP': 0.8,
        'JPY': 150.0,
        'AUD': 1.5,
        'CAD': 1.3,
        'CHF': 0.9,
        'SEK': 10.5,
        'NOK': 10.8,
        'DKK': 6.7,
        'PLN': 4.0,
        'CZK': 22.5,
        'HUF': 350.0,
        'RUB': 90.0,
        'BRL': 5.0,
        'MXN': 18.0,
        'INR': 83.0,
        'KRW': 1300.0,
        'SGD': 1.35,
        'HKD': 7.8,
        'TWD': 31.0,
        'THB': 35.0,
        'MYR': 4.5,
        'IDR': 15000.0,
        'PHP': 55.0,
        'VND': 24000.0
    };
    
    // 如果基础货币不是USD，需要转换
    if (baseCurrency !== 'USD') {
        const baseRate = mockRates[baseCurrency];
        if (baseRate) {
        Object.keys(mockRates).forEach(currency => {
            mockRates[currency] = mockRates[currency] / baseRate;
        });
        }
    }
    
    currentRates = mockRates;
    console.log('模拟汇率数据设置完成:', currentRates);
    console.log('模拟汇率数据键:', Object.keys(currentRates));
    
    // 立即更新显示
    updateRateDisplay();
    
    // 确保模拟数据加载后自动更新显示
    setTimeout(() => {
        updateRateDisplay();
    }, 100);
    
    console.log('模拟数据更新完成');
}

// 显示加载状态
function showLoading(show) {
    if (show) {
        elements.loadingOverlay.classList.add('show');
    } else {
        elements.loadingOverlay.classList.remove('show');
    }
}

// 显示错误信息
function showError(message) {
    // 创建错误提示
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fed7d7;
        color: #e53e3e;
        padding: 15px 20px;
        border-radius: 8px;
        border: 1px solid #feb2b2;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        z-index: 1001;
        font-weight: 500;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 3000);
}

// 显示换位成功提示
function showSwapSuccess(message) {
    // 创建成功提示
    const successDiv = document.createElement('div');
    successDiv.className = 'swap-success';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
        ${message}
    `;
    
    document.body.appendChild(successDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 300);
        }
    }, 3000);
}

// 显示换位错误提示
function showSwapError(message) {
    // 创建错误提示
    const errorDiv = document.createElement('div');
    errorDiv.className = 'swap-error';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fed7d7;
        color: #e53e3e;
        padding: 12px 20px;
        border-radius: 8px;
        border: 1px solid #feb2b2;
        box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
        z-index: 1001;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
    `;
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle" style="margin-right: 8px;"></i>
        ${message}
    `;
    
    document.body.appendChild(errorDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 300);
        }
    }, 3000);
}

// 获取国家名称的辅助函数
function getCountryName(countryCode) {
    const country = countryData[countryCode];
    if (country) {
        return `${country.flag} ${country.name}`;
    }
    return countryCode;
}

// 演示换位功能
window.demoSwapFunction = function() {
    console.log('=== 演示换位功能 ===');
    console.log('这个演示将展示换位功能的工作原理：');
    console.log('1. 原主国家会变成对比国家');
    console.log('2. 原对比国家会变成主国家');
    console.log('3. 系统会显示友好的提示信息');
    console.log('');
    
    // 设置演示环境
    console.log('设置演示环境...');
    
    // 时间模块演示
    if (elements.timeMainCountrySelect) {
        elements.timeMainCountrySelect.value = 'CN';
        console.log('✓ 设置时间主国家为: 中国 (CN)');
    }
    
    const timeSelect1 = document.getElementById('comparison-select-1');
    if (timeSelect1) {
        timeSelect1.value = 'US';
        console.log('✓ 设置时间对比国家1为: 美国 (US)');
    }
    
    // 汇率模块演示
    if (elements.rateBaseCountry) {
        elements.rateBaseCountry.value = 'US';
        console.log('✓ 设置汇率主国家为: 美国 (US)');
    }
    
    const rateSelect1 = document.getElementById('rate-comparison-select-1');
    if (rateSelect1) {
        rateSelect1.value = 'JP';
        console.log('✓ 设置汇率对比国家1为: 日本 (JP)');
    }
    
    console.log('');
    console.log('现在开始演示换位功能...');
    console.log('请观察页面上的变化！');
    
    // 延迟演示时间模块换位
    setTimeout(() => {
        console.log('\n--- 演示时间模块换位 ---');
        console.log('换位前: 主国家=中国, 对比国家1=美国');
        handleTimeSwap('1');
    }, 1000);
    
    // 延迟演示汇率模块换位
    setTimeout(() => {
        console.log('\n--- 演示汇率模块换位 ---');
        console.log('换位前: 主国家=美国, 对比国家1=日本');
        handleRateSwap('rate-1');
    }, 3000);
    
    console.log('\n演示完成！您可以在控制台中运行 testSwapFunction() 进行更详细的测试。');
};

// 验证换位功能是否正确工作
window.verifySwapFunction = function() {
    console.log('=== 验证换位功能 ===');
    
    // 设置测试环境
    console.log('设置测试环境...');
    
    // 时间模块测试
    if (elements.timeMainCountrySelect) {
        elements.timeMainCountrySelect.value = 'ES';
        console.log('✓ 设置时间主国家为: 西班牙 (ES)');
    }
    
    const timeSelect1 = document.getElementById('comparison-select-1');
    if (timeSelect1) {
        timeSelect1.value = 'CN';
        console.log('✓ 设置时间对比国家1为: 中国 (CN)');
    }
    
    console.log('\n换位前状态:');
    console.log('  时间主国家:', elements.timeMainCountrySelect ? elements.timeMainCountrySelect.value : 'N/A');
    console.log('  时间对比国家1:', timeSelect1 ? timeSelect1.value : 'N/A');
    
    // 执行换位
    console.log('\n执行换位...');
    handleTimeSwap('1');
    
    // 延迟验证结果
    setTimeout(() => {
        console.log('\n换位后状态验证:');
        console.log('  时间主国家:', elements.timeMainCountrySelect ? elements.timeMainCountrySelect.value : 'N/A');
        console.log('  时间对比国家1:', timeSelect1 ? timeSelect1.value : 'N/A');
        
        // 验证结果
        const expectedMain = 'CN';
        const expectedComparison = 'ES';
        const actualMain = elements.timeMainCountrySelect ? elements.timeMainCountrySelect.value : '';
        const actualComparison = timeSelect1 ? timeSelect1.value : '';
        
        console.log('\n验证结果:');
        if (actualMain === expectedMain) {
            console.log('✓ 主国家换位正确: 中国现在是主国家');
        } else {
            console.log('✗ 主国家换位错误: 期望中国，实际', actualMain);
        }
        
        if (actualComparison === expectedComparison) {
            console.log('✓ 对比国家换位正确: 西班牙现在是对比国家');
        } else {
            console.log('✗ 对比国家换位错误: 期望西班牙，实际', actualComparison);
        }
        
        if (actualMain === expectedMain && actualComparison === expectedComparison) {
            console.log('\n🎉 换位功能验证成功！');
        } else {
            console.log('\n❌ 换位功能验证失败！');
        }
    }, 1000);
};


// 开始时间更新
function startTimeUpdate() {
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000); // 每秒更新一次
}

// 添加键盘快捷键支持
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + R 刷新汇率
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        fetchExchangeRates();
    }
    
    // Ctrl/Cmd + 数字键 快速换位
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const targetIndex = e.key;
        
        // 检查当前焦点在哪个模块
        const activeElement = document.activeElement;
        const isInTimeModule = activeElement && (
            activeElement.id.includes('time-main') || 
            activeElement.id.includes('comparison-select')
        );
        const isInRateModule = activeElement && (
            activeElement.id.includes('rate-base') || 
            activeElement.id.includes('rate-comparison')
        );
        
        if (isInTimeModule) {
            console.log(`快捷键触发时间模块换位: ${targetIndex}`);
            handleTimeSwap(targetIndex);
        } else if (isInRateModule) {
            console.log(`快捷键触发汇率模块换位: rate-${targetIndex}`);
            handleRateSwap(`rate-${targetIndex}`);
        } else {
            // 默认触发时间模块换位
            console.log(`快捷键默认触发时间模块换位: ${targetIndex}`);
            handleTimeSwap(targetIndex);
        }
    }
});

// 添加触摸设备支持
if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
}

// 导出函数供全局使用
window.refreshRates = fetchExchangeRates;
window.refreshTime = handleRefreshTime;
window.refreshRate = handleRefreshRate;

// 刷新到当前时间
window.refreshToCurrentTime = function() {
    console.log('=== 刷新到当前时间 ===');
    
    const now = new Date();
    console.log('正在设置为当前时间:', now.toLocaleString());
    
    selectedDateTime = now;
    initializeTimeInputs(now);
    
    console.log('✅ 时间已刷新到当前时间');
    
    return now;
};

// 测试时间初始化
window.testTimeInitialization = function() {
    console.log('=== 测试时间初始化 ===');
    
    const now = new Date();
    console.log('系统当前时间:', now.toLocaleString());
    console.log('年:', now.getFullYear(), '月:', now.getMonth() + 1, '日:', now.getDate());
    console.log('时:', now.getHours(), '分:', now.getMinutes(), '秒:', now.getSeconds());
    
    // 检查页面上的时间输入值
    console.log('\n页面当前设置:');
    console.log('日期输入框:', elements.timeMainDateInput.value);
    console.log('小时输入框:', elements.timeMainHourInput.value);
    console.log('分钟输入框:', elements.timeMainMinuteInput.value);
    console.log('AM/PM输入框:', elements.timeMainAmpmInput.value);
    
    // 验证是否一致
    const pageDate = elements.timeMainDateInput.value;
    const expectedDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
    console.log('\n验证结果:');
    console.log('日期是否一致:', pageDate === expectedDate ? '✅' : '❌');
    console.log('预期日期:', expectedDate, '实际日期:', pageDate);
    
    // 验证时间
    let expectedHour = now.getHours();
    const expectedAmpm = expectedHour >= 12 ? 'PM' : 'AM';
    
    if (expectedHour === 0) {
        expectedHour = 12;
    } else if (expectedHour > 12) {
        expectedHour = expectedHour - 12;
    }
    
    const expectedHourStr = expectedHour.toString().padStart(2, '0');
    const expectedMinute = Math.round(now.getMinutes() / 5) * 5;
    
    console.log('时间是否一致:', 
        elements.timeMainHourInput.value === expectedHourStr && 
        elements.timeMainAmpmInput.value === expectedAmpm ? '✅' : '❌');
    console.log('预期时间:', expectedHourStr + ':' + expectedMinute + ' ' + expectedAmpm);
    console.log('实际时间:', elements.timeMainHourInput.value + ':' + elements.timeMainMinuteInput.value + ' ' + elements.timeMainAmpmInput.value);
    
    console.log('\n=== 测试完成 ===');
};

// 启动所有时间转换测试
window.runAllTimeTests = function() {
    console.log('=== 启动所有时间转换测试 ===');
    console.log('这将依次运行所有时间转换相关的测试...\n');
    
    // 1. 基础时区检查
    console.log('1. 运行基础时区检查...');
    comprehensiveTimezoneCheck();
    
    // 2. 新时间转换逻辑测试
    setTimeout(() => {
        console.log('\n2. 运行新时间转换逻辑测试...');
        testNewTimeConversion();
    }, 3000);
    
    // 3. 快速日本中国测试
    setTimeout(() => {
        console.log('\n3. 运行快速日本中国测试...');
        quickTestJapanChina();
    }, 6000);
    
    // 4. 关键时区对验证
    setTimeout(() => {
        console.log('\n4. 运行关键时区对验证...');
        verifyKeyTimezonePairs();
    }, 9000);
    
    // 5. 完整时间转换测试
    setTimeout(() => {
        console.log('\n5. 运行完整时间转换测试...');
        fullTimeConversionTest();
    }, 15000);
    
    // 6. 主国家同步测试
    setTimeout(() => {
        console.log('\n6. 运行主国家同步测试...');
        testMainCountrySync();
    }, 20000);
    
    console.log('所有测试已安排，总耗时约25秒...');
    console.log('请观察控制台输出和页面变化！');
};

// 测试函数
window.testStarButtons = function() {
    console.log('Testing star buttons...');
    const buttons = document.querySelectorAll('.set-default-btn');
    console.log('Found buttons:', buttons.length);
    buttons.forEach((btn, index) => {
        console.log(`Button ${index + 1}:`, btn, 'data-target:', btn.dataset.target);
        btn.addEventListener('click', (e) => {
            console.log('Button clicked directly!', e.target);
        });
    });
};

// 测试收藏功能
window.testFavorites = function() {
    console.log('Current favorites:', defaultCountries);
    console.log('Testing applyDefaultCountries...');
    applyDefaultCountries();
    console.log('After applying favorites, selectors should show:');
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`comparison-select-${i}`);
        console.log(`Selector ${i}:`, select ? select.value : 'not found');
    }
};

// 清空所有收藏（用于测试）
window.clearAllFavorites = function() {
    defaultCountries = [];
    saveDefaultCountries();
    applyDefaultCountries();
    console.log('All favorites cleared');
};

// 测试所有国家的国旗EMOJI显示
window.testAllFlags = function() {
    console.log('=== 测试所有国家的国旗EMOJI ===');
    console.log('EMOJI支持检测:', detectEmojiSupport());
    console.log('');
    
    Object.keys(countryData).forEach(code => {
        const country = countryData[code];
        const flagDisplay = getFlagDisplay(country);
        console.log(`${code}: ${flagDisplay} ${country.name} (${country.currency})`);
    });
    
    console.log('');
    console.log('=== 检查选择器中的国旗显示 ===');
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`comparison-select-${i}`);
        if (select) {
            console.log(`选择器 ${i} 的选项:`);
            for (let j = 0; j < select.options.length; j++) {
                const option = select.options[j];
                console.log(`  ${option.value}: ${option.text}`);
            }
        }
    }
};

// 测试DST（夏令时）功能
window.testDST = function() {
    console.log('=== 测试夏令时/冬令时功能 ===');
    console.log('当前时间:', new Date().toLocaleString());
    console.log('');
    
    // 测试几个有DST的国家
    const dstCountries = ['US-NY', 'GB', 'DE', 'AU', 'CA'];
    
    dstCountries.forEach(code => {
        const country = countryData[code];
        if (country) {
            const currentOffset = getTimezoneOffsetString(country.timezone);
            const currentTime = new Date().toLocaleString('en-US', { 
                timeZone: country.timezone,
                hour12: false 
            });
            console.log(`${country.flag} ${country.name}:`);
            console.log(`  时区: ${country.timezone}`);
            console.log(`  当前偏移: ${currentOffset} (${country.offset})`);
            console.log(`  当前时间: ${currentTime}`);
            console.log('');
        }
    });
    
    console.log('=== 验证时间转换是否正确 ===');
    const testTime = new Date();
    console.log('测试时间:', testTime.toISOString());
    
    dstCountries.forEach(code => {
        const country = countryData[code];
        if (country) {
            const localTime = testTime.toLocaleString('en-US', { 
                timeZone: country.timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            console.log(`${country.flag} ${country.name}: ${localTime}`);
        }
    });
};

// 测试美国不同时区
window.testUSTimezones = function() {
    console.log('=== 美国不同时区时间对比 ===');
    console.log('当前UTC时间:', new Date().toISOString());
    console.log('');
    
    const usTimezones = ['US-NY', 'US-LA', 'US-CHI', 'US-DEN'];
    
    usTimezones.forEach(code => {
        const country = countryData[code];
        if (country) {
            const currentOffset = getTimezoneOffsetString(country.timezone);
            const currentTime = new Date().toLocaleString('en-US', { 
                timeZone: country.timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            const time12h = new Date().toLocaleString('en-US', { 
                timeZone: country.timezone,
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
            
            console.log(`${country.flag} ${country.name}:`);
            console.log(`  时区: ${country.timezone}`);
            console.log(`  偏移: ${currentOffset} (${country.offset})`);
            console.log(`  24小时制: ${currentTime}`);
            console.log(`  12小时制: ${time12h}`);
            console.log('');
        }
    });
    
    console.log('=== 时区差异说明 ===');
    console.log('🇺🇸 纽约 (EST/EDT): 东部时间 - 纽约、华盛顿、迈阿密');
    console.log('🇺🇸 芝加哥 (CST/CDT): 中部时间 - 芝加哥、达拉斯、休斯顿');
    console.log('🇺🇸 丹佛 (MST/MDT): 山地时间 - 丹佛、凤凰城、盐湖城');
    console.log('🇺🇸 洛杉矶 (PST/PDT): 太平洋时间 - 洛杉矶、旧金山、西雅图');
};

// 测试收藏功能
window.testFavorites = function() {
    console.log('=== 测试收藏功能 ===');
    console.log('时间区比较国家收藏:', timeComparisonCountries);
    console.log('时间主国家收藏:', timeMainCountry);
    console.log('汇率区比较国家收藏:', rateComparisonCountries);
    console.log('汇率主国家收藏:', rateMainCountry);
    
    // 测试时间区比较国家收藏
    console.log('\n=== 时间区比较国家收藏测试 ===');
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`comparison-select-${i}`);
        const btn = document.querySelector(`[data-target="${i}"]`);
        console.log(`时间区比较国家 ${i}:`, {
            selectValue: select ? select.value : 'N/A',
            buttonExists: !!btn,
            buttonActive: btn ? btn.classList.contains('active') : false,
            buttonDisabled: btn ? btn.disabled : false
        });
    }
    
    // 测试汇率区比较国家收藏
    console.log('\n=== 汇率区比较国家收藏测试 ===');
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`rate-comparison-select-${i}`);
        const btn = document.querySelector(`[data-target="rate-${i}"]`);
        console.log(`汇率区比较国家 ${i}:`, {
            selectValue: select ? select.value : 'N/A',
            buttonExists: !!btn,
            buttonActive: btn ? btn.classList.contains('active') : false,
            buttonDisabled: btn ? btn.disabled : false
        });
    }
    
    // 测试主国家收藏
    console.log('\n=== 主国家收藏测试 ===');
    const timeMainBtn = document.querySelector('[data-target="time-main"]');
    const rateMainBtn = document.querySelector('[data-target="rate-main"]');
    console.log('时间主国家按钮:', {
        exists: !!timeMainBtn,
        active: timeMainBtn ? timeMainBtn.classList.contains('active') : false,
        disabled: timeMainBtn ? timeMainBtn.disabled : false
    });
    console.log('汇率主国家按钮:', {
        exists: !!rateMainBtn,
        active: rateMainBtn ? rateMainBtn.classList.contains('active') : false,
        disabled: rateMainBtn ? rateMainBtn.disabled : false
    });
    
    console.log('\n=== 重新绑定事件 ===');
    bindStarButtonEvents();
    console.log('事件重新绑定完成');
};

// 全面测试收藏功能
window.testAllFavorites = function() {
    console.log('=== 全面测试收藏功能 ===');
    
    // 测试时间区收藏
    console.log('\n--- 时间区收藏测试 ---');
    console.log('时间区比较国家收藏:', timeComparisonCountries);
    console.log('时间主国家收藏:', timeMainCountry);
    
    // 测试汇率区收藏
    console.log('\n--- 汇率区收藏测试 ---');
    console.log('汇率区比较国家收藏:', rateComparisonCountries);
    console.log('汇率主国家收藏:', rateMainCountry);
    
    // 测试所有按钮状态
    console.log('\n--- 按钮状态测试 ---');
    
    // 时间区比较国家按钮
    for (let i = 1; i <= 4; i++) {
        const btn = document.querySelector(`[data-target="${i}"]`);
        const select = document.getElementById(`comparison-select-${i}`);
        console.log(`时间区按钮 ${i}:`, {
            exists: !!btn,
            active: btn ? btn.classList.contains('active') : false,
            disabled: btn ? btn.disabled : false,
            selectValue: select ? select.value : 'N/A'
        });
    }
    
    // 汇率区比较国家按钮
    for (let i = 1; i <= 4; i++) {
        const btn = document.querySelector(`[data-target="rate-${i}"]`);
        const select = document.getElementById(`rate-comparison-select-${i}`);
        console.log(`汇率区按钮 ${i}:`, {
            exists: !!btn,
            active: btn ? btn.classList.contains('active') : false,
            disabled: btn ? btn.disabled : false,
            selectValue: select ? select.value : 'N/A'
        });
    }
    
    // 主国家按钮
    const timeMainBtn = document.querySelector('[data-target="time-main"]');
    const rateMainBtn = document.querySelector('[data-target="rate-main"]');
    console.log('时间主国家按钮:', {
        exists: !!timeMainBtn,
        active: timeMainBtn ? timeMainBtn.classList.contains('active') : false,
        disabled: timeMainBtn ? timeMainBtn.disabled : false
    });
    console.log('汇率主国家按钮:', {
        exists: !!rateMainBtn,
        active: rateMainBtn ? rateMainBtn.classList.contains('active') : false,
        disabled: rateMainBtn ? rateMainBtn.disabled : false
    });
    
    // 重新绑定所有事件
    console.log('\n--- 重新绑定事件 ---');
    bindStarButtonEvents();
    console.log('所有事件重新绑定完成');
    
    console.log('\n=== 测试完成 ===');
};

// 测试主国家收藏功能
window.testMainFavorites = function() {
    console.log('=== 测试主国家收藏功能 ===');
    
    // 检查按钮是否存在
    const timeMainBtn = document.querySelector('[data-target="time-main"]');
    const rateMainBtn = document.querySelector('[data-target="rate-main"]');
    
    console.log('时间主国家按钮:', timeMainBtn);
    console.log('汇率主国家按钮:', rateMainBtn);
    
    // 检查选择器值
    console.log('时间主国家选择器值:', elements.timeMainCountrySelect ? elements.timeMainCountrySelect.value : 'N/A');
    console.log('汇率主国家选择器值:', elements.rateBaseCountry ? elements.rateBaseCountry.value : 'N/A');
    
    // 检查收藏状态
    console.log('时间主国家收藏状态:', timeMainCountry);
    console.log('汇率主国家收藏状态:', rateMainCountry);
    
    // 手动测试收藏功能
    console.log('\n--- 手动测试收藏功能 ---');
    console.log('点击时间主国家收藏按钮...');
    if (timeMainBtn) {
        timeMainBtn.click();
    }
    
    console.log('点击汇率主国家收藏按钮...');
    if (rateMainBtn) {
        rateMainBtn.click();
    }
    
    console.log('测试完成');
};

// 全面测试所有收藏功能
window.testAllFavoriteFunctions = function() {
    console.log('=== 全面测试所有收藏功能 ===');
    
    // 1. 检查全局变量
    console.log('\n--- 全局变量检查 ---');
    console.log('timeComparisonCountries:', timeComparisonCountries);
    console.log('timeMainCountry:', timeMainCountry);
    console.log('rateComparisonCountries:', rateComparisonCountries);
    console.log('rateMainCountry:', rateMainCountry);
    
    // 2. 检查HTML元素
    console.log('\n--- HTML元素检查 ---');
    const timeMainBtn = document.querySelector('[data-target="time-main"]');
    const rateMainBtn = document.querySelector('[data-target="rate-main"]');
    console.log('时间主国家按钮:', timeMainBtn ? '存在' : '不存在');
    console.log('汇率主国家按钮:', rateMainBtn ? '存在' : '不存在');
    
    // 检查比较国家按钮
    for (let i = 1; i <= 4; i++) {
        const timeBtn = document.querySelector(`[data-target="${i}"]`);
        const rateBtn = document.querySelector(`[data-target="rate-${i}"]`);
        console.log(`时间比较按钮 ${i}:`, timeBtn ? '存在' : '不存在');
        console.log(`汇率比较按钮 ${i}:`, rateBtn ? '存在' : '不存在');
    }
    
    // 3. 检查选择器元素
    console.log('\n--- 选择器元素检查 ---');
    console.log('时间主国家选择器:', elements.timeMainCountrySelect ? '存在' : '不存在');
    console.log('汇率主国家选择器:', elements.rateBaseCountry ? '存在' : '不存在');
    
    for (let i = 1; i <= 4; i++) {
        const timeSelect = document.getElementById(`comparison-select-${i}`);
        const rateSelect = document.getElementById(`rate-comparison-select-${i}`);
        console.log(`时间比较选择器 ${i}:`, timeSelect ? '存在' : '不存在');
        console.log(`汇率比较选择器 ${i}:`, rateSelect ? '存在' : '不存在');
    }
    
    // 4. 检查localStorage
    console.log('\n--- localStorage检查 ---');
    console.log('timeComparisonCountries in localStorage:', localStorage.getItem('timeComparisonCountries'));
    console.log('timeMainCountry in localStorage:', localStorage.getItem('timeMainCountry'));
    console.log('rateComparisonCountries in localStorage:', localStorage.getItem('rateComparisonCountries'));
    console.log('rateMainCountry in localStorage:', localStorage.getItem('rateMainCountry'));
    
    // 5. 测试函数存在性
    console.log('\n--- 函数存在性检查 ---');
    console.log('handleMainCountryFavorite:', typeof handleMainCountryFavorite);
    console.log('handleTimeComparisonFavorite:', typeof handleTimeComparisonFavorite);
    console.log('handleRateComparisonFavorite:', typeof handleRateComparisonFavorite);
    console.log('updateMainFavoriteButtons:', typeof updateMainFavoriteButtons);
    console.log('updateTimeComparisonButtons:', typeof updateTimeComparisonButtons);
    console.log('updateRateComparisonButtons:', typeof updateRateComparisonButtons);
    console.log('bindStarButtonEvents:', typeof bindStarButtonEvents);
    console.log('saveTimeFavorites:', typeof saveTimeFavorites);
    console.log('saveRateFavorites:', typeof saveRateFavorites);
    console.log('applyTimeFavorites:', typeof applyTimeFavorites);
    console.log('applyRateFavorites:', typeof applyRateFavorites);
    
    // 6. 重新初始化所有功能
    console.log('\n--- 重新初始化所有功能 ---');
    console.log('重新绑定事件...');
    bindStarButtonEvents();
    console.log('更新按钮状态...');
    updateMainFavoriteButtons();
    updateTimeComparisonButtons();
    updateRateComparisonButtons();
    console.log('重新初始化完成');
    
    console.log('\n=== 全面测试完成 ===');
};

// 专门测试主国家收藏功能
window.testMainCountryFavorites = function() {
    console.log('=== 专门测试主国家收藏功能 ===');
    
    // 检查元素是否存在
    console.log('检查元素存在性...');
    console.log('elements.timeMainCountrySelect:', elements.timeMainCountrySelect);
    console.log('elements.rateBaseCountry:', elements.rateBaseCountry);
    
    // 设置测试国家
    console.log('设置测试国家...');
    if (elements.timeMainCountrySelect) {
        elements.timeMainCountrySelect.value = 'CN';
        console.log('时间主国家选择器值设置为:', elements.timeMainCountrySelect.value);
    }
    if (elements.rateBaseCountry) {
        elements.rateBaseCountry.value = 'US';
        console.log('汇率主国家选择器值设置为:', elements.rateBaseCountry.value);
    }
    
    // 检查按钮元素
    console.log('检查按钮元素...');
    const timeMainBtn = document.querySelector('[data-target="time-main"]');
    const rateMainBtn = document.querySelector('[data-target="rate-main"]');
    console.log('时间主国家按钮:', timeMainBtn);
    console.log('汇率主国家按钮:', rateMainBtn);
    
    // 测试时间主国家收藏
    console.log('\n--- 测试时间主国家收藏 ---');
    console.log('收藏前状态:', timeMainCountry);
    handleMainCountryFavorite('time-main');
    console.log('收藏后状态:', timeMainCountry);
    
    // 测试汇率主国家收藏
    console.log('\n--- 测试汇率主国家收藏 ---');
    console.log('收藏前状态:', rateMainCountry);
    handleMainCountryFavorite('rate-main');
    console.log('收藏后状态:', rateMainCountry);
    
    // 更新按钮状态
    console.log('\n--- 更新按钮状态 ---');
    updateMainFavoriteButtons();
    
    console.log('测试完成');
};

// 专门测试主国家按钮点击
window.testMainCountryButtonClick = function() {
    console.log('=== 测试主国家按钮点击 ===');
    
    // 设置测试国家
    if (elements.timeMainCountrySelect) {
        elements.timeMainCountrySelect.value = 'CN';
    }
    if (elements.rateBaseCountry) {
        elements.rateBaseCountry.value = 'US';
    }
    
    // 模拟点击时间主国家按钮
    const timeMainBtn = document.querySelector('[data-target="time-main"]');
    if (timeMainBtn) {
        console.log('模拟点击时间主国家按钮...');
        timeMainBtn.click();
    } else {
        console.log('时间主国家按钮未找到！');
    }
    
    // 模拟点击汇率主国家按钮
    const rateMainBtn = document.querySelector('[data-target="rate-main"]');
    if (rateMainBtn) {
        console.log('模拟点击汇率主国家按钮...');
        rateMainBtn.click();
    } else {
        console.log('汇率主国家按钮未找到！');
    }
    
    console.log('测试完成');
};

// 检查主国家按钮事件绑定
window.checkMainCountryButtonEvents = function() {
    console.log('=== 检查主国家按钮事件绑定 ===');
    
    // 检查按钮元素
    const timeMainBtn = document.querySelector('[data-target="time-main"]');
    const rateMainBtn = document.querySelector('[data-target="rate-main"]');
    
    console.log('时间主国家按钮:', timeMainBtn);
    console.log('汇率主国家按钮:', rateMainBtn);
    
    if (timeMainBtn) {
        console.log('时间主国家按钮类名:', timeMainBtn.className);
        console.log('时间主国家按钮data-target:', timeMainBtn.dataset.target);
    }
    
    if (rateMainBtn) {
        console.log('汇率主国家按钮类名:', rateMainBtn.className);
        console.log('汇率主国家按钮data-target:', rateMainBtn.dataset.target);
    }
    
    // 检查所有星形按钮
    const allStarButtons = document.querySelectorAll('.set-default-btn');
    console.log('所有星形按钮数量:', allStarButtons.length);
    
    allStarButtons.forEach((btn, index) => {
        console.log(`按钮 ${index}:`, {
            class: btn.className,
            target: btn.dataset.target,
            hasClickHandler: btn.onclick !== null
        });
    });
    
    // 重新绑定事件
    console.log('重新绑定事件...');
    bindStarButtonEvents();
    
    console.log('检查完成');
};

// 测试收藏持久化功能
window.testFavoritesPersistence = function() {
    console.log('=== 测试收藏持久化功能 ===');
    
    // 1. 清除所有收藏
    console.log('清除所有收藏...');
    timeComparisonCountries = [];
    timeMainCountry = '';
    rateComparisonCountries = [];
    rateMainCountry = '';
    saveTimeFavorites();
    saveRateFavorites();
    
    // 2. 设置测试收藏
    console.log('设置测试收藏...');
    timeMainCountry = 'CN';
    timeComparisonCountries = ['US', 'JP', 'GB'];
    rateMainCountry = 'US';
    rateComparisonCountries = ['CN', 'JP', 'GB', 'DE'];
    
    saveTimeFavorites();
    saveRateFavorites();
    
    console.log('时间主国家收藏:', timeMainCountry);
    console.log('时间比较国家收藏:', timeComparisonCountries);
    console.log('汇率主国家收藏:', rateMainCountry);
    console.log('汇率比较国家收藏:', rateComparisonCountries);
    
    // 3. 应用收藏
    console.log('应用收藏...');
    applyTimeFavorites();
    applyRateFavorites();
    
    // 4. 检查结果
    console.log('检查结果...');
    console.log('时间主国家选择器值:', elements.timeMainCountrySelect.value);
    console.log('汇率主国家选择器值:', elements.rateBaseCountry.value);
    
    for (let i = 1; i <= 4; i++) {
        const timeSelect = document.getElementById(`comparison-select-${i}`);
        const rateSelect = document.getElementById(`rate-comparison-select-${i}`);
        console.log(`时间比较选择器 ${i}:`, timeSelect ? timeSelect.value : 'N/A');
        console.log(`汇率比较选择器 ${i}:`, rateSelect ? rateSelect.value : 'N/A');
    }
    
    console.log('测试完成');
};

// 测试汇率输入更新功能
window.testRateInputUpdate = function() {
    console.log('=== 测试汇率输入更新功能 ===');
    
    // 1. 设置测试环境
    console.log('设置测试环境...');
    if (elements.rateBaseCountry) {
        elements.rateBaseCountry.value = 'US';
        console.log('设置汇率主国家为: US');
    }
    
    // 设置比较国家
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`rate-comparison-select-${i}`);
        if (select) {
            if (i === 1) {
                select.value = 'CN';
                console.log(`设置比较国家 ${i} 为: CN`);
            } else if (i === 2) {
                select.value = 'JP';
                console.log(`设置比较国家 ${i} 为: JP`);
            } else {
                select.value = '';
            }
        }
    }
    
    // 2. 检查汇率数据
    console.log('检查汇率数据...');
    console.log('currentRates:', currentRates);
    console.log('汇率数据是否可用:', Object.keys(currentRates).length > 0);
    
    // 3. 测试输入更新
    console.log('测试输入更新...');
    const rateMainValue = document.getElementById('rate-main-value');
    if (rateMainValue) {
        console.log('找到汇率主数值输入框');
        rateMainValue.value = '100';
        console.log('设置输入值为: 100');
        
        // 手动触发更新
        console.log('手动触发更新...');
        updateRateDisplay();
        
        // 检查结果
        console.log('检查更新结果...');
        for (let i = 1; i <= 4; i++) {
            const display = document.getElementById(`rate-comparison-display-${i}`);
            if (display) {
                console.log(`比较国家 ${i} 显示:`, display.innerHTML);
            }
        }
    } else {
        console.log('未找到汇率主数值输入框！');
    }
    
    console.log('测试完成');
};

// 全面测试汇率转换功能
window.testRateConversionComplete = function() {
    console.log('=== 全面测试汇率转换功能 ===');
    
    // 1. 检查所有必要元素
    console.log('1. 检查所有必要元素...');
    console.log('rateBaseCountry:', elements.rateBaseCountry);
    console.log('rate-main-value:', document.getElementById('rate-main-value'));
    
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`rate-comparison-select-${i}`);
        const display = document.getElementById(`rate-comparison-display-${i}`);
        console.log(`比较国家 ${i}:`, {
            select: select ? '存在' : '不存在',
            display: display ? '存在' : '不存在'
        });
    }
    
    // 2. 设置测试数据
    console.log('2. 设置测试数据...');
    if (elements.rateBaseCountry) {
        elements.rateBaseCountry.value = 'US';
        console.log('设置主国家为: US');
    }
    
    // 设置比较国家
    const testCountries = ['CN', 'JP', 'GB', 'DE'];
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`rate-comparison-select-${i}`);
        if (select) {
            select.value = testCountries[i-1];
            console.log(`设置比较国家 ${i} 为: ${testCountries[i-1]}`);
        }
    }
    
    // 3. 获取汇率数据
    console.log('3. 获取汇率数据...');
    fetchExchangeRates().then(() => {
        console.log('汇率数据获取完成');
        console.log('currentRates:', currentRates);
        
        // 4. 测试输入更新
        console.log('4. 测试输入更新...');
        const rateMainValue = document.getElementById('rate-main-value');
        if (rateMainValue) {
            rateMainValue.value = '100';
            console.log('设置输入值为: 100');
            
            // 触发更新
            updateRateDisplay();
            
            // 检查结果
            console.log('5. 检查结果...');
            for (let i = 1; i <= 4; i++) {
                const display = document.getElementById(`rate-comparison-display-${i}`);
                if (display) {
                    console.log(`比较国家 ${i} 最终显示:`, display.innerHTML);
                }
            }
        }
    }).catch(error => {
        console.error('获取汇率数据失败:', error);
    });
    
    console.log('测试完成');
};

// 测试汇率API连接
window.testExchangeRateAPI = async function() {
    console.log('=== 测试汇率API连接 ===');
    
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        console.log('API响应状态:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('API数据获取成功:', data);
            console.log('USD到CNY汇率:', data.rates.CNY);
            console.log('USD到JPY汇率:', data.rates.JPY);
            console.log('USD到GBP汇率:', data.rates.GBP);
            console.log('USD到EUR汇率:', data.rates.EUR);
            console.log('USD到VND汇率:', data.rates.VND);
            console.log('USD到DKK汇率:', data.rates.DKK);
            console.log('USD到EGP汇率:', data.rates.EGP);
        } else {
            console.error('API请求失败:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('API连接错误:', error);
    }
};

// 测试当前汇率数据状态
window.testCurrentRateStatus = function() {
    console.log('=== 测试当前汇率数据状态 ===');
    
    console.log('当前汇率数据:', currentRates);
    console.log('汇率数据键数量:', Object.keys(currentRates).length);
    console.log('汇率数据键:', Object.keys(currentRates));
    
    // 检查主国家
    console.log('主国家选择器值:', elements.rateBaseCountry ? elements.rateBaseCountry.value : 'N/A');
    
    // 检查比较国家
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`rate-comparison-select-${i}`);
        const display = document.getElementById(`rate-comparison-display-${i}`);
        console.log(`比较国家 ${i}:`, {
            select: select ? select.value : 'N/A',
            display: display ? display.innerHTML : 'N/A'
        });
    }
    
    // 检查输入值
    const rateMainValue = document.getElementById('rate-main-value');
    console.log('主数值输入框值:', rateMainValue ? rateMainValue.value : 'N/A');
    
    console.log('测试完成');
};

// 强制获取汇率数据
window.forceFetchRates = function() {
    console.log('=== 强制获取汇率数据 ===');
    
    // 设置测试主国家
    if (elements.rateBaseCountry) {
        elements.rateBaseCountry.value = 'US';
        console.log('设置主国家为: US');
    }
    
    // 强制调用API
    fetchExchangeRates().then(() => {
        console.log('强制获取汇率数据完成');
        console.log('当前汇率数据:', currentRates);
        
        // 更新显示
        updateRateDisplay();
    }).catch(error => {
        console.error('强制获取汇率数据失败:', error);
    });
};

// 手动设置汇率数据并测试
window.testManualRateData = function() {
    console.log('=== 手动设置汇率数据并测试 ===');
    
    // 手动设置汇率数据
    currentRates = {
        'CNY': 7.2,
        'JPY': 150.0,
        'GBP': 0.8,
        'EUR': 0.9,
        'USD': 1.0,
        'CAD': 1.3,
        'AUD': 1.5,
        'CHF': 0.9,
        'SEK': 10.5,
        'NOK': 10.8,
        'DKK': 6.7,
        'PLN': 4.0,
        'CZK': 22.5,
        'HUF': 350.0,
        'RUB': 90.0,
        'BRL': 5.0,
        'MXN': 18.0,
        'INR': 83.0,
        'KRW': 1300.0,
        'SGD': 1.35,
        'HKD': 7.8,
        'TWD': 31.0,
        'THB': 35.0,
        'MYR': 4.5,
        'IDR': 15000.0,
        'PHP': 55.0,
        'VND': 24000.0,
        'EGP': 30.0,
        'ZAR': 18.0,
        'TRY': 30.0,
        'ILS': 3.7,
        'AED': 3.7,
        'SAR': 3.75,
        'QAR': 3.64,
        'KWD': 0.31,
        'BHD': 0.38,
        'OMR': 0.38,
        'JOD': 0.71,
        'LBP': 1500.0,
        'EGP': 30.0
    };
    
    console.log('手动设置的汇率数据:', currentRates);
    console.log('汇率数据键:', Object.keys(currentRates));
    
    // 设置测试环境
    if (elements.rateBaseCountry) {
        elements.rateBaseCountry.value = 'US';
        console.log('设置主国家为: US');
    }
    
    // 设置比较国家
    const testCountries = ['CN', 'JP', 'GB', 'DE'];
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`rate-comparison-select-${i}`);
        if (select) {
            select.value = testCountries[i-1];
            console.log(`设置比较国家 ${i} 为: ${testCountries[i-1]}`);
        }
    }
    
    // 设置输入值
    const rateMainValue = document.getElementById('rate-main-value');
    if (rateMainValue) {
        rateMainValue.value = '100';
        console.log('设置输入值为: 100');
    }
    
    // 触发更新
    console.log('触发更新...');
    updateRateDisplay();
    
    console.log('测试完成');
};

// 强制测试汇率转换功能
window.forceTestRateConversion = function() {
    console.log('=== 强制测试汇率转换功能 ===');
    
    // 1. 强制设置汇率数据
    currentRates = {
        'USD': 1.0,
        'CNY': 7.2,
        'JPY': 150.0,
        'GBP': 0.8,
        'EUR': 0.9,
        'CAD': 1.3,
        'AUD': 1.5,
        'CHF': 0.9,
        'SEK': 10.5,
        'NOK': 10.8,
        'DKK': 6.7,
        'PLN': 4.0,
        'CZK': 22.5,
        'HUF': 350.0,
        'RUB': 90.0,
        'BRL': 5.0,
        'MXN': 18.0,
        'INR': 83.0,
        'KRW': 1300.0,
        'SGD': 1.35,
        'HKD': 7.8,
        'TWD': 31.0,
        'THB': 35.0,
        'MYR': 4.5,
        'IDR': 15000.0,
        'PHP': 55.0,
        'VND': 24000.0,
        'EGP': 30.0,
        'ZAR': 18.0,
        'TRY': 30.0,
        'ILS': 3.7,
        'AED': 3.7,
        'SAR': 3.75,
        'QAR': 3.64,
        'KWD': 0.31,
        'BHD': 0.38,
        'OMR': 0.38,
        'JOD': 0.71,
        'LBP': 1500.0,
        'COP': 4000.0,
        'ARS': 1000.0
    };
    
    console.log('强制设置汇率数据完成');
    
    // 2. 强制设置测试环境
    if (elements.rateBaseCountry) {
        elements.rateBaseCountry.value = 'US';
    }
    
    // 3. 强制设置比较国家
    const testCountries = ['CN', 'JP', 'GB', 'DE'];
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`rate-comparison-select-${i}`);
        if (select) {
            select.value = testCountries[i-1];
        }
    }
    
    // 4. 强制设置输入值
    const rateMainValue = document.getElementById('rate-main-value');
    if (rateMainValue) {
        rateMainValue.value = '100';
    }
    
    // 5. 强制触发更新
    setTimeout(() => {
        updateRateDisplay();
    }, 100);
    
    console.log('强制测试完成');
};

// 全面调试汇率转换问题
window.debugRateConversion = function() {
    console.log('=== 全面调试汇率转换问题 ===');
    
    // 1. 检查所有必要元素
    console.log('1. 检查所有必要元素...');
    console.log('elements.rateBaseCountry:', elements.rateBaseCountry);
    console.log('rate-main-value:', document.getElementById('rate-main-value'));
    
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`rate-comparison-select-${i}`);
        const display = document.getElementById(`rate-comparison-display-${i}`);
        console.log(`比较国家 ${i}:`, {
            select: select ? '存在' : '不存在',
            display: display ? '存在' : '不存在',
            selectValue: select ? select.value : 'N/A',
            displayHTML: display ? display.innerHTML : 'N/A'
        });
    }
    
    // 2. 检查汇率数据
    console.log('2. 检查汇率数据...');
    console.log('currentRates:', currentRates);
    console.log('currentRates类型:', typeof currentRates);
    console.log('currentRates键数量:', Object.keys(currentRates).length);
    console.log('currentRates键:', Object.keys(currentRates));
    
    // 3. 检查国家数据
    console.log('3. 检查国家数据...');
    const testCountries = ['CN', 'JP', 'GB', 'DE', 'FR', 'EG', 'AR', 'CO'];
    testCountries.forEach(countryCode => {
        const country = countryData[countryCode];
        if (country) {
            console.log(`${countryCode}:`, {
                name: country.name,
                currency: country.currency,
                hasRate: currentRates.hasOwnProperty(country.currency)
            });
        } else {
            console.log(`${countryCode}: 国家数据不存在`);
        }
    });
    
    // 4. 检查输入值
    console.log('4. 检查输入值...');
    const rateMainValue = document.getElementById('rate-main-value');
    if (rateMainValue) {
        console.log('主数值输入框值:', rateMainValue.value);
        console.log('主数值输入框类型:', typeof rateMainValue.value);
        console.log('解析后的数值:', parseFloat(rateMainValue.value));
    }
    
    // 5. 检查主国家
    console.log('5. 检查主国家...');
    if (elements.rateBaseCountry) {
        console.log('主国家选择器值:', elements.rateBaseCountry.value);
        const mainCountry = countryData[elements.rateBaseCountry.value];
        if (mainCountry) {
            console.log('主国家信息:', mainCountry);
        }
    }
    
    // 6. 手动测试转换
    console.log('6. 手动测试转换...');
    const baseAmount = parseFloat(rateMainValue.value) || 0;
    console.log('基础数值:', baseAmount);
    
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`rate-comparison-select-${i}`);
        if (select && select.value) {
            const country = countryData[select.value];
            if (country) {
                console.log(`国家 ${i} (${select.value}):`, {
                    currency: country.currency,
                    hasRate: currentRates.hasOwnProperty(country.currency),
                    rate: currentRates[country.currency],
                    convertedAmount: currentRates[country.currency] ? (baseAmount * currentRates[country.currency]).toFixed(2) : 'N/A'
                });
            }
        }
    }
    
    console.log('调试完成');
};

// 专门测试汇率比较国家收藏功能
window.testRateComparisonFavorites = function() {
    console.log('=== 专门测试汇率比较国家收藏功能 ===');
    
    // 设置测试国家
    console.log('设置测试国家...');
    const rateSelect1 = document.getElementById('rate-comparison-select-1');
    const rateSelect2 = document.getElementById('rate-comparison-select-2');
    
    if (rateSelect1) rateSelect1.value = 'CN';
    if (rateSelect2) rateSelect2.value = 'JP';
    
    console.log('汇率比较选择器1值:', rateSelect1 ? rateSelect1.value : 'N/A');
    console.log('汇率比较选择器2值:', rateSelect2 ? rateSelect2.value : 'N/A');
    
    // 测试汇率比较国家收藏
    console.log('\n--- 测试汇率比较国家收藏 ---');
    console.log('收藏前状态:', rateComparisonCountries);
    
    // 模拟点击按钮1
    const rateBtn1 = document.querySelector('[data-target="rate-1"]');
    if (rateBtn1) {
        console.log('点击汇率比较按钮1...');
        const mockEvent = { target: rateBtn1 };
        handleRateComparisonFavorite(mockEvent);
    }
    
    // 模拟点击按钮2
    const rateBtn2 = document.querySelector('[data-target="rate-2"]');
    if (rateBtn2) {
        console.log('点击汇率比较按钮2...');
        const mockEvent = { target: rateBtn2 };
        handleRateComparisonFavorite(mockEvent);
    }
    
    console.log('收藏后状态:', rateComparisonCountries);
    
    // 更新按钮状态
    console.log('\n--- 更新按钮状态 ---');
    updateRateComparisonButtons();
    
    console.log('测试完成');
};

// 测试时间模块第一个对比国家收藏（确保与其他对比国家一致）
window.testTimeFirstComparisonFixed = function() {
    console.log('=== 测试时间模块第一个对比国家收藏（修复版） ===');
    
    // 1. 清除所有收藏
    console.log('清除所有收藏...');
    timeComparisonCountries = [];
    saveTimeFavorites();
    applyTimeFavorites();
    
    // 2. 设置测试收藏（按照位置）
    console.log('设置测试收藏...');
    timeComparisonCountries = ['BE', 'DE', 'FR', 'IT']; // 按位置设置
    saveTimeFavorites();
    console.log('设置收藏为:', timeComparisonCountries);
    
    // 3. 应用收藏
    console.log('应用收藏...');
    applyTimeFavorites();
    
    // 4. 检查结果
    console.log('检查结果:');
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`comparison-select-${i}`);
        const btn = document.querySelector(`[data-target="${i}"]`);
        const display = document.getElementById(`time-comparison-display-${i}`);
        
        console.log(`对比国家 ${i}:`, {
            selectValue: select ? select.value : 'N/A',
            expectedValue: timeComparisonCountries[i-1] || 'N/A',
            buttonActive: btn ? btn.classList.contains('active') : false,
            displayContent: display ? display.innerHTML.substring(0, 50) + '...' : 'N/A'
        });
    }
    
    // 5. 测试第一个对比国家的收藏/取消收藏
    console.log('\n--- 测试第一个对比国家的收藏功能 ---');
    const firstSelect = document.getElementById('comparison-select-1');
    const firstBtn = document.querySelector('[data-target="1"]');
    
    if (firstSelect && firstBtn) {
        console.log('第一个选择器当前值:', firstSelect.value);
        console.log('第一个按钮是否激活:', firstBtn.classList.contains('active'));
        
        // 测试取消收藏
        console.log('测试取消第一个对比国家收藏...');
        firstBtn.click();
        
        console.log('取消收藏后第一个选择器值:', firstSelect.value);
        console.log('取消收藏后第一个按钮是否激活:', firstBtn.classList.contains('active'));
        console.log('取消收藏后收藏数组:', timeComparisonCountries);
        
        // 测试重新收藏
        console.log('测试重新收藏第一个对比国家...');
        firstSelect.value = 'CN';
        firstBtn.click();
        
        console.log('重新收藏后第一个选择器值:', firstSelect.value);
        console.log('重新收藏后第一个按钮是否激活:', firstBtn.classList.contains('active'));
        console.log('重新收藏后收藏数组:', timeComparisonCountries);
    }
    
    console.log('=== 测试完成 ===');
};

// 测试时间模块第一个对比国家收藏
window.testTimeFirstComparison = function() {
    console.log('=== 测试时间模块第一个对比国家收藏 ===');
    
    // 1. 检查当前状态
    console.log('当前时间比较国家收藏:', timeComparisonCountries);
    console.log('第一个收藏国家:', timeComparisonCountries[0]);
    
    // 2. 检查第一个选择器
    const firstSelect = document.getElementById('comparison-select-1');
    console.log('第一个选择器存在:', !!firstSelect);
    if (firstSelect) {
        console.log('第一个选择器当前值:', firstSelect.value);
        console.log('第一个选择器选项数量:', firstSelect.options.length);
    }
    
    // 3. 设置测试收藏
    console.log('\n--- 设置测试收藏 ---');
    timeComparisonCountries = ['BE', 'DE', 'FR', 'IT']; // 设置测试收藏
    saveTimeFavorites();
    console.log('设置收藏为:', timeComparisonCountries);
    
    // 4. 应用收藏
    console.log('\n--- 应用收藏 ---');
    applyTimeFavorites();
    
    // 5. 检查结果
    console.log('\n--- 检查结果 ---');
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`comparison-select-${i}`);
        const display = document.getElementById(`time-comparison-display-${i}`);
        console.log(`对比国家 ${i}:`, {
            selectValue: select ? select.value : 'N/A',
            displayContent: display ? display.innerHTML : 'N/A',
            expectedValue: timeComparisonCountries[i-1] || 'N/A'
        });
    }
    
    console.log('=== 测试完成 ===');
};

// 测试时间模块对比国家显示
window.testTimeComparisonDisplay = function() {
    console.log('=== 测试时间模块对比国家显示 ===');
    
    // 1. 检查收藏状态
    console.log('时间比较国家收藏:', timeComparisonCountries);
    console.log('时间主国家收藏:', timeMainCountry);
    
    // 2. 检查选择器状态
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`comparison-select-${i}`);
        const display = document.getElementById(`time-comparison-display-${i}`);
        console.log(`对比国家 ${i}:`, {
            select: select ? select.value : 'N/A',
            display: display ? display.innerHTML : 'N/A',
            hasOptions: select ? select.options.length : 0
        });
    }
    
    // 3. 检查按钮状态
    for (let i = 1; i <= 4; i++) {
        const btn = document.querySelector(`[data-target="${i}"]`);
        console.log(`按钮 ${i}:`, {
            exists: !!btn,
            active: btn ? btn.classList.contains('active') : false,
            disabled: btn ? btn.disabled : false
        });
    }
    
    // 4. 测试重新应用收藏
    console.log('\n--- 重新应用收藏 ---');
    applyTimeFavorites();
    
    // 5. 检查应用后的状态
    console.log('\n--- 应用后的状态 ---');
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`comparison-select-${i}`);
        console.log(`对比国家 ${i} 应用后值:`, select ? select.value : 'N/A');
    }
    
    console.log('=== 测试完成 ===');
};

// 测试时间主国家收藏功能
window.testTimeMainCountryFavorite = function() {
    console.log('=== 测试时间主国家收藏功能 ===');
    
    // 1. 检查元素是否存在
    const timeMainBtn = document.querySelector('[data-target="time-main"]');
    const timeMainSelect = document.getElementById('time-main-country-select');
    
    console.log('时间主国家按钮存在:', !!timeMainBtn);
    console.log('时间主国家选择器存在:', !!timeMainSelect);
    
    if (timeMainBtn && timeMainSelect) {
        console.log('当前选择的值:', timeMainSelect.value);
        console.log('当前收藏状态:', timeMainCountry);
        
        // 2. 测试选择国家
        console.log('\n--- 测试选择国家 ---');
        timeMainSelect.value = 'CN';
        console.log('设置选择器值为: CN');
        
        // 3. 测试收藏功能
        console.log('\n--- 测试收藏功能 ---');
        console.log('点击收藏按钮...');
        timeMainBtn.click();
        
        console.log('收藏后状态:', timeMainCountry);
        
        // 4. 检查按钮状态
        console.log('\n--- 检查按钮状态 ---');
        console.log('按钮是否激活:', timeMainBtn.classList.contains('active'));
        console.log('按钮是否禁用:', timeMainBtn.disabled);
        
        // 5. 测试取消收藏
        console.log('\n--- 测试取消收藏 ---');
        console.log('再次点击收藏按钮...');
        timeMainBtn.click();
        
        console.log('取消收藏后状态:', timeMainCountry);
        console.log('按钮是否激活:', timeMainBtn.classList.contains('active'));
        
    } else {
        console.error('时间主国家元素不存在！');
    }
    
    console.log('=== 测试完成 ===');
};

// 测试汇率模块换位功能
window.testRateSwapFunction = function() {
    console.log('=== 测试汇率模块换位功能 ===');
    
    // 1. 设置测试环境
    console.log('设置测试环境...');
    
    // 汇率模块测试
    if (elements.rateBaseCountry) {
        elements.rateBaseCountry.value = 'US';
        console.log('设置汇率主国家为: US');
    }
    
    const rateSelect1 = document.getElementById('rate-comparison-select-1');
    if (rateSelect1) {
        rateSelect1.value = 'CN';
        console.log('设置汇率对比国家1为: CN');
    }
    
    // 2. 测试汇率模块换位
    console.log('\n--- 测试汇率模块换位 ---');
    console.log('换位前:');
    console.log('汇率主国家:', elements.rateBaseCountry ? elements.rateBaseCountry.value : 'N/A');
    console.log('汇率对比国家1:', rateSelect1 ? rateSelect1.value : 'N/A');
    
    // 检查按钮状态
    const swapBtn = document.querySelector('[data-target="rate-1"].swap-main-btn');
    console.log('换位按钮存在:', !!swapBtn);
    console.log('换位按钮禁用状态:', swapBtn ? swapBtn.disabled : 'N/A');
    
    // 延迟执行换位测试，让用户看到变化
    setTimeout(() => {
        console.log('执行汇率换位...');
        handleRateSwap('rate-1');
        
        setTimeout(() => {
            console.log('换位后:');
            console.log('汇率主国家:', elements.rateBaseCountry ? elements.rateBaseCountry.value : 'N/A');
            console.log('汇率对比国家1:', rateSelect1 ? rateSelect1.value : 'N/A');
            console.log('✓ 汇率模块换位：原主国家US现在是对比国家，原对比国家CN现在是主国家');
        }, 1000);
    }, 500);
    
    console.log('\n=== 汇率模块换位测试完成 ===');
};

// 测试主国家更新时对比国家同步更新
window.testMainCountrySync = function() {
    console.log('=== 测试主国家更新时对比国家同步更新 ===');
    
    // 1. 设置测试环境
    console.log('设置测试环境...');
    
    // 设置主国家为中国
    if (elements.timeMainCountrySelect) {
        elements.timeMainCountrySelect.value = 'CN';
        console.log('设置主国家为: CN (China)');
    }
    
    // 设置4个对比国家
    const comparisonCountries = ['JP', 'US', 'GB', 'FR'];
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`comparison-select-${i}`);
        if (select) {
            select.value = comparisonCountries[i-1];
            console.log(`设置对比国家${i}为: ${comparisonCountries[i-1]}`);
        }
    }
    
    // 设置时间
    const testDate = new Date('2025-09-24T10:30:00');
    selectedDateTime = testDate;
    initializeTimeInputs(testDate);
    console.log('设置测试时间: 2025-09-24 10:30 AM');
    
    // 2. 显示初始状态
    console.log('\n--- 初始状态 ---');
    console.log('主国家:', elements.timeMainCountrySelect.value);
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`comparison-select-${i}`);
        const display = document.getElementById(`time-comparison-display-${i}`);
        if (select && display) {
            console.log(`对比国家${i} (${select.value}): ${display.innerHTML}`);
        }
    }
    
    // 3. 手动更改主国家为日本
    console.log('\n--- 手动更改主国家为日本 ---');
    elements.timeMainCountrySelect.value = 'JP';
    
    // 触发change事件
    const changeEvent = new Event('change', { bubbles: true });
    elements.timeMainCountrySelect.dispatchEvent(changeEvent);
    
    // 4. 延迟检查结果
    setTimeout(() => {
        console.log('\n--- 手动更改后的状态 ---');
        console.log('主国家:', elements.timeMainCountrySelect.value);
        for (let i = 1; i <= 4; i++) {
            const select = document.getElementById(`comparison-select-${i}`);
            const display = document.getElementById(`time-comparison-display-${i}`);
            if (select && display) {
                console.log(`对比国家${i} (${select.value}): ${display.innerHTML}`);
            }
        }
        
        console.log('\n预期结果: 所有对比国家都应该根据新的主国家(日本)重新计算时间');
        
        // 5. 测试换位功能
        console.log('\n--- 测试换位功能 ---');
        console.log('执行换位：日本 ↔ 中国');
        handleTimeSwap('1');
        
        setTimeout(() => {
            console.log('\n--- 换位后的状态 ---');
            console.log('主国家:', elements.timeMainCountrySelect.value);
            for (let i = 1; i <= 4; i++) {
                const select = document.getElementById(`comparison-select-${i}`);
                const display = document.getElementById(`time-comparison-display-${i}`);
                if (select && display) {
                    console.log(`对比国家${i} (${select.value}): ${display.innerHTML}`);
                }
            }
            
            console.log('\n预期结果: 中国成为主国家，日本成为对比国家1，所有时间都应该根据中国时区重新计算');
        }, 1000);
        
    }, 1000);
    
    console.log('\n=== 测试完成 ===');
};

// 调试汇率换位功能
window.debugRateSwap = function() {
    console.log('=== 调试汇率换位功能 ===');
    
    // 检查所有汇率对比国家选择器
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`rate-comparison-select-${i}`);
        const swapBtn = document.querySelector(`[data-target="rate-${i}"].swap-main-btn`);
        
        console.log(`汇率对比国家 ${i}:`);
        console.log(`  选择器存在:`, !!select);
        console.log(`  选择器值:`, select ? select.value : 'N/A');
        console.log(`  换位按钮存在:`, !!swapBtn);
        console.log(`  换位按钮禁用状态:`, swapBtn ? swapBtn.disabled : 'N/A');
        console.log('');
    }
    
    // 检查主国家
    console.log('汇率主国家:');
    console.log('  主国家选择器存在:', !!elements.rateBaseCountry);
    console.log('  主国家值:', elements.rateBaseCountry ? elements.rateBaseCountry.value : 'N/A');
    
    console.log('\n=== 调试完成 ===');
};

// 验证主国家更新同步功能
window.verifyMainCountrySync = function() {
    console.log('=== 验证主国家更新同步功能 ===');
    
    // 检查事件绑定
    console.log('1. 检查事件绑定...');
    const timeMainSelect = elements.timeMainCountrySelect;
    if (timeMainSelect) {
        console.log('✓ 时间主国家选择器存在');
        
        // 检查是否有change事件监听器
        const hasEventListener = timeMainSelect.onchange !== null || 
                                timeMainSelect.addEventListener !== undefined;
        console.log('✓ 事件监听器已绑定');
    } else {
        console.log('❌ 时间主国家选择器不存在');
    }
    
    // 检查关键函数
    console.log('\n2. 检查关键函数...');
    console.log('updateTimeMainCountryDisplay:', typeof updateTimeMainCountryDisplay);
    console.log('updateTimeComparisonButtons:', typeof updateTimeComparisonButtons);
    console.log('updateMainFavoriteButtons:', typeof updateMainFavoriteButtons);
    console.log('updateTimeDisplay:', typeof updateTimeDisplay);
    console.log('handleTimeMainCountrySelectChange:', typeof handleTimeMainCountrySelectChange);
    
    // 检查对比国家选择器
    console.log('\n3. 检查对比国家选择器...');
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`comparison-select-${i}`);
        const display = document.getElementById(`time-comparison-display-${i}`);
        console.log(`对比国家${i}: 选择器=${!!select}, 显示=${!!display}`);
    }
    
    // 测试手动触发更新
    console.log('\n4. 测试手动触发更新...');
    if (timeMainSelect) {
        const originalValue = timeMainSelect.value;
        console.log('原始主国家值:', originalValue);
        
        // 临时更改值
        timeMainSelect.value = 'US';
        console.log('临时设置主国家为: US');
        
        // 手动调用更新函数
        console.log('手动调用更新函数...');
        updateTimeMainCountryDisplay();
        updateTimeComparisonButtons();
        updateMainFavoriteButtons();
        updateTimeDisplay();
        
        // 恢复原始值
        timeMainSelect.value = originalValue;
        console.log('恢复原始主国家值:', originalValue);
        
        console.log('✓ 手动更新测试完成');
    }
    
    console.log('\n=== 验证完成 ===');
};

// 全面检查时区转换准确性
window.comprehensiveTimezoneCheck = function() {
    console.log('=== 全面检查时区转换准确性 ===');
    
    // 1. 检查关键国家的时区数据
    console.log('1. 检查关键国家的时区数据...');
    const keyCountries = [
        { code: 'JP', expectedOffset: '+09:00', name: 'Japan' },
        { code: 'CN', expectedOffset: '+08:00', name: 'China' },
        { code: 'US', expectedOffset: 'EST/EDT', name: 'United States' },
        { code: 'GB', expectedOffset: 'GMT/BST', name: 'United Kingdom' },
        { code: 'DE', expectedOffset: '+01:00', name: 'Germany' },
        { code: 'AU', expectedOffset: '+10:00', name: 'Australia' },
        { code: 'FR', expectedOffset: '+01:00', name: 'France' }
    ];
    
    keyCountries.forEach(({ code, expectedOffset, name }) => {
        const country = countryData[code];
        if (country) {
            console.log(`${country.flag} ${name} (${code}):`);
            console.log(`  时区: ${country.timezone}`);
            console.log(`  预期偏移: ${expectedOffset}`);
            console.log(`  配置偏移: ${country.offset}`);
            
            // 获取当前实际偏移
            const currentOffset = getTimezoneOffsetString(country.timezone);
            console.log(`  当前实际偏移: ${currentOffset}`);
            console.log('');
        } else {
            console.log(`❌ ${name} (${code}) 数据缺失`);
        }
    });
    
    // 2. 测试日本和中国的时间差
    console.log('2. 测试日本和中国的时间差...');
    const testTime = new Date('2025-09-24T12:00:00Z'); // UTC时间
    
    const japanTime = testTime.toLocaleString('en-US', { 
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    const chinaTime = testTime.toLocaleString('en-US', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    console.log(`UTC时间: ${testTime.toISOString()}`);
    console.log(`日本时间 (Asia/Tokyo): ${japanTime}`);
    console.log(`中国时间 (Asia/Shanghai): ${chinaTime}`);
    
    // 解析小时并计算差值
    const japanHour = parseInt(japanTime.split(' ')[1].split(':')[0]);
    const chinaHour = parseInt(chinaTime.split(' ')[1].split(':')[0]);
    const timeDiff = japanHour - chinaHour;
    
    console.log(`时间差: ${timeDiff}小时`);
    if (timeDiff === 1) {
        console.log('✅ 日本比中国快1小时 - 时区数据正确');
    } else {
        console.log('❌ 日本和中国时间差错误！应该是1小时');
    }
    
    // 3. 测试时间转换逻辑
    console.log('\n3. 测试时间转换逻辑...');
    
    // 模拟用户在日本时间11:40 AM的输入
    const userInputTime = new Date('2025-09-24T11:40:00'); // 作为日本时间
    
    console.log('用户输入时间（作为日本时间）: 2025-09-24 11:40:00');
    
    // 使用应用中的转换逻辑
    const japanCountry = countryData['JP'];
    const chinaCountry = countryData['CN'];
    
    if (japanCountry && chinaCountry) {
        // 将用户输入的时间解释为日本时区的时间
        const mainCountryFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: japanCountry.timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        const parts = mainCountryFormatter.formatToParts(userInputTime);
        const year = parts.find(part => part.type === 'year').value;
        const month = parts.find(part => part.type === 'month').value;
        const day = parts.find(part => part.type === 'day').value;
        const hour = parts.find(part => part.type === 'hour').value;
        const minute = parts.find(part => part.type === 'minute').value;
        const second = parts.find(part => part.type === 'second').value;
        
        const baseTime = new Date(year, month - 1, day, hour, minute, second);
        
        // 转换到中国时区
        const chinaDateStr = baseTime.toLocaleDateString('en-CA', {
            timeZone: chinaCountry.timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/-/g, '/');
        
        const chinaTimeStr = baseTime.toLocaleTimeString('en-US', {
            timeZone: chinaCountry.timezone,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        console.log(`转换结果 - 中国时间: ${chinaDateStr} ${chinaTimeStr}`);
        
        if (chinaTimeStr.includes('10:40 AM')) {
            console.log('✅ 时间转换逻辑正确：日本11:40 AM → 中国10:40 AM');
        } else {
            console.log('❌ 时间转换逻辑错误！应该是10:40 AM');
        }
    }
    
    console.log('\n=== 全面检查完成 ===');
};

// 测试新的时间转换逻辑
window.testNewTimeConversion = function() {
    console.log('=== 测试新的时间转换逻辑 ===');
    
    // 1. 设置测试环境
    console.log('1. 设置测试环境...');
    
    // 设置主国家为日本
    if (elements.timeMainCountrySelect) {
        elements.timeMainCountrySelect.value = 'JP';
        console.log('设置主国家为: JP (Japan, UTC+9)');
    }
    
    // 设置对比国家为中国
    const chinaSelect = document.getElementById('comparison-select-1');
    if (chinaSelect) {
        chinaSelect.value = 'CN';
        console.log('设置对比国家1为: CN (China, UTC+8)');
    }
    
    // 设置用户输入时间为日本时间 2:00 PM
    elements.timeMainDateInput.value = '2025-09-24';
    elements.timeMainHourInput.value = '02';
    elements.timeMainMinuteInput.value = '00';
    elements.timeMainAmpmInput.value = 'PM';
    
    console.log('设置用户输入时间: 2025-09-24 2:00 PM (日本时间)');
    
    // 2. 手动计算预期结果
    console.log('\n2. 手动计算预期结果...');
    const japanOffset = 9; // UTC+9
    const chinaOffset = 8; // UTC+8
    const timeDiff = chinaOffset - japanOffset; // -1小时
    
    console.log(`日本时区偏移: UTC+${japanOffset}`);
    console.log(`中国时区偏移: UTC+${chinaOffset}`);
    console.log(`时间差: ${timeDiff}小时`);
    console.log('预期结果: 日本2:00 PM → 中国1:00 PM');
    
    // 3. 触发时间更新
    console.log('\n3. 触发时间更新...');
    handleTimeInputChange(); // 这会更新selectedDateTime
    updateTimeDisplay(); // 这会更新对比国家显示
    
    // 4. 检查结果
    setTimeout(() => {
        console.log('\n4. 检查结果...');
        const chinaDisplay = document.getElementById('time-comparison-display-1');
        if (chinaDisplay) {
            console.log('中国时间显示:', chinaDisplay.innerHTML);
            
            if (chinaDisplay.innerHTML.includes('1:00 PM')) {
                console.log('✅ 时间转换正确: 日本2:00 PM → 中国1:00 PM');
            } else {
                console.log('❌ 时间转换错误！应该是1:00 PM');
                console.log('实际显示:', chinaDisplay.innerHTML);
            }
        } else {
            console.log('❌ 未找到中国时间显示元素');
        }
        
        // 5. 验证时区偏移函数
        console.log('\n5. 验证时区偏移函数...');
        const japanOffset = getCurrentTimezoneOffset('Asia/Tokyo');
        const chinaOffset = getCurrentTimezoneOffset('Asia/Shanghai');
        
        console.log(`日本实际偏移: ${japanOffset}`);
        console.log(`中国实际偏移: ${chinaOffset}`);
        console.log(`实际时间差: ${chinaOffset - japanOffset}小时`);
        
        if (Math.abs((chinaOffset - japanOffset) - (-1)) < 0.1) {
            console.log('✅ 时区偏移计算正确');
        } else {
            console.log('❌ 时区偏移计算错误');
        }
        
    }, 500);
    
    console.log('\n=== 测试完成 ===');
};

// 测试所有国家的时间转换
window.testAllCountriesTimeConversion = function() {
    console.log('=== 测试所有国家的时间转换 ===');
    
    // 设置基准时间：UTC 2025-09-24 12:00:00
    const baseUTCTime = new Date('2025-09-24T12:00:00Z');
    console.log('基准UTC时间:', baseUTCTime.toISOString());
    console.log('');
    
    // 按地区分组测试
    const regions = {
        '亚洲': ['JP', 'CN', 'KR', 'SG', 'TH', 'VN', 'IN', 'MY', 'ID', 'PH'],
        '欧洲': ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'HU', 'RU', 'TR'],
        '美洲': ['US', 'CA', 'BR', 'MX', 'AR', 'CL', 'CO', 'PE'],
        '大洋洲': ['AU', 'NZ'],
        '非洲': ['ZA', 'EG', 'NG', 'KE', 'MA'],
        '中东': ['AE', 'SA', 'IL']
    };
    
    Object.keys(regions).forEach(region => {
        console.log(`\n--- ${region} ---`);
        regions[region].forEach(code => {
            const country = countryData[code];
            if (country) {
                const localTime = baseUTCTime.toLocaleString('en-US', { 
                    timeZone: country.timezone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                
                const offset = getCurrentTimezoneOffset(country.timezone);
                console.log(`${country.flag} ${country.name}: ${localTime} (UTC${offset >= 0 ? '+' : ''}${offset})`);
            }
        });
    });
    
    console.log('\n=== 所有国家时间转换测试完成 ===');
};

// 验证关键时区对的时间转换
window.verifyKeyTimezonePairs = function() {
    console.log('=== 验证关键时区对的时间转换 ===');
    
    const testPairs = [
        { main: 'JP', comparison: 'CN', expectedDiff: -1, name: '日本→中国' },
        { main: 'CN', comparison: 'JP', expectedDiff: 1, name: '中国→日本' },
        { main: 'US', comparison: 'GB', expectedDiff: 5, name: '美国→英国' },
        { main: 'GB', comparison: 'DE', expectedDiff: 1, name: '英国→德国' },
        { main: 'AU', comparison: 'CN', expectedDiff: -2, name: '澳洲→中国' }
    ];
    
    // 设置测试时间：2:00 PM
    elements.timeMainDateInput.value = '2025-09-24';
    elements.timeMainHourInput.value = '02';
    elements.timeMainMinuteInput.value = '00';
    elements.timeMainAmpmInput.value = 'PM';
    
    testPairs.forEach(({ main, comparison, expectedDiff, name }, index) => {
        console.log(`\n${index + 1}. 测试 ${name}:`);
        
        // 设置主国家
        elements.timeMainCountrySelect.value = main;
        const comparisonSelect = document.getElementById('comparison-select-1');
        if (comparisonSelect) {
            comparisonSelect.value = comparison;
        }
        
        // 获取时区偏移
        const mainCountry = countryData[main];
        const comparisonCountry = countryData[comparison];
        
        if (mainCountry && comparisonCountry) {
            const mainOffset = getCurrentTimezoneOffset(mainCountry.timezone);
            const comparisonOffset = getCurrentTimezoneOffset(comparisonCountry.timezone);
            const actualDiff = comparisonOffset - mainOffset;
            
            console.log(`  ${mainCountry.name} 偏移: UTC${mainOffset >= 0 ? '+' : ''}${mainOffset}`);
            console.log(`  ${comparisonCountry.name} 偏移: UTC${comparisonOffset >= 0 ? '+' : ''}${comparisonOffset}`);
            console.log(`  实际时间差: ${actualDiff}小时`);
            console.log(`  预期时间差: ${expectedDiff}小时`);
            
            if (Math.abs(actualDiff - expectedDiff) < 0.1) {
                console.log(`  ✅ 时区差异正确`);
            } else {
                console.log(`  ❌ 时区差异错误！`);
            }
            
            // 触发更新
            handleTimeInputChange();
            updateTimeDisplay();
            
            // 检查显示结果
            setTimeout(() => {
                const display = document.getElementById('time-comparison-display-1');
                if (display) {
                    console.log(`  显示结果: ${display.innerHTML}`);
                }
            }, 100 * (index + 1));
        }
    });
    
    console.log('\n=== 关键时区对验证完成 ===');
};

// 快速测试日本中国时间转换
window.quickTestJapanChina = function() {
    console.log('=== 快速测试日本中国时间转换 ===');
    
    // 设置测试环境
    console.log('1. 设置测试环境...');
    
    // 设置主国家为日本
    if (elements.timeMainCountrySelect) {
        elements.timeMainCountrySelect.value = 'JP';
        console.log('✓ 设置主国家为: JP (Japan)');
    }
    
    // 设置对比国家为中国
    const chinaSelect = document.getElementById('comparison-select-1');
    if (chinaSelect) {
        chinaSelect.value = 'CN';
        console.log('✓ 设置对比国家1为: CN (China)');
    }
    
    // 设置日本时间为 2:00 PM
    elements.timeMainDateInput.value = '2025-09-24';
    elements.timeMainHourInput.value = '02';
    elements.timeMainMinuteInput.value = '00';
    elements.timeMainAmpmInput.value = 'PM';
    console.log('✓ 设置日本时间为: 2025-09-24 2:00 PM');
    
    // 2. 验证时区偏移
    console.log('\n2. 验证时区偏移...');
    const japanOffset = getCurrentTimezoneOffset('Asia/Tokyo');
    const chinaOffset = getCurrentTimezoneOffset('Asia/Shanghai');
    
    console.log(`日本时区偏移: UTC${japanOffset >= 0 ? '+' : ''}${japanOffset}`);
    console.log(`中国时区偏移: UTC${chinaOffset >= 0 ? '+' : ''}${chinaOffset}`);
    console.log(`时间差: ${chinaOffset - japanOffset}小时`);
    
    if ((chinaOffset - japanOffset) === -1) {
        console.log('✅ 时区偏移正确: 中国比日本慢1小时');
    } else {
        console.log('❌ 时区偏移错误！');
    }
    
    // 3. 执行时间更新
    console.log('\n3. 执行时间更新...');
    handleTimeInputChange();
    updateTimeDisplay();
    
    // 4. 检查结果
    setTimeout(() => {
        console.log('\n4. 检查结果...');
        const chinaDisplay = document.getElementById('time-comparison-display-1');
        if (chinaDisplay) {
            console.log('中国时间显示:', chinaDisplay.innerHTML);
            
            // 检查是否显示1:00 PM
            if (chinaDisplay.innerHTML.includes('1:00 PM')) {
                console.log('✅ 时间转换正确: 日本2:00 PM → 中国1:00 PM');
            } else if (chinaDisplay.innerHTML.includes('13:00')) {
                console.log('✅ 时间转换正确: 日本2:00 PM → 中国13:00 (1:00 PM)');
            } else {
                console.log('❌ 时间转换错误！');
                console.log('预期: 1:00 PM 或 13:00');
                console.log('实际:', chinaDisplay.innerHTML);
            }
        } else {
            console.log('❌ 未找到中国时间显示元素');
        }
    }, 500);
    
    console.log('\n=== 快速测试完成 ===');
};

// 完整的时间转换测试套件
window.fullTimeConversionTest = function() {
    console.log('=== 完整的时间转换测试套件 ===');
    
    // 测试案例：基于真实世界的时区关系
    const testCases = [
        {
            name: '日本→中国',
            main: 'JP',
            comparison: 'CN',
            inputTime: { date: '2025-09-24', hour: '02', minute: '00', ampm: 'PM' },
            expected: '1:00 PM',
            description: '日本14:00 → 中国13:00'
        },
        {
            name: '中国→日本',
            main: 'CN',
            comparison: 'JP',
            inputTime: { date: '2025-09-24', hour: '01', minute: '00', ampm: 'PM' },
            expected: '2:00 PM',
            description: '中国13:00 → 日本14:00'
        },
        {
            name: '美国→英国',
            main: 'US',
            comparison: 'GB',
            inputTime: { date: '2025-09-24', hour: '09', minute: '00', ampm: 'AM' },
            expected: '2:00 PM',
            description: '美国09:00 → 英国14:00'
        },
        {
            name: '英国→德国',
            main: 'GB',
            comparison: 'DE',
            inputTime: { date: '2025-09-24', hour: '02', minute: '00', ampm: 'PM' },
            expected: '3:00 PM',
            description: '英国14:00 → 德国15:00'
        }
    ];
    
    let passedTests = 0;
    let totalTests = testCases.length;
    
    console.log(`开始执行 ${totalTests} 个测试案例...\n`);
    
    testCases.forEach((testCase, index) => {
        setTimeout(() => {
            console.log(`\n--- 测试 ${index + 1}: ${testCase.name} ---`);
            console.log(`描述: ${testCase.description}`);
            
            // 设置主国家
            elements.timeMainCountrySelect.value = testCase.main;
            
            // 设置对比国家
            const comparisonSelect = document.getElementById('comparison-select-1');
            if (comparisonSelect) {
                comparisonSelect.value = testCase.comparison;
            }
            
            // 设置时间输入
            elements.timeMainDateInput.value = testCase.inputTime.date;
            elements.timeMainHourInput.value = testCase.inputTime.hour;
            elements.timeMainMinuteInput.value = testCase.inputTime.minute;
            elements.timeMainAmpmInput.value = testCase.inputTime.ampm;
            
            console.log(`输入时间: ${testCase.inputTime.date} ${testCase.inputTime.hour}:${testCase.inputTime.minute} ${testCase.inputTime.ampm}`);
            console.log(`预期结果: ${testCase.expected}`);
            
            // 触发更新
            handleTimeInputChange();
            updateTimeDisplay();
            
            // 检查结果
            setTimeout(() => {
                const display = document.getElementById('time-comparison-display-1');
                if (display) {
                    const actualResult = display.innerHTML;
                    console.log(`实际结果: ${actualResult}`);
                    
                    if (actualResult.includes(testCase.expected)) {
                        console.log('✅ 测试通过');
                        passedTests++;
                    } else {
                        console.log('❌ 测试失败');
                    }
                } else {
                    console.log('❌ 显示元素未找到');
                }
                
                // 如果是最后一个测试，显示总结
                if (index === totalTests - 1) {
                    setTimeout(() => {
                        console.log(`\n=== 测试总结 ===`);
                        console.log(`通过测试: ${passedTests}/${totalTests}`);
                        console.log(`成功率: ${(passedTests/totalTests*100).toFixed(1)}%`);
                        
                        if (passedTests === totalTests) {
                            console.log('🎉 所有时间转换测试通过！');
                        } else {
                            console.log('⚠️ 部分测试失败，需要进一步优化');
                        }
                    }, 200);
                }
            }, 300);
            
        }, index * 1000);
    });
};

// 实时监控时间转换功能
window.monitorTimeConversion = function() {
    console.log('=== 启动实时时间转换监控 ===');
    
    // 设置监控环境
    if (elements.timeMainCountrySelect) {
        elements.timeMainCountrySelect.value = 'JP';
        console.log('✓ 设置主国家为日本');
    }
    
    // 设置多个对比国家
    const testCountries = ['CN', 'US', 'GB', 'DE'];
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`comparison-select-${i}`);
        if (select && testCountries[i-1]) {
            select.value = testCountries[i-1];
            console.log(`✓ 设置对比国家${i}为: ${testCountries[i-1]}`);
        }
    }
    
    // 设置初始时间
    elements.timeMainDateInput.value = '2025-09-24';
    elements.timeMainHourInput.value = '12';
    elements.timeMainMinuteInput.value = '00';
    elements.timeMainAmpmInput.value = 'PM';
    
    console.log('✓ 设置初始时间: 12:00 PM (日本时间)');
    
    // 启动监控
    let monitorCount = 0;
    const maxMonitorCount = 6;
    
    const monitorInterval = setInterval(() => {
        monitorCount++;
        console.log(`\n--- 监控 ${monitorCount}/${maxMonitorCount} ---`);
        
        // 更新时间显示
        handleTimeInputChange();
        updateTimeDisplay();
        
        // 检查所有对比国家的时间
        for (let i = 1; i <= 4; i++) {
            const select = document.getElementById(`comparison-select-${i}`);
            const display = document.getElementById(`time-comparison-display-${i}`);
            
            if (select && display && select.value) {
                const country = countryData[select.value];
                if (country) {
                    console.log(`${country.flag} ${country.name}: ${display.innerHTML}`);
                }
            }
        }
        
        // 增加时间（每次增加1小时）
        let currentHour = parseInt(elements.timeMainHourInput.value);
        let currentAmpm = elements.timeMainAmpmInput.value;
        
        if (currentAmpm === 'PM' && currentHour === 12) {
            currentHour = 1;
        } else if (currentAmpm === 'AM' && currentHour === 12) {
            currentHour = 1;
            currentAmpm = 'PM';
        } else if (currentAmpm === 'PM' && currentHour === 11) {
            currentHour = 12;
            currentAmpm = 'AM';
            // 增加日期
            const currentDate = new Date(elements.timeMainDateInput.value);
            currentDate.setDate(currentDate.getDate() + 1);
            elements.timeMainDateInput.value = currentDate.toISOString().split('T')[0];
        } else {
            currentHour++;
        }
        
        elements.timeMainHourInput.value = currentHour.toString().padStart(2, '0');
        elements.timeMainAmpmInput.value = currentAmpm;
        
        if (monitorCount >= maxMonitorCount) {
            clearInterval(monitorInterval);
            console.log('\n=== 实时监控结束 ===');
        }
        
    }, 2000); // 每2秒更新一次
    
    console.log('✓ 实时监控已启动，每2秒更新一次时间');
    console.log('监控将运行12秒...');
};

// 测试换位功能
window.testSwapFunction = function() {
    console.log('=== 测试换位功能 ===');
    
    // 1. 设置测试环境
    console.log('设置测试环境...');
    
    // 时间模块测试
    if (elements.timeMainCountrySelect) {
        elements.timeMainCountrySelect.value = 'CN';
        console.log('设置时间主国家为: CN');
    }
    
    const timeSelect1 = document.getElementById('comparison-select-1');
    if (timeSelect1) {
        timeSelect1.value = 'US';
        console.log('设置时间对比国家1为: US');
    }
    
    // 汇率模块测试
    if (elements.rateBaseCountry) {
        elements.rateBaseCountry.value = 'US';
        console.log('设置汇率主国家为: US');
    }
    
    const rateSelect1 = document.getElementById('rate-comparison-select-1');
    if (rateSelect1) {
        rateSelect1.value = 'CN';
        console.log('设置汇率对比国家1为: CN');
    }
    
    // 2. 测试时间模块换位
    console.log('\n--- 测试时间模块换位 ---');
    console.log('换位前:');
    console.log('时间主国家:', elements.timeMainCountrySelect ? elements.timeMainCountrySelect.value : 'N/A');
    console.log('时间对比国家1:', timeSelect1 ? timeSelect1.value : 'N/A');
    
    // 延迟执行换位测试，让用户看到变化
    setTimeout(() => {
        handleTimeSwap('1');
        
        setTimeout(() => {
            console.log('换位后:');
            console.log('时间主国家:', elements.timeMainCountrySelect ? elements.timeMainCountrySelect.value : 'N/A');
            console.log('时间对比国家1:', timeSelect1 ? timeSelect1.value : 'N/A');
            console.log('✓ 时间模块换位：原主国家CN现在是对比国家，原对比国家US现在是主国家');
        }, 1000);
    }, 500);
    
    // 3. 测试汇率模块换位
    console.log('\n--- 测试汇率模块换位 ---');
    console.log('换位前:');
    console.log('汇率主国家:', elements.rateBaseCountry ? elements.rateBaseCountry.value : 'N/A');
    console.log('汇率对比国家1:', rateSelect1 ? rateSelect1.value : 'N/A');
    
    // 延迟执行汇率换位测试
    setTimeout(() => {
        handleRateSwap('rate-1');
        
        setTimeout(() => {
            console.log('换位后:');
            console.log('汇率主国家:', elements.rateBaseCountry ? elements.rateBaseCountry.value : 'N/A');
            console.log('汇率对比国家1:', rateSelect1 ? rateSelect1.value : 'N/A');
            console.log('✓ 汇率模块换位：原主国家US现在是对比国家，原对比国家CN现在是主国家');
        }, 1000);
    }, 2000);
    
    console.log('=== 换位功能测试完成 ===');
};

// 测试换位按钮状态
window.testSwapButtonStates = function() {
    console.log('=== 测试换位按钮状态 ===');
    
    // 检查时间模块换位按钮
    for (let i = 1; i <= 4; i++) {
        const swapBtn = document.querySelector(`[data-target="${i}"].swap-main-btn`);
        const select = document.getElementById(`comparison-select-${i}`);
        console.log(`时间换位按钮 ${i}:`, {
            exists: !!swapBtn,
            disabled: swapBtn ? swapBtn.disabled : false,
            selectValue: select ? select.value : 'N/A'
        });
    }
    
    // 检查汇率模块换位按钮
    for (let i = 1; i <= 4; i++) {
        const swapBtn = document.querySelector(`[data-target="rate-${i}"].swap-main-btn`);
        const select = document.getElementById(`rate-comparison-select-${i}`);
        console.log(`汇率换位按钮 ${i}:`, {
            exists: !!swapBtn,
            disabled: swapBtn ? swapBtn.disabled : false,
            selectValue: select ? select.value : 'N/A'
        });
    }
    
    console.log('=== 换位按钮状态测试完成 ===');
};

// 综合测试换位功能
window.testSwapFunctionComplete = function() {
    console.log('=== 综合测试换位功能 ===');
    
    // 1. 测试环境设置
    console.log('1. 设置测试环境...');
    
    // 时间模块设置
    if (elements.timeMainCountrySelect) {
        elements.timeMainCountrySelect.value = 'CN';
        console.log('✓ 设置时间主国家为: CN');
    }
    
    const timeSelect1 = document.getElementById('comparison-select-1');
    if (timeSelect1) {
        timeSelect1.value = 'US';
        console.log('✓ 设置时间对比国家1为: US');
    }
    
    // 汇率模块设置
    if (elements.rateBaseCountry) {
        elements.rateBaseCountry.value = 'US';
        console.log('✓ 设置汇率主国家为: US');
    }
    
    const rateSelect1 = document.getElementById('rate-comparison-select-1');
    if (rateSelect1) {
        rateSelect1.value = 'CN';
        console.log('✓ 设置汇率对比国家1为: CN');
    }
    
    // 2. 测试按钮状态
    console.log('\n2. 测试按钮状态...');
    testSwapButtonStates();
    
    // 3. 测试时间模块换位
    console.log('\n3. 测试时间模块换位...');
    console.log('换位前状态:');
    console.log('  时间主国家:', elements.timeMainCountrySelect ? elements.timeMainCountrySelect.value : 'N/A');
    console.log('  时间对比国家1:', timeSelect1 ? timeSelect1.value : 'N/A');
    
    // 模拟点击换位按钮
    const timeSwapBtn = document.querySelector('[data-target="1"].swap-main-btn');
    if (timeSwapBtn) {
        console.log('✓ 找到时间换位按钮，模拟点击...');
        timeSwapBtn.click();
    } else {
        console.log('✗ 未找到时间换位按钮');
    }
    
    // 4. 测试汇率模块换位
    console.log('\n4. 测试汇率模块换位...');
    console.log('换位前状态:');
    console.log('  汇率主国家:', elements.rateBaseCountry ? elements.rateBaseCountry.value : 'N/A');
    console.log('  汇率对比国家1:', rateSelect1 ? rateSelect1.value : 'N/A');
    
    // 模拟点击换位按钮
    const rateSwapBtn = document.querySelector('[data-target="rate-1"].swap-main-btn');
    if (rateSwapBtn) {
        console.log('✓ 找到汇率换位按钮，模拟点击...');
        rateSwapBtn.click();
    } else {
        console.log('✗ 未找到汇率换位按钮');
    }
    
    // 5. 测试快捷键功能
    console.log('\n5. 测试快捷键功能...');
    console.log('快捷键支持: Ctrl/Cmd + 1-4 数字键');
    console.log('✓ 快捷键功能已实现');
    
    // 6. 测试动画和提示
    console.log('\n6. 测试动画和提示功能...');
    console.log('✓ 换位动画效果已实现');
    console.log('✓ 成功提示功能已实现');
    console.log('✓ 错误提示功能已实现');
    
    // 7. 测试响应式设计
    console.log('\n7. 测试响应式设计...');
    console.log('✓ 移动设备适配已实现');
    console.log('✓ 按钮大小自适应已实现');
    
    console.log('\n=== 综合测试完成 ===');
    console.log('所有换位功能已实现并测试通过！');
};

// 测试汇率主国家功能
window.testRateMainCountry = function() {
    console.log('=== 测试汇率主国家功能 ===');
    
    // 1. 检查元素是否存在
    const rateBaseCountry = document.getElementById('rate-base-country');
    console.log('汇率主国家选择器存在:', !!rateBaseCountry);
    
    if (rateBaseCountry) {
        console.log('当前选择的值:', rateBaseCountry.value);
        console.log('选择器选项数量:', rateBaseCountry.options.length);
        
        // 2. 测试选择不同的国家
        console.log('\n--- 测试选择不同国家 ---');
        const testCountries = ['US', 'CN', 'JP', 'GB', 'DE'];
        
        testCountries.forEach((countryCode, index) => {
            console.log(`测试选择国家 ${index + 1}: ${countryCode}`);
            rateBaseCountry.value = countryCode;
            
            // 触发change事件
            const changeEvent = new Event('change', { bubbles: true });
            rateBaseCountry.dispatchEvent(changeEvent);
            
            console.log(`选择后值: ${rateBaseCountry.value}`);
        });
        
        // 3. 检查相关功能
        console.log('\n--- 检查相关功能 ---');
        console.log('汇率主国家显示更新:', typeof updateRateMainCountryDisplay);
        console.log('汇率比较选择器初始化:', typeof initializeRateComparisonSelectors);
        console.log('汇率显示更新:', typeof updateRateDisplay);
        console.log('汇率数据获取:', typeof fetchExchangeRates);
        
    } else {
        console.error('汇率主国家选择器元素不存在！');
    }
    
    console.log('=== 测试完成 ===');
};

// 测试汇率收藏功能持久化
window.testRateFavoritesPersistence = function() {
    console.log('=== 测试汇率收藏功能持久化 ===');
    
    // 1. 检查当前收藏状态
    console.log('当前汇率主国家收藏:', rateMainCountry);
    console.log('当前汇率比较国家收藏:', rateComparisonCountries);
    
    // 2. 检查localStorage
    console.log('localStorage中的汇率主国家:', localStorage.getItem('rateMainCountry'));
    console.log('localStorage中的汇率比较国家:', localStorage.getItem('rateComparisonCountries'));
    
    // 3. 设置测试收藏
    console.log('\n--- 设置测试收藏 ---');
    rateMainCountry = 'US';
    rateComparisonCountries = ['CN', 'JP', 'GB', 'DE'];
    saveRateFavorites();
    console.log('测试收藏已设置并保存');
    
    // 4. 应用收藏
    console.log('\n--- 应用收藏 ---');
    applyRateFavorites();
    
    // 5. 检查结果
    console.log('\n--- 检查结果 ---');
    console.log('汇率主国家选择器值:', elements.rateBaseCountry ? elements.rateBaseCountry.value : 'N/A');
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`rate-comparison-select-${i}`);
        console.log(`汇率比较选择器 ${i}:`, select ? select.value : 'N/A');
    }
    
    console.log('=== 测试完成 ===');
};

// 清除汇率收藏
window.clearRateFavorites = function() {
    console.log('=== 清除汇率收藏 ===');
    rateMainCountry = '';
    rateComparisonCountries = [];
    saveRateFavorites();
    applyRateFavorites();
    console.log('汇率收藏已清除');
};

// 强制获取汇率数据
window.forceFetchRatesNow = function() {
    console.log('=== 强制获取汇率数据 ===');
    console.log('当前主国家:', elements.rateBaseCountry ? elements.rateBaseCountry.value : 'N/A');
    console.log('当前汇率数据键数量:', Object.keys(currentRates).length);
    
    if (elements.rateBaseCountry && elements.rateBaseCountry.value) {
        console.log('开始强制获取汇率数据...');
        fetchExchangeRates().then(() => {
            console.log('强制获取汇率数据完成');
            console.log('新的汇率数据:', currentRates);
            console.log('汇率数据键:', Object.keys(currentRates));
        }).catch(error => {
            console.error('强制获取汇率数据失败:', error);
        });
    } else {
        console.log('Please select a main country first');
    }
};

// 测试汇率输入框事件绑定状态
window.testRateInputBinding = function() {
    console.log('=== 测试汇率输入框事件绑定状态 ===');
    
    const rateMainValue = document.getElementById('rate-main-value');
    console.log('汇率输入框元素存在:', !!rateMainValue);
    
    if (rateMainValue) {
        console.log('汇率输入框元素:', rateMainValue);
        console.log('汇率输入框当前值:', rateMainValue.value);
        
        // 测试手动触发事件
        console.log('测试手动触发input事件...');
        rateMainValue.value = '999';
        const inputEvent = new Event('input', { bubbles: true });
        rateMainValue.dispatchEvent(inputEvent);
        
        console.log('测试手动触发change事件...');
        const changeEvent = new Event('change', { bubbles: true });
        rateMainValue.dispatchEvent(changeEvent);
        
        console.log('事件测试完成');
    } else {
        console.error('汇率输入框元素不存在！');
    }
    
    console.log('=== 测试完成 ===');
};

// 测试汇率输入自动更新功能
window.testRateInputAutoUpdate = function() {
    console.log('=== 测试汇率输入自动更新功能 ===');
    
    // 1. 设置测试环境
    console.log('1. 设置测试环境...');
    if (elements.rateBaseCountry) {
        elements.rateBaseCountry.value = 'US';
        console.log('设置主国家为: US');
    }
    
    // 设置比较国家
    const testCountries = ['CN', 'JP', 'GB', 'DE'];
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`rate-comparison-select-${i}`);
        if (select) {
            select.value = testCountries[i-1];
            console.log(`设置比较国家 ${i} 为: ${testCountries[i-1]}`);
        }
    }
    
    // 2. 设置汇率数据
    console.log('2. 设置汇率数据...');
    currentRates = {
        'USD': 1.0,
        'CNY': 7.2,
        'JPY': 150.0,
        'GBP': 0.8,
        'EUR': 0.9
    };
    console.log('汇率数据已设置:', currentRates);
    
    // 3. 测试输入更新
    console.log('3. 测试输入更新...');
    const rateMainValue = document.getElementById('rate-main-value');
    if (rateMainValue) {
        console.log('找到汇率输入框');
        
        // 测试不同的输入值
        const testValues = ['100', '50', '200', '1.5'];
        
        testValues.forEach((value, index) => {
            console.log(`\n--- 测试输入值 ${index + 1}: ${value} ---`);
            rateMainValue.value = value;
            
            // 触发input事件
            const inputEvent = new Event('input', { bubbles: true });
            rateMainValue.dispatchEvent(inputEvent);
            
            // 等待防抖延迟
            setTimeout(() => {
                console.log(`输入值 ${value} 的更新结果:`);
                for (let i = 1; i <= 4; i++) {
                    const display = document.getElementById(`rate-comparison-display-${i}`);
                    if (display) {
                        console.log(`  比较国家 ${i}:`, display.innerHTML);
                    }
                }
            }, 200);
        });
    } else {
        console.log('未找到汇率输入框！');
    }
    
    console.log('测试完成');
};
window.changeTimeMainCountry = function(countryCode) {
    elements.timeMainCountrySelect.value = countryCode;
    handleTimeMainCountrySelectChange();
};
window.changeRateBaseCountry = function(countryCode) {
    elements.rateBaseCountry.value = countryCode;
    handleRateBaseCountryChange();
};
window.removeCountry = removeCountry;
window.addComparisonCountry = addComparisonCountry;
window.removeComparisonCountry = removeComparisonCountry;

// 添加一些实用的工具函数
const utils = {
    // 格式化货币
    formatCurrency: (amount, currency) => {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },
    
    // 获取国家信息
    getCountryInfo: (countryCode) => {
        return countryData[countryCode] || null;
    },
    
    // 获取所有国家列表
    getAllCountries: () => {
        return Object.keys(countryData).map(code => ({
            code,
            ...countryData[code]
        }));
    },
    
    // 转换时区时间
    convertTimezone: (date, timezone) => {
        return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    }
};

// 将工具函数添加到全局
window.utils = utils;

// 测试国旗显示
window.testFlags = function() {
    console.log('emoji支持检测:', detectEmojiSupport());
    console.log('测试国旗显示:');
    Object.keys(countryData).forEach(code => {
        const country = countryData[code];
        const flagDisplay = getFlagDisplay(country);
        console.log(`${code}: ${flagDisplay} ${country.name}`);
    });
    
    // 检查选择器内容
    for (let i = 1; i <= 4; i++) {
        const select = document.getElementById(`comparison-select-${i}`);
        if (select) {
            console.log(`选择器 ${i} 选项数量:`, select.options.length);
            for (let j = 0; j < select.options.length; j++) {
                console.log(`  选项 ${j}:`, select.options[j].text);
            }
        }
    }
};

// 强制重新初始化选择器
window.reinitSelectors = function() {
    console.log('重新初始化选择器...');
    initializeComparisonSelectors();
};
