import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { Profession } from '../professions/entities/professions.entity';
import { Neighborhood } from '../neighborhoods/entities/neighborhoods.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(Profession)
    private professionsRepository: Repository<Profession>,
    @InjectRepository(Neighborhood)
    private neighborhoodsRepository: Repository<Neighborhood>,
  ) {}

  async seedProfessions() {
    const professions = [
      { name: 'كهربائي', description: 'أعمال الكهرباء والصيانة الكهربائية' },
      { name: 'سباك', description: 'أعمال السباكة وصيانة المياه' },
      { name: 'نجار', description: 'أعمال النجارة والأثاث' },
      { name: 'صباغ', description: 'أعمال الدهان والديكور' },
      { name: 'مكيفات', description: 'تركيب وصيانة المكيفات' },
      { name: 'السيراميك', description: 'تركيب وصيانة السيراميك والبلاط' },
      { name: 'جبس', description: 'أعمال الجبس والديكور' },
      { name: 'ألمنيوم', description: 'تركيب الألمنيوم والشبابيك' },
      { name: 'حداد', description: 'أعمال الحدادة واللحام' },
      { name: 'تنظيف', description: 'خدمات التنظيف المنزلي' },
      { name: 'عامل للحدائق', description: 'تنسيق وصيانة الحدائق' },
      { name: 'عازل حراري', description: 'أعمال العزل الحراري والمائي' },
    ];

    for (const prof of professions) {
      const existing = await this.professionsRepository.findOne({ where: { name: prof.name } });
      if (!existing) {
        await this.professionsRepository.save(prof);
        console.log(`✓ Created profession: ${prof.name}`);
      }
    }
    console.log('✓ Professions seeding completed');
  }

  async seedNeighborhoods() {
    const neighborhoods = [
      // الساحل الأيسر
      { name: 'الزهور', area: 'الساحل الأيسر' },
      { name: 'الرفاعي', area: 'الساحل الأيسر' },
      { name: 'النور', area: 'الساحل الأيسر' },
      { name: 'الوحدة', area: 'الساحل الأيسر' },
      { name: 'التحرير', area: 'الساحل الأيسر' },
      { name: 'الإصلاح الزراعي', area: 'الساحل الأيسر' },
      { name: 'القادسية', area: 'الساحل الأيسر' },
      { name: 'الحدباء', area: 'الساحل الأيسر' },
      { name: 'الميثاق', area: 'الساحل الأيسر' },
      { name: 'المأمون', area: 'الساحل الأيسر' },
      { name: 'الرسالة', area: 'الساحل الأيسر' },
      { name: 'فلسطين', area: 'الساحل الأيسر' },
      { name: 'الشرطة', area: 'الساحل الأيسر' },
      { name: 'المثنى', area: 'الساحل الأيسر' },
      { name: 'الكرامة', area: 'الساحل الأيسر' },
      { name: 'الصديق', area: 'الساحل الأيسر' },
      { name: 'السكر', area: 'الساحل الأيسر' },
      { name: 'الضباط', area: 'الساحل الأيسر' },
      { name: 'العربي', area: 'الساحل الأيسر' },
      { name: 'الصحة', area: 'الساحل الأيسر' },
      { name: 'المصارف', area: 'الساحل الأيسر' },
      { name: 'الزراعي', area: 'الساحل الأيسر' },
      { name: 'البلديات', area: 'الساحل الأيسر' },
      { name: 'الفيصلية', area: 'الساحل الأيسر' },
      { name: 'اليرموك', area: 'الساحل الأيسر' },
      { name: 'سومر', area: 'الساحل الأيسر' },
      { name: 'الرشيدية', area: 'الساحل الأيسر' },
      { name: 'الكفاءات', area: 'الساحل الأيسر' },
      { name: 'الجزائر', area: 'الساحل الأيسر' },
      { name: 'الغزلاني', area: 'الساحل الأيسر' },
      { name: 'المهندسين', area: 'الساحل الأيسر' },
      { name: 'المجموعة الثقافية', area: 'الساحل الأيسر' },
      
      // الساحل الأيمن
      { name: 'النبي يونس', area: 'الساحل الأيمن' },
      { name: 'الكندي الأولى', area: 'الساحل الأيمن' },
      { name: 'الكندي الثانية', area: 'الساحل الأيمن' },
      { name: 'الأندلس', area: 'الساحل الأيمن' },
      { name: 'الشفاء', area: 'الساحل الأيمن' },
      { name: 'الحرية', area: 'الساحل الأيمن' },
      { name: 'العامل', area: 'الساحل الأيمن' },
      { name: 'الصناعة', area: 'الساحل الأيمن' },
      { name: 'الموصل الجديدة', area: 'الساحل الأيمن' },
      { name: 'الدواسة', area: 'الساحل الأيمن' },
      { name: 'باب الطوب', area: 'الساحل الأيمن' },
      { name: 'باب السراي', area: 'الساحل الأيمن' },
      { name: 'الدندان', area: 'الساحل الأيمن' },
      { name: 'الميدان', area: 'الساحل الأيمن' },
      { name: 'الساعة', area: 'الساحل الأيمن' },
      { name: 'باب سنجار', area: 'الساحل الأيمن' },
      { name: 'باب لكش', area: 'الساحل الأيمن' },
      { name: 'الفاروق', area: 'الساحل الأيمن' },
      { name: 'الزنجيلي', area: 'الساحل الأيمن' },
      { name: 'المنصور', area: 'الساحل الأيمن' },
      { name: '17 تموز', area: 'الساحل الأيمن' },
      { name: 'تل الرمان', area: 'الساحل الأيمن' },
      { name: 'وادي حجر', area: 'الساحل الأيمن' },
      { name: 'القاهرة', area: 'الساحل الأيمن' },
      { name: 'البكر', area: 'الساحل الأيمن' },
      { name: 'الجامعة', area: 'الساحل الأيمن' },
    ];

    for (const neighborhood of neighborhoods) {
      const existing = await this.neighborhoodsRepository.findOne({ where: { name: neighborhood.name } });
      if (!existing) {
        await this.neighborhoodsRepository.save({
          name: neighborhood.name,
          area: neighborhood.area as 'الساحل الأيمن' | 'الساحل الأيسر',
        });
        console.log(`✓ Created neighborhood: ${neighborhood.name}`);
      }
    }
    console.log('✓ Neighborhoods seeding completed');
  }

  async createAdminUser() {
    // Check if admin already exists
    const existingAdmin = await this.usersService.findByPhone('07700000000');
    if (existingAdmin) {
      console.log('Admin user already exists');
      return existingAdmin;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('rheem123', 10);
    
    const adminData = {
      name: 'Rheem nail',
      email: 'rheem@admin.com',
      phone: '07700000000',
      password: hashedPassword,
      role: 'admin' as const,
      neighborhood_id: undefined,
      profile_image: undefined,
    };

    const admin = await this.usersService.create(adminData);
    console.log('Admin user created successfully:', admin.name);
    return admin;
  }

  async seedAll() {
    console.log('🌱 Starting database seeding...');
    await this.seedProfessions();
    await this.seedNeighborhoods();
    await this.createAdminUser();
    console.log('🌱 Database seeding completed!');
  }
}