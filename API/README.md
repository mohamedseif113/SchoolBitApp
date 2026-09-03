# مرجع واجهات schoolBit — SMOS API

واجهات **schoolBit SMOS** — نظام إدارة المدارس. ٦٦٩ نقطة نهاية في ٣٤ وحدة، ولكلٍّ منها شرحُها وحقولُها ومثالُ ردِّها في تبويب **Docs** داخل الطلب نفسه.

## ١. الأساسيات

| البند | القيمة |
|---|---|
| العنوان الأساسي | `{{baseUrl}}` — يُضبط من متغيرات الكولكشن |
| الحساب التجريبي | مدرسةُ تجربةٍ مستقلة، بياناتها معبَّأةٌ في متغيّرات الكولكشن — لا تعمل على بيانات مدرسةٍ حقيقية |
| الصيغة | JSON في الطلب والرد |
| الترويسات الثابتة | `Accept: application/json` ومع الأجسام `Content-Type: application/json` |
| المصادقة | `Authorization: Bearer <token>` |

> ترويسة `Accept: application/json` ليست تجميلاً: بدونها يردّ الخادم صفحة HTML عند الخطأ بدل JSON.

## ٢. شكل الرد موحَّد

كل رد ناجح:

```json
{ "success": true, "data": { } }
```

والقوائم المرقَّمة تضيف `meta`:

```json
{ "success": true, "data": [], "meta": { "current_page": 1, "per_page": 20, "has_more": false } }
```

وكل خطأ:

```json
{ "success": false, "message": "نصّ الخطأ بالعربية", "errors": { "field": ["سبب الرفض"] } }
```

**القاعدة:** البيانات المطلوبة دائماً داخل `data`. اكتب دالة واحدة تفكّ المغلّف وتُعيد `data`، ونادِها من كل مكان — لا تفكّه في كل شاشة.

## ٣. تسجيل الدخول — أربع بوابات مستقلة

لكل بوابة توكن خاص بها، ولا يصلح توكن إحداها في الأخرى:

| البوابة | المسار | التوكن | المستخدم |
|---|---|---|---|
| موظفو المدرسة | `POST /login` | `{{token}}` | المدير، الوكيل، المرشد، المعلم، المحاسب |
| الطالب وولي الأمر | `POST /portal/auth/request-code` ثم `/portal/auth/verify` | `{{portalToken}}` | برقم الجوال ورمز يصل رسالةً نصية — **بلا كلمة مرور** |
| ولي الأمر — المالية | `POST /guardian/auth/request-code` ثم `/guardian/auth/verify` | `{{guardianToken}}` | الفواتير والأقساط والسداد |
| مالك المنصة | `POST /platform/auth/login` | `{{platformToken}}` | إدارة المنصة لا المدرسة |

طلبات تسجيل الدخول في هذه الكولكشن **تحفظ التوكن تلقائياً** في متغيرات الكولكشن، فما عليك إلا تنفيذها مرةً ثم تنفيذ أي طلب آخر مباشرة.

**مدد الصلاحية:** توكن بوابة الطالب ثلاثون يوماً. وتوكن الموظف تحكمه إعدادات الخادم.

### الحساب التجريبي — جاهزٌ في متغيّرات الكولكشن

**«مدرسة تجربة الواجهات»** أُنشئت لهذا الغرض وحده، وبياناتها معبَّأةٌ مسبقاً في متغيّرات
الكولكشن. فلا شيء يُنسخ من ملفٍ آخر: افتح **تسجيل دخول موظفي المدرسة** واضغط Send،
ثم نفِّذ أيَّ طلبٍ بعده مباشرة.

| الدور | المتغيّر | كلمة المرور |
|---|---|---|
| مدير المدرسة | `{{testEmail}}` | `{{testPassword}}` |
| وكيل المدرسة | `{{testDeputyEmail}}` | `{{testStaffPassword}}` |
| معلم | `{{testTeacherEmail}}` | `{{testStaffPassword}}` |
| مرشد طلابي | `{{testCounselorEmail}}` | `{{testStaffPassword}}` |
| محاسب | `{{testAccountantEmail}}` | `{{testStaffPassword}}` |

بدّل البريد في جسم طلب الدخول لترى النظام بعين دورٍ آخر — الشاشات والصلاحيات تختلف
جذرياً بين الأدوار، وهذا أهمّ ما يجب أن تراه مبكراً.

**في المدرسة:** شعبة «الصف الأول الابتدائي — أ» وطالبان (سلمى، خالد) ولكلٍّ منهما وليُّ أمر.

> **بوابة الجوال والرمز النصي:** `{{testStudentPhone}}` و`{{testGuardianPhone}}` رقمان
> تجريبيان لا يستقبلان رسائل فعلاً، فـ `request-code` يردّ نجاحاً ولا يصلك رمز. ولتجرّب
> الدخول كاملاً، اطلب من فريق النظام تبديل جوال أحد الطالبين برقمك أنت — تعديلٌ واحد
> على الطالب عبر `PUT /employees/{id}`، ثم يصلك الرمز على جوالك.

## ٤. رموز الحالة وما يجب فعله عند كلٍّ منها

| الرمز | المعنى | التصرف الصحيح |
|---|---|---|
| `200` / `201` | نجاح | — |
| `401` | التوكن غير صالح أو انتهى | أعد المستخدم إلى شاشة الدخول |
| `402` | اشتراك المدرسة منتهٍ | **لا تمسح التوكن** — الجلسة صالحة والمدرسة هي المقفلة؛ وجّه المستخدم إلى شاشة الاشتراك |
| `403` | لا يملك الصلاحية | اعرض رسالة منع، ولا تُخرجه من حسابه |
| `404` | غير موجود | — |
| `422` | فشل التحقق | اعرض `errors` أسفل كل حقل باسمه، لا كرسالة عامة |
| `429` | تجاوز حدّ الطلبات | اعرض «حاول بعد قليل» ولا تُعِد المحاولة تلقائياً |

الحدود مذكورة في وصف كل نقطة تخضع لها. وأشدُّها على إرسال رموز الدخول: **خمس محاولات في الدقيقة**.

## ٤.١ الاشتراك المنتهي — حالةٌ ستصادفها

**تسجيل الدخول ينجح حتى لو كان اشتراك المدرسة منتهياً**، ويعود التوكن ومعه:

```json
{ "locked": true, "locked_message": "انتهت فترة التجربة المجانية. يرجى الاشتراك للمتابعة.", "trial_days_left": 0 }
```

عندها ترد بقيةُ النقاط `402`. فاقرأ `locked` من ردّ الدخول واعرض شاشة الاشتراك،
ولا تفهمها فشلاً في الدخول ولا تمسح التوكن.

## ٥. الترقيم والفلترة

القوائم تقبل `per_page` و`page`، ومعاملات الفلترة مذكورة في وصف كل نقطة. واعتمد على `meta.has_more` لا على حساب عدد الصفحات.

## ٦. الملفات

- **الرفع:** `multipart/form-data`، والحقول موضَّحة في الطلبات التي تحتاجه.
- **التنزيل:** نقاط تقارير PDF وExcel تردّ **ملفاً لا JSON** — وهي معلَّمةٌ في وصفها. عالجها كـ Blob، ولا تحاول تحليلها JSON.

## ٧. ملاحظات تخصّ تطبيق الجوال

1. **خزِّن التوكن في مخزنٍ آمن** (Keychain على iOS و Keystore على أندرويد) لا في تخزينٍ عادي — البيانات تخصّ قاصرين.
2. **الإشعارات الفورية غير متاحة بعد.** لا توجد اليوم نقطةُ تسجيلٍ لرمز الجهاز ولا إرسالٌ عبر FCM/APNs، وهي قيد الإعداد من طرف الخادم. ابنِ باقي التطبيق ولا تنتظرها.
3. **الواجهة عربية من اليمين إلى اليسار.** احسم اتجاه الواجهة في أول أسبوع لا في آخره.
4. **الشبكة الضعيفة واردة دائماً** — لكل شاشة أربع حالات: تحميل، فارغة، خطأ، بيانات.

## ٨. أين تجد شرح كل نقطة

الشرح الكامل لكل نقطة — غرضها، وصلاحيتها، وحقول طلبها بقواعد التحقق، ومثال ردّها —
**داخل الكولكشن نفسها**: افتح الطلب ثم تبويب **Docs** على اليمين. وملف `README` المرافق
فهرسٌ مختصر بكل النقاط لا أكثر.

## ٩. عن الأمثلة

أشكال الطلبات والردود **مستخرَجةٌ آلياً من كود الخادم** — من قواعد التحقق ومن طبقة العرض — فأسماء الحقول وأنواعها صحيحة، أما القيم فتوضيحية. ونفِّذ كل نقطة مرةً على بيئة التجربة لترى بياناتك الحقيقية.

عند أي اختلاف بين هذا المرجع وسلوك الخادم، **الخادم هو المرجع** — وأبلغ فريق النظام ليُصحَّح الملف.


---

## فهرس الوحدات

