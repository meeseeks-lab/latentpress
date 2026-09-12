import { getLlmsData, renderLlmsFullTxt } from "@/lib/llms";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getLlmsData();
  return new Response(renderLlmsFullTxt(data), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}
