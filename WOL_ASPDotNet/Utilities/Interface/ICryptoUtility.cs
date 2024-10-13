using System.Security.Cryptography;
using WOL_ASPDotNet.Utilities.Implement;

namespace WOL_ASPDotNet.Utilities.Interface
{
    public interface ICryptoUtility
    {
        /// <summary>
        /// Generate asymmertic key pairs
        /// </summary>
        /// <returns></returns>
        (string PrivateKey, string PublicKey) GenAsymmetricKeys();

        /// <summary>
        /// Import public & private keys into utility
        /// </summary>
        /// <param name="privateKeyBase64">The private key in base64 format</param>
        /// <param name="publicKeyBase64">The public key in base64 format</param>
        void ImportKeys(string privateKeyBase64, string publicKeyBase64);

        /// <summary>
        /// Decrypt cypher text to plain text
        /// </summary>
        /// <param name="data">cypher text data</param>
        /// <returns></returns>
        byte[] Decrypt(byte[] data);

        /// <summary>
        /// Decrypt cypher base64 string to plain text
        /// </summary>
        /// <param name="cypherBase64">cypher text base64 string</param>
        /// <returns></returns>
        string Decrypt(string cypherBase64);

        /// <summary>
        /// Encrypt plain text to cypher text
        /// </summary>
        /// <param name="data">plain text data</param>
        /// <returns></returns>
        byte[] Encrypt(byte[] data);

        /// <summary>
        /// Encrypt plain text to cypher base64 string
        /// </summary>
        /// <param name="plainStr">plain text string</param>
        /// <returns></returns>
        string Encrypt(string plainStr);

        /// <summary>
        /// Sign the data and sha it with sha-256 (if not specified)
        /// </summary>
        /// <param name="data">the input data</param>
        /// <param name="hashAlgName">the hash algorithm name</param>
        /// <returns></returns>
        byte[] Sign(byte[] data, HashAlgorithmName? hashAlgName = null);

        /// <summary>
        /// Verify the data is issued by the private key keeper
        /// </summary>
        /// <param name="data">The issued data</param>
        /// <param name="signature">The signed context sha-256 output (if not specified)</param>
        /// <param name="hashAlgName">the hash algorithm name</param>
        /// <returns></returns>
        bool Verify(byte[] data, byte[] signature, HashAlgorithmName? hashAlgName = null);
    }
}
