import { getUserById, verifyUserCredentials, NotImplementedError } from "@/lib/db/user";

// Endpoints the login page (src/app/login/page.tsx) uses to sign a user in.
//
// GET  /api/user/userGet?uid=123
//   200 { user }        a user with that id exists
//   400 { error }       missing / invalid uid
//   404 { error }       no such user
//
// POST /api/user/userGet   body: { email: string, password: string }
//   200 { user }        credentials are correct
//   400 { error }       email / password missing
//   401 { error }       wrong email or password
//   501 { error }       auth backend not implemented yet (frontend falls back)

export async function GET(request: Request) {
    const uid = Number(new URL(request.url).searchParams.get("uid"));

    if (!Number.isInteger(uid) || uid <= 0) {
        return Response.json({ error: "a positive `uid` query param is required" }, { status: 400 });
    }

    const user = await getUserById(uid);

    if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ user });
}

export async function POST(request: Request) {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
        return Response.json({ error: "email and password are required" }, { status: 400 });
    }

    try {
        const user = await verifyUserCredentials(body.email, body.password);

        if (!user) {
            return Response.json({ error: "Wrong email or password." }, { status: 401 });
        }

        return Response.json({ user });
    } catch (err) {
        if (err instanceof NotImplementedError) {
            return Response.json({ error: "Auth backend not implemented yet" }, { status: 501 });
        }
        console.error(err);
        return Response.json({ error: "Something went wrong" }, { status: 500 });
    }
}
