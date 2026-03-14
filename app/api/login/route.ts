import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {

    const body = await req.json();

    const { email, password } = body;

    const res = await fetch(
      "https://api.frnow.io/api/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "invalid_credentials" },
        { status: 401 }
      );
    }

    const data = await res.json();

    const token = data.token;

    const response = NextResponse.json({
      success: true
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/"
    });

    return response;

  } catch (err) {

    return NextResponse.json(
      { error: "login_failed" },
      { status: 500 }
    );

  }
}