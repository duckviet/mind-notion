import { AxiosRequestConfig } from "axios";
import {
  ClientRequest,
  type StreamEvent,
  type StreamRequestConfig,
} from "./ClientRequest";

// Orval expects this specific function signature
export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const clientInstance = ClientRequest.getInstance();
  const axiosInstance = clientInstance.getAxiosInstance();
  return axiosInstance.request<T>(config).then((response) => response.data);
};

export const streamInstance = (config: StreamRequestConfig): Promise<void> => {
  return ClientRequest.getInstance().stream(config);
};

export type { StreamEvent, StreamRequestConfig };

export default customInstance;
