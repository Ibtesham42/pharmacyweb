// AdSense ads.txt — declares Google as an authorized seller of this site's ad
// inventory. The publisher id is derived from NEXT_PUBLIC_ADSENSE_CLIENT
// (e.g. "ca-pub-XXXX" -> "pub-XXXX") so it stays in sync per environment.

export const revalidate = 86400;

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();

  // f08c47fec0942fa0 is Google's fixed AdSense certification authority id.
  const body = client
    ? `google.com, ${client.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`
    : "# NEXT_PUBLIC_ADSENSE_CLIENT not set — no authorized sellers declared.\n";

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
