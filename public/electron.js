const {app, BrowserWindow, screen, ipcMain, globalShortcut} = require('electron')
const os = require('os');
const path = require('path')
const isDev = require('electron-is-dev');
const DayJs = require('dayjs')
const { default: axios } = require('axios');

const url = "http://106.52.127.85:7001";

let mainWindow
let currentUserId

function createWindow () {
  let size = screen.getPrimaryDisplay().workAreaSize;
  let width, height;
  width = parseInt(size.width * 0.5);
  height = parseInt(size.height * 0.6);

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    minWidth: 380,
    minHeight: 630,
    maxWidth: size.width,
    maxHeight: size.height,
    backgroundColor: '#212121',
    title: "Chaat",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png')
  })

  app.setName("Chaat")
  if (os.type() === "Darwin") {
    app.dock.setIcon(path.join(__dirname, 'assets/icon.png'));
  }

  mainWindow.setMenu(null);

  mainWindow.loadURL(
  isDev
  ? 'http://localhost:8080'
  : `file://${path.join(__dirname, "../dist/index.html")}`
  );

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.commandLine.appendSwitch('ignore-certificate-errors');

ipcMain.on('currentUserId', (event, data) => {
  console.log('from renderer:', data);
  currentUserId = data;
})

app.on('ready', createWindow)

app.on('browser-window-focus', () => {
  if (!isDev) {
    globalShortcut.register("Control+Shift+I", () => {
      console.log("Control+Shift+I is pressed: Shortcut Disabled");
    });
    globalShortcut.register("F12", () => {
      console.log("F12 is pressed: Shortcut Disabled");
    });
  }
  globalShortcut.register("CommandOrControl+R", () => {
      console.log("CommandOrControl+R is pressed: Shortcut Disabled");
  });
  globalShortcut.register("F5", () => {
      console.log("F5 is pressed: Shortcut Disabled");
  });
});

app.on('browser-window-blur', () => {
  if (!isDev) {
    globalShortcut.unregister("Control+Shift+I");
    globalShortcut.unregister("F12");
  }
  globalShortcut.unregister("CommandOrControl+R");
  globalShortcut.unregister("F5");
});

app.on('window-all-closed', () => {
  axios.put(url + "/api/users/" + currentUserId, {
    operate: "update_status",
    data: {
      status: "offline",
      last_changed: DayJs().format("YYYY-MM-DD HH:mm:ss")
    },
  }).then(res => {
    console.log(res.data)
  });
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', (event) => {
  axios.put(url + "/api/users/" + currentUserId, {
    operate: "update_status",
    data: {
      status: "offline",
      last_changed: DayJs().format("YYYY-MM-DD HH:mm:ss")
    },
  }).then(res => {
    console.log(res.data)
  });
});

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})
