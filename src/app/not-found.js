export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl mb-4">404</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">صفحه پیدا نشد</h2>
        <p className="text-gray-600 mb-6">صفحه مورد نظر شما وجود ندارد</p>
        <a
          href="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          بازگشت به صفحه اصلی
        </a>
      </div>
    </div>
  )
} 
