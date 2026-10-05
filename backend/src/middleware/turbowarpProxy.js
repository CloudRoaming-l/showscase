/**
 * Turbowarp 反向代理中间件
 * 作用：
 * 1. 将 /turbowarp/* 路径代理到 https://turbowarp.org/*
 * 2. 重写 embed.html 中的相对资源路径，确保 iframe 同源加载，避免 mixed content
 * 3. 给静态资源加浏览器端强缓存，减少重复下载，解决预览卡顿
 * 4. 静态资源保留上游 gzip/br 压缩，节省带宽加快加载
 */
import https from 'https';

const TURBOWARP_HOST = 'turbowarp.org';
const PROXY_PATH = '/turbowarp';

// 过滤的响应头（不保留 upstream 的敏感头/安全头）
const PASSTHROUGH_HEADERS = [
  'content-type',
  'content-length',
  'etag',
  'last-modified',
  'accept-ranges',
  'content-range',
  'content-encoding'
];

// 根据 upstreamPath 获取对应的缓存策略
function getCacheControl(upstreamPath) {
  const clean = upstreamPath.split('?')[0];

  // 页面入口：不做强缓存，只做协商缓存（避免 URL 参数变化不生效）
  if (/\/(embed|editor)\.html$/i.test(clean) || clean === '/' || clean === '') {
    return 'no-cache';
  }

  // Turbowarp 版本化静态资源（带 hash 文件名），可永久缓存
  if (
    clean.startsWith('/static/') ||
    clean.startsWith('/js/') ||
    clean.startsWith('/css/')
  ) {
    return 'public, max-age=604800, immutable';
  }

  // 其他资源（字体、图片等）：5 分钟短缓存做缓冲
  return 'public, max-age=300';
}

// 判断该请求是否需要重写响应体（HTML/CSS 需要解压缩）
function needsRewrite(upstreamPath) {
  const clean = upstreamPath.split('?')[0];
  return (
    /\.html$/i.test(clean) ||
    /\.css$/i.test(clean) ||
    /\/editor(\/?)$/i.test(clean) ||
    clean === '/' ||
    clean === ''
  );
}

function fetchUpstream(req, res, upstreamPath) {
  const needRewrite = needsRewrite(upstreamPath);

  const options = {
    hostname: TURBOWARP_HOST,
    port: 443,
    path: upstreamPath,
    method: req.method,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': req.headers.accept || '*/*',
      'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9'
    }
  };

  // 只有需要重写 HTML/CSS 响应体时才强制 identity，其他资源保留上游压缩
  if (needRewrite) {
    options.headers['Accept-Encoding'] = 'identity';
  } else if (req.headers['accept-encoding']) {
    options.headers['Accept-Encoding'] = req.headers['accept-encoding'];
  }

  const cacheControl = getCacheControl(upstreamPath);

  const proxyReq = https.request(options, (proxyRes) => {
    const status = proxyRes.statusCode || 502;
    res.status(status);

    // 透传白名单响应头
    PASSTHROUGH_HEADERS.forEach((h) => {
      if (proxyRes.headers[h] !== undefined) {
        res.setHeader(h, proxyRes.headers[h]);
      }
    });

    // 覆盖缓存策略（基于路径）
    res.setHeader('Cache-Control', cacheControl);

    // 移除跨域限制（让父页面可以接收 iframe 事件）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    const contentType = proxyRes.headers['content-type'] || '';

    // 对于 HTML 响应，重写相对路径（加 <base> 保证相对资源正确加载）
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
      // 非 HTML/CSS 资源直接管道传输（可以是压缩的）
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
