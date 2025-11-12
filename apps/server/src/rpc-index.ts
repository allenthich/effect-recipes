import "dotenv/config";
import { HttpMiddleware, HttpRouter } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { Layer } from "effect";
import { UserRpcs } from "@effect-recipes/rpc";
import { UsersLive } from "./handlers.js";

// Create the RPC server layer
const RpcLayer = RpcServer.layer(UserRpcs).pipe(Layer.provide(UsersLive));

// Choose the protocol and serialization format
const HttpProtocol = RpcServer.layerProtocolHttp({
	path: "/rpc",
}).pipe(Layer.provide(RpcSerialization.layerNdjson));

// CORS middleware
const corsMiddleware = HttpMiddleware.cors({
	allowedOrigins: [process.env.CORS_ORIGIN || "http://localhost:5173"],
	allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: [
		"Content-Type",
		"Authorization",
		"X-Requested-With",
		"traceparent",
		"tracestate",
		"b3",
	],
	credentials: true,
	maxAge: 86400,
});

// Create the main server layer
const Main = HttpRouter.Default.serve(corsMiddleware).pipe(
	Layer.provide(RpcLayer),
	Layer.provide(HttpProtocol),
	Layer.provide(BunHttpServer.layer({ port: 3000 })),
);

console.log(`Server launched on http://localhost:3000`);
BunRuntime.runMain(Layer.launch(Main));
