/** @type {import('next').NextConfig} */ 
     const nextConfig = { 
       // 添加一个新的 'rewrites' 部分来代理 API 请求 
       async rewrites() { 
         return [ 
           { 
             // 匹配所有以 /api/ 开头的路径 
             source: '/api/:path*', 
             // 将它们代理到在 Docker 网络中名为 'backend' 的服务上 
             destination: 'http://backend:8000/api/:path*',  
           }, 
         ]; 
       }, 
     }; 
  
     module.exports = nextConfig;