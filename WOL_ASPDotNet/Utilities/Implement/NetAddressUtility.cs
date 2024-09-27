using System.Text.RegularExpressions;

namespace WOL_ASPDotNet.Utilities.Implement
{
    public static class NetAddressUtility
    {
        public static string FormatMacAddress(string str)
        {
            string result = "";
            char spliter = ':';
            string normalizedStr = Regex.Replace(str, "[^\\w]+", "");

            if (normalizedStr.Length == 12)
            {
                int itrTimes = 12 / 2;

                for (int i = 0; i < itrTimes; i++)
                {
                    result += normalizedStr.Substring(i * 2, 2) + spliter;
                }

                result = result.TrimEnd(spliter);
            }
            else
            {
                throw new ArgumentException("Invalid mac address");
            }

            return result;
        }
    }
}
