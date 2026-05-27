(function() {
    'use strict';

    // === Конфигурация ===
    const CONFIG = {
        scaleOptions: [
            { value: 0.5, label: '50%' },
            { value: 0.75, label: '75%' },
            { value: 1, label: '100% (оригинал)' },
            { value: 1.25, label: '125%' },
            { value: 1.5, label: '150%' },
            { value: 2, label: '200%' }
        ],
        controlPanelId: 'image-control-panel',
        removeModeBtnId: 'toggle-remove-mode',
        removeModeActiveClass: 'remove-mode-active',
        imageResetClass: 'image-reset-enabled',
        removeOverlayClass: 'image-remove-overlay'
    };

    const imageRegistry = new Map();
    let removeModeEnabled = false;

    document.addEventListener('DOMContentLoaded', init);


    function init() {
        const images = document.querySelectorAll('img:not([data-control-ignore])');
        
        if (images.length === 0) {
            console.warn('[ImageManager] Изображения для управления не найдены');
            return;
        }

        registerImages(images);
        createControlPanel();
        attachImageEventListeners(images);
        console.log(`[ImageManager] Инициализировано: ${images.length} изображений`);
    }


    function registerImages(images) {
        images.forEach((img, index) => {
            if (imageRegistry.has(img)) return;

            const imgId = img.id || `img-auto-${index}-${Date.now()}`;
            if (!img.id) img.id = imgId;

            const register = () => {
                imageRegistry.set(img, {
                    originalWidth: img.naturalWidth || img.width,
                    originalHeight: img.naturalHeight || img.height,
                    originalSrc: img.src,
                    originalStyle: {
                        width: img.style.width,
                        height: img.style.height,
                        maxWidth: img.style.maxWidth,
                        maxHeight: img.style.maxHeight
                    }
                });
            };

            if (img.complete && img.naturalWidth !== 0) {
                register();
            } else {
                img.addEventListener('load', register, { once: true });

                img.addEventListener('error', () => {
                    console.warn(`[ImageManager] Не удалось загрузить: ${img.src}`);
                    register();
                }, { once: true });
            }
        });
    }

    function createControlPanel() {
        if (document.getElementById(CONFIG.controlPanelId)) return;

        const panel = document.createElement('section');
        panel.id = CONFIG.controlPanelId;
        panel.className = 'image-control-panel';
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-label', 'Управление изображениями');

        const title = document.createElement('h3');
        title.textContent = '🖼️ Управление изображениями';
        title.style.cssText = 'margin: 0 0 15px 0; color: #5c4033;';

        const controls = document.createElement('div');
        controls.className = 'image-controls';
        controls.style.cssText = 'display: flex; flex-wrap: wrap; gap: 10px; align-items: center;';

        const scaleLabel = document.createElement('label');
        scaleLabel.setAttribute('for', 'image-scale-select');
        scaleLabel.textContent = 'Масштаб:';
        scaleLabel.style.fontWeight = '500';

        const scaleSelect = document.createElement('select');
        scaleSelect.id = 'image-scale-select';
        scaleSelect.className = 'image-scale-select';
        scaleSelect.style.cssText = 'padding: 8px 12px; border-radius: 4px; border: 1px solid #d4a574; min-width: 150px;';

        CONFIG.scaleOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            scaleSelect.appendChild(opt);
        });

        const applyBtn = document.createElement('button');
        applyBtn.type = 'button';
        applyBtn.id = 'apply-scale-btn';
        applyBtn.className = 'btn apply-scale-btn';
        applyBtn.textContent = 'Применить ко всем';
        applyBtn.style.cssText = 'background-color: #5c4033; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;';
        applyBtn.addEventListener('click', handleApplyScale);

        const removeModeBtn = document.createElement('button');
        removeModeBtn.type = 'button';
        removeModeBtn.id = CONFIG.removeModeBtnId;
        removeModeBtn.className = 'btn toggle-remove-mode';
        removeModeBtn.textContent = '✕ Режим удаления';
        removeModeBtn.style.cssText = 'background-color: #cc4444; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;';
        removeModeBtn.addEventListener('click', toggleRemoveMode);

        const resetAllBtn = document.createElement('button');
        resetAllBtn.type = 'button';
        resetAllBtn.id = 'reset-all-btn';
        resetAllBtn.className = 'btn reset-all-btn';
        resetAllBtn.textContent = '↺ Сбросить все';
        resetAllBtn.style.cssText = 'background-color: #7a5540; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;';
        resetAllBtn.addEventListener('click', handleResetAll);

        scaleLabel.appendChild(scaleSelect);
        controls.appendChild(scaleLabel);
        controls.appendChild(applyBtn);
        controls.appendChild(removeModeBtn);
        controls.appendChild(resetAllBtn);

        panel.appendChild(title);
        panel.appendChild(controls);

        const main = document.querySelector('main');
        const target = main || document.body;
        target.insertBefore(panel, target.firstChild);

        injectPanelStyles();
    }

    function injectPanelStyles() {
        if (document.getElementById('image-manager-styles')) return;

        const style = document.createElement('style');
        style.id = 'image-manager-styles';
        style.textContent = `
            .image-control-panel {
                background: #faf8f5;
                border: 1px solid #d4a574;
                border-radius: 8px;
                padding: 15px;
                margin: 15px 0;
            }
            .image-controls {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                align-items: center;
            }
            .image-reset-enabled {
                cursor: pointer !important;
                transition: box-shadow 0.2s ease;
            }
            .image-reset-enabled:hover {
                box-shadow: 0 0 0 3px rgba(92, 64, 51, 0.3);
            }
            .image-remove-overlay {
                position: relative;
            }
            .image-remove-overlay::after {
                content: '✕';
                position: absolute;
                top: 5px;
                right: 5px;
                background: #cc4444;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                z-index: 10;
                transition: transform 0.1s ease;
            }
            .image-remove-overlay:hover::after {
                transform: scale(1.1);
            }
            .remove-mode-active .toggle-remove-mode {
                background-color: #993333 !important;
                box-shadow: 0 0 0 2px rgba(204, 68, 68, 0.5);
            }
            @media (max-width: 768px) {
                .image-controls {
                    flex-direction: column;
                    align-items: stretch;
                }
                .image-controls label,
                .image-controls select,
                .image-controls button {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function attachImageEventListeners(images) {
        images.forEach(img => {

            img.classList.add(CONFIG.imageResetClass);

            img.addEventListener('click', (e) => {
                if (removeModeEnabled) {
                    e.stopPropagation();
                    removeImage(img);
                    return;
                }
                resetImageToOriginal(img);
            });

            img.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (confirm('Удалить это изображение со страницы?')) {
                    removeImage(img);
                }
            });
        });
    }

    function handleApplyScale() {
        const select = document.getElementById('image-scale-select');
        const scale = parseFloat(select.value);

        if (isNaN(scale) || scale <= 0) {
            alert('Выберите корректный масштаб');
            return;
        }

        let appliedCount = 0;
        imageRegistry.forEach((data, img) => {
            if (img.offsetParent !== null) {
                applyScaleToImage(img, data, scale);
                appliedCount++;
            }
        });

        console.log(`[ImageManager] Масштаб ${scale * 100}% применён к ${appliedCount} изображениям`);

        showTemporaryNotification(`Масштаб ${scale * 100}% применён к ${appliedCount} изображениям`);
    }


    function applyScaleToImage(img, data, scale) {
        img.style.width = `${data.originalWidth * scale}px`;
        img.style.height = `${data.originalHeight * scale}px`;
        img.style.maxWidth = 'none';
        img.style.maxHeight = 'none';
        
        img.style.transition = 'width 0.3s ease, height 0.3s ease';
    }


    function resetImageToOriginal(img) {
        const data = imageRegistry.get(img);
        if (!data) return;

        img.style.width = data.originalStyle.width || '';
        img.style.height = data.originalStyle.height || '';
        img.style.maxWidth = data.originalStyle.maxWidth || '';
        img.style.maxHeight = data.originalStyle.maxHeight || '';
        img.style.transition = 'width 0.3s ease, height 0.3s ease';

        console.log(`[ImageManager] Сброшено: ${img.id || img.src}`);
        showTemporaryNotification('Размеры изображения сброшены');
    }

    function handleResetAll() {
        let resetCount = 0;
        imageRegistry.forEach((data, img) => {
            resetImageToOriginal(img);
            resetCount++;
        });
        console.log(`[ImageManager] Сброшено изображений: ${resetCount}`);
        showTemporaryNotification(`Все изображения сброшены (${resetCount})`);
    }

    function toggleRemoveMode() {
        removeModeEnabled = !removeModeEnabled;
        const btn = document.getElementById(CONFIG.removeModeBtnId);
        const panel = document.getElementById(CONFIG.controlPanelId);

        if (removeModeEnabled) {
            btn.textContent = '✓ Выход из режима удаления';
            btn.style.backgroundColor = '#5c4033';
            panel.classList.add(CONFIG.removeModeActiveClass);
            showTemporaryNotification('Режим удаления: кликните по изображению для удаления');
        } else {
            btn.textContent = '✕ Режим удаления';
            btn.style.backgroundColor = '#cc4444';
            panel.classList.remove(CONFIG.removeModeActiveClass);
        }
    }

    function removeImage(img) {
        const data = imageRegistry.get(img);
        const imgInfo = img.alt || img.id || img.src.split('/').pop();

        img.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        img.style.opacity = '0';
        img.style.transform = 'scale(0.8)';

        setTimeout(() => {
            if (img.parentNode) {
                img.parentNode.removeChild(img);
            }
            imageRegistry.delete(img);
            
            console.log(`[ImageManager] Удалено: ${imgInfo}`);
            showTemporaryNotification(`Изображение удалено: ${imgInfo}`);

            if (imageRegistry.size === 0) {
                const panel = document.getElementById(CONFIG.controlPanelId);
                if (panel) {
                    panel.style.opacity = '0.6';
                    panel.querySelector('h3').textContent = '🖼️ Изображений для управления нет';
                }
            }
        }, 300);
    }


    function showTemporaryNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'image-manager-notification';
        notification.setAttribute('role', 'status');
        notification.setAttribute('aria-live', 'polite');
        notification.textContent = message;

        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #5c4033;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;

        if (!document.getElementById('notification-anim')) {
            const animStyle = document.createElement('style');
            animStyle.id = 'notification-anim';
            animStyle.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(animStyle);
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    window.ImageManager = {
        getStats: function() {
            return {
                total: imageRegistry.size,
                removeMode: removeModeEnabled
            };
        },

        refresh: function() {
            const images = document.querySelectorAll('img:not([data-control-ignore])');
            registerImages(images);
        }
    };

})();
