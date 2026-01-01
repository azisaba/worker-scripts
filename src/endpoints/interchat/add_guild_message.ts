import {AppContext} from "../../types"

export type Request = {
  guild_id: number,
  server: string,
  sender: string,
  message: string,
  transliterated_message?: string,
}

export async function post(c: AppContext) {
  const request: Request = await c.req.json()
  await c.env.interchat.prepare("INSERT INTO guild_messages (guild_id, server, sender, message, transliterated_message, timestamp) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(request.guild_id, request.server, request.sender, request.message, request.transliterated_message ?? null, Date.now())
    .run()
  return c.json({ status: "accepted" }, 200)
}
