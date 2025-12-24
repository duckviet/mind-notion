import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    skipAuthInterceptor?: boolean;
  }
}
