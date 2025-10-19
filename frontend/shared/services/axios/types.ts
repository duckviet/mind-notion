export type Message = {
  type: MessageType;
  name?: string;
  description?: string;
};

export type MessageType = "401";

export type Res_Error = {
  status: string;
  result: string;
  error: {
    code: string;
    message: string;
  };
};
