// Telegram Cloud Storage - Auto-Sync
// Повністю заміняє localStorage з автосинхронізацією в Telegram Cloud

(function() {
  'use strict';

  const SYNC_KEYS = ['struktura_tasks', 'struktura_warehouses', 'struktura_catalog'];
  
  // Перевірка доступності
  const isCloudAvailable = () => !!(window.Telegram?.WebApp?.CloudStorage);

  // Синхронізація в Cloud
  const syncToCloud = async (key, value) => {
    if (!isCloudAvailable() || !SYNC_KEYS.includes(key)) return;
    
    try {
      await new Promise((resolve, reject) => {
        window.Telegram.WebApp.CloudStorage.setItem(key, value, (error) => {
          if (error) reject(error);
          else {
            console.log(`☁️ ${key} → Telegram Cloud`);
            resolve();
          }
        });
      });
    } catch (error) {
      console.error(`Помилка синхронізації ${key}:`, error);
    }
  };

  // Завантаження з Cloud
  const loadFromCloud = async (key) => {
    if (!isCloudAvailable()) return null;
    
    try {
      return await new Promise((resolve, reject) => {
        window.Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
          if (error) reject(error);
          else resolve(value);
        });
      });
    } catch (error) {
      console.error(`Помилка завантаження ${key}:`, error);
      return null;
    }
  };

  // Заміна localStorage.setItem
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
    originalSetItem(key, value);
    if (SYNC_KEYS.includes(key)) {
      syncToCloud(key, value);
    }
  };

  // При завантаженні - синхронізація
  window.addEventListener('DOMContentLoaded', async () => {
    if (!isCloudAvailable()) {
      console.log('📱 localStorage (без Cloud синхронізації)');
      return;
    }

    console.log('☁️ Telegram Cloud Storage - синхронізація...');

    for (const key of SYNC_KEYS) {
      try {
        const cloudValue = await loadFromCloud(key);
        const localValue = localStorage.getItem(key);

        if (cloudValue && cloudValue !== localValue) {
          console.log(`⬇️ ${key} з Cloud`);
          originalSetItem(key, cloudValue);
        } else if (localValue && !cloudValue) {
          console.log(`⬆️ ${key} в Cloud`);
          await syncToCloud(key, localValue);
        }
      } catch (error) {
        console.error(`Помилка ${key}:`, error);
      }
    }

    console.log('✅ Синхронізація завершена');
  });

  console.log('🔄 Telegram Cloud Storage Auto-Sync активний');
})();
