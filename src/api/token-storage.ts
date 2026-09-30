let accessToken: string | null = null;
let refreshToken: string | null = null;

export function getAccessToken() {
    return accessToken;
}

export function getRefreshToken() {
    return refreshToken;
}

export function setTokens(
    newAccessToken: string,
    newRefreshToken: string,
) {
    accessToken = newAccessToken;
    refreshToken = newRefreshToken;
}

export function clearTokens() {
    accessToken = null;
    refreshToken = null;
}
