import { auth } from "@/lib/server/auth";

export const { GET, POST, PUT, PATCH, DELETE } = auth.handler();
