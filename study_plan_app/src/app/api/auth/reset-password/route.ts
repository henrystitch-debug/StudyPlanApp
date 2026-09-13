import { updatePasswordByEmail } from "@/lib/db/user";

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return Response.json({ error: "Email and new password are required" }, { status: 400 });
    }

    const updated = await updatePasswordByEmail(email, newPassword);

    if (!updated) {
      return Response.json({ error: "No account found for that email" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Error resetting password" }, { status: 500 });
  }
}