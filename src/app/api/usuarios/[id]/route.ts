import { NextResponse } from "next/server";
import { updateUser } from "../_lib/service";
import { readJsonBody, usuarioErrorResponse } from "../http";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await readJsonBody(request);
    const result = await updateUser(id, body);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return usuarioErrorResponse(error);
  }
}
