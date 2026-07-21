/**
 * Turbowarp 反向代理中间件
 * 作用：
 * 1. 将 /turbowarp/* 路径代理到 https://turbowarp.org/*
 * 2. 重写 embed.html 中的相对资源路径，确保 iframe 同源加载，避免 mixed content
 * 3. 这样 iframe 加载 http://localhost:5001/turbowarp/embed.html 时：
 *    - 同源 HTTP，不会被 mixed content 阻止
 *    - project_url 指向 http://localhost:5001/uploads/... 也同源
 *    - 解决 iframe 跨域 + mixed content 加载本地项目文件失败的问题
 */
import https from 'https';

const TURBOWARP_HOST = 'turbowarp.org';
const PROXY_PATH = '/turbowarp';

// 过滤的响应头（避免跨域/CORS/编码问题）
const PASSTHROUGH_HEADERS = [
  'content-type',
  'content-length',
  'cache-control',
  'etag',
  'last-modified',
  'accept-ranges',
  'content-range',
  'content-encoding'
];

function fetchUpstream(req, res, upstreamPath) {
  const options = {
    hostname: TURBOWARP_HOST,
    port: 443,
    path: upstreamPath,
    method: req.method,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': req.headers.accept || '*/*',
      'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity' // 避免压缩，方便重写 HTML
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    const status = proxyRes.statusCode || 502;
    res.status(status);

    // 透传响应头
    PASSTHROUGH_HEADERS.forEach((h) => {
      if (proxyRes.headers[h] !== undefined) {
        res.setHeader(h, proxyRes.headers[h]);
      }
    });

    // 移除跨域限制（让父页面可以接收 iframe 事件）
    res.setHeader('Access-Control-Allow-Origin', '*');

    const contentType = proxyRes.headers['content-type'] || '';

    // 对于 HTML 响应，重写相对路径
    if (contentType.includes('text/html')) {
      let body = '';
      proxyRes.setEncoding('utf8');
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });
      proxyRes.on('end', () => {
        const baseTag = `<base href="${PROXY_PATH}/">`;
        let rewritten = body;
        if (/<head[^>]*>/i.test(rewritten)) {
          rewritten = rewritten.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
        } else if (/<html[^>]*>/i.test(rewritten)) {
          rewritten = rewritten.replace(/<html([^>]*)>/i, `<html$1><head>${baseTag}</head>`);
        } else {
          rewritten = baseTag + rewritten;
        }
        rewritten = rewritten.replace(/(<script[^>]*src)=(["'])\/js\//g, `$1=$2js/`);
        rewritten = rewritten.replace(/(<script[^>]*src)=(["'])\/static\//g, `$1=$2static/`);
        rewritten = rewritten.replace(/(<link[^>]*href)=(["'])\/css\//g, `$1=$2css/`);
        rewritten = rewritten.replace(/(<link[^>]*href)=(["'])\/static\//g, `$1=$2static/`);
        res.send(rewritten);
      });
    } else if (contentType.includes('text/css')) {
      // CSS 文件中的 url(/static/...) 等相对路径也需要重写
      let body = '';
      proxyRes.setEncoding('utf8');
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });
      proxyRes.on('end', () => {
        const rewritten = body.replace(/url\(\s*(["']?)\/(?!\/)/g, `url($1${PROXY_PATH}/`);
        res.send(rewritten);
      });
    } else {
      // 非 HTML/CSS 资源直接管道传输
      proxyRes.pipe(res);
    }

    proxyRes.on('error', (err) => {
      console.error('[turbowarp-proxy] 上游响应错误:', err.message);
      if (!res.headersSent) {
        res.status(502).end('Upstream error');
      }
    });
  });

  proxyReq.on('error', (err) => {
    console.error('[turbowarp-proxy] 代理请求失败:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ status: 'error', message: '无法连接到 Turbowarp' });
    }
  });

  // 透传请求体（虽然 GET 一般没有 body）
  req.pipe(proxyReq);

  req.on('error', (err) => {
    console.error('[turbowarp-proxy] 客户端请求错误:', err.message);
    proxyReq.destroy();
  });
}

export function turbowarpProxy(req, res, next) {
  // 把 /turbowarp/xxx 转成 /xxx
  const upstreamPath = req.originalUrl.replace(/^\/turbowarp/, '') || '/';
  fetchUpstream(req, res, upstreamPath);
}
