import { drizzle } from "drizzle-orm/mysql2";
import { gpus } from "./drizzle/schema.ts";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function seedGPUs() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  const gpuData = [
    {
      name: "NVIDIA A100 80GB",
      slug: "nvidia-a100-80gb",
      model: "A100",
      manufacturer: "NVIDIA",
      memory: 80,
      computeCapability: "8.0",
      tensorCores: 6912,
      cudaCores: 6912,
      maxPower: 400,
      pricePerHour: 3.06,
      pricePerMonth: 2244,
      availability: 45,
      description: "Самый мощный GPU для AI и ML. Идеален для обучения больших моделей и высокопроизводительных вычислений.",
      datacenters: ["Москва", "Санкт-Петербург", "Казань"],
      category: "datacenter",
      specifications: {
        architecture: "Ampere",
        transistors: "54.2B",
        dieSize: "826 mm²",
        maxClockSpeed: "1410 MHz",
        l2Cache: "40 MB",
        bandwidth: "2039 GB/s",
      },
    },
    {
      name: "NVIDIA H100 80GB",
      slug: "nvidia-h100-80gb",
      model: "H100",
      manufacturer: "NVIDIA",
      memory: 80,
      computeCapability: "9.0",
      tensorCores: 14080,
      cudaCores: 16896,
      maxPower: 700,
      pricePerHour: 4.89,
      pricePerMonth: 3576,
      availability: 32,
      description: "Следующее поколение GPU для AI. В 6 раз быстрее A100 для трансформеров и LLM.",
      datacenters: ["Москва", "Санкт-Петербург"],
      category: "datacenter",
      specifications: {
        architecture: "Hopper",
        transistors: "80B",
        dieSize: "814 mm²",
        maxClockSpeed: "2610 MHz",
        l2Cache: "50 MB",
        bandwidth: "3352 GB/s",
      },
    },
    {
      name: "NVIDIA RTX 4090",
      slug: "nvidia-rtx-4090",
      model: "RTX 4090",
      manufacturer: "NVIDIA",
      memory: 24,
      computeCapability: "8.9",
      tensorCores: 16384,
      cudaCores: 16384,
      maxPower: 450,
      pricePerHour: 1.29,
      pricePerMonth: 944,
      availability: 128,
      description: "Флагманский GPU для профессионального рендеринга, 3D моделирования и высокопроизводительных вычислений.",
      datacenters: ["Москва", "Санкт-Петербург", "Казань", "Новосибирск"],
      category: "professional",
      specifications: {
        architecture: "Ada Lovelace",
        transistors: "76B",
        dieSize: "608 mm²",
        maxClockSpeed: "2520 MHz",
        l2Cache: "72 MB",
        bandwidth: "1008 GB/s",
      },
    },
    {
      name: "NVIDIA RTX 6000 Ada",
      slug: "nvidia-rtx-6000-ada",
      model: "RTX 6000 Ada",
      manufacturer: "NVIDIA",
      memory: 48,
      computeCapability: "8.9",
      tensorCores: 18176,
      cudaCores: 18176,
      maxPower: 320,
      pricePerHour: 2.49,
      pricePerMonth: 1822,
      availability: 64,
      description: "Профессиональный GPU для визуализации, CAD и научных вычислений с 48GB памяти.",
      datacenters: ["Москва", "Санкт-Петербург", "Казань"],
      category: "professional",
      specifications: {
        architecture: "Ada Lovelace",
        transistors: "76B",
        dieSize: "608 mm²",
        maxClockSpeed: "2505 MHz",
        l2Cache: "72 MB",
        bandwidth: "576 GB/s",
      },
    },
    {
      name: "NVIDIA L40S",
      slug: "nvidia-l40s",
      model: "L40S",
      manufacturer: "NVIDIA",
      memory: 48,
      computeCapability: "8.9",
      tensorCores: 18176,
      cudaCores: 18176,
      maxPower: 350,
      pricePerHour: 1.99,
      pricePerMonth: 1456,
      availability: 96,
      description: "Оптимальный выбор для облачных вычислений, видеообработки и AI инференса.",
      datacenters: ["Москва", "Санкт-Петербург", "Казань", "Новосибирск", "Екатеринбург"],
      category: "professional",
      specifications: {
        architecture: "Ada Lovelace",
        transistors: "76B",
        dieSize: "608 mm²",
        maxClockSpeed: "2505 MHz",
        l2Cache: "72 MB",
        bandwidth: "864 GB/s",
      },
    },
    {
      name: "NVIDIA A10",
      slug: "nvidia-a10",
      model: "A10",
      manufacturer: "NVIDIA",
      memory: 24,
      computeCapability: "8.6",
      tensorCores: 3456,
      cudaCores: 3456,
      maxPower: 150,
      pricePerHour: 0.49,
      pricePerMonth: 358,
      availability: 256,
      description: "Экономичный GPU для облачных приложений, видеообработки и графики.",
      datacenters: ["Москва", "Санкт-Петербург", "Казань", "Новосибирск", "Екатеринбург", "Уфа"],
      category: "entry",
      specifications: {
        architecture: "Ampere",
        transistors: "10.3B",
        dieSize: "217 mm²",
        maxClockSpeed: "2505 MHz",
        l2Cache: "6 MB",
        bandwidth: "384 GB/s",
      },
    },
  ];

  try {
    console.log("Inserting GPU data...");
    for (const gpu of gpuData) {
      await db.insert(gpus).values({
        name: gpu.name,
        slug: gpu.slug,
        model: gpu.model,
        manufacturer: gpu.manufacturer,
        memory: gpu.memory,
        computeCapability: gpu.computeCapability,
        tensorCores: gpu.tensorCores,
        cudaCores: gpu.cudaCores,
        maxPower: gpu.maxPower,
        pricePerHour: gpu.pricePerHour.toString(),
        pricePerMonth: gpu.pricePerMonth.toString(),
        availability: gpu.availability,
        description: gpu.description,
        datacenters: gpu.datacenters,
        category: gpu.category,
        specifications: gpu.specifications,
      });
      console.log(`✓ Added ${gpu.name}`);
    }
    console.log("GPU data seeded successfully!");
  } catch (error) {
    console.error("Error seeding GPUs:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedGPUs();
