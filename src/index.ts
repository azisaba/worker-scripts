import { Hono } from "hono";

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

app.post("/github", async (c) => {
	const env = c.env;
	const webhookUrl = env.DISCORD_WEBHOOK_URL;
	if (!webhookUrl) {
		return c.json({ error: "Missing DISCORD_WEBHOOK_URL" }, 500);
	}

	let bodyText = "";
	let payload: unknown = null;
	try {
		bodyText = await c.req.text();
		payload = bodyText ? JSON.parse(bodyText) : null;
	} catch {
		return c.json({ error: "Invalid JSON payload" }, 400);
	}

	const repository = (payload as { repository?: { private?: boolean; visibility?: string } })
		?.repository;
	const isPublic = repository
		? repository.private === false || repository.visibility === "public"
		: false;

	if (!isPublic) {
		return c.json({ status: "ignored" }, 200);
	}

	const contentType = c.req.header("content-type") ?? "application/json";
	const discordResponse = await fetch(webhookUrl, {
		method: "POST",
		headers: {
			"Content-Type": contentType,
			"User-Agent": "worker-scripts/github-proxy",
			"X-GitHub-Delivery": c.req.header("x-github-delivery") ?? "",
			"X-GitHub-Event": c.req.header("x-github-event") ?? "",
			"X-GitHub-Hook-ID": c.req.header("x-github-hook-id") ?? "",
			"X-GitHub-Hook-Installation-Target-ID": c.req.header("x-github-hook-installation-target-id") ?? "",
			"X-GitHub-Hook-Installation-Target-Type": c.req.header("x-github-hook-installation-target-type") ?? "",
		},
		body: bodyText,
	});

	if (!discordResponse.ok) {
		return c.json(
			{
				error: "Discord webhook failed",
				status: discordResponse.status,
			},
			502,
		);
	}

	return c.json({ status: "forwarded", res: await discordResponse.text() }, 200);
});

// Export the Hono app
export default app;
