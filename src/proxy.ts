import { auth } from "@/lib/server/auth";

export default auth.middleware({
  loginUrl: "/auth/sign-in",
  publicRoutes: ["/auth/sign-in"],
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
