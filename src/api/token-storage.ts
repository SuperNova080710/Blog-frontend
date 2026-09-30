import type { AuthTokenResponse } from "@/types/auth";

type TokenListener = (tokens: AuthTokenResponse | null) => void;

let accessToken: string | null = null;
let refreshToken: string | null = null;

const listeners = new Set<TokenListener>();

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

    const tokens = {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };

    listeners.forEach((listener) => {
        listener(tokens);
    });
}

export function clearTokens() {
    accessToken = null;
    refreshToken = null;

    listeners.forEach((listener) => {
        listener(null);
    });
}

export function subscribeToTokenChanges(listener: TokenListener) {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}
