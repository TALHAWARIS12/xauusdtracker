export async function GET() {
  return new Response("google-site-verification: google18cebf91d13318c9.html", {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
