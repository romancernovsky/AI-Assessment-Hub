import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      const path = req.nextUrl.pathname;
      
      // Admin routes require admin or contentAdmin role
      if (path.startsWith("/admin")) {
        return token?.role === "admin" || token?.role === "contentAdmin";
      }
      
      // Protected user routes require any authenticated token
      if (
        path.startsWith("/dashboard") || 
        path.startsWith("/assessment") || 
        path.startsWith("/results") || 
        path.startsWith("/review")
      ) {
        return !!token;
      }
      
      // All other routes are public
      return true;
    },
  },
});

export const config = {
  matcher: [
    "/admin/:path*", 
    "/dashboard/:path*", 
    "/assessment/:path*", 
    "/results/:path*", 
    "/review/:path*"
  ],
};
