import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white" dir="rtl">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold">مبادله</h1>
        <p className="text-xl opacity-90 mt-4">سیستم هوشمند فاکتور و مدیریت حساب</p>
        
        <div className="flex gap-4 justify-center mt-12">
          <Link href="/login" className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition">
            ورود به سیستم
          </Link>
          <Link href="/register" className="bg-black/20 border border-white/30 backdrop-blur px-8 py-3 rounded-full font-bold hover:bg-black/30 transition">
            ثبت‌نام
          </Link>
        </div>
      </div>
    </main>
  );
}
