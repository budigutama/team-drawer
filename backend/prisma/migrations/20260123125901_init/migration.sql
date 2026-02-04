-- CreateTable
CREATE TABLE "players" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "no_hp" TEXT,
    "tgl_bergabung" DATETIME NOT NULL,
    "posisi_default" TEXT NOT NULL,
    "skill_pot" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tgl_event" DATETIME NOT NULL,
    "jumlah_tim" INTEGER NOT NULL,
    "formasi" TEXT NOT NULL,
    "jumlah_gk" INTEGER NOT NULL DEFAULT 1,
    "jumlah_def" INTEGER NOT NULL,
    "jumlah_mid" INTEGER NOT NULL,
    "jumlah_fw" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "event_participants" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "event_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "posisi_untuk_event" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_participants_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_assignments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "event_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "team_number" INTEGER NOT NULL,
    "team_color" TEXT NOT NULL,
    "posisi" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "team_assignments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_assignments_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_colors" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "color_name" TEXT NOT NULL,
    "hex_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "players_no_hp_key" ON "players"("no_hp");

-- CreateIndex
CREATE INDEX "players_posisi_default_idx" ON "players"("posisi_default");

-- CreateIndex
CREATE INDEX "players_is_active_idx" ON "players"("is_active");

-- CreateIndex
CREATE INDEX "players_skill_pot_idx" ON "players"("skill_pot");

-- CreateIndex
CREATE INDEX "events_tgl_event_idx" ON "events"("tgl_event");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "event_participants_event_id_idx" ON "event_participants"("event_id");

-- CreateIndex
CREATE INDEX "event_participants_player_id_idx" ON "event_participants"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_participants_event_id_player_id_key" ON "event_participants"("event_id", "player_id");

-- CreateIndex
CREATE INDEX "team_assignments_event_id_idx" ON "team_assignments"("event_id");

-- CreateIndex
CREATE INDEX "team_assignments_player_id_idx" ON "team_assignments"("player_id");

-- CreateIndex
CREATE INDEX "team_assignments_event_id_team_number_idx" ON "team_assignments"("event_id", "team_number");

-- CreateIndex
CREATE UNIQUE INDEX "team_colors_color_name_key" ON "team_colors"("color_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");
