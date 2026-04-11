import { Hono } from "hono";
import { post as githubPost } from "./endpoints/github";
import { post as interChatAddGuildMessagePost} from "./endpoints/interchat/add_guild_message";
import { post as interChatUploadImage} from "./endpoints/interchat/upload_image";

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
	const authToken = c.env.AUTH_TOKEN;
	if (!authToken) {
		return c.json({ error: "Missing AUTH_TOKEN" }, 500);
	}

	const authHeader = c.req.header("authorization") ?? "";
	const token = authHeader.startsWith("Bearer ")
		? authHeader.slice("Bearer ".length).trim()
		: "";
	const secret = c.req.query("secret") ?? "";

	if ((token && token === authToken) || (secret && secret === authToken)) {
		await next();
		return;
	}

	if (!token && !secret) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	if (token || secret) {
		return c.json({ error: "Unauthorized" }, 401);
	}
});

app.post("/github", githubPost);
app.post("/interchat/add_guild_message", interChatAddGuildMessagePost);
app.post("/interchat/upload_image", interChatUploadImage);

// Export the Hono app
export default app;
