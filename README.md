# TMDB 代理服务器

这是一个基于 Node.js 和 Express 构建的高性能 TMDB (The Movie Database) 代理服务器。它旨在解决访问 TMDB API 和图片资源时可能遇到的网络问题，为您的家庭影院系统（如 Jellyfin, Emby, Plex）或任何需要调用 TMDB 数据的应用提供稳定、快速的访问通道。

本项目支持集群模式，能够充分利用服务器的多核 CPU 资源，确保代理服务的高可用性和高并发处理能力。

## ✨ 主要功能

- **API 代理**：将所有发往 `/3` 路径的请求代理到 `https://api.themoviedb.org`。
- **图片代理**：将所有发往 `/t/p/` 路径的请求代理到 `https://image.tmdb.org`，解决了 TMDB 图片资源的访问问题。
- **高性能**：采用 Node.js 集群模式，为每个 CPU核心 创建一个工作进程，最大化利用服务器性能。
- **易于部署**：通过 Docker 和 Docker Compose，可以一键部署和运行本项目。

## 🚀 快速开始

### 前提条件

在开始之前，请确保您的服务器上已经安装了以下软件：

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 部署步骤

1.  **克隆或下载项目**

    将本仓库的所有文件（`server.js`, `package.json`, `Dockerfile`, `docker-compose.yml`）上传到您的服务器上的任意目录，例如 `/home/tmdb-proxy`。

    ```bash
    # 假设您已将文件上传至 /home/tmdb-proxy
    cd /home/tmdb-proxy
    ```

2.  **构建并启动容器**

    在项目根目录下，执行以下命令来构建 Docker 镜像并以后台模式启动服务：

    ```bash
    docker-compose up --build -d
    ```

    服务启动后，代理服务器将在您服务器的 `3333` 端口上运行。

## ⚙️ 配置

### 端口映射

默认情况下，代理服务会映射到服务器的 `3333` 端口。如果您需要修改为其他端口（例如 `8080`），可以编辑 `docker-compose.yml` 文件：

```yaml:docker-compose.yml
services:
  proxy-server:
    build: .
    ports:
      - "8080:3000" # 将这里的 "3333" 修改为您想要的端口
    restart: always
```
修改完毕后，重新执行 docker-compose up --build -d 即可生效。

### 在 Jellyfin / Emby 中使用
在您的媒体服务器设置中，找到与 TMDB 相关的地址配置，将其替换为您的代理服务器地址：

- API 地址 : http://<你的服务器IP>:3333
- 图片地址 : http://<你的服务器IP>:3333
保存设置后，您的媒体服务器就会通过此代理来刮削元数据和图片了。

## 📝 致谢
本项目的搭建思路和代码实现得到了以下项目和工具的启发和帮助，特此感谢：

- sebastian0619/tmdbproxyserver
- Google Gemini
