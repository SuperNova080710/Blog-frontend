export type User = {
    id: number;
    email: string;
};

export type SignupRequest = {
    email: string;
    password: string;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type AuthTokenResponse = {
    accessToken: string;
    refreshToken: string;
};

export type RefreshTokenRequest = {
    refreshToken: string;
};