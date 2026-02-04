/*
  Warnings:

  - Added the required column `judul` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "judul" TEXT NOT NULL,
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
INSERT INTO "new_events" ("created_at", "formasi", "id", "jumlah_def", "jumlah_fw", "jumlah_gk", "jumlah_mid", "jumlah_tim", "notes", "status", "tgl_event", "updated_at") SELECT "created_at", "formasi", "id", "jumlah_def", "jumlah_fw", "jumlah_gk", "jumlah_mid", "jumlah_tim", "notes", "status", "tgl_event", "updated_at" FROM "events";
DROP TABLE "events";
ALTER TABLE "new_events" RENAME TO "events";
CREATE INDEX "events_tgl_event_idx" ON "events"("tgl_event");
CREATE INDEX "events_status_idx" ON "events"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
