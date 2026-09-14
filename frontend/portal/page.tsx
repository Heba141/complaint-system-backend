'use client';

import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function BauPortalPage() {
  const [currentView, setCurrentView] = useState('home-section');

  // Result states
  const [loginResult, setLoginResult] = useState<{ show: boolean; success: boolean; message: string } | null>(null);
  const [signupResult, setSignupResult] = useState<{ show: boolean; success: boolean; message: string } | null>(null);
  const [submitResult, setSubmitResult] = useState<{ show: boolean; success: boolean; message: string; refCode?: string } | null>(null);
  const [trackResult, setTrackResult] = useState<{ show: boolean; success: boolean; data?: any; message?: string } | null>(null);

  // Form inputs
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' });
  const [trackRef, setTrackRef] = useState('');

  // Handle Login Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token || data.accessToken);
        setLoginResult({ show: true, success: true, message: 'تم تسجيل الدخول بنجاح! تم حفظ رمز المصادقة بنجاح.' });
      } else {
        setLoginResult({ show: true, success: false, message: data.message || 'فشل تسجيل الدخول' });
      }
    } catch (error) {
      setLoginResult({ show: true, success: false, message: 'حدث خطأ في الاتصال بالخادم.' });
    }
  };

  // Handle Signup Submission
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm),
      });
      const data = await response.json();

      if (response.ok) {
        setSignupResult({ show: true, success: true, message: 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.' });
        setSignupForm({ name: '', email: '', password: '' });
      } else {
        setSignupResult({ show: true, success: false, message: data.message || 'فشل إنشاء الحساب' });
      }
    } catch (error) {
      setSignupResult({ show: true, success: false, message: 'حدث خطأ في الاتصال بالخادم.' });
    }
  };

  // Handle Complaint Submission
  const handleComplaintSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = localStorage.getItem('authToken') || '';

    try {
      const response = await fetch(`${API_BASE_URL}/complaints/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setSubmitResult({
          show: true,
          success: true,
          message: 'تم إرسال طلبك بنجاح!',
          refCode: data.refCode,
        });
        e.currentTarget.reset();
      } else {
        setSubmitResult({ show: true, success: false, message: data.message || 'فشل إرسال الطلب (تأكد من تسجيل الدخول أولاً)' });
      }
    } catch (error) {
      setSubmitResult({ show: true, success: false, message: 'حدث خطأ في الاتصال بالخادم.' });
    }
  };

  // Handle Tracking Lookup
  const handleTrackLookup = async () => {
    if (!trackRef.trim()) {
      alert('الرجاء إدخال رقم المرجع');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/complaints/track/${trackRef.trim()}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setTrackResult({ show: true, success: true, data: data.complaint });
      } else {
        setTrackResult({ show: true, success: false, message: 'لم يتم العثور على شكوى بهذا الرقم المرجعي.' });
      }
    } catch (error) {
      setTrackResult({ show: true, success: false, message: 'حدث خطأ أثناء الاتصال بالخادم.' });
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f4f6f8] text-[#333] font-sans antialiased">
      {/* Navbar Header */}
      <header className="bg-[#004d40] text-white flex justify-between items-center px-8 py-4 shadow-md">
        <div className="logo-container">
          <h1 className="text-xl font-bold">جامعة البلقاء التطبيقية</h1>
          <span className="text-xs opacity-80">نظام الشكاوى والمقترحات</span>
        </div>
        <nav className="flex gap-2">
          {[
            { id: 'home-section', label: 'الرئيسية' },
            { id: 'login-section', label: 'تسجيل الدخول' },
            { id: 'signup-section', label: 'إنشاء حساب' },
            { id: 'submit-section', label: 'تقديم طلب' },
            { id: 'track-section', label: 'تتبع الطلب' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={`px-4 py-2 rounded-lg text-base transition-colors cursor-pointer border-none ${
                currentView === tab.id ? 'bg-[#00796b] text-white' : 'bg-transparent text-white hover:bg-[#00796b]/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Container */}
      <main className="max-w-[1000px] mx-auto my-8 bg-white p-8 rounded-lg shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
        {/* Home Section */}
        <section className={`content-section ${currentView === 'home-section' ? 'block' : 'hidden'}`}>
          <h2 className="text-2xl font-bold mb-3 text-[#004d40]">مرحباً بك في بوابة الشكاوى والمقترحات</h2>
          <p className="text-base leading-relaxed text-gray-600 mb-6">
            منصة رقمية متقدمة تمكن الطلبة وأعضاء الهيئتين الأكاديمية والإدارية من تقديم الشكاوى والمقترحات ومتابعة قرارات اللجان بشفافية مطلقة.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-[#f9f9f9] p-6 rounded-lg border-r-4 border-[#004d40]">
              <h3 className="text-lg font-bold mb-2 text-[#004d40]">سرعة المعالجة</h3>
              <p className="text-sm text-gray-600">متابعة فورية عبر العمادة المعنية.</p>
            </div>
            <div className="bg-[#f9f9f9] p-6 rounded-lg border-r-4 border-[#004d40]">
              <h3 className="text-lg font-bold mb-2 text-[#004d40]">تتبع المسار الفوري</h3>
              <p className="text-sm text-gray-600">معرفة حالة الطلب خطوة بخطوة عبر رقم المرجع.</p>
            </div>
          </div>
        </section>

        {/* Login Section */}
        <section className={`content-section ${currentView === 'login-section' ? 'block' : 'hidden'}`}>
          <h2 className="text-2xl font-bold mb-4 text-[#004d40]">تسجيل الدخول إلى النظام</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block mb-2 font-bold text-sm">البريد الإلكتروني</label>
              <input
                type="email"
                required
                placeholder="name@bau.edu.jo"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-[#004d40]"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-bold text-sm">كلمة المرور</label>
              <input
                type="password"
                required
                placeholder="********"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-[#004d40]"
              />
            </div>
            <button type="submit" className="bg-[#004d40] hover:bg-[#00796b] text-white px-6 py-3 rounded-lg font-medium cursor-pointer transition-colors border-none">
              دخول
            </button>
          </form>
          {loginResult?.show && (
            <div className={`mt-6 p-4 rounded-lg ${loginResult.success ? 'bg-[#e0f2f1] text-[#004d40]' : 'bg-[#ffebee] text-red-700'}`}>
              <div dangerouslySetInnerHTML={{ __html: loginResult.message }} />
            </div>
          )}
        </section>

        {/* Signup Section */}
        <section className={`content-section ${currentView === 'signup-section' ? 'block' : 'hidden'}`}>
          <h2 className="text-2xl font-bold mb-4 text-[#004d40]">إنشاء حساب جديد</h2>
          <form onSubmit={handleSignup}>
            <div className="mb-4">
              <label className="block mb-2 font-bold text-sm">الاسم الكامل</label>
              <input
                type="text"
                required
                placeholder="أدخل اسمك الكامل"
                value={signupForm.name}
                onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-[#004d40]"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-bold text-sm">البريد الإلكتروني</label>
              <input
                type="email"
                required
                placeholder="name@bau.edu.jo"
                value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-[#004d40]"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-bold text-sm">كلمة المرور</label>
              <input
                type="password"
                required
                placeholder="********"
                value={signupForm.password}
                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-[#004d40]"
              />
            </div>
            <button type="submit" className="bg-[#004d40] hover:bg-[#00796b] text-white px-6 py-3 rounded-lg font-medium cursor-pointer transition-colors border-none">
              تسجيل حساب
            </button>
          </form>
          {signupResult?.show && (
            <div className={`mt-6 p-4 rounded-lg ${signupResult.success ? 'bg-[#e0f2f1] text-[#004d40]' : 'bg-[#ffebee] text-red-700'}`}>
              {signupResult.message}
            </div>
          )}
        </section>

        {/* Submit Complaint Section */}
        <section className={`content-section ${currentView === 'submit-section' ? 'block' : 'hidden'}`}>
          <h2 className="text-2xl font-bold mb-4 text-[#004d40]">إنشاء طلب جديد</h2>
          <form onSubmit={handleComplaintSubmit}>
            <div className="mb-4">
              <label className="block mb-2 font-bold text-sm">نوع الطلب</label>
              <select name="type" required className="w-full p-3 border border-gray-300 rounded-lg text-base bg-white focus:outline-none focus:border-[#004d40]">
                <option value="ACADEMIC_COMPLAINT">شكوى أكاديمية</option>
                <option value="SERVICE_COMPLAINT">شكوى خدمية</option>
                <option value="SUGGESTION">مقترح تطويري</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-bold text-sm">القسم / الكلية</label>
              <select name="department" required className="w-full p-3 border border-gray-300 rounded-lg text-base bg-white focus:outline-none focus:border-[#004d40]">
                <option value="ACADEMIC_SECTION">كلية الهندسة التكنولوجية</option>
                <option value="BUSINESS_SECTION">كلية الأعمال والتخطيط المالي</option>
                <option value="IT_SECTION">كلية الأمير عبد الله بن غازي للاتصالات</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-bold text-sm">تفاصيل الطلب</label>
              <textarea
                name="description"
                rows={5}
                required
                placeholder="اكتب تفاصيل الشكوى أو المقترح هنا..."
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-[#004d40]"
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-bold text-sm">مرفق (اختياري - PDF أو صورة)</label>
              <input type="file" name="attachment" className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white" />
            </div>

            <button type="submit" className="bg-[#004d40] hover:bg-[#00796b] text-white px-6 py-3 rounded-lg font-medium cursor-pointer transition-colors border-none">
              إرسال واعتماد الطلب
            </button>
          </form>
          {submitResult?.show && (
            <div className={`mt-6 p-4 rounded-lg ${submitResult.success ? 'bg-[#e0f2f1] text-[#004d40]' : 'bg-[#ffebee] text-red-700'}`}>
              {submitResult.success ? (
                <>
                  <strong>تم إرسال طلبك بنجاح!</strong>
                  <br />
                  رقم المرجع الخاص بك: <code className="bg-white px-2 py-0.5 rounded border border-gray-300 font-mono">{submitResult.refCode}</code>
                </>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: submitResult.message }} />
              )}
            </div>
          )}
        </section>

        {/* Track Section */}
        <section className={`content-section ${currentView === 'track-section' ? 'block' : 'hidden'}`}>
          <h2 className="text-2xl font-bold mb-4 text-[#004d40]">تتبع حالة الطلب الفوري</h2>
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="أدخل رقم المرجع (مثال: DEMO-8550)"
              value={trackRef}
              onChange={(e) => setTrackRef(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-[#004d40]"
            />
            <button
              onClick={handleTrackLookup}
              className="bg-[#004d40] hover:bg-[#00796b] text-white px-6 py-3 rounded-lg font-medium cursor-pointer transition-colors border-none"
            >
              بحث واستعلام
            </button>
          </div>
          {trackResult?.show && (
            <div className={`mt-6 p-4 rounded-lg ${trackResult.success ? 'bg-[#e0f2f1] text-[#004d40]' : 'bg-[#ffebee] text-red-700'}`}>
              {trackResult.success && trackResult.data ? (
                <>
                  <strong>حالة الطلب:</strong> {trackResult.data.status}
                  <br />
                  <strong>النوع:</strong> {trackResult.data.type}
                  <br />
                  <strong>القسم:</strong> {trackResult.data.department}
                  <br />
                  <strong>التفاصيل:</strong> {trackResult.data.description}
                </>
              ) : (
                trackResult.message
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}