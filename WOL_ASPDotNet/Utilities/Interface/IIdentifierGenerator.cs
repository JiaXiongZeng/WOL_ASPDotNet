namespace WOL_ASPDotNet.Utilities.Interface
{
    public interface IIdentifierGenerator
    {
        /// <summary>
        /// Generate an unique unsigned short id
        /// </summary>
        /// <returns></returns>
        ushort Generate();

        /// <summary>
        /// Release an unique unsigned short id
        /// </summary>
        /// <param name="id"></param>
        void RemoveOldIdentifier(ushort id);

        /// <summary>
        /// Release all unique unsigned short id
        /// </summary>
        void RemoveAll();
    }
}
