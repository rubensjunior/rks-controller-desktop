import type { CapacitorElectronConfig } from '@capacitor-community/electron';
import {
  CapElectronEventEmitter,
  CapacitorSplashScreen,
  setupCapacitorElectronPlugins,
} from '@capacitor-community/electron';
import chokidar from 'chokidar';
import type { MenuItemConstructorOptions } from 'electron';
import { app, BrowserWindow, Menu, MenuItem, nativeImage, Tray, session } from 'electron';
import electronIsDev from 'electron-is-dev';
import electronServe from 'electron-serve';
import windowStateKeeper from 'electron-window-state';
import { join } from 'path';

// Define components for a watcher to detect when the webapp is changed so we can reload in Dev mode.
const reloadWatcher = {
  debouncer: null,
  ready: false,
  watcher: null,
};

export function setupReloadWatcher(electronCapacitorApp: ElectronCapacitorApp): void {
  reloadWatcher.watcher = chokidar
    .watch(join(app.getAppPath(), 'app'), {
      ignored: /[/\\]\./,
      persistent: true,
    })
    .on('ready', () => {
      reloadWatcher.ready = true;
    })
    .on('all', (_event, _path) => {
      if (reloadWatcher.ready) {
        clearTimeout(reloadWatcher.debouncer);
        reloadWatcher.debouncer = setTimeout(async () => {
          electronCapacitorApp.getMainWindow().webContents.reload();
          reloadWatcher.ready = false;
          clearTimeout(reloadWatcher.debouncer);
          reloadWatcher.debouncer = null;
          reloadWatcher.watcher = null;
          setupReloadWatcher(electronCapacitorApp);
        }, 1500);
      }
    });
}

// Define our class to manage our app.
export class ElectronCapacitorApp {
  private MainWindow: BrowserWindow | null = null;
  private SplashScreen: CapacitorSplashScreen | null = null;
  private TrayIcon: Tray | null = null;
  private CapacitorFileConfig: CapacitorElectronConfig;
  private TrayMenuTemplate: (MenuItem | MenuItemConstructorOptions)[] = [
    new MenuItem({ label: 'Quit App', role: 'quit' }),
  ];
  private AppMenuBarMenuTemplate: (MenuItem | MenuItemConstructorOptions)[] = [];
  private mainWindowState;
  private loadWebApp;
  private customScheme: string;

  constructor(
    capacitorFileConfig: CapacitorElectronConfig,
    trayMenuTemplate?: (MenuItemConstructorOptions | MenuItem)[],
    appMenuBarMenuTemplate?: (MenuItemConstructorOptions | MenuItem)[]
  ) {
    this.CapacitorFileConfig = capacitorFileConfig;

    this.customScheme =
      this.CapacitorFileConfig.electron?.customUrlScheme ?? 'capacitor-electron';

    if (trayMenuTemplate) {
      this.TrayMenuTemplate = trayMenuTemplate;
    }

    if (appMenuBarMenuTemplate) {
      this.AppMenuBarMenuTemplate = appMenuBarMenuTemplate;
    }

    // Setup our web app loader
    this.loadWebApp = electronServe({
      directory: join(app.getAppPath(), 'app'),
      scheme: this.customScheme,
    });
  }

  private async loadMainWindow(thisRef: any) {
    await thisRef.loadWebApp(thisRef.MainWindow);
  }

  getMainWindow(): BrowserWindow {
    return this.MainWindow;
  }

  getCustomURLScheme(): string {
    return this.customScheme;
  }

  async init(): Promise<void> {
    const icon = nativeImage.createFromPath(
      join(
        app.getAppPath(),
        'assets',
        process.platform === 'win32' ? 'appIcon.ico' : 'appIcon.png'
      )
    );

    this.mainWindowState = windowStateKeeper({
      defaultWidth: 1000,
      defaultHeight: 800,
    });

    const preloadPath = join(app.getAppPath(), 'build', 'src', 'preload.js');

    const titleBarConfig =
      process.platform === 'darwin'
        ? { titleBarStyle: 'hiddenInset' as const }
        : {
          titleBarStyle: 'hidden' as const,
          titleBarOverlay: {
            color: '#000000',
            symbolColor: '#ffffff',
            height: 30,
          },
        };

    this.MainWindow = new BrowserWindow({
      icon,
      ...titleBarConfig,
      show: false,
      x: this.mainWindowState.x,
      y: this.mainWindowState.y,
      width: this.mainWindowState.width,
      height: this.mainWindowState.height,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: preloadPath,
      },
    });

    this.mainWindowState.manage(this.MainWindow);

