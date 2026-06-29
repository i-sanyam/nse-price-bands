const API_KEY_HEADER = "x-api-key";

export const API_KEY_TYPES = {
  READ: "READ",
  WRITE: "WRITE",
};

function getEnvApiKey(type) {
  if (type === API_KEY_TYPES.WRITE) {
    return process.env.WRITE_API_KEY;
  }
  return process.env.READ_API_KEY;
}

function buildUnauthorizedResponse(message) {
  return new Response(
    JSON.stringify({
      success: false,
      message,
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    },
  );
}

export function getApiKeyFromRequest(req) {
  const headerValue = req.headers.get(API_KEY_HEADER) || req.headers.get("authorization");
  if (!headerValue) {
    return null;
  }

  const bearerMatch = headerValue.match(/^Bearer\s+(.+)$/i);
  return bearerMatch ? bearerMatch[1] : headerValue;
}

export function requireApiKey(req, type) {
  const apiKey = getApiKeyFromRequest(req);
  if (!apiKey) {
    return buildUnauthorizedResponse("API key is required");
  }

  const expectedKey = getEnvApiKey(type);
  if (!expectedKey) {
    return buildUnauthorizedResponse(`Environment variable ${type === API_KEY_TYPES.WRITE ? "WRITE_API_KEY" : "READ_API_KEY"} is required`);
  }

  if (apiKey !== expectedKey) {
    return buildUnauthorizedResponse("Invalid API key");
  }

  return null;
}
