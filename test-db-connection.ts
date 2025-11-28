import { prisma } from './src/lib/prisma';

async function testConnection() {
  try {
    console.log('Mencoba mengakses database...');
    
    // Coba mengambil satu user (boleh tidak ada)
    const user = await prisma.user.findFirst();
    console.log('Query berhasil:', user);
    
    // Coba connect
    await prisma.$connect();
    console.log('Koneksi ke database berhasil!');
  } catch (error) {
    console.error('Error saat mengakses database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();