import type { CapacitorConfig } from '@capacitor/cli';

// NOT: appId Play Store'a ilk yüklemeden sonra DEĞİŞTİRİLEMEZ. Yayından önce kesinleştir.
const config: CapacitorConfig = {
  appId: 'com.deveciibrahim.dunyasavunmasi',
  appName: 'Dünya Savunması',
  webDir: 'dist',
  android: {
    backgroundColor: '#03030a'
  }
};

export default config;