| # | الوحدة | عدد النقاط |
|---|---|---|
| ٠١ | [٠١ · المصادقة والتسجيل](#-المصادقة-والتسجيل) | 9 |
| ٠٢ | [٠٢ · بوابة الطالب وولي الأمر (تطبيق الجوال)](#-بوابة-الطالب-وولي-الأمر-تطبيق-الجوال-) | 20 |
| ٠٣ | [٠٣ · بوابة ولي الأمر — المالية](#-بوابة-ولي-الأمر-المالية) | 23 |
| ٠٤ | [٠٤ · روابط عامة بلا تسجيل دخول](#-روابط-عامة-بلا-تسجيل-دخول) | 12 |
| ٠٥ | [٠٥ · الاشتراك والفوترة](#-الاشتراك-والفوترة) | 7 |
| ٠٦ | [٠٦ · حضور الطلاب](#-حضور-الطلاب) | 40 |
| ٠٧ | [٠٧ · حضور المعلمين والموظفين](#-حضور-المعلمين-والموظفين) | 29 |
| ٠٨ | [٠٨ · أجهزة البصمة والتزامن](#-أجهزة-البصمة-والتزامن) | 22 |
| ٠٩ | [٠٩ · تقارير PDF وملفات Excel](#-تقارير-PDF-وملفات-Excel) | 10 |
| ١٠ | [١٠ · الطلاب والموظفون](#-الطلاب-والموظفون) | 31 |
| ١١ | [١١ · الفصول والمجموعات](#-الفصول-والمجموعات) | 10 |
| ١٢ | [١٢ · الأدوار والصلاحيات والمستخدمون](#-الأدوار-والصلاحيات-والمستخدمون) | 26 |
| ١٣ | [١٣ · لوحة المعلومات](#-لوحة-المعلومات) | 4 |
| ١٤ | [١٤ · السلوك والمخالفات](#-السلوك-والمخالفات) | 11 |
| ١٥ | [١٥ · المهام](#-المهام) | 9 |
| ١٦ | [١٦ · الرسائل والواتساب](#-الرسائل-والواتساب) | 34 |
| ١٧ | [١٧ · الإشعارات وحالات التسليم](#-الإشعارات-وحالات-التسليم) | 8 |
| ١٨ | [١٨ · الاستدعاءات](#-الاستدعاءات) | 9 |
| ١٩ | [١٩ · الإعدادات والأمان](#-الإعدادات-والأمان) | 31 |
| ٢٠ | [٢٠ · الجدول الدراسي](#-الجدول-الدراسي) | 9 |
| ٢١ | [٢١ · الهيكل الأكاديمي (الصفوف والحصص والمواد)](#-الهيكل-الأكاديمي-الصفوف-والحصص-والمواد-) | 16 |
| ٢٢ | [٢٢ · اللجان](#-اللجان) | 21 |
| ٢٣ | [٢٣ · التقارير](#-التقارير) | 11 |
| ٢٤ | [٢٤ · النماذج والاستبيانات](#-النماذج-والاستبيانات) | 13 |
| ٢٥ | [٢٥ · ملف الإنجاز](#-ملف-الإنجاز) | 19 |
| ٢٦ | [٢٦ · الاختبارات وتوزيع اللجان](#-الاختبارات-وتوزيع-اللجان) | 22 |
| ٢٧ | [٢٧ · الطلاب المعرَّضون للخطر](#-الطلاب-المعر-ضون-للخطر) | 13 |
| ٢٨ | [٢٨ · التكامل ونظام نور](#-التكامل-ونظام-نور) | 16 |
| ٢٩ | [٢٩ · الموارد البشرية](#-الموارد-البشرية) | 36 |
| ٣٠ | [٣٠ · الواجبات](#-الواجبات) | 29 |
| ٣١ | [٣١ · المالية](#-المالية) | 103 |
| ٣٢ | [٣٢ · سجل العمليات](#-سجل-العمليات) | 4 |
| ٣٣ | [٣٣ · المرفقات](#-المرفقات) | 2 |
| ٣٤ | [٣٤ · لوحة مالك المنصة](#-لوحة-مالك-المنصة) | 10 |

**الإجمالي: 669 نقطة نهاية.**

> الشرح المفصّل لكل نقطة — الحقول والقواعد ومثال الرد — داخل الكولكشن نفسها: افتح الطلب ثم تبويب **Docs**.

---


## ٠١ · المصادقة والتسجيل

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| تسجيل دخول موظفي المدرسة | `POST` | `/login` | عام | — |
| تبديل رمز الدخول الموحّد | `POST` | `/auth/sso/exchange` | عام | — |
| تسجيل مدرسة جديدة | `POST` | `/signup` | عام | — |
| تأكيد رمز التحقق بخطوتين | `POST` | `/auth/2fa/verify` | عام | — |
| إعادة إرسال رمز التحقق بخطوتين | `POST` | `/auth/2fa/resend` | عام | — |
| طلب رمز استعادة كلمة المرور | `POST` | `/auth/forgot-password` | عام | — |
| تعيين كلمة مرور جديدة بالرمز | `POST` | `/auth/reset-password` | عام | — |
| تسجيل الخروج | `POST` | `/logout` | موظف | — |
| بيانات المستخدم الحالي | `GET` | `/me` | موظف | — |

## ٠٢ · بوابة الطالب وولي الأمر (تطبيق الجوال)

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| ١ · طلب رمز الدخول (يصل رسالةً نصية) | `POST` | `/portal/auth/request-code` | عام | — |
| ٢ · تأكيد الرمز واستلام التوكن | `POST` | `/portal/auth/verify` | عام | — |
| ٣ · بيانات الحساب والأبناء المرتبطين | `GET` | `/portal/me` | بوابة | — |
| تسجيل الخروج من البوابة | `POST` | `/portal/logout` | بوابة | — |
| واجبات الطالب | `GET` | `/portal/students/{studentId}/homework` | بوابة | — |
| تفاصيل واجب واحد | `GET` | `/portal/students/{studentId}/homework/{submissionId}` | بوابة | — |
| تسليم الواجب | `POST` | `/portal/students/{studentId}/homework/{submissionId}/submit` | بوابة | — |
| حفظ إجابات الواجب | `POST` | `/portal/students/{studentId}/homework/{submissionId}/answers` | بوابة | — |
| تنزيل مرفق | `GET` | `/portal/students/{studentId}/attachments/{id}/download` | بوابة | — |
| حضور الطالب وغيابه | `GET` | `/portal/students/{studentId}/attendance` | بوابة | — |
| سلوك الطالب | `GET` | `/portal/students/{studentId}/behavior` | بوابة | — |
| درجات الطالب | `GET` | `/portal/students/{studentId}/grades` | بوابة | — |
| جدول الطالب الأسبوعي | `GET` | `/portal/students/{studentId}/schedule` | بوابة | — |
| تنبيهات الطالب | `GET` | `/portal/students/{studentId}/alerts` | بوابة | — |
| استدعاءات الطالب | `GET` | `/portal/students/{studentId}/summons` | بوابة | — |
| تأكيد استلام الاستدعاء | `POST` | `/portal/students/{studentId}/summons/{summonId}/confirm` | بوابة | — |
| المراسلة مع المدرسة — القراءة | `GET` | `/portal/students/{studentId}/messages` | بوابة | — |
| المراسلة مع المدرسة — الإرسال | `POST` | `/portal/students/{studentId}/messages` | بوابة | — |
| طلبات ولي الأمر | `GET` | `/portal/students/{studentId}/requests` | بوابة | — |
| تقديم طلب للمدرسة | `POST` | `/portal/students/{studentId}/requests` | بوابة | — |

## ٠٣ · بوابة ولي الأمر — المالية

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| ١ · طلب رمز دخول ولي الأمر | `POST` | `/guardian/auth/request-code` | عام | — |
| ٢ · تأكيد الرمز واستلام التوكن | `POST` | `/guardian/auth/verify` | عام | — |
| حسابي | `GET` | `/guardian/me` | ولي أمر | — |
| تسجيل الخروج | `POST` | `/guardian/logout` | ولي أمر | — |
| الملخص | `GET` | `/guardian/summary` | ولي أمر | — |
| تفاصيل الطلاب | `GET` | `/guardian/students/{studentId}` | ولي أمر | — |
| الحضور — لطالب محدد | `GET` | `/guardian/students/{studentId}/attendance` | ولي أمر | — |
| السلوك — لطالب محدد | `GET` | `/guardian/students/{studentId}/behavior` | ولي أمر | — |
| الدرجات — لطالب محدد | `GET` | `/guardian/students/{studentId}/grades` | ولي أمر | — |
| الجدول الدراسي — لطالب محدد | `GET` | `/guardian/students/{studentId}/schedule` | ولي أمر | — |
| التنبيهات — لطالب محدد | `GET` | `/guardian/students/{studentId}/alerts` | ولي أمر | — |
| الاستدعاءات — لطالب محدد | `GET` | `/guardian/students/{studentId}/summons` | ولي أمر | — |
| تأكيد الاستدعاءات | `POST` | `/guardian/students/{studentId}/summons/{summonId}/confirm` | ولي أمر | — |
| الرسائل — لطالب محدد | `GET` | `/guardian/students/{studentId}/messages` | ولي أمر | — |
| إنشاء الرسائل | `POST` | `/guardian/students/{studentId}/messages` | ولي أمر | — |
| طلبات الاعتماد — لطالب محدد | `GET` | `/guardian/students/{studentId}/requests` | ولي أمر | — |
| إنشاء طلبات الاعتماد | `POST` | `/guardian/students/{studentId}/requests` | ولي أمر | — |
| الواجبات — لطالب محدد | `GET` | `/guardian/students/{studentId}/homework` | ولي أمر | — |
| تفاصيل الواجبات | `GET` | `/guardian/students/{studentId}/homework/{submissionId}` | ولي أمر | — |
| كشف الحساب | `GET` | `/guardian/statement` | ولي أمر | — |
| قائمة المدفوعات | `GET` | `/guardian/payments` | ولي أمر | — |
| الإيصال — لدفعة محدد | `GET` | `/guardian/payments/{paymentId}/receipt` | ولي أمر | — |
| رابط دفع الأقساط | `POST` | `/guardian/installments/{installmentId}/pay-link` | ولي أمر | — |

## ٠٤ · روابط عامة بلا تسجيل دخول

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| تفاصيل reply | `GET` | `/reply/{token}` | عام | — |
| تعديل reply | `POST` | `/reply/{token}` | عام | — |
| تفاصيل النماذج | `GET` | `/forms/public/{token}` | عام | — |
| تعديل النماذج | `POST` | `/forms/public/{token}` | عام | — |
| إنشاء callback | `POST` | `/webhooks/paytabs/callback` | عام | — |
| إنشاء callback · /webhooks/noon/callback | `POST` | `/webhooks/noon/callback` | عام | — |
| تفاصيل الدفع | `GET` | `/public/pay/{token}` | عام | — |
| بدء الدفع | `POST` | `/public/pay/{token}/start` | عام | — |
| إنشاء plan | `POST` | `/public/pay/{token}/plan` | عام | — |
| الإيصال — لالدفع محدد | `GET` | `/public/pay/{token}/receipt` | عام | — |
| تفاصيل callback | `GET` | `/public/pay/callback/{transactionId}` | عام | — |
| تعديل خطاطيف الويب | `POST` | `/public/webhooks/{provider}` | عام | — |

## ٠٥ · الاشتراك والفوترة

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة الاشتراك | `GET` | `/me/subscription` | موظف | `billing.view` |
| قائمة المدفوعات | `GET` | `/me/payments` | موظف | `billing.view` |
| قائمة الخطط | `GET` | `/plans` | موظف | `billing.view` |
| بدء الدفع | `POST` | `/me/billing/checkout` | موظف | `billing.manage` |
| تأكيد الفوترة | `POST` | `/me/billing/confirm` | موظف | `billing.manage` |
| بيانات الحساب البنكي | `GET` | `/me/billing/bank-details` | موظف | `billing.view` |
| إرسال طلب حوالة | `POST` | `/me/billing/bank-transfer` | موظف | `billing.manage` |

## ٠٦ · حضور الطلاب

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة اليومي | `GET` | `/attendance/students/daily` | موظف | `attendance.students.view` |
| قائمة absent | `GET` | `/attendance/students/absent` | موظف | `attendance.students.view` |
| قائمة late | `GET` | `/attendance/students/late` | موظف | `attendance.students.view` |
| العرض السريع الطلاب | `GET` | `/attendance/students/quick-view` | موظف | `attendance.students.view` |
| الأحدث حركات البصمة | `GET` | `/attendance/students/transactions/recent` | موظف | `attendance.students.view` |
| خروج اليوم الطلاب | `GET` | `/attendance/students/daily-exits` | موظف | `attendance.students.view` |
| تعيين الحالة الطلاب | `POST` | `/attendance/students/quick-mark/set-status` | موظف | `attendance.students.view` |
| عرض الحصص الطلاب | `GET` | `/attendance/students/period-view` | موظف | `attendance.students.view` |
| حضور الحصص الطلاب | `POST` | `/attendance/students/period-attendance` | موظف | `attendance.students.view` |
| حذف الطلاب | `DELETE` | `/attendance/students/period-attendance/{employeeId}/{periodId}/{date}` | موظف | `attendance.students.view` |
| الإحصاءات | `GET` | `/attendance/students/statistics` | موظف | `attendance.students.view` |
| قائمة كشوف التوقيع | `GET` | `/attendance/students/signatures` | موظف | `attendance.students.view` |
| قائمة comparison | `GET` | `/attendance/students/comparison` | موظف | `attendance.students.view` |
| قائمة الخروج المبكر | `GET` | `/attendance/students/early-leaves` | موظف | `attendance.students.early_leaves` |
| قائمة اليومي | `GET` | `/attendance/students/early-leaves/daily` | موظف | `attendance.students.early_leaves` |
| إنشاء الخروج المبكر | `POST` | `/attendance/students/early-leaves` | موظف | `attendance.students.early_leaves` |
| إضافة جماعية الخروج المبكر | `POST` | `/attendance/students/early-leaves/bulk` | موظف | `attendance.students.early_leaves` |
| إرسال رسائل الخروج المبكر | `POST` | `/attendance/students/early-leaves/send-messages` | موظف | `attendance.students.early_leaves` |
| قائمة الأعذار | `GET` | `/attendance/students/excuses` | موظف | `attendance.students.excuses` |
| إنشاء الأعذار | `POST` | `/attendance/students/excuses` | موظف | `attendance.students.excuses` |
| تعديل الأعذار | `PUT` | `/attendance/students/excuses/{id}` | موظف | `attendance.students.excuses` |
| حذف الأعذار | `DELETE` | `/attendance/students/excuses/{id}` | موظف | `attendance.students.excuses` |
| إرفاق الأعذار | `POST` | `/attendance/students/excuses/attach` | موظف | `attendance.students.excuses` |
| إرفاق سريع الأعذار | `POST` | `/attendance/students/excuses/quick-attach` | موظف | `attendance.students.excuses` |
| إرفاق جماعي الأعذار | `POST` | `/attendance/students/excuses/bulk-attach` | موظف | `attendance.students.excuses` |
| حذف transaction | `DELETE` | `/attendance/students/excuses/transaction/{id}` | موظف | `attendance.students.excuses` |
| قائمة الرسائل | `GET` | `/attendance/students/messages` | موظف | `attendance.students.messages` |
| العدد الرسائل | `GET` | `/attendance/students/messages/count` | موظف | `attendance.students.messages` |
| الرصيد | `GET` | `/attendance/students/messages/balance` | موظف | `attendance.students.messages` |
| إرسال الرسائل | `POST` | `/attendance/students/messages/send` | موظف | `attendance.students.messages` |
| قائمة permission | `GET` | `/attendance/students/messages/permission` | موظف | `attendance.students.messages` |
| قائمة إعدادات الأوقات | `GET` | `/attendance/students/time-settings` | موظف | `settings.manage` |
| إنشاء إعدادات الأوقات | `POST` | `/attendance/students/time-settings` | موظف | `settings.manage` |
| قائمة custom | `GET` | `/attendance/students/time-settings/custom` | موظف | `settings.manage` |
| إنشاء custom | `POST` | `/attendance/students/time-settings/custom` | موظف | `settings.manage` |
| تعديل custom | `PUT` | `/attendance/students/time-settings/custom/{setting}` | موظف | `settings.manage` |
| حذف custom | `DELETE` | `/attendance/students/time-settings/custom/{setting}` | موظف | `settings.manage` |
| إنشاء الطلاب والموظفين | `POST` | `/attendance/students/time-settings/custom/{setting}/employees` | موظف | `settings.manage` |
| قائمة إعدادات الرسائل | `GET` | `/attendance/students/message-settings` | موظف | `settings.manage` |
| إنشاء إعدادات الرسائل | `POST` | `/attendance/students/message-settings` | موظف | `settings.manage` |

## ٠٧ · حضور المعلمين والموظفين

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة اليومي | `GET` | `/attendance/teachers/daily` | موظف | `attendance.teachers.view` |
| قائمة absent | `GET` | `/attendance/teachers/absent` | موظف | `attendance.teachers.view` |
| قائمة late | `GET` | `/attendance/teachers/late` | موظف | `attendance.teachers.view` |
| log | `GET` | `/attendance/teachers/log` | موظف | `attendance.teachers.view` |
| الإحصاءات | `GET` | `/attendance/teachers/statistics` | موظف | `attendance.teachers.view` |
| قائمة كشوف التوقيع | `GET` | `/attendance/teachers/signatures` | موظف | `attendance.teachers.view` |
| قائمة no-checkout | `GET` | `/attendance/teachers/no-checkout` | موظف | `attendance.teachers.view` |
| قائمة فترات عدم التوفر | `GET` | `/attendance/teachers/unavailabilities` | موظف | `attendance.teachers.view` |
| إنشاء فترات عدم التوفر | `POST` | `/attendance/teachers/unavailabilities` | موظف | `attendance.teachers.view` |
| حذف فترات عدم التوفر | `DELETE` | `/attendance/teachers/unavailabilities/{unavailability}` | موظف | `attendance.teachers.view` |
| قائمة الخروج المبكر | `GET` | `/attendance/teachers/early-leaves` | موظف | `attendance.teachers.early_leaves` |
| قائمة اليومي | `GET` | `/attendance/teachers/early-leaves/daily` | موظف | `attendance.teachers.early_leaves` |
| إنشاء الخروج المبكر | `POST` | `/attendance/teachers/early-leaves` | موظف | `attendance.teachers.early_leaves` |
| إضافة جماعية الخروج المبكر | `POST` | `/attendance/teachers/early-leaves/bulk` | موظف | `attendance.teachers.early_leaves` |
| إرسال رسائل الخروج المبكر | `POST` | `/attendance/teachers/early-leaves/send-messages` | موظف | `attendance.teachers.early_leaves` |
| قائمة الرسائل | `GET` | `/attendance/teachers/messages` | موظف | `messages.send` |
| الرصيد | `GET` | `/attendance/teachers/messages/balance` | موظف | `messages.send` |
| إرسال الرسائل | `POST` | `/attendance/teachers/messages/send` | موظف | `messages.send` |
| قائمة إعدادات الأوقات | `GET` | `/attendance/teachers/time-settings` | موظف | `settings.manage` |
| إنشاء إعدادات الأوقات | `POST` | `/attendance/teachers/time-settings` | موظف | `settings.manage` |
| قائمة custom | `GET` | `/attendance/teachers/time-settings/custom` | موظف | `settings.manage` |
| إنشاء custom | `POST` | `/attendance/teachers/time-settings/custom` | موظف | `settings.manage` |
| تعديل custom | `PUT` | `/attendance/teachers/time-settings/custom/{setting}` | موظف | `settings.manage` |
| حذف custom | `DELETE` | `/attendance/teachers/time-settings/custom/{setting}` | موظف | `settings.manage` |
| إنشاء الطلاب والموظفين | `POST` | `/attendance/teachers/time-settings/custom/{setting}/employees` | موظف | `settings.manage` |
| قائمة إعدادات الرسائل | `GET` | `/attendance/teachers/message-settings` | موظف | `settings.manage` |
| إنشاء إعدادات الرسائل | `POST` | `/attendance/teachers/message-settings` | موظف | `settings.manage` |
| قائمة الجزاءات | `GET` | `/attendance/teachers/punishments` | موظف | `attendance.teachers.punishments` |
| قائمة pdf | `GET` | `/attendance/teachers/punishments/pdf` | موظف | `attendance.teachers.punishments` |

## ٠٨ · أجهزة البصمة والتزامن

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة أجهزة البصمة | `GET` | `/attendance/devices` | موظف | — |
| إنشاء أجهزة البصمة | `POST` | `/attendance/devices` | موظف | — |
| تحديث حالة الأجهزة | `POST` | `/attendance/devices/refresh-status` | موظف | — |
| تعديل أجهزة البصمة | `PUT` | `/attendance/devices/{device}` | موظف | — |
| حذف أجهزة البصمة | `DELETE` | `/attendance/devices/{device}` | موظف | — |
| قائمة حركات البصمة | `GET` | `/attendance/devices/transactions` | موظف | — |
| العدد حركات البصمة | `GET` | `/attendance/devices/transactions/count` | موظف | — |
| تصدير Excel حركات البصمة | `GET` | `/attendance/devices/transactions/export-xlsx` | موظف | — |
| رفع حركات البصمة | `POST` | `/attendance/devices/transactions/upload` | موظف | — |
| رفع الكل حركات البصمة | `POST` | `/attendance/devices/transactions/upload-all` | موظف | — |
| رفع الخاص بي حركات البصمة | `POST` | `/attendance/devices/transactions/upload-my` | موظف | — |
| حذف نطاق حركات البصمة | `POST` | `/attendance/devices/transactions/remove-range` | موظف | — |
| تحديث الحالات حركات البصمة | `POST` | `/attendance/devices/transactions/update-statuses` | موظف | — |
| إزالة حركات البصمة | `POST` | `/attendance/devices/transactions/remove` | موظف | — |
| إنشاء update | `POST` | `/attendance/devices/transactions/update` | موظف | — |
| قائمة report | `GET` | `/attendance/devices/transactions/report` | موظف | — |
| قائمة الطلاب والموظفين | `GET` | `/attendance/biotime/employees` | موظف | — |
| إنشاء add | `POST` | `/attendance/biotime/employees/add` | موظف | — |
| إزالة الطلاب والموظفين | `POST` | `/attendance/biotime/employees/remove` | موظف | — |
| قائمة pdf | `GET` | `/attendance/signatures/pdf` | موظف | `attendance.students.view,attendance.teachers.view,reports.view` |
| قائمة excel | `GET` | `/attendance/signatures/excel` | موظف | `attendance.students.view,attendance.teachers.view,reports.view` |
| قائمة ردود الرسائل | `GET` | `/attendance/message-replies` | موظف | — |

## ٠٩ · تقارير PDF وملفات Excel

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة daily-report | `GET` | `/pdf/daily-report` | موظف | `attendance.students.view,attendance.teachers.view,reports.view` |
| قائمة absent-teachers | `GET` | `/pdf/absent-teachers` | موظف | `attendance.students.view,attendance.teachers.view,reports.view` |
| قائمة teacher-signatures | `GET` | `/pdf/teacher-signatures` | موظف | `attendance.students.view,attendance.teachers.view,reports.view` |
| الإحصاءات | `GET` | `/pdf/statistics` | موظف | `attendance.students.view,attendance.teachers.view,reports.view` |
| تفاصيل delay-notice | `GET` | `/pdf/delay-notice/{transactionId}` | موظف | `attendance.teachers.view,reports.view` |
| تفاصيل absence-notice | `GET` | `/pdf/absence-notice/{transactionId}` | موظف | `attendance.teachers.view,reports.view` |
| إنشاء punishment | `POST` | `/pdf/punishment` | موظف | `attendance.teachers.punishments` |
| قائمة الخروج المبكر | `GET` | `/pdf/early-leaves` | موظف | `attendance.students.early_leaves,attendance.teachers.early_leaves,attendance.students.view,attendance.teachers.view,reports.view` |
| تفاصيل employee-report | `GET` | `/pdf/employee-report/{employeeId}` | موظف | `employees.view,reports.view` |
| قائمة الجدول الدراسي | `GET` | `/pdf/schedule` | موظف | `schedule.view,reports.view` |

## ١٠ · الطلاب والموظفون

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة الطلاب والموظفين | `GET` | `/employees` | موظف | `employees.view` |
| تصدير Excel الطلاب والموظفين | `GET` | `/employees/export.xlsx` | موظف | `employees.view` |
| تفاصيل الطلاب والموظفين | `GET` | `/employees/{id}` | موظف | `employees.view` |
| أولياء الأمور — لموظف محدد | `GET` | `/employees/{employeeId}/guardians` | موظف | `employees.view` |
| الملاحظات — لموظف محدد | `GET` | `/employees/{employeeId}/comments` | موظف | `employees.view` |
| إنشاء الطلاب والموظفين | `POST` | `/employees` | موظف | `employees.create` |
| استيراد الطلاب والموظفين | `POST` | `/employees/import` | موظف | `employees.create` |
| قالب الطلاب والموظفين | `GET` | `/employees/import/template` | موظف | `employees.create` |
| تنسيق ملف Excel الطلاب والموظفين | `POST` | `/employees/format-excel` | موظف | `employees.create` |
| إنشاء add-to-biotime | `POST` | `/employees/{id}/add-to-biotime` | موظف | `employees.create` |
| إنشاء remove-from-biotime | `POST` | `/employees/{id}/remove-from-biotime` | موظف | `employees.create` |
| تعديل الطلاب والموظفين | `PUT` | `/employees/{id}` | موظف | `employees.update` |
| حذف الطلاب والموظفين | `DELETE` | `/employees/{id}` | موظف | `employees.delete` |
| حذف جماعي الطلاب والموظفين | `POST` | `/employees/bulk-delete` | موظف | `employees.delete` |
| إنشاء أولياء الأمور | `POST` | `/guardians` | موظف | `employees.guardians` |
| تعديل أولياء الأمور | `PUT` | `/guardians/{id}` | موظف | `employees.guardians` |
| حذف أولياء الأمور | `DELETE` | `/guardians/{id}` | موظف | `employees.guardians` |
| إنشاء الملاحظات | `POST` | `/comments` | موظف | `employees.comments` |
| حذف الملاحظات | `DELETE` | `/comments/{id}` | موظف | `employees.comments` |
| المواد — لموظف محدد | `GET` | `/employees/{id}/subjects` | موظف | — |
| تحديث المواد | `PUT` | `/employees/{id}/subjects` | موظف | — |
| الفصول — لموظف محدد | `GET` | `/employees/{id}/classes` | موظف | — |
| تحديث الفصول | `PUT` | `/employees/{id}/classes` | موظف | — |
| إنشاء أولياء الأمور · /employees/:id/guardians | `POST` | `/employees/{employeeId}/guardians` | موظف | `employees.guardians` |
| إنشاء الملاحظات · /employees/:id/comments | `POST` | `/employees/{employeeId}/comments` | موظف | `employees.comments` |
| الدرجات — لموظف محدد | `GET` | `/employees/{id}/grades` | موظف | `employees.view` |
| المخالفات — لموظف محدد | `GET` | `/employees/{id}/violations` | موظف | `employees.view` |
| attendance-detailed — لموظف محدد | `GET` | `/employees/{id}/attendance-detailed` | موظف | `employees.view` |
| الخط الزمني — لموظف محدد | `GET` | `/employees/{id}/timeline` | موظف | `employees.view` |
| إنشاء الدرجات | `POST` | `/employees/{id}/grades` | موظف | `employees.update` |
| إنشاء المخالفات | `POST` | `/employees/{id}/violations` | موظف | `behavior.incidents.manage` |

## ١١ · الفصول والمجموعات

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة الفصول | `GET` | `/groups` | موظف | `employees.view` |
| تفاصيل الفصول | `GET` | `/groups/{id}` | موظف | `employees.view` |
| إنشاء الفصول | `POST` | `/groups` | موظف | `employees.create,employees.update` |
| تعديل الفصول | `PUT` | `/groups/{id}` | موظف | `employees.create,employees.update` |
| حذف الفصول | `DELETE` | `/groups/{id}` | موظف | `employees.delete` |
| قائمة الشُّعَب | `GET` | `/sub-groups` | موظف | `employees.view` |
| تفاصيل الشُّعَب | `GET` | `/sub-groups/{id}` | موظف | `employees.view` |
| إنشاء الشُّعَب | `POST` | `/sub-groups` | موظف | `employees.create,employees.update` |
| تعديل الشُّعَب | `PUT` | `/sub-groups/{id}` | موظف | `employees.create,employees.update` |
| حذف الشُّعَب | `DELETE` | `/sub-groups/{id}` | موظف | `employees.delete` |

## ١٢ · الأدوار والصلاحيات والمستخدمون

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| حسابي | `GET` | `/access/me` | موظف | — |
| قائمة مزوّد الرسائل | `GET` | `/access/sms` | موظف | `settings.manage` |
| اختبار مزوّد الرسائل | `POST` | `/access/sms/test` | موظف | `settings.manage` |
| إنشاء مزوّد الرسائل | `POST` | `/access/sms` | موظف | `settings.manage` |
| قائمة الإدارة التعليمية | `GET` | `/access/department` | موظف | `settings.manage` |
| إنشاء الإدارة التعليمية | `POST` | `/access/department` | موظف | `settings.manage` |
| قائمة الصلاحيات | `GET` | `/access/permissions` | موظف | `sub_users.manage` |
| قائمة الأدوار | `GET` | `/access/roles` | موظف | `sub_users.manage` |
| إنشاء الأدوار | `POST` | `/access/roles` | موظف | `permissions.matrix.manage` |
| تفاصيل الأدوار | `GET` | `/access/roles/{id}` | موظف | `permissions.matrix.manage` |
| تعديل الأدوار | `PUT` | `/access/roles/{id}` | موظف | `permissions.matrix.manage` |
| حذف الأدوار | `DELETE` | `/access/roles/{id}` | موظف | `permissions.matrix.manage` |
| قائمة المستخدمين الفرعيين | `GET` | `/sub-users` | موظف | `sub_users.manage` |
| إنشاء المستخدمين الفرعيين | `POST` | `/sub-users` | موظف | `sub_users.manage` |
| تفاصيل المستخدمين الفرعيين | `GET` | `/sub-users/{subUser}` | موظف | `sub_users.manage` |
| تعديل المستخدمين الفرعيين | `PUT` | `/sub-users/{subUser}` | موظف | `sub_users.manage` |
| حذف المستخدمين الفرعيين | `DELETE` | `/sub-users/{subUser}` | موظف | `sub_users.manage` |
| تغيير كلمة المرور | `POST` | `/sub-users/{subUser}/change-password` | موظف | `sub_users.manage` |
| تفعيل/تعطيل المستخدمين الفرعيين | `POST` | `/sub-users/{subUser}/toggle-status` | موظف | `sub_users.manage` |
| الصلاحيات — لمستخدم محدد | `GET` | `/sub-users/{subUser}/permissions` | موظف | `sub_users.manage` |
| تحديث الصلاحيات | `PUT` | `/sub-users/{subUser}/permissions` | موظف | `sub_users.manage` |
| قائمة الصلاحيات · /permissions | `GET` | `/permissions` | موظف | `sub_users.manage` |
| مصفوفة الصلاحيات | `GET` | `/permissions/matrix` | موظف | `permissions.matrix.manage` |
| تحديث مصفوفة الصلاحيات | `PUT` | `/permissions/matrix` | موظف | `permissions.matrix.manage` |
| نسخ مصفوفة الصلاحيات | `POST` | `/permissions/matrix/copy` | موظف | `permissions.matrix.manage` |
| استرجاع مصفوفة الصلاحيات | `POST` | `/permissions/matrix/restore` | موظف | `permissions.matrix.manage` |

## ١٣ · لوحة المعلومات

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| لوحة المعلومات | `GET` | `/dashboard` | موظف | — |
| قائمة المرشد | `GET` | `/dashboard/counselor` | موظف | — |
| قائمة المعلم | `GET` | `/dashboard/teacher` | موظف | — |
| قائمة العدادات | `GET` | `/dashboard/badges` | موظف | — |

## ١٤ · السلوك والمخالفات

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة المخالفات | `GET` | `/behavior/incidents` | موظف | `behavior.view` |
| تفاصيل المخالفات | `GET` | `/behavior/incidents/{id}` | موظف | `behavior.view` |
| قائمة القواعد | `GET` | `/behavior/rules` | موظف | `behavior.view` |
| قائمة التحليلات | `GET` | `/behavior/analytics` | موظف | `behavior.view` |
| إنشاء المخالفات | `POST` | `/behavior/incidents` | موظف | `behavior.incidents.manage` |
| إغلاق المخالفات | `POST` | `/behavior/incidents/{id}/close` | موظف | `behavior.incidents.manage` |
| حذف المخالفات | `DELETE` | `/behavior/incidents/{id}` | موظف | `behavior.incidents.manage` |
| إنشاء القواعد | `POST` | `/behavior/rules` | موظف | `behavior.rules.manage` |
| تعديل القواعد | `PUT` | `/behavior/rules/{id}` | موظف | `behavior.rules.manage` |
| حذف القواعد | `DELETE` | `/behavior/rules/{id}` | موظف | `behavior.rules.manage` |
| تعديل المخالفات | `PUT` | `/behavior/incidents/{id}` | موظف | `behavior.incidents.manage` |

## ١٥ · المهام

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة المهام | `GET` | `/tasks` | موظف | `tasks.view` |
| لوحة كانبان | `GET` | `/tasks/kanban` | موظف | `tasks.view` |
| تفاصيل المهام | `GET` | `/tasks/{id}` | موظف | `tasks.view` |
| إنشاء المهام | `POST` | `/tasks` | موظف | `tasks.manage` |
| تعديل المهام | `PUT` | `/tasks/{id}` | موظف | `tasks.manage` |
| حذف المهام | `DELETE` | `/tasks/{id}` | موظف | `tasks.manage` |
| تبديل الحالة المهام | `POST` | `/tasks/{id}/toggle` | موظف | `tasks.manage` |
| إنشاء الملاحظات | `POST` | `/tasks/{id}/comments` | موظف | `tasks.manage` |
| الملاحظات — لمهمة محدد | `GET` | `/tasks/{id}/comments` | موظف | `tasks.view` |

## ١٦ · الرسائل والواتساب

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة الرسائل النصية | `GET` | `/sms-messages` | موظف | `messages.view` |
| الرصيد | `GET` | `/sms-messages/balance` | موظف | `messages.view` |
| تفاصيل الرسائل النصية | `GET` | `/sms-messages/{id}` | موظف | `messages.view` |
| قائمة حركات البصمة | `GET` | `/sms-messages/transactions` | موظف | `messages.view` |
| حلّ الرسائل النصية | `POST` | `/sms-messages/resolve` | موظف | `messages.send` |
| إرسال الرسائل النصية | `POST` | `/sms-messages/send` | موظف | `messages.send` |
| status | `GET` | `/me/whatsapp/status` | موظف | `messages.send` |
| ربط واتساب | `POST` | `/me/whatsapp/connect` | موظف | `messages.send` |
| رمز QR واتساب | `GET` | `/me/whatsapp/qr` | موظف | `messages.send` |
| فصل واتساب | `POST` | `/me/whatsapp/disconnect` | موظف | `messages.send` |
| تحديث الإعدادات | `PATCH` | `/me/whatsapp/settings` | موظف | `messages.send` |
| اختبار واتساب | `POST` | `/me/whatsapp/test` | موظف | `messages.send` |
| قائمة الرسائل | `GET` | `/messages` | موظف | `messages.view` |
| الرصيد · /messages/balance | `GET` | `/messages/balance` | موظف | `messages.view` |
| تفاصيل الرسائل | `GET` | `/messages/{id}` | موظف | `messages.view` |
| حلّ الرسائل | `POST` | `/messages/resolve` | موظف | `messages.send` |
| إرسال الرسائل | `POST` | `/messages/send` | موظف | `messages.send` |
| قائمة المسودات | `GET` | `/messages/drafts` | موظف | `messages.view` |
| قائمة المجدول | `GET` | `/messages/scheduled` | موظف | `messages.view` |
| قائمة قواعد الإرسال التلقائي | `GET` | `/messages/auto-rules` | موظف | `messages.view` |
| قائمة القوالب | `GET` | `/messages/templates` | موظف | `messages.view` |
| إنشاء المسودات | `POST` | `/messages/drafts` | موظف | `messages.send` |
| تعديل المسودات | `PUT` | `/messages/drafts/{id}` | موظف | `messages.send` |
| حذف المسودات | `DELETE` | `/messages/drafts/{id}` | موظف | `messages.send` |
| إنشاء المجدول | `POST` | `/messages/scheduled` | موظف | `messages.send` |
| تعديل المجدول | `PUT` | `/messages/scheduled/{id}` | موظف | `messages.send` |
| حذف المجدول | `DELETE` | `/messages/scheduled/{id}` | موظف | `messages.send` |
| إنشاء قواعد الإرسال التلقائي | `POST` | `/messages/auto-rules` | موظف | `messages.send` |
| تعديل قواعد الإرسال التلقائي | `PUT` | `/messages/auto-rules/{id}` | موظف | `messages.send` |
| تبديل الحالة قواعد الإرسال التلقائي | `POST` | `/messages/auto-rules/{id}/toggle` | موظف | `messages.send` |
| حذف قواعد الإرسال التلقائي | `DELETE` | `/messages/auto-rules/{id}` | موظف | `messages.send` |
| إنشاء القوالب | `POST` | `/messages/templates` | موظف | `messages.send` |
| تعديل القوالب | `PUT` | `/messages/templates/{id}` | موظف | `messages.send` |
| حذف القوالب | `DELETE` | `/messages/templates/{id}` | موظف | `messages.send` |

## ١٧ · الإشعارات وحالات التسليم

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة الإشعارات | `GET` | `/notifications` | موظف | — |
| عدد غير المقروء | `GET` | `/notifications/unread-count` | موظف | — |
| تعليم كمقروء الإشعارات | `POST` | `/notifications/{id}/read` | موظف | — |
| تعليم الكل كمقروء | `POST` | `/notifications/read-all` | موظف | — |
| قائمة حالات التسليم | `GET` | `/notifications/deliveries` | موظف | `settings.manage` |
| الملخص | `GET` | `/notifications/deliveries/summary` | موظف | `settings.manage` |
| إعادة محاولة الفاشل | `POST` | `/notifications/deliveries/retry-failed` | موظف | `settings.manage` |
| إعادة المحاولة حالات التسليم | `POST` | `/notifications/deliveries/{id}/retry` | موظف | `settings.manage` |

## ١٨ · الاستدعاءات

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة الاستدعاءات | `GET` | `/summons` | موظف | `summons.view` |
| الإحصاءات | `GET` | `/summons/stats` | موظف | `summons.view` |
| تفاصيل الاستدعاءات | `GET` | `/summons/{id}` | موظف | `summons.view` |
| إنشاء الاستدعاءات | `POST` | `/summons` | موظف | `summons.manage` |
| تعديل الاستدعاءات | `PUT` | `/summons/{id}` | موظف | `summons.manage` |
| حذف الاستدعاءات | `DELETE` | `/summons/{id}` | موظف | `summons.manage` |
| إنهاء الاستدعاءات | `POST` | `/summons/{id}/complete` | موظف | `summons.manage` |
| إلغاء الاستدعاءات | `POST` | `/summons/{id}/cancel` | موظف | `summons.manage` |
| تسجيل عدم الحضور الاستدعاءات | `POST` | `/summons/{id}/no-show` | موظف | `summons.manage` |

## ١٩ · الإعدادات والأمان

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة الإعدادات | `GET` | `/settings` | موظف | `settings.manage` |
| قائمة الإشعارات | `GET` | `/settings/notifications` | موظف | `settings.manage` |
| إنشاء الإشعارات | `POST` | `/settings/notifications` | موظف | `settings.manage` |
| مصفوفة الإشعارات | `GET` | `/settings/notification-matrix` | موظف | `settings.manage` |
| تحديث مصفوفة الإشعارات | `PUT` | `/settings/notification-matrix` | موظف | `settings.manage` |
| تحديث قواعد الإشعارات | `PUT` | `/settings/notification-rules` | موظف | `settings.manage` |
| قائمة إدارات التعليم | `GET` | `/settings/education-departments` | موظف | `settings.manage` |
| تحديث الإعدادات | `PUT` | `/settings` | موظف | `settings.manage` |
| تحديث الإشعارات | `PUT` | `/settings/notifications` | موظف | `settings.manage` |
| النشاط | `GET` | `/settings/activity` | موظف | `settings.manage` |
| التفضيلات | `GET` | `/settings/preferences` | موظف | `settings.manage` |
| تحديث التفضيلات | `PUT` | `/settings/preferences` | موظف | `settings.manage` |
| النسخ الاحتياطي | `GET` | `/settings/backup` | موظف | `settings.manage` |
| إنشاء النسخ الاحتياطي | `POST` | `/settings/backup` | موظف | `settings.manage` |
| شعار المدرسة الإعدادات | `POST` | `/settings/logo` | موظف | `settings.manage` |
| الملف الشخصي | `GET` | `/settings/profile` | موظف | — |
| تحديث الملف الشخصي | `PUT` | `/settings/profile` | موظف | — |
| كلمة المرور الملف الشخصي | `PUT` | `/settings/profile/password` | موظف | — |
| الصورة الشخصية الملف الشخصي | `POST` | `/settings/profile/avatar` | موظف | — |
| بدء الملف الشخصي | `POST` | `/settings/profile/phone/start` | موظف | — |
| تأكيد الملف الشخصي | `POST` | `/settings/profile/phone/confirm` | موظف | — |
| قائمة 2fa | `GET` | `/settings/security/2fa` | موظف | — |
| بدء التفعيل 2fa | `POST` | `/settings/security/2fa/start-enable` | موظف | — |
| تأكيد التفعيل 2fa | `POST` | `/settings/security/2fa/confirm-enable` | موظف | — |
| تعطيل 2fa | `POST` | `/settings/security/2fa/disable` | موظف | — |
| قائمة school | `GET` | `/settings/security/2fa/school` | موظف | — |
| تحديث school | `PUT` | `/settings/security/2fa/school` | موظف | — |
| قائمة الجلسات | `GET` | `/settings/security/sessions` | موظف | — |
| إنهاء بقية الجلسات | `POST` | `/settings/security/sessions/revoke-others` | موظف | — |
| حذف الجلسات | `DELETE` | `/settings/security/sessions/{id}` | موظف | — |
| قائمة سجل الدخول | `GET` | `/settings/security/login-history` | موظف | — |

## ٢٠ · الجدول الدراسي

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة الجدول الدراسي | `GET` | `/schedule` | موظف | `schedule.view` |
| الخاصة بي | `GET` | `/schedule/mine` | موظف | `schedule.view` |
| grid | `GET` | `/schedule/grid` | موظف | `schedule.view` |
| تفاصيل المعلم | `GET` | `/schedule/teacher/{employeeId}` | موظف | `schedule.view` |
| فحص التعارضات | `POST` | `/schedule/check-conflicts` | موظف | `schedule.view` |
| إنشاء الجدول الدراسي | `POST` | `/schedule` | موظف | `schedule.manage` |
| تعديل الجدول الدراسي | `PUT` | `/schedule/{id}` | موظف | `schedule.manage` |
| حذف الجدول الدراسي | `DELETE` | `/schedule/{id}` | موظف | `schedule.manage` |
| الأسبوعي | `GET` | `/schedule/weekly` | موظف | `schedule.view` |

## ٢١ · الهيكل الأكاديمي (الصفوف والحصص والمواد)

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| ربط تلقائي | `POST` | `/school-grades/auto-link` | موظف | — |
| قائمة الصفوف الدراسية | `GET` | `/school-grades` | موظف | — |
| إنشاء الصفوف الدراسية | `POST` | `/school-grades` | موظف | — |
| تفاصيل الصفوف الدراسية | `GET` | `/school-grades/{id}` | موظف | — |
| تعديل الصفوف الدراسية | `PUT` | `/school-grades/{id}` | موظف | — |
| حذف الصفوف الدراسية | `DELETE` | `/school-grades/{id}` | موظف | — |
| قائمة الحصص | `GET` | `/school-periods` | موظف | — |
| إنشاء الحصص | `POST` | `/school-periods` | موظف | — |
| تفاصيل الحصص | `GET` | `/school-periods/{id}` | موظف | — |
| تعديل الحصص | `PUT` | `/school-periods/{id}` | موظف | — |
| حذف الحصص | `DELETE` | `/school-periods/{id}` | موظف | — |
| قائمة المواد | `GET` | `/subjects` | موظف | — |
| إنشاء المواد | `POST` | `/subjects` | موظف | — |
| تفاصيل المواد | `GET` | `/subjects/{id}` | موظف | — |
| تعديل المواد | `PUT` | `/subjects/{id}` | موظف | — |
| حذف المواد | `DELETE` | `/subjects/{id}` | موظف | — |

## ٢٢ · اللجان

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة اللجان | `GET` | `/committees` | موظف | `committees.view` |
| الخاصة بي | `GET` | `/committees/mine` | موظف | `committees.view` |
| تفاصيل اللجان | `GET` | `/committees/{id}` | موظف | `committees.view` |
| إنشاء اللجان | `POST` | `/committees` | موظف | `committees.manage` |
| تعديل اللجان | `PUT` | `/committees/{id}` | موظف | `committees.manage` |
| حذف اللجان | `DELETE` | `/committees/{id}` | موظف | `committees.manage` |
| إنشاء الأعضاء | `POST` | `/committees/{id}/members` | موظف | `committees.manage` |
| حذف الأعضاء | `DELETE` | `/committees/{id}/members/{employeeId}` | موظف | `committees.manage` |
| إنشاء المهام | `POST` | `/committees/{id}/tasks` | موظف | `committees.manage` |
| تعديل المهام | `PUT` | `/committees/{id}/tasks/{taskId}` | موظف | `committees.manage` |
| حذف المهام | `DELETE` | `/committees/{id}/tasks/{taskId}` | موظف | `committees.manage` |
| إنشاء الملفات | `POST` | `/committees/{id}/files` | موظف | `committees.manage` |
| حذف الملفات | `DELETE` | `/committees/{id}/files/{fileId}` | موظف | `committees.manage` |
| الأعضاء — للجنة محدد | `GET` | `/committees/{id}/members` | موظف | `committees.view` |
| الملفات — للجنة محدد | `GET` | `/committees/{id}/files` | موظف | `committees.view` |
| تنزيل الملفات | `GET` | `/committees/{id}/files/{fileId}/download` | موظف | `committees.view` |
| المهام — للجنة محدد | `GET` | `/committees/{id}/tasks` | موظف | `committees.view` |
| الاجتماعات — للجنة محدد | `GET` | `/committees/{id}/meetings` | موظف | `committees.view` |
| إنشاء الاجتماعات | `POST` | `/committees/{id}/meetings` | موظف | `committees.manage` |
| تعديل الاجتماعات | `PUT` | `/committees/{id}/meetings/{meetingId}` | موظف | `committees.manage` |
| حذف الاجتماعات | `DELETE` | `/committees/{id}/meetings/{meetingId}` | موظف | `committees.manage` |

## ٢٣ · التقارير

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة القوالب | `GET` | `/reports/templates` | موظف | `reports.view` |
| السجل | `GET` | `/reports/history` | موظف | `reports.view` |
| قائمة المجدول | `GET` | `/reports/scheduled` | موظف | `reports.view` |
| إنشاء القوالب | `POST` | `/reports/templates` | موظف | `reports.generate` |
| تعديل القوالب | `PUT` | `/reports/templates/{id}` | موظف | `reports.generate` |
| حذف القوالب | `DELETE` | `/reports/templates/{id}` | موظف | `reports.generate` |
| توليد التقارير | `POST` | `/reports/generate` | موظف | `reports.generate` |
| إنشاء المجدول | `POST` | `/reports/scheduled` | موظف | `reports.generate` |
| تعديل المجدول | `PUT` | `/reports/scheduled/{id}` | موظف | `reports.generate` |
| حذف المجدول | `DELETE` | `/reports/scheduled/{id}` | موظف | `reports.generate` |
| تنزيل التقارير | `GET` | `/reports/{id}/download` | موظف | `reports.view` |

## ٢٤ · النماذج والاستبيانات

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة النماذج | `GET` | `/forms` | موظف | `forms.view` |
| تفاصيل النماذج | `GET` | `/forms/{id}` | موظف | `forms.view` |
| الردود — لنموذج محدد | `GET` | `/forms/{formId}/responses` | موظف | `forms.view` |
| إنشاء النماذج | `POST` | `/forms` | موظف | `forms.manage` |
| تعديل النماذج | `PUT` | `/forms/{id}` | موظف | `forms.manage` |
| حذف النماذج | `DELETE` | `/forms/{id}` | موظف | `forms.manage` |
| الأسئلة — لنموذج محدد | `GET` | `/forms/{id}/questions` | موظف | `forms.view` |
| إنشاء الأسئلة | `POST` | `/forms/{id}/questions` | موظف | `forms.manage` |
| تعديل الأسئلة | `PUT` | `/forms/{id}/questions/{questionId}` | موظف | `forms.manage` |
| حذف الأسئلة | `DELETE` | `/forms/{id}/questions/{questionId}` | موظف | `forms.manage` |
| إعادة الترتيب الأسئلة | `POST` | `/forms/{id}/questions/reorder` | موظف | `forms.manage` |
| الإحصاءات — لالردود محدد | `GET` | `/forms/{formId}/responses/stats` | موظف | `forms.view` |
| تصدير الردود | `GET` | `/forms/{formId}/responses/export` | موظف | `forms.view` |

## ٢٥ · ملف الإنجاز

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة ملف الإنجاز | `GET` | `/portfolio` | موظف | `portfolio.view` |
| الخاصة بي | `GET` | `/portfolio/mine` | موظف | `portfolio.view` |
| تفاصيل ملف الإنجاز | `GET` | `/portfolio/{id}` | موظف | `portfolio.view` |
| الوثائق — لملف إنجاز محدد | `GET` | `/portfolio/{id}/documents` | موظف | `portfolio.view` |
| تنزيل الوثائق | `GET` | `/portfolio/{id}/documents/{docId}/download` | موظف | `portfolio.view` |
| الملاحظات التقييمية — لملف إنجاز محدد | `GET` | `/portfolio/{id}/feedback` | موظف | `portfolio.view` |
| إنشاء الوثائق | `POST` | `/portfolio/{id}/documents` | موظف | `portfolio.view` |
| حذف الوثائق | `DELETE` | `/portfolio/{id}/documents/{docId}` | موظف | `portfolio.view` |
| إنشاء ملف الإنجاز | `POST` | `/portfolio` | موظف | `portfolio.manage` |
| تعديل ملف الإنجاز | `PUT` | `/portfolio/{id}` | موظف | `portfolio.manage` |
| حذف ملف الإنجاز | `DELETE` | `/portfolio/{id}` | موظف | `portfolio.manage` |
| تذكير جماعي ملف الإنجاز | `POST` | `/portfolio/bulk-reminders` | موظف | `portfolio.manage` |
| إنشاء الملاحظات التقييمية | `POST` | `/portfolio/{id}/feedback` | موظف | `portfolio.manage` |
| اعتماد ملف الإنجاز | `POST` | `/portfolio/{id}/approve` | موظف | `portfolio.manage` |
| إرسال تذكير ملف الإنجاز | `POST` | `/portfolio/{id}/reminder` | موظف | `portfolio.manage` |
| قائمة تصنيفات ملف الإنجاز | `GET` | `/portfolio-categories` | موظف | `portfolio.view` |
| إنشاء تصنيفات ملف الإنجاز | `POST` | `/portfolio-categories` | موظف | `portfolio.manage` |
| تعديل تصنيفات ملف الإنجاز | `PUT` | `/portfolio-categories/{id}` | موظف | `portfolio.manage` |
| حذف تصنيفات ملف الإنجاز | `DELETE` | `/portfolio-categories/{id}` | موظف | `portfolio.manage` |

## ٢٦ · الاختبارات وتوزيع اللجان

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة الاختبارات | `GET` | `/exams` | موظف | `exams.view` |
| تفاصيل الاختبارات | `GET` | `/exams/{id}` | موظف | `exams.view` |
| المقاعد — لاختبار محدد | `GET` | `/exams/{sessionId}/seats` | موظف | `exams.view` |
| إنشاء الاختبارات | `POST` | `/exams` | موظف | `exams.manage` |
| تعديل الاختبارات | `PUT` | `/exams/{id}` | موظف | `exams.manage` |
| حذف الاختبارات | `DELETE` | `/exams/{id}` | موظف | `exams.manage` |
| إنشاء القاعات | `POST` | `/exams/{sessionId}/rooms` | موظف | `exams.manage` |
| حذف القاعات | `DELETE` | `/exams/{sessionId}/rooms/{roomId}` | موظف | `exams.manage` |
| تنفيذ التوزيع الاختبارات | `POST` | `/exams/{sessionId}/distribute` | موظف | `exams.manage` |
| قائمة الجلسات | `GET` | `/exam-dist/sessions` | موظف | `exams.view` |
| تفاصيل الجلسات | `GET` | `/exam-dist/sessions/{id}` | موظف | `exams.view` |
| المقاعد — لجلسة محدد | `GET` | `/exam-dist/sessions/{sessionId}/seats` | موظف | `exams.view` |
| قائمة القاعات | `GET` | `/exam-dist/rooms` | موظف | `exams.view` |
| بحث المقاعد | `GET` | `/exam-dist/seats/search` | موظف | `exams.view` |
| إنشاء الجلسات | `POST` | `/exam-dist/sessions` | موظف | `exams.manage` |
| تعديل الجلسات | `PUT` | `/exam-dist/sessions/{id}` | موظف | `exams.manage` |
| حذف الجلسات | `DELETE` | `/exam-dist/sessions/{id}` | موظف | `exams.manage` |
| تنفيذ التوزيع الجلسات | `POST` | `/exam-dist/sessions/{sessionId}/distribute` | موظف | `exams.manage` |
| نقل المقاعد | `PATCH` | `/exam-dist/seats/{seatId}/move` | موظف | `exams.manage` |
| إنشاء القاعات · /exam-dist/rooms | `POST` | `/exam-dist/rooms` | موظف | `exams.manage` |
| تعديل القاعات | `PUT` | `/exam-dist/rooms/{roomId}` | موظف | `exams.manage` |
| حذف القاعات · /exam-dist/rooms/:id | `DELETE` | `/exam-dist/rooms/{roomId}` | موظف | `exams.manage` |

## ٢٧ · الطلاب المعرَّضون للخطر

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة الطلاب المعرَّضين للخطر | `GET` | `/at-risk` | موظف | `at_risk.view` |
| الملخص | `GET` | `/at-risk/summary` | موظف | `at_risk.view` |
| قائمة الإعدادات | `GET` | `/at-risk/settings` | موظف | `at_risk.view` |
| تشغيل التقييم | `POST` | `/at-risk/run-assessment` | موظف | `at_risk.view` |
| تحديث الإعدادات | `PUT` | `/at-risk/settings` | موظف | `at_risk.view` أو `at_risk.manage` |
| تفاصيل الطلاب المعرَّضين للخطر | `GET` | `/at-risk/{id}` | موظف | `at_risk.view` |
| خطط التدخل — لحالة محدد | `GET` | `/at-risk/{id}/interventions` | موظف | `at_risk.view` |
| إنشاء خطط التدخل | `POST` | `/at-risk/{id}/interventions` | موظف | `at_risk.view` |
| تعديل خطط التدخل | `PUT` | `/at-risk/{id}/interventions/{stepId}` | موظف | `at_risk.view` |
| الملاحظات الطلاب المعرَّضين للخطر | `PUT` | `/at-risk/{id}/notes` | موظف | `at_risk.view` |
| الخط الزمني — لحالة محدد | `GET` | `/at-risk/{id}/timeline` | موظف | `at_risk.view` |
| إنشاء الخط الزمني | `POST` | `/at-risk/{id}/timeline` | موظف | `at_risk.view` |
| إشعار الطلاب المعرَّضين للخطر | `POST` | `/at-risk/notify` | موظف | `at_risk.view` |

## ٢٨ · التكامل ونظام نور

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة التكاملات | `GET` | `/integrations` | موظف | — |
| إنشاء التكاملات | `POST` | `/integrations` | موظف | — |
| تفاصيل التكاملات | `GET` | `/integrations/{id}` | موظف | — |
| تعديل التكاملات | `PUT` | `/integrations/{id}` | موظف | — |
| حذف التكاملات | `DELETE` | `/integrations/{id}` | موظف | — |
| تحديث الربط | `PUT` | `/integrations/{id}/mappings` | موظف | — |
| مزامنة التكاملات | `POST` | `/integrations/{id}/sync` | موظف | — |
| السجلات — لتكامل محدد | `GET` | `/integrations/{id}/logs` | موظف | — |
| status | `GET` | `/noor/status` | موظف | `settings.manage` |
| مزامنة نظام نور | `POST` | `/noor/sync` | موظف | `settings.manage` |
| قائمة السجلات | `GET` | `/noor/logs` | موظف | `settings.manage` |
| المعلّق — لتكامل محدد | `GET` | `/integrations/{id}/pending` | موظف | `settings.manage` |
| تعديل المعلّق | `POST` | `/integrations/{id}/pending/{pendingId}` | موظف | `settings.manage` |
| اختبار التكاملات | `POST` | `/integrations/{id}/test` | موظف | `settings.manage` |
| webhook — لتكامل محدد | `GET` | `/integrations/{id}/webhook` | موظف | `settings.manage` |
| إعادة توليد webhook | `POST` | `/integrations/{id}/webhook/regenerate` | موظف | `settings.manage` |

## ٢٩ · الموارد البشرية

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| الملف الشخصي — لموظف محدد | `GET` | `/hr/employees/{id}/profile` | موظف | `hr.employee.profile.view` |
| تحديث الملف الشخصي | `PUT` | `/hr/employees/{id}/profile` | موظف | `hr.employee.job.manage` |
| العقود — لموظف محدد | `GET` | `/hr/employees/{id}/contracts` | موظف | `hr.contract.renew.view,hr.employee.profile.view` |
| إنشاء العقود | `POST` | `/hr/employees/{id}/contracts` | موظف | `hr.contract.renew.manage` |
| تجديد العقود | `POST` | `/hr/contracts/{id}/renew` | موظف | `hr.contract.renew.manage` |
| إنهاء العقود | `POST` | `/hr/contracts/{id}/end` | موظف | `hr.contract.renew.manage` |
| قائمة الحضور | `GET` | `/hr/attendance` | موظف | `hr.attendance.manual.view` |
| الحضور — لموظف محدد | `GET` | `/hr/employees/{id}/attendance` | موظف | `hr.attendance.manual.view` |
| إنشاء الحضور | `POST` | `/hr/attendance` | موظف | `hr.attendance.manual.manage` |
| تعليم الجميع حاضرين | `POST` | `/hr/attendance/mark-all-present` | موظف | `hr.attendance.manual.manage` |
| اعتماد الحضور | `POST` | `/hr/attendance/approve` | موظف | `hr.attendance.approve.manage` |
| قائمة تنبيهات انتهاء الوثائق | `GET` | `/hr/expiry-alerts` | موظف | `hr.expiry_alerts.view` |
| تجاهل تنبيهات انتهاء الوثائق | `POST` | `/hr/expiry-alerts/{id}/dismiss` | موظف | `hr.expiry_alerts.view` |
| تعديل القواعد | `PUT` | `/hr/expiry-alerts/rules/{kind}` | موظف | `hr.contract.renew.manage` |
| قائمة الأنواع | `GET` | `/hr/leaves/types` | موظف | `hr.self.leave.view,hr.leave.decide.view` |
| الخاصة بي | `GET` | `/hr/leaves/mine` | موظف | `hr.self.leave.view,hr.leave.decide.view` |
| إنشاء الإجازات | `POST` | `/hr/leaves` | موظف | `hr.self.leave.manage` |
| إلغاء الإجازات | `POST` | `/hr/leaves/{id}/cancel` | موظف | `hr.self.leave.manage` |
| إنشاء المرفقات | `POST` | `/hr/leaves/{id}/attachments` | موظف | `hr.self.leave.manage` |
| قائمة الإجازات | `GET` | `/hr/leaves` | موظف | `hr.leave.decide.view` |
| الأثر — لإجازة محدد | `GET` | `/hr/leaves/{id}/impact` | موظف | `hr.leave.decide.view` |
| بتّ الإجازات | `POST` | `/hr/leaves/{id}/decide` | موظف | `hr.leave.decide.manage` |
| حسابي | `GET` | `/hr/me` | موظف | `hr.self.profile.view` |
| إنشاء الحضور · /hr/me/attendance | `POST` | `/hr/me/attendance` | موظف | `hr.self.attendance.manage` |
| قائمة التقارير | `GET` | `/hr/reports` | موظف | `hr.reports.view` |
| تصدير التقارير | `GET` | `/hr/reports/export` | موظف | `hr.reports.view` |
| قائمة الانتدابات | `GET` | `/hr/substitutions` | موظف | `hr.leave.decide.view` |
| المرشحين — لانتداب محدد | `GET` | `/hr/substitutions/{id}/candidates` | موظف | `hr.leave.decide.view` |
| إسناد الانتدابات | `POST` | `/hr/substitutions/{id}/assign` | موظف | `hr.leave.decide.manage` |
| اعتذار الانتدابات | `POST` | `/hr/substitutions/{id}/decline` | موظف | `hr.leave.decide.manage` |
| الوثائق — لموظف محدد | `GET` | `/hr/employees/{id}/documents` | موظف | `hr.documents.view` |
| إنشاء الوثائق | `POST` | `/hr/employees/{id}/documents` | موظف | `hr.documents.manage` |
| تعديل الوثائق | `PUT` | `/hr/documents/{id}` | موظف | `hr.documents.manage` |
| حذف الوثائق | `DELETE` | `/hr/documents/{id}` | موظف | `hr.documents.manage` |
| إنشاء المرفقات | `POST` | `/hr/documents/{id}/attachments` | موظف | `hr.documents.manage` |
| حذف المرفقات | `DELETE` | `/hr/documents/{id}/attachments/{attachmentId}` | موظف | `hr.documents.manage` |

## ٣٠ · الواجبات

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة التحليلات | `GET` | `/homework/analytics` | موظف | `homework.analytics.view` |
| قائمة الطلاب المتعثرين | `GET` | `/homework/analytics/struggling` | موظف | `homework.analytics.view` |
| قائمة خطط المتابعة | `GET` | `/homework/followup` | موظف | `homework.followup.view` |
| إنشاء خطط المتابعة | `POST` | `/homework/followup` | موظف | `homework.followup.manage` |
| تعديل خطط المتابعة | `PUT` | `/homework/followup/{plan}` | موظف | `homework.followup.manage` |
| سياسة الواجبات | `GET` | `/homework/policy` | موظف | `homework.policy.view` |
| تحديث سياسة الواجبات | `PUT` | `/homework/policy` | موظف | `homework.policy.manage` |
| تحديث التنبيهات | `PUT` | `/homework/policy/alerts` | موظف | `homework.policy.manage` |
| قائمة الواجبات | `GET` | `/homework` | موظف | `homework.assignment.view` |
| قائمة الفصول | `GET` | `/homework/classes` | موظف | `homework.assignment.view` |
| تفاصيل الواجبات | `GET` | `/homework/{id}` | موظف | `homework.assignment.view` |
| الأسئلة — لواجب محدد | `GET` | `/homework/{id}/questions` | موظف | `homework.assignment.view` |
| إنشاء الواجبات | `POST` | `/homework` | موظف | `homework.assignment.manage` |
| نشر الواجبات | `POST` | `/homework/{id}/publish` | موظف | `homework.assignment.manage` |
| تذكير الواجبات | `POST` | `/homework/{id}/remind` | موظف | `homework.assignment.manage` |
| إنشاء المرفقات | `POST` | `/homework/{id}/attachments` | موظف | `homework.assignment.manage` |
| تعديل الواجبات | `PUT` | `/homework/{id}` | موظف | `homework.assignment.edit.manage` |
| حذف الواجبات | `DELETE` | `/homework/{id}` | موظف | `homework.assignment.edit.manage` |
| إغلاق الواجبات | `POST` | `/homework/{id}/close` | موظف | `homework.assignment.edit.manage` |
| تحديث الأسئلة | `PUT` | `/homework/{id}/questions` | موظف | `homework.assignment.edit.manage` |
| التسليمات — لواجب محدد | `GET` | `/homework/{id}/submissions` | موظف | `homework.submissions.view` |
| السجل — لتسليم محدد | `GET` | `/homework/{id}/submissions/{submissionId}/history` | موظف | `homework.submissions.view` |
| تفاصيل التسليمات | `GET` | `/homework/{id}/submissions/{submissionId}` | موظف | `homework.submissions.view` |
| تعديل التسليمات | `PUT` | `/homework/{id}/submissions/{submissionId}` | موظف | `homework.grade.manage` |
| اعتماد ونشر الدرجات التسليمات | `POST` | `/homework/{id}/submissions/release` | موظف | `homework.grade.manage` |
| إعادة فتح التسليمات | `POST` | `/homework/{id}/submissions/{submissionId}/reopen` | موظف | `homework.grade.manage` |
| ملف التغذية الراجعة التسليمات | `POST` | `/homework/{id}/submissions/{submissionId}/feedback-file` | موظف | `homework.grade.manage` |
| حذف التسليمات | `DELETE` | `/homework/{id}/submissions/{submissionId}/feedback-file/{attachmentId}` | موظف | `homework.grade.manage` |
| مسح نتيجة التشابه التسليمات | `POST` | `/homework/{id}/submissions/{submissionId}/clear-similarity` | موظف | `homework.grade.manage` |

## ٣١ · المالية

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة الإعدادات | `GET` | `/finance/settings` | موظف | `finance.reports.view` |
| تحديث الإعدادات | `PUT` | `/finance/settings` | موظف | `settings.manage` |
| سياسة التحصيل | `GET` | `/finance/collection-policy` | موظف | `finance.reports.view` |
| تحديث سياسة التحصيل | `PUT` | `/finance/collection-policy` | موظف | `finance.reports.view,settings.manage` |
| قائمة أنواع الرسوم | `GET` | `/finance/fee-types` | موظف | `finance.fee_types.view` |
| إنشاء أنواع الرسوم | `POST` | `/finance/fee-types` | موظف | `finance.fee_types.manage` |
| تعديل أنواع الرسوم | `PUT` | `/finance/fee-types/{id}` | موظف | `finance.fee_types.manage` |
| حذف أنواع الرسوم | `DELETE` | `/finance/fee-types/{id}` | موظف | `finance.fee_types.manage` |
| قائمة هياكل الرسوم | `GET` | `/finance/fee-structures` | موظف | `finance.fee_structure.view` |
| إنشاء هياكل الرسوم | `POST` | `/finance/fee-structures` | موظف | `finance.fee_structure.manage` |
| نسخ من سنة سابقة هياكل الرسوم | `POST` | `/finance/fee-structures/copy-year` | موظف | `finance.fee_structure.manage` |
| إرسال للاعتماد هياكل الرسوم | `POST` | `/finance/fee-structures/submit` | موظف | `finance.fee_structure.manage` |
| تعديل هياكل الرسوم | `PUT` | `/finance/fee-structures/{id}` | موظف | `finance.fee_structure.manage` |
| حذف هياكل الرسوم | `DELETE` | `/finance/fee-structures/{id}` | موظف | `finance.fee_structure.manage` |
| قائمة fee-structures-summary | `GET` | `/finance/fee-structures-summary` | موظف | `finance.fee_structure.approve.view` |
| اعتماد هياكل الرسوم | `POST` | `/finance/fee-structures/approve` | موظف | `finance.fee_structure.approve.manage` |
| إعادة فتح هياكل الرسوم | `POST` | `/finance/fee-structures/reopen` | موظف | `finance.fee_structure.approve.manage` |
| إعادة هياكل الرسوم | `POST` | `/finance/fee-structures/return` | موظف | `finance.fee_structure.approve.manage` |
| قائمة قواعد الخصم | `GET` | `/finance/discount-rules` | موظف | `finance.fee_types.view` |
| إنشاء قواعد الخصم | `POST` | `/finance/discount-rules` | موظف | `finance.fee_types.manage` |
| تعديل قواعد الخصم | `PUT` | `/finance/discount-rules/{id}` | موظف | `finance.fee_types.manage` |
| حذف قواعد الخصم | `DELETE` | `/finance/discount-rules/{id}` | موظف | `finance.fee_types.manage` |
| قائمة الطلاب | `GET` | `/finance/students` | موظف | `finance.payment_status.view` |
| الملف الشخصي — لطالب محدد | `GET` | `/finance/students/{studentId}/profile` | موظف | `finance.payment_status.view` |
| الفواتير — لطالب محدد | `GET` | `/finance/students/{studentId}/invoices` | موظف | `finance.payment_status.view` |
| المدفوعات — لطالب محدد | `GET` | `/finance/students/{studentId}/payments` | موظف | `finance.payment_status.view` |
| كشف الحساب — لطالب محدد | `GET` | `/finance/students/{studentId}/ledger` | موظف | `finance.payment_status.view` |
| معاينة الفواتير | `POST` | `/finance/students/{studentId}/invoices/preview` | موظف | `finance.invoice.manage` |
| إنشاء الفواتير | `POST` | `/finance/students/{studentId}/invoices` | موظف | `finance.invoice.manage` |
| الإعفاءات — لطالب محدد | `GET` | `/finance/students/{studentId}/exemptions` | موظف | `finance.payment_status.view` |
| إنشاء الإعفاءات | `POST` | `/finance/students/{studentId}/exemptions` | موظف | `finance.discount.approve.manage` |
| حذف الإعفاءات | `DELETE` | `/finance/students/{studentId}/exemptions/{id}` | موظف | `finance.discount.approve.manage` |
| قائمة الفواتير | `GET` | `/finance/invoices` | موظف | `finance.payment_status.view` |
| تفاصيل الفواتير | `GET` | `/finance/invoices/{invoiceId}` | موظف | `finance.payment_status.view` |
| إصدار الفواتير | `POST` | `/finance/invoices/{invoiceId}/issue` | موظف | `finance.invoice.manage` |
| إبطال الفواتير | `POST` | `/finance/invoices/{invoiceId}/void` | موظف | `finance.invoice.manage` |
| إنشاء المدفوعات | `POST` | `/finance/invoices/{invoiceId}/payments` | موظف | `finance.payment.record.manage` |
| contract — لفاتورة محدد | `GET` | `/finance/invoices/{invoiceId}/contract` | موظف | `finance.payment_status.view` |
| قائمة الخطط | `GET` | `/finance/plans` | موظف | `finance.installment_plan.view` |
| إنشاء الخطط | `POST` | `/finance/plans` | موظف | `finance.installment_plan.manage` |
| تعديل الخطط | `PUT` | `/finance/plans/{id}` | موظف | `finance.installment_plan.manage` |
| حذف الخطط | `DELETE` | `/finance/plans/{id}` | موظف | `finance.installment_plan.manage` |
| الأقساط — لفاتورة محدد | `GET` | `/finance/invoices/{invoiceId}/installments` | موظف | `finance.payment_status.view` |
| معاينة plan | `POST` | `/finance/invoices/{invoiceId}/plan/preview` | موظف | `finance.installment_plan.manage` |
| إنشاء plan | `POST` | `/finance/invoices/{invoiceId}/plan` | موظف | `finance.installment_plan.manage` |
| إنشاء change | `POST` | `/finance/invoices/{invoiceId}/plan/change` | موظف | `finance.installment_plan.manage` |
| تفاصيل الأقساط | `GET` | `/finance/installments/{id}` | موظف | `finance.payment_status.view` |
| تأجيل الأقساط | `POST` | `/finance/installments/{id}/defer` | موظف | `finance.installment.defer.manage` |
| تعديل مبلغ الأقساط | `POST` | `/finance/installments/{id}/amend` | موظف | `finance.installment_plan.manage` |
| إعفاء من غرامة التأخير الأقساط | `POST` | `/finance/installments/{id}/waive-late-fee` | موظف | `finance.late_fee.waive.manage` |
| لوحة المعلومات | `GET` | `/finance/dashboard` | موظف | `finance.reports.view` |
| أعمار الديون | `GET` | `/finance/reports/aging` | موظف | `finance.reports.view` |
| تفاصيل التقارير | `GET` | `/finance/reports/{report}` | موظف | `finance.reports.view` |
| قائمة المتأخرات | `GET` | `/finance/overdue` | موظف | `finance.reports.view` |
| كشف الحساب — لولي أمر محدد | `GET` | `/finance/guardians/{guardianId}/statement` | موظف | `finance.payment_status.view` |
| قائمة المدفوعات | `GET` | `/finance/payments` | موظف | `finance.payment_status.view` |
| بانتظار المطابقة المدفوعات | `GET` | `/finance/payments/awaiting-reconcile` | موظف | `finance.payment.reconcile.view` |
| مطابقة المدفوعات | `POST` | `/finance/payments/{paymentId}/reconcile` | موظف | `finance.payment.reconcile.manage` |
| رفض المدفوعات | `POST` | `/finance/payments/{paymentId}/reject` | موظف | `finance.payment.reconcile.manage` |
| إنشاء الاسترجاعات | `POST` | `/finance/payments/{paymentId}/refunds` | موظف | `finance.payment.refund.view` |
| الإيصال — لدفعة محدد | `GET` | `/finance/payments/{paymentId}/receipt` | موظف | `finance.payment_status.view` |
| قائمة الاسترجاعات | `GET` | `/finance/refunds` | موظف | `finance.payment.refund.view` |
| اعتماد الاسترجاعات | `POST` | `/finance/refunds/{refundId}/approve` | موظف | `finance.payment.refund.manage` |
| رفض الاسترجاعات | `POST` | `/finance/refunds/{refundId}/reject` | موظف | `finance.payment.refund.manage` |
| تفاصيل المرفقات | `GET` | `/finance/attachments/{id}` | موظف | `finance.payment_status.view` |
| تنزيل المرفقات | `GET` | `/finance/attachments/{id}/download` | موظف | `finance.payment_status.view` |
| حذف المرفقات | `DELETE` | `/finance/attachments/{id}` | موظف | `finance.payment.reconcile.manage` |
| قائمة طلبات الاعتماد | `GET` | `/finance/requests` | موظف | `finance.discount.request.view,finance.discount.approve.view` |
| إنشاء طلبات الاعتماد | `POST` | `/finance/requests` | موظف | `finance.discount.request.manage` |
| تفاصيل طلبات الاعتماد | `GET` | `/finance/requests/{id}` | موظف | `finance.discount.request.view,finance.discount.approve.view` |
| اعتماد طلبات الاعتماد | `POST` | `/finance/requests/{id}/approve` | موظف | `finance.discount.approve.manage` |
| رفض طلبات الاعتماد | `POST` | `/finance/requests/{id}/reject` | موظف | `finance.discount.approve.manage` |
| طلب إيضاح طلبات الاعتماد | `POST` | `/finance/requests/{id}/clarify` | موظف | `finance.discount.approve.manage` |
| إعادة الإرسال طلبات الاعتماد | `POST` | `/finance/requests/{id}/resubmit` | موظف | `finance.discount.request.manage` |
| قائمة التحصيل | `GET` | `/finance/collection` | موظف | `finance.collection.view` |
| قائمة وعود السداد | `GET` | `/finance/collection/promises` | موظف | `finance.collection.view` |
| تسوية وعود السداد | `POST` | `/finance/collection/promises/settle` | موظف | `finance.collection.manage` |
| الأنشطة التحصيل | `POST` | `/finance/collection/activities` | موظف | `finance.collection.manage` |
| تفاصيل أولياء الأمور | `GET` | `/finance/collection/guardians/{guardianId}` | موظف | `finance.collection.view` |
| قائمة الشرائح | `GET` | `/finance/reminders/segments` | موظف | `finance.reminder.view` |
| معاينة التذكيرات | `POST` | `/finance/reminders/preview` | موظف | `finance.reminder.view` |
| إرسال التذكيرات | `POST` | `/finance/reminders/send` | موظف | `finance.reminder.manage` |
| قائمة الحملات | `GET` | `/finance/reminders/campaigns` | موظف | `finance.reminder.view` |
| قائمة حالات التسليم | `GET` | `/finance/reminders/deliveries` | موظف | `finance.reminder.view` |
| إعادة المحاولة حالات التسليم | `POST` | `/finance/reminders/deliveries/{id}/retry` | موظف | `finance.reminder.manage` |
| إعادة محاولة الكل | `POST` | `/finance/reminders/deliveries/retry-all` | موظف | `finance.reminder.manage` |
| قائمة بوابات الدفع | `GET` | `/finance/gateways` | موظف | `platform.gateway.link.view` |
| تعديل بوابات الدفع | `PUT` | `/finance/gateways/{provider}` | موظف | `platform.gateway.link.manage` |
| تحقق | `POST` | `/finance/gateways/{provider}/verify` | موظف | `platform.gateway.link.manage` |
| قائمة خطاطيف الويب | `GET` | `/finance/gateways/webhooks` | موظف | `platform.gateway.monitor.view` |
| إعادة المحاولة خطاطيف الويب | `POST` | `/finance/gateways/webhooks/{id}/retry` | موظف | `platform.gateway.monitor.manage` |
| قائمة روابط الدفع | `GET` | `/finance/pay-links` | موظف | `finance.pay_link.view` |
| إنشاء روابط الدفع | `POST` | `/finance/pay-links` | موظف | `finance.pay_link.manage` |
| إلغاء روابط الدفع | `POST` | `/finance/pay-links/{id}/cancel` | موظف | `finance.pay_link.manage` |
| قائمة التقسيط عبر المزوّد | `GET` | `/finance/bnpl` | موظف | `finance.settlement.view` |
| المتاح التقسيط عبر المزوّد | `GET` | `/finance/bnpl/available` | موظف | `finance.payment_status.view` |
| إنشاء التقسيط عبر المزوّد | `POST` | `/finance/bnpl` | موظف | `finance.payment.record.manage` |
| مزامنة التقسيط عبر المزوّد | `POST` | `/finance/bnpl/{id}/sync` | موظف | `finance.payment_status.view` |
| إلغاء التقسيط عبر المزوّد | `POST` | `/finance/bnpl/{id}/cancel` | موظف | `finance.payment.refund.manage` |
| قائمة التسويات | `GET` | `/finance/settlements` | موظف | `finance.settlement.view` |
| معاينة التسويات | `POST` | `/finance/settlements/preview` | موظف | `finance.settlement.view` |
| إنشاء التسويات | `POST` | `/finance/settlements` | موظف | `finance.settlement.manage` |
| مطابقة التسويات | `POST` | `/finance/settlements/{id}/match` | موظف | `finance.settlement.manage` |

## ٣٢ · سجل العمليات

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| قائمة سجل العمليات | `GET` | `/audit-log` | موظف | `audit.view` |
| تصدير سجل العمليات | `GET` | `/audit-log/export` | موظف | `audit.view` |
| تفاصيل سجل العمليات | `GET` | `/audit-log/{id}` | موظف | `audit.view` |
| تراجع سجل العمليات | `POST` | `/audit-log/{id}/revert` | موظف | `audit.revert.manage` |

## ٣٣ · المرفقات

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| تفاصيل المرفقات | `GET` | `/attachments/{id}` | موظف | — |
| تنزيل المرفقات | `GET` | `/attachments/{id}/download` | موظف | — |

## ٣٤ · لوحة مالك المنصة

| النقطة | الطريقة | المسار | التوكن | الصلاحية |
|---|---|---|---|---|
| دخول مالك المنصة | `POST` | `/platform/auth/login` | عام | — |
| حسابي | `GET` | `/platform/me` | منصة | — |
| تسجيل الخروج | `POST` | `/platform/logout` | منصة | — |
| النظرة العامة | `GET` | `/platform/overview` | منصة | — |
| قائمة المدارس | `GET` | `/platform/schools` | منصة | — |
| قائمة المزوّدين | `GET` | `/platform/providers` | منصة | — |
| قائمة خطاطيف الويب | `GET` | `/platform/webhooks` | منصة | — |
| إعادة محاولة الكل | `POST` | `/platform/webhooks/retry-all` | منصة | — |
| إعادة المحاولة خطاطيف الويب | `POST` | `/platform/webhooks/{id}/retry` | منصة | — |
| permission-matrix | `GET` | `/platform/permission-matrix` | منصة | — |