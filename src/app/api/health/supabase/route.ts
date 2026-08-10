import { createClient } from "@/lib/supabase/server";
import { getSupabaseUrlValidationError } from "@/lib/supabase/env";
import { NextResponse } from "next/server";

export async function GET() {
  const configError = getSupabaseUrlValidationError(process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (configError) {
    return NextResponse.json(
      {
        connected: false,
        message: configError,
      },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const { error: walletsError } = await supabase.from("wallets").select("id").limit(1);

  if (walletsError) {
    return NextResponse.json(
      {
        connected: false,
        message:
          walletsError.code === "PGRST125"
            ? "Invalid Supabase URL path. Set NEXT_PUBLIC_SUPABASE_URL to https://your-project.supabase.co without /rest/v1."
            : walletsError.code === "PGRST205"
            ? "Supabase connected, but wallets table is missing. Run supabase/migrations/002_wallets.sql first."
            : walletsError.message,
      },
      { status: 500 },
    );
  }

  const { error: friendshipsError } = await supabase.from("friendships").select("id").limit(1);

  if (friendshipsError) {
    return NextResponse.json(
      {
        connected: false,
        message:
          friendshipsError.code === "PGRST205"
            ? "Supabase connected, but friendships table is missing. Run supabase/migrations/003_friendships.sql first."
            : friendshipsError.message,
      },
      { status: 500 },
    );
  }

  const { error } = await supabase.from("categories").select("id").limit(1);

  if (error) {
    return NextResponse.json(
      {
        connected: false,
        message:
          error.code === "PGRST205"
            ? "Supabase connected, but tables are missing. Run supabase/migrations/001_init.sql first."
            : error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    connected: true,
    message: "Supabase is connected and Masrofy schema is ready.",
  });
}
