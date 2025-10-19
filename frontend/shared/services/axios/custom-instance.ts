import { AxiosRequestConfig } from "axios";
import ClientRequest from "./ClientRequest";

// Orval expects this specific function signature
export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const clientInstance = ClientRequest.getInstance();
  const axiosInstance = clientInstance.getAxiosInstance();
  return axiosInstance.request<T>(config).then((response) => response.data);
};

export default customInstance;
