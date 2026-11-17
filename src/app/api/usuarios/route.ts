import { NextResponse } from "next/server";
import { createUser, listUsers } from "./_lib/service";
import { readJsonBody, usuarioErrorResponse } from "./http";

export async function GET() {
  try {
    const data = await listUsers();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return usuarioErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const passwordSetupRedirect = new URL(
      "/auth/reset-password",
      request.url,
    ).toString();
    const result = await createUser(body, passwordSetupRedirect);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return usuarioErrorResponse(error);
  }
}
