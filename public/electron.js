const {app, BrowserWindow, screen} = require('electron')
const os = require('os');
const path = require('path')
const isDev = require('electron-is-dev');

let mainWindow

function createWindow () {
  let size = screen.getPrimaryDisplay().workAreaSize;
  let width, height;
  if(os.type() === "Darwin") {
    width = parseInt(size.width * 0.5);
    height = parseInt(size.height * 0.67);
  } else {
    width = parseInt(size.width * 0.5);
    height = parseInt(size.height * 0.7);
  }

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    // minWidth: width,
    // minHeight: height,
    // maxWidth: width,
    // maxHeight: height,
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

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.commandLine.appendSwitch('ignore-certificate-errors');

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})
