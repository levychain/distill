import { NextResponse } from "next/server";

// Authentication disabled - app is publicly accessible
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
