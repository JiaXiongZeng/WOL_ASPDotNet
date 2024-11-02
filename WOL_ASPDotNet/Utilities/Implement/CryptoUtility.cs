using System.Security.Cryptography;
using System.Text;
using WOL_ASPDotNet.Utilities.Interface;

namespace WOL_ASPDotNet.Utilities.Implement
{
    public class CryptoUtility: ICryptoUtility
    {
        private string _privateKey;

        private string _publicKey;


        /// <summary>
        /// Generate asymmertic key pairs
        /// </summary>
        /// <returns></returns>
        public (string PrivateKey, string PublicKey) GenAsymmetricKeys()
        {
            using (var RSA = new RSACryptoServiceProvider())
            {
                this._privateKey = Convert.ToBase64String(RSA.ExportCspBlob(true));
                this._publicKey = Convert.ToBase64String(RSA.ExportCspBlob(false));
            }                
            
            return (this._privateKey, this._publicKey);
        }

        /// <summary>
        /// Import public & private keys into utility
        /// </summary>
        /// <param name="privateKeyBase64">The private key in base64 format</param>
        /// <param name="publicKeyBase64">The public key in base64 format</param>
        public void ImportKeys(string privateKeyBase64, string publicKeyBase64)
        {
            this._privateKey = privateKeyBase64;
            this._publicKey = publicKeyBase64;
        }

        /// <summary>
        /// Decrypt cypher text to plain text
        /// </summary>
        /// <param name="data">cypher text data</param>
        /// <returns></returns>
        public byte[] Decrypt(byte[] data)
        {
            using(var RSA = new RSACryptoServiceProvider())
            {
                RSA.ImportCspBlob(Convert.FromBase64String(this._privateKey));
                var raw = RSA.Decrypt(data, false);
                return raw;
            }            
        }

        /// <summary>
        /// Decrypt cypher base64 string to plain text
        /// </summary>
        /// <param name="cypherBase64">cypher text base64 string</param>
        /// <returns></returns>

        public string Decrypt(string cypherBase64)
        {
            var cypherBytes = Convert.FromBase64String(cypherBase64);
            var plainTextBytes = Decrypt(cypherBytes);
            var plainTextStr = Encoding.UTF8.GetString(plainTextBytes);

            return plainTextStr;
        }

        /// <summary>
        /// Encrypt plain text to cypher text
        /// </summary>
        /// <param name="data">plain text data</param>
        /// <returns></returns>
        public byte[] Encrypt(byte[] data)
        {
            using (var RSA = new RSACryptoServiceProvider())
            {
                RSA.ImportCspBlob(Convert.FromBase64String(this._publicKey));
                var cypher = RSA.Encrypt(data, false);
                return cypher;
            }            
        }

        /// <summary>
        /// Encrypt plain text to cypher base64 string
        /// </summary>
        /// <param name="plainStr">plain text string</param>
        /// <returns></returns>
        public string Encrypt(string plainStr)
        {
            var plainTextBytes = Encoding.UTF8.GetBytes(plainStr);
            var cypherBytes = Encrypt(plainTextBytes);
            var cypherTextBase64 = Convert.ToBase64String(cypherBytes);

            return cypherTextBase64;
        }

        /// <summary>
        /// Sign the data and sha it with sha-256 (if not specified)
        /// </summary>
        /// <param name="data">the input data</param>
        /// <param name="hashAlgName">the hash algorithm name</param>
        /// <returns></returns>
        public byte[] Sign(byte[] data, HashAlgorithmName? hashAlgName = null)
        {
            using (var RSA = new RSACryptoServiceProvider())
            {
                RSA.ImportCspBlob(Convert.FromBase64String(this._privateKey));

                if (hashAlgName == null)
                {
                    hashAlgName = HashAlgorithmName.SHA256;
                }
                var signature = RSA.SignData(data, hashAlgName);
                return signature;
            }
        }

        /// <summary>
        /// Verify the data is issued by the private key keeper
        /// </summary>
        /// <param name="data">The issued data</param>
        /// <param name="signature">The signed context sha-256 output (if not specified)</param>
        /// <param name="hashAlgName">the hash algorithm name</param>
        /// <returns></returns>
        public bool Verify(byte[] data, byte[] signature, HashAlgorithmName? hashAlgName = null)
        {
            using (var RSA = new RSACryptoServiceProvider())
            {
                RSA.ImportCspBlob(Convert.FromBase64String(this._publicKey));

                if (hashAlgName == null)
                {
                    hashAlgName= HashAlgorithmName.SHA256;
                }
                bool isValid = RSA.VerifyData(data, hashAlgName, signature);
                return isValid;
            }  
        }
    }
}
