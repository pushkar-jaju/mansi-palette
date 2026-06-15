import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as crypto from "crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Seeding database...");

  // 1. Delete existing data to avoid duplicates
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.commissionRequest.deleteMany({});
  await prisma.painting.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Cleared old data.");

  // 2. Create Admin User
  const adminPasswordHash = hashPassword("AdminMansi2026!");
  const admin = await prisma.user.create({
    data: {
      name: "Mansi Sharma",
      email: "mansipalette@gmail.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  // Create standard test user
  const userPasswordHash = hashPassword("UserGuest123!");
  const guest = await prisma.user.create({
    data: {
      name: "Guest Customer",
      email: "guest@mansispalette.com",
      passwordHash: userPasswordHash,
      role: "USER",
      emailVerified: true,
    },
  });

  console.log("Created users:", { admin: admin.email, guest: guest.email });

  // 3. Create initial paintings
  const paintings = [
    {
      title: "Whispers of the Forest",
      description: "An atmospheric oil painting capturing the serene silence of a pine forest blanketed in early morning mist. Golden rays pierce through the canopy, creating a quiet space for reflection.",
      medium: "Oil on Canvas",
      price: 850.0,
      width: 24,
      height: 36,
      canvasType: "Stretched Canvas",
      frameOption: "Stretched Canvas (Ready to Hang)",
      category: "Landscape",
      imageUrl: "/paintings/misty_forest.png",
      status: "AVAILABLE" as const,
      isFeatured: true,
    },
    {
      title: "Vortex of Emotion",
      description: "A textured modern abstract canvas showcasing aggressive palette knife work. Deep indigo and rich plum fields collide, illuminated by cracks of gold foil and highlights of calming lavender.",
      medium: "Acrylic and Gold Leaf",
      price: 1200.0,
      width: 30,
      height: 40,
      canvasType: "Stretched Canvas",
      frameOption: "Framed (Black Float Frame)",
      category: "Abstract",
      imageUrl: "/paintings/vibrant_abstract.png",
      status: "AVAILABLE" as const,
      isFeatured: true,
    },
    {
      title: "Crimson Reverie",
      description: "A delicate watercolor study of wild forest roses in bloom. Deep crimson petals blend into dusty pinks, highlighted by metallic gold ink branches and details on heavy cold-press cotton paper.",
      medium: "Watercolor and Metallic Ink",
      price: 450.0,
      width: 12,
      height: 16,
      canvasType: "Arches Cold Press Paper",
      frameOption: "Framed (Natural Oak Frame)",
      category: "Floral",
      imageUrl: "/paintings/serene_floral.png",
      status: "AVAILABLE" as const,
      isFeatured: true,
    },
    {
      title: "Golden Crest",
      description: "A powerful representation of coastal ocean waves crashing against dark rocks. Mixed media texture creates depth, with genuine gold leaf catching light on the cresting foam.",
      medium: "Mixed Media and Gold Leaf",
      price: 950.0,
      width: 24,
      height: 24,
      canvasType: "Wood Panel",
      frameOption: "Unframed (Painted Edges)",
      category: "Coastal",
      imageUrl: "/paintings/coastal_wave.png",
      status: "AVAILABLE" as const,
      isFeatured: true,
    },
    {
      title: "Silent Reflections",
      description: "A serene depiction of a lake at dusk. Soft gradient hues of twilight blue and violet mirror the calm sky. Perfect representation of minimalism.",
      medium: "Oil on Canvas",
      price: 750.0,
      width: 18,
      height: 24,
      canvasType: "Stretched Canvas",
      frameOption: "Stretched Canvas (Ready to Hang)",
      category: "Landscape",
      imageUrl: "/paintings/misty_forest.png",
      status: "SOLD" as const,
      isFeatured: false,
    },
    {
      title: "Symphony of Textures",
      description: "A miniature abstract piece showcasing experimental textures, acrylic washes, and copper foil elements.",
      medium: "Acrylic and Copper Leaf",
      price: 320.0,
      width: 10,
      height: 10,
      canvasType: "Wood Panel",
      frameOption: "Unframed (Ready to Hang)",
      category: "Abstract",
      imageUrl: "/paintings/vibrant_abstract.png",
      status: "SOLD" as const,
      isFeatured: false,
    },
  ];

  for (const painting of paintings) {
    await prisma.painting.create({ data: painting });
  }

  console.log(`Successfully seeded ${paintings.length} paintings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
