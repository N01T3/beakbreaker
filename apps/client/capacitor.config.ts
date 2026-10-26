export interface CapacitorCliConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime: boolean;
  server: {
    androidScheme: 'https';
    iosScheme: 'capacitor';
  };
  android: {
    buildOptions: {
      releaseType: 'AAB' | 'APK';
    };
  };
  ios: {
    contentInset: 'automatic' | 'always';
  };
}

const capacitorConfig: CapacitorCliConfig = {
  appId: 'br.com.beakbreaker.sertao',
  appName: 'BeakBreaker: Os Campeões do Sertão',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
  android: {
    buildOptions: {
      releaseType: 'APK',
    },
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default capacitorConfig;
