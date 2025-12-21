// Telegram Cloud Storage Auto-Sync
// Автоматично синхронізує localStorage з Telegram Cloud

(function() {
  'use strict';

  const SYNC_KEYS = ['struktura_tasks', 'struktura_warehouses', 'struktura_catalog'];
  
  // Перевіряємо доступність Telegram Cloud Storage
  const isCloudAvailable = () => {
    return !!(window.Telegram?.WebApp?.CloudStorage);
  };

  // Синхронізація з Cloud
  const syncToCloud = async (key, value) => {
    if (!isCloudAvailable()) return;
    
    try {
      await new Promise((resolve, reject) => {
        window.Telegram.WebApp.CloudStorage.setItem(key, value, (error) => {
          if (error) reject(error);
          else {
            console.log(`☁️ Синхронізовано в Cloud: ${key}`);
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
    // Спочатку зберігаємо локально
    originalSetItem(key, value);
    
    // Потім синхронізуємо з Cloud якщо це наш ключ
    if (SYNC_KEYS.includes(key)) {
      syncToCloud(key, value);
    }
  };

  // При завантаженні сторінки - синхронізуємо з Cloud
  window.addEventListener('DOMContentLoaded', async () => {
    if (!isCloudAvailable()) {
      console.log('📱 Telegram Cloud Storage недоступний, використовую тільки localStorage');
      return;
    }

    console.log('☁️ Telegram Cloud Storage доступний, синхронізую дані...');

    for (const key of SYNC_KEYS) {
      try {
        const cloudValue = await loadFromCloud(key);
        const localValue = localStorage.getItem(key);

        if (cloudValue) {
          // Якщо в Cloud є дані
          if (localValue !== cloudValue) {
            console.log(`⬇️ Завантажую з Cloud: ${key}`);
            originalSetItem(key, cloudValue);
          }
        } else if (localValue) {
          // Якщо локально є дані, але в Cloud немає - завантажуємо в Cloud
          console.log(`⬆️ Завантажую в Cloud: ${key}`);
          await syncToCloud(key, localValue);
        }
      } catch (error) {
        console.error(`Помилка синхронізації ${key}:`, error);
      }
    }

    console.log('✅ Синхронізація завершена');
  });

  console.log('🔄 Telegram Cloud Storage Auto-Sync активований');
})();
