import { getSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function getUser(token: string) {
    const res = await fetch(`${API_URL}/users/me`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json();
}

export async function updateUser(token: string, data: { first_name?: string; last_name?: string; profile_picture?: string }) {
    const res = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update user");
    return res.json();
}
