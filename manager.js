const { exec } = require('child_process');
const readline = require('readline');
const os = require('os');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function showMenu() {
  console.clear();
  console.log('========================================');
  console.log('    局域网聊天室 - 服务器管理器');
  console.log('========================================');
  console.log('');
  console.log('  1. 启动服务器');
  console.log('  2. 停止服务器');
  console.log('  3. 重启服务器');
  console.log('  4. 查看服务器状态');
  console.log('  5. 查看本机 IP 地址');
  console.log('  6. 在浏览器中打开');
  console.log('  7. 部署（安装依赖）');
  console.log('  0. 退出');
  console.log('');
  console.log('========================================');
  console.log('');
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function checkServerStatus(callback) {
  exec('netstat -ano | findstr :3000 | findstr LISTENING', (error, stdout) => {
    if (stdout) {
      const match = stdout.match(/\s+(\d+)\s*$/);
      const pid = match ? match[1] : 'unknown';
      callback(true, pid);
    } else {
      callback(false, null);
    }
  });
}

function startServer() {
  console.log('\n正在启动服务器...\n');
  checkServerStatus((isRunning) => {
    if (isRunning) {
      console.log('⚠️  服务器已经在运行中！');
      promptContinue();
    } else {
      exec('start "局域网聊天服务器" cmd /k "node server/index.js"', { windowsHide: false });
      setTimeout(() => {
        const ip = getLocalIP();
        console.log('✅ 服务器已启动！');
        console.log(`\n本地访问: http://localhost:3000`);
        console.log(`局域网访问: http://${ip}:3000\n`);
        promptContinue();
      }, 1000);
    }
  });
}

function stopServer() {
  console.log('\n正在停止服务器...\n');
  checkServerStatus((isRunning, pid) => {
    if (isRunning) {
      exec(`taskkill /F /PID ${pid}`, (error) => {
        if (error) {
          console.log('❌ 停止失败:', error.message);
        } else {
          console.log('✅ 服务器已停止！');
        }
        promptContinue();
      });
    } else {
      console.log('⚠️  服务器未运行！');
      promptContinue();
    }
  });
}

function restartServer() {
  console.log('\n正在重启服务器...\n');
  checkServerStatus((isRunning, pid) => {
    if (isRunning) {
      exec(`taskkill /F /PID ${pid}`, () => {
        console.log('已停止旧服务器...');
        setTimeout(() => {
          exec('start "局域网聊天服务器" cmd /k "node server/index.js"', (error) => {
            if (error) {
              console.log('❌ 重启失败:', error.message);
            } else {
              const ip = getLocalIP();
              console.log('✅ 服务器已重启！');
              console.log(`\n本地访问: http://localhost:3000`);
              console.log(`局域网访问: http://${ip}:3000\n`);
            }
            promptContinue();
          });
        }, 1000);
      });
    } else {
      console.log('服务器未运行，直接启动...');
      startServer();
    }
  });
}

function showStatus() {
  console.log('\n正在检查服务器状态...\n');
  checkServerStatus((isRunning, pid) => {
    if (isRunning) {
      const ip = getLocalIP();
      console.log('✅ 服务器状态: 运行中');
      console.log(`📍 进程 ID: ${pid}`);
      console.log(`🌐 本地访问: http://localhost:3000`);
      console.log(`🌐 局域网访问: http://${ip}:3000`);
    } else {
      console.log('❌ 服务器状态: 未运行');
    }
    console.log('');
    promptContinue();
  });
}

function showIP() {
  const ip = getLocalIP();
  console.log('\n========================================');
  console.log('  本机 IP 地址信息');
  console.log('========================================');
  console.log(`\n  IPv4 地址: ${ip}`);
  console.log(`\n  局域网访问地址: http://${ip}:3000`);
  console.log('');
  console.log('其他设备可以使用此地址访问聊天室');
  console.log('========================================\n');
  promptContinue();
}

function openBrowser() {
  console.log('\n正在打开浏览器...\n');
  exec('start http://localhost:3000', (error) => {
    if (error) {
      console.log('❌ 打开失败:', error.message);
    } else {
      console.log('✅ 已在浏览器中打开！');
    }
    promptContinue();
  });
}

function deployApp() {
  console.log('\n正在安装依赖（npm install）...\n');
  exec('npm install', { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.log('❌ 安装失败:', error.message);
      if (stderr) console.log(stderr);
    } else {
      console.log('✅ 依赖安装完成！');
      if (stdout) console.log(stdout);
      console.log('\n可以选择"1. 启动服务器"开始使用。');
    }
    promptContinue();
  });
}

function promptContinue() {
  rl.question('按 Enter 继续...', () => {
    handleMenu();
  });
}

function handleMenu() {
  showMenu();
  rl.question('请选择操作 [0-6]: ', (answer) => {
    switch (answer.trim()) {
      case '1':
        startServer();
        break;
      case '2':
        stopServer();
        break;
      case '3':
        restartServer();
        break;
      case '4':
        showStatus();
        break;
      case '5':
        showIP();
        break;
      case '6':
        openBrowser();
        break;
      case '7':
        deployApp();
        break;
      case '0':
        console.log('\n再见！\n');
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('\n❌ 无效的选择，请重新输入！');
        setTimeout(handleMenu, 1500);
    }
  });
}

console.log('\n欢迎使用局域网聊天室管理器！\n');
handleMenu();
