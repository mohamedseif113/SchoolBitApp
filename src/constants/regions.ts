export interface City {
  id: string;
  nameAr: string;
  nameEn: string;
  regionId: string;
}

export interface Region {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  cities: City[];
}

export const SAUDI_REGIONS: Region[] = [
  {
    id: '01',
    code: 'riyadh',
    nameAr: 'منطقة الرياض',
    nameEn: 'Riyadh Region',
    cities: [
      { id: '01-01', nameAr: 'الرياض', nameEn: 'Riyadh', regionId: '01' },
      { id: '01-02', nameAr: 'الخرج', nameEn: 'Al-Kharj', regionId: '01' },
      { id: '01-03', nameAr: 'الدرعية', nameEn: 'Diriyah', regionId: '01' },
      { id: '01-04', nameAr: 'الدوادمي', nameEn: 'Ad-Dawadmi', regionId: '01' },
      { id: '01-05', nameAr: 'المجمعة', nameEn: "Al-Majma'ah", regionId: '01' },
      { id: '01-06', nameAr: 'القويعية', nameEn: "Al-Quway'iyah", regionId: '01' },
      { id: '01-07', nameAr: 'وادي الدواسر', nameEn: 'Wadi Ad-Dawasir', regionId: '01' },
      { id: '01-08', nameAr: 'الأفلاج', nameEn: 'Al-Aflaj', regionId: '01' },
      { id: '01-09', nameAr: 'الزلفي', nameEn: 'Az-Zulfi', regionId: '01' },
      { id: '01-10', nameAr: 'شقراء', nameEn: 'Shaqra', regionId: '01' },
      { id: '01-11', nameAr: 'حوطة بني تميم', nameEn: 'Hawtat Bani Tamim', regionId: '01' },
      { id: '01-12', nameAr: 'عفيف', nameEn: 'Afif', regionId: '01' },
      { id: '01-13', nameAr: 'السليل', nameEn: 'As-Sulayyil', regionId: '01' },
      { id: '01-14', nameAr: 'رماح', nameEn: 'Rumah', regionId: '01' },
      { id: '01-15', nameAr: 'ثادق', nameEn: 'Thadiq', regionId: '01' },
      { id: '01-16', nameAr: 'حريملاء', nameEn: 'Huraymila', regionId: '01' },
      { id: '01-17', nameAr: 'الحريق', nameEn: 'Al-Hariq', regionId: '01' },
      { id: '01-18', nameAr: 'الغاط', nameEn: 'Al-Ghat', regionId: '01' },
      { id: '01-19', nameAr: 'مرات', nameEn: 'Marat', regionId: '01' },
      { id: '01-20', nameAr: 'الرين', nameEn: 'Ar-Rayn', regionId: '01' },
      { id: '01-21', nameAr: 'الدلم', nameEn: 'Ad-Dilam', regionId: '01' },
    ],
  },
  {
    id: '02',
    code: 'makkah',
    nameAr: 'منطقة مكة المكرمة',
    nameEn: 'Makkah Region',
    cities: [
      { id: '02-01', nameAr: 'مكة المكرمة', nameEn: 'Makkah', regionId: '02' },
      { id: '02-02', nameAr: 'جدة', nameEn: 'Jeddah', regionId: '02' },
      { id: '02-03', nameAr: 'الطائف', nameEn: 'Taif', regionId: '02' },
      { id: '02-04', nameAr: 'القنفذة', nameEn: 'Al-Qunfudhah', regionId: '02' },
      { id: '02-05', nameAr: 'الليث', nameEn: 'Al-Lith', regionId: '02' },
      { id: '02-06', nameAr: 'رابغ', nameEn: 'Rabigh', regionId: '02' },
      { id: '02-07', nameAr: 'الجموم', nameEn: 'Al-Jumum', regionId: '02' },
      { id: '02-08', nameAr: 'خليص', nameEn: 'Khulais', regionId: '02' },
      { id: '02-09', nameAr: 'الكامل', nameEn: 'Al-Kamil', regionId: '02' },
      { id: '02-10', nameAr: 'الخرمة', nameEn: 'Al-Khurmah', regionId: '02' },
      { id: '02-11', nameAr: 'رنية', nameEn: 'Ranyah', regionId: '02' },
      { id: '02-12', nameAr: 'تربة', nameEn: 'Turbah', regionId: '02' },
      { id: '02-13', nameAr: 'العرضيات', nameEn: 'Al-Ardiyat', regionId: '02' },
      { id: '02-14', nameAr: 'أضم', nameEn: 'Adham', regionId: '02' },
      { id: '02-15', nameAr: 'المويه', nameEn: 'Al-Mawayh', regionId: '02' },
      { id: '02-16', nameAr: 'ميسان', nameEn: 'Maysan', regionId: '02' },
      { id: '02-17', nameAr: 'بحرة', nameEn: 'Bahrah', regionId: '02' },
    ],
  },
  {
    id: '03',
    code: 'madinah',
    nameAr: 'منطقة المدينة المنورة',
    nameEn: 'Madinah Region',
    cities: [
      { id: '03-01', nameAr: 'المدينة المنورة', nameEn: 'Madinah', regionId: '03' },
      { id: '03-02', nameAr: 'ينبع', nameEn: 'Yanbu', regionId: '03' },
      { id: '03-03', nameAr: 'العلا', nameEn: 'Al-Ula', regionId: '03' },
      { id: '03-04', nameAr: 'مهد الذهب', nameEn: 'Mahd Adh-Dhahab', regionId: '03' },
      { id: '03-05', nameAr: 'بدر', nameEn: 'Badr', regionId: '03' },
      { id: '03-06', nameAr: 'خيبر', nameEn: 'Khaybar', regionId: '03' },
      { id: '03-07', nameAr: 'الحناكية', nameEn: 'Al-Hanakiyah', regionId: '03' },
      { id: '03-08', nameAr: 'العيص', nameEn: 'Al-Ays', regionId: '03' },
      { id: '03-09', nameAr: 'وادي الفرع', nameEn: "Wadi Al-Fara'", regionId: '03' },
    ],
  },
  {
    id: '04',
    code: 'eastern',
    nameAr: 'المنطقة الشرقية',
    nameEn: 'Eastern Province',
    cities: [
      { id: '04-01', nameAr: 'الدمام', nameEn: 'Dammam', regionId: '04' },
      { id: '04-02', nameAr: 'الخبر', nameEn: 'Al-Khobar', regionId: '04' },
      { id: '04-03', nameAr: 'الظهران', nameEn: 'Dhahran', regionId: '04' },
      { id: '04-04', nameAr: 'الأحساء', nameEn: 'Al-Ahsa', regionId: '04' },
      { id: '04-05', nameAr: 'حفر الباطن', nameEn: 'Hafar Al-Batin', regionId: '04' },
      { id: '04-06', nameAr: 'الجبيل', nameEn: 'Jubail', regionId: '04' },
      { id: '04-07', nameAr: 'القطيف', nameEn: 'Qatif', regionId: '04' },
      { id: '04-08', nameAr: 'الخفجي', nameEn: 'Khafji', regionId: '04' },
      { id: '04-09', nameAr: 'رأس تنورة', nameEn: 'Ras Tanura', regionId: '04' },
      { id: '04-10', nameAr: 'بقيق', nameEn: 'Buqayq', regionId: '04' },
      { id: '04-11', nameAr: 'النعيرية', nameEn: 'Nairiyah', regionId: '04' },
      { id: '04-12', nameAr: 'قرية العليا', nameEn: 'Qaryat Al-Ulya', regionId: '04' },
      { id: '04-13', nameAr: 'العديد', nameEn: 'Al-Udayd', regionId: '04' },
      { id: '04-14', nameAr: 'البيضاء', nameEn: 'Al-Bayda', regionId: '04' },
    ],
  },
  {
    id: '05',
    code: 'qassim',
    nameAr: 'منطقة القصيم',
    nameEn: 'Al-Qassim Region',
    cities: [
      { id: '05-01', nameAr: 'بريدة', nameEn: 'Buraidah', regionId: '05' },
      { id: '05-02', nameAr: 'عنيزة', nameEn: 'Unaizah', regionId: '05' },
      { id: '05-03', nameAr: 'الرس', nameEn: 'Ar-Rass', regionId: '05' },
      { id: '05-04', nameAr: 'المذنب', nameEn: 'Al-Mithnab', regionId: '05' },
      { id: '05-05', nameAr: 'البكيرية', nameEn: 'Al-Bukayriyah', regionId: '05' },
      { id: '05-06', nameAr: 'البدائع', nameEn: 'Al-Badai', regionId: '05' },
      { id: '05-07', nameAr: 'الأسياح', nameEn: 'Al-Asyah', regionId: '05' },
      { id: '05-08', nameAr: 'النبهانية', nameEn: 'An-Nabhaniyah', regionId: '05' },
      { id: '05-09', nameAr: 'الشماسية', nameEn: 'Ash-Shimasiyah', regionId: '05' },
      { id: '05-10', nameAr: 'عيون الجواء', nameEn: 'Uyun Al-Jiwa', regionId: '05' },
      { id: '05-11', nameAr: 'رياض الخبراء', nameEn: 'Riyadh Al-Khabra', regionId: '05' },
      { id: '05-12', nameAr: 'عقلة الصقور', nameEn: 'Uqlat As-Suqur', regionId: '05' },
      { id: '05-13', nameAr: 'ضرية', nameEn: 'Durayyah', regionId: '05' },
    ],
  },
  {
    id: '06',
    code: 'asir',
    nameAr: 'منطقة عسير',
    nameEn: 'Asir Region',
    cities: [
      { id: '06-01', nameAr: 'أبها', nameEn: 'Abha', regionId: '06' },
      { id: '06-02', nameAr: 'خميس مشيط', nameEn: 'Khamis Mushait', regionId: '06' },
      { id: '06-03', nameAr: 'بيشة', nameEn: 'Bisha', regionId: '06' },
      { id: '06-04', nameAr: 'محايل عسير', nameEn: 'Muhayil Asir', regionId: '06' },
      { id: '06-05', nameAr: 'النماص', nameEn: 'An-Namas', regionId: '06' },
      { id: '06-06', nameAr: 'أحد رفيدة', nameEn: 'Ahad Rafidah', regionId: '06' },
      { id: '06-07', nameAr: 'بارق', nameEn: 'Bariq', regionId: '06' },
      { id: '06-08', nameAr: 'رجال ألمع', nameEn: 'Rijal Alma', regionId: '06' },
      { id: '06-09', nameAr: 'سراة عبيدة', nameEn: 'Sarat Abidah', regionId: '06' },
      { id: '06-10', nameAr: 'تثليث', nameEn: 'Tathlith', regionId: '06' },
      { id: '06-11', nameAr: 'ظهران الجنوب', nameEn: 'Dhahran Al-Janub', regionId: '06' },
      { id: '06-12', nameAr: 'بلقرن', nameEn: 'Balqarn', regionId: '06' },
      { id: '06-13', nameAr: 'المجاردة', nameEn: 'Al-Majardah', regionId: '06' },
      { id: '06-14', nameAr: 'تنومة', nameEn: 'Tanomah', regionId: '06' },
      { id: '06-15', nameAr: 'البرك', nameEn: 'Al-Birk', regionId: '06' },
      { id: '06-16', nameAr: 'الأمواه', nameEn: 'Al-Amwah', regionId: '06' },
      { id: '06-17', nameAr: 'طريب', nameEn: 'Tarib', regionId: '06' },
    ],
  },
  {
    id: '07',
    code: 'tabuk',
    nameAr: 'منطقة تبوك',
    nameEn: 'Tabuk Region',
    cities: [
      { id: '07-01', nameAr: 'تبوك', nameEn: 'Tabuk', regionId: '07' },
      { id: '07-02', nameAr: 'الوجه', nameEn: 'Al-Wajh', regionId: '07' },
      { id: '07-03', nameAr: 'ضباء', nameEn: 'Duba', regionId: '07' },
      { id: '07-04', nameAr: 'تيماء', nameEn: 'Tayma', regionId: '07' },
      { id: '07-05', nameAr: 'أملج', nameEn: 'Umluj', regionId: '07' },
      { id: '07-06', nameAr: 'حقل', nameEn: 'Haql', regionId: '07' },
      { id: '07-07', nameAr: 'البدع', nameEn: 'Al-Bida', regionId: '07' },
    ],
  },
  {
    id: '08',
    code: 'hail',
    nameAr: 'منطقة حائل',
    nameEn: 'Hail Region',
    cities: [
      { id: '08-01', nameAr: 'حائل', nameEn: 'Hail', regionId: '08' },
      { id: '08-02', nameAr: 'بقعاء', nameEn: "Baq'a", regionId: '08' },
      { id: '08-03', nameAr: 'الغزالة', nameEn: 'Al-Ghazalah', regionId: '08' },
      { id: '08-04', nameAr: 'الشنان', nameEn: 'Ash-Shinan', regionId: '08' },
      { id: '08-05', nameAr: 'الشملي', nameEn: 'Ash-Shamli', regionId: '08' },
      { id: '08-06', nameAr: 'سميراء', nameEn: 'Sumaira', regionId: '08' },
      { id: '08-07', nameAr: 'موقق', nameEn: 'Mawqaq', regionId: '08' },
      { id: '08-08', nameAr: 'الحائط', nameEn: 'Al-Hayit', regionId: '08' },
      { id: '08-09', nameAr: 'السليمي', nameEn: 'As-Sulaymi', regionId: '08' },
    ],
  },
  {
    id: '09',
    code: 'northern_borders',
    nameAr: 'منطقة الحدود الشمالية',
    nameEn: 'Northern Borders Region',
    cities: [
      { id: '09-01', nameAr: 'عرعر', nameEn: 'Arar', regionId: '09' },
      { id: '09-02', nameAr: 'رفحاء', nameEn: 'Rafha', regionId: '09' },
      { id: '09-03', nameAr: 'طريف', nameEn: 'Turaif', regionId: '09' },
      { id: '09-04', nameAr: 'العويقيلة', nameEn: 'Al-Uwayqilah', regionId: '09' },
    ],
  },
  {
    id: '10',
    code: 'jazan',
    nameAr: 'منطقة جازان',
    nameEn: 'Jazan Region',
    cities: [
      { id: '10-01', nameAr: 'جازان', nameEn: 'Jazan', regionId: '10' },
      { id: '10-02', nameAr: 'صبيا', nameEn: 'Sabya', regionId: '10' },
      { id: '10-03', nameAr: 'أبو عريش', nameEn: 'Abu Arish', regionId: '10' },
      { id: '10-04', nameAr: 'صامطة', nameEn: 'Samtah', regionId: '10' },
      { id: '10-05', nameAr: 'بيش', nameEn: 'Baish', regionId: '10' },
      { id: '10-06', nameAr: 'الدرب', nameEn: 'Ad-Darb', regionId: '10' },
      { id: '10-07', nameAr: 'الحرث', nameEn: 'Al-Harth', regionId: '10' },
      { id: '10-08', nameAr: 'ضمد', nameEn: 'Damad', regionId: '10' },
      { id: '10-09', nameAr: 'الريث', nameEn: 'Ar-Rayth', regionId: '10' },
      { id: '10-10', nameAr: 'جزر فرسان', nameEn: 'Farasan Islands', regionId: '10' },
      { id: '10-11', nameAr: 'الداير', nameEn: 'Ad-Dayer', regionId: '10' },
      { id: '10-12', nameAr: 'العيدابي', nameEn: 'Al-Aydabi', regionId: '10' },
      { id: '10-13', nameAr: 'العارضة', nameEn: 'Al-Aridhah', regionId: '10' },
      { id: '10-14', nameAr: 'فيفا', nameEn: 'Faifa', regionId: '10' },
      { id: '10-15', nameAr: 'الطوال', nameEn: 'At-Tuwal', regionId: '10' },
      { id: '10-16', nameAr: 'هروب', nameEn: 'Harub', regionId: '10' },
    ],
  },
  {
    id: '11',
    code: 'najran',
    nameAr: 'منطقة نجران',
    nameEn: 'Najran Region',
    cities: [
      { id: '11-01', nameAr: 'نجران', nameEn: 'Najran', regionId: '11' },
      { id: '11-02', nameAr: 'شرورة', nameEn: 'Sharurah', regionId: '11' },
      { id: '11-03', nameAr: 'حبونا', nameEn: 'Hubuna', regionId: '11' },
      { id: '11-04', nameAr: 'بدر الجنوب', nameEn: 'Badr Al-Janub', regionId: '11' },
      { id: '11-05', nameAr: 'يدمة', nameEn: 'Yadamah', regionId: '11' },
      { id: '11-06', nameAr: 'ثار', nameEn: 'Thar', regionId: '11' },
      { id: '11-07', nameAr: 'خباش', nameEn: 'Khibash', regionId: '11' },
      { id: '11-08', nameAr: 'الوديعة', nameEn: 'Al-Wadiah', regionId: '11' },
    ],
  },
  {
    id: '12',
    code: 'baha',
    nameAr: 'منطقة الباحة',
    nameEn: 'Al-Baha Region',
    cities: [
      { id: '12-01', nameAr: 'الباحة', nameEn: 'Al-Baha', regionId: '12' },
      { id: '12-02', nameAr: 'بلجرشي', nameEn: 'Baljurashi', regionId: '12' },
      { id: '12-03', nameAr: 'المندق', nameEn: 'Al-Mandaq', regionId: '12' },
      { id: '12-04', nameAr: 'المخواة', nameEn: 'Al-Mikhwah', regionId: '12' },
      { id: '12-05', nameAr: 'قلوة', nameEn: 'Qilwah', regionId: '12' },
      { id: '12-06', nameAr: 'العقيق', nameEn: 'Al-Aqiq', regionId: '12' },
      { id: '12-07', nameAr: 'الحجرة', nameEn: 'Al-Hajrah', regionId: '12' },
      { id: '12-08', nameAr: 'غامد الزناد', nameEn: 'Ghamid Az-Zinad', regionId: '12' },
      { id: '12-09', nameAr: 'القرى', nameEn: 'Al-Qura', regionId: '12' },
      { id: '12-10', nameAr: 'بني حسن', nameEn: 'Bani Hasan', regionId: '12' },
    ],
  },
  {
    id: '13',
    code: 'jawf',
    nameAr: 'منطقة الجوف',
    nameEn: 'Al-Jawf Region',
    cities: [
      { id: '13-01', nameAr: 'سكاكا', nameEn: 'Sakaka', regionId: '13' },
      { id: '13-02', nameAr: 'القريات', nameEn: 'Al-Qurayyat', regionId: '13' },
      { id: '13-03', nameAr: 'دومة الجندل', nameEn: 'Dumat Al-Jandal', regionId: '13' },
      { id: '13-04', nameAr: 'طبرجل', nameEn: 'Tuburjal', regionId: '13' },
    ],
  },
];

/**
 * Flat list of all Saudi cities
 */
export const ALL_CITIES: City[] = SAUDI_REGIONS.flatMap((region) => region.cities);

/**
 * Get all Saudi regions
 */
export function getRegions(): Region[] {
  return SAUDI_REGIONS;
}

/**
 * Find region by ID or code
 */
export function getRegionById(idOrCode: string): Region | undefined {
  return SAUDI_REGIONS.find(
    (region) => region.id === idOrCode || region.code.toLowerCase() === idOrCode.toLowerCase()
  );
}

/**
 * Get all cities belonging to a specific region
 */
export function getCitiesByRegionId(regionId: string): City[] {
  const region = getRegionById(regionId);
  return region ? region.cities : [];
}

/**
 * Find city by ID
 */
export function getCityById(cityId: string): City | undefined {
  return ALL_CITIES.find((city) => city.id === cityId);
}
