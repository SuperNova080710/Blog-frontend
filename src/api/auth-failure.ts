type AuthFailureHandler = () => void;

let authFailureHandler: AuthFailureHandler | null = null;

export function setAuthFailureHandler(handler: AuthFailureHandler) {
    authFailureHandler = handler;
}

export function handleAuthFailure() {
    authFailureHandler?.();
}