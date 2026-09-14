const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
    // Tab switching logic
    const navButtons = document.querySelectorAll("nav button");
    const sections = document.querySelectorAll(".content-section");

    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            navButtons.forEach(btn => btn.classList.remove("active"));
            sections.forEach(sec => sec.classList.remove("active"));

            button.classList.add("active");
            const target = document.getElementById(button.dataset.target);
            if (target) target.classList.add("active");
        });
    });

    // Handle User Login
    const loginForm = document.getElementById("loginForm");
    const loginResult = document.getElementById("loginResult");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                loginResult.style.display = "block";

                if (response.ok) {
                    // Save JWT token locally
                    localStorage.setItem("authToken", data.token || data.accessToken);
                    loginResult.style.background = "#e0f2f1";
                    loginResult.innerHTML = `<strong>تم تسجيل الدخول بنجاح!</strong> تم حفظ رمز المصادقة بنجاح.`;
                } else {
                    loginResult.style.background = "#ffebee";
                    loginResult.innerHTML = `<strong>خطأ:</strong> ${data.message || "فشل تسجيل الدخول"}`;
                }
            } catch (error) {
                console.error("Login error:", error);
                loginResult.style.display = "block";
                loginResult.style.background = "#ffebee";
                loginResult.innerHTML = "حدث خطأ في الاتصال بالخادم.";
            }
        });
    }

    // Handle User Signup
    const signupForm = document.getElementById("signupForm");
    const signupResult = document.getElementById("signupResult");

    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("signupName").value;
            const email = document.getElementById("signupEmail").value;
            const password = document.getElementById("signupPassword").value;

            try {
                const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();
                signupResult.style.display = "block";

                if (response.ok) {
                    signupResult.style.background = "#e0f2f1";
                    signupResult.innerHTML = `<strong>تم إنشاء الحساب بنجاح!</strong> يمكنك الآن تسجيل الدخول.`;
                    signupForm.reset();
                } else {
                    signupResult.style.background = "#ffebee";
                    signupResult.innerHTML = `<strong>خطأ:</strong> ${data.message || "فشل إنشاء الحساب"}`;
                }
            } catch (error) {
                console.error("Signup error:", error);
                signupResult.style.display = "block";
                signupResult.style.background = "#ffebee";
                signupResult.innerHTML = "حدث خطأ في الاتصال بالخادم.";
            }
        });
    }

    // Handle Complaint Form Submission (Authenticated)
    const complaintForm = document.getElementById("complaintForm");
    const submitResult = document.getElementById("submitResult");

    if (complaintForm) {
        complaintForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(complaintForm);
            
            // Retrieve saved token from login
            const token = localStorage.getItem("authToken") || "";

            try {
                const response = await fetch(`${API_BASE_URL}/complaints/submit`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await response.json();

                submitResult.style.display = "block";
                if (response.ok) {
                    submitResult.style.background = "#e0f2f1";
                    submitResult.innerHTML = `<strong>تم إرسال طلبك بنجاح!</strong><br>رقم المرجع الخاص بك: <code>${data.refCode}</code>`;
                    complaintForm.reset();
                } else {
                    submitResult.style.background = "#ffebee";
                    submitResult.innerHTML = `<strong>خطأ:</strong> ${data.message || "فشل إرسال الطلب (تأكد من تسجيل الدخول أولاً)"}`;
                }
            } catch (error) {
                console.error("Submission error:", error);
                submitResult.style.display = "block";
                submitResult.style.background = "#ffebee";
                submitResult.innerHTML = "حدث خطأ في الاتصال بالخادم.";
            }
        });
    }

    // Handle Complaint Tracking Lookup
    const trackBtn = document.getElementById("trackBtn");
    const trackRefInput = document.getElementById("trackRefInput");
    const trackResult = document.getElementById("trackResult");

    if (trackBtn) {
        trackBtn.addEventListener("click", async () => {
            const refCode = trackRefInput.value.trim();
            if (!refCode) {
                alert("الرجاء إدخال رقم المرجع");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/complaints/track/${refCode}`);
                const data = await response.json();

                trackResult.style.display = "block";
                if (response.ok && data.success) {
                    const c = data.complaint;
                    trackResult.style.background = "#e0f2f1";
                    trackResult.innerHTML = `
                        <strong>حالة الطلب:</strong> ${c.status}<br>
                        <strong>النوع:</strong> ${c.type}<br>
                        <strong>القسم:</strong> ${c.department}<br>
                        <strong>التفاصيل:</strong> ${c.description}
                    `;
                } else {
                    trackResult.style.background = "#ffebee";
                    trackResult.innerHTML = "لم يتم العثور على شكوى بهذا الرقم المرجعي.";
                }
            } catch (error) {
                console.error("Tracking error:", error);
                trackResult.style.display = "block";
                trackResult.style.background = "#ffebee";
                trackResult.innerHTML = "حدث خطأ أثناء الاتصال بالخادم.";
            }
        });
    }
});