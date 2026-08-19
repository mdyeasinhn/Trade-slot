-- TradeSlot — booking no-overlap backstop (AGENT.md §8)
--
-- Creates an exclusion constraint on Booking so PostgreSQL itself refuses two
-- active bookings for the same trader whose job windows overlap. The booking
-- service additionally holds a per (traderId, date) advisory lock, so this is
-- the final safety net, not the primary mechanism.
--
-- Requires the btree_gist extension (included in standard PostgreSQL contrib).

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Drop first so the script is re-runnable (safe for local dev / CI).
ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "booking_no_overlap";

-- A booking's job window is [startTime, endTime). Active means not CANCELLED.
ALTER TABLE "Booking"
  ADD CONSTRAINT "booking_no_overlap"
  EXCLUDE USING gist (
    "traderId" WITH =,
    tstzrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE ("status" <> 'CANCELLED');

-- Index to keep the gist exclusion fast.
CREATE INDEX IF NOT EXISTS "Booking_trader_range_idx"
  ON "Booking" USING gist (
    "traderId",
    tstzrange("startTime", "endTime", '[)')
  );
