import { type NextRequest, NextResponse } from "next/server"

// This allows clients on different networks to access the API through the Next.js server
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:5000/api"

async function handleRequest(request: NextRequest, method: string) {
  const path = request.nextUrl.pathname.replace("/api", "")
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${PYTHON_API_URL}${path}${searchParams ? `?${searchParams}` : ""}`

  if (path === "/auth/logout" && method === "POST") {
    const response = NextResponse.json({ message: "Logged out" })
    response.cookies.delete("token")
    return response
  }

  try {
    const body = method !== "GET" && method !== "DELETE" ? await request.text() : undefined

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    const tokenCookie = request.cookies.get("token")
    if (tokenCookie) {
      headers["Authorization"] = `Bearer ${tokenCookie.value}`
    }

    const authHeader = request.headers.get("Authorization")
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
    })

    const data = await response.json()
    const nextResponse = NextResponse.json(data, { status: response.status })

    if (path === "/auth/login" && method === "POST" && response.ok && data.token) {
      nextResponse.cookies.set({
        name: "token",
        value: data.token,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        // secure: process.env.NODE_ENV === "production"
      })
    }

    return nextResponse
  } catch (error) {
    console.error("[v0] API Proxy Error:", error)
    return NextResponse.json({ error: "Failed to communicate with backend API" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request, "GET")
}

export async function POST(request: NextRequest) {
  return handleRequest(request, "POST")
}

export async function PUT(request: NextRequest) {
  return handleRequest(request, "PUT")
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request, "PATCH")
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request, "DELETE")
}
