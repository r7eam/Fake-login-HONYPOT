import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function seedDatabase() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('🌱 Starting database seeding...');

    // ============================================
    // 1. SEED PROFESSIONS (المهن المتوفرة في الموصل)
    // ============================================
    console.log('📝 Seeding professions...');
    
    const professions = [
      { name: 'كهربائي', description: 'تركيب وصيانة الأنظمة الكهربائية', is_active: true },
      { name: 'سباك', description: 'تركيب وإصلاح أنظمة المياه والصرف الصحي', is_active: true },
      { name: 'نجار', description: 'صناعة وإصلاح الأثاث والأعمال الخشبية', is_active: true },
      { name: 'صباغ', description: 'دهان وتلوين الجدران والأسقف', is_active: true },
      { name: 'بناء', description: 'بناء وترميم المباني', is_active: true },
      { name: 'حداد', description: 'أعمال الحديد والأبواب المعدنية', is_active: true },
      { name: 'مكيفات', description: 'تركيب وصيانة أجهزة التكييف', is_active: true },
      { name: 'فني تكييف', description: 'صيانة وإصلاح أنظمة التبريد والتكييف', is_active: true },
      { name: 'تبليط', description: 'تركيب البلاط والسيراميك', is_active: true },
      { name: 'السيراميك', description: 'تركيب بلاط السيراميك والرخام', is_active: true },
      { name: 'جبس', description: 'أعمال الجبس للأسقف والجدران', is_active: true },
      { name: 'ديكور', description: 'تصميم وتنفيذ الديكورات الداخلية', is_active: true },
      { name: 'ألمنيوم', description: 'تركيب النوافذ والأبواب الألمنيوم', is_active: true },
      { name: 'تنظيف', description: 'خدمات التنظيف المنزلي والتجاري', is_active: true },
      { name: 'حدائق', description: 'تنسيق وصيانة الحدائق', is_active: true },
      { name: 'بستاني', description: 'زراعة وتنسيق النباتات والأشجار', is_active: true },
      { name: 'عزل', description: 'عزل مائي وحراري للمباني', is_active: true },
      { name: 'لحام', description: 'أعمال اللحام المعدني', is_active: true },
      { name: 'ميكانيكي سيارات', description: 'صيانة وإصلاح السيارات', is_active: true },
      { name: 'كهربائي سيارات', description: 'إصلاح الأنظمة الكهربائية للسيارات', is_active: true },
      { name: 'دهان سيارات', description: 'دهان وصباغة السيارات', is_active: true },
      { name: 'نقل أثاث', description: 'نقل وتغليف الأثاث والبضائع', is_active: true },
      { name: 'نجارة معمار', description: 'نجارة الأبواب والشبابيك والدرج', is_active: true },
      { name: 'تصليح أجهزة منزلية', description: 'إصلاح الغسالات والثلاجات والأفران', is_active: true },
      { name: 'فني ستلايت', description: 'تركيب وصيانة أطباق الستلايت', is_active: true },
      { name: 'فني كاميرات مراقبة', description: 'تركيب وصيانة أنظمة المراقبة', is_active: true },
      { name: 'موبايلات', description: 'صيانة وإصلاح الهواتف المحمولة', is_active: true },
      { name: 'كومبيوتر', description: 'صيانة وإصلاح أجهزة الحاسوب', is_active: true },
    ];

    for (const profession of professions) {
      await dataSource.query(
        `INSERT INTO professions (name, description, is_active) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (name) DO NOTHING`,
        [profession.name, profession.description, profession.is_active]
      );
    }
    
    console.log('✅ Professions seeded successfully!');

    // ============================================
    // 2. SEED NEIGHBORHOODS - الساحل الأيمن
    // ============================================
    console.log('📍 Seeding neighborhoods (الساحل الأيمن)...');
    
    const rightSideNeighborhoods = [
      'الزهور',
      'الرفاعي',
      'الشفاء',
      'الزراعي',
      'الحدباء',
      'الشورة',
      'القاهرة',
      'النور',
      'السلام',
      'الوحدة',
      'الصحة',
      'المثنى',
      'المهندسين',
      'الضباط',
      'الموصل الجديدة',
      'الجامعة',
      'التحرير',
      'النبي يونس',
      'الشرطة',
      'المنصور',
      'الإنتصار',
      'النجار',
      'الطيران',
      'الوحدة',
      'الرشيدية',
      'المحاربين',
      'الصناعي',
      'الانصار',
      'التنك',
      'الغابات',
      'الحرية',
      'الوطن',
      'الربيع',
      'الخضراء',
      'الصناعة',
      'الجمهورية',
      'الثورة',
      'الدواسة',
      'الاصلاح الزراعي',
      'الرسالة',
      'الفاروق',
      'الصديق',
      'عدن',
      'الإخاء',
      'الفتح',
      'البعث',
      'الزوراء',
      'الاندلس',
      'المعمورة',
      'الكفاءات',
    ];

    for (const name of rightSideNeighborhoods) {
      await dataSource.query(
        `INSERT INTO neighborhoods (name, area) 
         VALUES ($1, $2) 
         ON CONFLICT (name) DO NOTHING`,
        [name, 'الساحل الأيمن']
      );
    }
    
    console.log('✅ Right side neighborhoods seeded!');

    // ============================================
    // 3. SEED NEIGHBORHOODS - الساحل الأيسر
    // ============================================
    console.log('📍 Seeding neighborhoods (الساحل الأيسر)...');
    
    const leftSideNeighborhoods = [
      'باب الطوب',
      'باب السراي',
      'باب البيض',
      'باب الجديد',
      'باب لكش',
      'باب شمس',
      'حي الميدان',
      'حي النجفي',
      'حي الدواسة',
      'حي الشماع',
      'حي السكر',
      'حي العربي',
      'حي البكر',
      'حي الكندي',
      'حي الزنجيلي',
      'حي القوسيات',
      'حي الرفاعي',
      'حي الزراعة',
      'حي الحدباء',
      'حي القادسية',
      'حي النصر',
      'حي الأمل',
      'حي 17 تموز',
      'حي الجهاد',
      'حي المنتصر',
      'حي السكك',
      'حي النبي جرجيس',
      'حي المشاهدة',
      'حي الشهداء',
      'حي العدالة',
      'حي التنك',
      'حي الحرمين',
      'حي الاسكان',
      'حي المأمون',
      'حي النجار',
      'حي الصناعي',
      'حي الصحافة',
      'حي التحرير',
      'حي الجامعة القديمة',
      'حي السلام',
      'حي الوحدة',
      'حي الزهراء',
      'حي الفاروق',
      'حي البكر',
      'حي العسكري',
      'حي الصمود',
      'حي المعلمين',
      'حي الضباط القديم',
      'حي القدس',
      'حي الكرامة',
    ];

    for (const name of leftSideNeighborhoods) {
      await dataSource.query(
        `INSERT INTO neighborhoods (name, area) 
         VALUES ($1, $2) 
         ON CONFLICT (name) DO NOTHING`,
        [name, 'الساحل الأيسر']
      );
    }
    
    console.log('✅ Left side neighborhoods seeded!');

    // ============================================
    // SUMMARY
    // ============================================
    const professionCount = await dataSource.query('SELECT COUNT(*) FROM professions');
    const neighborhoodCount = await dataSource.query('SELECT COUNT(*) FROM neighborhoods');
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('==========================================');
    console.log(`✅ Total Professions: ${professionCount[0].count}`);
    console.log(`✅ Total Neighborhoods: ${neighborhoodCount[0].count}`);
    console.log('==========================================\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the seed
seedDatabase()
  .then(() => {
    console.log('✅ Seed script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
