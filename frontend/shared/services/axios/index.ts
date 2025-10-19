import ClientRequest from "./ClientRequest";

const clientInstance = ClientRequest.getInstance();
const client = clientInstance.getAxiosInstance();

export { default as server } from "./server";
export * from "./types";
export { ClientRequest, client, clientInstance };
