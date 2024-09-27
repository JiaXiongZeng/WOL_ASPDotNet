namespace WOL_ASPDotNet.Models.ViewModels
{
    public class ResponseMessage
    {
        /// <summary>
        /// The responsed message status
        /// </summary>
        public MESSAGE_STATUS Status { get; set; } = MESSAGE_STATUS.NONE;

        /// <summary>
        /// The responsed message
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// The attachment
        /// </summary>
        public object Attachment { get; set; }
    }

    public enum MESSAGE_STATUS
    {
        NONE = 0,
        OK = 200,
        ERROR = 400
    }
}
