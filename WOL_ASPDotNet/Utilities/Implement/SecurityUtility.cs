using System.Security.Cryptography;
using System.Text;

namespace WOL_ASPDotNet.Utilities.Implement
{
    public static class SecurityUtility
    {
        public static string HashMD5(string input)
        {
            using (var md5 = MD5.Create())
            {
                byte[] inputBytes = Encoding.ASCII.GetBytes(input);
                byte[] hashBytes = md5.ComputeHash(inputBytes);
                return Convert.ToHexString(hashBytes);
            }
        }
    }
}
