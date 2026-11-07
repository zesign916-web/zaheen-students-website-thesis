import { useState, useMemo, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  Search, ArrowLeft, ChevronRight, BookOpen, GraduationCap, Building2,
  Briefcase, Plus, X, Loader2, User, Send, Star,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import { brandAsset } from "@/lib/brand-assets";
interface CommunityQuestion {
  id: number;
  text: string;
  section: string;
  createdAt: string;
  userName?: string | null;
  answer?: string | null;
  [key: string]: unknown;
}

/* ─── Static questions per section (50 each) ─── */

const STATIC_QUESTIONS_UR: Record<string, string[]> = {
  school: [
    "پاکستان کے سرکاری اسکولوں میں میٹرک داخلے کی ضروریات کیا ہیں؟",
    "فیڈرل بورڈ (FBISE) اور پنجاب بورڈ (BISE) میں کیا فرق ہے؟",
    "میٹرک بورڈ امتحانات کی مؤثر تیاری کیسے کی جائے؟",
    "میٹرک سائنس گروپ میں لازمی اور اختیاری مضامین کون سے ہیں؟",
    "پاکستان میں میٹرک میں پاسنگ مارکس کا معیار کیا ہے؟",
    "پاکستان میں مستقبل کے لیے O-لیولز یا میٹرک میں سے کون سا بہتر ہے؟",
    "پاکستان کے بورڈ امتحانات میں گریڈنگ سسٹم کیسے کام کرتا ہے؟",
    "بورڈ امتحان کا رول نمبر سلپ کیسے حاصل کریں؟",
    "نویں جماعت میں سائنس اور آرٹس گروپ میں سے کیسے انتخاب کریں؟",
    "بورڈ کے ساتھ پرائیویٹ اسکول رجسٹریشن کا فیس ڈھانچہ کیا ہے؟",
    "آن لائن میٹرک نتائج کیسے چیک کریں؟",
    "اسکول چھوڑنے کا سرٹیفکیٹ کیسے حاصل کریں اور اس کا استعمال کیا ہے؟",
    "آغا خان بورڈ اور پنجاب بورڈ میں کیا فرق ہے؟",
    "اگر ایک مضمون میں فیل ہو جاؤں تو میٹرک امتحان میں دوبارہ کیسے شامل ہوں؟",
    "سال کے وسط میں ایک اسکول سے دوسرے اسکول میں منتقلی کا عمل کیا ہے؟",
    "سرکاری اسکول میں فیس میں رعایت یا وظیفے کے لیے درخواست کیسے دیں؟",
    "سرکاری بمقابلہ نجی اسکول میں پڑھنے کے کیا فوائد ہیں؟",
    "پاکستانی اسکولوں میں مستقل تشخیصی نظام کیسے کام کرتا ہے؟",
    "سندھ بورڈ (BISE کراچی) کیا ہے اور یہ دوسرے بورڈز سے کیسے مختلف ہے؟",
    "اصل میٹرک سرٹیفکیٹ کھو جانے پر نقل کیسے حاصل کریں؟",
    "پاکستان میں میٹرک سرٹیفکیٹ آن لائن کیسے تصدیق کریں؟",
    "لاہور میں میٹرک طلباء کے لیے بہترین کوچنگ اکیڈمیاں کون سی ہیں؟",
    "میٹرک میں کم نمبر آنے پر گریڈ بہتر کیسے کریں؟",
    "میٹرک میں سالانہ اور ضمنی امتحانات میں کیا فرق ہے؟",
    "کیا داخلے کے بعد میٹرک مضامین تبدیل کیے جا سکتے ہیں؟",
    "پرائیویٹ طالب علم کے طور پر میٹرک امتحان دینے کا عمل کیا ہے؟",
    "معذوری کی صورت میں میٹرک میں چھوٹ کے لیے درخواست کیسے دیں؟",
    "خیبر پختونخوا بورڈ آف ایجوکیشن کیا ہے اور اس کا امتحانی شیڈول کیا ہے؟",
    "بلوچستان بورڈ آف سیکنڈری ایجوکیشن کیسے کام کرتا ہے؟",
    "میٹرک پارٹ 1 (نویں جماعت) کے امتحانات کے لیے رجسٹریشن کے مراحل کیا ہیں؟",
    "بیرون ممالک کے لیے میٹرک مساوات سرٹیفکیٹ کیسے حاصل کریں؟",
    "میٹرک میں کامرس اور سائنس گروپ میں کیا فرق ہے؟",
    "میٹرک امتحانات کے لیے دوبارہ جانچ اور ری ویلیوایشن کا عمل کیسے کام کرتا ہے؟",
    "یک قومی نصاب (SNC) میں کون سے نئے مضامین شامل کیے گئے ہیں؟",
    "یک قومی نصاب پاکستان میں میٹرک طلباء کو کیسے متاثر کرتا ہے؟",
    "علامہ اقبال اوپن یونیورسٹی کیا ہے اور کیا میٹرک طلباء اس سے فائدہ اٹھا سکتے ہیں؟",
    "پاکستان میں میٹرک کی تیاری کے لیے اچھا پرائیویٹ ٹیوٹر کیسے تلاش کریں؟",
    "سرکاری اسکولوں میں صبح اور شام کی شفٹ کا نظام کیسے کام کرتا ہے؟",
    "اسکولی تعلیم میں نیشنل کریکولم کونسل کا کیا کردار ہے؟",
    "بطور طالب علم قومی اولمپیاڈ اور سائنس مقابلوں میں کیسے شرکت کریں؟",
    "اسلام آباد میں گورنمنٹ ہائی اسکول داخلے کا معیار کیا ہے؟",
    "وزیراعظم فیس ریمبرسمنٹ اسکیم کے لیے کیسے درخواست دیں؟",
    "پاکستان میں میٹرک مکمل کرنے کے بعد کیریئر کے کیا مواقع ہیں؟",
    "میٹرک طالب علم کے طور پر امتحانی دباؤ اور اضطراب سے کیسے نمٹیں؟",
    "بورڈ سرٹیفکیٹ اور ٹرانسکرپٹ میں کیا فرق ہے؟",
    "اسکول طلباء کے لیے احساس تعلیمی وظیفے کے لیے کیسے درخواست دیں؟",
    "پاکستان سٹیزن شپ ایجوکیشن مضمون کیا ہے اور یہ کیوں ضروری ہے؟",
    "میٹرک بورڈ امتحانات کے ریاضی حصے کی تیاری کیسے کریں؟",
    "راولپنڈی اور اسلام آباد کے بہترین سرکاری اسکول کون سے ہیں؟",
    "میٹرک میں نتیجہ بہتری امتحان (کمپارٹمنٹ) کیسے کام کرتا ہے؟",
  ],
  colleges: [
    "پاکستان کے بہترین انٹرمیڈیٹ کالج کون سے ہیں؟",
    "گورنمنٹ کالج یونیورسٹی (GCU) لاہور میں داخلہ کیسے ملے گا؟",
    "فورمن کرسچن کالج لاہور کا فیس ڈھانچہ کیا ہے؟",
    "FSc پری میڈیکل اور پری انجینئرنگ میں کون سے مضامین ہیں؟",
    "HSSC انٹرمیڈیٹ بورڈ امتحانات کی تیاری کیسے کریں؟",
    "ICS، FSc اور FA میں کیا فرق ہے؟",
    "پاکستان میں یونیورسٹی داخلوں کے لیے A-لیولز اور FSc کا موازنہ کیسے ہوتا ہے؟",
    "یونیورسٹی ایگریگیٹ حساب میں انٹرمیڈیٹ نمبروں کا کیا کردار ہے؟",
    "کراچی میں سائنس پروگراموں کے بہترین کالج کون سے ہیں؟",
    "انٹرمیڈیٹ تعلیم کے دوران وظائف کے لیے کیسے درخواست دیں؟",
    "میٹرک نتائج کے بعد کالج داخلے کا عمل کیا ہے؟",
    "کیا FSc پرائیویٹ امیدوار کے طور پر کی جا سکتی ہے؟",
    "FSc پارٹ 1 اور FSc پارٹ 2 میں کیا فرق ہے؟",
    "پاکستان میں ایک کالج سے دوسرے کالج میں منتقلی کیسے ہوتی ہے؟",
    "کالج داخلوں کے لیے میرٹ لسٹ نظام کیسے کام کرتا ہے؟",
    "سائنس (FSc) کے بجائے ہیومینٹیز (FA) کرنے کے کیا فوائد ہیں؟",
    "انٹرمیڈیٹ طلباء کے لیے احساس وظیفے کے لیے کیسے درخواست دیں؟",
    "HSSC-I اور HSSC-II امتحانات میں کیا فرق ہے؟",
    "اسلام آباد ماڈل کالجز میں داخلہ کیسے ملے گا؟",
    "انٹرمیڈیٹ نتائج کی دوبارہ جانچ کا عمل کیا ہے؟",
    "پری میڈیکل اور پری انجینئرنگ میں سے کیسے انتخاب کریں؟",
    "انٹرمیڈیٹ امتحانات کے لیے کون سے کوچنگ انسٹیٹیوٹ بہترین تیاری کراتے ہیں؟",
    "سرکاری ڈگری کالجز میں فیس ڈھانچہ کیا ہے؟",
    "ڈگری کالجز میں ہاسٹل سہولیات کے لیے کیسے درخواست دیں؟",
    "کیا پرائیویٹ طالب علم کے طور پر گھر سے پڑھ کر کالج امتحان دیا جا سکتا ہے؟",
    "پنجاب کے کون سے کالج میرٹ بنیاد پر مکمل فنڈڈ پروگرام پیش کرتے ہیں؟",
    "انٹرمیڈیٹ فیل ہو جانے پر گریڈ کیسے بہتر کریں؟",
    "گورنمنٹ ڈگری کالج اور یونیورسٹی کالج میں کیا فرق ہے؟",
    "انٹرمیڈیٹ طلباء کے لیے PEEF وظیفے کے لیے کیسے درخواست دیں؟",
    "FSc کے بعد یونیورسٹی داخلے کے لیے کم از کم کتنے فیصد چاہیے؟",
    "پاکستان میں کالج درخواست کو کیا سرگرمیاں مضبوط بناتی ہیں؟",
    "پنجاب کالج سسٹم کیا ہے اور یہ سرکاری کالجز سے کیسے مختلف ہے؟",
    "انٹرمیڈیٹ میں ایک شعبے سے دوسرے شعبے میں کیسے تبدیلی کریں؟",
    "FSc نصاب میں کمپیوٹر سائنس کا کیا کردار ہے؟",
    "کراچی میں کامرس طلباء کے بہترین کالج کون سے ہیں؟",
    "انٹرمیڈیٹ کے بعد FA طلباء کا کیریئر راستہ کیا ہے؟",
    "ICS وِد فزکس اور ICS وِد سٹیٹسٹکس میں کیا فرق ہے؟",
    "قائد اعظم میرٹ اسکالرشپ کے لیے کیسے درخواست دیں؟",
    "اسلام آباد میں پری میڈیکل طلباء کے بہترین کالج کون سے ہیں؟",
    "کالجز میں سمسٹر نظام اور سالانہ نظام میں کیا فرق ہے؟",
    "کالج کا انتخاب مستقبل کے کیریئر پر کیا اثر ڈالتا ہے؟",
    "انٹرمیڈیٹ پڑھتے ہوئے MDCAT کی تیاری کیسے کریں؟",
    "FSc کے دوران انجینئرنگ یونیورسٹی داخلہ ٹیسٹ کی تیاری کیسے کریں؟",
    "انٹرمیڈیٹ بورڈ امتحانات کے لیے بہترین مطالعہ تکنیکیں کیا ہیں؟",
    "کیا انٹرمیڈیٹ طلباء پاکستان میں انٹرنشپ یا پارٹ ٹائم نوکری کر سکتے ہیں؟",
    "یونیورسٹی داخلے کے لیے کالج سے اچھا سفارشی خط کیسے حاصل کریں؟",
    "پشاور میں انٹرمیڈیٹ سائنس طلباء کے بہترین کالج کون سے ہیں؟",
    "انٹرمیڈیٹ مطالعہ اور داخلہ ٹیسٹ کی تیاری کے درمیان وقت کا انتظام کیسے کریں؟",
    "FSc طلباء کے لیے پنجاب یونیورسٹیوں کا ایگریگیٹ فارمولہ کیا ہے؟",
    "پاکستان میں انٹرمیڈیٹ مکمل کرنے کے بعد کیریئر کے کیا مواقع ہیں؟",
  ],
  university: [
    "کمپیوٹر سائنس کے لیے NUST داخلے کی ضروریات کیا ہیں؟",
    "LUMS میں انڈرگریجویٹ پروگرامز کے لیے درخواست کیسے دیں؟",
    "پاکستان میں بہترین انجینئرنگ پروگرام کون سی یونیورسٹیوں میں ہیں؟",
    "HEC بیرون ملک وظیفہ پروگرام کیسے کام کرتا ہے؟",
    "پاکستان میں MBBS داخلے کے لیے میرٹ کتنا ہوتا ہے؟",
    "یونیورسٹی داخلے کے لیے اپنا ایگریگیٹ کیسے حساب کریں؟",
    "CS کے لیے COMSATS اور FAST میں کیا فرق ہے؟",
    "پاکستانی یونیورسٹیوں میں ہاسٹل سہولیات کے لیے کیسے درخواست دیں؟",
    "HEC کے PhD مواقع اور وظائف کیا ہیں؟",
    "کام کرنے والے طلباء کے لیے کون سی یونیورسٹیاں شام کے پروگرام پیش کرتی ہیں؟",
    "UET لاہور کے انجینئرنگ پروگراموں کے لیے کیسے درخواست دیں؟",
    "IBA کا ایپٹیٹیوڈ ٹیسٹ کیا ہے اور اس کی تیاری کیسے کریں؟",
    "انجینئرنگ کے لیے NUST اور UET میں کیا فرق ہے؟",
    "HEC ضرورت بنیاد وظیفے کے لیے کیسے درخواست دیں؟",
    "آغا خان یونیورسٹی میڈیکل کالج میں داخلہ کیسے ہوتا ہے؟",
    "NUMS داخلہ ٹیسٹ کیا ہے اور اس کی تیاری کیسے کریں؟",
    "پاکستان میں بزنس ایڈمنسٹریشن کے لیے بہترین یونیورسٹیاں کون سی ہیں؟",
    "پاکستانی یونیورسٹیوں کو منظم کرنے میں HEC کا کیا کردار ہے؟",
    "پاکستانی یونیورسٹیوں میں PhD بذریعہ تحقیق پروگرام کیسے کام کرتا ہے؟",
    "پاکستان میں سرکاری اور نجی یونیورسٹی میں کیا فرق ہے؟",
    "پاکستان سے کامن ویلتھ اسکالرشپ کے لیے کیسے درخواست دیں؟",
    "HEC سے ڈگری مساوات حاصل کرنے کا عمل کیا ہے؟",
    "HEC وظائف پر کون سی بین الاقوامی یونیورسٹیاں پاکستانی طلباء کو قبول کرتی ہیں؟",
    "پوسٹ گریجویٹ داخلوں کے لیے GAT جنرل ٹیسٹ کی تیاری کیسے کریں؟",
    "SAT کیا ہے اور یہ بین الاقوامی یونیورسٹی داخلوں کے لیے کیسے مددگار ہے؟",
    "پاکستان سے بیرون ملک تعلیم کے لیے اسٹوڈنٹ ویزا کیسے حاصل کریں؟",
    "پاکستان میں لاء پروگراموں کے لیے بہترین یونیورسٹیاں کون سی ہیں؟",
    "پاکستان سے بیرون ملک MBBS پروگرام کیسے کام کرتا ہے؟",
    "USAT ٹیسٹ کیا ہے اور کون سی یونیورسٹیاں اسے استعمال کرتی ہیں؟",
    "سوشل سائنسز کے لیے قائد اعظم یونیورسٹی میں داخلے کیسے لیں؟",
    "ڈیزائن اور میڈیا تعلیم میں SZABIST کا کیا کردار ہے؟",
    "پاکستان میں بہترین میڈیکل پروگرام کون سی یونیورسٹیوں میں ہیں؟",
    "فل برائٹ اسکالرشپ کیا ہے اور پاکستانی اس کے لیے کیسے درخواست دیتے ہیں؟",
    "پاکستانی یونیورسٹی سے بین الاقوامی یونیورسٹی میں منتقلی کیسے کریں؟",
    "PhD تعلیم کے لیے HEC اوورسیز اسکالرشپ کیا ہے؟",
    "اوسط تعلیمی ریکارڈ کے ساتھ ٹاپ یونیورسٹی میں داخلہ کیسے حاصل کریں؟",
    "پاکستان میں کمپیوٹر سائنس گریجویٹس کے کیریئر کے امکانات کیا ہیں؟",
    "جامعہ کراچی میں فیس ڈھانچہ کیا ہے؟",
    "BBA اور BS بزنس ایڈمنسٹریشن میں اہم فرق کیا ہیں؟",
    "کون سی پاکستانی یونیورسٹیوں میں بین الاقوامی ایکسچینج پروگرام ہیں؟",
    "NCA یا NED یونیورسٹی میں آرکیٹیکچر کیسے کریں؟",
    "QS رینکنگ کیا ہے اور پاکستانی یونیورسٹیاں کہاں کھڑی ہیں؟",
    "پاکستانی یونیورسٹی میں داخلے کے فیصلے کے خلاف اپیل کیسے کریں؟",
    "NUST NETS، FAST NU اور IBA داخلہ ٹیسٹ کی تیاری کے لیے بہترین وسائل کیا ہیں؟",
    "NUST یا LUMS میں رہائش کے لیے کیسے درخواست دیں؟",
    "پاکستانی تعلیم میں پنجاب یونیورسٹی کا کیا کردار ہے؟",
    "پاکستان میں BS کمپیوٹر سائنس کے بعد کیریئر کے کیا مواقع ہیں؟",
    "پاکستان اینڈوؤمنٹ فنڈ اسکالرشپ کے لیے کیسے درخواست دیں؟",
    "BS 4 سالہ اور پرانے 2 سالہ BSc پروگراموں میں کیا فرق ہے؟",
    "MBBS داخلے کے لیے MDCAT میڈیکل داخلہ ٹیسٹ کی تیاری کیسے کریں؟",
  ],
  government: [
    "پنجاب میں PPSC امتحانات کی تیاری کیسے کریں؟",
    "CSS مسابقتی امتحان کے لیے اہلیت کا معیار کیا ہے؟",
    "CSS اور PMS امتحانات میں کیا فرق ہے؟",
    "FPSC نوکریوں کے لیے آن لائن درخواست کیسے دیں؟",
    "CSS کی تیاری کے لیے بہترین کتابیں کون سی ہیں؟",
    "پاکستان میں CSS امتحان کے لیے کتنی کوششیں کی جا سکتی ہیں؟",
    "گریڈ 17 سے 22 سول سرونٹس کا تنخواہ ڈھانچہ کیا ہے؟",
    "کابینہ سیکرٹریٹ بھرتی کا عمل کیسے کام کرتا ہے؟",
    "NTS ٹیسٹ کیا ہے اور اس کی تیاری کیسے کریں؟",
    "پاکستان میں آرمی سویلین نوکریوں کے لیے کیسے درخواست دیں؟",
    "سرکاری عہدوں کے لیے OTS انتخاب کا عمل کیا ہے؟",
    "پاکستان کی سول سروس میں ترقی کا نظام کیسے کام کرتا ہے؟",
    "BPS-17 اور BPS-18 عہدوں میں کیا فرق ہے؟",
    "SPSC (سندھ پبلک سروس کمیشن) امتحانات کی تیاری کیسے کریں؟",
    "KPK پبلک سروس کمیشن کیا ہے اور درخواست کیسے دیں؟",
    "فیڈرل بورڈ آف ریونیو (FBR) نوکریوں کے لیے کیسے درخواست دیں؟",
    "پولیس سروس آف پاکستان (PSP) کا انتخاب کا عمل کیا ہے؟",
    "اسٹیٹ بینک آف پاکستان میں نوکریوں کے لیے کیسے درخواست دیں؟",
    "سول سروس بمقابلہ نجی شعبے میں کام کرنے کے کیا فوائد ہیں؟",
    "سرکاری نوکری کے امیدواروں کے لیے طبی معائنہ کیسے ہوتا ہے؟",
    "سول سروس میں محکمہ جاتی ترقی کمیٹی (DPC) کیا ہے؟",
    "انٹیلی جنس بیورو (IB) کے تحریری ٹیسٹ کی تیاری کیسے کریں؟",
    "CSS اور فارن سروس آف پاکستان میں کیا فرق ہے؟",
    "CSS کلیئر کرنے کے بعد گروپ الاٹمنٹ کا عمل کیا ہے؟",
    "CSS اور PMS کی تیاری کے بہترین کوچنگ انسٹیٹیوٹ کون سے ہیں؟",
    "ریلوے وزارت میں نوکریوں کے لیے کیسے درخواست دیں؟",
    "سرکاری نوکریوں کے لیے ڈومیسائل سرٹیفکیٹ حاصل کرنے کا عمل کیا ہے؟",
    "پاکستان نیوی سویلین عہدوں کے لیے کیسے درخواست دیں؟",
    "تنخواہ اور وقار کے لحاظ سے پاکستان کی بہترین سرکاری نوکریاں کون سی ہیں؟",
    "KPK میں سرکاری نوکریوں کے لیے ETEA ٹیسٹ کیا ہے؟",
    "واپڈا نوکریوں کے لیے کیسے درخواست دیں؟",
    "گزٹڈ اور نان گزٹڈ افسر میں کیا فرق ہے؟",
    "کسٹمز اور انکم ٹیکس انسپکٹر ٹیسٹ کی تیاری کیسے کریں؟",
    "فیڈرل پبلک سروس کمیشن (FPSC) ٹیسٹ کا نصاب کیا ہے؟",
    "اپنی FPSC درخواست کی حیثیت آن لائن کیسے چیک کریں؟",
    "CSS لازمی مضمون کی ضرورت اور نمبروں کی تقسیم کیا ہے؟",
    "NTS ٹیسٹ کے ورڈ ریزننگ حصے کی تیاری کیسے کریں؟",
    "بلوچستان پبلک سروس کمیشن امتحانات میں شامل ہونے کا عمل کیا ہے؟",
    "AJK (آزاد جموں و کشمیر) سرکاری نوکریوں کے لیے کیسے درخواست دیں؟",
    "گریڈ 18 سرکاری افسر کو کیا مراعات اور الاؤنسز ملتے ہیں؟",
    "تازہ ترین تنخواہ نظر ثانی کے بعد پاکستان کی سول سروس تنخواہوں کا موازنہ کیسے ہے؟",
    "CSS امتحانات کے کرنٹ افیئرز حصے کے لیے کیسے پڑھیں؟",
    "پاکستان ایڈمنسٹریٹیو سروس (PAS) کیا ہے اور اس میں شامل کیسے ہوں؟",
    "نوجوان گریجویٹس کے لیے سب سے زیادہ مانگ والے سرکاری محکمے کون سے ہیں؟",
    "آنے والے PPSC اور FPSC امتحانات کی تاریخوں کی معلومات کیسے حاصل کریں؟",
    "سرکاری نوکری درخواست دہندگان کے لیے بیک گراؤنڈ تصدیق کا عمل کیا ہے؟",
    "سرکاری نوکریوں میں میرٹ بمقابلہ ڈومیسائل کوٹہ نظام کیسے کام کرتا ہے؟",
    "سرکاری سروس نظم و ضبط میں PEEDA ایکٹ کا کیا کردار ہے؟",
    "CSS امتحانات کے پبلک فنانس حصے کی تیاری کیسے کریں؟",
    "پاکستان ایئر فورس سویلین عہدوں کے لیے کیسے درخواست دیں؟",
  ],
};

const STATIC_QUESTIONS: Record<string, string[]> = {
  school: [
    "What are the requirements for matric admission in government schools in Pakistan?",
    "What is the difference between Federal Board (FBISE) and Punjab Board (BISE)?",
    "How do I prepare for matric board exams effectively?",
    "What subjects are compulsory and optional in matric science group?",
    "What are the passing marks criteria for matric in Pakistan?",
    "Which is better for the future: O-levels or Matric in Pakistan?",
    "How does the grading system work in Pakistan's board exams?",
    "How do I apply for a board examination roll number slip?",
    "How do I choose between science and arts group in class 9?",
    "What is the fee structure for private school registration with boards?",
    "How do I check my matric result online?",
    "How do I get a school leaving certificate and what is it used for?",
    "What is the difference between Aga Khan Board and Punjab Board?",
    "How do I re-appear in a matric exam if I fail one subject?",
    "What is the process for transferring from one school to another mid-year?",
    "How do I apply for a fee concession or scholarship in a government school?",
    "What are the benefits of studying in a government school vs private school?",
    "How does the continuous assessment system work in Pakistan schools?",
    "What is the Sindh Board (BISE Karachi) and how does it differ from other boards?",
    "How do I get a duplicate matric certificate if I lose the original?",
    "How do I verify my matric certificate online in Pakistan?",
    "What are the best coaching academies for matric students in Lahore?",
    "How do I improve my grades if I scored low in matric?",
    "What is the difference between annual and supplementary exams in matric?",
    "Can I change my matric subjects after enrollment?",
    "What is the process for appearing in matric exams as a private student?",
    "How do I apply for an exemption in matric if I have a disability?",
    "What is the Khyber Pakhtunkhwa Board of Education and its exam schedule?",
    "How does the Balochistan Board of Secondary Education operate?",
    "What are the steps to register for Matric Part 1 (9th grade) exams?",
    "How do I get my matric equivalence certificate for foreign countries?",
    "What is the difference between Commerce and Science groups in matric?",
    "How does the rechecking and revaluation process work for matric exams?",
    "What are the new subjects introduced in the Single National Curriculum (SNC)?",
    "How does the Single National Curriculum affect matric students in Pakistan?",
    "What is the Allama Iqbal Open University and can matric students benefit from it?",
    "How do I find a good private tutor for matric preparation in Pakistan?",
    "How does the morning and evening shift system work in government schools?",
    "What is the role of the National Curriculum Council in school education?",
    "How do I participate in national Olympiads and science competitions as a student?",
    "What is the Government High School admission criteria in Islamabad?",
    "How do I apply for the Prime Minister's Fee Reimbursement Scheme?",
    "What are the career options available after completing matric in Pakistan?",
    "How do I handle exam stress and anxiety as a matric student?",
    "What is the difference between a Board Certificate and a Transcript?",
    "How do I apply for the Ehsaas Education Stipend for school students?",
    "What is the Pakistan Citizenship Education subject and why is it important?",
    "How do I prepare for the Mathematics portion of matric board exams?",
    "What are the top government schools in Rawalpindi and Islamabad?",
    "How does the result improvement exam (compartment) work in matric?",
  ],
  colleges: [
    "What are the top intermediate colleges in Pakistan?",
    "How do I get admission in Government College University (GCU) Lahore?",
    "What is the fee structure of Forman Christian College Lahore?",
    "What subjects are in FSc Pre-Medical and Pre-Engineering?",
    "How do I prepare for HSSC intermediate board exams?",
    "What is the difference between ICS, FSc, and FA?",
    "How do A-levels compare to FSc for university admissions in Pakistan?",
    "What is the role of intermediate marks in university aggregate calculation?",
    "Which colleges offer the best science programs in Karachi?",
    "How do I apply for scholarships during intermediate studies?",
    "What is the college admission process after matric results?",
    "Can I do FSc privately as a private candidate in Pakistan?",
    "What is the difference between FSc Part 1 and FSc Part 2?",
    "How do I transfer from one college to another in Pakistan?",
    "How does the merit list system work for college admissions?",
    "What are the benefits of doing humanities (FA) over science (FSc)?",
    "How do I apply for the Ehsaas Scholarship for intermediate students?",
    "What is the difference between HSSC-I and HSSC-II exams?",
    "How do I get admission in Islamabad Model Colleges?",
    "What is the process for rechecking intermediate results?",
    "How do I choose between Pre-Medical and Pre-Engineering?",
    "What coaching institutes prepare students best for intermediate exams?",
    "What is the fee structure in government degree colleges?",
    "How do I apply for hostel facilities in degree colleges?",
    "Can I study from home and appear in college exams as a private student?",
    "Which colleges in Punjab offer merit-based fully funded programs?",
    "How do I improve my grades if I failed intermediate exams?",
    "What is the difference between a Government Degree College and a University College?",
    "How do I apply for the PEEF Scholarship for intermediate students?",
    "What is the minimum percentage for university admission after FSc?",
    "What extracurricular activities strengthen a college application in Pakistan?",
    "What is the Punjab College system and how does it differ from government colleges?",
    "How do I switch from one stream (Science to Arts) in intermediate?",
    "What is the role of computer science in FSc curriculum?",
    "What are the top colleges in Karachi for commerce students?",
    "What is the career path for FA students after intermediate?",
    "What is the difference between ICS with Physics and ICS with Statistics?",
    "How do I apply for the Quaid-e-Azam Merit Scholarship?",
    "What are the best colleges in Islamabad for Pre-Medical students?",
    "How does the semester system differ from the annual system in colleges?",
    "What impact does college choice have on future career prospects?",
    "How do I prepare for MDCAT while studying in intermediate?",
    "How do I prepare for engineering university entry tests during FSc?",
    "What are the best study techniques for intermediate board exams?",
    "Can intermediate students get internships or part-time jobs in Pakistan?",
    "How do I get a good reference letter from my college for university admission?",
    "What are the top colleges in Peshawar for intermediate science students?",
    "How do I manage time between intermediate studies and entry test preparation?",
    "What is the aggregate formula used by Punjab universities for FSc students?",
    "What are the career options available after completing intermediate in Pakistan?",
  ],
  university: [
    "What are NUST admission requirements for Computer Science?",
    "How do I apply to LUMS for undergraduate programs?",
    "Which universities in Pakistan have the best engineering programs?",
    "How does the HEC foreign scholarship program work?",
    "What is the merit for MBBS admission in Pakistan?",
    "How do I calculate my aggregate for university admission?",
    "What is the difference between COMSATS and FAST for CS?",
    "How do I apply for hostel facilities in Pakistani universities?",
    "What PhD opportunities and HEC scholarships are available?",
    "Which universities offer evening programs for working students?",
    "How do I apply for UET Lahore engineering programs?",
    "What is the IBA aptitude test and how should I prepare?",
    "What is the difference between NUST and UET for engineering?",
    "How do I apply for the HEC Need-Based Scholarship?",
    "How does Aga Khan University Medical College admissions work?",
    "What is the NUMS entry test and how do I prepare for it?",
    "What are the top universities in Pakistan for Business Administration?",
    "What is the role of the HEC in regulating Pakistani universities?",
    "How does the PhD by research program work at Pakistani universities?",
    "What is the difference between a Public and a Private University in Pakistan?",
    "How do I apply for the Commonwealth Scholarship from Pakistan?",
    "What is the process for getting a degree equivalence from HEC?",
    "Which international universities accept Pakistani students on HEC scholarships?",
    "How do I prepare for the GAT General test for postgraduate admissions?",
    "What is the SAT and how does it help for international university admissions?",
    "How do I apply for a student visa from Pakistan for studying abroad?",
    "What are the best universities in Pakistan for Law programs?",
    "How does the MBBS abroad program from Pakistan work?",
    "What is the USAT test and which universities use it?",
    "How do I apply to Quaid-i-Azam University for social sciences?",
    "What is the role of SZABIST in design and media education in Pakistan?",
    "Which universities in Pakistan offer the best Medical programs?",
    "What is the Fulbright Scholarship and how do Pakistanis apply?",
    "How do I transfer from a Pakistani university to an international one?",
    "What is the HEC Overseas Scholarship for PhD studies?",
    "How do I get into a top university with an average academic record?",
    "What are the career prospects for Computer Science graduates in Pakistan?",
    "What is the fee structure at the University of Karachi?",
    "What are the key differences between BBA and BS Business Administration?",
    "Which Pakistani universities have international exchange programs?",
    "How does a student pursue architecture at NCA or NED University?",
    "What is the QS ranking and where do Pakistani universities stand?",
    "How do I appeal an admission decision at a Pakistani university?",
    "What are the best resources for NUST NETS, FAST NU, and IBA entry test preparation?",
    "How do I apply for accommodation at NUST or LUMS?",
    "What is the role of the University of the Punjab in Pakistan education?",
    "What are the career options after a BS Computer Science in Pakistan?",
    "How do I apply for the Pakistan Endowment Fund scholarship?",
    "What is the difference between BS 4-year and old 2-year BSc programs?",
    "How do I prepare for the MDCAT medical entry test for MBBS admission?",
  ],
  government: [
    "How do I prepare for PPSC exams in Punjab?",
    "What is the eligibility criteria for the CSS competitive examination?",
    "What is the difference between CSS and PMS exams?",
    "How do I apply for FPSC jobs online?",
    "What are the best books for CSS preparation?",
    "How many attempts are allowed for the CSS exam in Pakistan?",
    "What is the salary structure for Grade 17 to 22 civil servants?",
    "How does the Cabinet Secretariat recruitment process work?",
    "What is the NTS test and how do I prepare for it?",
    "How do I apply for Army civilian jobs in Pakistan?",
    "What is the OTS selection process for government posts?",
    "How does the promotion system work in Pakistan's civil service?",
    "What is the difference between BPS-17 and BPS-18 posts?",
    "How do I prepare for SPSC (Sindh Public Service Commission) exams?",
    "What is the KPK Public Service Commission and how do I apply?",
    "How do I apply for Federal Board of Revenue (FBR) jobs?",
    "What is the selection process for the Police Service of Pakistan (PSP)?",
    "How do I apply for jobs at the State Bank of Pakistan?",
    "What are the benefits of working in the civil service vs private sector?",
    "How does the medical examination work for government job candidates?",
    "What is the Departmental Promotion Committee (DPC) in the civil service?",
    "How do I prepare for the Intelligence Bureau (IB) written test?",
    "What is the difference between CSS and the Foreign Service of Pakistan?",
    "How does the allocation of groups work after clearing CSS?",
    "What are the best coaching institutes for CSS and PMS preparation?",
    "How do I apply for Railway Ministry jobs in Pakistan?",
    "What is the process for obtaining a Domicile Certificate for government jobs?",
    "How do I apply for Pakistan Navy civilian positions?",
    "What are the top government jobs in Pakistan by salary and prestige?",
    "What is the ETEA test for government jobs in KPK?",
    "How do I apply for Wapda (Water and Power Development Authority) jobs?",
    "What is the difference between a gazetted and non-gazetted officer?",
    "How do I prepare for the Customs and Income Tax Inspector test?",
    "What is the Federal Public Service Commission (FPSC) test syllabus?",
    "How do I check the status of my FPSC application online?",
    "What is the CSS compulsory subject requirement and marks distribution?",
    "How do I prepare for the verbal reasoning part of NTS tests?",
    "What is the process for appearing in Balochistan Public Service Commission exams?",
    "How do I apply for AJK (Azad Jammu and Kashmir) government jobs?",
    "What are the perks and allowances for a Grade 18 government officer?",
    "How do Pakistan's civil service salaries compare after the latest pay revision?",
    "How do I study for the Current Affairs portion of CSS exams?",
    "What is the Pakistan Administrative Service (PAS) and how do I join?",
    "What are the most in-demand government departments for young graduates?",
    "How do I get information about upcoming PPSC and FPSC exam dates?",
    "What is the background verification process for government job applicants?",
    "How does the merit vs domicile quota system work in government jobs?",
    "What is the role of PEEDA Act in government service discipline?",
    "How do I prepare for the Public Finance portion of CSS exams?",
    "How do I apply for Pakistan Air Force civilian posts?",
  ],
};

const SECTION_ICONS: Record<string, React.ElementType> = {
  school: BookOpen,
  colleges: GraduationCap,
  university: Building2,
  government: Briefcase,
};

const SECTION_COLORS: Record<string, { color: string; accentBg: string }> = {
  school: { color: "text-blue-500", accentBg: "bg-blue-500/8" },
  colleges: { color: "text-emerald-500", accentBg: "bg-emerald-500/8" },
  university: { color: "text-violet-500", accentBg: "bg-violet-500/8" },
  government: { color: "text-amber-500", accentBg: "bg-amber-500/8" },
};

export default function SectionPage() {
  const params = useParams<{ section: string }>();
  const section = params.section ?? "";
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const staticQuestions = (language === "ur" ? STATIC_QUESTIONS_UR : STATIC_QUESTIONS)[section] ?? [];
  const sectionMeta = t.sectionMeta[section as keyof typeof t.sectionMeta];
  const colors = SECTION_COLORS[section];
  const Icon = SECTION_ICONS[section];

  const [communityQuestions, setCommunityQuestions] = useState<CommunityQuestion[]>([]);
  const [communityLoading, setCommunityLoading] = useState(true);

  type ReviewStats = Record<string, { avgRating: number; count: number }>;
  const [reviewStats, setReviewStats] = useState<ReviewStats>({});

  const fetchCommunity = async () => {
    setCommunityLoading(true);
    try {
      const res = await fetch(`/api/questions?section=${section}`, {
        headers: user?.id ? { "x-user-id": user.id } : {},
      });
      if (res.ok) setCommunityQuestions(await res.json() as CommunityQuestion[]);
    } catch { /* ignore */ }
    setCommunityLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/reviews/aggregates", {
        headers: user?.id ? { "x-user-id": user.id } : {},
      });
      if (res.ok) {
        const data = await res.json() as Array<{ messageContent: string; avgRating: string; reviewCount: number }>;
        const map: ReviewStats = {};
        for (const item of data) {
          map[item.messageContent] = {
            avgRating: parseFloat(item.avgRating ?? "0"),
            count: Number(item.reviewCount),
          };
        }
        setReviewStats(map);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchCommunity(); fetchStats(); }, [section]);

  const [search, setSearch] = useState("");
  const filteredStatic = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? staticQuestions.filter(item => item.toLowerCase().includes(q)) : staticQuestions;
  }, [search, staticQuestions]);

  const filteredCommunity = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? communityQuestions.filter(cq => cq.text.toLowerCase().includes(q)) : communityQuestions;
  }, [search, communityQuestions]);

  const openInChat = (text: string) => {
    localStorage.setItem("zei_pending_prompt", text);
    setLocation("/");
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitQuestion = async () => {
    const text = newQuestion.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user?.id ? { "x-user-id": user.id } : {}),
        },
        body: JSON.stringify({ text, section, userName: user?.name }),
      });
      if (res.ok) {
        const created = await res.json() as CommunityQuestion;
        setCommunityQuestions(prev => [created, ...prev]);
        setNewQuestion("");
        setModalOpen(false);
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  if (!sectionMeta || !colors || !Icon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
        {t.sectionNotFound}{" "}
        <button onClick={() => setLocation("/questions")} className="underline ml-1">{t.goBack}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border/40 px-4 md:px-8 py-3 flex items-center gap-3">
        <button
          onClick={() => setLocation("/questions")}
          className="shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.categories}</span>
        </button>

        <div className="flex-1 relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder(sectionMeta.title)}
            className="w-full pl-8 pr-4 py-2 text-sm rounded-xl border border-border/50 bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50"
          />
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="shrink-0 flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.addQuestion}</span>
        </button>

        <div className="shrink-0 hidden md:flex items-center gap-1.5">
          <img src={brandAsset("zei-logo.png")} alt="" className="w-5 h-5 object-contain opacity-70" />
        </div>
      </div>

      {/* Section header */}
      <div className={cn("px-4 md:px-8 py-6 border-b border-border/30", colors.accentBg)}>
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl bg-background/70", colors.color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{sectionMeta.title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{sectionMeta.description}</p>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-xs text-muted-foreground">{filteredStatic.length + filteredCommunity.length} {t.questionsLabel}</p>
            <p className="text-[10px] text-muted-foreground/60">{communityQuestions.length} {t.fromCommunity}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 md:px-8 py-8 max-w-4xl mx-auto w-full space-y-10">

        {/* Static questions */}
        {filteredStatic.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <img src={brandAsset("zei-logo.png")} alt="" className={cn("w-4 h-4 object-contain opacity-60")} />
              <h2 className="text-sm font-bold text-foreground">{t.featuredQuestions}</h2>
              <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">{filteredStatic.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredStatic.map((q, i) => (
                <button
                  key={i}
                  onClick={() => openInChat(q)}
                  className="group text-left px-4 py-3.5 rounded-2xl border border-border/50 bg-card/60 hover:bg-card hover:border-border hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-2.5">
                    <img src={brandAsset("zei-logo.png")} alt="" className="w-3.5 h-3.5 mt-0.5 shrink-0 object-contain opacity-40 group-hover:opacity-70 transition-opacity" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground/70 group-hover:text-foreground leading-snug transition-colors">{q}</span>
                      {reviewStats[q] && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span className="text-[10px] text-muted-foreground">
                            {reviewStats[q].avgRating.toFixed(1)} ({reviewStats[q].count})
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 mt-0.5 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Community questions */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-muted-foreground/50" />
            <h2 className="text-sm font-bold text-foreground">{t.communityQs}</h2>
            {!communityLoading && (
              <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">{filteredCommunity.length}</span>
            )}
          </div>

          {communityLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCommunity.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-sm text-muted-foreground mb-3">{t.addYourQuestion}</p>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.addQuestion}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredCommunity.map((cq) => (
                <button
                  key={cq.id}
                  onClick={() => openInChat(cq.text)}
                  className="group text-left px-4 py-3.5 rounded-2xl border border-border/50 bg-card/60 hover:bg-card hover:border-border hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-2.5">
                    <User className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground/70 group-hover:text-foreground leading-snug transition-colors">{cq.text}</span>
                      {(cq as any).userName && (
                        <p className="text-[10px] text-muted-foreground/50 mt-0.5">{(cq as any).userName}</p>
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 mt-0.5 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Add question modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="bg-card border border-border/60 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">{t.addYourQuestion}</h3>
              <button onClick={() => setModalOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted/70 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder={t.addQuestionPlaceholder}
              rows={4}
              className="w-full resize-none rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/40 transition-colors mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 text-sm rounded-xl border border-border/50 text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={submitQuestion}
                disabled={!newQuestion.trim() || submitting}
                className="flex-1 py-2.5 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {submitting ? t.submitting : t.submit}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
