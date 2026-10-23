# نشر موقع Seha على Cloudflare Pages (مجانًا)

هذه نسخة ثابتة من واجهة الموقع مع Cloudflare Pages Function بدل مسار Flask المحلي. يظل Cloudflare Worker الحالي وقاعدة D1 كما هما.

## إعداد النشر

1. ارفعي محتويات هذا المجلد إلى مستودع GitHub الخاص بالمشروع `seha` (في جذر المستودع، بحيث يكون `index.html` ظاهرًا في الجذر).
2. من Cloudflare افتحي **Workers & Pages → Create → Pages → Connect to Git**، ثم اختاري مستودع `raghdaa-640code/seha` والفرع `main`.
3. في إعدادات البناء اختاري **Framework preset: None**، واتركي **Build command** فارغًا و**Build output directory** على ` / ` أو `.` حسب ما تعرضه لوحة Cloudflare. إذا طلبت المنصة مجلد إخراج، اكتبي `.`.
4. بعد إنشاء المشروع، افتحي **Settings → Variables and Secrets** وأضيفي:
   - `SEHA_WORKER_URL` = عنوان الـ Worker الحالي كاملًا، مثال: `https://seha-api.ramo-711-vip.workers.dev` (استخدمي العنوان الفعلي الموجود في إعداداتك إذا كان مختلفًا).
   - `SEHA_API_SECRET` = نفس السر الموجود في إعدادات Cloudflare Worker. أضيفيه كـ **Secret**، وليس كقيمة عامة في الكود.
5. أعيدي النشر **Retry deployment** أو **Deploy latest commit**.

## ملاحظات

- لا ترفعي ملف `.env` ولا تضعي قيمة `SEHA_API_SECRET` في ملفات HTML أو JavaScript.
- المسار `/api/seha/inquiries/sick-leave-details` أصبح يُنفَّذ بواسطة `functions/api/seha/inquiries/sick-leave-details.js`، ويستدعي Worker الحالي من الخادم.
- ملف `app.py` غير مطلوب لتشغيل نسخة Pages، لكن احتفظي بالنسخة الأصلية في جهازك أو فرع منفصل.
- اختبري الموقع أولًا برقم تجريبي غير حقيقي. لا تستخدمي بيانات هوية حقيقية أثناء الاختبار.
