import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations";
import {
  getDbState,
  saveDbState,
  recordActivityLog,
  createInAppNotification,
} from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message || "Data registrasi tidak valid";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password, phone, storeName, businessType, address, role } =
      parsed.data;

    const state = getDbState();
    const normalizedEmail = email.trim().toLowerCase();

    const existing = state.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan gunakan email lain atau login." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone.trim(),
      role,
      storeName: storeName.trim(),
      businessType,
      address: address.trim(),
      createdAt: new Date().toISOString(),
    };

    state.users.push(newUser);

    recordActivityLog(state, {
      actorId: newUser.id,
      action: "REGISTER_USER",
      entityType: "User",
      entityId: newUser.id,
      summary: `${newUser.name} (${newUser.storeName}) mendaftar sebagai ${
        role === "CLUSTER_ADMIN" ? "Admin Cluster" : "Penjual UMKM"
      }`,
    });

    createInAppNotification(state, {
      userId: newUser.id,
      title: "Selamat Datang di Consolio!",
      message:
        role === "CLUSTER_ADMIN"
          ? "Akun Admin Cluster Anda aktif. Silakan buat atau kelola Cluster area Anda."
          : "Langkah selanjutnya: Pilih atau bergabung ke Cluster terdekat di area Anda untuk mulai patungan ongkir pickup.",
      type: "SUCCESS",
      link: "/onboarding",
    });

    saveDbState(state);

    return NextResponse.json(
      {
        message: "Registrasi berhasil! Silakan login.",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          storeName: newUser.storeName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registrasi:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat mendaftarkan akun." },
      { status: 500 }
    );
  }
}

