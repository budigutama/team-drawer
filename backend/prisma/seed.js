const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Read existing config.json
  const configPath = path.join(__dirname, "../config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  // ============================================
  // 1. Seed Users (from config.json)
  // ============================================
  console.log("Seeding users...");
  for (const user of config.users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        passwordHash: hashedPassword,
        role: user.username === "admin" ? "admin" : "user",
      },
    });
    console.log(`  ✓ User created: ${user.username}`);
  }

  // ============================================
  // 2. Seed Team Colors
  // ============================================
  console.log("Seeding team colors...");
  const colors = [
    { colorName: "red", hexCode: "#FF0000", displayOrder: 1 },
    { colorName: "blue", hexCode: "#0000FF", displayOrder: 2 },
    { colorName: "green", hexCode: "#008000", displayOrder: 3 },
    { colorName: "yellow", hexCode: "#FFFF00", displayOrder: 4 },
    { colorName: "orange", hexCode: "#FFA500", displayOrder: 5 },
    { colorName: "purple", hexCode: "#800080", displayOrder: 6 },
    { colorName: "pink", hexCode: "#FFC0CB", displayOrder: 7 },
    { colorName: "white", hexCode: "#FFFFFF", displayOrder: 8 },
    { colorName: "black", hexCode: "#000000", displayOrder: 9 },
    { colorName: "grey", hexCode: "#808080", displayOrder: 10 },
  ];

  for (const color of colors) {
    await prisma.teamColor.upsert({
      where: { colorName: color.colorName },
      update: {},
      create: color,
    });
  }
  console.log(`  ✓ ${colors.length} colors added`);

  // ============================================
  // 3. Seed Players (from config.json pots)
  // ============================================
  console.log("Seeding players from config.json pots...");
  let playerCount = 0;

  // Extract players from pots
  for (let potIndex = 0; potIndex < config.pots.length; potIndex++) {
    const pot = config.pots[potIndex];
    const potNumber = potIndex + 1;

    for (const [position, playerNames] of Object.entries(pot.players)) {
      if (position === "#CLR") continue; // Skip color marker

      const cleanPosition = position.replace("#", "");

      for (const playerName of playerNames) {
        if (playerName && playerName.trim()) {
          await prisma.player.create({
            data: {
              nama: playerName.trim(),
              tglBergabung: new Date(), // Default to today
              posisiDefault: cleanPosition,
              skillPot: potNumber,
              isActive: true,
            },
          });
          playerCount++;
        }
      }
    }
  }

  // Extract goalkeepers
  for (const gkName of config.gk) {
    if (gkName && gkName.trim()) {
      await prisma.player.create({
        data: {
          nama: gkName.trim(),
          tglBergabung: new Date(),
          posisiDefault: "GK",
          skillPot: 1, // GKs in pot 1 by default
          isActive: true,
        },
      });
      playerCount++;
    }
  }

  console.log(`  ✓ ${playerCount} players migrated from config.json`);

  console.log("\n✅ Database seeded successfully!");
  console.log(`   - ${config.users.length} users`);
  console.log(`   - ${colors.length} team colors`);
  console.log(`   - ${playerCount} players`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
