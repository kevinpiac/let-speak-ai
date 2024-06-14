import { authMiddleware } from "@kobbleio/next/server";

export default authMiddleware({
    publicRoutes: ["/(.*)"],
});

export const config = {
    matcher: [
        // exclude internal Next.js routes
        "/((?!.+\\.[\\w]+$|_next).*)",
        // reinclude api routes
        "/(api|trpc)(.*)",
    ],
};