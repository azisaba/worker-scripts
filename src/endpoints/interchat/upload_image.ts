import {AppContext} from "../../types"
import crypto from "crypto"

export async function post(c: AppContext) {
  const blob = await c.req.blob()
  if (blob.type !== "image/png") {
    return c.json({ status: "rejected", reason: "Only PNG images are supported" }, 400)
  }
  const uuid = crypto.randomUUID()
  await c.env.interchat_userdata.put(uuid + ".png", blob);
  return c.json({ status: "accepted", uuid }, 200)
}
