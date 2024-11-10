import { expect, describe, test, mock } from "bun:test";
import { RouteError } from "gateway";
import { ensureSignedIn, ensureSignedOut, parseCookie, sessionToken } from "./auth";
import { randomUUIDv7 } from "bun";

const authDecoratorMock = mock((middlewareFunction: Function, request: Request) => {
	const descriptor = {
		value: (_: Request) => {},
	};
	middlewareFunction()(null, null, descriptor);
	descriptor.value(request);
});

test("can parse auth cookie", () => {
	const cookieValue = randomUUIDv7();
	const req = new Request("https://example.com", {
		headers: {
			Cookie: `clips=${cookieValue}`,
		},
	});

	expect(parseCookie(req)?.["clips"]).toBe(cookieValue);
	expect(sessionToken(req)).toBe(cookieValue);
});

describe("auth decorators", () => {
	test("ensureSignedIn() throws error if not signed in", () => {
		const expectedRouteError = new RouteError("User not signed in", "/login");
		const testRequest = new Request("https://example.com");

		expect(() => {
			authDecoratorMock(ensureSignedIn, testRequest);
		}).toThrowError(expectedRouteError);
	});

	test("ensureSignedIn() does not throw error if signed in", () => {
		const testRequest = new Request("https://example.com");
		// @ts-ignore
		testRequest._account = {};

		authDecoratorMock(ensureSignedIn, testRequest);
	});

	test("ensureSignedOut() throws error if signed out", () => {
		const expectedRouteError = new RouteError("User signed in", "/");
		const testRequest = new Request("https://example.com");

		// @ts-ignore
		testRequest._account = {};

		expect(() => {
			authDecoratorMock(ensureSignedOut, testRequest);
		}).toThrowError(expectedRouteError);
	});

	test("ensureSignedOut() does not throw error if signed out", () => {
		const testRequest = new Request("https://example.com");
		authDecoratorMock(ensureSignedOut, testRequest);
	});
});
