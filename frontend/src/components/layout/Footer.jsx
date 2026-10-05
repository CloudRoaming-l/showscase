export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          <span className="text-gray-400 text-sm">
            © {new Date().getFullYear()} 造物课堂
          </span>
        </div>
      </div>
    </footer>
  );
}
