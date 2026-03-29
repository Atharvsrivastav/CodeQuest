import "server-only";

const DEFAULT_JUDGE0_API_URL = "https://ce.judge0.com";

export type Judge0Config = {
  apiUrl: string;
  authToken: string | null;
};

export function getJudge0Config(): Judge0Config {
  const apiUrl = normalizeApiUrl(process.env.JUDGE0_API_URL);
  const authToken = normalizeToken(process.env.JUDGE0_AUTH_TOKEN);

  return {
    apiUrl,
    authToken
  };
}

export function getJudge0Headers() {
  const { authToken } = getJudge0Config();

  return {
    ...(authToken ? { "X-Auth-Token": authToken } : {})
  };
}

function normalizeApiUrl(value: string | undefined) {
  const resolved = value?.trim() || DEFAULT_JUDGE0_API_URL;
  return resolved.replace(/\/+$/, "");
}

function normalizeToken(value: string | undefined) {
  const resolved = value?.trim();
  return resolved ? resolved : null;
}
