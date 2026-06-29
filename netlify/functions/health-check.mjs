export default function healthCheck() {
    return new Response(
        JSON.stringify({
          success: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
}

export const config = {
    path: "/",
    method: ["POST", "GET"]
};