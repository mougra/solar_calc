/**
 * Деплой статического экспорта (папка out/) на shared-хостинг по SSH.
 *
 * Использование:
 *   $env:SSH_HOST="37.140.192.11"
 *   $env:SSH_USER="u3716746"
 *   $env:SSH_PASS="..."
 *   npm run deploy:static
 *
 * Переменная REMOTE_DIR по умолчанию — ~/www/solarcalc.ru.
 * Старый каталог сохраняется как solarcalc.ru.old (одна предыдущая версия).
 */

import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { Client } from "ssh2";

const host = process.env.SSH_HOST;
const username = process.env.SSH_USER;
const password = process.env.SSH_PASS;
const remoteDir =
  process.env.REMOTE_DIR ?? "/var/www/u3716746/data/www/solarcalc.ru";

if (!host || !username || !password) {
  console.error("Задайте SSH_HOST, SSH_USER и SSH_PASS.");
  process.exit(1);
}

const outDir = path.join(process.cwd(), "out");
if (!existsSync(path.join(outDir, "index.html"))) {
  console.error("Нет out/index.html. Сначала: npm run build:static");
  process.exit(1);
}

const tarPath = path.join(process.cwd(), ".deploy-static.tar.gz");
rmSync(tarPath, { force: true });
execFileSync("tar", ["-czf", tarPath, "-C", outDir, "."], { stdio: "inherit" });
console.log(`Архив собран: ${tarPath}`);

const remoteTar = `/tmp/solarcalc-${Date.now()}.tar.gz`;
const conn = new Client();

function exec(cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, { pty: false }, (error, stream) => {
      if (error) return reject(error);
      let out = "";
      let err = "";
      stream.on("data", (d) => (out += d));
      stream.stderr.on("data", (d) => (err += d));
      stream.on("close", (code) => {
        if (code === 0) resolve(out.trim());
        else reject(new Error(`${cmd}\n${out}\n${err}`));
      });
    });
  });
}

conn
  .on("ready", async () => {
    try {
      console.log("SSH подключён, загружаю архив…");
      await new Promise((resolve, reject) => {
        conn.sftp((error, sftp) => {
          if (error) return reject(error);
          sftp.fastPut(tarPath, remoteTar, (putError) => {
            if (putError) return reject(putError);
            resolve();
          });
        });
      });

      const script = [
        "set -e",
        `mkdir -p ${remoteDir}.tmp`,
        `rm -rf ${remoteDir}.tmp/* ${remoteDir}.tmp/.[!.]* 2>/dev/null || true`,
        `tar -xzf ${remoteTar} -C ${remoteDir}.tmp`,
        `rm -rf ${remoteDir}.old`,
        `mv ${remoteDir} ${remoteDir}.old`,
        `mv ${remoteDir}.tmp ${remoteDir}`,
        `rm -f ${remoteTar}`,
        `echo '--- files ---'`,
        `ls -la ${remoteDir} | head -12`,
        `echo '--- http check ---'`,
        `curl -s -o /dev/null -w '%{http_code}\\n' -H 'Host: solarcalc.ru' http://${host}/`,
      ].join("\n");

      const result = await exec(script);
      console.log(result);
      console.log("Готово.");
    } catch (error) {
      console.error("Ошибка деплоя:", error.message);
      process.exitCode = 1;
    } finally {
      conn.end();
      rmSync(tarPath, { force: true });
    }
  })
  .on("error", (error) => {
    console.error("SSH:", error.message);
    process.exitCode = 1;
  })
  .connect({ host, port: 22, username, password, readyTimeout: 25000 });
