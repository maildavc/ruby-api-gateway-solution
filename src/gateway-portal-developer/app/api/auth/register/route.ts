import { NextResponse } from "next/server";

interface RegisterRequest {
  name: string;
  email: string;
  company: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const body: RegisterRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.company || !body.password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Call middleware API to create tenant (organization)
    const tenantResponse = await fetch(
      "http://localhost:5003/admin/management/tenants",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: body.company,
          domain: body.email.split("@")[1], // Extract domain from email
        }),
      }
    );

    if (!tenantResponse.ok) {
      const error = await tenantResponse.text();
      console.error("Tenant creation failed:", error);
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 }
      );
    }

    const tenant = await tenantResponse.json();

    // TODO: In a real implementation, you would:
    // 1. Create a user record linked to this tenant
    // 2. Send verification email
    // 3. Hash password and store securely
    // 4. Return session/JWT token

    return NextResponse.json(
      {
        message: "Organization registration successful. Please verify your email.",
        tenantId: tenant.id,
        organizationName: body.company,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
