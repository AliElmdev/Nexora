import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for")
  const ip = forwardedFor?.split(",")[0]?.trim() || "8.8.8.8"

  console.log("Client IP:", ip)

  const geoRes = await fetch(`https://ipinfo.io/${ip}/json`)
  if (!geoRes.ok) {
    const text = await geoRes.text()
    console.error("ipinfo.io error:", text)
    return NextResponse.json({
      ip,
      country: "Unknown",
      error: text,
    })
  }

  const geoData = await geoRes.json()

  return NextResponse.json({
    ip,
    country: geoData.country || "Unknown",
  })
}
