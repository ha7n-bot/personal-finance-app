# مالي — Personal Finance App

تطبيق عربي RTL لإدارة الأموال الشخصية بالريال السعودي. المرحلة الأولى تشمل التسجيل والدخول، الإعداد الأولي، الحسابات، العمليات، ولوحة معلومات مرتبطة مباشرة بقاعدة PostgreSQL.

## التقنية

- Next.js + TypeScript + Tailwind CSS
- Auth.js مع Credentials وتجزئة bcrypt
- PostgreSQL + Prisma، واستخدام `Decimal(18,2)` لكل الأموال
- واجهة عربية متجاوبة وLight/Dark mode
- طبقة Ledger تفصل المصروف عن التحويل والادخار والاستثمار وسداد الدين

## التشغيل

1. انسخ `.env.example` إلى `.env` وحدّث `DATABASE_URL` و`AUTH_SECRET`.
2. شغّل `pnpm install`.
3. شغّل `pnpm prisma generate` ثم `pnpm prisma db push`.
4. شغّل `pnpm dev` وافتح `http://localhost:3000`.

## الجودة

شغّل `pnpm typecheck` و`pnpm lint` و`pnpm test` و`pnpm build`.

## الأمان

لا ترفع `.env` أو بيانات مالية فعلية. الاستعلامات مقيدة بالمستخدم، والمدخلات الحساسة تتحقق عبر Zod، وكلمات المرور مجزأة بـbcrypt. قبل الإنتاج أضف rate limiting واستعادة كلمة المرور وتشفير الحقول الحساسة والنسخ الاحتياطي وHTTPS/CSP.

## خارطة الطريق

الميزانيات والالتزامات والتنبيهات، الديون وصندوق الطوارئ والأهداف، استثمارات الذهب، التقارير والتوقعات، ثم المستشار المالي المبني على مؤشرات محسوبة من البيانات.

## API تطبيق الجوال

جميع مسارات الجوال موجودة في ملف واحد: `src/app/api/mobile/[...path]/route.ts`.

- `GET /api/mobile/health` — فحص الخدمة.
- `POST /api/mobile/register` — إنشاء مستخدم وإرجاع token.
- `POST /api/mobile/login` — تسجيل الدخول وإرجاع token.
- `GET|POST /api/mobile/accounts` — الحسابات.
- `GET|POST /api/mobile/transactions` — العمليات.
- `DELETE /api/mobile/transactions/:id` — حذف عملية.
- `GET /api/mobile/categories` — التصنيفات.
- `GET /api/mobile/dashboard` — ملخص لوحة التحكم.

أرسل التوكن في الطلبات المحمية: `Authorization: Bearer YOUR_TOKEN`. ترجع المبالغ كنص عشري مثل `"1250.00"` للمحافظة على الدقة المالية.