    if (this.CapacitorFileConfig.backgroundColor) {
      this.MainWindow.setBackgroundColor(
        this.CapacitorFileConfig.electron.backgroundColor
      );
    }

    this.MainWindow.on('closed', () => {
      if (
        this.SplashScreen?.getSplashWindow() &&
        !this.SplashScreen.getSplashWindow().isDestroyed()
      ) {
        this.SplashScreen.getSplashWindow().close();
      }
    });

    if (this.CapacitorFileConfig.electron?.trayIconAndMenuEnabled) {
      this.TrayIcon = new Tray(icon);
      this.TrayIcon.on('double-click', () => {
        if (!this.MainWindow) return;
        this.MainWindow.isVisible()
          ? this.MainWindow.hide()
          : this.MainWindow.show();
      });
      this.TrayIcon.on('click', () => {
        if (!this.MainWindow) return;
        this.MainWindow.isVisible()
          ? this.MainWindow.hide()
          : this.MainWindow.show();
      });
      this.TrayIcon.setToolTip(app.getName());
      this.TrayIcon.setContextMenu(
        Menu.buildFromTemplate(this.TrayMenuTemplate)
      );
    }

    Menu.setApplicationMenu(null);

    if (this.CapacitorFileConfig.electron?.splashScreenEnabled) {
      this.SplashScreen = new CapacitorSplashScreen({
        imageFilePath: join(
          app.getAppPath(),
          'assets',
          this.CapacitorFileConfig.electron?.splashScreenImageName ??
          'splash.png'
        ),
        windowWidth: 400,
        windowHeight: 400,
      });
      this.SplashScreen.init(this.loadMainWindow, this);
    } else {
      this.loadMainWindow(this);
    }

    this.setupTitleBar();

    this.MainWindow.webContents.setWindowOpenHandler((details) => {
      return details.url.includes(this.customScheme)
        ? { action: 'allow' }
        : { action: 'deny' };
    });

    this.MainWindow.webContents.on('will-navigate', (event) => {
      if (!this.MainWindow.webContents.getURL().includes(this.customScheme)) {
        event.preventDefault();
      }
    });

    setupCapacitorElectronPlugins();

    this.MainWindow.webContents.on('dom-ready', () => {
      if (this.CapacitorFileConfig.electron?.splashScreenEnabled) {
        this.SplashScreen.getSplashWindow().hide();
      }
      if (!this.CapacitorFileConfig.electron?.hideMainWindowOnLaunch) {
        this.MainWindow.show();
      }
      setTimeout(() => {
        if (electronIsDev) {
          this.MainWindow.webContents.openDevTools();
        }
        CapElectronEventEmitter.emit(
          'CAPELECTRON_DeeplinkListenerInitialized',
          ''
        );
      }, 400);
    });
  }

  // 🔥 TITLE BAR PRETA COM TEXTO BRANCO (WINDOWS)
  private setupTitleBar(): void {
    const HEIGHT = 30;
    const TITLE = app.getName();

    const applyStyles = () => {
      this.MainWindow.webContents.insertCSS(`
      /* Evita scroll fantasma no wrapper */
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
      }

      /* Compensa a barra (empurra o app para baixo) */
      body {
        box-sizing: border-box !important;
        padding-top: ${HEIGHT}px !important;
      }

      /* Barra preta (região arrastável) */
      body::before {
        content: '' !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: ${HEIGHT}px !important;
        background: #000000 !important;
        z-index: 999999 !important;
        -webkit-app-region: drag !important;
        box-sizing: border-box !important;
      }

      /* Título branco */
      body::after {
        content: '${TITLE}' !important;
        position: fixed !important;
        top: 0 !important;
        left: 12px !important;
        right: 140px !important;
        height: ${HEIGHT}px !important;
        display: flex !important;
        align-items: center !important;
        color: #ffffff !important;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 12.5px !important;
        font-weight: 500 !important;
        z-index: 1000000 !important;
        pointer-events: none !important;
      }
    `);
    };

    applyStyles();

    this.MainWindow.webContents.on('did-navigate', () => {
      setTimeout(applyStyles, 50);
    });

    this.MainWindow.webContents.on('did-finish-load', () => {
      setTimeout(applyStyles, 50);
    });
  }
}

// Set a CSP up for our application based on the custom scheme
export function setupContentSecurityPolicy(customScheme: string): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          electronIsDev
            ? `default-src ${customScheme}://* 'unsafe-inline' devtools://* 'unsafe-eval' data:`
            : `default-src ${customScheme}://* 'unsafe-inline' data:`,
        ],
      },
    });
  });
}
