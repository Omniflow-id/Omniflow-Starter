/**
 * Network Safety Guard
 * Automatically detects network connectivity and disables UI controls when offline
 * Prevents failed transactions due to network issues
 */

(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        CHECK_URL: 'https://connectivitycheck.gstatic.com/generate_204',
        CHECK_INTERVAL: 10000,      // Check every 10 seconds
        GRACE_PERIOD: 2000,         // 2 second delay before disabling
        STATUS_KEY: 'networkGuardStatus' // LocalStorage key
    };

    // State
    let gracePeriodTimer = null;
    let checkIntervalTimer = null;
    let lastKnownStatus = 'CHECKING';

    // DOM Elements
    const elements = {
        overlay: null,
        indicator: null
    };

    /**
     * Initialize the Network Safety Guard
     */
    function init() {
        // Ensure DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                createStatusIndicator();
                createOverlay();
                startMonitoring();
            });
        } else {
            createStatusIndicator();
            createOverlay();
            startMonitoring();
        }
    }

    /**
     * Start monitoring after UI elements are created
     */
    function startMonitoring() {
        // Initial check
        checkInternet();

        // Start periodic checking
        checkIntervalTimer = setInterval(checkInternet, CONFIG.CHECK_INTERVAL);

        // Listen to browser online/offline events
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
    }

    /**
     * Create the network status indicator (traffic light style)
     */
    function createStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'network-status-indicator';
        indicator.className = 'network-status-indicator';
        indicator.innerHTML = `
            <div class="status-light online" data-status="online">
                <span class="light-dot"></span>
                <span class="status-label">Online</span>
            </div>
            <div class="status-light offline" data-status="offline">
                <span class="light-dot"></span>
                <span class="status-label">Offline</span>
            </div>
            <div class="status-light checking" data-status="checking">
                <span class="light-dot"></span>
                <span class="status-label">Checking...</span>
            </div>
        `;

        // Set initial state - show online, hide others using class
        const lights = indicator.querySelectorAll('.status-light');
        lights.forEach(light => {
            light.classList.remove('active');
        });
        const onlineLight = indicator.querySelector('.status-light.online');
        if (onlineLight) {
            onlineLight.classList.add('active');
        }

        // Inject styles
        const style = document.createElement('style');
        style.id = 'network-indicator-styles';
        style.textContent = `
            .network-status-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-right: 15px;
            }

            .status-light {
                display: none;
                align-items: center;
                gap: 6px;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.3s ease;
            }

            .status-light.active {
                display: flex !important;
            }

            .status-light .light-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                box-shadow: 0 0 8px currentColor;
                animation: none;
            }

            .status-light .status-label {
                color: white;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }

            /* Online - Green */
            .status-light.online .light-dot {
                background-color: #2ecc71;
                color: #2ecc71;
                box-shadow: 0 0 10px #2ecc71, 0 0 20px #2ecc71;
                animation: pulse-green 2s infinite;
            }

            /* Offline - Red */
            .status-light.offline .light-dot {
                background-color: #e74c3c;
                color: #e74c3c;
                box-shadow: 0 0 8px #e74c3c;
                animation: blink-red 1s infinite;
            }

            /* Checking - Yellow/Orange */
            .status-light.checking .light-dot {
                background-color: #f39c12;
                color: #f39c12;
                box-shadow: 0 0 8px #f39c12;
                animation: pulse-yellow 0.5s infinite;
            }

            @keyframes pulse-green {
                0%, 100% { box-shadow: 0 0 10px #2ecc71, 0 0 20px #2ecc71; }
                50% { box-shadow: 0 0 5px #2ecc71, 0 0 10px #2ecc71; }
            }

            @keyframes blink-red {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
            }

            @keyframes pulse-yellow {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.2); }
            }
        `;
        document.head.appendChild(style);

        // Find navbar and insert indicator
        const navbar = document.querySelector('.navbar-nav.ms-auto.ms-md-0.me-3.me-lg-4');

        if (navbar) {
            navbar.parentNode.insertBefore(indicator, navbar);
        } else {
            // Fallback: insert after navbar brand
            const navbarBrand = document.querySelector('.navbar-brand');
            if (navbarBrand) {
                navbarBrand.parentNode.insertBefore(indicator, navbarBrand.nextSibling);
            } else {
                document.body.insertBefore(indicator, document.body.firstChild);
            }
        }

        elements.indicator = indicator;
    }

    /**
     * Create full-page overlay
     */
    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'network-overlay';
        overlay.innerHTML = `
            <div class="network-overlay-content">
                <div class="network-overlay-icon">
                    <i class="fas fa-wifi-slash"></i>
                </div>
                <h2>Koneksi Terputus</h2>
                <p>Tombol dan input dinonaktifkan untuk mencegah transaksi gagal.</p>
                <p class="network-overlay-hint">Sistem akan otomatis aktif kembali saat koneksi pulih.</p>
                <div class="network-overlay-spinner">
                    <div class="spinner-border text-warning" role="status">
                        <span class="visually-hidden">Memeriksa...</span>
                    </div>
                </div>
            </div>
        `;
        overlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9998;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        document.body.appendChild(overlay);
        elements.overlay = overlay;

        // Add overlay styles
        const overlayStyles = document.createElement('style');
        overlayStyles.textContent = `
            #network-overlay.show {
                display: flex;
            }
            #network-overlay .network-overlay-icon {
                font-size: 64px;
                margin-bottom: 20px;
                color: #f39c12;
            }
            #network-overlay h2 {
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 10px;
            }
            #network-overlay p {
                font-size: 16px;
                opacity: 0.9;
                margin-bottom: 8px;
            }
            #network-overlay .network-overlay-hint {
                font-size: 14px;
                opacity: 0.7;
                font-style: italic;
            }
            #network-overlay .network-overlay-spinner {
                margin-top: 20px;
            }
        `;
        document.head.appendChild(overlayStyles);
    }

    /**
     * Check internet connectivity using fetch
     */
    async function checkInternet() {
        // Only show checking UI if we're already in offline or grace period state
        const wasOffline = lastKnownStatus === 'OFFLINE' || lastKnownStatus === 'CHECKING_GRACE';

        if (wasOffline) {
            lastKnownStatus = 'CHECKING';
            updateIndicator('checking');
        } else {
            lastKnownStatus = 'CHECKING';
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            await fetch(CONFIG.CHECK_URL, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // If we get here, we're online
            setOnline();

        } catch (error) {
            // Network error - might be offline
            // Only show offline UI if we're already in grace period
            if (wasOffline) {
                setOffline();
            }
        }
    }

    /**
     * Handle browser going online
     */
    function handleOnline() {
        // Clear any pending grace period
        if (gracePeriodTimer) {
            clearTimeout(gracePeriodTimer);
            gracePeriodTimer = null;
        }
        setOnline();
    }

    /**
     * Handle browser going offline
     */
    function handleOffline() {
        // Start grace period
        lastKnownStatus = 'CHECKING_GRACE';
        updateIndicator('checking');

        gracePeriodTimer = setTimeout(() => {
            setOffline();
        }, CONFIG.GRACE_PERIOD);
    }

    /**
     * Set online status
     */
    function setOnline() {
        lastKnownStatus = 'ONLINE';
        localStorage.setItem(CONFIG.STATUS_KEY, 'ONLINE');
        updateIndicator('ONLINE');
        toggleButtons('ONLINE');
        hideOverlay();
    }

    /**
     * Set offline status
     */
    function setOffline() {
        lastKnownStatus = 'OFFLINE';
        localStorage.setItem(CONFIG.STATUS_KEY, 'OFFLINE');
        updateIndicator('OFFLINE');
        toggleButtons('OFFLINE');
        showOverlay();
    }

    /**
     * Toggle button/input states based on network status
     * @param {string} status - 'ONLINE', 'OFFLINE', or 'CHECKING'
     */
    function toggleButtons(status) {
        const selectors = [
            'button:not(.ignore-network-guard)',
            'input:not(.ignore-network-guard)',
            'select:not(.ignore-network-guard)',
            'textarea:not(.ignore-network-guard)'
        ].join(', ');

        const elements = document.querySelectorAll(selectors);

        elements.forEach(el => {
            if (status === 'OFFLINE' || status === 'CHECKING') {
                // Store original state
                if (!el.dataset.originalDisabled) {
                    el.dataset.originalDisabled = el.disabled;
                }
                el.disabled = true;
                el.style.opacity = '0.5';
                el.style.cursor = 'not-allowed';

                // Add visual indicator class
                el.classList.add('network-guarded');

            } else {
                // Restore original state
                if (el.dataset.originalDisabled) {
                    el.disabled = el.dataset.originalDisabled === 'true';
                } else {
                    el.disabled = false;
                }
                el.style.opacity = '';
                el.style.cursor = '';
                el.classList.remove('network-guarded');
            }
        });

        // Add global style for network-guarded elements
        if (!document.getElementById('network-guard-styles')) {
            const style = document.createElement('style');
            style.id = 'network-guard-styles';
            style.textContent = `
                .network-guarded {
                    opacity: 0.5 !important;
                    cursor: not-allowed !important;
                    pointer-events: none !important;
                }
                .network-guarded:hover {
                    opacity: 0.5 !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Update status indicator (traffic light)
     */
    function updateIndicator(status) {
        let indicator = elements.indicator;

        // If indicator not found, try to find it
        if (!indicator) {
            indicator = document.getElementById('network-status-indicator');
            if (indicator) {
                elements.indicator = indicator;
            } else {
                return;
            }
        }

        // Get all status lights
        const onlineLight = indicator.querySelector('.status-light.online');
        const offlineLight = indicator.querySelector('.status-light.offline');
        const checkingLight = indicator.querySelector('.status-light.checking');

        // Hide all lights first using CSS class
        if (onlineLight) onlineLight.classList.remove('active');
        if (offlineLight) offlineLight.classList.remove('active');
        if (checkingLight) checkingLight.classList.remove('active');

        // Show the active light (normalize status to lowercase)
        let activeLight;
        const normalizedStatus = status ? status.toLowerCase() : '';

        if (normalizedStatus === 'checking') {
            activeLight = checkingLight;
        } else if (normalizedStatus === 'offline') {
            activeLight = offlineLight;
        } else if (normalizedStatus === 'online') {
            activeLight = onlineLight;
        }

        if (activeLight) {
            activeLight.classList.add('active');
        }
    }

    /**
     * Show overlay
     */
    function showOverlay() {
        if (elements.overlay) {
            elements.overlay.classList.add('show');
        }
    }

    /**
     * Hide overlay
     */
    function hideOverlay() {
        if (elements.overlay) {
            elements.overlay.classList.remove('show');
        }
    }

    /**
     * Get current network status
     */
    function getStatus() {
        return lastKnownStatus;
    }

    /**
     * Manually trigger a connectivity check
     */
    function forceCheck() {
        checkInternet();
    }

    // Expose API globally
    window.NetworkGuard = {
        init: init,
        getStatus: getStatus,
        forceCheck: forceCheck,
        toggleButtons: toggleButtons,
        updateIndicator: updateIndicator
    };

    // Auto-initialize when navbar is ready (defer to ensure DOM is ready)
    function deferredInit() {
        // Wait for DOM to be fully ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                setTimeout(init, 100);
            });
        } else {
            setTimeout(init, 100);
        }
    }

    deferredInit();

})();
