import { NextResponse } from "next/server";
import { buildAccountExport } from "@/lib/account/export-data";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً." }, { status: 401 });
    }

    const payload = await buildAccountExport(supabase, user.id, user.email ?? null);

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="masrofy-export-${payload.exportedAt.slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر تصدير البيانات.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
