import { useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <footer className="bg-gray-950/80 border-t border-gray-800 py-4 mt-12 relative z-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          {/* 备案信息 - 只在首页显示 */}
          {isHome && (
            <>
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 text-gray-400 hover:text-cyan-400 transition-colors text-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/60" />
                <span>沪ICP备2026032666号-1</span>
              </a>

              <span className="hidden sm:block text-gray-600">|</span>

              <a
                href="https://beian.mps.gov.cn/#/query/webSearch?code=31011802006123"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 text-gray-400 hover:text-cyan-400 transition-colors text-sm"
              >
                <img
                  src="/images/gongan-beian.png"
                  alt="公安备案"
                  className="w-4 h-4"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <span>沪公网安备31011802006123号</span>
              </a>

              <span className="hidden sm:block text-gray-600">|</span>
            </>
          )}

          {/* 版权信息 - 所有页面都显示 */}
          <span className="text-gray-500 text-sm">
            © {new Date().getFullYear()} kidsshowcode.cn
          </span>
        </div>
      </div>
    </footer>
  );
}