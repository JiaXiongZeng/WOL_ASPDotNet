export enum MESSAGE_STATUS {
    NONE = 0,
    OK = 200,
    ERROR = 400
}

export class ResponseMessage<T> {
    Status: MESSAGE_STATUS = MESSAGE_STATUS.NONE
    Message?: string
    Attachment?: T
}