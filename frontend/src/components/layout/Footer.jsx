export default function Footer() {
  return (
    <footer className="bg-gray-900/50 border-t border-gray-800 py-8 mt-12">
      <div className="container mx-auto px-4 text-center">
        <p className="text-gray-400">
          © {new Date().getFullYear()} 学生作品展示墙 · 少儿编程教育平台
        </p>
        <p className="text-gray-500 text-sm mt-2">
          让每个孩子的创意被世界看见
        </p>
      </div>
    </footer>
  );
}
