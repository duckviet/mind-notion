import { authService } from "../../services/auth.service";
import { storageService } from "../../services/storage.service";
import { MessageResponse } from "../../core/messages";

export async function handleLogin(data: any): Promise<MessageResponse> {
  try {
    const result = await authService.login(data.username, data.password);
    return { success: true, user: result.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function handleRegister(data: any): Promise<MessageResponse> {
  try {
    const result = await authService.register(
      data.username,
      data.email,
      data.password,
      data.name
    );
    return { success: true, user: result.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function handleLogout(): Promise<MessageResponse> {
  await authService.logout();
  return { success: true };
}

export async function handleCheckAuth(): Promise<MessageResponse> {
  try {
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      return { success: false, authenticated: false };
    }
    const user = await authService.checkAuth();
    return { success: true, authenticated: true, user };
  } catch (error: any) {
    return { success: false, authenticated: false, error: error.message };
  }
}

export async function handleGetUser(): Promise<MessageResponse> {
  const user = await storageService.getUser();
  const isAuth = await authService.isAuthenticated();
  return { success: true, user, authenticated: isAuth };
}
