import { createUser, NotImplementedError } from "@/lib/db/user";

// Endpoint the login page (src/app/login/page.tsx) uses to register a user.
//
// POST /api/user/userCreate   body: { email: string, password: string, name: string }
//   201 { user }        account created
//   400 { error }       missing fields
//   409 { error }       an account with that email already exists
//   501 { error }       auth backend not implemented yet (frontend falls back)

export async function POST(request: Request) {
    const body = await request.json().catch(() => null);

    if (
        !body ||
        typeof body.email !== "string" ||
        typeof body.password !== "string" ||
        typeof body.name !== "string"
    ) {
        return Response.json({ error: "email, password and name are required" }, { status: 400 });
    }

    try {
        const user = await createUser({
            email: body.email,
            password: body.password,
            name: body.name,
        });

        if (!user) {
            return Response.json(
                { error: "An account with that email already exists." },
                { status: 409 },
            );
        }

        return Response.json({ user }, { status: 201 });
    } catch (err) {
        if (err instanceof NotImplementedError) {
            return Response.json({ error: "Auth backend not implemented yet" }, { status: 501 });
        }
        console.error(err);
        return Response.json({ error: "Something went wrong" }, { status: 500 });
    }
}
