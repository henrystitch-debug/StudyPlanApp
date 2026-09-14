import { verifyPassword } from "@/lib/db/user";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await verifyPassword(email, password);
    if (!user) {
      return Response.json({ error: "Wrong email or password" }, { status: 401 });
    }

    return Response.json({ user });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Error logging in" }, { status: 500 });
  }
}