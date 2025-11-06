import { type NextRequest, NextResponse } from "next/server"

// This allows clients on different networks to access the API through the Next.js server
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:5000/api"

async function handleRequest(request: NextRequest, method: string) {
  const path = request.nextUrl.pathname.replace("/api", "")
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${PYTHON_API_URL}${path}${searchParams ? `?${searchParams}` : ""}`

  try {
    const body = method !== "GET" && method !== "DELETE" ? await request.text() : undefined

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body,
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
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
