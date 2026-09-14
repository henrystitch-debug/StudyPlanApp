import { createUser, getUserByEmail } from "@/lib/db/user";

export async function POST(request: Request) {
  try {
    
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    let user;
    if(name){
        user = await createUser(email, password, name);
    } else {
        user = await createUser(email, password);
    }
    
    return Response.json({ user });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Error creating account" }, { status: 500 });
  }
}