import type { CreateUserInput, User } from "@/types/user";

export async function getUserById(uid: number){
    //TODO: create db call

    return Response.json({
        userInfo: {}
    })
}

/**
 * Thrown by the stubs below until the real database layer lands. The user
 * route handlers translate it into a 501 response, which lets the login page
 * fall back to its local placeholder auth. Once a function is implemented,
 * delete its `throw` and return real data.
 */
export class NotImplementedError extends Error {
    constructor(fn: string) {
        super(`${fn} is not implemented yet`);
        this.name = "NotImplementedError";
    }
}

/** Verify an email + password pair. Returns the user on success, null when they don't match. */
export async function verifyUserCredentials(
    email: string,
    password: string,
): Promise<User | null> {
    //TODO: look the user up by email and compare a hash of `password`
    throw new NotImplementedError("verifyUserCredentials");
}

/** Create a new account. Returns the created user, or null if the email is already taken. */
export async function createUser(input: CreateUserInput): Promise<User | null> {
    //TODO: insert the user, storing only a hash of input.password
    throw new NotImplementedError("createUser");
}